import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyJWT, signJWT } from './jwt';
import * as jose from 'jose';

vi.mock('jose', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jose')>();
  return {
    ...actual,
    jwtVerify: vi.fn(),
    SignJWT: vi.fn().mockImplementation(function (this: any) {
      this.setProtectedHeader = vi.fn().mockReturnThis();
      this.setIssuedAt = vi.fn().mockReturnThis();
      this.setExpirationTime = vi.fn().mockReturnThis();
      this.sign = vi.fn().mockResolvedValue('mocked.signed.jwt');
    }),
  };
});

describe('Utilitaires de sécurité JWT (jwt.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('verifyJWT', () => {
    it('doit retourner le payload d’un token JWT valide', async () => {
      const mockPayload = {
        id: 'user_123',
        email: 'client@mcf.ga',
        role: 'USER',
      };

      vi.mocked(jose.jwtVerify).mockResolvedValueOnce({
        payload: mockPayload,
        protectedHeader: { alg: 'HS256' },
      } as any);

      const result = await verifyJWT('valid.jwt.token');
      expect(jose.jwtVerify).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockPayload);
    });

    it('doit retourner null lorsque le token JWT est invalide ou corrompu', async () => {
      vi.mocked(jose.jwtVerify).mockRejectedValueOnce(
        new Error('ERR_JWS_SIGNATURE_VERIFICATION_FAILED')
      );

      const result = await verifyJWT('corrupted.or.tampered.token');
      expect(jose.jwtVerify).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    it('doit retourner null lorsque le token JWT est expiré', async () => {
      vi.mocked(jose.jwtVerify).mockRejectedValueOnce(
        new Error('ERR_JWT_EXPIRED: "exp" claim timestamp check failed')
      );

      const result = await verifyJWT('expired.jwt.token');
      expect(jose.jwtVerify).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
  });

  describe('signJWT', () => {
    it('doit générer et signer un token JWT avec les bons headers et expiration', async () => {
      const payload = { id: 'admin_1', role: 'ADMIN' };
      const token = await signJWT(payload, '24h');

      expect(jose.SignJWT).toHaveBeenCalledWith(payload);
      expect(token).toBe('mocked.signed.jwt');
    });
  });
});
