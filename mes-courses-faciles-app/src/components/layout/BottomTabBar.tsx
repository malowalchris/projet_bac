"use client";

import React from 'react';
import Link from 'next/link';
import { Home, ShoppingBag, Search, User, Heart } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { CartDrawer } from '@/components/blocks/cart/CartDrawer';
import { useAuth } from '@/context/AuthContext';

export const BottomTabBar = () => {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();

  const navItems = [
    { icon: Home, label: 'Accueil', href: '/' },
    { icon: Search, label: 'Chercher', href: '/search' },
    { icon: ShoppingBag, label: 'Panier', href: '#', isCart: true },
    { icon: Heart, label: 'Favoris', href: isAuthenticated ? '/favorites' : '?auth=login&callbackUrl=/favorites' },
    { icon: User, label: 'Profil', href: isAuthenticated ? (user?.role === 'ADMIN' ? '/admin/settings' : '/profile') : '?auth=login&callbackUrl=' + encodeURIComponent(user?.role === 'ADMIN' ? '/admin/settings' : '/profile') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-t border-border/50 lg:hidden px-2 pb-safe supports-[backdrop-filter]:bg-background/60">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          if (item.isCart) {
             return (
                 <div key="cart-drawer" className="flex flex-col items-center justify-center flex-1 min-w-0 transition-colors">
                     <CartDrawer isBottomTab />
                     <span className="text-[10px] font-medium mt-0.5 transition-colors text-muted-foreground">
                        Panier
                     </span>
                 </div>
             );
          }

          const isActive = pathname === item.href;

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 min-w-0 transition-colors"
            >
              <div className={`relative p-1 rounded-xl transition-all ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-medium mt-0.5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
