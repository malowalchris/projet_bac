"use client";

/**
 * ImageWithLoader.tsx
 * ─────────────────────────────────────────────────────────────
 * Composant image universel. Responsabilités :
 *  • Appelle resolveImageUrl() pour garantir un src toujours valide.
 *  • Passe unoptimized=true pour les assets locaux (SVG sans dimensions).
 *  • Affiche un skeleton pendant le chargement.
 *  • Bascule sur le placeholder SVG local si l'image distante échoue.
 *  • Double protection : même si le placeholder échoue, affiche un
 *    fallback UI en pur CSS (icône + label).
 * ─────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import Image from 'next/image';
import { Skeleton } from './skeleton';
import { ShoppingBag, Store, User } from 'lucide-react';
import { resolveImageUrl, isLocalPath, type ImageType } from '@/lib/image-resolver';

// ── Icônes de fallback par type ──────────────────────────────
const FALLBACK_ICONS: Record<ImageType, React.ComponentType<{ size: number; className?: string }>> = {
  product: ShoppingBag,
  store:   Store,
  avatar:  User,
};

interface ImageWithLoaderProps {
  /** Valeur brute issue de la DB : peut être null, un JSON stringifié, une URL, etc. */
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** Type d'asset — détermine le placeholder et l'icône de fallback. */
  type?: ImageType;
  /** Mode de remplissage de l'objet CSS. Défaut : 'cover'. */
  objectFit?: 'cover' | 'contain';
  /** Priorité de chargement (LCP). */
  priority?: boolean;
  /** Tailles responsives pour le calcul srcset. */
  sizes?: string;
}

export const ImageWithLoader = ({
  src,
  alt,
  className = '',
  type = 'product',
  objectFit = 'cover',
  priority = false,
  sizes = '(max-width: 768px) 100vw, 50vw',
}: ImageWithLoaderProps) => {
  // ── Résolution de l'URL via le service centralisé ────────────
  const resolvedSrc = resolveImageUrl(src, type);
  const placeholder  = resolveImageUrl(null, type); // chemin du placeholder SVG

  const [displaySrc, setDisplaySrc]   = useState(resolvedSrc);
  const [isLoaded,   setIsLoaded]     = useState(false);
  const [hasFatalError, setFatalError] = useState(false);

  // L'image est "locale" si elle pointe vers /public (SVG) ou si on est en fallback sur un placeholder
  const isLocalSvg = displaySrc.toLowerCase().includes('.svg');
  const unoptimized = isLocalPath(displaySrc) || isLocalSvg || displaySrc === placeholder;

  // ── Gestionnaire d'erreur : 2 niveaux ───────────────────────
  // Niveau 1 : image distante échoue → on bascule sur le placeholder local
  // Niveau 2 : le placeholder local échoue aussi → on affiche le fallback CSS
  const handleError = () => {
    if (displaySrc !== placeholder) {
      // Niveau 1 : repli sur le placeholder local
      setDisplaySrc(placeholder);
      setIsLoaded(false); // réaffiche le skeleton le temps du rechargement
    } else {
      // Niveau 2 : même le placeholder est introuvable → fallback CSS
      setFatalError(true);
      setIsLoaded(true);
    }
  };

  const FallbackIcon = FALLBACK_ICONS[type];
  const safeAlt = alt || "Image illustrative";

  return (
    <div className={`relative h-full w-full overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800 ${className}`}>
      {/* Skeleton de chargement */}
      {!isLoaded && !hasFatalError && (
        <Skeleton className="absolute inset-0 z-10" />
      )}

      {hasFatalError ? (
        /* ── Fallback CSS ultime (aucune image disponible) ── */
        <div className="flex flex-col items-center justify-center text-slate-400 gap-1 select-none p-2 text-center w-full h-full">
          <FallbackIcon size={24} className="opacity-60" />
          <span className="text-[10px] font-bold uppercase tracking-wider line-clamp-1">
            {safeAlt.substring(0, 20)}
          </span>
        </div>
      ) : isLocalSvg ? (
        <Image
          src={displaySrc}
          alt={safeAlt}
          width={200}
          height={200}
          priority={priority}
          unoptimized={unoptimized}
          className={`transition-opacity duration-500 ${
            objectFit === 'contain' ? 'object-contain p-4' : 'object-cover'
          } ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
        />
      ) : (
        <Image
          src={displaySrc}
          alt={safeAlt}
          fill
          priority={priority}
          sizes={sizes}
          unoptimized={unoptimized}
          className={`transition-opacity duration-500 ${
            objectFit === 'contain' ? 'object-contain p-4' : 'object-cover'
          } ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
        />
      )}
    </div>
  );
};
