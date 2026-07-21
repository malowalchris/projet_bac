import React, { Suspense } from 'react';
import prisma from '@/lib/prisma';
import { StoresListContent } from '@/components/blocks/stores/StoresListContent';
import { Metadata } from 'next';
import { StoresPageSkeleton } from '@/components/common/Skeletons';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Nos Magasins Partenaires | Mes Courses Faciles',
  description: 'Découvrez tous nos supermarchés et magasins partenaires à Libreville. Commandez en ligne et faites-vous livrer en 45 minutes.',
};

async function StoresLoader() {
  // Query all active and non-deleted stores
  const dbStores = await prisma.magasin.findMany({
    where: {
      estActif: true,
      estSupprime: false,
    },
    include: {
      produits: {
        where: {
          estActif: true,
          estSupprime: false,
        },
        select: {
          categorie: true,
        },
      },
    },
    orderBy: {
      nom: 'asc',
    },
  });

  const stores = dbStores.map(s => ({
    ...s,
    name: s.nom,
    address: s.adresse,
    district: s.quartier,
    phone: s.telephone,
    isActive: s.estActif,
    products: (s.produits || []).map((p: any) => ({ ...p, category: p.categorie })),
  } as any));

  // Extract unique list of districts for filtering
  const districtsSet = new Set<string>();
  stores.forEach((s: any) => {
    const d = s.quartier || s.district;
    if (d) {
      districtsSet.add(d.trim());
    }
  });
  const districts = Array.from(districtsSet).sort((a, b) => a.localeCompare(b, 'fr'));

  return <StoresListContent initialStores={stores} districts={districts} />;
}

export default function StoresPage() {
  return (
    <Suspense fallback={<StoresPageSkeleton />}>
      <StoresLoader />
    </Suspense>
  );
}
