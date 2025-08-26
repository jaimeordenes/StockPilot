import { QueryClient } from '@tanstack/react-query';

// Claves relacionadas a inventario / dashboard que deben refrescar tras mutaciones
const RELATED_KEYS = [
  '/api/products',
  '/api/dashboard/stats',
  '/api/dashboard/low-stock',
  '/api/inventory',
  '/api/dashboard/recent-movements',
  '/api/dashboard/movements-today',
  '/api/movements'
];

export function invalidateInventoryRelated(qc: QueryClient) {
  RELATED_KEYS.forEach(k => qc.invalidateQueries({ queryKey: [k] }));
}
