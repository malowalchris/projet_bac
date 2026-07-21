import { describe, it, expect } from 'vitest';
import { formatCurrency, cn } from './utils';
import { resolveImageUrl } from './image-resolver';

describe('Utilitaires de formatage (utils & image-resolver)', () => {
  describe('formatCurrency', () => {
    it('doit formater correctement un montant en Franc CFA (fr-FR)', () => {
      const formatted = formatCurrency(5000);
      // Selon l'environnement V8/Node, toLocaleString('fr-FR') peut utiliser un espace normal (\u0020) ou insécable (\u202f)
      expect(formatted).toMatch(/^5[\s\u202f]000 CFA$/);
    });

    it('doit formater un montant de 0 CFA', () => {
      expect(formatCurrency(0)).toBe('0 CFA');
    });

    it('doit formater de grands montants avec des séparateurs de milliers', () => {
      const formatted = formatCurrency(1250000);
      expect(formatted).toMatch(/^1[\s\u202f]250[\s\u202f]000 CFA$/);
    });
  });

  describe('cn (Tailwind class merger)', () => {
    it('doit fusionner correctement les classes conditionnelles', () => {
      expect(cn('px-4 py-2', true && 'bg-blue-500', false && 'text-white')).toBe('px-4 py-2 bg-blue-500');
    });

    it('doit résoudre les conflits de classes Tailwind avec twMerge', () => {
      expect(cn('p-4 p-6 text-red-500 text-blue-500')).toBe('p-6 text-blue-500');
    });
  });

  describe('resolveImageUrl', () => {
    it('doit retourner le placeholder par défaut si le chemin est null, undefined ou vide', () => {
      expect(resolveImageUrl(null, 'product')).toBe('/images/product-placeholder.svg');
      expect(resolveImageUrl(undefined, 'store')).toBe('/images/store-placeholder.svg');
      expect(resolveImageUrl('   ', 'avatar')).toBe('/images/avatar-placeholder.svg');
    });

    it('doit extraire la première URL si le chemin est un tableau JSON stringifié', () => {
      const jsonString = JSON.stringify([
        'https://example.com/img1.jpg',
        'https://example.com/img2.jpg',
      ]);
      expect(resolveImageUrl(jsonString, 'product')).toBe('https://example.com/img1.jpg');
    });

    it('doit retourner le placeholder si le tableau JSON stringifié est vide', () => {
      expect(resolveImageUrl('[]', 'product')).toBe('/images/product-placeholder.svg');
    });

    it('doit retourner le chemin tel quel s’il est absolu local (commence par /)', () => {
      expect(resolveImageUrl('/uploads/product-1.png', 'product')).toBe('/uploads/product-1.png');
    });

    it('doit retourner l’URL telle quelle si elle commence par http:// ou https://', () => {
      const url = 'https://cloudinary.com/my-store-logo.png';
      expect(resolveImageUrl(url, 'store')).toBe(url);
    });

    it('doit retourner le placeholder en cas de chaîne invalide ou non reconnue', () => {
      expect(resolveImageUrl('not-a-valid-url-or-path', 'product')).toBe('/images/product-placeholder.svg');
    });
  });
});
