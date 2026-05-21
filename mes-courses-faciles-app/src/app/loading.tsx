import { Skeleton } from "@/components/ui/Skeleton";

export default function GlobalLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-pulse">
      <div className="h-64 bg-slate-100 rounded-3xl w-full" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-square bg-slate-100 rounded-2xl" />
            <div className="h-4 bg-slate-100 rounded w-3/4" />
            <div className="h-4 bg-slate-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
