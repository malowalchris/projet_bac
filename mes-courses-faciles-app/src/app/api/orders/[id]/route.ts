import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJWT } from '@/lib/jwt';
import { cookies } from 'next/headers';

/**
 * Helper local — extrait la session depuis le cookie JWT.
 * Zero-Trust : le userId n'est JAMAIS lu depuis les query params ou le body.
 */
async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('mcf_jwt_session')?.value;
  if (!token) return null;
  const decoded = await verifyJWT(token);
  if (!decoded || typeof decoded.id !== 'string') return null;
  return decoded;
}

// ─── GET /api/orders/[id] ─────────────────────────────────────────────────────
// Anti-IDOR Vecteur n°1 : Double vérification (id + utilisateurId)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const resolvedParams = await params;
    const orderId = resolvedParams?.id;

    if (!orderId) {
      return NextResponse.json({ error: 'Identifiant de commande requis.' }, { status: 400 });
    }

    // Double vérification stricte : la commande doit exister ET appartenir au propriétaire du token
    const order = await prisma.commande.findUnique({
      where: {
        id: orderId,
        utilisateurId: session.id as string,
      },
      include: {
        magasin: true,
        lignesCommande: {
          include: {
            produit: true
          }
        }
      }
    });

    if (!order) {
      // Retour 404 générique pour masquer l'existence de la commande si elle appartient à un tiers
      return NextResponse.json(
        { error: 'Commande introuvable ou accès non autorisé.' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Fetch order details error:', error);
    return NextResponse.json({ error: 'Une erreur serveur interne est survenue.' }, { status: 500 });
  }
}
