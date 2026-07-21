"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X, Store as StoreIcon } from 'lucide-react';
import { updateStoreAction } from '@/actions/ecommerce';
import { useToast } from '@/context/ToastContext';
import { Store as StoreType } from '@/types';

// Zod validation schema
const storeSchema = z.object({
  name: z.string().min(2, "Le nom du magasin doit contenir au moins 2 caractères"),
  district: z.string().min(2, "Le quartier doit contenir au moins 2 caractères"),
  address: z.string().min(5, "L'adresse complète doit contenir au moins 5 caractères"),
  phone: z.string().regex(/^\+?[0-9\s-]{8,15}$/, "Numéro de téléphone invalide (ex: +241 66 00 00 00)"),
  description: z.string().max(300, "La description ne doit pas dépasser 300 caractères").optional().or(z.literal('')),
});

type StoreFormValues = z.infer<typeof storeSchema>;

interface StoreEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  store: StoreType | null;
}

export function StoreEditSheet({ isOpen, onClose, onSuccess, store }: StoreEditSheetProps) {
  const [logoUrl, setLogoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors, isSubmitting } 
  } = useForm<StoreFormValues>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: '',
      district: '',
      address: '',
      phone: '',
      description: '',
    }
  });

  // Pre-fill form when store changes
  useEffect(() => {
    if (store && isOpen) {
      reset({
        name: store.nom || store.name || '',
        district: store.quartier || store.district || '',
        address: store.adresse || store.address || '',
        phone: store.telephone || store.phone || '',
        description: store.description || '',
      } as any);
      setLogoUrl(store.logo || '');
      setSubmitError('');
      setUploading(false);
      setDragActive(false);
    }
  }, [store, isOpen, reset]);

  const handleUploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner uniquement des images.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'mes-courses-faciles/stores');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setLogoUrl(data.url);
        toast.success("Logo téléchargé avec succès.");
      } else {
        toast.error(data.error || "Erreur de téléchargement.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Impossible de télécharger le logo.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleUploadFile(e.target.files[0]);
    }
  };

  const onSubmit = async (data: StoreFormValues) => {
    if (!store) return;
    setSubmitError('');

    try {
      const result = await updateStoreAction(store.id, {
        nom: data.name,
        adresse: data.address,
        quartier: data.district,
        telephone: data.phone,
        description: data.description,
        logo: logoUrl || undefined,
      } as any);

      if (result.success) {
        toast.success(`Le magasin ${data.name} a été mis à jour.`);
        onSuccess();
        onClose();
      } else {
        setSubmitError(result.error || "Une erreur est survenue.");
        toast.error(result.error || "Erreur lors de la mise à jour.");
      }
    } catch (err: any) {
      console.error(err);
      setSubmitError("Une erreur réseau est survenue.");
      toast.error("Une erreur réseau est survenue.");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="right" 
        className="sm:max-w-xl w-full sm:w-[600px] bg-slate-50/95 dark:bg-slate-950/90 backdrop-blur-2xl border-l border-white/20 dark:border-white/10 shadow-2xl flex flex-col h-full p-0 overflow-hidden"
      >
        <SheetHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <SheetTitle className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <StoreIcon size={24} className="text-brand-primary" /> Modifier le Magasin
          </SheetTitle>
          <SheetDescription className="text-slate-550 dark:text-slate-400">
            Modifiez les détails de ce magasin partenaire.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {submitError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-sm font-bold">
                {submitError}
              </div>
            )}

            {/* Nom */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest">
                Nom du Magasin
              </label>
              <input 
                {...register('name')}
                placeholder="Ex: Mbolo Supermarché"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-primary/10 transition-all outline-none text-foreground font-bold"
              />
              <AnimatePresence>
                {errors.name && (
                  <motion.p 
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="text-xs text-red-550 font-semibold"
                  >
                    {errors.name.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Quartier */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest">
                Quartier / District
              </label>
              <input 
                {...register('district')}
                placeholder="Ex: Centre-Ville"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-primary/10 transition-all outline-none text-foreground font-bold"
              />
              <AnimatePresence>
                {errors.district && (
                  <motion.p 
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="text-xs text-red-550 font-semibold"
                  >
                    {errors.district.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Adresse */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest">
                Adresse complète
              </label>
              <input 
                {...register('address')}
                placeholder="Ex: Boulevard de l'Indépendance, Face à la Poste"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-primary/10 transition-all outline-none text-foreground font-bold"
              />
              <AnimatePresence>
                {errors.address && (
                  <motion.p 
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="text-xs text-red-550 font-semibold"
                  >
                    {errors.address.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest">
                Téléphone
              </label>
              <input 
                {...register('phone')}
                placeholder="Ex: +241 66 00 00 00"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-primary/10 transition-all outline-none text-foreground font-bold"
              />
              <AnimatePresence>
                {errors.phone && (
                  <motion.p 
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="text-xs text-red-550 font-semibold"
                  >
                    {errors.phone.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Image Upload Dropzone */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest">
                Logo du magasin
              </label>
              
              <div 
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 select-none
                  ${dragActive 
                    ? 'border-brand-primary bg-brand-primary/[0.04] scale-[1.01]' 
                    : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-900/60 hover:border-slate-300'
                  }
                `}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*"
                />

                {uploading ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Loader2 className="animate-spin text-brand-primary" size={32} />
                    <span className="text-sm font-semibold text-slate-550">Téléchargement en cours...</span>
                  </div>
                ) : logoUrl ? (
                  <div className="relative group/img w-32 h-32 rounded-xl overflow-hidden border border-slate-200 shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={logoUrl} 
                      alt="Logo Preview" 
                      className="w-full h-full object-cover" 
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLogoUrl('');
                      }}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity duration-200 rounded-xl"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <div className="py-4 flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <Upload size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-350">
                        Glissez-déposez le logo ici
                      </p>
                      <p className="text-xs text-slate-450 mt-1">
                        ou cliquez pour parcourir vos fichiers (JPG, PNG, WEBP)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest">
                Description
              </label>
              <textarea 
                {...register('description')}
                placeholder="Décrivez brièvement le magasin..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-brand-primary/10 transition-all outline-none text-foreground resize-none"
              />
              <AnimatePresence>
                {errors.description && (
                  <motion.p 
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="text-xs text-red-550 font-semibold"
                  >
                    {errors.description.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

          </div>

          <div className="sticky bottom-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 z-10">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose} 
              className="h-12 px-6 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || uploading} 
              className="h-12 px-6 rounded-xl font-bold bg-brand-primary text-white hover:bg-brand-primary-hover shadow-lg shadow-brand-primary/20 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Sauvegarde...
                </>
              ) : (
                'Enregistrer les modifications'
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
