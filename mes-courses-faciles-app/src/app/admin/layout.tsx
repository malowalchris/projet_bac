"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingBag,
  Settings,
  BarChart3,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Bell
} from 'lucide-react';

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: 'Vue d\'ensemble', href: '/admin' },
  { icon: Package, label: 'Produits', href: '/admin/products' },
  { icon: ShoppingBag, label: 'Magasins', href: '/admin/stores' },
  { icon: ShoppingBag, label: 'Commandes', href: '/admin/orders' },
  { icon: Users, label: 'Clients', href: '/admin/users' },
  { icon: BarChart3, label: 'Analytiques', href: '/admin/analytics' },
  { icon: Settings, label: 'Paramètres', href: '/admin/settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-brand-secondary text-white transition-all duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'}
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="h-20 flex items-center px-6 gap-4 border-b border-white/10">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <ShoppingBag size={24} />
            </div>
            {isSidebarOpen && (
              <span className="font-bold text-xl whitespace-nowrap">Admin MCF</span>
            )}
            <button className="lg:hidden ml-auto" onClick={() => setIsSidebarOpen(false)}>
              <X />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto no-scrollbar">
            {MENU_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group
                    ${isActive ? 'bg-brand-primary text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                  `}
                >
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  {isSidebarOpen && (
                    <span className="font-medium flex-1">{item.label}</span>
                  )}
                  {isActive && isSidebarOpen && <ChevronRight size={16} />}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-white/10">
             <button className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
               <LogOut size={22} />
               {isSidebarOpen && <span className="font-medium">Déconnexion</span>}
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-slate-400 hover:text-brand-primary">
              <Bell size={22} />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
            </button>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-3">
               <div className="text-right hidden sm:block">
                 <p className="text-sm font-bold text-slate-800 leading-none">Admin Jules</p>
                 <p className="text-xs text-slate-500 mt-1">Super Admin</p>
               </div>
               <div className="w-10 h-10 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary font-bold">
                 J
               </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
