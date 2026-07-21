import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings } from "lucide-react";

export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse p-2">
      {/* Page Header Skeleton */}
      <div>
        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1 mb-2">
          <span>Admin</span>
          <span>/</span>
          <span className="text-slate-500 dark:text-slate-400">Configuration</span>
        </div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
          <Settings className="text-brand-primary/40 animate-pulse" size={28} /> Configuration
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Gérez le profil, la sécurité et les préférences de la plateforme.</p>
      </div>

      {/* Tabs Skeleton */}
      <div className="w-full space-y-6">
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl max-w-md h-12 gap-2">
          <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl" />
          <div className="flex-1 bg-transparent rounded-xl" />
          <div className="flex-1 bg-transparent rounded-xl" />
        </div>

        {/* Content Card Skeleton */}
        <div className="border border-slate-200/80 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/30 backdrop-blur-xl rounded-[2rem] p-8 shadow-xl space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <Skeleton className="h-4 w-96 bg-slate-100 dark:bg-slate-900 rounded-md" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 bg-slate-250 dark:bg-slate-800 rounded" />
              <Skeleton className="h-12 w-full bg-slate-150 dark:bg-slate-850 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 bg-slate-250 dark:bg-slate-800 rounded" />
              <Skeleton className="h-12 w-full bg-slate-150 dark:bg-slate-850 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 bg-slate-250 dark:bg-slate-800 rounded" />
              <Skeleton className="h-12 w-full bg-slate-150 dark:bg-slate-850 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-48 bg-slate-250 dark:bg-slate-800 rounded" />
              <Skeleton className="h-12 w-full bg-slate-150 dark:bg-slate-850 rounded-xl" />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Skeleton className="h-12 w-40 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
