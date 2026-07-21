import { test, expect } from '@playwright/test';

async function loginAsClient(page: any) {
  await page.goto('/auth/login');
  await page.locator('input[name="email"]').fill('client@mcf.com');
  await page.locator('input[name="password"]').fill('Client12345');
  await page.click('button[type="submit"]:has-text("Se connecter")');

  try {
    await expect(page).toHaveURL('/', { timeout: 30000 });
    for (let i = 0; i < 20; i++) {
      const cookies = await page.context().cookies();
      if (cookies.some(c => c.name === 'mcf_jwt_session')) break;
      await page.waitForTimeout(250);
    }
  } catch (e) {
    const errorElement = page.locator('.bg-red-50');
    if (await errorElement.isVisible()) {
      throw new Error(`Erreur de connexion : ${await errorElement.innerText()}`);
    }
    throw e;
  }
}

test.describe('Parcours E2E : Tunnel d’Achat Complet (`/checkout`)', () => {
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

  test('Doit permettre d’ajouter un produit, vérifier le panier, remplir la livraison avec paiement Airtel Money et valider la commande', async ({ page, isMobile }) => {
    // 1. Connexion préalable du client pour pouvoir commander
    await loginAsClient(page);

    // 2. Navigation vers la page d’un magasin spécifique
    await page.goto('/store/store-1');
    await expect(page).toHaveURL(/\/store\/store-1/);

    // Si le magasin store-1 n'a pas d'article directement accessible, ou si on prend le premier bouton d'ajout au panier visible
    const addButton = page.locator('button[aria-label="Ajouter au panier"]').first();
    await expect(addButton).toBeVisible({ timeout: 15000 });
    await addButton.click();

    // 3. Navigation vers /cart et vérification du contenu du panier
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/cart/);

    // Vérifier qu'au moins un article est présent dans la liste et que le total est calculé
    const cartItems = page.locator('div.border-b, div.flex.items-center.justify-between').filter({ hasText: 'CFA' });
    await expect(cartItems.first()).toBeVisible();
    await expect(page.locator('text=Total à payer')).toBeVisible();

    // 4. Clic sur le bouton pour poursuivre vers /checkout
    const proceedToCheckoutBtn = page.locator('button:has-text("Passer la commande"), a[href="/checkout"]').first();
    await expect(proceedToCheckoutBtn).toBeVisible();
    await proceedToCheckoutBtn.click();
    await expect(page).toHaveURL(/\/checkout/);

    // 5. Remplissage du formulaire de livraison (nom, téléphone, adresse/quartier, indications)
    await page.locator('input#name').fill('Jean Dupont');
    await page.locator('input#phone').fill('+24107010203');
    await page.locator('input#district').fill('Quartier Louis');
    await page.locator('input#indications').fill('En face de la pharmacie centrale');

    // 6. Sélection d'un moyen de paiement local (ex: Airtel Money)
    const airtelMoneyOption = page.locator('label:has-text("Airtel Money")');
    await expect(airtelMoneyOption).toBeVisible();
    await airtelMoneyOption.click();

    // 7. Validation et soumission finale de la commande
    const submitButton = isMobile
      ? page.locator('button[type="submit"][form="checkout-form"]').last()
      : page.locator('button[type="submit"][form="checkout-form"]').first();

    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // 8. Vérification que l'URL finale pointe bien vers /checkout/success et affiche la confirmation
    await expect(page).toHaveURL(/\/checkout\/success/i, { timeout: 25000 });
    await expect(page.getByText('Commande validée !', { exact: false })).toBeVisible();
    await expect(page.getByText('Suivre ma commande', { exact: false })).toBeVisible();
  });
});
