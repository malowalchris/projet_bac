import React, { Suspense } from 'react';
import prisma from "@/lib/prisma";
import AdminUsersClient from "@/components/blocks/admin/AdminUsersClient";
import { User as UserType } from '@/types';
import { Users as UsersIcon, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Loading from './loading';

// Force dynamic fetching from DB on each request
export const dynamic = 'force-dynamic';

interface UserWithCount extends Omit<UserType, 'createdAt'> {
  createdAt: string | Date;
  _count: {
    orders: number;
  };
  isActive: boolean;
}

async function UsersTableLoader() {
  const dbUsers = await prisma.utilisateur.findMany({
    orderBy: { creeLe: 'desc' },
    include: {
      _count: {
        select: { commandes: true }
      }
    }
  });

  const initialUsers: UserWithCount[] = dbUsers.map((user: any) => ({
    id: user.id,
    name: user.nom,
    email: user.email,
    phone: user.telephone,
    address: user.adresse,
    role: user.role,
    isActive: user.estActif,
    createdAt: user.creeLe.toISOString(),
    _count: {
      orders: user._count?.commandes || 0
    }
  }));

  return <AdminUsersClient initialUsers={initialUsers} />;
}

export default function AdminUsersPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-8 animate-in relative overflow-hidden">
      {/* Page Header (instant 0ms render) */}
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1 mb-2">
            <span>Admin</span>
            <span>/</span>
            <span className="text-slate-500 dark:text-slate-400 font-bold">Clients</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <UsersIcon className="text-brand-primary" size={28} /> Gestion des Clients
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Consultez, créez et gérez les droits d&apos;accès des utilisateurs MCF.</p>
        </div>
        <Link href="?new=client" prefetch={true}>
          <Button 
            className="gap-2 h-11 px-6 rounded-xl font-bold bg-brand-primary text-white hover:bg-brand-primary-hover shadow-lg shadow-brand-primary/20 cursor-pointer transition-all"
          >
            <Plus size={20} /> Nouveau Client
          </Button>
        </Link>
      </div>

      {/* Streaming the actual table and sheets inside Suspense */}
      <Suspense fallback={<Loading />}>
        <UsersTableLoader />
      </Suspense>
    </div>
  );
}
