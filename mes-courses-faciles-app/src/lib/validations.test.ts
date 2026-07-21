import { describe, it, expect } from 'vitest';
import { checkoutFormSchema, storeSchema } from './validations/schemas';

describe('Validations Zod (checkoutFormSchema & storeSchema)', () => {
  describe('checkoutFormSchema', () => {
    it('doit valider avec succès des données de commande avec un numéro de téléphone gabonais correct', () => {
      const validData = {
        name: 'Sylvie Assoumou',
        phone: '+241 07 01 02 03',
        district: 'Akanda',
        indications: 'En face de la pharmacie',
        paymentMethod: 'airtel' as const,
      };
      const result = checkoutFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(expect.objectContaining(validData));
      }
    });

    it('doit valider avec succès un numéro gabonais local sans indicatif (+241)', () => {
      const validData = {
        name: 'Marc Obame',
        phone: '07010203',
        district: 'Louis',
        paymentMethod: 'moov' as const,
      };
      const result = checkoutFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('doit rejeter un numéro de téléphone avec un format invalide (lettres ou symboles)', () => {
      const invalidData = {
        name: 'Marc Obame',
        phone: 'abcdefgh',
        district: 'Louis',
        paymentMethod: 'cash' as const,
      };
      const result = checkoutFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const phoneError = result.error.issues.find(issue => issue.path.includes('phone'));
        expect(phoneError?.message).toBe('Format de téléphone invalide');
      }
    });

    it('doit rejeter un numéro de téléphone trop court', () => {
      const invalidData = {
        name: 'Marc Obame',
        phone: '123',
        district: 'Louis',
        paymentMethod: 'cash' as const,
      };
      const result = checkoutFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const phoneError = result.error.issues.find(issue => issue.path.includes('phone'));
        expect(phoneError?.message).toBe('Numéro de téléphone invalide');
      }
    });

    it('doit rejeter si le moyen de paiement est invalide ou absent', () => {
      const invalidData = {
        name: 'Marc Obame',
        phone: '07010203',
        district: 'Louis',
        paymentMethod: 'crypto', // non autorisé dans l'enum
      };
      const result = checkoutFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('storeSchema', () => {
    it('doit valider un magasin correct avec logo URL', () => {
      const validStore = {
        name: 'Supermarché Mbolo',
        address: 'Quartier Louis, B.P. 1234',
        district: 'Louis',
        phone: '+241 01 02 03 04',
        description: 'Le plus grand supermarché de Libreville',
        logo: 'https://example.com/logo.png',
      };
      const result = storeSchema.safeParse(validStore);
      expect(result.success).toBe(true);
    });

    it('doit valider un magasin avec un logo sous forme de chaîne vide', () => {
      const validStore = {
        name: 'Épicerie du Coin',
        address: 'Rue Paul Marie',
        district: 'Mont-Bouët',
        phone: '06600000',
        logo: '',
      };
      const result = storeSchema.safeParse(validStore);
      expect(result.success).toBe(true);
    });

    it('doit rejeter un magasin dont le nom est trop court', () => {
      const invalidStore = {
        name: 'A',
        address: 'Quartier Louis',
        district: 'Louis',
        phone: '07010203',
      };
      const result = storeSchema.safeParse(invalidStore);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Le nom doit contenir au moins 2 caractères');
      }
    });

    it('doit rejeter un magasin avec une URL de logo invalide', () => {
      const invalidStore = {
        name: 'Supermarché Mbolo',
        address: 'Quartier Louis',
        district: 'Louis',
        phone: '07010203',
        logo: 'pas-une-url-valide',
      };
      const result = storeSchema.safeParse(invalidStore);
      expect(result.success).toBe(false);
      if (!result.success) {
        const logoError = result.error.issues.find(issue => issue.path.includes('logo'));
        expect(logoError?.message).toBe("URL d'image invalide");
      }
    });
  });
});
