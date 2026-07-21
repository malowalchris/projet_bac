"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, Eye, EyeOff, X, CheckCircle2, ShoppingBag, ShieldCheck, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { loginAction, registerAction } from '@/actions/auth';
import { syncCartAction } from '@/actions/ecommerce';
import { useAuth } from '@/context/AuthContext';

export function AuthModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { login } = useAuth();

  const authMode = searchParams.get('auth');
  const isOpen = authMode === 'login' || authMode === 'register';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  useEffect(() => {
    if (authMode === 'login' || authMode === 'register') {
      setMode(authMode);
      setError('');
    }
  }, [authMode]);

  if (!isOpen) return null;

  const handleClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('auth');
    const newQuery = params.toString() ? `?${params.toString()}` : '';
    router.replace(`${pathname}${newQuery}`);
  };

  const handleTabChange = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setError('');
    const params = new URLSearchParams(searchParams.toString());
    params.set('auth', newMode);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleDemoLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setMode('login');
    setError('');
    setShowDemoAccounts(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        const res = await loginAction({ email, password });
        if (!res.success || !res.user) throw new Error(res.error || 'Erreur lors de la connexion');
        
        // Fusion du panier visiteur (localStorage) avec le serveur avant de réhydrater le store client
        try {
          const savedCart = localStorage.getItem('mcf_cart');
          if (savedCart) {
            const localItems = JSON.parse(savedCart);
            if (Array.isArray(localItems) && localItems.length > 0) {
              await syncCartAction(localItems);
            }
          }
        } catch (e) {
          console.error('Erreur lors de la synchronisation du panier post-connexion:', e);
        }

        login({
          id: res.user.id,
          email: res.user.email,
          name: res.user.name || 'Utilisateur',
          role: res.user.role
        });
        router.refresh(); // <-- Avertir les Server Components du nouveau cookie

        // 1. Priorité absolue au Callback : si callbackUrl présent, y aller directement
        const callbackUrl = searchParams.get('callbackUrl');
        if (callbackUrl) {
          router.push(callbackUrl);
        } else if (res.user.role === 'ADMIN') {
          router.push('/admin');
        } else if (pathname === '/auth/login' || pathname.includes('/auth/')) {
          router.push('/'); // Fallback par défaut si connexion spontanée depuis page auth
        } else {
          router.push(pathname); // Force le retrait du paramètre ?auth=login tout en restant sur la page
        }
      } else {
        const res = await registerAction({
          nom: name,
          name,
          email,
          motDePasse: password,
          password,
          telephone: phone,
          phone
        });
        if (!res.success || !res.user) throw new Error(res.error || "Erreur lors de l'inscription");

        // Fusion du panier visiteur (localStorage) avec le serveur après inscription
        try {
          const savedCart = localStorage.getItem('mcf_cart');
          if (savedCart) {
            const localItems = JSON.parse(savedCart);
            if (Array.isArray(localItems) && localItems.length > 0) {
              await syncCartAction(localItems);
            }
          }
        } catch (e) {
          console.error("Erreur lors de la synchronisation du panier post-inscription:", e);
        }

        login({
          id: res.user.id,
          email: res.user.email,
          name: res.user.nom || res.user.name || 'Utilisateur',
          role: res.user.role
        });
        router.refresh(); // <-- Avertir les Server Components du nouveau cookie

        // 1. Priorité absolue au Callback : si callbackUrl présent, y aller directement
        const callbackUrl = searchParams.get('callbackUrl');
        if (callbackUrl) {
          router.push(callbackUrl);
        } else if (res.user.role === 'ADMIN') {
          router.push('/admin');
        } else if (pathname === '/auth/login' || pathname.includes('/auth/')) {
          router.push('/');
        } else {
          router.push(pathname); // Force le retrait du paramètre ?auth=register tout en restant sur la page
        }
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal centering wrapper */}
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          {/* Modal panel container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative bg-background dark:bg-slate-900 w-full max-w-4xl min-h-[600px] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 z-10 text-left"
          >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-muted-foreground hover:text-foreground transition-all active:scale-90 z-20"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>

          {/* Left panel: Visuel & Pitch (hidden on mobile) */}
          <div className="hidden md:flex flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-indigo-50/70 via-violet-50/70 to-indigo-100/50 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950">
            {/* Mesh gradient circles */}
            <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-indigo-400/15 blur-[60px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-violet-400/15 blur-[60px] pointer-events-none" />
            
            {/* Logo */}
            <div className="flex items-center gap-2 text-brand-primary z-10">
              <ShoppingBag className="h-6 w-6 text-brand-primary" />
              <span className="font-bold text-xl tracking-tight">
                Mes Courses Faciles
              </span>
            </div>

            {/* Main Content */}
            <div className="space-y-6 my-auto z-10 py-8">
              <h2 className="text-4xl font-black text-slate-850 dark:text-white leading-tight">
                Faites vos courses avec <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-safran to-amber-500 text-glow-safran">
                  excellence.
                </span>
              </h2>
              <p className="text-slate-600 dark:text-slate-350 text-base leading-relaxed">
                Une plateforme moderne conçue pour simplifier vos courses, optimiser votre budget et vous faire gagner du temps au quotidien.
              </p>

              {/* Checklist */}
              <div className="space-y-3.5 pt-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Livraison sécurisée & rapide à Libreville</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Paiement Mobile Money & Espèces</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Produits frais & garantis</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-xs text-slate-400 dark:text-slate-500 z-10">
              © {new Date().getFullYear()} Mes Courses Faciles. Tous droits réservés.
            </div>
          </div>

          {/* Right panel: Forms */}
          <div className="flex flex-col justify-center p-8 sm:p-12 bg-background dark:bg-slate-900/50">
            {/* Modal tabs */}
            <div className="flex border-b border-border/50 mb-8 max-w-xs">
              <button
                onClick={() => handleTabChange('login')}
                className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-all outline-none ${
                  mode === 'login'
                    ? 'border-brand-safran text-brand-safran'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Se connecter
              </button>
              <button
                onClick={() => handleTabChange('register')}
                className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-all outline-none ${
                  mode === 'register'
                    ? 'border-brand-safran text-brand-safran'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Créer un compte
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 mb-6 bg-red-55/10 dark:bg-red-500/10 text-red-500 text-sm font-bold rounded-2xl border border-red-200/20">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nom complet</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      name="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      type="text"
                      placeholder="Jean Dupont"
                      className="input-field pl-12"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Adresse email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="jean.dupont@email.com"
                    className="input-field pl-12"
                    required
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      name="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      type="tel"
                      placeholder="+241 07 12 34 56"
                      className="input-field pl-12"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mot de passe</label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="input-field pl-12 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button type="submit" disabled={loading} className="w-full h-14 text-base font-bold bg-brand-primary hover:bg-brand-primary-hover text-white rounded-2xl shadow-lg shadow-brand-primary/25 mt-6 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" /> : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
              </Button>
            </form>

            {/* Accordion: Demonstration Accounts (Permanent) */}
            <div className="mt-8 border border-border/50 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/20">
              <button
                type="button"
                onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                className="w-full px-5 py-3.5 flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-850/30 transition-all"
              >
                <span>Comptes de démonstration</span>
                {showDemoAccounts ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              
              {showDemoAccounts && (
                <div className="px-5 pb-4 space-y-3 pt-1 border-t border-border/40 animate-in slide-in-from-top-1 duration-200">
                  <p className="text-xs text-muted-foreground">Cliquez sur un compte de démonstration pour vous connecter instantanément :</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleDemoLogin('client@mcf.com', 'Client12345')}
                      className="text-left p-3 rounded-xl border border-border/50 bg-background hover:bg-slate-50 dark:bg-slate-900/60 dark:hover:bg-slate-850 hover:border-brand-safran/30 transition-all group"
                    >
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Espace Client</div>
                      <div className="text-[10px] text-muted-foreground truncate group-hover:text-brand-safran/80 transition-colors">client@mcf.com</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoLogin('admin@mcf.com', 'Admin12345')}
                      className="text-left p-3 rounded-xl border border-border/50 bg-background hover:bg-slate-50 dark:bg-slate-900/60 dark:hover:bg-slate-850 hover:border-brand-safran/30 transition-all group"
                    >
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Panel Administrateur</div>
                      <div className="text-[10px] text-muted-foreground truncate group-hover:text-brand-safran/80 transition-colors">admin@mcf.com</div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer SSL Encryption */}
            <div className="mt-8 text-center flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Connexion sécurisée · Chiffrement SSL/TLS</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </AnimatePresence>
  );
}
