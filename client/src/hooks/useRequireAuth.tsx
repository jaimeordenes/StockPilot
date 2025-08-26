import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para exigir autenticación y redirigir si no existe sesión.
 * Devuelve loading combinado y estado auth listo para render condicional.
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: 'No autorizado',
        description: 'Redirigiendo al inicio de sesión...',
        variant: 'destructive',
      });
      const t = setTimeout(() => {
        window.location.href = '/login';
      }, 400);
      return () => clearTimeout(t);
    }
  }, [isAuthenticated, isLoading, toast]);

  return { ready: !isLoading && isAuthenticated, isAuthenticated, isLoading };
}
export default useRequireAuth;
