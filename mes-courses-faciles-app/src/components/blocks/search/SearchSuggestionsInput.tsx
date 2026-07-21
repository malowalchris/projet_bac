"use client";

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Store, ShoppingBag, Loader2, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isAbortOrNetworkCancellationError } from '@/lib/network-resilience';
import Image from 'next/image';

interface SearchSuggestionsInputProps {
  placeholder?: string;
  className?: string;
  isHero?: boolean;
}

interface StoreSuggestion {
  id: string;
  name: string;
  logo: string | null;
  address: string;
}

interface ProductSuggestion {
  id: string;
  name: string;
  price: number;
  images: string | null;
  category: string;
  storeId: string;
  store: {
    name: string;
  };
}

export function SearchSuggestionsInput({ placeholder = "Rechercher...", className, isHero = false }: SearchSuggestionsInputProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ stores: StoreSuggestion[]; products: ProductSuggestion[] }>({ stores: [], products: [] });
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced API fetch avec AbortController (résilience réseau)
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions({ stores: [], products: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (response.ok && !controller.signal.aborted) {
          const data = await response.json();
          setSuggestions(data);
        }
      } catch (err) {
        if (!isAbortOrNetworkCancellationError(err)) {
          console.error("Failed to fetch search suggestions", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      startTransition(() => {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      });
    }
  };

  const handleSuggestionClick = (path: string) => {
    setIsOpen(false);
    setQuery('');
    startTransition(() => {
      router.push(path);
    });
  };

  const hasSuggestions = suggestions.stores.length > 0 || suggestions.products.length > 0;

  return (
    <div ref={containerRef} className={cn("relative w-full z-40", className)}>
      <form onSubmit={handleSubmit} className="relative group w-full">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
          <Search size={isHero ? 22 : 18} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            "w-full bg-muted/50 border border-transparent focus:border-border/30 hover:bg-muted focus:bg-background focus:ring-4 transition-all outline-none",
            isHero 
              ? "h-16 pl-14 pr-12 text-lg rounded-2xl focus:ring-brand-primary/15" 
              : "h-11 pl-11 pr-10 text-sm rounded-full focus:ring-primary/10"
          )}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSuggestions({ stores: [], products: [] });
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-muted-foreground/10 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </form>

      {/* Floating Suggestions Dropdown */}
      {isOpen && (query.trim().length >= 2) && (
        <div className="absolute top-[105%] left-0 right-0 bg-background/90 dark:bg-slate-900/95 backdrop-blur-xl border border-border/60 rounded-[1.5rem] shadow-2xl overflow-hidden mt-2 z-55 animate-in slide-in-from-top-2 duration-200">
          
          {loading && (
            <div className="p-6 flex items-center justify-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="animate-spin text-primary" size={18} />
              <span>Recherche en cours...</span>
            </div>
          )}

          {!loading && !hasSuggestions && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Aucun résultat pour &quot;<span className="font-semibold text-foreground">{query}</span>&quot;
            </div>
          )}

          {!loading && hasSuggestions && (
            <div className="max-h-[420px] overflow-y-auto divide-y divide-border/40 scrollbar-thin">
              
              {/* Stores Section */}
              {suggestions.stores.length > 0 && (
                <div className="p-4 space-y-2.5">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 flex items-center gap-1.5">
                    <Store size={12} />
                    <span>Magasins partenaires</span>
                  </div>
                  <div className="space-y-1">
                    {suggestions.stores.map((store) => (
                      <button
                        key={store.id}
                        onClick={() => handleSuggestionClick(`/store/${store.id}`)}
                        className="w-full text-left p-2.5 hover:bg-muted/50 dark:hover:bg-slate-800/40 rounded-xl transition-all flex items-center justify-between group/item"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-border/40 bg-white shrink-0">
                            <Image
                              src={store.logo || "/images/store-placeholder.svg"}
                              alt={store.name}
                              fill
                              sizes="36px"
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-foreground group-hover/item:text-primary transition-colors">{store.name}</div>
                            <div className="text-[10px] text-muted-foreground truncate max-w-[240px]">{store.address}</div>
                          </div>
                        </div>
                        <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 text-primary transition-all shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Products Section */}
              {suggestions.products.length > 0 && (
                <div className="p-4 space-y-2.5">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 flex items-center gap-1.5">
                    <ShoppingBag size={12} />
                    <span>Produits</span>
                  </div>
                  <div className="space-y-1">
                    {suggestions.products.map((product) => {
                      let imgUrl = '/images/product-placeholder.svg';
                      try {
                        const parsed = JSON.parse(product.images || '[]');
                        if (parsed.length > 0) imgUrl = parsed[0];
                      } catch (e) {
                        if (product.images) imgUrl = product.images;
                      }

                      return (
                        <button
                          key={product.id}
                          onClick={() => handleSuggestionClick(`/product/${product.id}`)}
                          className="w-full text-left p-2.5 hover:bg-muted/50 dark:hover:bg-slate-800/40 rounded-xl transition-all flex items-center justify-between group/item"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-border/40 bg-white shrink-0">
                              <Image
                                src={imgUrl}
                                alt={product.name}
                                fill
                                sizes="36px"
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-foreground group-hover/item:text-primary transition-colors line-clamp-1">{product.name}</div>
                              <div className="text-[10px] text-muted-foreground">Dans {product.store?.name || 'Magasin'} • {product.category}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-primary">{product.price} FCFA</span>
                            <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 text-primary transition-all shrink-0" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* View all button */}
              <div className="p-2 bg-muted/20 text-center">
                <button
                  onClick={handleSubmit}
                  className="w-full py-2 text-xs font-bold text-primary hover:underline flex items-center justify-center gap-1.5"
                >
                  Voir tous les résultats pour &quot;{query}&quot; <ArrowRight size={12} />
                </button>
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
}
