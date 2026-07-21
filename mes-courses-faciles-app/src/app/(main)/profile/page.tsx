import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ProfileClient } from '@/components/blocks/client/ProfileClient';
import { Order as OrderType, SessionUser } from '@/types';
import { fetchUserOrdersAction } from '@/actions/ecommerce';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('mcf_jwt_session')?.value;
  if (!token) {
    redirect('/?auth=login&callbackUrl=/profile');
  }

  const decoded = (await verifyJWT(token)) as unknown as SessionUser;
  if (!decoded) {
    redirect('/?auth=login&callbackUrl=/profile');
  }

  const user = await prisma.utilisateur.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      nom: true,
      email: true,
      telephone: true,
      adresse: true,
      role: true,
    }
  });

  if (!user) {
    redirect('/?auth=login&callbackUrl=/profile');
  }

  // Isolation stricte : Un admin requêtant le profil client est redirigé vers l'admin settings
  if (user.role !== 'CLIENT') {
    redirect('/admin/settings');
  }

  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams?.page) || 1;
  const limit = 5; // 5 orders per page for profile history

  // Fetch stats promise from DB (count and total spent)
  const statsPromise = Promise.all([
    prisma.commande.count({
      where: { utilisateurId: user.id }
    }),
    prisma.commande.aggregate({
      _sum: { total: true },
      where: { utilisateurId: user.id }
    })
  ]).then(([count, sum]) => ({
    count,
    totalSpent: sum._sum.total || 0
  }));

  // Fetch orders promise using the server action
  const ordersPromise = fetchUserOrdersAction(page, limit).then(res => {
    if (!res.success) {
      return {
        orders: [] as OrderType[],
        totalPages: 0,
        currentPage: page
      };
    }
    return {
      orders: (res.orders || []) as OrderType[],
      totalPages: res.totalPages || 0,
      currentPage: res.currentPage || page
    };
  });

  // Map user to match the props structure expected
  const clientUser = {
    id: user.id,
    name: user.nom,
    email: user.email,
    phone: user.telephone,
    address: user.adresse,
    role: user.role,
  };

  return <ProfileClient initialUser={clientUser} ordersPromise={ordersPromise} statsPromise={statsPromise} />;
}
