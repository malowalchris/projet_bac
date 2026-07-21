import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageWithLoader } from './ImageWithLoader';

// Mock de next/image pour déclencher manuellement onLoad et onError et filtrer les props spécifiques à Next
vi.mock('next/image', () => ({
  default: ({ src, alt, onLoad, onError, fill, priority, sizes, unoptimized, objectFit, ...props }: any) => (
    <img
      src={typeof src === 'string' ? src : src?.src || ''}
      alt={alt}
      onLoad={onLoad}
      onError={onError}
      data-testid="next-image"
      {...props}
    />
  ),
}));

describe('ImageWithLoader — Composant de résilience visuelle', () => {
  it('doit s’afficher avec l’URL distante fournie et montrer le Skeleton pendant le chargement', () => {
    const { container } = render(
      <ImageWithLoader
        src="https://example.com/photo-produit.jpg"
        alt="Riz au jasmin"
        type="product"
      />
    );

    const img = screen.getByTestId('next-image');
    expect(img).toHaveAttribute('src', 'https://example.com/photo-produit.jpg');
    expect(img).toHaveAttribute('alt', 'Riz au jasmin');

    // Au départ, isLoaded est false, donc le Skeleton est visible (classe animate-pulse dans le container)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();

    // Simulation du chargement réussi (onLoad)
    fireEvent.load(img);

    // Après chargement, le Skeleton disparaît
    expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
  });

  it('doit basculer vers le placeholder local (SVG) lors du déclenchement de onError (Niveau 1)', () => {
    render(
      <ImageWithLoader
        src="https://example.com/image-brisee.jpg"
        alt="Panier de légumes"
        type="product"
      />
    );

    const img = screen.getByTestId('next-image');
    expect(img).toHaveAttribute('src', 'https://example.com/image-brisee.jpg');

    // Déclenchement de l'erreur sur l'image distante
    fireEvent.error(img);

    // Le fallback local (placeholder SVG) doit prendre le relais
    expect(img).toHaveAttribute('src', '/images/product-placeholder.svg');
  });

  it('doit basculer vers le fallback pur CSS avec icône et label si même le placeholder échoue (Niveau 2)', () => {
    render(
      <ImageWithLoader
        src="https://example.com/image-brisee.jpg"
        alt="Magasin Général Libreville"
        type="store"
      />
    );

    const img = screen.getByTestId('next-image');

    // Erreur 1 : l'image distante échoue → bascule sur placeholder /images/store-placeholder.svg
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', '/images/store-placeholder.svg');

    // Erreur 2 : le placeholder local échoue aussi (ex: asset manquant) → fallback CSS
    fireEvent.error(img);

    // La balise img n'est plus rendue, le fallback CSS ultime prend la place
    expect(screen.queryByTestId('next-image')).not.toBeInTheDocument();
    expect(screen.getByText('Magasin Général Libr')).toBeInTheDocument(); // alt tronqué à 20 car
  });
});
