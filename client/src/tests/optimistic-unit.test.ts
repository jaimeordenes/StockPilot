import { describe, it, expect } from 'vitest';
import { applyOptimisticCreate, revertOptimisticCreate } from '../lib/optimistic';

describe('optimistic create helpers', () => {
  it('inserta producto optimista al inicio y aumenta total', () => {
    const prev = { products: [{ id: '1', name: 'A', code: 'A', unit: 'u' }], total: 1 };
    const { next, fakeId } = applyOptimisticCreate(prev, { code: 'B', name: 'B', unit: 'u' });
    expect(next.products[0].id).toBe(fakeId);
    expect(next.total).toBe(2);
  });

  it('revert retorna snapshot previo', () => {
    const prev = { products: [{ id: '1', name: 'A', code: 'A', unit: 'u' }], total: 1 };
    const { next } = applyOptimisticCreate(prev, { code: 'B', name: 'B', unit: 'u' });
    const reverted = revertOptimisticCreate(next, prev);
    expect(reverted).toBe(prev);
  });
});
