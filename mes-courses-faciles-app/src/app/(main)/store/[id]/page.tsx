import React from 'react';
import prisma from '@/lib/prisma';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StoreDetailContent } from '@/components/blocks/stores/StoreDetailContent';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const store = await prisma.magasin.findUnique({
    where: { id },
    select: { nom: true, description: true, estActif: true, estSupprime: true }
  });
  return {
    title: store && store.estActif && !store.estSupprime ? `${store.nom} | Mes Courses Faciles` : 'Magasin | Mes Courses Faciles',
    description: store?.description || 'Découvrez nos magasins partenaires sur Mes Courses Faciles.',
  };
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  // Get Store from DB
  const dbStore = await prisma.magasin.findUnique({
    where: { id: resolvedParams.id },
    select: {
      id: true,
      nom: true,
      adresse: true,
      quartier: true,
      telephone: true,
      logo: true,
      description: true,
      estActif: true,
      estSupprime: true,
    }
  });

  if (!dbStore || !dbStore.estActif || dbStore.estSupprime) {
    notFound();
  }

  const store = {
    ...dbStore,
    name: dbStore.nom,
    address: dbStore.adresse,
    district: dbStore.quartier,
    phone: dbStore.telephone,
    isActive: dbStore.estActif,
  } as any;

  return <StoreDetailContent store={store} />;
}
