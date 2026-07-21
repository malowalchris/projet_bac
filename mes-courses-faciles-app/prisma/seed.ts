import { PrismaClient, Role, OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('=== DEBUT DE L\'ENRICHISSEMENT DE LA BASE DE DONNEES ===');

  // ========================================================
  // ÉTAPE 1 : Nettoyage Complet et Ordonné (Teardown)
  // ========================================================
  console.log('1. Nettoyage de la base de données (Zero-Trust)...');
  await prisma.ligneCommande.deleteMany({});
  await prisma.commande.deleteMany({});
  await prisma.articlePanier.deleteMany({});
  await prisma.produit.deleteMany({});
  await prisma.magasin.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.utilisateur.deleteMany({});
  console.log('✓ Tables nettoyées avec succès.');

  // ========================================================
  // ÉTAPE 2 : Seeding des Comptes Utilisateurs (Users)
  // ========================================================
  console.log('2. Génération des utilisateurs (Admins & Clients)...');
  
  // Hachage unique pour accélérer l'exécution du script
  const hashedPassword = await bcrypt.hash('password123', 10);
  const clientHashedPassword = await bcrypt.hash('Client12345', 10);
  const adminHashedPassword = await bcrypt.hash('Admin12345', 10);

  // Génération de 3 Administrateurs
  const adminsData = [
    { id: randomUUID(), nom: 'Christ APINDA', email: 'admin@mcf.com', motDePasse: adminHashedPassword, role: Role.ADMIN, telephone: '+241066000000' },
    { id: randomUUID(), nom: 'Jules Nguema', email: 'jules@mcf.com', motDePasse: hashedPassword, role: Role.ADMIN, telephone: '+241066112233' },
    { id: randomUUID(), nom: 'Sarah Bongo', email: 'sarah@mcf.com', motDePasse: hashedPassword, role: Role.ADMIN, telephone: '+241077112233' }
  ];

  // Génération de 15 Clients Réalistes
  const clientsData = [
    { id: randomUUID(), nom: 'Emma', email: 'client@mcf.com', motDePasse: clientHashedPassword, role: Role.CLIENT, telephone: '+241066554433', adresse: 'Libreville, Louis' },
    { id: randomUUID(), nom: 'Marie Mba', email: 'marie@mcf.com', motDePasse: hashedPassword, role: Role.CLIENT, telephone: '+241077112244', adresse: 'Libreville, Glass' },
    { id: randomUUID(), nom: 'Paul Obiang', email: 'paul@mcf.com', motDePasse: hashedPassword, role: Role.CLIENT, telephone: '+241077223355', adresse: 'Libreville, Nzeng-Ayong' },
    { id: randomUUID(), nom: 'Jean-Pierre Ndong', email: 'jean-pierre@mcf.com', motDePasse: hashedPassword, role: Role.CLIENT, telephone: '+241077334466', adresse: 'Libreville, Oloumi' },
    { id: randomUUID(), nom: 'Christian Nguema', email: 'christian@mcf.com', motDePasse: hashedPassword, role: Role.CLIENT, telephone: '+241066778899', adresse: 'Libreville, Angondjé' },
    { id: randomUUID(), nom: 'Sophie Bongo', email: 'sophie@mcf.com', motDePasse: hashedPassword, role: Role.CLIENT, telephone: '+241066889900', adresse: 'Libreville, Akébé' },
    { id: randomUUID(), nom: 'Marc Koumba', email: 'marc@mcf.com', motDePasse: hashedPassword, role: Role.CLIENT, telephone: '+241066223344', adresse: 'Libreville, Charbonnages' },
    { id: randomUUID(), nom: 'Sylvie Mombo', email: 'sylvie@mcf.com', motDePasse: hashedPassword, role: Role.CLIENT, telephone: '+241066334455', adresse: 'Libreville, Louis' },
    { id: randomUUID(), nom: 'Alain Moussavou', email: 'alain@mcf.com', motDePasse: hashedPassword, role: Role.CLIENT, telephone: '+241066445566', adresse: 'Libreville, Oloumi' },
    { id: randomUUID(), nom: 'Patricia Makaya', email: 'patricia@mcf.com', motDePasse: hashedPassword, role: Role.CLIENT, telephone: '+241077445577', adresse: 'Libreville, Lalala' },
    { id: randomUUID(), nom: 'Charles Boulingui', email: 'charles@mcf.com', motDePasse: hashedPassword, role: Role.CLIENT, telephone: '+241077556688', adresse: 'Libreville, Glass' },
    { id: randomUUID(), nom: 'Florence Kombila', email: 'florence@mcf.com', motDePasse: hashedPassword, role: Role.CLIENT, telephone: '+241077667799', adresse: 'Libreville, Nzeng-Ayong' },
    { id: randomUUID(), nom: 'Eric Bekale', email: 'eric@mcf.com', motDePasse: hashedPassword, role: Role.CLIENT, telephone: '+241066998877', adresse: 'Libreville, Angondjé' },
    { id: randomUUID(), nom: 'Valerie Angoue', email: 'valerie@mcf.com', motDePasse: hashedPassword, role: Role.CLIENT, telephone: '+241066887766', adresse: 'Libreville, Akébé' },
    { id: randomUUID(), nom: 'Sandrine Ntsame', email: 'sandrine@mcf.com', motDePasse: hashedPassword, role: Role.CLIENT, telephone: '+241077889911', adresse: 'Libreville, Charbonnages' }
  ];

  await prisma.utilisateur.createMany({
    data: [...adminsData, ...clientsData]
  });

  const emmaUser = clientsData.find(c => c.email === 'client@mcf.com')!;
  const createdClients = clientsData;
  console.log(`✓ ${adminsData.length} Administrateurs et ${clientsData.length} Clients insérés (dont Emma).`);

  // ========================================================
  // ÉTAPE 3 : Seeding des Magasins (Stores)
  // ========================================================
  console.log('3. Génération des magasins partenaires (10 magasins)...');

  const storeDefinitions = [
    { id: randomUUID(), name: 'Mbolo Supermarché', address: 'Boulevard Triomphal, Libreville', district: 'Mbolo', phone: '+24111740001', logo: '/images/seed/stores/store-mbolo.jpg', description: 'Le plus grand supermarché historique de Libreville. Alimentation générale, fruits et légumes.', isActive: true, isDeleted: false, category: 'Alimentaire' },
    { id: randomUUID(), name: "Épicerie d'Angondjé", address: 'Carrefour Angondjé, Libreville', district: 'Angondjé', phone: '+24111760002', logo: '/images/seed/stores/store-angondje.jpg', description: 'Produits frais, épicerie fine et produits locaux de qualité.', isActive: true, isDeleted: false, category: 'Alimentaire' },
    { id: randomUUID(), name: 'Supermarché Akanda', address: 'Avorbam, Akanda', district: 'Akanda', phone: '+24111720022', logo: '/images/seed/stores/store-akanda.jpg', description: 'Le supermarché moderne d Akanda pour vos courses quotidiennes au meilleur prix.', isActive: true, isDeleted: false, category: 'Alimentaire' },
    { id: randomUUID(), name: 'Marché du Mont-Bouët', address: 'Centre-ville, Libreville', district: 'Mont-Bouët', phone: '+24111760021', logo: '/images/seed/stores/store-mont-bouet.jpg', description: 'Le cœur battant du commerce gabonais : produits locaux, poissons, épices et tubercules.', isActive: true, isDeleted: false, category: 'Alimentaire' },
    { id: randomUUID(), name: 'Épicerie Fine de Louis', address: 'Carrefour Louis, Libreville', district: 'Louis', phone: '+24111780023', logo: '/images/seed/stores/store-louis.jpg', description: 'Épicerie fine, légumes locaux de sélection et produits frais de saison.', isActive: true, isDeleted: false, category: 'Alimentaire' },
    { id: randomUUID(), name: 'Hygiène & Beauté MCF', address: 'Carrefour Angondjé, Libreville', district: 'Angondjé', phone: '+24111700024', logo: '/images/seed/stores/store-angondje.jpg', description: 'Produits de douche, soins corporels, capillaires et bien-être.', isActive: true, isDeleted: false, category: 'Hygiène' },
    { id: randomUUID(), name: 'San Gel Surgelés', address: 'Avenue de Cointet, Libreville', district: 'Glass', phone: '+24111760025', logo: '/images/seed/stores/store-akanda.jpg', description: 'Le spécialiste des surgelés, viandes, poissons et crustacés de Port-Gentil.', isActive: true, isDeleted: false, category: 'Alimentaire' },
    { id: randomUUID(), name: 'Bébé & Maman Libreville', address: 'Avenue des Mines, Libreville', district: 'Oloumi', phone: '+24111750026', logo: '/images/seed/stores/store-louis.jpg', description: 'Couches, laits de croissance, petits pots et accessoires pour votre bébé.', isActive: true, isDeleted: false, category: 'Bébé' },
    { id: randomUUID(), name: 'Supergros Grossiste', address: 'Zone Industrielle Oloumi, Libreville', district: 'Oloumi', phone: '+24111710027', logo: '/images/seed/stores/store-mont-bouet.jpg', description: 'Achat en gros de riz, huiles, pâtes et produits d alimentation générale.', isActive: true, isDeleted: false, category: 'Alimentaire' },
    { id: randomUUID(), name: 'Clean Gabon', address: 'Carrefour Akébé, Libreville', district: 'Akébé', phone: '+24111790028', logo: '/images/seed/stores/store-mbolo.jpg', description: 'Lessives, produits d entretien et tout le nécessaire de nettoyage de maison.', isActive: true, isDeleted: false, category: 'Nettoyage' }
  ];

  const storesData = storeDefinitions.map(({ category, ...s }) => ({
    id: s.id,
    nom: s.name,
    adresse: s.address,
    quartier: s.district,
    telephone: s.phone,
    logo: s.logo,
    description: s.description,
    estActif: s.isActive,
    estSupprime: s.isDeleted
  }));
  await prisma.magasin.createMany({
    data: storesData
  });

  const createdStores = storeDefinitions;
  console.log(`✓ ${createdStores.length} Magasins insérés dans la base de données.`);

  // ========================================================
  // ÉTAPE 4 : Seeding du Catalogue Produits (Product)
  // ========================================================
  console.log('4. Génération du catalogue produits (15 à 20 produits par magasin)...');
  
  const productTemplates: Record<string, { name: string; description: string; basePrice: number; unit: string; images: string[] }[]> = {
    'Alimentaire': [
      { name: 'Banane Plantain Mûre (Régime)', description: 'Régime de bananes plantains mûres et douces, idéales pour alloco, banane pilée ou friture.', basePrice: 3500, unit: 'régime', images: ['/images/seed/products/product-banane-plantain.jpg'] },
      { name: 'Huile de Palme Rouge 1L', description: 'Huile de palme naturelle non raffinée du Gabon, riche en vitamine A pour le nyembwe et sauces traditionnelles.', basePrice: 1800, unit: 'bouteille', images: ['/images/seed/products/product-huile-palme.jpg'] },
      { name: 'Bâtons de Manioc du Haut-Ogooué (x5)', description: 'Lot de 5 bâtons de manioc traditionnels fermes et savoureux.', basePrice: 2000, unit: 'paquet', images: ['/images/seed/products/product-manioc.jpg'] },
      { name: 'Capitaine Fumé du Gabon', description: 'Morceau de poisson capitaine fraîchement fumé au bois tropical, parfait pour les bouillons et sauces.', basePrice: 4500, unit: 'pièce', images: ['/images/seed/products/product-poisson-fume.jpg'] },
      { name: 'Riz Parfumé Long Grain 5kg', description: 'Riz blanc long grain parfumé de qualité supérieure pour accompagner vos plats en sauce.', basePrice: 4800, unit: 'sac', images: ['/images/seed/products/product-riz-parfume.jpg'] },
      { name: 'Pain d Odika (Chocolat indigène)', description: 'Bloc d odika traditionnel en poudre ou pain pour épaissir et aromatiser le poulet ou poisson.', basePrice: 2500, unit: 'pièce', images: ['/images/seed/products/product-odika.jpg'] },
      { name: 'Pâte d Arachide Naturelle 500g', description: 'Pâte d arachide 100% pure et onctueuse pour sauce mafé ou poulet aux arachides.', basePrice: 2200, unit: 'pot', images: ['/images/seed/products/product-arachides.jpg'] },
      { name: 'Piment Gabonais Fort en Pot', description: 'Purée de piment habanero local aux épices gabonaises, relevé et parfumé.', basePrice: 1500, unit: 'pot', images: ['/images/seed/products/product-piment-gabonais.jpg'] },
      { name: 'Feuilles de Manioc Pilées (Saka-Saka)', description: 'Sachet de feuilles de manioc fraîches pilées prêtes à cuire à l huile de palme ou pâte d arachide.', basePrice: 1200, unit: 'sachet', images: ['/images/seed/products/product-feuilles-manioc.jpg'] },
      { name: 'Rouge Frais de Port-Gentil (Lutjan 1.5kg)', description: 'Poisson rouge entier frais pêché au large de Port-Gentil, nettoyé et prêt pour la braise.', basePrice: 7500, unit: 'pièce', images: ['/images/seed/products/product-poisson-frais.jpg'] },
      { name: 'Farine de Blé T55 1kg', description: 'Farine blanche fine idéale pour la pâtisserie, les beignets traditionnels et le pain.', basePrice: 750, unit: 'paquet', images: ['/images/seed/products/product-farine.jpg'] }
    ],
    'Boissons': [
      { name: 'Bière Régab (canette 33cl)', description: 'Bière blonde gabonaise emblématique et rafraîchissante, brassée au Gabon.', basePrice: 600, unit: 'canette', images: ['/images/seed/products/product-regab.jpg'] },
      { name: 'Eau Minérale Naturelle Andza 1.5L', description: 'Eau minérale naturelle puisée à la source d Olénga au Gabon, pure et équilibrée.', basePrice: 600, unit: 'bouteille', images: ['/images/seed/products/product-eau-andza.jpg'] },
      { name: 'Lait Demi-Écrémé UHT 1L', description: 'Lait de vache demi-écrémé stérilisé UHT, riche en calcium pour toute la famille.', basePrice: 950, unit: 'brique', images: ['/images/seed/products/product-lait.jpg'] }
    ],
    'Hygiène': [
      { name: 'Savon de Toilette à l Huile de Palme', description: 'Savon végétal doux et hydratant enrichi en huile de palme et extraits naturels du Gabon.', basePrice: 850, unit: 'pièce', images: ['/images/seed/products/product-savon-palm.jpg'] }
    ],
    'Nettoyage': [
      { name: 'Lessive Liquide Multi-Usages 3L', description: 'Lessive concentrée efficace contre les taches difficiles, parfum fraîcheur intense.', basePrice: 6500, unit: 'bidon', images: ['/images/seed/products/product-savon-palm.jpg'] }
    ],
    'Bébé': [
      { name: 'Couches Bébé Confort Taille 4 (x50)', description: 'Couches douces et ultra-absorbantes adaptées au climat tropical, protection 12h.', basePrice: 9500, unit: 'paquet', images: ['/images/seed/products/product-lait.jpg'] }
    ]
  };

  const productsToCreate: any[] = [];

  for (const store of createdStores) {
    // Déterminer les catégories de produits à ajouter à ce magasin
    let categoriesToSeed: string[] = [];
    if (['Mbolo Supermarché', "Épicerie d'Angondjé", 'Supermarché Akanda'].includes(store.name)) {
      categoriesToSeed = ['Alimentaire', 'Boissons', 'Hygiène', 'Nettoyage', 'Bébé'];
    } else if (store.name === 'Marché du Mont-Bouët' || store.name === 'Épicerie Fine de Louis' || store.name === 'San Gel Surgelés' || store.name === 'Supergros Grossiste') {
      categoriesToSeed = ['Alimentaire', 'Boissons'];
    } else if (store.name === 'Bébé & Maman Libreville') {
      categoriesToSeed = ['Bébé', 'Hygiène'];
    } else if (store.name === 'Hygiène & Beauté MCF') {
      categoriesToSeed = ['Hygiène'];
    } else if (store.name === 'Clean Gabon') {
      categoriesToSeed = ['Nettoyage'];
    } else {
      categoriesToSeed = ['Alimentaire'];
    }

    for (const cat of categoriesToSeed) {
      const templates = productTemplates[cat] || [];
      for (const temp of templates) {
        // Variation de prix (+/- 12%)
        const priceVariation = 0.88 + Math.random() * 0.24;
        const finalPrice = Math.round((temp.basePrice * priceVariation) / 50) * 50; // arrondi à 50 FCFA
        
        // Stock : 15% de chance de rupture de stock (0), sinon entre 10 et 200 unités
        const isOutOfStock = Math.random() < 0.15;
        const stock = isOutOfStock ? 0 : Math.floor(10 + Math.random() * 190);

        productsToCreate.push({
          id: randomUUID(),
          nom: temp.name,
          description: temp.description,
          prix: finalPrice,
          stock: stock,
          unite: temp.unit,
          categorie: cat,
          images: JSON.stringify(temp.images),
          magasinId: store.id,
          estActif: true,
          estSupprime: false
        });
      }
    }
  }

  // Insertion en masse via createMany pour optimiser les performances de TiDB
  await prisma.produit.createMany({
    data: productsToCreate
  });

  // Récupération de tous les produits créés
  const allProducts = await prisma.produit.findMany({});
  console.log(`✓ ${allProducts.length} Produits insérés dans le catalogue.`);

  // ========================================================
  // ÉTAPE 5 : Seeding des Commandes (Orders & OrderItem)
  // ========================================================
  console.log('5. Génération de l\'historique des commandes (50 commandes)...');
  
  // Associer les produits par magasin pour simuler des commandes cohérentes (panier mono-boutique)
  const storeProductsMap = new Map<string, any[]>();
  for (const p of allProducts) {
    if (!storeProductsMap.has(p.magasinId)) {
      storeProductsMap.set(p.magasinId, []);
    }
    storeProductsMap.get(p.magasinId)!.push(p);
  }

  const activeStoreIds = Array.from(storeProductsMap.keys());
  const allStatuses = [OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.CANCELLED];
  const paymentMethods = ['cash', 'airtel', 'moov', 'card'];

  const ordersToCreate: any[] = [];
  const orderItemsToCreate: any[] = [];

  // 1. Commandes Spécifiques pour Emma (client@mcf.com) pour valider l'UI ActiveOrderTracker et l'Historique
  if (emmaUser) {
    console.log('Génération des commandes tests critiques pour Emma...');

    // A. Une commande active (PAID) très récente chez Mbolo Supermarché pour le ActiveOrderTracker
    const mboloStore = createdStores.find(s => s.name === 'Mbolo Supermarché') || createdStores[0];
    const mboloProducts = storeProductsMap.get(mboloStore.id)!;
    
    // Panier de 2 produits
    const emmaActiveItems = [
      { product: mboloProducts[0], qty: 2 },
      { product: mboloProducts[1], qty: 1 }
    ];

    const deliveryFee = 2000;
    let itemsTotal = 0;
    const activeOrderId = randomUUID();
    
    for (const item of emmaActiveItems) {
      itemsTotal += item.product.prix * item.qty;
      orderItemsToCreate.push({
        id: randomUUID(),
        commandeId: activeOrderId,
        produitId: item.product.id,
        quantite: item.qty,
        prixUnitaire: item.product.prix
      });
    }

    const activeOrderDate = new Date(); // aujourd'hui
    ordersToCreate.push({
      id: activeOrderId,
      utilisateurId: emmaUser.id,
      magasinId: mboloStore.id,
      total: itemsTotal + deliveryFee,
      fraisLivraison: deliveryFee,
      statut: OrderStatus.PAID,
      methodePaiement: 'airtel',
      adresseLivraison: 'Emma - +241066554433 - Libreville, quartier Louis, Villa MCF',
      creeLe: activeOrderDate,
      misAJourLe: activeOrderDate
    });

    // B. Trois commandes passées (DELIVERED) plus anciennes pour l'onglet historique du profil
    for (let k = 0; k < 3; k++) {
      const randomStoreId = activeStoreIds[k % activeStoreIds.length];
      const storeProducts = storeProductsMap.get(randomStoreId)!;
      const product = storeProducts[Math.floor(Math.random() * storeProducts.length)];
      
      const qty = Math.floor(Math.random() * 2) + 1;
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - (5 + k * 8)); // il y a 5, 13 et 21 jours
      const orderId = randomUUID();

      ordersToCreate.push({
        id: orderId,
        utilisateurId: emmaUser.id,
        magasinId: randomStoreId,
        total: (product.prix * qty) + deliveryFee,
        fraisLivraison: deliveryFee,
        statut: OrderStatus.DELIVERED,
        methodePaiement: paymentMethods[k % paymentMethods.length],
        adresseLivraison: 'Emma - +241066554433 - Libreville, quartier Louis, Villa MCF',
        creeLe: orderDate,
        misAJourLe: orderDate
      });

      orderItemsToCreate.push({
        id: randomUUID(),
        commandeId: orderId,
        produitId: product.id,
        quantite: qty,
        prixUnitaire: product.prix
      });
    }
    console.log('✓ Commandes tests d\'Emma préparées.');
  }

  // 2. Commandes Aléatoires Restantes pour atteindre au moins 50 commandes totales
  const ordersNeeded = 50 - ordersToCreate.length;
  console.log(`Génération de ${ordersNeeded} autres commandes aléatoires...`);

  for (let i = 0; i < ordersNeeded; i++) {
    // Pick a random client
    const client = createdClients[i % createdClients.length];
    
    // Pick a random store
    const storeId = activeStoreIds[Math.floor(Math.random() * activeStoreIds.length)];
    const storeProducts = storeProductsMap.get(storeId)!;

    // Pick 1 to 3 random products from this store
    const itemCount = Math.floor(Math.random() * 3) + 1;
    const selectedProducts = [];
    const tempStoreProducts = [...storeProducts];

    for (let j = 0; j < itemCount && tempStoreProducts.length > 0; j++) {
      const randIdx = Math.floor(Math.random() * tempStoreProducts.length);
      selectedProducts.push(tempStoreProducts.splice(randIdx, 1)[0]);
    }

    const deliveryFee = 2000;
    let itemsTotal = 0;
    const orderId = randomUUID();

    for (const p of selectedProducts) {
      const qty = Math.floor(Math.random() * 2) + 1;
      itemsTotal += p.prix * qty;
      orderItemsToCreate.push({
        id: randomUUID(),
        commandeId: orderId,
        produitId: p.id,
        quantite: qty,
        prixUnitaire: p.prix
      });
    }

    // Random status
    const status = allStatuses[Math.floor(Math.random() * allStatuses.length)];
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

    // Random date over the last 90 days
    const daysAgo = Math.floor(Math.random() * 90);
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - daysAgo);

    ordersToCreate.push({
      id: orderId,
      utilisateurId: client.id,
      magasinId: storeId,
      total: itemsTotal + deliveryFee,
      fraisLivraison: deliveryFee,
      statut: status,
      methodePaiement: paymentMethod,
      adresseLivraison: `${client.nom} - ${client.telephone} - ${client.adresse || 'Libreville, Gabon'}`,
      creeLe: orderDate,
      misAJourLe: orderDate
    });
  }

  // Insertion en masse dans l'ordre pour respecter l'intégrité référentielle
  await prisma.commande.createMany({
    data: ordersToCreate
  });
  await prisma.ligneCommande.createMany({
    data: orderItemsToCreate
  });

  console.log(`✓ ${ordersToCreate.length} Commandes simulées au total.`);

  // ========================================================
  // ÉTAPE 6 : Seeding des Notifications Administrateur
  // ========================================================
  console.log('6. Génération des notifications d\'administration...');
  
  const notificationAlerts = [
    { type: 'ORDER', message: 'Nouvelle commande reçue chez Mbolo Supermarché.', reference: 'notif-order-mbolo-1' },
    { type: 'STOCK', message: 'Alerte : Stock faible pour "Riz Parfumé Premium 5kg" chez Mbolo Supermarché.', reference: 'notif-stock-mbolo-1' },
    { type: 'ORDER', message: 'Nouvelle commande payée en attente chez Hygiène & Beauté MCF.', reference: 'notif-order-hygiene-1' },
    { type: 'STOCK', message: 'Rupture de stock signalée pour "Couches Bébé Taille 4 (x50)" chez Bébé & Maman Libreville.', reference: 'notif-stock-bebe-1' },
    { type: 'ORDER', message: 'Commande annulée par l\'acheteur Paul Obiang.', reference: 'notif-order-cancel-1' }
  ];

  const notificationsToCreate = notificationAlerts.map(alert => ({
    id: randomUUID(),
    type: alert.type,
    message: alert.message,
    reference: alert.reference,
    estLu: false
  }));

  await prisma.notification.createMany({
    data: notificationsToCreate
  });

  console.log('✓ Notifications administratives créées.');
  console.log('=== SEEDING TERMINE AVEC SUCCES ===');
}

main()
  .catch((e) => {
    console.error('Erreur durant le seeding de la base de données :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
