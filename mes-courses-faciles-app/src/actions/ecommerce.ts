"use server";

import prisma from "@/lib/prisma";
import { cache } from "react";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { orderSchema, productSchema, storeSchema } from "@/lib/validations/schemas";
import { z } from "zod";
import { OrderStatus } from '@prisma/client';
import { resend, FROM_EMAIL, APP_URL } from '@/lib/mail';
import { OrderReceiptEmail } from '@/emails/OrderReceiptEmail';
import { render } from '@react-email/components';
import { requireAuth, requireAdminAuth, getCurrentUser, AuthError } from '@/lib/auth-guard';
import { resolveImageUrl } from '@/lib/image-resolver';
import { sanitizePrismaArray } from '@/lib/serialization';
import { Order as OrderType } from '@/types';


export const getCachedActiveStores = unstable_cache(
  async () => {
    const stores = await prisma.magasin.findMany({
      where: { estActif: true, estSupprime: false },
      orderBy: { creeLe: "desc" }
    });
    // sanitize : convertit les objets Date en strings ISO avant le passage RSC boundary
    return sanitizePrismaArray(stores);
  },
  ["stores-list"],
  {
    tags: ["stores"]
  }
);

export async function createOrderAction(data: any) {
  try {
    // Zero-Trust : userId extrait de la session serveur, jamais du payload client
    const session = await requireAuth();

    const validated = orderSchema.parse(data);
    const order = await prisma.commande.create({
      data: {
        utilisateurId: session.id,           // ← session serveur uniquement
        magasinId: validated.magasinId || validated.storeId!,
        total: validated.total,
        fraisLivraison: validated.deliveryFee || validated.fraisLivraison,
        methodePaiement: validated.paymentMethod || validated.methodePaiement,
        adresseLivraison: validated.deliveryAddress || validated.adresseLivraison,
        lignesCommande: {
          create: (validated.items || validated.lignes || []).map((item: any) => ({
            produitId: item.id || item.produitId,
            quantite: item.quantity || item.quantite,
            prixUnitaire: item.price || item.prixUnitaire,
          })),
        },
      },
    });
    revalidatePath("/profile");
    revalidatePath("/admin");
    return { success: true, id: order.id };
  } catch (e: unknown) {
    if (e instanceof AuthError) return { success: false, error: e.message };
    return { success: false, error: (e as Error).message };
  }
}

