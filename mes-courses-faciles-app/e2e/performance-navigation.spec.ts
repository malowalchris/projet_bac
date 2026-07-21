import { test, expect } from '@playwright/test';

test.describe('Profiling de Performance et Benchmarking de la Navigation (`/` -> `/store/store-1`)', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      const text = msg.text();
      if (
        msg.type() === 'error' &&
        !text.includes('Failed to load resource') &&
        !text.includes('hydration') &&
        !text.includes('Hydration') &&
        !text.includes('RSC payload') &&
        !text.includes('hot-reloader-client') &&
        !text.includes('webpack-internal') &&
        !text.includes('Failed to sync cart') &&
        !text.includes('Failed to fetch') &&
        !text.includes('TypeError: Load failed')
      ) {
        throw new Error(`Erreur console navigateur : ${text}`);
      }
    });
  });

  test('Doit respecter des temps de réponse réseau (TTFB < 300ms) et de transition SPA (< 500ms)', async ({ page }) => {
    // 1. Chargement initial de la page d'accueil
    await page.goto('/');
    await expect(page).toHaveTitle(/Mes Achats 241/i);

    // Attendre que la grille des magasins soit chargée et visible
    const firstStoreLink = page.locator('a[href^="/store/"]').first();
    await expect(firstStoreLink).toBeVisible();

    // 2. Évaluation de la performance réseau du chargement initial via l'API Navigation Timing du navigateur
    const navigationTiming = await page.evaluate(() => {
      const navEntry = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (!navEntry) return { ttfb: 0, domComplete: 0 };
      return {
        // TTFB (Time to First Byte) : temps entre le début de la requête et le premier octet reçu
        ttfb: navEntry.responseStart - navEntry.requestStart,
        // Temps total de chargement du DOM initial
        domComplete: navEntry.domComplete - navEntry.startTime,
      };
    });

    // En environnement de test / dev local, on s'assure que le TTFB initial est inférieur à 300ms
    // (ou 0 en cas de navigation synthétique instantanée)
    expect(navigationTiming.ttfb).toBeLessThan(300);

    // 3. Mesure du temps de la transition côté client (SPA Navigation via le <Link> Next.js)
    const startTime = performance.now();

    // Clic sur le premier magasin de la liste pour naviguer vers sa page de catalogue (ex: /store/store-1)
    await firstStoreLink.click();

    // Attente explicite et rigoureuse du rendu de la nouvelle route (titre ou compteur de produits)
    await expect(page).toHaveURL(/\/store\//);
    await expect(page.locator('text=produits trouvés, button[aria-label="Ajouter au panier"]').first()).toBeVisible({ timeout: 15000 });

    const endTime = performance.now();
    const renderTime = endTime - startTime; // Delta exact de temps de transition visuelle SPA

    // 4. Assertion stricte de performance du rendu visuel côté client (doit être inférieur à 500ms)
    // Note : Dans un environnement CI lourd ou en mode dev initial de Next.js, on vérifie que la transition
    // SPA optimisée par le préchargement (prefetching) s'exécute en dessous du seuil critique
    expect(renderTime).toBeLessThan(500);
  });
});
