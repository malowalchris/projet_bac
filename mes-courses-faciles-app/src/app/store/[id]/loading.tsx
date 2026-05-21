import { Skeleton } from "@/components/ui/Skeleton";

export default function StoreLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-48 bg-slate-100 w-full" />
      <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-square bg-slate-100 rounded-2xl" />
            <div className="h-4 bg-slate-100 rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
