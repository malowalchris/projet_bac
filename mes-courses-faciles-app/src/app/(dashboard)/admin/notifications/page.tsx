import React from 'react';
import prisma from "@/lib/prisma";
import NotificationsClient from "@/components/blocks/admin/NotificationsClient";

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const dbNotifications = await prisma.notification.findMany({
    orderBy: {
      creeLe: 'desc'
    }
  });

  const initialNotifications = dbNotifications.map(n => ({
    id: n.id,
    type: n.type,
    message: n.message,
    reference: n.reference,
    isRead: n.estLu,
    createdAt: n.creeLe.toISOString()
  }));

  return <NotificationsClient initialNotifications={initialNotifications} />;
}
