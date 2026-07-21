"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutFormSchema } from '@/lib/validations/schemas';
import { z } from 'zod';
import {
  MapPin,
  CheckCircle2,
  ChevronRight,
  Truck,
  ShoppingBag,
  Wallet,
  Smartphone,
  ShieldCheck,
  Loader2,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createOrderAction } from '@/actions/ecommerce';
import { BackButton } from '@/components/common/BackButton';
import { useToast } from '@/context/ToastContext';

type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

interface CheckoutClientFormProps {
  initialUser: {
    id: string;
    name: string | null;
    phone: string | null;
    address: string | null;
  };
}

export function CheckoutClientForm({ initialUser }: CheckoutClientFormProps) {
  const { cart, totalPrice, clearCart, deliveryFee } = useCart();
  const router = useRouter();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');

  const finalTotal = totalPrice + deliveryFee;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema as any),
    mode: "onChange",
    defaultValues: {
      name: initialUser.name || '',
      phone: initialUser.phone || '',
      district: initialUser.address || '',
      indications: '',
      paymentMethod: undefined,
    }
  });

  const selectedPaymentMethod = watch('paymentMethod');

  if (cart.length === 0 && !isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
          <ShoppingBag size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Votre panier est vide</h2>
        <Button onClick={() => router.push('/')} size="lg" className="rounded-full">Retourner aux achats</Button>
      </div>
    );
  }

  const onSubmit = async (data: any) => {
    if (cart.length === 0) return;
    setLoading(true);

    try {
      const orderPayload = {
        userId: initialUser?.id || 'anonymous',
        utilisateurId: initialUser?.id || 'anonymous',
        storeId: cart[0].storeId!,
        magasinId: cart[0].storeId || (cart[0] as any).magasinId!,
        total: finalTotal,
        deliveryFee: deliveryFee,
        fraisLivraison: deliveryFee,
        paymentMethod: data.paymentMethod,
        methodePaiement: data.paymentMethod,
        deliveryAddress: `${data.name} - ${data.phone} - ${data.district} ${data.indications ? `(${data.indications})` : ''}`,
        adresseLivraison: `${data.name} - ${data.phone} - ${data.district} ${data.indications ? `(${data.indications})` : ''}`,
        items: cart.map(item => ({
          id: item.id,
          produitId: item.id,
          quantity: item.quantity,
          quantite: item.quantity,
          price: item.price,
          prixUnitaire: item.price
        })),
        lignes: cart.map(item => ({
          id: item.id,
          produitId: item.id,
          quantity: item.quantity,
          quantite: item.quantity,
          price: item.price,
          prixUnitaire: item.price
        }))
      };

      const res = await createOrderAction(orderPayload);

      if (res.success) {
        setOrderId(res.id!);
        setIsSuccess(true);
        clearCart();
        window.scrollTo(0, 0);
        router.push(`/checkout/success?orderId=${res.id!}`);
      } else {
        toast.error(res.error || 'Erreur lors de la commande');
      }
    } catch (error) {
      console.error(error);
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] py-12 px-4 animate-in fade-in slide-in-from-bottom-8">
        <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
          <CheckCircle2 size={48} strokeWidth={2.5} />
        </div>
        <h1 className="text-4xl font-black text-foreground mb-4 tracking-tight text-center">Commande validée !</h1>
        <p className="text-muted-foreground text-lg mb-10 max-w-md mx-auto text-center leading-relaxed">
          Merci pour votre confiance. Votre commande <span className="font-bold text-primary px-2 py-1 bg-primary/10 rounded-md">#{orderId.slice(-6).toUpperCase()}</span> a été transmise au magasin.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/profile?tab=orders" className="w-full sm:w-auto">
            <Button size="lg" className="w-full h-14 px-8 rounded-full shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-bold">
               Suivre ma commande
            </Button>
          </Link>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full h-14 px-8 rounded-full border-border bg-background hover:bg-muted font-bold text-foreground">
               Retour à l&apos;accueil
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-mesh bg-noise relative overflow-hidden pt-8 pb-24 min-h-screen">
      {/* Visual background flares */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brand-primary/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-safran/5 blur-[80px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10 space-y-6">
        <div className="flex justify-start">
          <BackButton href="/" label="Retour à l'accueil" />
        </div>

        <div className="mb-8">
           <h1 className="text-3xl font-black text-foreground tracking-tight">Finaliser la commande</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Form */}
          <div className="lg:col-span-7 space-y-8">
            <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">

              {/* Delivery Section */}
              <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 border-b pb-4">
                   <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <MapPin size={18} />
                   </div>
                   <h2 className="text-xl font-bold text-foreground">Informations de livraison</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-muted-foreground font-bold uppercase text-xs tracking-wider">Nom Complet</Label>
                    <Input id="name" placeholder="Jean Dupont" {...register('name')} className={`h-12 bg-muted/50 border-transparent focus:bg-background ${errors.name ? 'border-destructive focus:ring-destructive' : 'focus:border-primary'}`} />
                    {errors.name && <p className="text-xs text-destructive font-medium">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-muted-foreground font-bold uppercase text-xs tracking-wider">Téléphone</Label>
                    <Input id="phone" type="tel" placeholder="+241 00 00 00 00" {...register('phone')} className={`h-12 bg-muted/50 border-transparent focus:bg-background ${errors.phone ? 'border-destructive focus:ring-destructive' : 'focus:border-primary'}`} />
                    {errors.phone && <p className="text-xs text-destructive font-medium">{errors.phone.message}</p>}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="district" className="text-muted-foreground font-bold uppercase text-xs tracking-wider">Quartier (Libreville)</Label>
                    <Input id="district" placeholder="Ex: Louis, Glass, Angondjé..." {...register('district')} className={`h-12 bg-muted/50 border-transparent focus:bg-background ${errors.district ? 'border-destructive focus:ring-destructive' : 'focus:border-primary'}`} />
                    {errors.district && <p className="text-xs text-destructive font-medium">{errors.district.message}</p>}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="indications" className="text-muted-foreground font-bold uppercase text-xs tracking-wider">Indications complémentaires (Optionnel)</Label>
                    <Input id="indications" placeholder="Ex: Maison bleue après la pharmacie" {...register('indications')} className="h-12 bg-muted/50 border-transparent focus:bg-background focus:border-primary" />
                  </div>
                </div>
              </section>

              {/* Payment Section */}
              <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                <div className="flex items-center gap-3 border-b pb-4">
                   <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <CreditCard size={18} />
                   </div>
                   <h2 className="text-xl font-bold text-foreground">Moyen de paiement</h2>
                </div>

                <div className="space-y-4">
                  <RadioGroup
                    onValueChange={(value) => setValue('paymentMethod', value as any, { shouldValidate: true })}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {[
                      { id: 'airtel', name: 'Airtel Money', icon: Smartphone, color: 'text-red-500', bgHover: 'hover:bg-red-50', activeBorder: 'border-red-500', activeBg: 'bg-red-50/50' },
                      { id: 'moov', name: 'Moov Money', icon: Smartphone, color: 'text-blue-500', bgHover: 'hover:bg-blue-50', activeBorder: 'border-blue-500', activeBg: 'bg-blue-50/50' },
                      { id: 'card', name: 'Carte Bancaire', icon: CreditCard, color: 'text-slate-700', bgHover: 'hover:bg-slate-50', activeBorder: 'border-slate-800', activeBg: 'bg-slate-50/50' },
                      { id: 'cash', name: 'À la livraison', icon: Wallet, color: 'text-primary', bgHover: 'hover:bg-primary/5', activeBorder: 'border-primary', activeBg: 'bg-primary/5' }
                    ].map((method) => {
                      const isSelected = selectedPaymentMethod === method.id;
                      return (
                        <Label
                          key={method.id}
                          className={`relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${method.bgHover} ${isSelected ? `${method.activeBorder} ${method.activeBg} shadow-sm` : 'border-border/50 bg-card'}`}
                        >
                          <RadioGroupItem value={method.id} className="sr-only" />
                          <method.icon size={32} className={method.color} strokeWidth={isSelected ? 2.5 : 2} />
                          <span className={`font-bold ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>{method.name}</span>
                          {isSelected && (
                             <div className="absolute top-3 right-3 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                                <CheckCircle2 size={14} strokeWidth={3} />
                             </div>
                          )}
                        </Label>
                      );
                    })}
                  </RadioGroup>
                  {errors.paymentMethod && <p className="text-xs text-destructive font-medium mt-2">{errors.paymentMethod.message}</p>}
                </div>

                <div className="p-4 bg-muted/50 rounded-2xl border border-border/50 flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="text-primary" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Paiement 100% sécurisé</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Vos transactions sont chiffrées de bout en bout. Nous ne stockons aucune information bancaire.</p>
                  </div>
                </div>
              </section>

              <div className="hidden lg:block pt-4">
                 <Button
                    type="submit"
                    form="checkout-form"
                    disabled={loading || !isValid}
                    className="w-full h-16 text-lg rounded-2xl bg-accent hover:bg-accent/90 text-accent-foreground shadow-xl shadow-accent/20 group transition-all"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : (
                      <>
                        Confirmer et payer {finalTotal.toLocaleString('fr-FR')} CFA
                        <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary (Sticky) */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-24 space-y-6">
              <Card className="p-6 overflow-hidden border-border/50 shadow-lg shadow-black/5 rounded-3xl animate-in fade-in slide-in-from-right-8 duration-700">
                <h3 className="font-bold text-foreground flex items-center gap-2 mb-6 text-lg">
                  <ShoppingBag size={20} className="text-primary" /> Résumé de la commande
                </h3>

                <div className="space-y-4 max-h-[40vh] overflow-y-auto no-scrollbar pr-2 mb-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-4 group">
                      <div className="w-16 h-16 bg-muted/50 rounded-xl border border-border/50 flex-shrink-0 relative overflow-hidden">
                        <Image
                          src={item.image || "/images/product-placeholder.svg"}
                          fill
                          sizes="64px"
                          className="object-contain p-2 mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                          alt={item.name}
                        />
                      </div>
                      <div className="flex-1 py-1">
                        <h4 className="text-sm font-bold text-foreground line-clamp-2 leading-tight mb-1">{item.name}</h4>
                        <div className="flex justify-between items-center mt-auto">
                          <p className="text-xs text-muted-foreground font-medium">Qté: <span className="text-foreground">{item.quantity}</span></p>
                          <p className="text-sm font-bold text-primary">{(item.price * item.quantity).toLocaleString('fr-FR')} CFA</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-muted-foreground font-medium">
                    <span>Sous-total articles</span>
                    <span className="text-foreground">{totalPrice.toLocaleString('fr-FR')} CFA</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground font-medium">
                    <span className="flex items-center gap-1.5">Frais de livraison <Truck size={14} /></span>
                    <span className="text-foreground">{deliveryFee.toLocaleString('fr-FR')} CFA</span>
                  </div>

                  <div className="pt-6 flex justify-between items-end border-t border-border/50">
                    <span className="text-lg font-bold text-foreground">Total à régler</span>
                    <span className="text-3xl font-black text-primary tracking-tight">{finalTotal.toLocaleString('fr-FR')} <span className="text-lg font-bold">CFA</span></span>
                  </div>
                </div>
              </Card>

              {/* Mobile CTA (Sticky Bottom) */}
              <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border/50 z-50">
                 <Button
                    type="submit"
                    form="checkout-form"
                    disabled={loading || !isValid}
                    className="w-full h-14 text-lg rounded-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/20 group"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : (
                      <>
                        Payer {finalTotal.toLocaleString('fr-FR')} CFA
                        <ChevronRight className="ml-1 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
