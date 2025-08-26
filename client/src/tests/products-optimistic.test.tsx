// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { render, waitFor } from '@testing-library/react';
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: true, isLoading: false, user: { role: 'administrator' } })
}));
// Mock Select UI para evitar restricciones de Radix en test
vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div data-mock="select">{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-value={value}>{children}</div>,
  SelectValue: () => null
}));
import Products from '@/pages/products';

// Mock fetch global
const originalFetch = global.fetch;

function mockFetchSequence(sequence: Array<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>) {
  let call = 0;
  global.fetch = vi.fn(async (input: any, init?: any) => {
    const handler = sequence[Math.min(call, sequence.length - 1)];
    call++;
    return handler(input, init);
  }) as any;
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('Products optimistic create', () => {
  beforeEach(() => {
    global.fetch = originalFetch;
  });

  it('muestra producto optimista y luego se revierte manualmente', async () => {
    const queryClient = new QueryClient();

    // Mock fetch genérico para endpoints usados
    global.fetch = vi.fn(async (input: any) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.startsWith('/api/products')) return jsonResponse({ products: [], total: 0 });
      if (url.startsWith('/api/categories')) return jsonResponse([]);
      if (url.startsWith('/api/suppliers')) return jsonResponse([]);
      if (url.startsWith('/api/dashboard')) return jsonResponse({});
      return jsonResponse({});
    }) as any;

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <Products />
      </QueryClientProvider>
    );
    // Esperar a que el fetch inicial (lista vacía) ocurra
  await waitFor(() => expect((global.fetch as any).mock.calls.length).toBeGreaterThan(0));

    // Abrir diálogo nuevo producto
  // Simular inserción optimista manual: disparar mutate directamente usando el queryClient manipulación
  // Obtenemos acceso a la mutation a través de un hack: añadimos un producto optimista manualmente como haría onMutate
  const key = ["/api/products", { limit: 20, offset: 0, search: '', categoryId: undefined, supplierId: undefined, lowStockOnly: false }];
  queryClient.setQueryData(key, { products: [], total: 0 });
  // Simular onMutate de create con nombre 'Test Prod'
  const prev = queryClient.getQueryData<any>(key);
  const fakeId = 'optimistic-test';
  queryClient.setQueryData(key, { ...prev, products: [{ id: fakeId, code: 'TP', name: 'Test Prod', unit: 'u', totalStock: 0, isLowStock: false }, ...prev.products], total: (prev.total||0)+1 });

    // Producto optimista debería aparecer (buscamos por texto)
    await waitFor(() => {
      const optimistic = Array.from(container.querySelectorAll('[data-testid^="text-product-name-"]')).find(el => /Test Prod/.test(el.textContent || ''));
      expect(optimistic).toBeTruthy();
    });

  // Simular fallo: revertiendo datos
  queryClient.setQueryData(key, { products: [], total: 0 });
    await waitFor(() => {
      const optimistic = Array.from(container.querySelectorAll('[data-testid^="text-product-name-"]')).find(el => /Test Prod/.test(el.textContent || ''));
      expect(optimistic).toBeFalsy();
    });
  });
});
