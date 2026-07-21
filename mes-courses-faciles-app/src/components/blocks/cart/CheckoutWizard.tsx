"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DeliveryStep, DeliveryFormData } from './DeliveryStep';
import { PaymentMethodStep } from './PaymentMethodStep';
import { BackButton } from '@/components/common/BackButton';
import { useToast } from '@/context/ToastContext';
import { processCheckoutAction } from '@/actions/ecommerce';
import {
  CheckCircle2,
  ShoppingBag,
  Truck,
  ShieldCheck
} from 'lucide-react';

interface CheckoutWizardProps {
  initialUser: {
    id: string;
    name: string | null;
    phone: string | null;
    address: string | null;
  };
}

export function CheckoutWizard({ initialUser }: CheckoutWizardProps) {
  const { cart, totalPrice, deliveryFee, clearCart } = useCart();
  const router = useRouter();
  const toast = useToast();

  // Step 1: Livraison, Step 2: Paiement, Step 3: Confirmation
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [deliveryData, setDeliveryData] = useState<Partial<DeliveryFormData>>({
    name: initialUser.name || '',
    phone: initialUser.phone || '',
    district: initialUser.address || '',
    indications: '',
  });

  const finalTotal = totalPrice + deliveryFee;

  // Empty cart guard (Garde-fou 3)
  if (cart.length === 0 && !isProcessing && currentStep !== 3) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6">
        <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center shadow-inner">
          <ShoppingBag size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Votre panier est vide</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          Vous n&apos;avez aucun article dans votre panier. Ajoutez des produits avant de procéder au paiement.
        </p>
        <Button onClick={() => router.push('/')} size="lg" className="rounded-full font-bold px-8 shadow-lg shadow-primary/25">
          Retourner aux achats
        </Button>
      </div>
    );
  }

  const handleDeliverySubmit = (data: DeliveryFormData) => {
    setDeliveryData(data);
    setCurrentStep(2);
  };

  const handlePaymentSubmit = async (method: 'airtel' | 'moov' | 'card' | 'cash') => {
    setIsProcessing(true);
    try {
      const formattedItems = cart.map(item => ({
        id: item.id,
        quantity: item.quantity,
      }));

      // Call the server action with Zero-Trust parameters (BOLA safety)
      const res = await processCheckoutAction(
        deliveryData as DeliveryFormData,
        method,
        formattedItems
      );

      if (res.success) {
        // Redirect to success page (which will clear client cart on mount)
        const targetUrl = res.redirectUrl 
          ? `${res.redirectUrl}&clearCart=true`
          : `/checkout/success?orderId=${res.orderCode}&clearCart=true`;
        router.push(targetUrl);
      } else {
        toast.error(res.error || "Une erreur est survenue lors de la commande.");
        setIsProcessing(false);
      }
    } catch (e) {
      console.error(e);
      toast.error("Une erreur inattendue est survenue.");
      setIsProcessing(false);
    }
  };

  const handleBackToDelivery = () => {
    setCurrentStep(1);
  };

  return (
    <div className="bg-mesh bg-noise relative overflow-hidden pt-8 pb-24 min-h-screen">
      {/* Visual background flares */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brand-primary/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-safran/5 blur-[80px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10 space-y-6">
        <div className="flex justify-start">
          <BackButton href="/" label="Retour à l'accueil" />
        </div>

        {/* Header & Stepper */}
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">Finaliser la commande</h1>
          </div>

          {/* Stepper progress bar */}
          <div className="max-w-xl mx-auto md:mx-0">
            <div className="flex items-center justify-between relative">
              {/* Stepper connector lines */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-muted z-0">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                />
              </div>

              {/* Step 1: Livraison */}
              <div className="flex flex-col items-center z-10 relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    currentStep >= 1
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-110'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {currentStep > 1 ? <CheckCircle2 size={18} strokeWidth={2.5} /> : '1'}
                </div>
                <span className="text-xs font-bold mt-2 text-foreground">Livraison</span>
              </div>

              {/* Step 2: Paiement */}
              <div className="flex flex-col items-center z-10 relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    currentStep >= 2
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-110'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {currentStep > 2 ? <CheckCircle2 size={18} strokeWidth={2.5} /> : '2'}
                </div>
                <span className={`text-xs font-bold mt-2 ${currentStep >= 2 ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Paiement
                </span>
              </div>

              {/* Step 3: Confirmation */}
              <div className="flex flex-col items-center z-10 relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    currentStep >= 3
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-110'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  3
                </div>
                <span className={`text-xs font-bold mt-2 ${currentStep >= 3 ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Confirmation
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Layout: Left Column (Wizard), Right Column (Order Summary) (Garde-fou 1) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column (2/3): Wizard */}
          <div className="lg:col-span-7 bg-white/40 dark:bg-slate-800/30 backdrop-blur-md border border-white/30 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm">
            {currentStep === 1 && (
              <DeliveryStep initialData={deliveryData} onNext={handleDeliverySubmit} />
            )}

            {currentStep === 2 && (
              <PaymentMethodStep
                totalAmount={finalTotal}
                onBack={handleBackToDelivery}
                onSubmit={handlePaymentSubmit}
                isProcessing={isProcessing}
              />
            )}

            {currentStep === 3 && (
              <div className="text-center py-8 space-y-6 animate-in fade-in scale-in duration-500">
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 size={40} strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-black text-foreground">Redirection...</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Votre commande a été enregistrée avec succès. Nous vous redirigeons vers la page de confirmation.
                </p>
              </div>
            )}
          </div>

          {/* Right Column (1/3): Sticky Order Summary */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-24 space-y-6">
              <Card className="p-6 overflow-hidden border-border/50 shadow-lg shadow-black/5 rounded-3xl bg-card">
                <h3 className="font-bold text-foreground flex items-center gap-2 mb-6 text-lg">
                  <ShoppingBag size={20} className="text-primary" /> Résumé de la commande
                </h3>

                {/* Items list */}
                <div className="space-y-4 max-h-[40vh] overflow-y-auto no-scrollbar pr-2 mb-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-4 group">
                      <div className="w-16 h-16 bg-muted/50 rounded-xl border border-border/50 flex-shrink-0 relative overflow-hidden">
                        <Image
                          src={item.image || "/images/product-placeholder.svg"}
                          fill
                          sizes="64px"
                          className="object-contain p-2 mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                          alt={item.name}
                        />
                      </div>
                      <div className="flex-1 py-1">
                        <h4 className="text-sm font-bold text-foreground line-clamp-2 leading-tight mb-1">{item.name}</h4>
                        <div className="flex justify-between items-center mt-auto">
                          <p className="text-xs text-muted-foreground font-medium">
                            Qté: <span className="text-foreground">{item.quantity}</span>
                          </p>
                          <p className="text-sm font-bold text-primary">
                            {(item.price * item.quantity).toLocaleString('fr-FR')} CFA
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-6" />

                {/* Totals */}
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-muted-foreground font-medium">
                    <span>Sous-total articles</span>
                    <span className="text-foreground">{totalPrice.toLocaleString('fr-FR')} CFA</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground font-medium">
                    <span className="flex items-center gap-1.5">Frais de livraison <Truck size={14} /></span>
                    <span className="text-foreground">{deliveryFee.toLocaleString('fr-FR')} CFA</span>
                  </div>

                  <div className="pt-6 flex justify-between items-end border-t border-border/50">
                    <span className="text-lg font-bold text-foreground">Total à régler</span>
                    <span className="text-3xl font-black text-primary tracking-tight">
                      {finalTotal.toLocaleString('fr-FR')} <span className="text-lg font-bold">CFA</span>
                    </span>
                  </div>
                </div>
              </Card>

              {/* Trust Badge */}
              <div className="p-4 bg-muted/30 dark:bg-slate-800/10 rounded-2xl border border-border/50 flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="text-primary" size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Paiement 100% sécurisé</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Vos transactions sont chiffrées de bout en bout. Nous ne stockons aucune information bancaire.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
