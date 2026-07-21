import React, { Suspense } from 'react';
import Image from 'next/image';
import { StoreCard } from '@/components/blocks/catalog/StoreCard';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Store, ShoppingCart, Truck, ShieldCheck, Star, Users, Flame, ArrowRight } from 'lucide-react';
import prisma from '@/lib/prisma';
import { getCachedActiveStores } from '@/actions/ecommerce';
import Link from 'next/link';
import { StoreSkeleton, ProductSkeleton } from '@/components/common/Skeletons';
import { Footer } from '@/components/layout/Footer';
import { HeroContent } from '@/components/blocks/home/HeroContent';
import { getOptionalSession } from '@/lib/auth-guard';
import { ProductCard } from '@/components/blocks/catalog/ProductCard';
import { PromoCarousel } from '@/components/blocks/home/PromoCarousel';
import { ActiveOrderTracker } from '@/components/blocks/home/ActiveOrderTracker';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

async function BentoStoreList() {
  let stores: any[] = [];
  try {
    const allStores = await getCachedActiveStores();
    stores = allStores.slice(0, 5);
  } catch (error) {
    console.error("BentoStoreList load error (silent):", error);
    stores = [];
  }

  if (stores.length === 0) {
    return (
      <div className="col-span-full p-12 bg-muted border-2 border-dashed border-border rounded-3xl text-center space-y-4">
        <h3 className="text-xl font-bold text-muted-foreground">Aucun magasin partenaire</h3>
        <p className="max-w-md mx-auto">Revenez très bientôt pour découvrir nos partenaires.</p>
      </div>
    );
  }

  // Bento Grid Layout: 1 large card (takes 2 cols/rows on desktop), followed by smaller ones
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[280px]">
      {stores.map((store, index) => {
         const isFeatured = index === 0;
         return (
             <div key={store.id} className={isFeatured ? "md:col-span-2 md:row-span-2 h-[584px]" : "h-[280px]"}>
                <StoreCard
                  id={store.id}
                  name={store.name}
                  image={store.logo || "/images/store-placeholder.svg"}
                  location={store.address}
                  rating={4.8}
                  deliveryTime="30-45 min"
                  categories={['Alimentation', 'Hygiène']}
                  isFeatured={isFeatured}
                  priority={index === 0}
                />
             </div>
         );
      })}
    </div>
  );
}

