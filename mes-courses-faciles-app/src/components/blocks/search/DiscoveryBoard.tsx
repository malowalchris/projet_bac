import React, { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Flame, Store, ArrowRight, TrendingUp } from 'lucide-react';
import { ProductCard } from '@/components/blocks/catalog/ProductCard';
import { ProductSkeleton, StoreSkeleton } from '@/components/common/Skeletons';
import prisma from '@/lib/prisma';

// ─── Skeleton du Discovery Board ────────────────────────────────────────────
export function DiscoverySkeleton() {
  return (
    <div className="space-y-12 animate-pulse">
      {/* Trending skeleton */}
      <div className="space-y-5">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-full" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      </div>
      {/* Stores skeleton */}
      <div className="space-y-5">
        <div className="h-6 w-56 bg-slate-200 dark:bg-slate-800 rounded-full" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <StoreSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Données Trending Products ───────────────────────────────────────────────
async function TrendingProductsSection() {
  let products: {
    id: string;
    name: string;
    price: number;
    category: string;
    unit: string | null;
    images: string | null;
    magasinId: string;
    storeId?: string;
    createdAt: Date;
  }[] = [];

  try {
    const dbProducts = await prisma.produit.findMany({
      where: { estActif: true, estSupprime: false },
      orderBy: { creeLe: 'desc' },
      take: 6,
      select: {
        id: true,
        nom: true,
        prix: true,
        categorie: true,
        unite: true,
        images: true,
        magasinId: true,
        creeLe: true,
      },
    });
    products = dbProducts.map(p => ({
      ...p,
      name: p.nom,
      price: p.prix,
      category: p.categorie,
      unit: p.unite,
      createdAt: p.creeLe,
      storeId: p.magasinId
    }));
  } catch (e) {
    console.error('TrendingProducts: fetch error (silent)', e);
  }

  if (products.length === 0) return null;

  return (
    <section className="space-y-5">
      {/* Section title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-safran/15 flex items-center justify-center">
            <Flame size={18} className="text-brand-safran" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">
              Tendances du moment
            </h2>
            <p className="text-xs text-slate-500 font-medium">Produits les plus récents sur la plateforme</p>
          </div>
        </div>
        <Link
          href="/search?q=riz"
          className="text-xs font-bold text-brand-primary hover:text-brand-primary/80 flex items-center gap-1 group transition-all"
        >
          Voir plus <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {products.map((product, index) => {
          let imgUrl = '/images/product-placeholder.svg';
          try {
            const parsed = JSON.parse(product.images || '[]');
            if (parsed.length > 0) imgUrl = parsed[0];
          } catch {}

          return (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              category={product.category}
              unit={product.unit || 'unité'}
              storeId={product.magasinId || product.storeId || ''}
              image={imgUrl}
              createdAt={product.createdAt}
              priority={index === 0}
            />
          );
        })}
      </div>
    </section>
  );
}

// ─── Données Popular Stores ──────────────────────────────────────────────────
async function PopularStoresSection() {
  let stores: {
    id: string;
    name: string;
    logo: string | null;
    address: string;
    district: string;
    description: string | null;
  }[] = [];

  try {
    const dbStores = await prisma.magasin.findMany({
      where: { estActif: true, estSupprime: false },
      take: 3,
      select: {
        id: true,
        nom: true,
        logo: true,
        adresse: true,
        quartier: true,
        description: true,
      },
    });
    stores = dbStores.map(s => ({
      id: s.id,
      name: s.nom,
      logo: s.logo,
      address: s.adresse,
      district: s.quartier,
      description: s.description,
    }));
  } catch (e) {
    console.error('PopularStores: fetch error (silent)', e);
  }

  if (stores.length === 0) return null;

  return (
    <section className="space-y-5">
      {/* Section title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center">
            <Store size={18} className="text-brand-primary" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">
              Magasins populaires
            </h2>
            <p className="text-xs text-slate-500 font-medium">Nos partenaires les mieux notés à Libreville</p>
          </div>
        </div>
        <Link
          href="/#magasins"
          className="text-xs font-bold text-brand-primary hover:text-brand-primary/80 flex items-center gap-1 group transition-all"
        >
          Tous les magasins <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Store Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stores.map((store, index) => (
          <Link
            key={store.id}
            href={`/store/${store.id}`}
            className="group relative overflow-hidden rounded-2xl border border-white/30 dark:border-white/10 bg-white/50 dark:bg-slate-800/30 backdrop-blur-md shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col"
          >
            {/* Store Image */}
            <div className="relative h-36 overflow-hidden bg-slate-100 dark:bg-slate-800">
              <Image
                src={store.logo || '/images/store-placeholder.svg'}
                alt={store.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500 transform-gpu"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              {/* Rank badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15">
                <TrendingUp size={11} className="text-brand-safran" />
                <span className="text-[10px] font-black text-white">#{index + 1} Populaire</span>
              </div>
            </div>

            {/* Store Info */}
            <div className="p-4 flex flex-col gap-1.5 flex-grow">
              <h3 className="font-black text-slate-800 dark:text-white group-hover:text-brand-primary transition-colors line-clamp-1">
                {store.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium line-clamp-1">
                📍 {store.district}, Libreville
              </p>
              {store.description && (
                <p className="text-xs text-slate-400 font-medium line-clamp-2 mt-0.5">
                  {store.description}
                </p>
              )}
              <div className="mt-auto pt-3 flex items-center text-brand-primary text-xs font-bold gap-1 group-hover:gap-2 transition-all">
                Visiter <ArrowRight size={12} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── Discovery Board (RSC Root) ──────────────────────────────────────────────
/**
 * Composant Server qui compose le "Discovery Board" :
 * - Section "Tendances du moment" avec produits récents
 * - Section "Magasins populaires"
 * Chaque section est enveloppée dans <Suspense> pour un LCP optimal.
 */
export async function DiscoveryBoard() {
  return (
    <div className="space-y-12">
      {/* Tendances */}
      <Suspense
        fallback={
          <div className="space-y-5">
            <div className="h-6 w-48 bg-slate-200/60 dark:bg-slate-800/60 rounded-full animate-pulse" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => <ProductSkeleton key={i} />)}
            </div>
          </div>
        }
      >
        <TrendingProductsSection />
      </Suspense>

      {/* Magasins */}
      <Suspense
        fallback={
          <div className="space-y-5">
            <div className="h-6 w-56 bg-slate-200/60 dark:bg-slate-800/60 rounded-full animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <StoreSkeleton key={i} />)}
            </div>
          </div>
        }
      >
        <PopularStoresSection />
      </Suspense>
    </div>
  );
}
