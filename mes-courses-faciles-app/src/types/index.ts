export interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  role: 'CLIENT' | 'ADMIN';
  createdAt: Date;
}

export interface Magasin {
  id: string;
  nom: string;
  adresse: string;
  quartier: string;
  telephone: string;
  logo: string | null;
  description: string | null;
  estActif: boolean;
  // Rétro-compatibilité transitionnelle Phase 2
  name?: string;
  address?: string;
  district?: string;
  phone?: string;
  isActive?: boolean;
}

export type Store = Magasin; // Alias temporaire de transition

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  oldPrice?: number;
  category: string;
  stock: number;
  unit: string | null;
  images: string | null;
  isActive: boolean;
  magasinId: string;
  magasin?: Magasin;
  storeId?: string; // rétro-compatibilité temporaire pendant Phase 2
  store?: Magasin;
}

export interface Order {
  id: string;
  userId: string;
  magasinId: string;
  total: number;
  deliveryFee: number;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentMethod: string;
  deliveryAddress: string;
  createdAt: Date;
  orderItems?: OrderItem[];
  magasin?: Magasin;
  storeId?: string;
  store?: Magasin;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: 'CLIENT' | 'ADMIN';
}
