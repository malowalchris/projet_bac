"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, ArrowLeft } from 'lucide-react';

export function CheckoutHeaderClient() {
  const pathname = usePathname();
  const isSuccessPage = pathname === '/checkout/success';

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      {!isSuccessPage ? (
        <Link href="/cart" className="flex items-center gap-2 text-slate-500 hover:text-brand-primary transition-colors font-bold text-sm w-36">
          <ArrowLeft size={20} />
          <span className="hidden sm:inline">Retour au panier</span>
        </Link>
      ) : (
        <div className="w-36" />
      )}

      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
          <ShoppingCart size={18} className="text-white" />
        </div>
        <span className="font-black text-slate-800 tracking-tight">Mes Courses Faciles</span>
      </Link>

      <div className="w-36" />
    </header>
  );
}
