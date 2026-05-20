"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Search, Edit2, Trash2, MapPin, Phone, Globe } from 'lucide-react';
import Image from 'next/image';

const INITIAL_STORES = [
  { id: '1', name: 'Mbolo', address: 'Bvd Triomphal', district: 'Centre', phone: '011-00-00-00', status: 'Actif', logo: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=100' },
  { id: '2', name: 'Géant Casino', address: 'Camp de Gaulle', district: 'Nord', phone: '011-00-00-01', status: 'Actif', logo: 'https://images.unsplash.com/photo-1604719312563-861ac03ef4d2?q=80&w=100' },
];

export default function AdminStoresPage() {
  const [stores, setStores] = useState(INITIAL_STORES);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">Gestion des Magasins</h1>
          <p className="text-slate-500">Ajoutez et gérez vos boutiques partenaires.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus size={20} /> Ajouter un magasin
        </Button>
      </div>

      <Card className="p-0 overflow-hidden" isHoverable={false}>
        <div className="p-6 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Rechercher un magasin..." className="input-field pl-12 h-11" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
              <tr>
                <th className="px-6 py-4">Magasin</th>
                <th className="px-6 py-4">Localisation</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stores.map((store) => (
                <tr key={store.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-100">
                        <Image src={store.logo} alt={store.name} fill className="object-cover" />
                      </div>
                      <span className="font-bold text-slate-800">{store.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600 flex flex-col">
                      <span className="font-medium">{store.address}</span>
                      <span className="text-xs text-slate-400">{store.district}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{store.phone}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-[10px] font-bold uppercase">
                      {store.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-slate-400 hover:text-brand-primary transition-colors"><Edit2 size={18} /></button>
                      <button
                        onClick={() => setStores(stores.filter(s => s.id !== store.id))}
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
