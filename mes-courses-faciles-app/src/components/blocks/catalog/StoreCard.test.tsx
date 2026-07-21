import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StoreCard } from './StoreCard';

// Mock de next/link pour éviter les erreurs de contexte de routage RSC/Next
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props} data-testid="next-link">
      {children}
    </a>
  ),
}));

// Mock de next/image pour tester le rendu de l'image de façon isolée
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

describe('StoreCard — Composant de présentation pure', () => {
  const defaultProps = {
    id: 'store-101',
    name: 'Supermarché Mbolo',
    image: 'https://example.com/mbolo.jpg',
    location: 'Quartier Louis, Libreville',
    rating: 4.8,
    deliveryTime: '20-30 min',
    categories: ['Alimentaire', 'Frais', 'Boissons'],
  };

  it('doit s’afficher correctement avec les props nominales en mode standard', () => {
    render(<StoreCard {...defaultProps} />);

    // Vérification du nom du magasin
    expect(screen.getByText('Supermarché Mbolo')).toBeInTheDocument();

    // Vérification de l'adresse / localisation
    expect(screen.getByText('Quartier Louis, Libreville')).toBeInTheDocument();

    // Vérification de la note (rating)
    expect(screen.getByText('4.8')).toBeInTheDocument();

    // Vérification du temps de livraison
    expect(screen.getByText('20-30 min')).toBeInTheDocument();

    // Vérification des catégories jointes par une puce (•)
    expect(screen.getByText('Alimentaire • Frais • Boissons')).toBeInTheDocument();

    // Vérification du lien vers la page de détail du magasin
    const link = screen.getByTestId('next-link');
    expect(link).toHaveAttribute('href', '/store/store-101');
  });

  it('doit s’afficher correctement en mode vedette (isFeatured=true)', () => {
    render(<StoreCard {...defaultProps} isFeatured={true} />);

    expect(screen.getByText('Partenaire Vedette')).toBeInTheDocument();
    expect(screen.getByText('Supermarché Mbolo')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
  });

  it('doit utiliser le placeholder de magasin si la prop image est null ou absente', () => {
    render(<StoreCard {...defaultProps} image={null} />);

    const img = screen.getByTestId('next-image');
    expect(img).toHaveAttribute('src', '/images/store-placeholder.svg');
  });
});
