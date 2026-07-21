import React from 'react';
import { BackButton } from './BackButton';

interface PageHeaderProps {
  /** Titre principal de la page (rendu en <h1>) */
  title?: string;
  /** Sous-titre optionnel affiché sous le titre */
  subtitle?: string;
  /** Si défini, affiche un <BackButton> pointant vers cette URL */
  backHref?: string;
  /** Texte affiché dans le BackButton. Par défaut : "Retour" */
  backLabel?: string;
  /** Zone d'actions à droite (bouton Déconnexion, compteur, etc.) */
  children?: React.ReactNode;
  /** Classes CSS supplémentaires pour la conteneur principal */
  className?: string;
}

/**
 * En-tête standardisé pour toutes les pages secondaires du Front-Office.
 * Assure la cohérence visuelle entre /favorites, /profile, /store, /product.
 *
 * Structure :
 * ┌──────────────────────────────────────────────────────┐
 * │ [← Retour]  Titre de la page      [actions enfants]  │
 * │             Sous-titre optionnel                      │
 * └──────────────────────────────────────────────────────┘
 */
export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = 'Retour',
  children,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}>
      {/* Zone gauche : bouton retour + titre */}
      <div className="flex items-center gap-4 min-w-0">
        {backHref && (
          <BackButton
            href={backHref}
            label={backLabel}
            className="shrink-0"
          />
        )}
        {title && (
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Zone droite : actions optionnelles */}
      {children && (
        <div className="shrink-0 flex items-center gap-3">
          {children}
        </div>
      )}
    </div>
  );
}
