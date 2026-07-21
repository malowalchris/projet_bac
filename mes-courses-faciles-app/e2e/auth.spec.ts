import { test, expect } from '@playwright/test';

test.describe('Parcours E2E : Flux d’Authentification (`/`)', () => {
  test.beforeEach(async ({ page }) => {
    // Filtrage des erreurs de console bénignes ou liées à l'environnement de démo
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

  test('Doit permettre à un utilisateur de se connecter depuis la page d’accueil et de voir son espace client', async ({ page, isMobile }) => {
    // 1. Navigation vers la page d’accueil
    await page.goto('/');
    await expect(page).toHaveTitle(/Mes Achats 241/i);

    // 2. Simulation du clic sur le bouton de connexion pour faire apparaître la modale
    if (isMobile) {
      // Sur mobile, ouvrir le menu latéral d'abord
      const menuButton = page.locator('button:has(.lucide-menu), button[aria-label*="menu" i]').first();
      await expect(menuButton).toBeVisible();
      await menuButton.click();

      const loginLinkMobile = page.locator('a[href*="auth=login"]');
      await expect(loginLinkMobile).toBeVisible();
      await loginLinkMobile.click();
    } else {
      // Sur desktop, le bouton Connexion est directement dans la barre de navigation
      const loginLinkDesktop = page.locator('a[href*="auth=login"]');
      await expect(loginLinkDesktop).toBeVisible();
      await loginLinkDesktop.click();
    }

    // Vérifier l'apparition de la modale d'authentification
    const authForm = page.locator('form:has(input[name="email"])');
    await expect(authForm).toBeVisible();

    // 3. Saisie d’identifiants valides
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]:has-text("Se connecter")');

    await emailInput.fill('client@mcf.com');
    await passwordInput.fill('Client12345');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // 4. Vérification visuelle que l’interface se met à jour
    // - La modale d'authentification doit disparaître
    await expect(authForm).not.toBeVisible({ timeout: 15000 });

    // - L'espace client / bouton de déconnexion doit apparaître dans l'interface
    const userLoggedInIndicator = page.locator('button[title="Se déconnecter"], a[href="/profile"], text=Mon Compte').first();
    await expect(userLoggedInIndicator).toBeVisible({ timeout: 15000 });
  });
});
