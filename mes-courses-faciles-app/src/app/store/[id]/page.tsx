"use client";

import React, { useState, use } from 'react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { ProductCard } from '@/components/ui/ProductCard';
import { Button } from '@/components/ui/Button';
import { Search, Filter, ChevronRight, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';

const CATEGORIES = [
  'Tous', 'Produits Frais', 'Épicerie', 'Boissons', 'Hygiène', 'Bébé', 'Maison', 'Animaux'
];

const PRODUCTS = [
  { name: 'Riz Long Grain 5kg', price: 4500, category: 'Épicerie', unit: 'sac', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=400&auto=format&fit=crop' },
  { name: 'Huile de Tournesol 1L', price: 1200, category: 'Épicerie', unit: 'bouteille', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbadb8c5?q=80&w=400&auto=format&fit=crop' },
  { name: 'Lait Entier 1L', price: 850, category: 'Produits Frais', unit: 'brique', image: 'https://images.unsplash.com/photo-1550583724-125581dc228b?q=80&w=400&auto=format&fit=crop' },
  { name: 'Pâtes Spaghetti 500g', price: 600, category: 'Épicerie', unit: 'paquet', image: 'https://images.unsplash.com/photo-1551462147-3a8836a9b40d?q=80&w=400&auto=format&fit=crop' },
  { name: 'Eau Minérale 1.5L (Pack de 6)', price: 2100, category: 'Boissons', unit: 'pack', image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf3d?q=80&w=400&auto=format&fit=crop' },
  { name: 'Savon de Toilette', price: 450, category: 'Hygiène', unit: 'unité', image: 'https://images.unsplash.com/photo-1605264964528-06403738d6dc?q=80&w=400&auto=format&fit=crop' },
  { name: 'Yaourt Nature x4', price: 1400, category: 'Produits Frais', unit: 'pack', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=400&auto=format&fit=crop' },
  { name: 'Jus d\'Orange 1L', price: 1100, category: 'Boissons', unit: 'bouteille', image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?q=80&w=400&auto=format&fit=crop' },
];

export default function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { addToCart } = useCart();
  const [activeCategory, setActiveCategory] = useState('Tous');

  // We need to inject storeId into ProductCard, so we enhance the card rendering
  const productsWithStore = PRODUCTS.map(p => ({ ...p, storeId: resolvedParams.id }));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Store Header */}
      <div className="bg-white border-b border-slate-200 sticky top-16 md:top-20 z-30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 overflow-hidden relative">
                <Image
                   src="https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=100&auto=format&fit=crop"
                   alt="Store logo"
                   fill
                   className="object-cover"
                />
              </div>
              <div>
                <nav className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                  <span>Magasins</span>
                  <ChevronRight size={12} />
                  <span className="font-bold text-brand-primary uppercase">{resolvedParams.id}</span>
                </nav>
                <h1 className="text-2xl font-extrabold text-slate-800 capitalize">{resolvedParams.id.replace('-', ' ')}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
               <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Chercher dans ce magasin..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none"
                  />
               </div>
               <Button variant="outline" size="sm" className="h-10 w-10 p-0 rounded-xl md:hidden">
                 <SlidersHorizontal size={18} />
               </Button>
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="container mx-auto px-4 border-t border-slate-100 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 py-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`
                  px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all
                  ${activeCategory === cat
                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                    : 'bg-white text-slate-600 hover:bg-slate-100'}
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden lg:block w-64 space-y-8 flex-shrink-0">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Filter size={18} /> Filtres
              </h3>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 block">Prix</label>
                <input type="range" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-primary" />
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>0 CFA</span>
                  <span>50.000 CFA</span>
                </div>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-500 block">Disponibilité</label>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" className="rounded text-brand-primary" />
                  <span>En stock</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" className="rounded text-brand-primary" />
                  <span>Promotions</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <main className="flex-1 space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-slate-500 text-sm font-medium">
                <span className="text-slate-800 font-bold">{PRODUCTS.length}</span> produits trouvés
              </p>
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
                <button className="p-1.5 rounded bg-slate-100 text-brand-primary"><LayoutGrid size={18} /></button>
                <button className="p-1.5 rounded text-slate-400 hover:bg-slate-50"><List size={18} /></button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {productsWithStore.map((product, i) => (
                <ProductCard key={i} {...product} />
              ))}
            </div>

            <div className="flex justify-center pt-8 pb-12">
              <Button variant="outline" className="px-12 border-slate-300">
                Charger plus de produits
              </Button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
