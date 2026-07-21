"use client";

import React, { useTransition } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
}

export function DataTablePagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange
}: DataTablePaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(page));
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    }
  };

  const canPreviousPage = currentPage > 1 && !isPending;
  const canNextPage = currentPage < totalPages && !isPending;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full px-6 py-4 border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/10">
      {/* Left side info */}
      <div className="text-sm text-slate-500 dark:text-slate-450 font-medium">
        Page {currentPage} sur {totalPages || 1}{totalItems !== undefined ? ` (${totalItems} éléments au total)` : ''}
      </div>
      
      {/* Right side navigation buttons */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => handlePageChange(1)}
          disabled={!canPreviousPage}
          title="Première page"
          className="cursor-pointer"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={!canPreviousPage}
          title="Page précédente"
          className="cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={!canNextPage}
          title="Page suivante"
          className="cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => handlePageChange(totalPages)}
          disabled={!canNextPage}
          title="Dernière page"
          className="cursor-pointer"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
