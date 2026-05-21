export default function CheckoutLoading() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-12 animate-pulse">
      <div className="flex justify-center gap-8">
        {[1, 2, 3].map(i => <div key={i} className="w-12 h-12 bg-slate-100 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-96 bg-slate-100 rounded-3xl" />
        <div className="h-96 bg-slate-100 rounded-3xl" />
      </div>
    </div>
  );
}
