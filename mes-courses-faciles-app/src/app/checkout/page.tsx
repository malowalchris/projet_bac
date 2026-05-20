"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  MapPin,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  Truck,
  ShoppingBag,
  Wallet,
  Smartphone,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';

type Step = 'delivery' | 'payment' | 'confirmation';

export default function CheckoutPage() {
  const { cart, totalPrice } = useCart();
  const [step, setStep] = useState<Step>('delivery');

  const deliveryFee = 2000;
  const finalTotal = totalPrice + deliveryFee;

  const steps = [
    { id: 'delivery', label: 'Adresse', icon: MapPin },
    { id: 'payment', label: 'Paiement', icon: CreditCard },
    { id: 'confirmation', label: 'Confirmation', icon: CheckCircle2 },
  ];

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-12">
      {steps.map((s, index) => {
        const isActive = step === s.id;
        const isCompleted = steps.findIndex(x => x.id === step) > index;

        return (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center relative">
              <div className={`
                w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500
                ${isActive ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30 scale-110' :
                  isCompleted ? 'bg-green-100 text-brand-primary' : 'bg-slate-100 text-slate-400'}
              `}>
                {isCompleted ? <CheckCircle2 size={24} /> : <s.icon size={24} />}
              </div>
              <span className={`absolute -bottom-7 text-xs font-bold whitespace-nowrap ${isActive ? 'text-brand-primary' : 'text-slate-400'}`}>
                {s.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-20 lg:w-32 h-1 mx-2 rounded-full transition-all duration-500 ${isCompleted ? 'bg-brand-primary' : 'bg-slate-100'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-12 pb-24">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-8">
           <Link href="/cart" className="text-slate-500 flex items-center gap-2 font-bold hover:text-brand-primary transition-colors">
             <ArrowLeft size={20} /> Retour au panier
           </Link>
        </div>

        {renderStepIndicator()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {step === 'delivery' && (
              <Card className="p-8 animate-in" isHoverable={false}>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Adresse de livraison</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Nom Complet</label>
                      <input type="text" placeholder="Jean Dupont" className="input-field" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Téléphone</label>
                      <input type="tel" placeholder="+241 07 00 00 00" className="input-field" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Quartier / Zone</label>
                    <select className="input-field appearance-none">
                      <option>Sélectionnez votre quartier</option>
                      <option>Louis</option>
                      <option>Angondjé</option>
                      <option>Glass</option>
                      <option>Akanda</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Indications complémentaires</label>
                    <textarea placeholder="Ex: Maison bleue après la boulangerie..." className="input-field h-32 resize-none" />
                  </div>

                  <div className="pt-4">
                    <Button onClick={() => setStep('payment')} className="w-full h-14 text-lg">
                      Continuer vers le paiement <ChevronRight className="ml-2" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {step === 'payment' && (
              <div className="space-y-6 animate-in">
                <Card className="p-8" isHoverable={false}>
                  <h2 className="text-2xl font-bold text-slate-800 mb-6">Mode de paiement</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: 'airtel', name: 'Airtel Money', icon: Smartphone, color: 'border-red-500 text-red-500' },
                      { id: 'moov', name: 'Moov Money', icon: Smartphone, color: 'border-blue-500 text-blue-500' },
                      { id: 'card', name: 'Carte Bancaire', icon: CreditCard, color: 'border-brand-primary text-brand-primary' },
                      { id: 'cash', name: 'Paiement à la livraison', icon: Wallet, color: 'border-green-500 text-green-500' }
                    ].map((method) => (
                      <button key={method.id} className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all hover:bg-slate-50 ${method.id === 'airtel' ? method.color : 'border-slate-100'}`}>
                        <method.icon size={32} />
                        <span className="font-bold">{method.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                    <div className="w-10 h-10 bg-brand-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="text-brand-primary" size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Transaction sécurisée</p>
                      <p className="text-xs text-slate-500">Vos données de paiement sont cryptées et ne sont jamais enregistrées sur nos serveurs.</p>
                    </div>
                  </div>
                </Card>

                <Button onClick={() => setStep('confirmation')} className="w-full h-14 text-lg">
                  Valider ma commande ({finalTotal.toLocaleString()} CFA)
                </Button>
              </div>
            )}

            {step === 'confirmation' && (
              <Card className="p-12 text-center animate-in" isHoverable={false}>
                <div className="w-24 h-24 bg-green-100 text-brand-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={48} strokeWidth={3} />
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-4">Commande Confirmée !</h2>
                <p className="text-slate-500 text-lg mb-8 max-w-md mx-auto">
                  Merci pour votre confiance. Votre commande <span className="font-bold text-brand-primary">#MCF-2025</span> est en cours de préparation chez Mbolo.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/orders/2025">
                    <Button variant="outline" className="w-full sm:w-auto h-12 px-8">Suivre ma commande</Button>
                  </Link>
                  <Link href="/">
                    <Button className="w-full sm:w-auto h-12 px-8">Retour à l&apos;accueil</Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>

          {/* Order Summary (Sidebar) */}
          <div className="space-y-6">
            <Card className="p-6 overflow-hidden" isHoverable={false}>
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                <ShoppingBag size={20} /> Récapitulatif
              </h3>
              <div className="space-y-4 max-h-60 overflow-y-auto no-scrollbar mb-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-xl border border-slate-100 flex-shrink-0 relative overflow-hidden">
                      <Image
                        src={item.image}
                        fill
                        className="object-contain p-2"
                        alt={item.name}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{item.name}</h4>
                      <p className="text-xs text-slate-500">Quantité: {item.quantity}</p>
                      <p className="text-sm font-bold text-brand-primary">{(item.price * item.quantity).toLocaleString()} CFA</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-px bg-slate-100 mb-6" />

              <div className="space-y-3">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Sous-total</span>
                  <span className="font-bold text-slate-800">{totalPrice.toLocaleString()} CFA</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span className="flex items-center gap-1">Livraison <Truck size={14} /></span>
                  <span className="font-bold text-slate-800">{deliveryFee.toLocaleString()} CFA</span>
                </div>
                <div className="pt-4 flex justify-between items-end border-t border-slate-100">
                  <span className="text-lg font-bold text-slate-800">Total</span>
                  <span className="text-2xl font-black text-brand-primary">{finalTotal.toLocaleString()} CFA</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
