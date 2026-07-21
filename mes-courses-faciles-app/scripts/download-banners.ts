import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

interface BannerAsset {
  filename: string;
  url: string;
  title: string;
  color: string;
}

const BANNERS: BannerAsset[] = [
  {
    filename: 'banner-supermarket.jpg',
    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80',
    title: 'Rayon Supermarché Libreville',
    color: '#065f46'
  },
  {
    filename: 'banner-fresh.jpg',
    url: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1600&q=80',
    title: 'Étalage Fruits et Légumes Frais',
    color: '#b45309'
  },
  {
    filename: 'banner-delivery.jpg',
    url: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=1600&q=80',
    title: 'Livraison Express Courses',
    color: '#1e3a8a'
  },
  {
    filename: 'banner-payment.jpg',
    url: 'https://images.unsplash.com/photo-1556742049-0a67d55febc4?auto=format&fit=crop&w=1600&q=80',
    title: 'Paiement Sécurisé Mobile Money',
    color: '#312e81'
  }
];

function downloadFile(url: string, destPath: string, maxRedirects = 5): Promise<boolean> {
  return new Promise((resolve) => {
    if (maxRedirects < 0) {
      resolve(false);
      return;
    }

    const client = url.startsWith('https://') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 MCF-BannerDownloader/1.0' } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith('/')) {
          const parsed = new URL(url);
          redirectUrl = `${parsed.protocol}//${parsed.host}${redirectUrl}`;
        }
        downloadFile(redirectUrl, destPath, maxRedirects - 1).then(resolve);
        return;
      }

      if (res.statusCode !== 200) {
        res.resume();
        resolve(false);
        return;
      }

      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(true);
      });
      fileStream.on('error', () => {
        fs.unlink(destPath, () => {});
        resolve(false);
      });
    });

    req.on('error', () => resolve(false));
    req.setTimeout(15000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function createFallbackSvg(destPath: string, title: string, color: string) {
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="100%" height="100%">
  <rect width="1600" height="900" fill="${color}"/>
  <rect width="1520" height="820" x="40" y="40" rx="32" fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.2)" stroke-width="6"/>
  <circle cx="800" cy="360" r="110" fill="rgba(255,255,255,0.15)"/>
  <path d="M740 380 L800 320 L860 380 Z" fill="#ffffff"/>
  <text x="800" y="560" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="black" fill="#ffffff" text-anchor="middle">${title}</text>
  <text x="800" y="630" font-family="system-ui, -apple-system, sans-serif" font-size="32" fill="rgba(255,255,255,0.85)" text-anchor="middle">Mes Courses Faciles - Libreville, Gabon</text>
</svg>`;
  fs.writeFileSync(destPath, svgContent, 'utf-8');
}

async function main() {
  console.log('=== TÉLÉCHARGEMENT DES BANNIÈRES HERO (CARROUSEL D ACCUEIL) ===');
  const heroDir = path.join(process.cwd(), 'public', 'images', 'hero');
  fs.mkdirSync(heroDir, { recursive: true });
  console.log(`✓ Dossier créé / vérifié: ${heroDir}\n`);

  for (const banner of BANNERS) {
    const dest = path.join(heroDir, banner.filename);
    const success = await downloadFile(banner.url, dest);
    if (success) {
      console.log(`  ✓ [BANNIÈRE] ${banner.filename} téléchargée (${banner.title})`);
    } else {
      console.log(`  ⚠ [BANNIÈRE] ${banner.filename} non accessible en ligne, génération d un visuel de secours haute qualité`);
      createFallbackSvg(dest, banner.title, banner.color);
    }
  }

  console.log('\n✓ Toutes les images de bannières sont physiquement disponibles dans public/images/hero/');
}

main().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
