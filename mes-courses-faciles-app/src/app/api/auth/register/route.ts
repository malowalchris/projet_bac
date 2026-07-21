import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { userSchema } from '@/lib/validations/schemas';
import { ZodError } from 'zod';
import { signJWT } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Server-side deep validation
    const validatedData = userSchema.parse(body);
    const passwordToHash = validatedData.motDePasse || validatedData.password || "";
    const email = validatedData.email;

    const existingUser = await prisma.utilisateur.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Cet utilisateur existe déjà.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(passwordToHash, 10);

    const user = await prisma.utilisateur.create({
      data: {
        nom: validatedData.nom || validatedData.name || null,
        email,
        motDePasse: hashedPassword,
        telephone: validatedData.telephone || validatedData.phone || null,
      },
    });

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
    }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);

    if (error instanceof ZodError) {
      return NextResponse.json({
        error: 'Validation échouée',
        details: error.flatten().fieldErrors
      }, { status: 400 });
    }

    if (error.code === 'P2024' || error.message.includes('Can\'t reach database server')) {
      return NextResponse.json({ error: 'La connexion à la base de données a échoué. Veuillez vérifier que MySQL est lancé.' }, { status: 503 });
    }

    return NextResponse.json({ error: 'Une erreur serveur interne est survenue.' }, { status: 500 });
  }
}
