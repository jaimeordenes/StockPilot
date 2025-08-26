import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import useRequireAuth from "@/hooks/useRequireAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { invalidateInventoryRelated } from "@/lib/invalidate";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import MovementForm from "@/components/forms/movement-form";
import MovementsTable from "@/components/tables/movements-table";
import { Plus, ArrowLeftRight } from "lucide-react";
import type { MovementFormData } from "@/lib/types";

export default function Movements() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { ready } = useRequireAuth();
  const queryClient = useQueryClient();

  // Redirect to home if not authenticated
  // Redirección centralizada en useRequireAuth

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
    retry: false,
  });

  const { data: warehouses } = useQuery({
    queryKey: ["/api/warehouses"],
    retry: false,
  });

  const { data: todayCounts } = useQuery({
    queryKey: ["/api/dashboard/movements-today"],
    retry: false,
    refetchInterval: 60_000, // refresco cada minuto
  });

  const createMutation = useMutation({
    mutationFn: async (data: MovementFormData) => {
      await apiRequest("POST", "/api/movements", data);
    },
    onMutate: async (data: MovementFormData) => {
      await queryClient.cancelQueries({ queryKey: ["/api/movements"] });
      const prev = queryClient.getQueryData<any>(["/api/movements"]);
      if (prev) {
        const optimistic = { ...prev };
        const fakeId = 'opt-mov-' + Date.now();
        optimistic.movements = [{ movement: { id: fakeId, type: data.type, quantity: data.quantity, createdAt: new Date().toISOString() }, product: { code: data.productId, name: (products as any)?.products?.find((p: any) => p.id === data.productId)?.name || 'Producto', }, sourceWarehouse: null, destinationWarehouse: null, user: { firstName: 'Tú', lastName: '' } }, ...optimistic.movements];
        queryClient.setQueryData(["/api/movements"], optimistic);
        return { prev };
      }
      return { prev: null };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["/api/movements"], ctx.prev);
      toast({
        title: 'Error',
        description: 'No se pudo registrar el movimiento',
        variant: 'destructive'
      });
    },
    onSettled: () => {
      invalidateInventoryRelated(queryClient);
      setIsFormOpen(false);
      toast({
        title: "Movimiento registrado",
        description: "El movimiento ha sido registrado exitosamente.",
      });
    },
  });

  const handleCreate = (data: MovementFormData) => {
    createMutation.mutate(data);
  };

  const handleNewMovement = () => {
    setIsFormOpen(true);
  };

  const canWrite = (user as any)?.role === 'administrator' || (user as any)?.role === 'operator';

  if (authLoading || !ready) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
          <div className="w-4 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-4 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            Movimientos
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Registra y consulta movimientos de inventario
          </p>
        </div>
        
        {canWrite && (
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={handleNewMovement}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  data-testid="button-new-movement"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar Movimiento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Registrar Movimiento</DialogTitle>
                </DialogHeader>
                <MovementForm
                  products={(products as any)?.products || []}
                  warehouses={(warehouses as any) || []}
                  onSubmit={handleCreate}
                  isLoading={createMutation.isPending}
                />
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              className="ml-2"
              onClick={() => {
                const url = '/api/export/movements';
                window.open(url, '_blank');
              }}
              data-testid="button-export-movements"
            >Exportar CSV</Button>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {useMemo(() => {
          const items = [
            { key: 'entry', label: 'Entradas Hoy', value: (todayCounts as any)?.entry, styles: 'bg-green-100 dark:bg-green-900 text-green-600' },
            { key: 'exit', label: 'Salidas Hoy', value: (todayCounts as any)?.exit, styles: 'bg-rose-100 dark:bg-rose-900 text-rose-600' },
            { key: 'transfer', label: 'Transferencias', value: (todayCounts as any)?.transfer, styles: 'bg-blue-100 dark:bg-blue-900 text-blue-600' },
            { key: 'adjustment', label: 'Ajustes', value: (todayCounts as any)?.adjustment, styles: 'bg-amber-100 dark:bg-amber-900 text-amber-600' },
            { key: 'total', label: 'Total Hoy', value: (todayCounts as any)?.total, styles: 'bg-violet-100 dark:bg-violet-900 text-violet-600' },
          ];
          return items.map(stat => (
            <Card key={stat.key}>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center mr-3 ${stat.styles.split(' ').filter(c=>c.startsWith('bg-')).join(' ')}`}> 
                    <ArrowLeftRight className={`h-4 w-4 ${stat.styles.split(' ').filter(c=>c.startsWith('text-')).join(' ')}`} aria-label={stat.label} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{stat.value ?? <span className="opacity-40">-</span>}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ));
        }, [todayCounts])}
      </div>

      {/* Movements table */}
      <MovementsTable />
    </div>
  );
}
