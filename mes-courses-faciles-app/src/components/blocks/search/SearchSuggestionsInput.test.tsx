import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchSuggestionsInput } from './SearchSuggestionsInput';

// Mock de next/navigation (useRouter et usePathname)
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/search',
}));

// Mock de next/image pour le rendu des suggestions
vi.mock('next/image', () => ({
  default: ({ src, alt, fill, priority, sizes, unoptimized, objectFit, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

describe('SearchSuggestionsInput — Composant interactif & asynchrone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      if (typeof url === 'string' && url.includes('/api/search/suggestions')) {
        return {
          ok: true,
          json: async () => ({
            stores: [
              { id: 'store-1', name: 'Supermarché Mbolo', logo: null, address: 'Louis' }
            ],
            products: [
              { id: 'prod-1', name: 'Riz Perfumé 5kg', price: 5000, images: '[]', category: 'Alimentaire', storeId: 'store-1', store: { name: 'Supermarché Mbolo' } }
            ]
          }),
        } as Response;
      }
      return { ok: false } as Response;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('doit s’afficher dans son état initial (champ vide sans bouton clear ni dropdown)', () => {
    render(<SearchSuggestionsInput placeholder="Chercher un produit..." />);

    const input = screen.getByPlaceholderText('Chercher un produit...');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('');

    // Le bouton de réinitialisation (X) ne doit pas être présent
    const clearButtons = screen.queryAllByRole('button');
    expect(clearButtons.length).toBe(0);

    // Le dropdown des suggestions ne doit pas être visible au départ
    expect(screen.queryByText('Magasins partenaires')).not.toBeInTheDocument();
  });

  it('doit passer en état actif, afficher le bouton clear et déclencher une recherche lors de la frappe', async () => {
    const user = userEvent.setup();
    render(<SearchSuggestionsInput placeholder="Chercher un produit..." />);

    const input = screen.getByPlaceholderText('Chercher un produit...');

    // Simulation de la frappe utilisateur
    await user.type(input, 'Riz');
    expect(input).toHaveValue('Riz');

    // Le bouton X (clear) doit maintenant être visible
    const buttonsAfterType = screen.getAllByRole('button');
    expect(buttonsAfterType.length).toBeGreaterThanOrEqual(1);

    // Attendre la résolution du debounce (250ms) et l'affichage des résultats de l'API
    await waitFor(() => {
      expect(screen.getByText('Magasins partenaires')).toBeInTheDocument();
      expect(screen.getByText('Supermarché Mbolo')).toBeInTheDocument();
      expect(screen.getByText('Riz Perfumé 5kg')).toBeInTheDocument();
    });

    // Clic sur une suggestion de produit doit rediriger via useRouter
    await user.click(screen.getByText('Riz Perfumé 5kg'));
    expect(mockPush).toHaveBeenCalledWith('/product/prod-1');
  });

  it('doit réinitialiser le champ lors du clic sur le bouton de suppression (X)', async () => {
    const user = userEvent.setup();
    render(<SearchSuggestionsInput placeholder="Chercher un produit..." />);

    const input = screen.getByPlaceholderText('Chercher un produit...');
    await user.type(input, 'Riz');
    expect(input).toHaveValue('Riz');

    // Trouver et cliquer sur le bouton de clear (X)
    const clearButton = screen.getAllByRole('button')[0];
    await user.click(clearButton);

    expect(input).toHaveValue('');
  });
});
