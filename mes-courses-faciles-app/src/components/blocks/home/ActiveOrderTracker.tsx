import React from 'react';
import Link from 'next/link';
import { Package, Truck, CheckCircle2, Clock, ArrowRight, ShoppingBag, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import prisma from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';
import { ORDER_STATUSES } from '@/lib/constants/order-statuses';

// Statuts qui signifient qu'une commande est "en cours"
const ACTIVE_STATUSES: OrderStatus[] = ['PENDING', 'PAID', 'SHIPPED'];

interface ActiveOrderTrackerProps {
  userId: string;
  userName: string;
}

/**
 * Widget "Suivi de commande active" affiché en haut de la page d'accueil
 * pour les utilisateurs authentifiés.
 *
 * Logique :
 * - Cherche la commande la plus récente avec statut PENDING, PAID, ou SHIPPED.
 * - Si trouvée → affiche un stepper animé + CTA "Suivre ma livraison".
 * - Si aucune → affiche un message d'accueil chaleureux + CTA vers les magasins.
 */
export async function ActiveOrderTracker({ userId, userName }: ActiveOrderTrackerProps) {
  // Récupère la commande en cours la plus récente
  let activeOrder: Awaited<ReturnType<typeof prisma.commande.findFirst<{
    include: { magasin: { select: { nom: true } }; lignesCommande: { select: { quantite: true } } };
  }>>> | null = null;
  try {
    activeOrder = await prisma.commande.findFirst({
      where: {
        utilisateurId: userId,
        statut: { in: ACTIVE_STATUSES },
      },
      include: {
        magasin: { select: { nom: true } },
        lignesCommande: { select: { quantite: true } },
      },
      orderBy: { creeLe: 'desc' },
    });
  } catch (error) {
    console.error('ActiveOrderTracker: fetch error (silent)', error);
    activeOrder = null;
  }

  // --- Stepper steps config ---
  const STEPS = [
    { key: 'PENDING', label: ORDER_STATUSES.PENDING.label, icon: Clock,         desc: 'Commande enregistrée' },
    { key: 'PAID',    label: ORDER_STATUSES.PAID.label,    icon: CheckCircle2,  desc: 'Préparation en cours' },
    { key: 'SHIPPED', label: ORDER_STATUSES.SHIPPED.label, icon: Truck,         desc: 'En cours de livraison'},
  ];

  const currentStepIndex = activeOrder
    ? STEPS.findIndex((s) => s.key === activeOrder!.statut)
    : -1;

  const firstName = userName.split(' ')[0];

  // ─── EMPTY STATE ────────────────────────────────────────────────────────────
  if (!activeOrder) {
    return (
      <div className="relative overflow-hidden rounded-[2rem] border border-white/20 dark:border-white/10 bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl shadow-lg shadow-black/5 p-6 sm:p-8">
        {/* Fond dégradé subtil */}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-safran/5 rounded-[2rem] pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Icône animée */}
            <div className="relative w-16 h-16 shrink-0">
              <div className="absolute inset-0 bg-brand-primary/10 rounded-2xl animate-pulse" />
              <div className="relative w-16 h-16 bg-brand-primary/15 rounded-2xl flex items-center justify-center">
                <Sparkles size={28} className="text-brand-primary" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-brand-primary uppercase tracking-widest">Bonjour, {firstName} 👋</p>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white leading-tight">
                Prêt pour vos prochaines courses ?
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Découvrez les meilleures offres du moment dans vos magasins partenaires.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
            <Link href="/#magasins">
              <Button
                className="w-full sm:w-auto h-12 px-6 font-bold rounded-xl shadow-md shadow-brand-primary/20 gap-2"
              >
                <ShoppingBag size={16} />
                Explorer les magasins
              </Button>
            </Link>
            <Link href="/favorites">
              <Button
                variant="outline"
                className="w-full sm:w-auto h-12 px-6 font-bold rounded-xl gap-2 bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm"
              >
                Mes Favoris
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── ACTIVE ORDER STATE ──────────────────────────────────────────────────────
  const totalItems = activeOrder.lignesCommande.reduce((sum, item) => sum + item.quantite, 0);
  const orderId = activeOrder.id.slice(-6).toUpperCase();

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-brand-primary/20 bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl shadow-xl shadow-brand-primary/10 p-6 sm:p-8">
      {/* Fond dégradé accentué pour l'état actif */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-brand-primary/8 via-transparent to-transparent rounded-[2rem] pointer-events-none" />
      {/* Bordure lumineuse en haut */}
      <div aria-hidden="true" className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-brand-primary/50 to-transparent" />

      <div className="relative z-10 space-y-6">
        {/* En-tête du widget */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Icône pulsante */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-brand-primary/20 rounded-2xl animate-ping opacity-40" />
              <div className="relative w-14 h-14 bg-brand-primary/15 rounded-2xl flex items-center justify-center border border-brand-primary/20">
                <Package size={24} className="text-brand-primary" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-0.5">
                Commande en cours
              </p>
              <h2 className="text-xl font-black text-slate-800 dark:text-white">
                #{orderId}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                {(activeOrder as any).magasin?.nom || (activeOrder as any).store?.name} · {totalItems} article{totalItems > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <Link href="/profile?tab=orders" className="shrink-0">
            <Button
              className="h-11 px-5 font-bold rounded-xl shadow-md shadow-brand-primary/20 gap-2 group w-full sm:w-auto"
            >
              Suivre ma livraison
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Stepper de progression */}
        <div className="relative">
          {/* Ligne de connexion entre les étapes */}
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
          <div
            className="absolute top-5 left-5 h-0.5 bg-brand-primary transition-all duration-700 ease-out"
            style={{ width: `${currentStepIndex === 0 ? 0 : currentStepIndex === 1 ? 50 : 100}%` }}
            aria-hidden="true"
          />

          <div className="relative flex justify-between">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isDone = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isPending = index > currentStepIndex;

              return (
                <div key={step.key} className="flex flex-col items-center gap-3 flex-1">
                  {/* Cercle d'étape */}
                  <div
                    className={`
                      relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500
                      ${isDone
                        ? 'bg-brand-primary border-brand-primary text-white shadow-md shadow-brand-primary/30'
                        : isCurrent
                          ? 'bg-white dark:bg-slate-800 border-brand-primary text-brand-primary shadow-lg shadow-brand-primary/30 ring-4 ring-brand-primary/20 animate-pulse'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400'
                      }
                    `}
                  >
                    <StepIcon size={18} strokeWidth={isCurrent ? 2.5 : 2} />
                  </div>

                  {/* Label */}
                  <div className="text-center space-y-0.5">
                    <p className={`text-xs font-bold tracking-tight ${isCurrent ? 'text-brand-primary' : isPending ? 'text-slate-400 dark:text-slate-600' : 'text-slate-600 dark:text-slate-300'}`}>
                      {step.label}
                    </p>
                    <p className={`text-[10px] font-medium hidden sm:block ${isCurrent ? 'text-slate-500' : 'text-slate-400 dark:text-slate-600'}`}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
