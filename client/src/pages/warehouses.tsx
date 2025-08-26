import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import WarehouseForm from "@/components/forms/warehouse-form";
import { Plus, Building2, MapPin, User, Edit, Trash2 } from "lucide-react";
import type { Warehouse, WarehouseFormData } from "@/lib/types";

export default function Warehouses() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
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

  const { data: warehouses, isLoading } = useQuery({
    queryKey: ["/api/warehouses"],
    retry: false,
  });

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: WarehouseFormData) => {
      await apiRequest("POST", "/api/warehouses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      setIsFormOpen(false);
      toast({
        title: "Bodega creada",
        description: "La bodega ha sido creada exitosamente.",
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
        description: "No se pudo crear la bodega.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<WarehouseFormData> }) => {
      await apiRequest("PUT", `/api/warehouses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      setEditingWarehouse(null);
      setIsFormOpen(false);
      toast({
        title: "Bodega actualizada",
        description: "La bodega ha sido actualizada exitosamente.",
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
        description: "No se pudo actualizar la bodega.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/warehouses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      toast({
        title: "Bodega eliminada",
        description: "La bodega ha sido eliminada exitosamente.",
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
        description: "No se pudo eliminar la bodega.",
        variant: "destructive",
      });
    },
  });

  const handleCreate = (data: WarehouseFormData) => {
    createMutation.mutate(data);
  };

  const handleUpdate = (data: WarehouseFormData) => {
    if (editingWarehouse) {
      updateMutation.mutate({ id: editingWarehouse.id, data });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Está seguro que desea eliminar esta bodega?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setIsFormOpen(true);
  };

  const handleNewWarehouse = () => {
    setEditingWarehouse(null);
    setIsFormOpen(true);
  };

  const canWrite = (user as any)?.role === 'administrator' || (user as any)?.role === 'operator';

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
            Bodegas
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestiona las ubicaciones y almacenes de tu inventario
          </p>
        </div>
        
        {canWrite && (
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={handleNewWarehouse}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  data-testid="button-new-warehouse"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Bodega
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingWarehouse ? "Editar Bodega" : "Nueva Bodega"}
                  </DialogTitle>
                </DialogHeader>
                <WarehouseForm
                  warehouse={editingWarehouse}
                  users={(users as any) || []}
                  onSubmit={editingWarehouse ? handleUpdate : handleCreate}
                  isLoading={createMutation.isPending || updateMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Warehouses grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div>
                      <Skeleton className="h-5 w-24 mb-2" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="w-8 h-8" />
                    <Skeleton className="w-8 h-8" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (warehouses as any)?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(warehouses as any).map((warehouse: Warehouse) => (
            <Card key={warehouse.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-success-100 dark:bg-success-900 rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-success-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white" data-testid={`text-warehouse-name-${warehouse.id}`}>
                        {warehouse.name}
                      </h3>
                      <Badge variant="outline" className="mt-1">
                        {warehouse.isActive ? "Activa" : "Inactiva"}
                      </Badge>
                    </div>
                  </div>
                  {canWrite && (
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(warehouse)}
                        data-testid={`button-edit-warehouse-${warehouse.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {(user as any)?.role === 'administrator' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(warehouse.id)}
                          className="text-red-600 hover:text-red-900"
                          data-testid={`button-delete-warehouse-${warehouse.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  {warehouse.location && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4 mr-2" />
                      {warehouse.location}
                    </div>
                  )}
                  
                  {warehouse.capacity && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Capacidad:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {warehouse.capacity.toLocaleString()} unidades
                      </span>
                    </div>
                  )}
                  
                  {warehouse.managerId && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <User className="h-4 w-4 mr-2" />
                      Responsable asignado
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No hay bodegas
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Comienza agregando tu primera bodega o almacén.
          </p>
          {canWrite && (
            <Button onClick={handleNewWarehouse} data-testid="button-add-first-warehouse">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Primera Bodega
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
