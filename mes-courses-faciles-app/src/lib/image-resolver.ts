/**
 * image-resolver.ts
 * ─────────────────────────────────────────────────────────────
 * Single Source of Truth pour la résolution des URLs d'images.
 *
 * Règles de résolution (dans l'ordre de priorité) :
 *  1. path null / undefined / vide → placeholder SVG local
 *  2. chaîne JSON stringifiée (ex: '["url1","url2"]') → première URL extraite
 *  3. chemin local déjà valide  → retourné tel quel
 *  4. URL externe (http/https)  → retournée telle quelle
 *  5. Tout autre cas imprévu    → placeholder SVG local
 * ─────────────────────────────────────────────────────────────
 */

export type ImageType = 'store' | 'product' | 'avatar';

/** Chemins absolus des placeholders dans /public */
const PLACEHOLDERS: Record<ImageType, string> = {
  store:   '/images/store-placeholder.svg',
  product: '/images/product-placeholder.svg',
  avatar:  '/images/avatar-placeholder.svg',
};

/**
 * Résout un chemin d'image brut (tel que stocké en DB) en une URL
 * utilisable directement dans un attribut `src`.
 *
 * @param path  - Valeur brute issue de la base de données (peut être null,
 *                une URL, un chemin local, ou un JSON stringifié).
 * @param type  - Type d'asset pour choisir le bon placeholder de secours.
 * @returns     - Une URL absolue ou un chemin local toujours valide.
 */
export function resolveImageUrl(
  path: string | null | undefined,
  type: ImageType,
): string {
  const placeholder = PLACEHOLDERS[type];

  // ── Étape 1 : Guard null / undefined / chaîne vide ──────────
  if (!path) return placeholder;

  // ── Étape 2 : Nettoyage des espaces ─────────────────────────
  const cleaned = path.trim();
  if (!cleaned) return placeholder;

  // Fonction interne de validation stricte anti-données fictives
  const isValidUrlOrPath = (target: string): string | null => {
    // 1. Chemins locaux autorisés (/uploads/..., /images/...)
    if (target.startsWith('/uploads/') || target.startsWith('/images/') || (target.startsWith('/') && isLocalPath(target))) {
      return target;
    }
    // 2. URLs externes autorisées (Cloudinary, AWS S3, CDN propre, en excluant formellement picsum/unsplash)
    if (target.startsWith('http://') || target.startsWith('https://')) {
      try {
        const parsedUrl = new URL(target);
        const host = parsedUrl.hostname.toLowerCase();
        // Exclusion formelle de tout domaine de données fictives ou placeholder tiers
        if (host.includes('picsum.photos') || host.includes('unsplash.com') || host.includes('placehold.co')) {
          return null;
        }
        // URL valide vers notre CDN / Cloudinary / AWS S3 ou environnement de test
        return target;
      } catch {
        return null;
      }
    }
    return null;
  };

  // ── Étape 3 : Désérialisation JSON (stockage DAM en string) ────
  // Supporte les tableaux d'URLs : '["https://..."]'
  // Supporte les tableaux d'objets DAM : '[{"url": "https://...", "publicId": "..."}]'
  if (cleaned.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0];
        const urlStr = typeof first === 'string' ? first.trim() : (typeof first === 'object' && first !== null && 'url' in first ? String((first as any).url).trim() : '');
        if (urlStr) {
          const valid = isValidUrlOrPath(urlStr);
          if (valid) return valid;
        }
      }
      return placeholder;
    } catch {
      // Pas du JSON valide → on continue avec la chaîne brute
    }
  }

  // ── Étape 4 & 5 : Validation directe de l'URL ou chemin local ──
  const validDirect = isValidUrlOrPath(cleaned);
  if (validDirect) return validDirect;

  // ── Étape 6 : Cas imprévu ou invalide → placeholder local ─────
  return placeholder;
}

/**
 * Détermine si un chemin résolu pointe vers un asset local.
 * Utilisé pour décider si next/image doit être `unoptimized`.
 *
 * Next.js ne peut pas optimiser les SVG locaux : leur pipeline
 * interne génère une image vide pour les fichiers sans dimensions
 * intrinsèques. `unoptimized` bypasse ce pipeline et sert le fichier
 * brut depuis /public, ce qui est le comportement attendu.
 */
export function isLocalPath(url: string): boolean {
  return url.startsWith('/');
}
