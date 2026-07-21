import React from 'react';
import { CheckoutHeaderClient } from './CheckoutHeaderClient';

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <CheckoutHeaderClient />

      <main className="flex-grow">
        {children}
      </main>

      {/* Minimal Footer */}
      <footer className="py-8 text-center text-slate-400 text-xs font-medium">
        &copy; 2026 Mes Courses Faciles. Tous droits réservés. Paiement sécurisé SSL.
      </footer>
    </div>
  );
}