async function RecommendedStores() {
  let stores: any[] = [];
  try {
    const allStores = await getCachedActiveStores();
    stores = allStores.slice(0, 6);
  } catch (error) {
    console.error("RecommendedStores load error (silent):", error);
    stores = [];
  }

  if (stores.length === 0) {
    return (
      <div className="col-span-full p-12 bg-muted border-2 border-dashed border-border rounded-3xl text-center">
        <p className="text-muted-foreground font-semibold">Aucun magasin disponible.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {stores.map((store, index) => (
        <div key={store.id} className="h-[280px]">
          <StoreCard
            id={store.id}
            name={store.name}
            image={store.logo || "/images/store-placeholder.svg"}
            location={store.address}
            rating={4.8}
            deliveryTime="30-45 min"
            categories={['Alimentation', 'Hygiène']}
            isFeatured={false}
            priority={index === 0}
          />
        </div>
      ))}
    </div>
  );
}

async function SuggestedProducts() {
  let products: any[] = [];
  try {
    products = await prisma.produit.findMany({
      where: { estActif: true, estSupprime: false },
      take: 8,
    });
  } catch (error) {
    console.error("SuggestedProducts load error (silent):", error);
    products = [];
  }

  if (products.length === 0) {
    return (
      <div className="col-span-full p-12 bg-muted border-2 border-dashed border-border rounded-3xl text-center">
        <p className="text-muted-foreground font-semibold">Aucun produit recommandé pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
      {products.map((product, index) => {
        let imgUrl = '/images/product-placeholder.svg';
        try {
          const parsed = JSON.parse(product.images || '[]');
          if (parsed.length > 0) imgUrl = parsed[0];
        } catch (e) {}

        return (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.nom}
            price={product.prix}
            category={product.categorie}
            unit={product.unite || 'unité'}
            storeId={product.magasinId}
            image={imgUrl}
            priority={index === 0}
          />
        );
      })}
    </div>
  );
}

export default async function HomePage() {
  const session = await getOptionalSession();

  if (session) {
    return (
      <>
        {/* Authenticated Dashboard View */}
        <div className="max-w-7xl mx-auto px-4 py-12 space-y-20 animate-in fade-in duration-500">
          {/* Welcome Carousel Banner */}
          <PromoCarousel userName={session.name || 'Client'} />

          <Suspense
            fallback={
              <Skeleton className="h-36 rounded-[2rem] bg-white/40 dark:bg-slate-800/20 border border-slate-200/50 dark:border-white/5" />
            }
          >
            <ActiveOrderTracker userId={session.id} userName={session.name || 'Client'} />
          </Suspense>

          {/* Stores Section (Uniform Grid) */}
          <section className="space-y-8">
            <div className="flex justify-between items-end border-b border-border/40 pb-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-foreground tracking-tight">Vos Magasins Partenaires</h2>
                <p className="text-sm text-muted-foreground font-medium">Commandez directement dans les meilleurs supermarchés de Libreville.</p>
              </div>
              <Link href="/stores" className="text-sm font-bold text-primary hover:text-primary-hover flex items-center gap-1 group transition-all">
                Voir tout <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <Suspense fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-[280px]"><StoreSkeleton /></div>
                ))}
              </div>
            }>
              <RecommendedStores />
            </Suspense>
          </section>

          {/* Recommended Products Grid */}
          <section className="space-y-8">
            <div className="flex justify-between items-end border-b border-border/40 pb-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-foreground tracking-tight">Suggestions de Produits</h2>
                <p className="text-sm text-muted-foreground font-medium">Sélectionnés pour vous selon la fraîcheur et la disponibilité.</p>
              </div>
              <Link href="/search" className="text-sm font-bold text-primary hover:text-primary-hover flex items-center gap-1 group transition-all">
                Parcourir le catalogue <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <Suspense fallback={
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
                {[1, 2, 3, 4].map(i => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            }>
              <SuggestedProducts />
            </Suspense>
          </section>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      {/* Modern Hero Section (Typography & Abstraction First) */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-48 overflow-hidden bg-background">
        {/* Background Image using next/image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://picsum.photos/800/800"
            alt="Marché de produits frais"
            fill
            priority
            style={{ objectFit: 'cover' }}
            sizes="100vw"
            className="brightness-95 contrast-105"
          />
          {/* Overlay Gradient (fade from dark emerald & slate to page background) */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#022c22]/90 via-[#0f172a]/95 to-background z-10 pointer-events-none" />
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center max-w-5xl">
          <HeroContent />
        </div>
      </section>

      {/* Bento Grid: Stores Section */}
      <section id="magasins" className="relative z-20 -mt-24 max-w-7xl mx-auto px-4 pb-32">
        <div className="glass-card rounded-3xl p-8 sm:p-12 border-luminous hover:shadow-glow hover:border-white/50 transition-all duration-500">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-4xl lg:text-5xl font-black text-foreground">Nos Partenaires</h2>
            <p className="text-xl text-muted-foreground">Une sélection des meilleurs supermarchés pour vous garantir qualité et fraîcheur.</p>
          </div>

          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[280px]">
              <div className="md:col-span-2 md:row-span-2 h-[584px]"><StoreSkeleton /></div>
              <div className="h-[280px]"><StoreSkeleton /></div>
              <div className="h-[280px]"><StoreSkeleton /></div>
              <div className="h-[280px]"><StoreSkeleton /></div>
              <div className="h-[280px]"><StoreSkeleton /></div>
            </div>
          }>
            <BentoStoreList />
          </Suspense>

          <div className="mt-16 text-center">
             <Link href="/stores">
                <Button variant="outline" size="lg" className="h-14 px-8 rounded-full border-border bg-background hover:bg-muted font-bold text-foreground group">
                   Voir tous nos magasins partenaires <ArrowUpRight className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={20} />
                </Button>
             </Link>
          </div>
        </div>
      </section>

      {/* Section: Comment ça marche */}
      <section className="py-24 relative overflow-hidden bg-background/40">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <span className="text-xs font-bold text-brand-safran uppercase tracking-widest bg-brand-safran/10 px-4 py-1.5 rounded-full">
              Simplicité absolue
            </span>
            <h2 className="text-4xl lg:text-5xl font-black text-foreground">Comment ça marche ?</h2>
            <p className="text-lg text-muted-foreground font-medium">Faire ses courses en ligne à Libreville n&apos;a jamais été aussi simple.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {/* Step 1 */}
            <div className="glass-card rounded-[2rem] p-10 border-luminous hover:shadow-glow hover:border-white/50 transition-all duration-500 flex flex-col justify-between group">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 bg-brand-safran/10 text-brand-safran rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Store size={32} />
                  </div>
                  <span className="text-5xl font-black text-brand-safran/20 select-none">01</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Choisissez un magasin</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Sélectionnez votre supermarché préféré parmi nos partenaires locaux de confiance (Mbolo, Géant Casino, etc.).
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="glass-card rounded-[2rem] p-10 border-luminous hover:shadow-glow hover:border-white/50 transition-all duration-500 flex flex-col justify-between group">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShoppingCart size={32} />
                  </div>
                  <span className="text-5xl font-black text-brand-primary/20 select-none">02</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Remplissez votre panier</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Ajoutez les articles de votre choix. Notre catalogue contient des milliers de références fraîches et de qualité.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="glass-card rounded-[2rem] p-10 border-luminous hover:shadow-glow hover:border-white/50 transition-all duration-500 flex flex-col justify-between group">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Truck size={32} />
                  </div>
                  <span className="text-5xl font-black text-indigo-500/20 select-none">03</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Livraison rapide</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Faites-vous livrer chez vous ou au bureau en moins de 45 minutes. Payez en toute sécurité à la livraison.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Nos Avantages */}
      <section className="py-24 relative overflow-hidden bg-background">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-bold text-brand-primary uppercase tracking-widest bg-brand-primary/10 px-4 py-1.5 rounded-full">
                Pourquoi nous choisir ?
              </span>
              <h2 className="text-4xl lg:text-5xl font-black text-foreground leading-tight">
                L&apos;excellence dans chaque livraison.
              </h2>
              <p className="text-muted-foreground leading-relaxed font-medium">
                Nous avons conçu MesAchats241 pour répondre aux exigences les plus strictes de nos clients à Libreville en termes de qualité, de rapidité et de sécurité.
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="glass-card rounded-[2rem] p-8 border-luminous hover:shadow-glow hover:border-white/50 transition-all duration-300">
                <ShieldCheck className="h-10 w-10 text-brand-primary mb-4" />
                <h4 className="text-lg font-bold text-foreground mb-2">Sécurité Absolue</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Paiements sécurisés via Airtel Money, Moov Money ou règlement en espèces directement auprès du livreur.
                </p>
              </div>

              <div className="glass-card rounded-[2rem] p-8 border-luminous hover:shadow-glow hover:border-white/50 transition-all duration-300">
                <Flame className="h-10 w-10 text-brand-safran mb-4" />
                <h4 className="text-lg font-bold text-foreground mb-2">45 min chrono</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Notre flotte de livreurs partenaires sillonne Libreville pour vous livrer dans les plus brefs délais.
                </p>
              </div>

              <div className="glass-card rounded-[2rem] p-8 border-luminous hover:shadow-glow hover:border-white/50 transition-all duration-300">
                <Star className="h-10 w-10 text-amber-500 mb-4" />
                <h4 className="text-lg font-bold text-foreground mb-2">Fraîcheur Garantie</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Nos équipes sélectionnent avec rigueur vos fruits, légumes et viandes pour vous offrir le meilleur.
                </p>
              </div>

              <div className="glass-card rounded-[2rem] p-8 border-luminous hover:shadow-glow hover:border-white/50 transition-all duration-300">
                <Users className="h-10 w-10 text-indigo-500 mb-4" />
                <h4 className="text-lg font-bold text-foreground mb-2">Service Client dédié</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Une équipe locale est disponible 7j/7 pour vous assister et répondre à toutes vos questions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Statistiques */}
      <section className="py-20 relative overflow-hidden bg-slate-900 text-white dark:bg-slate-950">
        <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none" />
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-5xl md:text-6xl font-black text-brand-safran text-glow-safran">15+</div>
              <p className="text-sm md:text-base text-slate-300 font-bold uppercase tracking-wider">Supermarchés</p>
            </div>
            <div className="space-y-2">
              <div className="text-5xl md:text-6xl font-black text-brand-primary">5k+</div>
              <p className="text-sm md:text-base text-slate-300 font-bold uppercase tracking-wider">Clients Livrés</p>
            </div>
            <div className="space-y-2">
              <div className="text-5xl md:text-6xl font-black text-amber-400">45m</div>
              <p className="text-sm md:text-base text-slate-300 font-bold uppercase tracking-wider">Livraison Moyenne</p>
            </div>
            <div className="space-y-2">
              <div className="text-5xl md:text-6xl font-black text-emerald-400">99.8%</div>
              <p className="text-sm md:text-base text-slate-300 font-bold uppercase tracking-wider">Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Témoignages */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <span className="text-xs font-bold text-brand-safran uppercase tracking-widest bg-brand-safran/10 px-4 py-1.5 rounded-full">
              Avis vérifiés
            </span>
            <h2 className="text-4xl lg:text-5xl font-black text-foreground">Ce que disent nos clients</h2>
            <p className="text-lg text-muted-foreground font-medium">Découvrez les retours d&apos;expérience de nos clients à Libreville.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="glass-card rounded-[2.5rem] p-8 border-luminous hover:shadow-glow hover:border-white/50 transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} size={16} className="fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-slate-600 dark:text-slate-300 italic leading-relaxed">
                  &quot;Un service exceptionnel ! Je fais mes courses chez Mbolo depuis mon canap&eacute; &agrave; Akanda et je suis livr&eacute;e en moins d&apos;une heure. Les produits frais sont parfaitement choisis.&quot;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-6 border-t border-border/40 mt-6">
                <div className="w-10 h-10 rounded-full bg-brand-safran/20 text-brand-safran flex items-center justify-center font-bold text-sm">
                  SA
                </div>
                <div>
                  <h5 className="font-bold text-foreground text-sm">Sylvie Assoumou</h5>
                  <p className="text-xs text-muted-foreground">Akanda, Libreville</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="glass-card rounded-[2.5rem] p-8 border-luminous hover:shadow-glow hover:border-white/50 transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} size={16} className="fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-slate-600 dark:text-slate-300 italic leading-relaxed">
                  &quot;J&apos;utilise Airtel Money pour payer et tout se passe de mani&egrave;re hyper fluide. C&apos;est s&eacute;curis&eacute;, transparent et le livreur m&apos;appelle d&egrave;s qu&apos;il est en route. Top !&quot;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-6 border-t border-border/40 mt-6">
                <div className="w-10 h-10 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center font-bold text-sm">
                  MO
                </div>
                <div>
                  <h5 className="font-bold text-foreground text-sm">Marc Obame</h5>
                  <p className="text-xs text-muted-foreground">Louis, Libreville</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="glass-card rounded-[2.5rem] p-8 border-luminous hover:shadow-glow hover:border-white/50 transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} size={16} className="fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-slate-600 dark:text-slate-300 italic leading-relaxed">
                  &quot;MesAchats241 m&apos;a fait gagner des heures chaque semaine. Plus besoin de subir les embouteillages pour aller au supermarch&eacute;. Je recommande &agrave; 100.&quot;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-6 border-t border-border/40 mt-6">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center font-bold text-sm">
                  KN
                </div>
                <div>
                  <h5 className="font-bold text-foreground text-sm">Karen Ndong</h5>
                  <p className="text-xs text-muted-foreground">Sablière, Libreville</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
