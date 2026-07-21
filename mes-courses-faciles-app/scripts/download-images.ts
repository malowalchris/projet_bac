import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

interface ImageAsset {
  filename: string;
  url: string;
  title: string;
  color: string;
}

const STORES: ImageAsset[] = [
  {
    filename: 'store-mbolo.jpg',
    url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80',
    title: 'Mbolo Supermarché',
    color: '#1e3a8a'
  },
  {
    filename: 'store-angondje.jpg',
    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    title: 'Épicerie d Angondjé',
    color: '#047857'
  },
  {
    filename: 'store-akanda.jpg',
    url: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80',
    title: 'Supermarché Akanda',
    color: '#b45309'
  },
  {
    filename: 'store-mont-bouet.jpg',
    url: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=800&q=80',
    title: 'Marché du Mont-Bouët',
    color: '#991b1b'
  },
  {
    filename: 'store-louis.jpg',
    url: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=800&q=80',
    title: 'Épicerie Fine de Louis',
    color: '#4c1d95'
  }
];

const PRODUCTS: ImageAsset[] = [
  {
    filename: 'product-banane-plantain.jpg',
    url: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=800&q=80',
    title: 'Banane Plantain Mûre',
    color: '#ca8a04'
  },
  {
    filename: 'product-huile-palme.jpg',
    url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80',
    title: 'Huile de Palme Rouge',
    color: '#ea580c'
  },
  {
    filename: 'product-manioc.jpg',
    url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
    title: 'Bâtons de Manioc',
    color: '#854d0e'
  },
  {
    filename: 'product-poisson-fume.jpg',
    url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
    title: 'Capitaine Fumé du Gabon',
    color: '#78350f'
  },
  {
    filename: 'product-riz-parfume.jpg',
    url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
    title: 'Riz Parfumé Long Grain 5kg',
    color: '#15803d'
  },
  {
    filename: 'product-odika.jpg',
    url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80',
    title: 'Pain d Odika (Chocolat indigène)',
    color: '#451a03'
  },
  {
    filename: 'product-arachides.jpg',
    url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80',
    title: 'Pâte d Arachide Naturelle',
    color: '#9a3412'
  },
  {
    filename: 'product-piment-gabonais.jpg',
    url: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=800&q=80',
    title: 'Piment Gabonais Fort',
    color: '#dc2626'
  },
  {
    filename: 'product-feuilles-manioc.jpg',
    url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    title: 'Feuilles de Manioc (Saka-Saka)',
    color: '#166534'
  },
  {
    filename: 'product-poisson-frais.jpg',
    url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
    title: 'Rouge Frais de Port-Gentil',
    color: '#0369a1'
  },
  {
    filename: 'product-regab.jpg',
    url: 'https://images.unsplash.com/photo-1608270196042-a8690097e277?auto=format&fit=crop&w=800&q=80',
    title: 'Bière Régab 33cl',
    color: '#d97706'
  },
  {
    filename: 'product-eau-andza.jpg',
    url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=800&q=80',
    title: 'Eau Minérale Andza 1.5L',
    color: '#0284c7'
  },
  {
    filename: 'product-savon-palm.jpg',
    url: 'https://images.unsplash.com/photo-1607006483224-115fcf8e519e?auto=format&fit=crop&w=800&q=80',
    title: 'Savon de Toilette Huile de Palme',
    color: '#0d9488'
  },
  {
    filename: 'product-farine.jpg',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    title: 'Farine de Blé T55 1kg',
    color: '#a16207'
  },
  {
    filename: 'product-lait.jpg',
    url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=800&q=80',
    title: 'Lait Demi-Écrémé UHT 1L',
    color: '#1d4ed8'
  }
];

function downloadFile(url: string, destPath: string, maxRedirects = 5): Promise<boolean> {
  return new Promise((resolve) => {
    if (maxRedirects < 0) {
      resolve(false);
      return;
    }

    const client = url.startsWith('https://') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 MCF-Seeder/1.0' } }, (res) => {
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
    req.setTimeout(10000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function createFallbackSvg(destPath: string, title: string, color: string) {
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <rect width="800" height="600" fill="${color}"/>
  <rect width="760" height="560" x="20" y="20" rx="16" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" stroke-width="4"/>
  <circle cx="400" cy="240" r="70" fill="rgba(255,255,255,0.2)"/>
  <path d="M360 250 L400 210 L440 250 Z" fill="#ffffff"/>
  <text x="400" y="380" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="bold" fill="#ffffff" text-anchor="middle">${title}</text>
  <text x="400" y="430" font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="rgba(255,255,255,0.8)" text-anchor="middle">Mes Courses Faciles - Gabon</text>
</svg>`;
  // Au cas où le fichier est supposé être .jpg, on lui donne une extension ou on l'écrit tel quel (le navigateur ou resolveImageUrl gèrera)
  fs.writeFileSync(destPath, svgContent, 'utf-8');
}

async function main() {
  console.log('=== TÉLÉCHARGEMENT DES IMAGES DE SEEDING (CONTEXTE GABON) ===');
  const publicDir = path.join(process.cwd(), 'public', 'images', 'seed');
  const storesDir = path.join(publicDir, 'stores');
  const productsDir = path.join(publicDir, 'products');

  fs.mkdirSync(storesDir, { recursive: true });
  fs.mkdirSync(productsDir, { recursive: true });
  console.log(`✓ Dossiers créés / vérifiés:\n  - ${storesDir}\n  - ${productsDir}\n`);

  console.log('1. Téléchargement des images des Magasins...');
  for (const store of STORES) {
    const dest = path.join(storesDir, store.filename);
    const success = await downloadFile(store.url, dest);
    if (success) {
      console.log(`  ✓ [MAGASIN] ${store.filename} téléchargé (${store.title})`);
    } else {
      console.log(`  ⚠ [MAGASIN] ${store.filename} non accessible en ligne, génération d'un visuel de secours local`);
      createFallbackSvg(dest, store.title, store.color);
    }
  }

  console.log('\n2. Téléchargement des images des Produits...');
  for (const product of PRODUCTS) {
    const dest = path.join(productsDir, product.filename);
    const success = await downloadFile(product.url, dest);
    if (success) {
      console.log(`  ✓ [PRODUIT] ${product.filename} téléchargé (${product.title})`);
    } else {
      console.log(`  ⚠ [PRODUIT] ${product.filename} non accessible en ligne, génération d'un visuel de secours local`);
      createFallbackSvg(dest, product.title, product.color);
    }
  }

  console.log('\n✓ Toutes les images locales de seeding ont été préparées avec succès dans public/images/seed/');
}

main().catch(err => {
  console.error('Erreur lors du téléchargement des images:', err);
  process.exit(1);
});
