"use client";

import { useState, useEffect } from 'react';

export interface FavoriteProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  unit: string;
  storeId: string;
}

/**
 * Hook useFavorites — Phase 1 (Nettoyage de l'état local LocalStorage).
 * Toute lecture ou écriture de la clé 'mcf_favorites' dans le localStorage a été supprimée.
 * Préparation pour la transition vers les Server Actions (fetchFavoritesAction, toggleFavoriteAction).
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Le stockage local ne doit plus jamais être lu (Anti-IDOR).
    setIsLoaded(true);
  }, []);

  const toggleFavorite = (product: FavoriteProduct) => {
    setFavorites((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        return prev.filter((item) => item.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const isFavorite = (id: string) => {
    return favorites.some((item) => item.id === id);
  };

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    isLoaded,
  };
}
