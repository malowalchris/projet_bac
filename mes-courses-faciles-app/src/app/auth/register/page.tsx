"use client";

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Mail, Lock, User, Phone, ArrowRight, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center container mx-auto px-4 py-12">
      <Card className="w-full max-w-md p-8 sm:p-10" isHoverable={false}>
        <div className="text-center space-y-2 mb-8">
          <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingCart size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-800">Créer un compte</h1>
          <p className="text-slate-500">Rejoignez-nous pour simplifier vos courses.</p>
        </div>

        <form className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nom Complet</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Jean Dupont"
                className="input-field pl-12"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                placeholder="votre@email.com"
                className="input-field pl-12"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Téléphone</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="tel"
                placeholder="+241 07 00 00 00"
                className="input-field pl-12"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                placeholder="••••••••"
                className="input-field pl-12"
                pattern="(?=.*\d)(?=.*[A-Z]).{8,}"
                title="8 caractères minimum, une majuscule et un chiffre"
                required
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Min. 8 caractères, une majuscule et un chiffre.</p>
          </div>

          <div className="pt-2">
            <Button className="w-full h-14 text-lg font-bold">
              S&apos;inscrire <ArrowRight className="ml-2" />
            </Button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="font-bold text-brand-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