export async function createStoreAction(data: any) {
  try {
    const admin = await requireAdminAuth();
    void admin; // session validée

    const validated = storeSchema.parse(data);
    const store = await prisma.magasin.create({
      data: {
        nom: validated.nom || (validated as any).name,
        adresse: validated.adresse || (validated as any).address,
        quartier: validated.quartier || (validated as any).district,
        telephone: validated.telephone || (validated as any).phone,
        description: validated.description,
        logo: validated.logo || null,
        estActif: true,
      },
    });
    revalidatePath("/admin/stores");
    revalidatePath("/stores");
    revalidateTag("stores", "max");
    return { success: true, id: store.id };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateStoreStatusAction(storeId: string, isActive: boolean) {
  try {
    const admin = await requireAdminAuth();
    void admin;

    await prisma.magasin.update({
      where: { id: storeId },
      data: { estActif: isActive, isActive } as any,
    });
    revalidatePath("/admin/stores");
    revalidatePath("/stores");
    revalidateTag("stores", "max");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

interface CartItemInput {
  id: string;
  quantity: number;
  storeId?: string;
}

/**
 * Synchronise le panier guest → DB après authentification.
 * Zero-Trust : le userId est TOUJOURS extrait de la session serveur.
 * Le client ne peut pas passer son propre userId en paramètre.
 * Optimisation : Exécuté au sein d'une transaction unique pour éviter les pertes et latences séquentiels.
 */
export async function syncCartAction(cartItems: CartItemInput[]) {
  try {
    const session = await requireAuth();
    const userId = session.id;           // ← source de vérité serveur

    await prisma.$transaction(async (tx) => {
      // Écraser l'ancien panier lié à CET utilisateur uniquement
      await tx.articlePanier.deleteMany({
        where: { utilisateurId: userId },
      });

      if (cartItems.length > 0) {
        const storeId = cartItems[0].storeId || (cartItems[0] as any).magasinId;
        if (!storeId) {
          throw new Error("Identifiant du magasin introuvable");
        }

        const itemsToCreate = cartItems.map(item => ({
          utilisateurId: userId,           // ← session.id, jamais du client
          magasinId: storeId,
          produitId: item.id || (item as any).produitId,
          quantite: item.quantity || (item as any).quantite,
        }));

        await tx.articlePanier.createMany({ data: itemsToCreate });
      }
    });

    return { success: true };
  } catch (e: unknown) {
    if (e instanceof AuthError) return { success: false, error: e.message };
    return { success: false, error: (e as Error).message };
  }
}

/**
 * Récupère le panier DB de l'utilisateur connecté.
 * Zero-Trust : userId extrait de la session, jamais du client.
 * Déduplication : React.cache() évite d'exécuter plusieurs fois la requête SQL lors d'un même cycle de rendu.
 */
export const fetchUserCartAction = cache(async () => {
  try {
    const session = await requireAuth();
    const userId = session.id;           // ← source de vérité serveur

    const items = await prisma.articlePanier.findMany({
      where: { utilisateurId: userId },  // ← isolé par session.id
      select: {
        produitId: true,
        quantite: true,
        magasinId: true,
        produit: {
          select: {
            nom: true,
            prix: true,
            images: true,
            unite: true,
            categorie: true,
          }
        }
      }
    });

    const formattedCart = items.map(item => ({
      id:       item.produitId,
      produitId: item.produitId,
      name:     item.produit.nom,
      nom:      item.produit.nom,
      price:    item.produit.prix,
      prix:     item.produit.prix,
      // resolveImageUrl gère tous les cas : null, '[]', JSON stringifié, chemin local
      image:    resolveImageUrl(item.produit.images, 'product'),
      quantity: item.quantite,
      quantite: item.quantite,
      unit:     item.produit.unite || '',
      unite:    item.produit.unite || '',
      category: item.produit.categorie,
      categorie: item.produit.categorie,
      storeId:  item.magasinId,
      magasinId: item.magasinId,
    }));

    return { success: true, cart: formattedCart };
  } catch (e: unknown) {
    if (e instanceof AuthError) return { success: false, error: e.message };
    return { success: false, error: (e as Error).message };
  }
});

/**
 * Ajoute ou met à jour la quantité d'un article dans le panier DB.
 * Zero-Trust : L'identifiant utilisateur est extrait EXCLUSIVEMENT de la session vérifiée côté serveur.
 * Aucun ID utilisateur n'est accepté en paramètre depuis le client.
 */
export async function addToCartAction(produitId: string, magasinId: string, quantite: number = 1) {
  try {
    const user = await requireAuth();
    if (!produitId || !magasinId) {
      return { success: false, error: "Produit et magasin requis" };
    }

    await prisma.articlePanier.upsert({
      where: {
        utilisateurId_produitId: {
          utilisateurId: user.id, // ← source de vérité serveur, jamais du client
          produitId
        }
      },
      update: {
        quantite: { increment: quantite },
        magasinId
      },
      create: {
        utilisateurId: user.id, // ← isolation stricte
        produitId,
        magasinId,
        quantite
      }
    });

    revalidatePath('/cart');
    return { success: true };
  } catch (e: unknown) {
    if (e instanceof AuthError) return { success: false, error: e.message };
    return { success: false, error: (e as Error).message };
  }
}

export async function createProductAction(data: any) {
  try {
    await requireAdminAuth();

    const validated = productSchema.parse(data);
    const product = await prisma.produit.create({
      data: {
        nom: validated.name || (validated as any).nom,
        description: validated.description,
        prix: validated.price || (validated as any).prix,
        categorie: validated.category || (validated as any).categorie,
        unite: validated.unit || (validated as any).unite,
        stock: validated.stock,
        images: JSON.stringify(validated.images),
        magasinId: validated.magasinId || validated.storeId!,
      },
    });
    revalidatePath("/admin/products");
    revalidatePath(`/store/${validated.storeId}`);
    return { success: true, id: product.id };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateOrderStatusAction(orderId: string, status: OrderStatus) {
  try {
    await requireAdminAuth();

    await prisma.commande.update({
      where: { id: orderId },
      data: { statut: status },
    });
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    revalidatePath("/profile");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateStoreAction(storeId: string, data: any) {
  try {
    await requireAdminAuth();

    const validated = storeSchema.parse(data);
    const updatedStore = await prisma.magasin.update({
      where: { id: storeId },
      data: {
        nom: validated.nom || (validated as any).name,
        adresse: validated.adresse || (validated as any).address,
        quartier: validated.quartier || (validated as any).district,
        telephone: validated.telephone || (validated as any).phone,
        description: validated.description || null,
        logo: validated.logo || null,
      },
    });

    revalidatePath("/admin/stores");
    revalidatePath("/stores");
    revalidatePath(`/store/${storeId}`);
    revalidateTag("stores", "max");
    return { success: true, id: updatedStore.id };
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return { success: false, error: e.issues[0].message };
    }
    return { success: false, error: e.message };
  }
}

export async function deleteStoreAction(storeId: string) {
  try {
    await requireAdminAuth();

    // Soft delete store and its products atomically inside a transaction
    await prisma.$transaction([
      prisma.magasin.update({
        where: { id: storeId },
        data: { 
          estSupprime: true,
          estActif: false 
        },
      }),
      prisma.produit.updateMany({
        where: { magasinId: storeId },
        data: { 
          estSupprime: true,
          estActif: false 
        },
      })
    ]);

    revalidatePath("/admin/stores");
    revalidatePath("/admin/products");
    revalidatePath("/stores");
    revalidatePath(`/store/${storeId}`);
    revalidateTag("stores", "max");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateProductAction(productId: string, data: any) {
  try {
    await requireAdminAuth();

    const validated = productSchema.parse(data);
    const updatedProduct = await prisma.produit.update({
      where: { id: productId },
      data: {
        nom: validated.name || (validated as any).nom,
        description: validated.description || null,
        prix: validated.price || (validated as any).prix,
        categorie: validated.category || (validated as any).categorie,
        unite: validated.unit || (validated as any).unite,
        stock: validated.stock,
        images: JSON.stringify(validated.images),
        magasinId: validated.magasinId || validated.storeId!,
      },
    });

    revalidatePath("/admin/products");
    revalidatePath(`/store/${validated.storeId}`);
    revalidatePath(`/product/${productId}`);
    return { success: true, id: updatedProduct.id };
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return { success: false, error: e.issues[0].message };
    }
    return { success: false, error: e.message };
  }
}

export async function deleteProductAction(productId: string) {
  try {
    await requireAdminAuth();

    const product = await prisma.produit.update({
      where: { id: productId },
      data: { 
        estSupprime: true,
        estActif: false 
      },
    });

    revalidatePath("/admin/products");
    revalidatePath(`/store/${product.magasinId}`);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function processCheckoutAction(
  deliveryData: { name: string; phone: string; district: string; indications?: string },
  paymentMethod: 'airtel' | 'moov' | 'card' | 'cash',
  cartItems: { id: string; quantity: number }[]
) {
  try {
    // Zero-Trust : userId extrait de la session JWT côté serveur — jamais du client
    const session = await requireAuth();
    const userId = session.id;

    if (cartItems.length === 0) {
      return { success: false, error: "Le panier est vide." };
    }

    // Zero Trust: load products from database to get actual prices and store ID
    const productIds = cartItems.map(item => item.id);
    const dbProducts = await prisma.produit.findMany({
      where: {
        id: { in: productIds },
        estSupprime: false,
        estActif: true,
      },
    });

    if (dbProducts.length === 0) {
      return { success: false, error: "Aucun produit valide trouvé dans le panier." };
    }

    // Map database prices for calculation
    const productMap = new Map(dbProducts.map(p => [p.id, p]));
    
    let itemsTotal = 0;
    const itemsData: { produitId: string; quantite: number; prixUnitaire: number }[] = [];
    const storeId = dbProducts[0].magasinId;

    for (const item of cartItems) {
      const dbProduct = productMap.get(item.id);
      if (!dbProduct) {
        return { success: false, error: `Le produit avec l'ID ${item.id} n'existe pas ou est indisponible.` };
      }
      
      itemsTotal += dbProduct.prix * item.quantity;
      itemsData.push({
        produitId: dbProduct.id,
        quantite: item.quantity,
        prixUnitaire: dbProduct.prix, // Use DB price (Zero Trust)
      });
    }

    const deliveryFee = 2000;
    const finalTotal = itemsTotal + deliveryFee;
    const deliveryAddress = `${deliveryData.name} - ${deliveryData.phone} - ${deliveryData.district}${
      deliveryData.indications ? ` (${deliveryData.indications})` : ""
    }`;

    // Mock payment gateway latency (Garde-fou 3)
    if (paymentMethod !== 'cash') {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Create the order in DB, bound to the authenticated user ID (Anti-BOLA)
    const order = await prisma.commande.create({
      data: {
        utilisateurId: userId,          // ← session.id (Zero-Trust, jamais du client)
        magasinId: storeId,
        total: finalTotal,
        fraisLivraison: deliveryFee,
        methodePaiement: paymentMethod,
        adresseLivraison: deliveryAddress,
        statut: "PENDING",
        lignesCommande: {
          create: itemsData,
        },
      },
    });

    revalidatePath("/profile");
    revalidatePath("/admin");

    const orderCode = `MCF-${order.id.slice(-6).toUpperCase()}`;

    // ── Envoi du reçu email (fire-and-forget, non-bloquant) ─────────────────
    // On ne met pas await pour ne pas bloquer le retour vers le client.
    // Si Resend échoue, le client voit quand même sa page de succès.
    const sendReceiptEmail = async () => {
      try {
        // Récupère l'email du client et les détails du magasin en parallèle
        const [dbUser, store] = await Promise.all([
          prisma.utilisateur.findUnique({
            where: { id: userId },   // ← session.id
            select: { email: true, nom: true },
          }),
          prisma.magasin.findUnique({
            where: { id: storeId },
            select: { nom: true },
          })
        ]);

        if (!dbUser?.email) return;

        // Récupère les noms des produits pour le template
        const orderItemsWithNames = itemsData.map((item) => {
          const product = productMap.get(item.produitId);
          return {
            name:      product?.nom ?? 'Article',
            quantity:  item.quantite,
            unitPrice: item.prixUnitaire,
          };
        });

        const emailHtml = await render(
          OrderReceiptEmail({
            customerName:    dbUser.nom ?? 'Client',
            customerEmail:   dbUser.email,
            orderCode,
            storeName:       store?.nom ?? 'Magasin Partenaire',
            items:           orderItemsWithNames,
            subtotal:        itemsTotal,
            deliveryFee,
            total:           finalTotal,
            deliveryAddress,
            paymentMethod,
            appUrl:          APP_URL,
          })
        );

        await resend.emails.send({
          from:    FROM_EMAIL,
          to:      dbUser.email,
          subject: `✅ Commande ${orderCode} confirmée — Mes Courses Faciles`,
          html:    emailHtml,
        });

        console.log(`[mail] Reçu envoyé à ${dbUser.email} pour ${orderCode}`);
      } catch (emailError) {
        // L'échec de l'email ne doit JAMAIS bloquer la commande
        console.error('[mail] Erreur envoi reçu (silencieuse):', emailError);
      }
    };

    // Déclenche sans await — la commande est déjà créée en DB
    sendReceiptEmail();

    if (paymentMethod === 'cash') {
      return { success: true, orderId: order.id, orderCode };
    } else {
      // Simulation: Return redirection URL to success page
      const redirectUrl = `/checkout/success?orderId=${orderCode}`;
      return {
        success: true,
        orderId: order.id,
        orderCode,
        redirectUrl
      };
    }
  } catch (e: any) {
    console.error("processCheckoutAction error", e);
    return { success: false, error: e.message || "Une erreur est survenue lors de la validation." };
  }
}

export async function fetchUserOrdersAction(page: number = 1, limit: number = 10) {
  try {
    const session = await requireAuth();
    const userId = session.id;

    const [orders, totalCount] = await prisma.$transaction([
      prisma.commande.findMany({
        where: { utilisateurId: userId },
        select: {
          id: true,
          utilisateurId: true,
          magasinId: true,
          total: true,
          fraisLivraison: true,
          statut: true,
          methodePaiement: true,
          adresseLivraison: true,
          creeLe: true,
          magasin: {
            select: {
              id: true,
              nom: true,
              adresse: true,
              quartier: true,
              telephone: true,
              logo: true,
              description: true,
              estActif: true,
            }
          },
          lignesCommande: {
            select: {
              id: true,
              commandeId: true,
              produitId: true,
              quantite: true,
              prixUnitaire: true,
              produit: {
                select: {
                  id: true,
                  nom: true,
                  description: true,
                  prix: true,
                  categorie: true,
                  stock: true,
                  unite: true,
                  images: true,
                  estActif: true,
                  magasinId: true,
                }
              }
            }
          }
        },
        orderBy: { creeLe: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.commande.count({
        where: { utilisateurId: userId }
      })
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    
    const formattedOrders: OrderType[] = orders.map(order => ({
      id: order.id,
      userId: order.utilisateurId,
      magasinId: order.magasinId,
      storeId: order.magasinId,
      total: order.total,
      deliveryFee: order.fraisLivraison,
      status: order.statut as OrderType['status'],
      paymentMethod: order.methodePaiement,
      deliveryAddress: order.adresseLivraison,
      createdAt: order.creeLe,
      magasin: order.magasin ? {
        id: order.magasin.id,
        nom: order.magasin.nom,
        adresse: order.magasin.adresse,
        quartier: order.magasin.quartier,
        telephone: order.magasin.telephone,
        logo: order.magasin.logo,
        description: order.magasin.description,
        estActif: order.magasin.estActif,
      } : undefined,
      store: order.magasin ? {
        id: order.magasin.id,
        name: order.magasin.nom,
        address: order.magasin.adresse,
        district: order.magasin.quartier,
        phone: order.magasin.telephone,
        logo: order.magasin.logo,
        description: order.magasin.description,
        isActive: order.magasin.estActif,
        nom: order.magasin.nom,
        adresse: order.magasin.adresse,
        quartier: order.magasin.quartier,
        telephone: order.magasin.telephone,
        estActif: order.magasin.estActif,
      } as any : undefined,
      orderItems: order.lignesCommande.map(item => ({
        id: item.id,
        orderId: item.commandeId,
        productId: item.produitId,
        quantity: item.quantite,
        price: item.prixUnitaire,
        product: item.produit ? {
          id: item.produit.id,
          name: item.produit.nom,
          nom: item.produit.nom,
          description: item.produit.description,
          price: item.produit.prix,
          prix: item.produit.prix,
          category: item.produit.categorie,
          categorie: item.produit.categorie,
          stock: item.produit.stock,
          unit: item.produit.unite || '',
          unite: item.produit.unite || '',
          images: item.produit.images,
          isActive: item.produit.estActif,
          estActif: item.produit.estActif,
          magasinId: item.produit.magasinId,
          storeId: item.produit.magasinId,
        } as any : undefined
      }))
    }));

    return {
      success: true,
      orders: formattedOrders,
      totalPages,
      currentPage: page
    };
  } catch (e: unknown) {
    if (e instanceof AuthError) return { success: false, error: e.message };
    return { success: false, error: (e as Error).message };
  }
}

/**
 * Récupère le détail d'une commande par son identifiant unique.
 * Anti-IDOR Vecteur n°1 : Double vérification obligatoire `where: { id: orderId, utilisateurId: session.id }`.
 * Si la commande existe mais appartient à un autre utilisateur, la requête retourne `null` et une erreur générique 404/403 est renvoyée pour ne pas divulguer l'existence de la ressource.
 */
export async function fetchOrderDetailsAction(orderId: string) {
  try {
    const session = await requireAuth();
    if (!orderId) {
      return { success: false, error: "Identifiant de commande requis." };
    }

    const order = await prisma.commande.findUnique({
      where: {
        id: orderId,
        utilisateurId: session.id // ← Double vérification stricte anti-IDOR
      },
      select: {
        id: true,
        utilisateurId: true,
        magasinId: true,
        total: true,
        fraisLivraison: true,
        statut: true,
        methodePaiement: true,
        adresseLivraison: true,
        creeLe: true,
        magasin: {
          select: {
            id: true,
            nom: true,
            adresse: true,
            quartier: true,
            telephone: true,
            logo: true,
            description: true,
            estActif: true,
          }
        },
        lignesCommande: {
          select: {
            id: true,
            commandeId: true,
            produitId: true,
            quantite: true,
            prixUnitaire: true,
            produit: {
              select: {
                id: true,
                nom: true,
                description: true,
                prix: true,
                categorie: true,
                stock: true,
                unite: true,
                images: true,
                estActif: true,
                magasinId: true,
              }
            }
          }
        }
      }
    });

    if (!order) {
      // Retour générique type 404/403 pour masquer l'existence potentielle d'une commande tierce
      return { success: false, error: "Commande introuvable ou accès non autorisé (404/403)." };
    }

    const formattedOrder: OrderType = {
      id: order.id,
      userId: order.utilisateurId,
      magasinId: order.magasinId,
      storeId: order.magasinId,
      total: order.total,
      deliveryFee: order.fraisLivraison,
      status: order.statut as OrderType['status'],
      paymentMethod: order.methodePaiement,
      deliveryAddress: order.adresseLivraison,
      createdAt: order.creeLe,
      magasin: order.magasin ? {
        id: order.magasin.id,
        nom: order.magasin.nom,
        adresse: order.magasin.adresse,
        quartier: order.magasin.quartier,
        telephone: order.magasin.telephone,
        logo: order.magasin.logo,
        description: order.magasin.description,
        estActif: order.magasin.estActif,
      } : undefined,
      store: order.magasin ? {
        id: order.magasin.id,
        name: order.magasin.nom,
        address: order.magasin.adresse,
        district: order.magasin.quartier,
        phone: order.magasin.telephone,
        logo: order.magasin.logo,
        description: order.magasin.description,
        isActive: order.magasin.estActif,
        nom: order.magasin.nom,
        adresse: order.magasin.adresse,
        quartier: order.magasin.quartier,
        telephone: order.magasin.telephone,
        estActif: order.magasin.estActif,
      } as any : undefined,
      orderItems: order.lignesCommande.map(item => ({
        id: item.id,
        orderId: item.commandeId,
        productId: item.produitId,
        quantity: item.quantite,
        price: item.prixUnitaire,
        product: item.produit ? {
          id: item.produit.id,
          name: item.produit.nom,
          nom: item.produit.nom,
          description: item.produit.description,
          price: item.produit.prix,
          prix: item.produit.prix,
          category: item.produit.categorie,
          categorie: item.produit.categorie,
          stock: item.produit.stock,
          unit: item.produit.unite || '',
          unite: item.produit.unite || '',
          images: item.produit.images,
          isActive: item.produit.estActif,
          estActif: item.produit.estActif,
          magasinId: item.produit.magasinId,
          storeId: item.produit.magasinId,
        } as any : undefined
      }))
    };

    return { success: true, order: formattedOrder };
  } catch (e: unknown) {
    if (e instanceof AuthError) return { success: false, error: e.message };
    return { success: false, error: (e as Error).message };
  }
}



