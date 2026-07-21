import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get('storeId') || searchParams.get('magasinId');
  const category = searchParams.get('category');
  const query = searchParams.get('q');
  const sort = searchParams.get('sort');

  try {
    let orderBy: any = { creeLe: 'desc' };
    if (sort === 'price_asc') {
      orderBy = { prix: 'asc' };
    } else if (sort === 'price_desc') {
      orderBy = { prix: 'desc' };
    } else if (sort === 'name_asc') {
      orderBy = { nom: 'asc' };
    } else if (sort === 'name_desc') {
      orderBy = { nom: 'desc' };
    }

    const products = await prisma.produit.findMany({
      where: {
        estActif: true,
        estSupprime: false,
        ...(storeId && { magasinId: storeId }),
        ...(category && { categorie: category }),
        ...(query && {
          OR: [
            { nom: { contains: query } },
            { description: { contains: query } },
            { categorie: { contains: query } },
          ]
        })
      },
      include: {
        magasin: {
          select: {
            nom: true,
          }
        }
      },
      orderBy
    });

    const formattedProducts = products.map(product => ({
      ...product,
      name: product.nom,
      price: product.prix,
      category: product.categorie,
      unit: product.unite,
      isActive: product.estActif,
      isDeleted: product.estSupprime,
      store: product.magasin ? { name: product.magasin.nom, nom: product.magasin.nom } : null
    }));

    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Une erreur serveur interne est survenue.' }, { status: 500 });
  }
}
