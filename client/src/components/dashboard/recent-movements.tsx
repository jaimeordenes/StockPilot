import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUp, ArrowDown, ArrowLeftRight, Package } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { RecentMovement } from "@/lib/types";

export default function RecentMovements() {
  const { data: recentMovements, isLoading } = useQuery<RecentMovement[]>({
    queryKey: ["/api/dashboard/recent-movements"],
    retry: false,
  });

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'entry':
        return { icon: ArrowUp, bgColor: 'bg-success-100 dark:bg-success-900/30', iconColor: 'text-success-600' };
      case 'exit':
        return { icon: ArrowDown, bgColor: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-600' };
      case 'transfer':
        return { icon: ArrowLeftRight, bgColor: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600' };
      default:
        return { icon: Package, bgColor: 'bg-gray-100 dark:bg-gray-900/30', iconColor: 'text-gray-600' };
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

  const getMovementDescription = (movement: RecentMovement) => {
    switch (movement.movement.type) {
      case 'entry':
        return `+${movement.movement.quantity} unidades`;
      case 'exit':
        return `-${movement.movement.quantity} unidades`;
      case 'transfer':
        return `${movement.sourceWarehouse?.name} → ${movement.destinationWarehouse?.name}`;
      default:
        return `${movement.movement.quantity} unidades`;
    }
  };

  return (
    <Card className="border border-gray-200 dark:border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Movimientos Recientes
          </h3>
          <Button 
            variant="link" 
            className="text-primary-600 hover:text-primary-900 text-sm font-medium p-0"
            data-testid="button-view-movement-history"
          >
            Ver historial
          </Button>
        </div>
        
        <div className="space-y-3">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))
          ) : recentMovements && recentMovements.length > 0 ? (
            recentMovements.slice(0, 5).map((movement) => {
              const { icon: Icon, bgColor, iconColor } = getMovementIcon(movement.movement.type);
              
              return (
                <div 
                  key={movement.movement.id}
                  className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                  data-testid={`movement-${movement.movement.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${bgColor} rounded-full flex items-center justify-center`}>
                      <Icon className={`${iconColor} h-4 w-4`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {movement.product.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        <span>{getMovementTypeText(movement.movement.type)}</span> • {getMovementDescription(movement)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(movement.movement.createdAt), { 
                        addSuffix: true, 
                        locale: es 
                      })}
                    </p>
                    <p className="text-xs text-gray-400">
                      {movement.user.firstName} {movement.user.lastName}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <ArrowLeftRight className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No hay movimientos recientes
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
