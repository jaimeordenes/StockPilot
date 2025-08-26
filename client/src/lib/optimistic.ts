import type { Product } from '@/lib/types';

export interface ProductsList {
  products: any[];
  total: number;
}

export function applyOptimisticCreate(prev: ProductsList | undefined, data: { code: string; name: string; unit: string; } ): { next: ProductsList; fakeId: string } {
  const base: ProductsList = prev ? { ...prev, products: [...prev.products] } : { products: [], total: 0 };
  const fakeId = 'optimistic-' + Date.now();
  const optimisticProduct: Partial<Product> & { id: string } = {
    id: fakeId,
    code: data.code,
    name: data.name,
    unit: data.unit,
    minStock: undefined,
    maxStock: undefined,
    purchasePrice: undefined,
    salePrice: undefined,
    description: undefined,
  } as any;
  return { next: { products: [optimisticProduct, ...base.products], total: base.total + 1 }, fakeId };
}

export function revertOptimisticCreate(_current: ProductsList | undefined, prev: ProductsList | undefined) {
  return prev;
}
