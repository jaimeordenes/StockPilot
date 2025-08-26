import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Construir URL a partir del queryKey permitiendo un objeto de params
    const keyParts = queryKey as any[];
    let baseUrl = '';
    const params: Record<string, string> = {};
    for (const part of keyParts) {
      if (typeof part === 'string') {
        // Solo usar la primera parte como base absoluta si empieza con /api
        if (!baseUrl) baseUrl = part; else baseUrl += '';
      } else if (part && typeof part === 'object' && !Array.isArray(part)) {
        for (const [k, v] of Object.entries(part)) {
          if (v !== undefined && v !== null && v !== '') params[k] = String(v);
        }
      }
    }
    if (!baseUrl) throw new Error('Invalid query key (missing base URL)');
    const qs = Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : '';
    const finalUrl = baseUrl + qs;

    const res = await fetch(finalUrl, { credentials: 'include' });
    if (unauthorizedBehavior === 'returnNull' && res.status === 401) return null;
    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
