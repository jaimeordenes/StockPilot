import { describe, it, expect } from 'vitest';
import { InMemoryStorage } from '../storage';

describe('InMemoryStorage product audit', () => {
  it('stores deactivation events with userId and reason and returns them via getProductDeactivations', async () => {
    const s = new (InMemoryStorage as any)();
    // create product
    const p = await s.createProduct({ code: 'T-AUD-1', name: 'Test Audit Product' });
    expect(p.id).toBeTruthy();

    await s.deleteProduct(p.id, { userId: 'user-1', reason: 'test reason' });

    const events = await s.getProductDeactivations(p.id, 10, 0);
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThanOrEqual(1);
    const ev = events[0];
    expect(ev.action).toBe('deactivate');
    expect(ev.userId).toBe('user-1');
    expect(ev.reason).toBe('test reason');
  });

  it('stores reactivate events and returns them', async () => {
    const s = new (InMemoryStorage as any)();
    const p = await s.createProduct({ code: 'T-AUD-2', name: 'Test Audit Product 2' });
    await s.deleteProduct(p.id, { userId: 'u2', reason: 'r1' });
    await s.reactivateProduct(p.id, { userId: 'u2', reason: 'reactivated' });
    const events = await s.getProductDeactivations(p.id, 10, 0);
    expect(events.some((e: any) => e.action === 'reactivate')).toBe(true);
  });
});
