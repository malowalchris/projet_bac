import React from 'react';
import { redirect } from 'next/navigation';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/blocks/catalog/ProductCard';
import { PageLayout } from '@/components/common/PageLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { getCurrentUser } from '@/lib/auth-guard';
import { fetchFavoritesAction } from '@/actions/favorites';

export const metadata = {
  title: 'Mes Favoris | Mes Courses Faciles',
  description: 'Retrouvez et commandez rapidement tous vos produits enregistrés en favoris.',
};

/**
 * Page Rendu Serveur (RSC) des Favoris — Phase 3.
 * Vérifie la session Zero-Trust du serveur, redirige si non authentifié,
 * et affiche la grille de favoris ou l'état vide.
 */
export default async function FavoritesPage() {
  // 1. Protection de la Route Zéro-Trust : Vérification serveur non-contournable
  const session = await getCurrentUser();
  if (!session) {
    redirect('/?auth=login&callbackUrl=/favorites');
  }

  // 2. Rendu des Données : Lecture sécurisée isolée pour cet utilisateur
  const res = await fetchFavoritesAction();
  const favorites = res.success && res.favorites ? res.favorites : [];

  return (
    <PageLayout withPadding>
      <div className="container mx-auto px-4 space-y-8">
        {/* En-tête standardisé */}
        <PageHeader
          title="Mes Favoris"
          subtitle={`${favorites.length} produit${favorites.length > 1 ? 's' : ''} enregistré${favorites.length > 1 ? 's' : ''}`}
          backHref="/"
          backLabel="Accueil"
        />

        {/* 3. Affichage : Empty State ou Grille de ProductCards */}
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-6 text-center bg-white/40 dark:bg-slate-800/10 backdrop-blur-md border border-white/30 dark:border-white/10 rounded-[2.5rem] p-8 shadow-sm animate-in fade-in duration-300">
            <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center animate-pulse">
              <Heart size={48} className="fill-red-500 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Vous n'avez pas encore de favoris</h2>
              <p className="text-slate-500 max-w-sm font-medium">Ajoutez vos articles préférés en cliquant sur l'icône cœur pour les retrouver en un instant ici.</p>
            </div>
            <Link href="/">
              <Button className="px-8 h-14 font-bold rounded-2xl shadow-xl shadow-brand-primary/25 cursor-pointer">
                Explorer les magasins
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-in fade-in duration-300">
            {favorites.map((p, index) => (
              <ProductCard key={p.id} {...p} priority={index === 0} />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
