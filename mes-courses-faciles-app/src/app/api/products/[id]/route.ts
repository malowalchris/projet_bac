import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const product = await prisma.produit.findUnique({
      where: { id },
      include: {
        magasin: {
          select: {
            nom: true,
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    const formatted = {
      ...product,
      name: product.nom,
      price: product.prix,
      category: product.categorie,
      unit: product.unite,
      store: product.magasin ? { name: product.magasin.nom, nom: product.magasin.nom } : null
    };
    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: 'Une erreur serveur interne est survenue.' }, { status: 500 });
  }
}
