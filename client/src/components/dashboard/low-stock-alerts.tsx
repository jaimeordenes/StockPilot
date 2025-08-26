import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import type { LowStockProduct } from "@/lib/types";

export default function LowStockAlerts() {
  const { data: lowStockProducts, isLoading } = useQuery<LowStockProduct[]>({
    queryKey: ["/api/dashboard/low-stock"],
    retry: false,
  });

  return (
    <Card className="border border-gray-200 dark:border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Alertas de Stock Bajo
          </h3>
          <Button 
            variant="link" 
            className="text-primary-600 hover:text-primary-900 text-sm font-medium p-0"
            data-testid="button-view-all-alerts"
          >
            Ver todas
          </Button>
        </div>
        
        <div className="space-y-3">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-2 h-2 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))
          ) : lowStockProducts && lowStockProducts.length > 0 ? (
            lowStockProducts.slice(0, 3).map((item) => {
              const isOutOfStock = item.currentStock === 0;
              const alertClass = isOutOfStock 
                ? "bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800"
                : "bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800";
              const dotClass = isOutOfStock ? "bg-danger-500" : "bg-warning-500";
              const buttonClass = isOutOfStock 
                ? "bg-danger-600 hover:bg-danger-700" 
                : "bg-warning-600 hover:bg-warning-700";
              const buttonText = isOutOfStock ? "Urgente" : "Reabastecer";
              
              return (
                <div 
                  key={`${item.product.id}-${item.warehouse.id}`}
                  className={`flex items-center justify-between p-3 border rounded-lg ${alertClass}`}
                  data-testid={`alert-${item.product.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 ${dotClass} rounded-full`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Stock actual: <span className={`font-medium ${isOutOfStock ? 'text-danger-600' : ''}`}>
                          {item.currentStock}
                        </span> | 
                        Mínimo: <span className="font-medium">{item.product.minStock}</span>
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className={`text-xs text-white px-3 py-1 ${buttonClass}`}
                    data-testid={`button-restock-${item.product.id}`}
                  >
                    {buttonText}
                  </Button>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <AlertTriangle className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No hay alertas de stock bajo
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
