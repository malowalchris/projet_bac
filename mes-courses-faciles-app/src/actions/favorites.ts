"use server";

import prisma from "@/lib/prisma";
import { cache } from "react";
import { revalidatePath } from "next/cache";
import { requireAuth, AuthError } from "@/lib/auth-guard";
import { resolveImageUrl } from "@/lib/image-resolver";

export interface FavoriteProductOutput {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  unit: string;
  storeId: string;
}

/**
 * Récupère les favoris en base de données pour l'utilisateur actuellement connecté.
 * ZÉRO-TRUST : L'identifiant (session.id) provient STRICTEMENT du jeton serveur via requireAuth().
 * Aucun paramètre userId ne provient ni n'est accepté depuis le client.
 */
export const fetchFavoritesAction = cache(async () => {
  try {
    const session = await requireAuth();
    const userId = session.id; // Source de vérité serveur incontestable

    const favorites = await prisma.articleFavori.findMany({
      where: {
        utilisateurId: userId, // Filtre Prisma obligatoire Anti-IDOR
      },
      orderBy: {
        creeLe: "desc",
      },
      select: {
        produit: {
          select: {
            id: true,
            nom: true,
            prix: true,
            images: true,
            categorie: true,
            unite: true,
            magasinId: true,
          },
        },
      },
    });

    const formatted: FavoriteProductOutput[] = favorites.map((f) => ({
      id: f.produit.id,
      name: f.produit.nom,
      price: f.produit.prix,
      image: resolveImageUrl(f.produit.images, "product"),
      category: f.produit.categorie,
      unit: f.produit.unite || "unité",
      storeId: f.produit.magasinId,
    }));

    return { success: true, favorites: formatted };
  } catch (e: unknown) {
    if (e instanceof AuthError) {
      return { success: false, error: e.message, favorites: [] };
    }
    return {
      success: false,
      error: (e as Error).message || "Erreur de récupération des favoris",
      favorites: [],
    };
  }
});

/**
 * Bascule un produit en favori (ajout si absent, suppression si présent).
 * ZÉRO-TRUST : L'utilisateur n'envoie que l'ID du produit.
 * L'identifiant utilisateur est imposé par la session serveur (session.id).
 */
export async function toggleFavoriteAction(produitId: string) {
  try {
    const session = await requireAuth();
    const userId = session.id; // Source de vérité serveur

    if (!produitId) {
      return { success: false, error: "ID du produit requis." };
    }

    // Vérifier si le favori existe déjà pour CE couple (utilisateurId, produitId)
    const existing = await prisma.articleFavori.findUnique({
      where: {
        utilisateurId_produitId: {
          utilisateurId: userId,
          produitId: produitId,
        },
      },
    });

    if (existing) {
      // Suppression anti-IDOR avec double clause conditionnelle
      await prisma.articleFavori.delete({
        where: {
          id: existing.id,
          utilisateurId: userId, // Double verrou de sécurité dans le where
        },
      });
    } else {
      // Ajout avec liaison stricte à la session serveur
      await prisma.articleFavori.create({
        data: {
          utilisateurId: userId,
          produitId: produitId,
        },
      });
    }

    revalidatePath("/favorites");

    return { success: true, isFavorited: !existing };
  } catch (e: unknown) {
    if (e instanceof AuthError) {
      return { success: false, error: e.message };
    }
    return {
      success: false,
      error: (e as Error).message || "Erreur lors de la mise à jour du favori",
    };
  }
}
