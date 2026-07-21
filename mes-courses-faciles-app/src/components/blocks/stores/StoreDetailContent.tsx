"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Search as SearchIcon, X, Loader2, ChevronLeft, ChevronRight,
  SlidersHorizontal, MapPin, Phone, PackageX
} from 'lucide-react';
import { ProductCard } from '@/components/blocks/catalog/ProductCard';
import { ProductSkeleton } from '@/components/common/Skeletons';
import { Card } from '@/components/ui/card';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { PageLayout } from '@/components/common/PageLayout';
import { BackButton } from '@/components/common/BackButton';
import type { Store as StoreType, Product as ProductType } from '@/types';
import { CATEGORIES as CENTRAL_CATEGORIES } from '@/lib/constants/categories';
import { isAbortOrNetworkCancellationError } from '@/lib/network-resilience';

const CATEGORIES = Object.keys(CENTRAL_CATEGORIES).filter(c => c !== 'Divers');

interface StoreDetailContentProps {
  store: StoreType;
}

const getPageNumbers = (currentPage: number, totalPages: number) => {
  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    
    let adjustedStart = start;
    let adjustedEnd = end;
    if (currentPage <= 3) adjustedEnd = 4;
    if (currentPage >= totalPages - 2) adjustedStart = totalPages - 3;
    
    for (let i = adjustedStart; i <= adjustedEnd; i++) pages.push(i);
    
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }
  return pages;
};

