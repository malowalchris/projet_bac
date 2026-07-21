"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';

export function CartDrawer({ isBottomTab = false, isFloating = false }: { isBottomTab?: boolean; isFloating?: boolean }) {
  const { cart, removeFromCart, updateQuantity, totalItems, totalPrice, deliveryFee } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const prevTotalItems = useRef(totalItems);

  const handleCheckoutClick = (e: React.MouseEvent) => {
    setIsOpen(false);
    if (!user) {
      e.preventDefault();
      router.push('?auth=login&callbackUrl=/checkout');
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (totalItems > prevTotalItems.current) {
      setIsBouncing(true);
      timer = setTimeout(() => setIsBouncing(false), 500);
    }
    prevTotalItems.current = totalItems;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [totalItems]);

  if (isFloating && totalItems === 0) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {isFloating ? (
        <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50">
          <SheetTrigger
            render={
              <button className="relative h-14 w-14 rounded-full bg-brand-primary hover:bg-brand-primary/95 text-white flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-xl shadow-brand-primary/35 border border-white/10 cursor-pointer outline-none" />
            }
          >
            <motion.div
              animate={isBouncing ? { scale: [1, 1.3, 0.9, 1.1, 1] } : { scale: 1 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="relative flex items-center justify-center"
            >
              <ShoppingBag className="h-6 w-6" strokeWidth={2.5} />
              {totalItems > 0 && (
                <span className="absolute -top-3.5 -right-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-extrabold text-white border-2 border-white animate-scale-in">
                  {totalItems}
                </span>
              )}
            </motion.div>
          </SheetTrigger>
        </div>
      ) : isBottomTab ? (
        <SheetTrigger
          render={
            <button className="relative p-1 rounded-xl transition-all text-muted-foreground hover:text-primary outline-none" />
          }
        >
          <motion.div
            animate={isBouncing ? { scale: [1, 1.3, 0.9, 1.1, 1] } : { scale: 1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="relative flex items-center justify-center"
          >
            <ShoppingBag size={24} strokeWidth={isOpen ? 2.5 : 2} className={isOpen ? 'text-primary' : ''} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground border-2 border-background">
                {totalItems}
              </span>
            )}
          </motion.div>
        </SheetTrigger>
      ) : (
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" className="relative hover:bg-accent/10 hover:text-accent transition-colors cursor-pointer" />
          }
        >
          <motion.div
            animate={isBouncing ? { scale: [1, 1.3, 0.9, 1.1, 1] } : { scale: 1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="relative flex items-center justify-center"
          >
            <ShoppingBag className="h-6 w-6" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground border-2 border-background">
                {totalItems}
              </span>
            )}
          </motion.div>
          <span className="sr-only">Panier</span>
        </SheetTrigger>
      )}

      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-xl font-bold">
            <ShoppingBag className="text-primary" />
            Mon Panier <span className="text-muted-foreground text-sm font-normal">({totalItems} article{totalItems > 1 ? 's' : ''})</span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-muted-foreground">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                 <ShoppingBag size={32} />
              </div>
              <p className="text-lg font-bold text-foreground">Votre panier est vide</p>
              <p className="text-sm">Remplissez-le avec de bons produits !</p>
              <Button variant="outline" className="mt-4 rounded-full" onClick={() => setIsOpen(false)}>
                Continuer mes achats
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted/50 border border-border/50 shrink-0">
                    <Image
                      src={item.image || "/images/product-placeholder.svg"}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-contain p-2 mix-blend-multiply"
                    />
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm line-clamp-2 leading-tight pr-4">{item.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{item.price} CFA / {item.unit}</p>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)} 
                        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        aria-label={`Supprimer ${item.name} du panier`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3 bg-muted rounded-full px-2 py-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-full bg-background flex items-center justify-center shadow-sm hover:text-primary transition-colors"
                          aria-label={`Diminuer la quantité de ${item.name}`}
                        >
                          <Minus size={12} strokeWidth={3} />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-full bg-background flex items-center justify-center shadow-sm hover:text-primary transition-colors"
                          aria-label={`Augmenter la quantité de ${item.name}`}
                        >
                          <Plus size={12} strokeWidth={3} />
                        </button>
                      </div>

                      <span className="font-bold text-primary">
                        {(item.price * item.quantity).toLocaleString('fr-FR')} CFA
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t bg-background p-6 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Sous-total</span>
                <span>{totalPrice.toLocaleString('fr-FR')} CFA</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Frais de livraison estimés</span>
                <span>{deliveryFee.toLocaleString('fr-FR')} CFA</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-black text-lg text-foreground">
                <span>Total TTC</span>
                <span className="text-primary">{(totalPrice + deliveryFee).toLocaleString('fr-FR')} CFA</span>
              </div>
            </div>

            <Link href="/checkout" onClick={handleCheckoutClick} className="block w-full">
              <Button size="lg" className="w-full h-14 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground text-lg shadow-xl shadow-accent/20 group">
                Passer à la caisse
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
