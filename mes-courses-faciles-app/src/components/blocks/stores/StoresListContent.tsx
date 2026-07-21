"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Search as SearchIcon, X, Loader2, Store as StoreIcon, ChevronLeft, ChevronRight, SlidersHorizontal, MapPin } from 'lucide-react';
import { StoreCard } from '@/components/blocks/catalog/StoreCard';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/common/PageLayout';
import { AnimatePresence, motion, type Variants } from 'framer-motion';

interface StoreWithRelations {
  id: string;
  name: string;
  address: string;
  district: string;
  phone: string;
  logo: string | null;
  description: string | null;
  isActive: boolean;
  isDeleted: boolean;
  products: {
    category: string;
  }[];
}

interface StoresListContentProps {
  initialStores: StoreWithRelations[];
  districts: string[];
}

const ITEMS_PER_PAGE = 6;

// Helper to deterministically calculate a rating based on store name/ID
const getStoreRating = (id: string): number => {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return parseFloat((4.4 + (sum % 6) * 0.1).toFixed(1));
};

// Helper to deterministically map a delivery time value in minutes based on store name/ID
const getStoreDeliveryMinutes = (id: string): number => {
  const times = [25, 30, 35, 45];
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return times[sum % times.length];
};

const getStoreDeliveryTime = (id: string): string => {
  const mins = getStoreDeliveryMinutes(id);
  return `${mins}-${mins + 15} min`;
};

// Helper to extract unique categories from products associated with a store
const getStoreCategories = (store: StoreWithRelations): string[] => {
  if (!store.products || store.products.length === 0) {
    return ['Alimentation', 'Hygiène'];
  }
  const cats = Array.from(new Set(store.products.map(p => p.category)));
  return cats.slice(0, 3); // limit to 3 categories to display cleanly
};

// Algorithme de troncation de pagination
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

