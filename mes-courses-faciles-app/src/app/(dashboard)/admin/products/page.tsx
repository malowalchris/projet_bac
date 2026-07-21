import React, { Suspense } from 'react';
import prisma from "@/lib/prisma";
import AdminProductsClient from "@/components/blocks/admin/AdminProductsClient";
import { Product as ProductType } from '@/types';
import { Package as PackageIcon, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Loading from './loading';

// Force dynamic fetching from DB on each request
export const dynamic = 'force-dynamic';

async function ProductsTableLoader() {
  const dbProducts = await prisma.produit.findMany({
    where: { estSupprime: false },
    include: {
      magasin: true
    },
    orderBy: {
      creeLe: 'desc'
    }
  });

  // Map and serialize Prisma objects into serializable ProductType instances
  const initialProducts: ProductType[] = dbProducts.map((product: any) => ({
    id: product.id,
    name: product.nom,
    nom: product.nom,
    description: product.description,
    price: Number(product.prix), // Convert Decimal or raw value to number
    prix: Number(product.prix),
    category: product.categorie,
    categorie: product.categorie,
    stock: product.stock,
    unit: product.unite || '',
    unite: product.unite || '',
    images: product.images,
    isActive: product.estActif,
    estActif: product.estActif,
    magasinId: product.magasinId,
    storeId: product.magasinId,
    magasin: product.magasin ? {
      id: product.magasin.id,
      nom: product.magasin.nom,
      adresse: product.magasin.adresse,
      quartier: product.magasin.quartier,
      telephone: product.magasin.telephone,
      logo: product.magasin.logo,
      description: product.magasin.description,
      estActif: product.magasin.estActif
    } : undefined,
    store: product.magasin ? {
      id: product.magasin.id,
      name: product.magasin.nom,
      address: product.magasin.adresse,
      district: product.magasin.quartier,
      phone: product.magasin.telephone,
      logo: product.magasin.logo,
      description: product.magasin.description,
      isActive: product.magasin.estActif,
      nom: product.magasin.nom,
      adresse: product.magasin.adresse,
      quartier: product.magasin.quartier,
      telephone: product.magasin.telephone,
      estActif: product.magasin.estActif
    } as any : undefined
  }));

  return <AdminProductsClient initialProducts={initialProducts} />;
}

export default function AdminProductsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-8 animate-in relative overflow-hidden">
      {/* Page Header (instant 0ms render) */}
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1 mb-2">
            <span>Admin</span>
            <span>/</span>
            <span className="text-slate-500 dark:text-slate-400 font-bold">Catalogue</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <PackageIcon className="text-brand-primary" size={28} /> Gestion du Catalogue
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Gérez et configurez le catalogue des produits partenaires.</p>
        </div>
        <Link href="?new=product" prefetch={true}>
          <Button 
            className="gap-2 h-11 px-6 rounded-xl font-bold bg-brand-primary text-white hover:bg-brand-primary-hover shadow-lg shadow-brand-primary/20 cursor-pointer transition-all"
          >
            <Plus size={20} /> Nouveau Produit
          </Button>
        </Link>
      </div>

      {/* Streaming the actual table and sheets inside Suspense */}
      <Suspense fallback={<Loading />}>
        <ProductsTableLoader />
      </Suspense>
    </div>
  );
}
