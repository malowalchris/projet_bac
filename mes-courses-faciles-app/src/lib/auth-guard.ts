/**
 * src/lib/auth-guard.ts
 *
 * Utilitaire centralisé de contrôle d'accès — Architecture Zero-Trust.
 *
 * Règle d'or : Le `userId` serveur est la SEULE source de vérité.
 * Le client ne doit jamais passer son propre userId en paramètre d'une Server Action.
 *
 * Usage dans les Server Actions :
 *   const session = await requireAuth();         // throws si non connecté
 *   const session = await requireAdminAuth();    // throws si non admin
 */

import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';

// ─── Type ──────────────────────────────────────────────────────────────────────

export interface AuthSession {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

// ─── Erreur typée ──────────────────────────────────────────────────────────────

export class AuthError extends Error {
  public readonly statusCode: 401 | 403;
  constructor(message: string, statusCode: 401 | 403 = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

// ─── Helpers internes ──────────────────────────────────────────────────────────

async function getSessionFromCookie(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('mcf_jwt_session')?.value;
    if (!token) return null;

    const decoded = await verifyJWT(token);
    if (!decoded || typeof decoded.id !== 'string') return null;

    return {
      id:    decoded.id as string,
      email: decoded.email as string,
      name:  (decoded.name as string) ?? null,
      role:  decoded.role as string,
    };
  } catch {
    return null;
  }
}

// ─── API publique ──────────────────────────────────────────────────────────────

/**
 * Exige une session utilisateur valide.
 * Throw `AuthError(401)` si le cookie est absent ou le JWT invalide.
 *
 * Retourne un objet `AuthSession` typé — jamais `null`, jamais `any`.
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await getSessionFromCookie();
  if (!session) {
    throw new AuthError('Non authentifié. Veuillez vous connecter.', 401);
  }
  return session;
}

/**
 * Exige une session administrateur valide.
 * Throw `AuthError(401)` si non connecté.
 * Throw `AuthError(403)` si connecté mais pas ADMIN.
 */
export async function requireAdminAuth(): Promise<AuthSession> {
  const session = await getSessionFromCookie();
  if (!session) {
    throw new AuthError('Non authentifié.', 401);
  }
  if (session.role !== 'ADMIN') {
    throw new AuthError('Accès refusé. Rôle ADMIN requis.', 403);
  }
  return session;
}

/**
 * Retourne la session ou null — version non-bloquante pour les pages
 * qui affichent un contenu différent selon l'état de connexion.
 */
export async function getOptionalSession(): Promise<AuthSession | null> {
  return getSessionFromCookie();
}

/**
 * Récupère l'utilisateur actuellement connecté depuis le cookie de session de manière non-bloquante (retourne AuthSession ou null).
 * Pour forcer la connexion en levant une exception, utiliser requireAuth().
 */
export async function getCurrentUser(): Promise<AuthSession | null> {
  return getSessionFromCookie();
}
