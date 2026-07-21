/**
 * network-resilience.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Utilitaire de résilience réseau pour Next.js (App Router) & Webpack.
 * Conforme à la directive de l'architecture Zero-Trust (.antigravity) :
 * "Résilience Réseau : Gérer systématiquement l'annulation des requêtes réseau
 * lors du filtrage/recherche via AbortController et setTimeout (Debounce)
 * pour éviter les fuites de mémoire et les Race Conditions."
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Vérifie si une erreur capturée lors d'un appel fetch est due à une annulation
 * volontaire (AbortController) ou à une interruption réseau lors d'un démontage
 * de composant / navigation rapide.
 *
 * Évite les fausses alertes "Runtime TypeError: NetworkError when attempting to fetch resource."
 * dans les navigateurs (Safari, WebKit, Firefox, Chrome) et dans le dev overlay de Next.js.
 */
export function isAbortOrNetworkCancellationError(error: unknown): boolean {
  if (!error) return false;

  // Erreur standard DOMException / AbortError
  if (typeof error === 'object' && 'name' in error && (error.name === 'AbortError' || error.name === 'CanceledError')) {
    return true;
  }

  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('AbortError') ||
    msg.includes('aborted') ||
    msg.includes('NetworkError when attempting to fetch resource') ||
    msg.includes('Failed to fetch') ||
    msg.includes('signal is aborted without reason') ||
    msg.includes('The user aborted a request') ||
    msg.includes('ERR_CONNECTION_RESET') ||
    msg.includes('ERR_CANCELED')
  );
}
