import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyJWT } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('mcf_jwt_session')?.value;

    if (!token) {
       return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded || decoded.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // 1. Fetch database stats and alerts in parallel
    const [pendingOrders, outOfStockProducts, dbNotifications] = await Promise.all([
      prisma.commande.findMany({
        where: { statut: 'PENDING' },
        include: { utilisateur: { select: { nom: true } } }, // Least-privilege: nom only, no password/email
        orderBy: { creeLe: 'desc' },
      }),
      prisma.produit.findMany({
        where: { stock: 0, estSupprime: false },
        orderBy: { misAJourLe: 'desc' },
      }),
      prisma.notification.findMany()
    ]);

    // 2. Create active alerts list
    const activeAlerts = [
      ...pendingOrders.map(order => ({
        reference: `order-${order.id}`,
        type: 'ORDER',
        message: `Nouvelle commande de ${order.utilisateur?.nom || 'Client'} (${order.total.toLocaleString('fr-FR')} CFA)`,
        createdAt: order.creeLe
      })),
      ...outOfStockProducts.map(product => ({
        reference: `product-${product.id}`,
        type: 'STOCK',
        message: `Produit en rupture de stock : ${product.nom}`,
        createdAt: product.misAJourLe
      }))
    ];

    const activeReferences = new Set(activeAlerts.map(a => a.reference));
    const dbRefs = new Set(dbNotifications.map(n => n.reference));

    // 5. Create new notifications in DB
    // 5. Create new notifications in DB
    const toCreate = activeAlerts.filter(a => !dbRefs.has(a.reference));
    for (const notif of toCreate) {
      try {
        await prisma.notification.create({
          data: {
            type: notif.type,
            message: notif.message,
            reference: notif.reference,
            estLu: false,
            creeLe: notif.createdAt
          }
        });
      } catch (err) {
        console.error(`Error creating notification for ${notif.reference}:`, err);
      }
    }

    // 6. Auto-resolve notifications that are no longer active
    // If a notification is unread in DB but no longer active, mark it as read.
    const toAutoRead = dbNotifications.filter(n => !n.estLu && !activeReferences.has(n.reference));
    for (const notif of toAutoRead) {
      try {
        await prisma.notification.update({
          where: { id: notif.id },
          data: { estLu: true }
        });
      } catch (err) {
        console.error(`Error auto-reading notification for ${notif.reference}:`, err);
      }
    }

    // 7. Re-fetch all notifications (sorted by createdAt desc)
    const finalNotifications = await prisma.notification.findMany({
      orderBy: { creeLe: 'desc' },
    });

    const hasUnread = finalNotifications.some(n => !n.estLu);
    const unreadCount = finalNotifications.filter(n => !n.estLu).length;

    const { searchParams } = new URL(request.url);
    const getAll = searchParams.get('all') === 'true';

    const alertsFormatted = finalNotifications.map(n => ({
      ...n,
      isRead: n.estLu,
      createdAt: n.creeLe
    }));

    return NextResponse.json({
      hasUnread,
      hasBadge: hasUnread, // For backward compatibility
      unreadCount,
      alerts: getAll ? alertsFormatted : alertsFormatted.slice(0, 5)
    });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json({ error: 'Une erreur serveur interne est survenue.' }, { status: 500 });
  }
}
