import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';

type AuditEvent = {
  id: string;
  productId: string;
  userId: string | null;
  action: string;
  reason: string | null;
  createdAt: string;
};

type UserProfile = { id: string; username?: string; firstName?: string; lastName?: string };

export default function ProductAudit({ productId }: { productId?: string | null }) {
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [userCache, setUserCache] = useState<Record<string, UserProfile>>({});

  const enabled = Boolean(productId);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["/api/products/audit", productId, limit, offset],
    queryFn: async () => {
      const url = `/api/products/${productId}/audit?limit=${limit}&offset=${offset}`;
      const res = await apiRequest('GET', url);
      // apiRequest returns the Response object after checking status
      // parse JSON here so callers get the actual payload
      const json = await (res as Response).json();
      return json as { events: AuditEvent[]; limit: number; offset: number };
    },
    enabled,
  });

  useEffect(() => {
    // Resolve user names for any userIds not in cache
  const events: AuditEvent[] = (data?.events as AuditEvent[]) || [];
  const userIds = Array.from(new Set(events.map(e => e.userId).filter((v): v is string => Boolean(v))));
  const missing = userIds.filter((id) => !userCache[id]);
    if (missing.length === 0) return;
    (async () => {
      const updates: Record<string, UserProfile> = {};
    for (const id of missing) {
        try {
      const u = await apiRequest('GET', `/api/internal/users/${id}`);
      updates[id] = (u as unknown as UserProfile) || { id };
        } catch (e) {
      updates[id] = { id };
        }
      }
      setUserCache(prev => ({ ...prev, ...updates }));
    })();
  }, [data]);

  if (!productId) return null;

  const events: AuditEvent[] = (data?.events as AuditEvent[]) || [];

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold mb-2">Historial de auditoría</h3>
      <div className="space-y-2">
        {events.length === 0 && !isFetching ? (
          <p className="text-xs text-gray-500">No hay eventos de auditoría.</p>
        ) : (
          events.map((e: AuditEvent) => (
            <div key={e.id} className="p-2 border rounded bg-gray-50 dark:bg-gray-800">
              <div className="flex justify-between text-sm">
                <div className="font-medium">{e.action}</div>
                <div className="text-xs text-gray-500">{new Date(e.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                <span className="mr-2">Usuario: {e.userId ? (userCache[e.userId]?.username || userCache[e.userId]?.firstName || e.userId) : '—'}</span>
                {e.reason && <span>Motivo: {e.reason}</span>}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            const next = Math.max(0, offset - limit);
            setOffset(next);
            await refetch();
          }}
          disabled={offset === 0}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            setOffset(offset + limit);
            await refetch();
          }}
          disabled={events.length < limit}
        >
          Cargar más
        </Button>
      </div>
    </div>
  );
}
