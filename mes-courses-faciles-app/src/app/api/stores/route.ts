import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const magasins = await prisma.magasin.findMany({
      where: { estActif: true, estSupprime: false },
    });
    const stores = magasins.map(m => ({
      id: m.id,
      name: m.nom,
      nom: m.nom,
      address: m.adresse,
      adresse: m.adresse,
      district: m.quartier,
      quartier: m.quartier,
      phone: m.telephone,
      telephone: m.telephone,
      logo: m.logo,
      description: m.description,
      isActive: m.estActif,
      estActif: m.estActif,
    }));
    return NextResponse.json(stores);
  } catch (error) {
    return NextResponse.json({ error: 'Une erreur serveur interne est survenue.' }, { status: 500 });
  }
}
