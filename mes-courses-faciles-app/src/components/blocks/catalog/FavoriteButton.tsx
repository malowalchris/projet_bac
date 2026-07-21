"use client";

import React, { useTransition, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { toggleFavoriteAction } from "@/actions/favorites";
import { useFavorites, FavoriteProduct } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

export interface FavoriteButtonProps {
  product: FavoriteProduct;
  size?: number;
  className?: string;
}

/**
 * Composant autonome et sécurisé du bouton Cœur (FavoriteButton) - Phase 2.
 * Intègre la vérification de session Zéro-Trust, les règles métier d'authentification
 * et une mise à jour optimiste instantanée (Optimistic UI avec useTransition).
 */
export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  product,
  size = 18,
  className,
}) => {
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isPending, startTransition] = useTransition();

  // État local optimiste basé sur le hook useFavorites en mémoire
  const initialFav = isFavorite(product.id);
  const [optimisticFav, setOptimisticFav] = useState<boolean | null>(null);

  const isFav = optimisticFav !== null ? optimisticFav : initialFav;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Règle métier "Non Authentifié" : Redirection silencieuse vers la page de connexion
    if (!user) {
      router.push(`?auth=login&callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    // 2. Règle métier "Authentifié" & Comportement Optimiste (Optimistic Update)
    const nextState = !isFav;
    setOptimisticFav(nextState);

    // Mise à jour synchrone en mémoire dans le hook client transitoire pour cohérence UI
    toggleFavorite(product);

    // Exécution de la Server Action Zéro-Trust en arrière-plan avec useTransition
    startTransition(async () => {
      const res = await toggleFavoriteAction(product.id);

      if (!res.success) {
        // Rollback en cas d'échec serveur ou d'erreur réseau
        setOptimisticFav(!nextState);
        toggleFavorite(product); // Revert dans le store en mémoire
        toast.error(res.error || "Erreur lors de la modification du favori");
      } else if (typeof res.isFavorited === "boolean") {
        // Synchronisation exacte avec la réponse finale du serveur
        setOptimisticFav(res.isFavorited);
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "h-10 w-10 bg-background/80 backdrop-blur-md rounded-full shadow-sm flex items-center justify-center text-foreground hover:bg-accent hover:text-accent-foreground transition-all active:scale-90 z-10",
        isPending && "opacity-80 cursor-wait",
        className
      )}
      aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      {isPending ? (
        <Loader2 size={size} className="animate-spin text-brand-safran" />
      ) : (
        <Heart
          size={size}
          className={cn(
            "transition-all duration-300",
            isFav
              ? "fill-red-500 text-red-500 scale-110"
              : "text-slate-500 hover:text-red-500"
          )}
        />
      )}
    </button>
  );
};
