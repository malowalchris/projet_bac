"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  unit: string;
  category: string;
  storeId?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Omit<CartItem, 'quantity' | 'id'> & { name: string; storeId: string }) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  activeStoreId: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('mcf_cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setCart(parsed);
        if (parsed.length > 0) {
          setActiveStoreId(parsed[0].storeId);
        }
      } catch (e) {
        console.error("Failed to load cart", e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('mcf_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Omit<CartItem, 'quantity' | 'id'> & { name: string; storeId: string }) => {
    if (activeStoreId && activeStoreId !== product.storeId) {
      const confirmNew = window.confirm("Votre panier contient déjà des produits d'un autre magasin. Souhaitez-vous vider votre panier pour commander dans ce magasin ?");
      if (!confirmNew) return;

      setCart([{
        id: product.name,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
        unit: product.unit || 'unité',
        category: product.category || 'Général',
        storeId: product.storeId
      }]);
      setActiveStoreId(product.storeId);
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.name); // Using name as ID for mock products

      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.name ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      if (prevCart.length === 0) {
        setActiveStoreId(product.storeId);
      }

      return [...prevCart, {
        id: product.name,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
        unit: product.unit || 'unité',
        category: product.category || 'Général',
        storeId: product.storeId
      }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item => item.id === productId ? { ...item, quantity } : item)
    );
  };

  const clearCart = () => {
    setCart([]);
    setActiveStoreId(null);
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      activeStoreId
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
