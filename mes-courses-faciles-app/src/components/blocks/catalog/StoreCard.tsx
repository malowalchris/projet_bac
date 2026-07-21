import React from 'react';
import { Card } from '@/components/ui/card';
import { MapPin, Star, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ImageWithLoader } from '@/components/ui/ImageWithLoader';
import { resolveImageUrl } from '@/lib/image-resolver';

interface StoreCardProps {
  id: string;
  name: string;
  /** Valeur brute depuis la DB (logo) : peut être null, chemin local, URL Cloudinary. */
  image: string | null | undefined;
  location: string;
  rating: number;
  deliveryTime: string;
  categories: string[];
  isFeatured?: boolean;
  priority?: boolean;
}

export const StoreCard = ({
  id, name, image, location, rating, deliveryTime, categories, isFeatured = false, priority = false
}: StoreCardProps) => {

  // Résolution centralisée : null/vide → placeholder SVG local
  const resolvedImage = resolveImageUrl(image, 'store');

  if (isFeatured) {
    return (
      /* ── Carte vedette : élévation CSS-first au hover ── */
      <div className="h-full transform-gpu hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300 ease-out">
        <Link
          href={`/store/${id}`}
          className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-3xl"
        >
          <Card
            className={cn(
              "group relative h-full overflow-hidden border-border/50 bg-card/45 backdrop-blur-md glass-card",
              "hover:shadow-glow hover:border-white/50 transition-all duration-300",
              "p-0 rounded-3xl transform-gpu"
            )}
          >
            {/* Background Image via ImageWithLoader (gère SVG + fallback automatique) */}
            <div className="absolute inset-0 z-0 bg-muted overflow-hidden relative h-full w-full">
              <ImageWithLoader
                src={resolvedImage}
                alt={name || "Magasin"}
                type="store"
                objectFit="cover"
                priority={isFeatured || priority}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="absolute inset-0 group-hover:scale-105 transition-transform duration-700 ease-out transform-gpu"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent z-10 pointer-events-none" />
            </div>

            {/* Content overlay */}
            <div className="absolute inset-0 z-20 flex flex-col justify-between p-8 text-white">
              <div className="flex justify-between items-start">
                <span className="text-white text-xs font-bold bg-brand-safran px-3 py-1.5 rounded-full whitespace-nowrap shadow-sm">
                  Partenaire Vedette
                </span>
                <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm border border-white/10">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span>{rating}</span>
                </div>
              </div>

              <div className="space-y-4 pt-24">
                <div>
                  <h3 className="text-3xl font-black tracking-tight mb-2 text-glow-safran line-clamp-1">{name}</h3>
                  <div className="text-white/80 text-sm font-medium flex items-center gap-1.5">
                    <MapPin size={16} className="text-brand-safran shrink-0" />
                    {location}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-white/80 text-xs font-semibold truncate max-w-[200px]">
                    {categories.join(' • ')}
                  </span>
                  <span className="bg-white/15 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/10">
                    {deliveryTime}
                  </span>
                </div>

                <div className="flex items-center text-brand-safran text-sm font-bold gap-1 group-hover:gap-2.5 transition-all duration-300">
                  Visiter le magasin <ArrowRight size={16} />
                </div>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    );
  }

  /* ── Carte standard : élévation CSS-first ── */
  return (
    <div className="h-full transform-gpu hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 ease-out">
      <Link
        href={`/store/${id}`}
        className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
      >
        <Card
          className={cn(
            "group h-full overflow-hidden border-border/50 bg-card/45 backdrop-blur-md glass-card",
            "hover:shadow-glow hover:border-white/50 transition-all duration-300",
            "p-0 py-0 transform-gpu"
          )}
        >
          {/* Image zone via ImageWithLoader */}
          <div className="relative h-36 w-full overflow-hidden bg-muted">
            <ImageWithLoader
              src={resolvedImage}
              alt={name || "Magasin"}
              type="store"
              objectFit="cover"
              priority={isFeatured || priority}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="absolute inset-0 group-hover:scale-105 transition-transform duration-500 ease-out transform-gpu"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 z-10 pointer-events-none" />

            <div className="absolute top-3 right-3 z-20 bg-background/90 backdrop-blur-md px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
              <Star size={12} className="fill-accent text-accent" />
              <span className="text-foreground text-[11px]">{rating}</span>
            </div>

            <div className="absolute bottom-3 left-3 right-3 z-20">
              <div className="text-white/90 text-[11px] font-medium flex items-center gap-1 truncate">
                <MapPin size={12} className="text-primary shrink-0" />
                <span className="truncate">{location}</span>
              </div>
            </div>
          </div>

          {/* Info zone */}
          <div className="p-4 flex flex-col justify-between h-[136px]">
            <div>
              <div className="flex justify-between items-start mb-1 gap-2">
                <h3 className="text-base font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-200">
                  {name}
                </h3>
                <span className="text-primary text-[10px] font-bold bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {deliveryTime}
                </span>
              </div>
              <p className="text-muted-foreground text-xs line-clamp-1 mb-4">
                {categories.join(' • ')}
              </p>
            </div>
            <div className="flex items-center text-primary text-xs font-bold gap-1 group-hover:gap-2 transition-all duration-300">
              Visiter le magasin <ArrowRight size={14} />
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
};