export function StoresListContent({ initialStores, districts }: StoresListContentProps) {
  const [query, setQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSort, setSelectedSort] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Reset page when filters or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedDistrict, selectedSort]);

  // Enrich stores with calculated properties for rating, delivery time, and categories
  const enrichedStores = useMemo(() => {
    return initialStores.map(store => {
      const rating = getStoreRating(store.id);
      const deliveryMins = getStoreDeliveryMinutes(store.id);
      const deliveryTime = getStoreDeliveryTime(store.id);
      const categories = getStoreCategories(store);
      return {
        ...store,
        rating,
        deliveryMins,
        deliveryTime,
        categories,
      };
    });
  }, [initialStores]);

  // Filter and sort stores
  const filteredAndSortedStores = useMemo(() => {
    let result = [...enrichedStores];

    // Search query filter (matches name, address, or district)
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        store =>
          store.name.toLowerCase().includes(q) ||
          store.address.toLowerCase().includes(q) ||
          store.district.toLowerCase().includes(q)
      );
    }

    // District filter
    if (selectedDistrict) {
      result = result.filter(store => store.district === selectedDistrict);
    }

    // Sort criteria
    if (selectedSort === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (selectedSort === 'delivery') {
      result.sort((a, b) => a.deliveryMins - b.deliveryMins);
    } else if (selectedSort === 'name_asc') {
      result.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    } else if (selectedSort === 'name_desc') {
      result.sort((a, b) => b.name.localeCompare(a.name, 'fr'));
    }

    return result;
  }, [enrichedStores, query, selectedDistrict, selectedSort]);

  // Paginated stores
  const paginatedStores = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedStores.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedStores, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedStores.length / ITEMS_PER_PAGE);

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
      {/* District Selector */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Quartier</label>
        <select
          value={selectedDistrict}
          onChange={(e) => {
            setSelectedDistrict(e.target.value);
            setIsMobileFiltersOpen(false);
          }}
          className="w-full h-11 px-3 rounded-xl bg-white/40 dark:bg-slate-800/30 border border-slate-200/40 dark:border-white/10 outline-none text-xs font-semibold focus:border-brand-primary/40 focus:shadow-glow transition-all text-foreground"
        >
          <option value="" className="bg-background text-foreground text-xs font-semibold">Tous les quartiers</option>
          {districts.map(district => (
            <option key={district} value={district} className="bg-background text-foreground text-xs font-semibold">
              {district}
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
          <option value="" className="bg-background text-foreground text-xs font-semibold">Par défaut</option>
          <option value="rating" className="bg-background text-foreground text-xs font-semibold">Note : la plus haute</option>
          <option value="delivery" className="bg-background text-foreground text-xs font-semibold">Livraison : la plus rapide</option>
          <option value="name_asc" className="bg-background text-foreground text-xs font-semibold">Nom : A-Z</option>
          <option value="name_desc" className="bg-background text-foreground text-xs font-semibold">Nom : Z-A</option>
        </select>
      </div>

      {/* Reset Button */}
      {(selectedDistrict || selectedSort || query) && (
        <button
          onClick={() => {
            setQuery('');
            setSelectedDistrict('');
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

  return (
    <PageLayout withPadding>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-4 max-w-6xl space-y-8"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col gap-4">
          <span className="text-xs font-bold text-brand-safran bg-brand-safran/20 border border-brand-safran/20 px-4 py-1.5 rounded-full uppercase tracking-wider w-fit">
            Nos Magasins Partenaires
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 dark:from-white dark:to-slate-300">
            Trouvez votre magasin
          </h1>
        </motion.div>

        {/* ── Mobile Filters Trigger & Search Input ── */}
        <motion.div variants={itemVariants} className="flex flex-col gap-4 lg:hidden">
          <div className="relative glass-card rounded-3xl p-1 border-luminous hover:shadow-glow hover:border-white/50 focus-within:border-brand-primary/40 focus-within:shadow-glow transition-all duration-300 group">
            <SearchIcon
              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors"
              size={18}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par nom ou adresse..."
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
              {(selectedDistrict || selectedSort) && (
                <span className="h-2 w-2 rounded-full bg-brand-primary" />
              )}
            </button>
          </div>
        </motion.div>

        {/* ── Main Layout: Sidebar + Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Desktop Sticky Sidebar */}
          <aside className="hidden lg:block lg:col-span-1 sticky top-24 glass-card p-6 rounded-[2rem] border border-white/20 dark:border-white/5 space-y-6 shadow-sm">
            {/* Search Box in Desktop Sidebar */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Rechercher</label>
              <div className="relative rounded-2xl bg-white/40 dark:bg-slate-800/20 border border-slate-200/40 dark:border-white/10 focus-within:border-brand-primary/40 focus-within:shadow-glow transition-all duration-300">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nom, quartier..."
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
          <main className="lg:col-span-3 space-y-6">
            <div className="flex justify-between items-center border-b border-border/40 pb-4 gap-2">
              <p className="text-slate-500 font-medium text-sm">
                {query || selectedDistrict ? (
                  <>
                    Résultats filtrés
                    {query && <> pour &quot;<span className="font-bold text-slate-800 dark:text-white">{query}</span>&quot;</>}
                    {selectedDistrict && <> à <span className="font-bold text-slate-800 dark:text-white">{selectedDistrict}</span></>}
                  </>
                ) : (
                  "Tous les magasins partenaires"
                )}
              </p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                {filteredAndSortedStores.length} magasin{filteredAndSortedStores.length > 1 ? 's' : ''} trouvé{filteredAndSortedStores.length > 1 ? 's' : ''}
              </span>
            </div>

            {paginatedStores.length > 0 ? (
              <div className="space-y-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {paginatedStores.map((store, index) => (
                    <div key={store.id} className="h-[280px]">
                      <StoreCard
                        id={store.id}
                        name={store.name}
                        image={store.logo}
                        location={store.address}
                        rating={store.rating}
                        deliveryTime={store.deliveryTime}
                        categories={store.categories}
                        isFeatured={false}
                        priority={index === 0}
                      />
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center pt-8">
                    <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/40 dark:bg-slate-900/30 border border-slate-200/50 dark:border-white/10 backdrop-blur-md shadow-lg shadow-black/5">
                      {/* Previous Button */}
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="h-10 px-3 flex items-center gap-1 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-655 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/40 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-102 active:scale-98 transition-all duration-200 cursor-pointer"
                        aria-label="Page précédente"
                      >
                        <ChevronLeft size={16} />
                        <span className="hidden sm:inline">Précédent</span>
                      </button>

                      {/* Page numbers with ellipses */}
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

                      {/* Next Button */}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="h-10 px-3 flex items-center gap-1 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-655 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white hover:bg-white/55 dark:hover:bg-slate-800/40 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-102 active:scale-98 transition-all duration-200 cursor-pointer"
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
                  <StoreIcon size={36} strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-3">Aucun magasin trouvé</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Aucun partenaire ne correspond à vos critères de recherche. Essayez de réinitialiser les filtres.
                </p>
                <button
                  onClick={() => {
                    setQuery('');
                    setSelectedDistrict('');
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
              className="fixed inset-0 bg-black z-50 lg:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 max-w-[90vw] bg-white dark:bg-slate-900 border-l border-slate-200/50 dark:border-white/10 p-6 z-55 flex flex-col justify-between shadow-2xl lg:hidden overflow-y-auto no-scrollbar"
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