export function StoreDetailContent({ store }: StoreDetailContentProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSort, setSelectedSort] = useState('');
  const [results, setResults] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedCategory, selectedSort]);

  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return results.slice(start, start + ITEMS_PER_PAGE);
  }, [results, currentPage]);

  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);

  useEffect(() => {
    const controller = new AbortController();
    const fetchResults = async () => {
      setLoading(true);
      try {
        const url = `/api/products?storeId=${store.id}&q=${encodeURIComponent(query)}&category=${encodeURIComponent(selectedCategory)}&sort=${encodeURIComponent(selectedSort)}`;
        const res = await fetch(url, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (!controller.signal.aborted) {
          setResults(Array.isArray(data) ? data : []);
        }
      } catch (e: unknown) {
        if (!isAbortOrNetworkCancellationError(e)) {
          console.error(e);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    
    const timer = setTimeout(fetchResults, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [store.id, query, selectedCategory, selectedSort]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 130, damping: 16 } },
  };

  const renderFiltersContent = () => (
    <div className="space-y-6">
      {/* Category Selector */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Catégorie</label>
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setIsMobileFiltersOpen(false);
          }}
          className="w-full h-11 px-3 rounded-xl bg-white/40 dark:bg-slate-800/30 border border-slate-200/40 dark:border-white/10 outline-none text-xs font-semibold focus:border-brand-primary/40 focus:shadow-glow transition-all text-foreground"
        >
          <option value="" className="bg-background text-foreground text-xs font-semibold">Toutes les catégories</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat} className="bg-background text-foreground text-xs font-semibold">
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Sort Selector */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Trier par</label>
        <select
          value={selectedSort}
          onChange={(e) => {
            setSelectedSort(e.target.value);
            setIsMobileFiltersOpen(false);
          }}
          className="w-full h-11 px-3 rounded-xl bg-white/40 dark:bg-slate-800/30 border border-slate-200/40 dark:border-white/10 outline-none text-xs font-semibold focus:border-brand-primary/40 focus:shadow-glow transition-all text-foreground"
        >
          <option value="" className="bg-background text-foreground text-xs font-semibold">Derniers ajouts (Par défaut)</option>
          <option value="price_asc" className="bg-background text-foreground text-xs font-semibold">Prix : Croissant</option>
          <option value="price_desc" className="bg-background text-foreground text-xs font-semibold">Prix : Décroissant</option>
          <option value="name_asc" className="bg-background text-foreground text-xs font-semibold">Nom : A-Z</option>
          <option value="name_desc" className="bg-background text-foreground text-xs font-semibold">Nom : Z-A</option>
        </select>
      </div>

      {/* Reset Button */}
      {(selectedCategory || selectedSort || query) && (
        <button
          onClick={() => {
            setQuery('');
            setSelectedCategory('');
            setSelectedSort('');
            setIsMobileFiltersOpen(false);
          }}
          className="w-full h-10 rounded-xl bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/10 hover:border-transparent font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer active:scale-98"
        >
          <X size={14} />
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );

  const storeLogo = store.logo || "/images/store-placeholder.svg";

  return (
    <PageLayout withPadding={false}>
      {/* Store Header Navigation & Identity */}
      <div className="container mx-auto px-4 pt-6 max-w-6xl">
        {/* Navigation Row (Phase 1) */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BackButton href="/" label="Retour" className="hidden sm:inline-flex" />
            <BackButton href="/" label="" className="sm:hidden h-10 w-10 p-0 flex items-center justify-center rounded-full" />
          </div>
          <nav className="flex items-center gap-1 text-xs text-slate-500 font-bold">
            <span>Magasins</span>
            <ChevronRight size={12} />
            <span className="text-brand-primary uppercase truncate max-w-[200px]">{store.nom || store.name}</span>
          </nav>
        </div>

        {/* Premium Card Container (Phase 2 & 4) */}
        <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-sm rounded-2xl p-6 mt-6 mb-8">
          {/* Flexbox Alignment of Identity (Phase 3) */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Logo */}
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-white/5 overflow-hidden relative flex-shrink-0">
              <Image
                src={storeLogo}
                alt={store.nom || store.name || 'Magasin'}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>

            {/* Text Information */}
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-black text-slate-800 dark:text-white capitalize">{store.nom || store.name}</h1>
              {store.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl font-semibold leading-snug">{store.description}</p>
              )}
              {/* Contact Icons */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1 font-bold">
                  <MapPin size={14} className="text-brand-primary" />
                  {store.quartier || store.district}, Libreville ({store.adresse || store.address})
                </span>
                <span className="flex items-center gap-1 font-bold">
                  <Phone size={14} className="text-brand-safran" />
                  Tél : {store.telephone || store.phone}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* ── Mobile Filters Trigger & Search Input ── */}
          <motion.div variants={itemVariants} className="flex flex-col gap-4 md:hidden">
            <div className="relative glass-card rounded-3xl p-1 border-luminous hover:shadow-glow hover:border-white/50 focus-within:border-brand-primary/40 focus-within:shadow-glow transition-all duration-300 group">
              <SearchIcon
                className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors"
                size={18}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Chercher dans ce magasin..."
                className="w-full bg-transparent border-none py-3.5 pl-12 pr-10 text-sm focus:outline-none placeholder-slate-400 text-foreground font-semibold"
                autoComplete="off"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full text-slate-400 hover:text-foreground transition-all cursor-pointer active:scale-90"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className="flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl bg-white/40 dark:bg-slate-800/30 border border-slate-200/50 dark:border-white/10 font-bold text-sm text-foreground hover:bg-white/70 dark:hover:bg-slate-800/60 transition-all cursor-pointer active:scale-98 shadow-sm"
              >
                <SlidersHorizontal size={18} className="text-brand-primary" />
                Filtrer & Trier
                {(selectedCategory || selectedSort) && (
                  <span className="h-2 w-2 rounded-full bg-brand-primary" />
                )}
              </button>
            </div>
          </motion.div>

          {/* ── Main Layout: Sidebar + Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
            {/* Desktop Sticky Sidebar */}
            <aside className="hidden md:block sticky top-28 self-start h-fit max-h-[calc(100vh-8rem)] overflow-y-auto md:col-span-1 glass-card p-6 rounded-[2rem] border border-white/20 dark:border-white/5 space-y-6 shadow-sm">
              {/* Search Box in Desktop Sidebar */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Rechercher</label>
                <div className="relative rounded-2xl bg-white/40 dark:bg-slate-800/20 border border-slate-200/40 dark:border-white/10 focus-within:border-brand-primary/40 focus-within:shadow-glow transition-all duration-300">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Un article..."
                    className="w-full bg-transparent border-none py-3 pl-4 pr-10 text-xs focus:outline-none placeholder-slate-400 text-foreground font-semibold"
                  />
                  {query ? (
                    <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full text-slate-400">
                      <X size={12} />
                    </button>
                  ) : (
                    <SearchIcon size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  )}
                </div>
              </div>

              {renderFiltersContent()}
            </aside>

            {/* Right Column: Grid and Results count */}
            <main className="md:col-span-3 space-y-6">
              <div className="flex justify-between items-center border-b border-border/40 pb-4 gap-2">
                <p className="text-slate-500 font-medium text-sm">
                  {query || selectedCategory ? (
                    <>
                      Résultats filtrés
                      {query && <> pour &quot;<span className="font-bold text-slate-800 dark:text-white">{query}</span>&quot;</>}
                      {selectedCategory && <> dans <span className="font-bold text-slate-800 dark:text-white">{selectedCategory}</span></>}
                    </>
                  ) : (
                    "Tous les produits du magasin"
                  )}
                </p>
                {!loading && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                    {results.length} produit{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <ProductSkeleton key={i} />
                  ))}
                </div>
              ) : paginatedResults.length > 0 ? (
                <div className="space-y-10">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                    {paginatedResults.map((p, index) => {
                      let imgUrl = '/images/product-placeholder.svg';
                      try {
                        const imgs = JSON.parse(p.images || '[]');
                        if (imgs.length > 0) imgUrl = imgs[0];
                      } catch {}

                      return (
                        <ProductCard
                          key={p.id}
                          id={p.id}
                          name={p.name}
                          price={p.price}
                          category={p.category}
                          unit={p.unit || 'unité'}
                          storeId={p.magasinId || p.storeId || store.id}
                          image={imgUrl}
                          priority={index === 0}
                        />
                      );
                    })}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex justify-center pt-8">
                      <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/40 dark:bg-slate-900/30 border border-slate-200/50 dark:border-white/10 backdrop-blur-md shadow-lg shadow-black/5">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="h-10 px-3 flex items-center gap-1 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-655 dark:text-slate-355 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/40 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-102 active:scale-98 transition-all duration-200 cursor-pointer"
                          aria-label="Page précédente"
                        >
                          <ChevronLeft size={16} />
                          <span className="hidden sm:inline">Précédent</span>
                        </button>

                        {getPageNumbers(currentPage, totalPages).map((page, idx) => {
                          if (page === '...') {
                            return (
                              <span
                                key={`ellipsis-${idx}`}
                                className="h-10 w-8 flex items-center justify-center text-slate-400 select-none font-bold text-sm"
                              >
                                ...
                              </span>
                            );
                          }

                          const pageNum = page as number;
                          const isActive = currentPage === pageNum;

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`h-10 w-10 flex items-center justify-center rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer active:scale-95 hover:scale-105 ${
                                isActive
                                  ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20 border border-transparent'
                                  : 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/55 dark:hover:bg-slate-800/40'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}

                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="h-10 px-3 flex items-center gap-1 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-655 dark:text-slate-355 hover:text-slate-900 dark:hover:text-white hover:bg-white/55 dark:hover:bg-slate-800/40 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-102 active:scale-98 transition-all duration-200 cursor-pointer"
                          aria-label="Page suivante"
                        >
                          <span className="hidden sm:inline">Suivant</span>
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Empty State */
                <Card className="p-16 text-center border-border/50 border-dashed rounded-3xl bg-white/40 dark:bg-slate-800/10 backdrop-blur-md">
                  <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto mb-6 text-muted-foreground shadow-sm">
                    <PackageX size={36} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-2xl font-black text-foreground mb-3">Aucun produit trouvé</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    Aucun article ne correspond à votre recherche ou vos critères de filtrage dans ce magasin.
                  </p>
                  <button
                    onClick={() => {
                      setQuery('');
                      setSelectedCategory('');
                      setSelectedSort('');
                    }}
                    className="px-6 py-3 bg-brand-primary text-white rounded-xl font-bold text-sm shadow-md shadow-brand-primary/25 hover:bg-brand-primary/90 active:scale-95 transition-all cursor-pointer"
                  >
                    Réinitialiser les filtres
                  </button>
                </Card>
              )}
            </main>
          </div>
        </motion.div>
      </div>

      {/* ── Slide-over Mobile Drawer ── */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFiltersOpen(false)}
              className="fixed inset-0 bg-black z-50 md:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 max-w-[90vw] bg-white dark:bg-slate-900 border-l border-slate-200/50 dark:border-white/10 p-6 z-55 flex flex-col justify-between shadow-2xl md:hidden overflow-y-auto no-scrollbar"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-200/40 dark:border-white/5">
                  <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                    <SlidersHorizontal size={18} className="text-brand-primary" />
                    Filtres & Tri
                  </h3>
                  <button
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-foreground cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {renderFiltersContent()}
              </div>

              <div className="pt-6 border-t border-slate-200/40 dark:border-white/5">
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-full h-12 rounded-xl bg-brand-primary text-white font-bold text-sm shadow-md shadow-brand-primary/20 cursor-pointer active:scale-95 transition-all"
                >
                  Appliquer les filtres
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}
