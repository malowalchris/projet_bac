"use client";

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, User, Search, MapPin, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { useCart } from '@/context/CartContext';

export const Navbar = () => {
  const { totalItems } = useCart();
  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="container mx-auto px-4 h-16 lg:h-20 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
            <ShoppingCart className="text-white" size={24} />
          </div>
          <span className="text-xl lg:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-secondary to-slate-700 hidden sm:block">
            Mes Courses Faciles
          </span>
        </Link>

        {/* Localisation (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full cursor-pointer hover:bg-slate-100 transition-colors">
          <MapPin size={18} className="text-brand-primary" />
          <div className="text-sm">
            <p className="text-slate-500 text-[10px] leading-none uppercase font-bold tracking-wider">Livraison à</p>
            <div className="flex items-center gap-1 font-semibold text-slate-700">
              Libreville, Gabon <ChevronDown size={14} />
            </div>
          </div>
        </div>

        {/* Barre de recherche (Desktop) */}
        <form
          action="/search"
          className="hidden md:flex flex-1 max-w-xl relative"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            name="q"
            type="text"
            placeholder="Rechercher un produit, une marque..."
            className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none"
          />
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2 lg:gap-4">
          <Link href="/cart" className="relative p-2 text-slate-600 hover:text-brand-primary transition-colors">
            <ShoppingCart size={24} />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 bg-brand-primary text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white">
                {totalItems}
              </span>
            )}
          </Link>

          <div className="h-8 w-px bg-slate-200 mx-2 hidden lg:block" />

          <Link href="/auth/login">
            <Button variant="ghost" className="hidden lg:flex items-center gap-2 text-slate-600">
              <User size={20} />
              Connexion
            </Button>
          </Link>

          <Link href="/auth/register">
            <Button size="sm" className="hidden lg:flex">
              S&apos;inscrire
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Bar Mobile */}
      <div className="md:hidden px-4 pb-3">
        <Link href="/search" className="block">
          <div className="relative pointer-events-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <div className="w-full bg-slate-100 border-none rounded-xl py-2.5 pl-11 pr-4 text-sm text-slate-400">
              Riz, lait, savon...
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
};
