import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
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
  const queryClient = useQueryClient();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "No autorizado",
        description: "Redirigiendo al inicio de sesión...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
    retry: false,
  });

  const { data: warehouses } = useQuery({
    queryKey: ["/api/warehouses"],
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: MovementFormData) => {
      await apiRequest("POST", "/api/movements", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setIsFormOpen(false);
      toast({
        title: "Movimiento registrado",
        description: "El movimiento ha sido registrado exitosamente.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autorizado",
          description: "Redirigiendo al inicio de sesión...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "No se pudo registrar el movimiento.",
        variant: "destructive",
      });
    },
  });

  const handleCreate = (data: MovementFormData) => {
    createMutation.mutate(data);
  };

  const handleNewMovement = () => {
    setIsFormOpen(true);
  };

  const canWrite = user?.role === 'administrator' || user?.role === 'operator';

  if (authLoading || !isAuthenticated) {
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
                  products={products?.products || []}
                  warehouses={warehouses || []}
                  onSubmit={handleCreate}
                  isLoading={createMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-success-100 dark:bg-success-900 rounded-md flex items-center justify-center mr-3">
                <ArrowLeftRight className="h-4 w-4 text-success-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Entradas Hoy</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-md flex items-center justify-center mr-3">
                <ArrowLeftRight className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Salidas Hoy</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-md flex items-center justify-center mr-3">
                <ArrowLeftRight className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Transferencias</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-md flex items-center justify-center mr-3">
                <ArrowLeftRight className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Hoy</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Movements table */}
      <MovementsTable />
    </div>
  );
}
