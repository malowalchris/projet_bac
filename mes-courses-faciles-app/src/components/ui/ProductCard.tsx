import React from 'react';
import Image from 'next/image';
import { Card } from './Card';
import { Plus, ShoppingCart } from 'lucide-react';
import { Button } from './Button';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  name: string;
  price: number;
  image: string;
  category: string;
  unit: string;
  storeId?: string;
}

export const ProductCard = ({ name, price, image, category, unit, storeId }: ProductCardProps) => {
  const { addToCart } = useCart();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!storeId) {
      console.error("storeId is missing for product", name);
      return;
    }
    addToCart({ name, price, image, category, unit, storeId });
  };

  return (
    <Card className="group">
      <div className="relative h-44 w-full bg-slate-50 p-4">
        <Image
          src={image}
          alt={name}
          fill
          className="object-contain p-4 mix-blend-multiply transition-transform duration-500 group-hover:scale-110"
        />
        <button
          onClick={handleAdd}
          className="absolute top-3 right-3 h-10 w-10 bg-white rounded-full shadow-md flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all active:scale-90"
        >
          <Plus size={20} strokeWidth={3} />
        </button>
      </div>
      <div className="p-4 space-y-2">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{category}</div>
        <h4 className="font-bold text-slate-800 line-clamp-2 leading-tight h-10">{name}</h4>
        <div className="flex items-end justify-between pt-2">
          <div className="flex flex-col">
            <span className="text-xl font-extrabold text-brand-secondary">
              {price.toLocaleString()} <span className="text-xs">CFA</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">soit {price} CFA / {unit}</span>
          </div>
          <Button
            onClick={handleAdd}
            size="sm"
            variant="ghost"
            className="h-10 w-10 p-0 rounded-full bg-brand-accent text-brand-primary"
          >
            <ShoppingCart size={18} />
          </Button>
        </div>
      </div>
    </Card>
  );
};
