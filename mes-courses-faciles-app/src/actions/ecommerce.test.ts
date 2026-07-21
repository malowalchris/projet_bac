import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncCartAction, updateStoreStatusAction } from './ecommerce';
import prisma from '@/lib/prisma';
import * as authGuard from '@/lib/auth-guard';
import * as nextCache from 'next/cache';

// Mock de prisma ($transaction et store.update)
const mockTxDeleteMany = vi.fn();
const mockTxCreateMany = vi.fn();
const mockStoreUpdate = vi.fn();
const mockTransaction = vi.fn().mockImplementation(async (callback) => {
  return await callback({
    articlePanier: {
      deleteMany: (...args: any[]) => mockTxDeleteMany(...args),
      createMany: (...args: any[]) => mockTxCreateMany(...args),
    },
    cartItem: {
      deleteMany: (...args: any[]) => mockTxDeleteMany(...args),
      createMany: (...args: any[]) => mockTxCreateMany(...args),
    },
  });
});

vi.mock('@/lib/prisma', () => ({
  default: {
    $transaction: (...args: any[]) => mockTransaction(...args),
    store: {
      update: (...args: any[]) => mockStoreUpdate(...args),
    },
    magasin: {
      update: (...args: any[]) => mockStoreUpdate(...args),
    },
  },
}));

// Mock de next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: (fn: any) => fn,
}));

// Mock de auth-guard
vi.mock('@/lib/auth-guard', () => {
  class AuthError extends Error {
    constructor(message: string, public statusCode = 401) {
      super(message);
      this.name = 'AuthError';
    }
  }
  return {
    requireAuth: vi.fn(),
    requireAdminAuth: vi.fn(),
    AuthError,
  };
});

describe('Actions E-commerce & Transactions (syncCartAction & updateStoreStatusAction)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('syncCartAction', () => {
    const sampleCartItems = [
      { id: 'prod-101', name: 'Riz 5kg', price: 5000, quantity: 2, unit: 'sac', category: 'Alimentaire', storeId: 'store-888', image: '' },
      { id: 'prod-102', name: 'Huile 1L', price: 1500, quantity: 1, unit: 'bouteille', category: 'Alimentaire', storeId: 'store-888', image: '' },
    ];

    it('doit synchroniser le panier en ouvrant une transaction prisma.$transaction et lier les items au userId serveur', async () => {
      vi.mocked(authGuard.requireAuth).mockResolvedValueOnce({
        id: 'usr-server-777',
        email: 'client@mcf.ga',
        name: 'Sylvie',
        role: 'USER',
      });

      const result = await syncCartAction(sampleCartItems);

      // Vérifier que requireAuth a été appelé
      expect(authGuard.requireAuth).toHaveBeenCalledTimes(1);

      // Vérifier que la transaction prisma.$transaction a été exécutée
      expect(mockTransaction).toHaveBeenCalledTimes(1);

      // Vérifier que deleteMany a purgé l'ancien panier uniquement pour cet utilisateur
      expect(mockTxDeleteMany).toHaveBeenCalledWith({
        where: { utilisateurId: 'usr-server-777' },
      });

      // Vérifier que createMany a recréé les articles avec le storeId du premier article et le userId du serveur
      expect(mockTxCreateMany).toHaveBeenCalledWith({
        data: [
          { utilisateurId: 'usr-server-777', magasinId: 'store-888', produitId: 'prod-101', quantite: 2 },
          { utilisateurId: 'usr-server-777', magasinId: 'store-888', produitId: 'prod-102', quantite: 1 },
        ],
      });

      expect(result.success).toBe(true);
    });

    it('doit échouer et retourner une erreur si l’utilisateur n’est pas authentifié', async () => {
      vi.mocked(authGuard.requireAuth).mockRejectedValueOnce(
        new authGuard.AuthError('Non authentifié. Veuillez vous connecter.', 401)
      );

      const result = await syncCartAction(sampleCartItems);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Non authentifié. Veuillez vous connecter.');
      expect(mockTransaction).not.toHaveBeenCalled();
    });
  });

  describe('updateStoreStatusAction', () => {
    it('doit mettre à jour le statut du magasin (isActive) et purger le cache via revalidatePath et revalidateTag', async () => {
      vi.mocked(authGuard.requireAdminAuth).mockResolvedValueOnce({
        id: 'admin-001',
        email: 'admin@mcf.ga',
        name: 'Administrateur',
        role: 'ADMIN',
      });

      vi.mocked(mockStoreUpdate).mockResolvedValueOnce({
        id: 'store-888',
        name: 'Mbolo',
        isActive: false,
      } as any);

      const result = await updateStoreStatusAction('store-888', false);

      // Vérifier que l'autorisation admin est exigée
      expect(authGuard.requireAdminAuth).toHaveBeenCalledTimes(1);

      // Vérifier la mise à jour Prisma
      expect(mockStoreUpdate).toHaveBeenCalledWith({
        where: { id: 'store-888' },
        data: { isActive: false, estActif: false },
      });

      // Vérifier que l'invalidation des chemins (revalidatePath) a eu lieu sur les bonnes routes
      expect(nextCache.revalidatePath).toHaveBeenCalledWith('/admin/stores');
      expect(nextCache.revalidatePath).toHaveBeenCalledWith('/stores');

      // Vérifier que l'invalidation par tag (revalidateTag) a purgé le tag 'stores'
      expect(nextCache.revalidateTag).toHaveBeenCalledWith('stores', 'max');

      expect(result.success).toBe(true);
    });

    it('doit refuser la mise à jour si l’appelant n’est pas un administrateur (AuthError 403)', async () => {
      vi.mocked(authGuard.requireAdminAuth).mockRejectedValueOnce(
        new authGuard.AuthError('Accès refusé. Rôle ADMIN requis.', 403)
      );

      const result = await updateStoreStatusAction('store-888', true);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Accès refusé. Rôle ADMIN requis.');
      expect(mockStoreUpdate).not.toHaveBeenCalled();
      expect(nextCache.revalidatePath).not.toHaveBeenCalled();
      expect(nextCache.revalidateTag).not.toHaveBeenCalled();
    });
  });
});
