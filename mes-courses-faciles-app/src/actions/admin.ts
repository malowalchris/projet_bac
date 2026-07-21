"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { requireAdminAuth, AuthError } from "@/lib/auth-guard";

const PREFERENCES_FILE_PATH = path.join(process.cwd(), "src/data/preferences.json");

// ─── Zod Schemas ───────────────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Format d'email invalide"),
  phone: z.string().regex(/^\+?[0-9\s-]{8,20}$/, "Format de téléphone invalide").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z.string().min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères")
    .regex(/[A-Z]/, "Doit contenir une majuscule")
    .regex(/[0-9]/, "Doit contenir un chiffre"),
  confirmPassword: z.string().min(1, "Veuillez confirmer le mot de passe"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Les nouveaux mots de passe ne correspondent pas",
  path: ["confirmPassword"]
});

const platformPreferencesSchema = z.object({
  platformName: z.string().min(2, "Le nom de la plateforme est requis"),
  defaultDeliveryFee: z.coerce.number().nonnegative("Les frais de livraison ne peuvent pas être négatifs"),
  maintenanceMode: z.boolean(),
  enableEmailNotifications: z.boolean(),
  supportContact: z.string().min(5, "Contact de support invalide"),
});

const createUserSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Format d'email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  role: z.enum(["CLIENT", "ADMIN"]),  // Doit correspondre à l'enum Role Prisma
});

// ─── Admin Profile ─────────────────────────────────────────────────────────────

/**
 * Récupère le profil de l'admin connecté.
 * Zero-Trust : userId extrait de la session — jamais du client.
 */
export async function getAdminProfileAction() {
  try {
    const session = await requireAdminAuth();

    const admin = await prisma.utilisateur.findUnique({
      where: { id: session.id },          // ← session serveur
      select: {
        id: true,
        nom: true,
        email: true,
        telephone: true,
        adresse: true,
        role: true,
        creeLe: true,
      },
    });

    if (!admin) return { success: false, error: "Administrateur non trouvé" };
    return {
      success: true,
      admin: {
        ...admin,
        name: admin.nom,
        phone: admin.telephone,
        address: admin.adresse,
        createdAt: admin.creeLe,
      }
    };
  } catch (e: unknown) {
    if (e instanceof AuthError) return { success: false, error: e.message };
    return { success: false, error: (e as Error).message };
  }
}

/**
 * Met à jour le profil de l'admin connecté.
 * Zero-Trust : `where: { id: session.id }` — impossible de modifier un autre compte.
 */
export async function updateAdminProfileAction(data: z.infer<typeof updateProfileSchema>) {
  try {
    const session = await requireAdminAuth();

    const validated = updateProfileSchema.parse(data);

    // Vérifier si l'email est déjà pris par un AUTRE utilisateur
    const existing = await prisma.utilisateur.findFirst({
      where: {
        email: validated.email,
        NOT: { id: session.id },           // ← session.id, jamais du client
      },
    });

    if (existing) {
      return { success: false, error: "Cet email est déjà associé à un autre compte" };
    }

    const updatedUser = await prisma.utilisateur.update({
      where: { id: session.id },          // ← Zero-Trust : verrouillé sur session
      data: {
        nom:       validated.name,
        email:     validated.email,
        telephone: validated.phone || null,
        adresse:   validated.address || null,
      },
      select: { id: true, nom: true, email: true, telephone: true, adresse: true, role: true },
    });

    revalidatePath("/admin/settings");
    return {
      success: true,
      user: {
        ...updatedUser,
        name: updatedUser.nom,
        phone: updatedUser.telephone,
        address: updatedUser.adresse,
      }
    };
  } catch (e: unknown) {
    if (e instanceof AuthError) return { success: false, error: e.message };
    if (e instanceof z.ZodError) return { success: false, error: e.issues[0].message };
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return { success: false, error: "Votre session est invalide ou le compte n'existe plus. Veuillez vous déconnecter." };
    }
    return { success: false, error: "Une erreur est survenue lors de la mise à jour du profil" };
  }
}

/**
 * Met à jour le mot de passe de l'admin connecté.
 * Zero-Trust : `where: { id: session.id }` — impossible de changer le mdp d'un autre.
 */
