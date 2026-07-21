"use client";

import React, { useState, useOptimistic, useTransition } from 'react';
import { Trash2, Edit2, Loader2, Store as StoreIcon, CheckCircle, XCircle } from 'lucide-react';
import { updateStoreStatusAction, deleteStoreAction } from '@/actions/ecommerce';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Store as StoreType } from '@/types';
import { StoreCreateSheet } from '@/components/blocks/admin/StoreCreateSheet';
import { StoreEditSheet } from '@/components/blocks/admin/StoreEditSheet';
import { DataTable } from '@/components/common/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { useToast } from '@/context/ToastContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AdminStoresClientProps {
  initialStores: StoreType[];
}

export default function AdminStoresClient({ initialStores }: AdminStoresClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  // Dialog & Sheet States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedStoreToEdit, setSelectedStoreToEdit] = useState<StoreType | null>(null);
  
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<StoreType | null>(null);

  const isCreateOpen = searchParams.get('new') === 'store';

  // Optimistic UI State
  const [optimisticStores, setOptimisticStores] = useOptimistic(
    initialStores,
    (state, action: 
      | { type: 'delete'; id: string }
      | { type: 'toggle'; id: string; isActive: boolean }
    ) => {
      switch (action.type) {
        case 'delete':
          return state.filter(s => s.id !== action.id);
        case 'toggle':
          return state.map(s => s.id === action.id ? { ...s, estActif: action.isActive, isActive: action.isActive } : s);
        default:
          return state;
      }
    }
  );

  const setIsCreateOpen = (open: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (open) {
      params.set('new', 'store');
    } else {
      params.delete('new');
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const toggleStatus = (storeId: string, currentStatus: boolean, storeName: string) => {
    const nextStatus = !currentStatus;
    startTransition(async () => {
      // Apply optimistic update
      setOptimisticStores({ type: 'toggle', id: storeId, isActive: nextStatus });
      try {
        const res = await updateStoreStatusAction(storeId, nextStatus);
        if (res.success) {
          toast.success(`Le magasin ${storeName} est maintenant ${nextStatus ? 'actif' : 'inactif'}.`);
          router.refresh();
        } else {
          toast.error(res.error || "Impossible de changer le statut.");
        }
      } catch (e: any) {
        toast.error(e.message || "Une erreur est survenue.");
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!storeToDelete) return;
    const store = storeToDelete;
    setIsDeleteAlertOpen(false);
    setStoreToDelete(null);

    startTransition(async () => {
      // Apply optimistic deletion
      setOptimisticStores({ type: 'delete', id: store.id });
      try {
        const res = await deleteStoreAction(store.id);
        if (res.success) {
          toast.success(`Le magasin ${store.nom || store.name} a été supprimé.`);
          router.refresh();
        } else {
          toast.error(res.error || "Erreur lors de la suppression.");
        }
      } catch (err: any) {
        toast.error("Une erreur est survenue lors de la suppression.");
      }
    });
  };

  const handleSuccess = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  // Define Columns for TanStack Table
  const columns: ColumnDef<StoreType>[] = [
    {
      accessorKey: 'name',
      header: 'Magasin',
      cell: ({ row }) => {
        const store = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 overflow-hidden flex-shrink-0">
              {store.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.logo} alt={store.nom || store.name || ''} className="w-full h-full object-cover" />
              ) : (
                <StoreIcon size={20} />
              )}
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200">{store.nom || store.name}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'district',
      header: 'Quartier',
      cell: ({ row }) => (
        <span className="text-slate-650 dark:text-slate-400 font-bold">{row.original.quartier || row.original.district}</span>
      )
    },
    {
      accessorKey: 'phone',
      header: 'Téléphone',
      cell: ({ row }) => (
        <span className="text-slate-500 dark:text-slate-400 font-mono text-xs font-bold">{row.original.telephone || row.original.phone}</span>
      )
    },
    {
      accessorKey: 'isActive',
      header: 'Statut',
      cell: ({ row }) => {
        const store = row.original;
        return (
          <button 
            onClick={() => toggleStatus(store.id, store.estActif ?? store.isActive ?? true, store.nom || store.name || '')} 
            disabled={isPending}
            className="focus:outline-none cursor-pointer disabled:opacity-60"
            title="Cliquez pour changer le statut"
          >
            {(store.estActif ?? store.isActive) ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-250/30">
                <CheckCircle size={12} /> Actif
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-250/30">
                <XCircle size={12} /> Inactif
              </span>
            )}
          </button>
        );
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const store = row.original;
        return (
          <div className="flex gap-1">
            <button 
              onClick={() => { setSelectedStoreToEdit(store); setIsEditOpen(true); }}
              className="p-2 text-slate-400 hover:text-brand-primary dark:hover:text-brand-primary transition-colors cursor-pointer"
              title="Modifier"
            >
              <Edit2 size={16} />
            </button>
            <button 
              onClick={() => { setStoreToDelete(store); setIsDeleteAlertOpen(true); }}
              className="p-2 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              title="Supprimer"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
      <DataTable 
        columns={columns} 
        data={optimisticStores} 
        searchPlaceholder="Rechercher un magasin par nom, quartier..." 
      />

      {/* Slide-out creation Drawer (Sheet) */}
      <StoreCreateSheet 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleSuccess}
      />

      {/* Slide-out edition Drawer (Sheet) */}
      <StoreEditSheet 
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setSelectedStoreToEdit(null); }}
        onSuccess={handleSuccess}
        store={selectedStoreToEdit}
      />

      {/* Soft Delete Confirmation Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-md w-full">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-xl font-black text-slate-800 dark:text-white">
              Supprimer le magasin partenaire ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed">
              Êtes-vous sûr de vouloir supprimer <strong className="text-slate-700 dark:text-slate-200">{storeToDelete?.nom || storeToDelete?.name}</strong> ? 
              Cette action le retirera définitivement de l&apos;interface publique et masquera également tous les produits associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex justify-end gap-3">
            <AlertDialogCancel 
              onClick={() => { setIsDeleteAlertOpen(false); setStoreToDelete(null); }}
              className="h-11 px-5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="h-11 px-5 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/10 cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
