"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Plus, ShoppingCart, Package, Heart, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ImageWithLoader } from '@/components/ui/ImageWithLoader';
import { resolveImageUrl } from '@/lib/image-resolver';
import { FavoriteButton } from '@/components/blocks/catalog/FavoriteButton';

/** Seuil en jours pour qualifier un produit de "Nouveau" */
const NEW_PRODUCT_DAYS = 30;

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  /** Valeur brute depuis la DB : peut être null, JSON stringifié, chemin local, URL Cloudinary. */
  image: string | null | undefined;
  category: string;
  unit: string;
  storeId: string;
  /** Date de création — optionnelle. Permet d'afficher le badge "Nouveau". */
  createdAt?: Date | string;
  storeName?: string;
  /** Priorité de chargement LCP (généralement index === 0 dans une liste mappée) */
  priority?: boolean;
}

/** Retourne true si le produit a été créé il y a moins de NEW_PRODUCT_DAYS jours */
function isNewProduct(createdAt?: Date | string): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  const diffMs = Date.now() - created.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= NEW_PRODUCT_DAYS;
}

export const ProductCard = ({
  id, name, price, image, category, unit, storeId, createdAt, storeName, priority = false
}: ProductCardProps) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdded, setIsAdded] = useState(false);

  // Résolution centralisée de l'image (JSON, local, Cloudinary, null → placeholder)
  const resolvedImage = resolveImageUrl(image, 'product');

  const isNew = isNewProduct(createdAt);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push(`?auth=login&callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    addToCart({ id, name, price, image: resolvedImage, category, unit, storeId });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1200);
  };

  return (
    /* ── Conteneur CSS-first : hover élève la carte, transition douce ── */
    <div className="h-full transform-gpu hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 ease-out">
      <Card
        className={cn(
          "group relative overflow-hidden border-border/50 bg-card/45 backdrop-blur-md glass-card",
          "hover:border-white/50 hover:shadow-glow",
          "transition-all duration-300 p-0 py-0 h-full flex flex-col transform-gpu"
        )}
      >
        {/* ── Zone image ── */}
        <div className="relative h-48 w-full border-b border-slate-100/50 dark:border-white/5 overflow-hidden">
          <Link href={`/product/${id}`} className="relative block h-full w-full z-0">
            <ImageWithLoader
              src={resolvedImage}
              alt={name}
              type="product"
              objectFit="contain"
              priority={priority}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="absolute inset-0 bg-white dark:bg-slate-900/60 group-hover:scale-110 transition-transform duration-500 ease-out transform-gpu"
            />
          </Link>

          {/* ── Badge "Nouveau" (haut-gauche) ── */}
          {isNew && (
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-brand-safran text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md shadow-brand-safran/30 animate-in fade-in duration-300">
              <Sparkles size={10} strokeWidth={2.5} />
              Nouveau
            </div>
          )}

          {/* ── Bouton Favoris (haut-gauche si pas de badge) ── */}
          {!isNew && (
            <FavoriteButton
              product={{ id, name, price, image: resolvedImage, category, unit, storeId }}
              size={18}
              className="absolute top-3 left-3"
            />
          )}

          {/* ── Bouton favori secondaire quand badge présent ── */}
          {isNew && (
            <FavoriteButton
              product={{ id, name, price, image: resolvedImage, category, unit, storeId }}
              size={15}
              className="absolute bottom-3 left-3 h-8 w-8"
            />
          )}

          {/* ── Bouton ajout rapide (haut-droite, visible au hover) ── */}
          <button
            onClick={handleAdd}
            className={cn(
              "absolute top-3 right-3 h-10 w-10 rounded-full shadow-sm flex items-center justify-center transition-all active:scale-90 z-10",
              "opacity-100 lg:opacity-0 lg:group-hover:opacity-100",
              "translate-y-0 lg:translate-y-2 lg:group-hover:translate-y-0",
              "cursor-pointer",
              isAdded
                ? "bg-emerald-500 text-white"
                : "bg-background/80 backdrop-blur-md text-foreground hover:bg-accent hover:text-accent-foreground"
            )}
            aria-label="Ajouter au panier"
          >
            {isAdded
              ? <Check size={20} strokeWidth={2.5} className="animate-scale-in text-white" />
              : <Plus size={20} strokeWidth={2.5} />
            }
          </button>
        </div>

        {/* ── Zone info ── */}
        <div className="p-5 flex flex-col flex-grow">
          <div className="flex justify-between items-center mb-1.5 gap-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {category}
            </span>
            {storeName && (
              <Link
                href={`/store/${storeId}`}
                className="text-[10px] font-extrabold text-brand-primary hover:text-brand-primary-hover flex items-center gap-1 transition-all truncate max-w-[120px]"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Package size={10} className="shrink-0" />
                <span className="truncate">{storeName}</span>
              </Link>
            )}
          </div>
          <h4 className="font-bold text-foreground line-clamp-2 leading-snug flex-grow min-h-[2.5rem] mb-4">
            <Link href={`/product/${id}`} className="hover:text-primary transition-colors">
              {name}
            </Link>
          </h4>

          <div className="flex items-end justify-between mt-auto">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-foreground">
                  {price.toLocaleString('fr-FR')}
                </span>
                <span className="text-xs font-bold text-muted-foreground mb-1">CFA</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">
                soit {price} CFA / {unit}
              </span>
            </div>

            {/* ── Bouton CTA principal ── */}
            <Button
              onClick={handleAdd}
              size="icon"
              className={cn(
                "h-10 w-10 rounded-full shadow-sm hover:shadow-md",
                "transition-all duration-200 hover:scale-105 active:scale-90",
                "cursor-pointer",
                isAdded
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                  : "bg-accent hover:bg-accent/90 text-accent-foreground"
              )}
              aria-label="Ajouter au panier"
            >
              {isAdded
                ? <Check size={18} strokeWidth={2.5} className="animate-scale-in text-white" />
                : <ShoppingCart size={18} />
              }
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
