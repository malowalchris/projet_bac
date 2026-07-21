import { describe, it, expect } from 'vitest';
import { userSchema, productSchema } from './schemas';

describe('Validation Schemas', () => {
  describe('userSchema', () => {
    it('should validate a correct user', () => {
      const validUser = {
        name: 'Jean Dupont',
        email: 'jean@example.com',
        password: 'Password123',
        phone: '+24107000000'
      };
      expect(userSchema.parse(validUser)).toEqual(expect.objectContaining(validUser));
    });

    it('should fail on weak password', () => {
      const invalidUser = {
        name: 'Jean',
        email: 'jean@example.com',
        password: '123',
        phone: '07000000'
      };
      const result = userSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });

  describe('productSchema', () => {
    it('should validate a correct product', () => {
      const validProduct = {
        name: 'Riz 5kg',
        price: 5000,
        stock: 10,
        category: 'Alimentaire',
        unit: 'sac',
        magasinId: 'magasin_123',
        storeId: 'magasin_123',
        images: ['https://example.com/image.jpg']
      };
      expect(productSchema.parse(validProduct)).toEqual(expect.objectContaining(validProduct));
    });

    it('should fail on negative price', () => {
      const invalidProduct = {
        name: 'Riz',
        price: -10,
        stock: 10,
        category: 'Alimentaire',
        unit: 'sac',
        magasinId: 'magasin_123',
        storeId: 'magasin_123',
        images: ['https://example.com/image.jpg']
      };
      expect(productSchema.safeParse(invalidProduct).success).toBe(false);
    });
  });
});
