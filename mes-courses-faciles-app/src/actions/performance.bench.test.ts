import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncCartAction } from './ecommerce';
import prisma from '@/lib/prisma';
import * as authGuard from '@/lib/auth-guard';

// Mock de prisma ($transaction) avec simulation d'une latence réseau réaliste (50ms)
const mockTxDeleteMany = vi.fn().mockImplementation(async () => {
  await new Promise((resolve) => setTimeout(resolve, 20)); // Simulation I/O suppression
  return { count: 2 };
});

const mockTxCreateMany = vi.fn().mockImplementation(async () => {
  await new Promise((resolve) => setTimeout(resolve, 30)); // Simulation I/O insertion massive
  return { count: 15 };
});

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
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: (fn: any) => fn,
}));

vi.mock('@/lib/auth-guard', () => {
  class AuthError extends Error {
    constructor(message: string, public statusCode = 401) {
      super(message);
      this.name = 'AuthError';
    }
  }
  return {
    requireAuth: vi.fn().mockResolvedValue({
      id: 'usr-bench-999',
      email: 'benchmark@mcf.ga',
      name: 'Testeur Performance',
      role: 'USER',
    }),
    AuthError,
  };
});

describe('Benchmark des Server Actions (syncCartAction)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('doit exécuter syncCartAction (avec 50ms de latence DB simulée) en moins de 200 millisecondes', async () => {
    // Génération d'un panier lourd avec 15 articles
    const heavyCartPayload = Array.from({ length: 15 }, (_, i) => ({
      id: `prod-bench-${i}`,
      name: `Produit Benchmark ${i}`,
      price: 1500 + i * 100,
      quantity: 2,
      unit: 'pièce',
      category: 'Alimentaire',
      storeId: 'store-bench-1',
      image: '',
    }));

    // Mesure du temps d'exécution exact avec l'API performance.now()
    const startTime = performance.now();

    const result = await syncCartAction(heavyCartPayload);

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    // Vérification fonctionnelle
    expect(result.success).toBe(true);
    expect(mockTransaction).toHaveBeenCalledTimes(1);

    // Assertion stricte de performance : le temps total (incluant la surcharge JS + latence 50ms DB)
    // doit impérativement être inférieur à 200ms
    expect(executionTime).toBeLessThan(200);
  });
});
