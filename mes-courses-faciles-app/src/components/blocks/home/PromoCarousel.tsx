"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Clock, Leaf, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface PromoCarouselProps {
  userName: string;
}

const IMAGES = [
  {
    url: '/images/hero/banner-fresh.jpg',
    title: 'Fraîcheur Absolue',
    subtitle: 'Des fruits et légumes de qualité supérieure choisis avec soin.',
  },
  {
    url: '/images/hero/banner-supermarket.jpg',
    title: 'Supermarchés Partenaires',
    subtitle: 'Faites vos courses dans les meilleures enseignes de Libreville.',
  },
  {
    url: '/images/hero/banner-delivery.jpg',
    title: 'Livraison Express',
    subtitle: 'Vos achats livrés chez vous à Libreville en moins de 45 minutes.',
  },
  {
    url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80',
    title: 'Paiement Sécurisé',
    subtitle: 'Réglez simplement via Airtel Money, Moov Money ou Cash.',
  }
];

export function PromoCarousel({ userName }: PromoCarouselProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-100 dark:bg-slate-950 min-h-[480px] sm:min-h-[520px] flex items-center p-4 sm:p-8 md:p-12 border border-slate-200/60 dark:border-white/10 shadow-2xl">
      {/* Background Image Carousel with cross-fade & dark overlay */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence>
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Image
              src={IMAGES[index].url}
              alt={IMAGES[index].title}
              fill
              priority={true}
              unoptimized={true}
              style={{ objectFit: 'cover' }}
              sizes="(max-w-7xl) 100vw, 1200px"
              className="contrast-105"
            />
          </motion.div>
        </AnimatePresence>
        {/* Overlay d'assombrissement pour garantir la lisibilité optimale du texte et des boutons */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-900/55 to-transparent dark:from-slate-950/85 dark:via-slate-950/70 z-1 pointer-events-none" />
      </div>

      {/* Glassmorphism Card (Floating Container) */}
      <div className="relative z-10 w-full flex justify-start items-center">
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/60 dark:border-white/20 shadow-2xl rounded-3xl p-6 sm:p-8 md:p-12 w-full max-w-2xl space-y-6 sm:space-y-8 text-left">
          
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/30 border border-emerald-250/50 dark:border-emerald-900/30 px-3.5 py-1.5 rounded-full uppercase tracking-widest w-fit">
            <Sparkles size={12} className="animate-pulse text-emerald-600 dark:text-emerald-400" /> Espace Client Privilégié
          </span>
          
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight text-slate-850 dark:text-white">
              <span className="text-slate-800 dark:text-slate-200 font-bold block mb-1 text-2xl sm:text-3xl">Ravi de vous revoir,</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400 font-black">
                {userName || 'Client'} !
              </span>
            </h1>
            
            <div className="h-12 sm:h-8">
              <AnimatePresence mode="wait">
                <motion.p
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="text-slate-600 dark:text-slate-300 text-base sm:text-lg font-medium max-w-xl"
                >
                  {IMAGES[index].title} — {IMAGES[index].subtitle}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* Subtly Styled Badges */}
          <div className="flex flex-wrap gap-3 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 pt-2">
            <span className="flex items-center gap-1.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-sm px-3.5 py-2 rounded-xl">
              <Clock size={15} className="text-slate-800 dark:text-slate-200" /> 45 min chrono
            </span>
            <span className="flex items-center gap-1.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-sm px-3.5 py-2 rounded-xl">
              <Leaf size={15} className="text-slate-800 dark:text-slate-200" /> Fraîcheur Garantie
            </span>
            <span className="flex items-center gap-1.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-sm px-3.5 py-2 rounded-xl">
              <CreditCard size={15} className="text-slate-800 dark:text-slate-200" /> Airtel & Moov Money
            </span>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-4">
            <Link href="/search" className="w-full sm:w-auto">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-14 px-8 rounded-2xl shadow-lg shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5 border-none flex items-center justify-center gap-2 group w-full">
                Commencer mes courses
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-6 right-8 z-10 flex gap-2">
        {IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-2.5 rounded-full transition-all duration-350 outline-none cursor-pointer ${
              i === index ? 'w-8 bg-emerald-600 dark:bg-emerald-400' : 'w-2.5 bg-slate-400/40 dark:bg-white/30 hover:bg-slate-400/60'
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
