"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Search, Edit2, Trash2, Filter } from 'lucide-react';
import Image from 'next/image';

const INITIAL_PRODUCTS = [
  { id: '1', name: 'Riz Long Grain 5kg', price: 4500, category: 'Épicerie', stock: 150, unit: 'sac', store: 'Mbolo', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=100' },
  { id: '2', name: 'Huile de Tournesol 1L', price: 1200, category: 'Épicerie', stock: 80, unit: 'bouteille', store: 'Mbolo', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbadb8c5?q=80&w=100' },
  { id: '3', name: 'Lait Entier 1L', price: 850, category: 'Produits Frais', stock: 200, unit: 'brique', store: 'Géant Casino', image: 'https://images.unsplash.com/photo-1550583724-125581dc228b?q=80&w=100' },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">Gestion des Produits</h1>
          <p className="text-slate-500">Gérez le catalogue global rattaché aux magasins.</p>
        </div>
        <Button className="gap-2">
          <Plus size={20} /> Nouveau produit
        </Button>
      </div>

      <Card className="p-0 overflow-hidden" isHoverable={false}>
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Rechercher un produit..." className="input-field pl-12 h-11" />
          </div>
          <div className="flex gap-2">
             <Button variant="outline" className="gap-2 h-11">
               <Filter size={18} /> Filtres
             </Button>
             <select className="input-field h-11 w-40 py-0 px-4 appearance-none cursor-pointer">
               <option>Tous les magasins</option>
               <option>Mbolo</option>
               <option>Géant Casino</option>
             </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
              <tr>
                <th className="px-6 py-4">Produit</th>
                <th className="px-6 py-4">Magasin</th>
                <th className="px-6 py-4">Prix</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-100">
                        <Image src={product.image} alt={product.name} fill className="object-contain p-1" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm">{product.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{product.category}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">{product.store}</td>
                  <td className="px-6 py-4">
                     <span className="font-black text-brand-primary">{product.price.toLocaleString()} CFA</span>
                     <span className="text-[10px] text-slate-400 block">par {product.unit}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                         <div
                           className="h-full bg-brand-primary"
                           style={{ width: `${Math.min(100, product.stock / 2)}%` }}
                         />
                       </div>
                       <span className="text-xs font-bold text-slate-600">{product.stock}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-slate-400 hover:text-brand-primary transition-colors"><Edit2 size={18} /></button>
                      <button
                        onClick={() => setProducts(products.filter(p => p.id !== product.id))}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      ><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
