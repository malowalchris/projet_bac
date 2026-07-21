import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loginAction, registerAction } from './auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import * as jwtLib from '@/lib/jwt';
import * as nextHeaders from 'next/headers';

// Mocks des modules dépendants
vi.mock('@/lib/prisma', () => ({
  default: {
    utilisateur: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

vi.mock('@/lib/jwt', () => ({
  signJWT: vi.fn().mockResolvedValue('mocked.jwt.token'),
  verifyJWT: vi.fn(),
}));

const mockCookieSet = vi.fn();
const mockCookieDelete = vi.fn();
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    set: (...args: any[]) => mockCookieSet(...args),
    get: vi.fn(),
    delete: (...args: any[]) => mockCookieDelete(...args),
  }),
}));

describe('Actions d’Authentification (loginAction & registerAction)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loginAction', () => {
    const validLoginInput = {
      email: 'jean@mcf.ga',
      password: 'Password123',
    };

    const mockDbUser = {
      id: 'usr-1',
      nom: 'Jean Dupont',
      email: 'jean@mcf.ga',
      motDePasse: '$2b$10$hashedpasswordstring',
      telephone: '+241 07 01 02 03',
      adresse: null,
      role: 'USER',
      estActif: true,
      creeLe: new Date('2026-01-01T00:00:00Z')
    };

    it('doit connecter l’utilisateur avec succès avec de bons identifiants et poser le cookie JWT', async () => {
      vi.mocked(prisma.utilisateur.findUnique).mockResolvedValueOnce(mockDbUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as any);

      const result = await loginAction(validLoginInput);

      expect(prisma.utilisateur.findUnique).toHaveBeenCalledWith({
        where: { email: 'jean@mcf.ga' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('Password123', '$2b$10$hashedpasswordstring');
      expect(jwtLib.signJWT).toHaveBeenCalledWith({
        id: 'usr-1',
        email: 'jean@mcf.ga',
        name: 'Jean Dupont',
        role: 'USER',
      });
      expect(mockCookieSet).toHaveBeenCalledWith(
        'mcf_jwt_session',
        'mocked.jwt.token',
        expect.objectContaining({ httpOnly: true, path: '/' })
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user).toEqual(expect.objectContaining({
          id: 'usr-1',
          name: 'Jean Dupont',
          email: 'jean@mcf.ga',
          phone: '+241 07 01 02 03',
          role: 'USER',
        }));
      }
    });

    it('doit échouer et renvoyer une erreur claire si le compte est inexistant', async () => {
      vi.mocked(prisma.utilisateur.findUnique).mockResolvedValueOnce(null);

      const result = await loginAction(validLoginInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Identifiants invalides');
      expect(mockCookieSet).not.toHaveBeenCalled();
    });

    it('doit échouer et renvoyer une erreur claire si le mot de passe est incorrect', async () => {
      vi.mocked(prisma.utilisateur.findUnique).mockResolvedValueOnce(mockDbUser as any);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as any);

      const result = await loginAction(validLoginInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Identifiants invalides');
      expect(mockCookieSet).not.toHaveBeenCalled();
    });
  });

  describe('registerAction', () => {
    const validRegisterInput = {
      nom: 'Alice Mengue',
      name: 'Alice Mengue',
      email: 'alice@mcf.ga',
      motDePasse: 'Password123',
      password: 'Password123',
      phone: '+241 06 60 60 60',
    } as any;

    it('doit rejeter l’inscription si l’email est déjà utilisé dans la base de données', async () => {
      vi.mocked(prisma.utilisateur.findUnique).mockResolvedValueOnce({
        id: 'existing-usr',
        email: 'alice@mcf.ga',
      } as any);

      const result = await registerAction(validRegisterInput);

      expect(prisma.utilisateur.findUnique).toHaveBeenCalledWith({
        where: { email: 'alice@mcf.ga' },
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cet email est déjà utilisé');
      expect(prisma.utilisateur.create).not.toHaveBeenCalled();
    });

    it('doit insérer le nouvel utilisateur dans Prisma (avec mot de passe hashé) et créer la session', async () => {
      vi.mocked(prisma.utilisateur.findUnique).mockResolvedValueOnce(null);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('$2b$10$newhashedpassword' as any);

      const createdDbUser = {
        id: 'usr-202',
        nom: 'Alice Mengue',
        email: 'alice@mcf.ga',
        motDePasse: '$2b$10$newhashedpassword',
        telephone: '+241 06 60 60 60',
        adresse: null,
        role: 'USER',
        estActif: true,
        creeLe: new Date('2026-01-01T00:00:00Z')
      };

      vi.mocked(prisma.utilisateur.create).mockResolvedValueOnce(createdDbUser as any);

      const result = await registerAction(validRegisterInput);

      expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 10);
      expect(prisma.utilisateur.create).toHaveBeenCalledWith({
        data: {
          nom: 'Alice Mengue',
          email: 'alice@mcf.ga',
          motDePasse: '$2b$10$newhashedpassword',
          telephone: '+241 06 60 60 60',
        },
      });
      expect(jwtLib.signJWT).toHaveBeenCalled();
      expect(mockCookieSet).toHaveBeenCalled();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user?.email).toBe('alice@mcf.ga');
      }
    });
  });
});
