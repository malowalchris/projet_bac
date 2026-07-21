import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ stores: [], products: [] });
    }

    // Search stores matching the query
    const magasins = await prisma.magasin.findMany({
      where: {
        estActif: true,
        nom: {
          contains: query,
        },
      },
      select: {
        id: true,
        nom: true,
        logo: true,
        adresse: true,
      },
      take: 3,
    });

    const stores = magasins.map(m => ({
      id: m.id,
      name: m.nom,
      nom: m.nom,
      logo: m.logo,
      address: m.adresse,
      adresse: m.adresse,
    }));

    // Search products matching the query
    const productsDb = await prisma.produit.findMany({
      where: {
        estActif: true,
        estSupprime: false,
        nom: {
          contains: query,
        },
      },
      select: {
        id: true,
        nom: true,
        prix: true,
        images: true,
        categorie: true,
        magasinId: true,
        magasin: {
          select: {
            nom: true,
          },
        },
      },
      take: 5,
    });

    const products = productsDb.map((p: any) => ({
      ...p,
      name: p.nom,
      price: p.prix,
      category: p.categorie,
      storeId: p.magasinId,
      store: p.magasin ? { name: p.magasin.nom, nom: p.magasin.nom } : null,
    }));

    return NextResponse.json({ stores, products });
  } catch (error) {
    console.error('[SUGGESTIONS_API_ERROR]', error);
    return NextResponse.json({ error: 'Une erreur serveur interne est survenue.' }, { status: 500 });
  }
}
