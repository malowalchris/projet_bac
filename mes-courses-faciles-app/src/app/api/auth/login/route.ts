import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { loginSchema } from '@/lib/validations/schemas';
import { ZodError } from 'zod';
import { signJWT } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);
    const { email, password } = validatedData;

    const user = await prisma.utilisateur.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.motDePasse);

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }

    if (!user.estActif) {
      return NextResponse.json({ error: 'Votre compte a été suspendu par un administrateur.' }, { status: 403 });
    }

    const { motDePasse: _password, ...userWithoutPassword } = user;

    const token = await signJWT({
      id: user.id,
      email: user.email,
      name: user.nom,
      role: user.role
    });

    const cookieStore = await cookies();
    cookieStore.set('mcf_jwt_session', token, {
      httpOnly: true,
      secure: false,
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return NextResponse.json({
      ...userWithoutPassword,
      name: user.nom,
      phone: user.telephone,
      address: user.adresse,
      createdAt: user.creeLe,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Login error:', error);

    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation échouée', details: error.flatten().fieldErrors }, { status: 400 });
    }

    if (error.code === 'P2024' || error.message.includes('Can\'t reach database server')) {
      return NextResponse.json({ error: 'La base de données est inaccessible. Veuillez vérifier que MySQL est lancé dans XAMPP.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Une erreur interne est survenue.' }, { status: 500 });
  }
}
