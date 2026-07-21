"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { loginSchema, userSchema } from "@/lib/validations/schemas";
import { signJWT } from "@/lib/jwt";
import { cookies } from "next/headers";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth, getCurrentUser, AuthError } from "@/lib/auth-guard";

export async function loginAction(data: z.infer<typeof loginSchema>) {
  try {
    const validated = loginSchema.parse(data);
    const user = await prisma.utilisateur.findUnique({
      where: { email: validated.email },
    });

    if (!user) return { success: false, error: "Identifiants invalides" };

    const match = await bcrypt.compare(validated.password, user.motDePasse);
    if (!match) return { success: false, error: "Identifiants invalides" };

    if (!user.estActif) {
      return { success: false, error: "Votre compte a été suspendu par un administrateur." };
    }

    const { motDePasse: _password, ...userWithoutPassword } = user;

    // Create JWT token
    const token = await signJWT({
      id: user.id,
      email: user.email,
      name: user.nom,
      role: user.role
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('mcf_jwt_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS en prod, HTTP en dev
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return {
      success: true,
      user: {
        ...userWithoutPassword,
        name: user.nom,
        phone: user.telephone,
        address: user.adresse,
        createdAt: user.creeLe,
      }
    };
  } catch (e: any) {
    if (e.message?.includes("Can't reach database")) {
        return { success: false, error: "Base de données inaccessible" };
    }
    return { success: false, error: e.message };
  }
}

export async function logoutAction() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('mcf_jwt_session');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function registerAction(data: z.infer<typeof userSchema>) {
  try {
    const validated = userSchema.parse(data);
    const existing = await prisma.utilisateur.findUnique({
      where: { email: validated.email },
    });

    if (existing) return { success: false, error: "Cet email est déjà utilisé" };

    const passwordToHash = validated.motDePasse || validated.password || "";
    const hashedPassword = await bcrypt.hash(passwordToHash, 10);
    const user = await prisma.utilisateur.create({
      data: {
        nom: validated.nom || validated.name || null,
        email: validated.email,
        motDePasse: hashedPassword,
        telephone: validated.telephone || validated.phone || null,
      },
    });

    const { motDePasse, ...userWithoutPassword } = user;

    // Create JWT token
    const token = await signJWT({
      id: user.id,
      email: user.email,
      name: user.nom,
      role: user.role
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('mcf_jwt_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS en prod, HTTP en dev
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return {
      success: true,
      user: {
        ...userWithoutPassword,
        name: user.nom,
        phone: user.telephone,
        address: user.adresse,
        createdAt: user.creeLe,
      }
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Récupère le profil de l'utilisateur connecté de manière sécurisée (Anti-IDOR).
 * Aucun paramètre d'ID accepté : la session côté serveur est la seule source de vérité.
 */
export async function fetchUserProfileAction() {
  try {
    const session = await requireAuth();
    const user = await prisma.utilisateur.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        nom: true,
        email: true,
        telephone: true,
        adresse: true,
        role: true,
        creeLe: true,
      }
    });

    if (!user) return { success: false, error: "Utilisateur introuvable" };

    return {
      success: true,
      user: {
        ...user,
        name: user.nom,
        phone: user.telephone,
        address: user.adresse,
        createdAt: user.creeLe,
      }
    };
  } catch (e: any) {
    if (e instanceof AuthError) return { success: false, error: e.message };
    return { success: false, error: e.message };
  }
}

/**
 * Met à jour le profil utilisateur en vérifiant systématiquement l'identité via la session serveur (Anti-IDOR).
 * Le paramètre userId (si envoyé par le client) est ignoré au profit de `session.id`.
 */
export async function updateProfileAction(_userId: string, data: { name: string; phone: string; address: string }) {
  try {
    const session = await requireAuth();
    const actualUserId = session.id; // ← source de vérité serveur, jamais de payload client

    const updated = await prisma.utilisateur.update({
      where: { id: actualUserId },
      data: {
        nom: data.name,
        telephone: data.phone,
        adresse: data.address,
      },
    });
    revalidatePath("/profile");
    return {
      success: true,
      user: {
        ...updated,
        name: updated.nom,
        phone: updated.telephone,
        address: updated.adresse,
        createdAt: updated.creeLe,
      }
    };
  } catch (e: any) {
    if (e instanceof AuthError) return { success: false, error: e.message };
    return { success: false, error: e.message };
  }
}
