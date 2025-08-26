import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ArrowUp, ArrowDown, ArrowLeftRight, Package, Search, Calendar } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import type { RecentMovement } from "@/lib/types";

export default function MovementsTable() {
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data: movementsData, isLoading } = useQuery<any>({
    queryKey: ["/api/movements", { limit, offset: page * limit }],
    retry: false,
  });

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'entry':
        return { icon: ArrowUp, color: 'text-success-600', bg: 'bg-success-100 dark:bg-success-900/30' };
      case 'exit':
        return { icon: ArrowDown, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' };
      case 'transfer':
        return { icon: ArrowLeftRight, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' };
      default:
        return { icon: Package, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-900/30' };
    }
  };

  const getMovementTypeText = (type: string) => {
    const typeMap = {
      entry: 'Entrada',
      exit: 'Salida',
      transfer: 'Transferencia',
      adjustment: 'Ajuste'
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  const getMovementTypeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'entry': return 'default';
      case 'exit': return 'destructive';
      case 'transfer': return 'secondary';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Historial de Movimientos
            </h3>
          </div>
          
          <div className="space-y-3">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Historial de Movimientos
          </h3>
          <div className="flex space-x-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                className="pl-10"
                data-testid="input-filter-date"
              />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movementsData?.movements?.length > 0 ? (
                movementsData.movements.map((movement: RecentMovement) => {
                  const { icon: Icon, color, bg } = getMovementIcon(movement.movement.type);
                  
                  return (
                    <TableRow key={movement.movement.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 ${bg} rounded-full flex items-center justify-center`}>
                            <Icon className={`h-4 w-4 ${color}`} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white" data-testid={`text-movement-product-${movement.movement.id}`}>
                              {movement.product.name}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getMovementTypeVariant(movement.movement.type)}>
                          {getMovementTypeText(movement.movement.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-900 dark:text-white">
                        {movement.movement.type === 'exit' ? '-' : '+'}
                        {movement.movement.quantity}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                        {movement.sourceWarehouse?.name || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                        {movement.destinationWarehouse?.name || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                        {movement.user.firstName} {movement.user.lastName}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                        <div>
                          {format(new Date(movement.movement.createdAt), 'dd/MM/yyyy')}
                        </div>
                        <div className="text-xs">
                          {formatDistanceToNow(new Date(movement.movement.createdAt), { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <ArrowLeftRight className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No hay movimientos registrados
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {movementsData?.total > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {page * limit + 1} a {Math.min((page + 1) * limit, movementsData.total)} de {movementsData.total} movimientos
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                data-testid="button-previous-page-movements"
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled
                className="bg-primary-600 text-white"
              >
                {page + 1}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={(page + 1) * limit >= movementsData.total}
                data-testid="button-next-page-movements"
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
