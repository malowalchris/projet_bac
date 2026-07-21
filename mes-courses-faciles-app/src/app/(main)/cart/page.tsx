"use client";

import React from 'react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, totalPrice, totalItems, deliveryFee } = useCart();

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center container mx-auto px-4 text-center space-y-6">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
          <ShoppingBag size={48} />
        </div>
        <h1 className="text-3xl font-black text-slate-800">Votre panier est vide</h1>
        <p className="text-slate-500 max-w-md">
          Il semblerait que vous n&apos;ayez pas encore ajouté de produits à votre panier.
          Découvrez nos magasins pour commencer vos courses.
        </p>
        <Link href="/">
          <Button size="lg" className="px-12 h-14 text-lg">
            Voir les magasins
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1 space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-black text-slate-800">Votre Panier</h1>
              <span className="bg-brand-primary/10 text-brand-primary px-4 py-1 rounded-full font-bold text-sm">
                {totalItems} {totalItems > 1 ? 'articles' : 'article'}
              </span>
            </div>

            <div className="space-y-4">
              {cart.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex gap-6">
                    <div className="relative w-24 h-24 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="96px"
                        className="object-contain p-2"
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-slate-800 text-lg leading-tight">{item.name}</h3>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{item.category}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>

                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-3 bg-slate-100 rounded-xl p-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-slate-600 hover:text-brand-primary transition-colors shadow-sm"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center font-bold text-slate-800">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-slate-600 hover:text-brand-primary transition-colors shadow-sm"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-slate-400 font-medium">{item.price.toLocaleString('fr-FR')} CFA / {item.unit}</p>
                          <p className="text-xl font-black text-brand-secondary">
                            {(item.price * item.quantity).toLocaleString('fr-FR')} <span className="text-xs">CFA</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Link href="/" className="inline-flex items-center gap-2 text-slate-500 font-bold hover:text-brand-primary transition-colors">
              <ArrowLeft size={20} /> Continuer mes courses
            </Link>
          </div>

          <aside className="w-full lg:w-96 space-y-6">
            <Card className="p-8 sticky top-24">
              <h2 className="text-xl font-black text-slate-800 mb-6">Résumé de la commande</h2>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-slate-500">
                  <span>Sous-total</span>
                  <span className="font-bold text-slate-800">{totalPrice.toLocaleString('fr-FR')} CFA</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Frais de livraison</span>
                  <span className="font-bold text-slate-800">{deliveryFee.toLocaleString('fr-FR')} CFA</span>
                </div>
                <div className="h-px bg-slate-100 my-2" />
                <div className="flex justify-between items-end">
                  <span className="text-lg font-bold text-slate-800">Total</span>
                  <div className="text-right">
                    <p className="text-3xl font-black text-brand-primary">{(totalPrice + deliveryFee).toLocaleString('fr-FR')} <span className="text-sm">CFA</span></p>
                  </div>
                </div>
              </div>

              <Link href="/checkout">
                <Button className="w-full h-16 text-lg font-black shadow-xl shadow-brand-primary/20">
                  Passer au paiement <ArrowRight className="ml-2" />
                </Button>
              </Link>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400 font-bold uppercase">
                <ShieldCheck size={16} /> Paiement 100% sécurisé
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
