import React, { Suspense } from 'react';
import prisma from "@/lib/prisma";
import AdminStoresClient from "@/components/blocks/admin/AdminStoresClient";
import { Store as StoreType } from '@/types';
import { Store as StoreIcon, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Loading from './loading';

// Force dynamic fetching on each request
export const dynamic = 'force-dynamic';

async function StoresTableLoader() {
  const dbStores = await prisma.magasin.findMany({
    where: { estSupprime: false },
    orderBy: {
      creeLe: 'desc'
    }
  });

  // Map and serialize Prisma objects into serializable StoreType instances
  const initialStores: StoreType[] = dbStores.map(store => ({
    id: store.id,
    nom: store.nom,
    adresse: store.adresse,
    quartier: store.quartier,
    telephone: store.telephone,
    logo: store.logo,
    description: store.description,
    estActif: store.estActif,
    // Alias EN pour rétrocompatibilité composants clients
    name: store.nom,
    address: store.adresse,
    district: store.quartier,
    phone: store.telephone,
    isActive: store.estActif
  } as any));

  return <AdminStoresClient initialStores={initialStores} />;
}

export default function AdminStoresPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-8 animate-in relative overflow-hidden">
      {/* Page Header (instant 0ms render) */}
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1 mb-2">
            <span>Admin</span>
            <span>/</span>
            <span className="text-slate-500 dark:text-slate-400 font-bold">Magasins</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <StoreIcon className="text-brand-primary" size={28} /> Gestion des Magasins
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Gérez, configurez et suivez vos magasins partenaires.</p>
        </div>
        <Link href="?new=store" prefetch={true}>
          <Button 
            className="gap-2 h-11 px-6 rounded-xl font-bold bg-brand-primary text-white hover:bg-brand-primary-hover shadow-lg shadow-brand-primary/20 cursor-pointer transition-all"
          >
            <Plus size={20} /> Nouveau Magasin
          </Button>
        </Link>
      </div>

      {/* Streaming the actual table and sheets inside Suspense */}
      <Suspense fallback={<Loading />}>
        <StoresTableLoader />
      </Suspense>
    </div>
  );
}
