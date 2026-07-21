"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { isAbortOrNetworkCancellationError } from '@/lib/network-resilience';

import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X, Package } from 'lucide-react';
import { createProductAction } from '@/actions/ecommerce';
import { Store as StoreType } from '@/types';
import { useToast } from '@/context/ToastContext';
import { CATEGORIES } from '@/lib/constants/categories';

// Validation Zod schema for product creation form
const productFormSchema = z.object({
  name: z.string().min(2, "Le nom du produit doit contenir au moins 2 caractères"),
  price: z.number().positive("Le prix doit être un nombre positif supérieur à 0"),
  stock: z.number().int().nonnegative("Le stock ne peut pas être négatif"),
  category: z.string().min(1, "Veuillez choisir une catégorie"),
  unit: z.string().min(1, "Veuillez spécifier une unité"),
  storeId: z.string().min(1, "Veuillez associer un magasin"),
  description: z.string().max(400, "La description ne doit pas dépasser 400 caractères").optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductCreateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultStoreId?: string; // Optional default store selection
}

export function ProductCreateSheet({ isOpen, onClose, onSuccess, defaultStoreId }: ProductCreateSheetProps) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [stores, setStores] = useState<StoreType[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const { 
    register, 
    handleSubmit, 
    reset,
    setValue,
    formState: { errors, isSubmitting } 
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      price: 0,
      stock: 10,
      category: 'Alimentaire',
      unit: 'Pièce',
      storeId: defaultStoreId || '',
      description: '',
    }
  });

  // Fetch stores list for mapping
  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    const fetchStores = async () => {
      setLoadingStores(true);
      try {
        const res = await fetch('/api/stores', { signal: controller.signal });
        if (res.ok && !controller.signal.aborted) {
          const data = await res.json();
          setStores(data);
          if (defaultStoreId) {
            setValue('storeId', defaultStoreId);
          } else if (data.length > 0) {
            setValue('storeId', data[0].id);
          }
        }
      } catch (err) {
        if (!isAbortOrNetworkCancellationError(err)) {
          console.error("Failed to load stores:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingStores(false);
        }
      }
    };
    fetchStores();
    return () => controller.abort();
  }, [isOpen, defaultStoreId, setValue]);

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      reset();
      setImageUrls([]);
      setSubmitError('');
      setUploading(false);
      setDragActive(false);
    }
  }, [isOpen, reset]);

  const handleUploadFiles = async (files: File[]) => {
    const validFiles = files.filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      toast.error("Veuillez sélectionner uniquement des images.");
      return;
    }

    setUploading(true);
    try {
      const newUrls: string[] = [];

      for (const file of validFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'mes-courses-faciles/products');

        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          if (res.ok && data.url) {
            newUrls.push(data.url);
          } else {
            toast.error(data.error || `Erreur lors de l'upload de ${file.name}`);
          }
        } catch (err) {
          console.error("Upload error:", err);
          toast.error(`Impossible d'importer l'image ${file.name}.`);
        }
      }

      if (newUrls.length > 0) {
        setImageUrls(prev => [...prev, ...newUrls]);
        toast.success(`${newUrls.length} image(s) ajoutée(s).`);
      }
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleUploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleUploadFiles(Array.from(e.target.files));
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    setSubmitError('');
    if (imageUrls.length === 0) {
      setSubmitError("Veuillez télécharger au moins une image pour le produit.");
      toast.error("Image requise.");
      return;
    }

    try {
      const result = await createProductAction({
        ...data,
        nom: data.name,
        prix: data.price,
        categorie: data.category,
        unite: data.unit,
        magasinId: data.storeId,
        images: imageUrls,
      } as any);

      if (result.success) {
        toast.success(`Le produit ${data.name} a été créé.`);
        onSuccess();
        onClose();
      } else {
        setSubmitError(result.error || "Une erreur est survenue.");
        toast.error(result.error || "Impossible de créer le produit.");
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
            <Package size={24} className="text-brand-primary" /> Nouveau Produit
          </SheetTitle>
          <SheetDescription className="text-slate-500 dark:text-slate-400">
            Ajoutez un produit au catalogue et liez-le à un magasin partenaire.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {submitError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-sm font-bold animate-in">
                {submitError}
              </div>
            )}

            {/* Store Association */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest">
                Magasin Partenaire
              </label>
              {loadingStores ? (
                <div className="flex items-center gap-2 py-3 text-slate-500 text-sm">
                  <Loader2 className="animate-spin text-brand-primary" size={16} /> Chargement des magasins...
                </div>
              ) : (
                <select 
                  {...register('storeId')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none text-slate-800 dark:text-white font-medium text-sm"
                >
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.nom || s.name} ({s.quartier || s.district})</option>
                  ))}
                  {stores.length === 0 && (
                    <option value="">Aucun magasin disponible</option>
                  )}
                </select>
              )}
              {errors.storeId && (
                <p className="text-xs text-red-550 font-semibold">{errors.storeId.message}</p>
              )}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest">
                Nom du Produit
              </label>
              <input 
                {...register('name')}
                placeholder="Ex: Bananes Douces"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none text-slate-800 dark:text-white font-medium text-sm"
              />
              {errors.name && (
                <p className="text-xs text-red-550 font-semibold">{errors.name.message}</p>
              )}
            </div>

            {/* Grid for Price and Stock */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest">
                  Prix (FCFA)
                </label>
                <input 
                  type="number"
                  {...register('price', { valueAsNumber: true })}
                  placeholder="Ex: 500"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none text-slate-800 dark:text-white font-medium text-sm"
                />
                {errors.price && (
                  <p className="text-xs text-red-550 font-semibold">{errors.price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest">
                  Stock Initial
                </label>
                <input 
                  type="number"
                  {...register('stock', { valueAsNumber: true })}
                  placeholder="Ex: 10"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none text-slate-800 dark:text-white font-medium text-sm"
                />
                {errors.stock && (
                  <p className="text-xs text-red-550 font-semibold">{errors.stock.message}</p>
                )}
              </div>
            </div>

            {/* Category and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest">
                  Catégorie
                </label>
                <select 
                  {...register('category')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none text-slate-800 dark:text-white font-medium text-sm"
                >
                  {Object.entries(CATEGORIES).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-xs text-red-550 font-semibold">{errors.category.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest">
                  Unité de Mesure
                </label>
                <select 
                  {...register('unit')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none text-slate-800 dark:text-white font-medium text-sm"
                >
                  <option value="Pièce">Pièce</option>
                  <option value="Kg">Kg</option>
                  <option value="Litre">Litre</option>
                  <option value="Bouteille">Bouteille</option>
                  <option value="Paquet">Paquet</option>
                  <option value="Gramme">Gramme</option>
                </select>
                {errors.unit && (
                  <p className="text-xs text-red-550 font-semibold">{errors.unit.message}</p>
                )}
              </div>
            </div>

            {/* Product Image */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest">
                Images du Produit (minimum 1 obligatoire)
              </label>

              {imageUrls.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {imageUrls.map((url, index) => (
                    <div key={url} className="relative group/img aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={url} 
                        alt={`Preview ${index + 1}`} 
                        className="w-full h-full object-cover" 
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageUrls(prev => prev.filter((_, i) => i !== index));
                        }}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity duration-200 rounded-xl"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
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
                  multiple={true}
                />

                {uploading ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Loader2 className="animate-spin text-brand-primary" size={32} />
                    <span className="text-sm font-semibold text-slate-550">Téléchargement de l&apos;image...</span>
                  </div>
                ) : (
                  <div className="py-4 flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <Upload size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-350">
                        Glissez-déposez une ou plusieurs images ici
                      </p>
                      <p className="text-xs text-slate-455 mt-1">
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
                Description du Produit
              </label>
              <textarea 
                {...register('description')}
                placeholder="Renseignez les détails du produit (caractéristiques, conservation, origine...)"
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none text-slate-800 dark:text-white resize-none text-sm"
              />
              {errors.description && (
                <p className="text-xs text-red-550 font-semibold">{errors.description.message}</p>
              )}
            </div>

          </div>

          {/* Footer Actions */}
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
                  <Loader2 className="animate-spin" size={18} /> Création...
                </>
              ) : (
                'Créer le Produit'
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
