"use client";

import React, { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || '';
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] py-12 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Visual background flares */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brand-primary/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-safran/5 blur-[80px] pointer-events-none" />

      <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner relative z-10 animate-bounce">
        <CheckCircle2 size={48} strokeWidth={2.5} />
      </div>

      <h1 className="text-4xl font-black text-foreground mb-4 tracking-tight text-center relative z-10">
        Commande validée !
      </h1>
      
      <p className="text-muted-foreground text-lg mb-10 max-w-md mx-auto text-center leading-relaxed relative z-10">
        Merci pour votre confiance. Votre commande{" "}
        <span className="font-extrabold text-primary px-3 py-1.5 bg-primary/10 rounded-xl">
          #{orderId}
        </span>{" "}
        a été transmise avec succès à notre magasin partenaire.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto relative z-10">
        <Link href="/profile?tab=orders" className="w-full sm:w-auto">
          <Button size="lg" className="w-full h-14 px-8 rounded-full shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-bold flex items-center justify-center gap-2">
            Suivre ma commande
            <ArrowRight size={18} />
          </Button>
        </Link>
        <Link href="/" className="w-full sm:w-auto">
          <Button variant="outline" size="lg" className="w-full h-14 px-8 rounded-full border-border bg-background hover:bg-muted font-bold text-foreground text-lg">
            Retour à la boutique
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="bg-mesh bg-noise relative overflow-hidden min-h-screen flex items-center justify-center">
      <Suspense fallback={
        <div className="text-center py-12">
          <p className="text-muted-foreground">Chargement des détails de la commande...</p>
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