export async function updateAdminPasswordAction(data: z.infer<typeof updatePasswordSchema>) {
  try {
    const session = await requireAdminAuth();

    const validated = updatePasswordSchema.parse(data);

    // Récupère le hash actuel depuis la session sécurisée uniquement
    const user = await prisma.utilisateur.findUnique({
      where: { id: session.id },          // ← Zero-Trust
    });

    if (!user) return { success: false, error: "Utilisateur introuvable" };

    const match = await bcrypt.compare(validated.currentPassword, user.motDePasse);
    if (!match) return { success: false, error: "Mot de passe actuel incorrect" };

    const hashedPassword = await bcrypt.hash(validated.newPassword, 10);

    await prisma.utilisateur.update({
      where: { id: session.id },          // ← Zero-Trust
      data: { motDePasse: hashedPassword },
    });

    return { success: true };
  } catch (e: unknown) {
    if (e instanceof AuthError) return { success: false, error: e.message };
    if (e instanceof z.ZodError) return { success: false, error: e.issues[0].message };
    return { success: false, error: (e as Error).message };
  }
}

// ─── Platform Preferences ─────────────────────────────────────────────────────

const readPreferencesFileCached = unstable_cache(
  async () => {
    const defaultPrefs = {
      platformName: "MesCoursesFaciles",
      defaultDeliveryFee: 1000,
      maintenanceMode: false,
      enableEmailNotifications: true,
      supportContact: "+241 07 00 00 00",
    };

    if (!fs.existsSync(PREFERENCES_FILE_PATH)) {
      const dir = path.dirname(PREFERENCES_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(PREFERENCES_FILE_PATH, JSON.stringify(defaultPrefs, null, 2));
      return defaultPrefs;
    }

    const content = fs.readFileSync(PREFERENCES_FILE_PATH, "utf-8");
    return { ...defaultPrefs, ...JSON.parse(content) };
  },
  ["platform-preferences"],
  { tags: ["preferences"] }
);

export async function getPlatformPreferencesAction() {
  try {
    await requireAdminAuth();
    const prefs = await readPreferencesFileCached();
    return { success: true, preferences: prefs };
  } catch (e: unknown) {
    if (e instanceof AuthError) return { success: false, error: e.message };
    return { success: false, error: (e as Error).message };
  }
}

export async function updatePlatformPreferencesAction(data: z.infer<typeof platformPreferencesSchema>) {
  try {
    await requireAdminAuth();

    const validated = platformPreferencesSchema.parse(data);

    const dir = path.dirname(PREFERENCES_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(PREFERENCES_FILE_PATH, JSON.stringify(validated, null, 2));

    revalidateTag("preferences", "max");
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (e: unknown) {
    if (e instanceof AuthError) return { success: false, error: e.message };
    if (e instanceof z.ZodError) return { success: false, error: e.issues[0].message };
    return { success: false, error: (e as Error).message };
  }
}

// ─── User Management (Admin only) ─────────────────────────────────────────────

export async function getAdminDashboardStatsAction() {
  try {
    await requireAdminAuth();

    const [totalOrders, totalUsers, activeStores] = await Promise.all([
      prisma.commande.count(),
      prisma.utilisateur.count({ where: { role: "CLIENT" } }),  // Enum Prisma = CLIENT
      prisma.magasin.count({ where: { estActif: true, estSupprime: false } }),
    ]);

    return { success: true, stats: { totalOrders, totalUsers, activeStores } };
  } catch (e: unknown) {
    if (e instanceof AuthError) return { success: false, error: e.message };
    return { success: false, error: (e as Error).message };
  }
}

export async function createUserAction(data: z.infer<typeof createUserSchema>) {
  try {
    await requireAdminAuth();

    const validated = createUserSchema.parse(data);

    const existing = await prisma.utilisateur.findUnique({
      where: { email: validated.email },
    });

    if (existing) {
      return { success: false, error: "Cet email est déjà associé à un autre compte" };
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const newUser = await prisma.utilisateur.create({
      data: {
        nom:        validated.name,
        email:      validated.email,
        motDePasse: hashedPassword,
        role:       validated.role,
        estActif:   true,
      },
    });

    revalidatePath("/admin/users");
    return { success: true, user: { id: newUser.id, name: newUser.nom, email: newUser.email } };
  } catch (e: unknown) {
    if (e instanceof AuthError) return { success: false, error: e.message };
    if (e instanceof z.ZodError) return { success: false, error: e.issues[0].message };
    return { success: false, error: (e as Error).message };
  }
}

/**
 * Active ou suspend un compte utilisateur.
 * Garde-fou : Un admin ne peut pas suspendre son propre compte.
 * IDOR-safe : la cible est `userId` (ID d'un autre user), validée côté serveur.
 *             L'admin qui agit est identifié par `session.id`, jamais par le client.
 */
export async function updateUserStatusAction(userId: string, isActive: boolean) {
  try {
    const session = await requireAdminAuth();

    // Garde-fou anti-suicide : l'admin ne peut pas se suspendre lui-même
    if (userId === session.id) {
      return { success: false, error: "Vous ne pouvez pas suspendre votre propre compte" };
    }

    await prisma.utilisateur.update({
      where: { id: userId },
      data: { estActif: isActive },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (e: unknown) {
    if (e instanceof AuthError) return { success: false, error: e.message };
    return { success: false, error: (e as Error).message };
  }
}

// ─── Notifications ─────────────────────────────────────────────────────────────

export async function markNotificationAsReadAction(id: string) {
  try {
    await requireAdminAuth();

    await prisma.notification.update({
      where: { id },
      data: { estLu: true },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/notifications");
    return { success: true };
  } catch (e: unknown) {
    if (e instanceof AuthError) return { success: false, error: e.message };
    return { success: false, error: (e as Error).message };
  }
}

export async function markAllNotificationsAsReadAction() {
  try {
    await requireAdminAuth();

    await prisma.notification.updateMany({
      where: { estLu: false },
      data: { estLu: true },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/notifications");
    return { success: true };
  } catch (e: unknown) {
    if (e instanceof AuthError) return { success: false, error: e.message };
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteNotificationAction(id: string) {
  try {
    await requireAdminAuth();

    await prisma.notification.delete({
      where: { id },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/notifications");
    return { success: true };
  } catch (e: unknown) {
    if (e instanceof AuthError) return { success: false, error: e.message };
    return { success: false, error: (e as Error).message };
  }
}

export async function fetchAdminOrdersAction(page: number = 1, limit: number = 10) {
  try {
    await requireAdminAuth();

    const [dbOrders, totalCount] = await prisma.$transaction([
      prisma.commande.findMany({
        include: {
          utilisateur: {
            select: {
              id: true,
              nom: true,
              email: true,
              telephone: true,
              adresse: true,
            }
          },
          magasin: {
            select: {
              id: true,
              nom: true,
            }
          },
          lignesCommande: {
            include: {
              produit: true
            }
          }
        },
        orderBy: {
          creeLe: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.commande.count()
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    const formattedOrders = dbOrders.map(order => ({
      id: order.id,
      userId: order.utilisateurId,
      utilisateurId: order.utilisateurId,
      magasinId: order.magasinId,
      storeId: order.magasinId,
      total: order.total,
      deliveryFee: order.fraisLivraison,
      fraisLivraison: order.fraisLivraison,
      status: order.statut,
      statut: order.statut,
      paymentMethod: order.methodePaiement,
      methodePaiement: order.methodePaiement,
      deliveryAddress: order.adresseLivraison,
      adresseLivraison: order.adresseLivraison,
      createdAt: order.creeLe.toISOString(),
      updatedAt: order.misAJourLe.toISOString(),
      user: order.utilisateur ? {
        id: order.utilisateur.id,
        name: order.utilisateur.nom,
        nom: order.utilisateur.nom,
        email: order.utilisateur.email,
        phone: order.utilisateur.telephone,
        telephone: order.utilisateur.telephone,
        address: order.utilisateur.adresse,
        adresse: order.utilisateur.adresse,
      } : null,
      magasin: order.magasin ? {
        id: order.magasin.id,
        nom: order.magasin.nom,
      } : null,
      store: order.magasin ? {
        id: order.magasin.id,
        name: order.magasin.nom,
        nom: order.magasin.nom,
      } as any : null,
      orderItems: order.lignesCommande ? order.lignesCommande.map(item => ({
        id: item.id,
        orderId: item.commandeId,
        commandeId: item.commandeId,
        productId: item.produitId,
        produitId: item.produitId,
        quantity: item.quantite,
        quantite: item.quantite,
        price: item.prixUnitaire,
        prixUnitaire: item.prixUnitaire,
        product: item.produit ? {
          id: item.produit.id,
          name: item.produit.nom,
          nom: item.produit.nom,
          images: item.produit.images,
        } : null
      })) : []
    }));

    return {
      success: true,
      orders: formattedOrders,
      totalPages,
      totalCount,
      currentPage: page
    };
  } catch (e: unknown) {
    if (e instanceof AuthError) return { success: false, error: e.message };
    return { success: false, error: (e as Error).message };
  }
}
