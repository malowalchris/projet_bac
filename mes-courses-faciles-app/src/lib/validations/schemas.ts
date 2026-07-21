import { z } from 'zod';

export const utilisateurSchema = z.preprocess(
  (data: any) => {
    if (!data || typeof data !== 'object') return data;
    return {
      ...data,
      nom: data.nom || data.name,
      name: data.nom || data.name,
      email: data.email,
      motDePasse: data.motDePasse || data.password,
      password: data.motDePasse || data.password,
      telephone: data.telephone || data.phone,
      phone: data.telephone || data.phone,
      adresse: data.adresse || data.address,
      address: data.adresse || data.address,
    };
  },
  z.object({
    nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    name: z.string().optional(),
    email: z.string().email("Format d'email invalide"),
    motDePasse: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .regex(/[A-Z]/, "Doit contenir une majuscule")
      .regex(/[0-9]/, "Doit contenir un chiffre"),
    password: z.string().optional(),
    telephone: z.string().regex(/^\+?[0-9\s-]{8,20}$/, "Format de téléphone invalide").optional().or(z.literal('')),
    phone: z.string().optional(),
    adresse: z.string().optional(),
    address: z.string().optional(),
  })
);

export const userSchema = utilisateurSchema; // Alias de transition

export const loginSchema = z.object({
  email: z.string().email("Format d'email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const magasinSchema = z.preprocess(
  (data: any) => {
    if (!data || typeof data !== 'object') return data;
    return {
      nom: data.nom || data.name,
      adresse: data.adresse || data.address,
      quartier: data.quartier || data.district,
      telephone: data.telephone || data.phone,
      description: data.description,
      logo: data.logo,
    };
  },
  z.object({
    nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    adresse: z.string().min(5, "L'adresse est requise"),
    quartier: z.string().min(2, "Le quartier est requis"),
    telephone: z.string().regex(/^\+?[0-9\s-]{8,20}$/, "Format de téléphone invalide"),
    description: z.string().optional(),
    logo: z.string().url("URL d'image invalide").optional().or(z.literal('')),
  })
);

export const storeSchema = magasinSchema; // Alias temporaire de transition

export const produitSchema = z.preprocess(
  (data: any) => {
    if (!data || typeof data !== 'object') return data;
    return {
      ...data,
      nom: data.nom || data.name,
      prix: data.prix ?? data.price,
      categorie: data.categorie || data.category,
      unite: data.unite || data.unit,
      magasinId: data.magasinId || data.storeId,
      name: data.nom || data.name,
      price: data.prix ?? data.price,
      category: data.categorie || data.category,
      unit: data.unite || data.unit,
      storeId: data.magasinId || data.storeId,
    };
  },
  z.object({
    nom: z.string().min(2, "Nom trop court"),
    name: z.string().optional(),
    prix: z.coerce.number().positive("Le prix doit être positif"),
    price: z.coerce.number().positive().optional(),
    stock: z.coerce.number().int().nonnegative("Le stock ne peut pas être négatif"),
    categorie: z.string().min(1, "Catégorie requise"),
    category: z.string().optional(),
    unite: z.string().min(1, "Unité requise"),
    unit: z.string().optional(),
    magasinId: z.string().min(1, "Magasin requis"),
    storeId: z.string().optional(),
    description: z.string().optional(),
    images: z.array(z.string().url("URL d'image invalide")).min(1, "Au moins une image est requise"),
  })
);

export const productSchema = produitSchema; // Alias de transition

export const checkoutFormSchema = z.preprocess(
  (data: any) => {
    if (!data || typeof data !== 'object') return data;
    return {
      ...data,
      name: data.nom || data.name,
      nom: data.nom || data.name,
      phone: data.telephone || data.phone,
      telephone: data.telephone || data.phone,
      district: data.quartier || data.district,
      quartier: data.quartier || data.district,
      paymentMethod: data.methodePaiement || data.paymentMethod,
      methodePaiement: data.methodePaiement || data.paymentMethod,
    };
  },
  z.object({
    name: z.string().min(2, "Le nom est requis"),
    nom: z.string().optional(),
    phone: z.string().min(8, "Numéro de téléphone invalide").regex(/^\+?[0-9\s-]{8,20}$/, "Format de téléphone invalide"),
    telephone: z.string().optional(),
    district: z.string().min(2, "Le quartier est requis"),
    quartier: z.string().optional(),
    indications: z.string().optional(),
    paymentMethod: z.enum(['airtel', 'moov', 'cash', 'card'], {
      message: "Veuillez sélectionner un moyen de paiement",
    }),
    methodePaiement: z.enum(['airtel', 'moov', 'cash', 'card']).optional(),
  })
);

export const commandeSchema = z.preprocess(
  (data: any) => {
    if (!data || typeof data !== 'object') return data;
    const itemsRaw = data.lignes || data.items || [];
    const itemsProcessed = Array.isArray(itemsRaw)
      ? itemsRaw.map((item: any) => ({
          ...item,
          produitId: item.produitId || item.id,
          id: item.produitId || item.id,
          quantite: item.quantite ?? item.quantity,
          quantity: item.quantite ?? item.quantity,
          prixUnitaire: item.prixUnitaire ?? item.price,
          price: item.prixUnitaire ?? item.price,
        }))
      : itemsRaw;

    return {
      ...data,
      utilisateurId: data.utilisateurId || data.userId,
      userId: data.utilisateurId || data.userId,
      magasinId: data.magasinId || data.storeId,
      storeId: data.magasinId || data.storeId,
      total: data.total,
      fraisLivraison: data.fraisLivraison ?? data.deliveryFee,
      deliveryFee: data.fraisLivraison ?? data.deliveryFee,
      methodePaiement: data.methodePaiement || data.paymentMethod,
      paymentMethod: data.methodePaiement || data.paymentMethod,
      adresseLivraison: data.adresseLivraison || data.deliveryAddress,
      deliveryAddress: data.adresseLivraison || data.deliveryAddress,
      lignes: itemsProcessed,
      items: itemsProcessed,
    };
  },
  z.object({
    utilisateurId: z.string(),
    userId: z.string().optional(),
    magasinId: z.string(),
    storeId: z.string().optional(),
    total: z.number().positive(),
    fraisLivraison: z.number().nonnegative(),
    deliveryFee: z.number().nonnegative().optional(),
    methodePaiement: z.enum(['airtel', 'moov', 'cash', 'card']),
    paymentMethod: z.enum(['airtel', 'moov', 'cash', 'card']).optional(),
    adresseLivraison: z.string().min(5),
    deliveryAddress: z.string().min(5).optional(),
    lignes: z.array(z.object({
      produitId: z.string(),
      id: z.string().optional(),
      quantite: z.number().int().positive(),
      quantity: z.number().int().positive().optional(),
      prixUnitaire: z.number().positive(),
      price: z.number().positive().optional(),
    })).min(1),
    items: z.array(z.object({
      produitId: z.string(),
      id: z.string().optional(),
      quantite: z.number().int().positive(),
      quantity: z.number().int().positive().optional(),
      prixUnitaire: z.number().positive(),
      price: z.number().positive().optional(),
    })).min(1).optional(),
  })
);

export const orderSchema = commandeSchema;
