"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { syncCartAction, fetchUserCartAction } from '@/actions/ecommerce';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  addToCart: (product: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  deliveryFee: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { user } = useAuth();
  const isInitialMount = useRef(true);
  const isSyncingFromServer = useRef(false);
  const prevUserRef = useRef(user);
  const [conflictProduct, setConflictProduct] = useState<Omit<CartItem, 'quantity'> | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from server if logged in, otherwise from localStorage
  useEffect(() => {
    const loadCart = async () => {
      setIsLoaded(false);
      if (user) {
        isSyncingFromServer.current = true;
        try {
          // Zero-Trust : le userId est extrait de la session côté serveur
          const res = await fetchUserCartAction();
          if (res.success && res.cart) {
            setCart(res.cart as CartItem[]);
            localStorage.setItem('mcf_cart', JSON.stringify(res.cart));
          } else {
            // Server cart is empty/unavailable, override local cart to empty
            setCart([]);
            localStorage.removeItem('mcf_cart');
          }
        } catch (e) {
          console.error("Failed to load user cart", e);
          setCart([]);
          localStorage.removeItem('mcf_cart');
        }
        setTimeout(() => { isSyncingFromServer.current = false; }, 100);
      } else {
        // Detect logout transition: previous user was logged in, current user is guest
        const isLogoutTransition = prevUserRef.current !== null;
        if (isLogoutTransition) {
          setCart([]);
          localStorage.removeItem('mcf_cart');
        } else {
          // Normal guest cart loading
          const savedCart = localStorage.getItem('mcf_cart');
          if (savedCart) {
            try {
              setCart(JSON.parse(savedCart));
            } catch (e) {
              console.error("Failed to load guest cart", e);
              setCart([]);
            }
          } else {
            setCart([]);
          }
        }
      }
      // Update previous user ref
      prevUserRef.current = user;
      setIsLoaded(true);
    };

    loadCart();
  }, [user]);

  // Sync to server and localStorage when cart changes
  useEffect(() => {
    if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
    }

    if (isSyncingFromServer.current) {
        return;
    }

    // Detect login transition: previous was guest, current is user
    const isLoginTransition = !prevUserRef.current && user;
    if (isLoginTransition) {
        return;
    }

    localStorage.setItem('mcf_cart', JSON.stringify(cart));

    if (user) {
        // Zero-Trust : userId injecté depuis la session serveur dans syncCartAction
        syncCartAction(cart).catch(e => console.error("Failed to sync cart", e));
    }
  }, [cart, user]);

  const addToCart = useCallback((product: Omit<CartItem, 'quantity'>) => {
    // Handling store conflict before state update to avoid window.confirm in state updater
    const isDifferentStore = cart.length > 0 && product.storeId && cart[0].storeId !== product.storeId;

    if (isDifferentStore) {
      setConflictProduct(product);
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);

      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  }, [cart]);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item => item.id === productId ? { ...item, quantity } : item)
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliveryFee = cart.length > 0 ? 2000 : 0;

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      deliveryFee
    }}>
      <div data-cart-loaded={isLoaded} className="contents">
        {children}
      </div>
      <AlertDialog open={!!conflictProduct} onOpenChange={(open) => !open && setConflictProduct(null)}>
        <AlertDialogContent className="rounded-[2rem] p-6 sm:p-8 border-white/20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">
              Changer de magasin ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              Votre panier contient déjà des articles d&apos;un autre magasin. Vous ne pouvez commander que dans un seul magasin à la fois.
              <br /><br />
              Voulez-vous <strong>vider votre panier actuel</strong> pour ajouter cet article ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 sm:mt-10 gap-3 sm:gap-0 bg-transparent border-t-0 p-0 sm:flex-row-reverse flex-col">
            <AlertDialogAction 
              onClick={() => {
                if (conflictProduct) {
                  setCart([{ ...conflictProduct, quantity: 1 }]);
                  setConflictProduct(null);
                }
              }}
              className="rounded-2xl font-bold bg-brand-primary text-white hover:bg-brand-primary/90 h-14 sm:w-auto w-full px-8 shadow-lg shadow-brand-primary/20"
            >
              Vider et ajouter
            </AlertDialogAction>
            <AlertDialogCancel className="rounded-2xl font-bold border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 h-14 sm:w-auto w-full px-8 sm:mr-3">
              Annuler
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
