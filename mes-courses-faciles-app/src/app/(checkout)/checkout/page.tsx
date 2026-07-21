import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { CheckoutWizard } from '@/components/blocks/cart/CheckoutWizard';
import { SessionUser } from '@/types';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('mcf_jwt_session')?.value;
  if (!token) {
    redirect('/?auth=login&callbackUrl=/checkout');
  }

  const decoded = (await verifyJWT(token)) as unknown as SessionUser;
  if (!decoded) {
    redirect('/?auth=login&callbackUrl=/checkout');
  }

  const user = await prisma.utilisateur.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      nom: true,
      telephone: true,
      adresse: true,
    }
  });

  if (!user) {
    redirect('/?auth=login&callbackUrl=/checkout');
  }

  return <CheckoutWizard initialUser={{
    id: user.id,
    name: user.nom,
    phone: user.telephone,
    address: user.adresse
  }} />;
}
