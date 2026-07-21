import React from 'react';
import { ProductGallery } from '@/components/blocks/catalog/ProductGallery';
import { ProductActions } from '@/components/blocks/catalog/ProductActions';
import { ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { PageLayout } from '@/components/common/PageLayout';
import { PageHeader } from '@/components/common/PageHeader';
import prisma from '@/lib/prisma';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductCard } from '@/components/blocks/catalog/ProductCard';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.produit.findUnique({
    where: { id },
    select: { 
      nom: true, 
      description: true,
      estActif: true,
      estSupprime: true,
      magasin: {
        select: {
          estActif: true,
          estSupprime: true,
          nom: true
        }
      }
    }
  });
  const isAvailable = product && product.estActif && !product.estSupprime && product.magasin && product.magasin.estActif && !product.magasin.estSupprime;
  return {
    title: isAvailable ? `${product.nom} | Mes Courses Faciles` : 'Produit | Mes Courses Faciles',
    description: product?.description || 'Achetez vos produits en ligne à Libreville.',
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const product = await prisma.produit.findUnique({
    where: { id },
    include: {
      magasin: true
    }
  });

  if (!product || !product.estActif || product.estSupprime || !product.magasin || !product.magasin.estActif || product.magasin.estSupprime) {
    notFound();
  }

  // Get up to 4 other active products from the same store
  const recommendedProducts = await prisma.produit.findMany({
    where: {
      magasinId: product.magasinId,
      id: { not: product.id },
      estActif: true,
      estSupprime: false,
    },
    take: 4,
  });

  const formattedRecommended = recommendedProducts.map((p: any) => {
    let img = '';
    try {
      const parsed = JSON.parse(p.images || '[]');
      img = parsed[0] || '';
    } catch (e) {
      img = p.images || '';
    }
    return {
      id: p.id,
      name: p.nom,
      price: p.prix,
      image: img,
      category: p.categorie,
      unit: p.unite || 'unité',
      storeId: p.magasinId,
    };
  });

  return (
    <PageLayout withPadding={false}>
      <div className="container mx-auto px-4 py-8">
        {/* En-tête standardisé */}
        <div className="mb-8">
          <PageHeader
            backHref={`/store/${product.magasinId}`}
            backLabel={`Retour à ${product.magasin?.nom || 'la boutique'}`}
          />
        </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Product Gallery */}
            <ProductGallery imagesString={product.images} name={product.nom} />

            {/* Product Info */}
            <div className="flex flex-col space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="bg-brand-accent text-brand-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {product.categorie}
                  </span>
                  <span className="text-slate-400 text-sm font-medium">•</span>
                  <span className="text-slate-500 text-sm font-bold uppercase">{product.magasin?.nom}</span>
                </div>
                <h1 className="text-3xl lg:text-5xl font-extrabold text-slate-800 dark:text-white leading-tight">
                  {product.nom}
                </h1>
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-black text-brand-primary">
                    {product.prix.toLocaleString('fr-FR')} <span className="text-lg">CFA</span>
                  </span>
                </div>
              </div>

              {product.description && (
                <p className="text-slate-650 dark:text-slate-300 text-lg leading-relaxed">
                  {product.description}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                  <div className="w-1.5 h-1.5 bg-brand-primary rounded-full" />
                  Unité : {product.unite || 'unité'}
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                  <div className="w-1.5 h-1.5 bg-brand-primary rounded-full" />
                  Stock : {product.stock} disponibles
                </div>
              </div>

              <div className="h-px bg-slate-100 dark:bg-white/5" />

              {/* Actions */}
              <div className="space-y-6">
                <ProductActions
                  id={product.id}
                  name={product.nom}
                  price={product.prix}
                  category={product.categorie}
                  unit={product.unite}
                  images={product.images}
                  storeId={product.magasinId}
                />

                <div className="grid grid-cols-3 gap-4 pt-4">
                   {[
                     { icon: Truck, label: 'Livraison 60min' },
                     { icon: ShieldCheck, label: 'Produit Vérifié' },
                     { icon: RotateCcw, label: 'Retour Facile' }
                   ].map((item, i) => (
                     <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 text-center">
                       <item.icon size={20} className="text-brand-primary" />
                       <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{item.label}</span>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Products */}
          {formattedRecommended.length > 0 && (
            <div className="mt-20 pt-12 border-t border-slate-100 dark:border-white/5 space-y-8">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">Produits recommandés</h2>
                <p className="text-slate-500 font-semibold text-sm">Découvrez d&apos;autres articles disponibles dans la boutique {product.magasin?.nom}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {formattedRecommended.map((p: any) => (
                  <ProductCard key={p.id} {...p} />
                ))}
              </div>
            </div>
          )}
        </div>
    </PageLayout>
  );
}
