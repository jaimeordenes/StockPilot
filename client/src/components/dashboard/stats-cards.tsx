import { Card, CardContent } from "@/components/ui/card";
import { Package, AlertTriangle, Building2, ArrowLeftRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats } from "@/lib/types";

interface StatsCardsProps {
  stats?: DashboardStats;
  isLoading: boolean;
}

export default function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const statItems = [
    {
      name: "Total Productos",
      value: stats?.totalProducts || 0,
      icon: Package,
      bgColor: "bg-blue-500",
      testId: "stat-total-products"
    },
    {
      name: "Stock Bajo",
      value: stats?.lowStockItems || 0,
      icon: AlertTriangle,
      bgColor: "bg-warning-500",
      testId: "stat-low-stock"
    },
    {
      name: "Bodegas Activas",
      value: stats?.activeWarehouses || 0,
      icon: Building2,
      bgColor: "bg-success-500",
      testId: "stat-warehouses"
    },
    {
      name: "Movimientos Hoy",
      value: stats?.todayMovements || 0,
      icon: ArrowLeftRight,
      bgColor: "bg-purple-500",
      testId: "stat-today-movements"
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i} className="border border-gray-200 dark:border-gray-700">
            <CardContent className="p-5">
              <div className="flex items-center">
                <Skeleton className="w-8 h-8 rounded-md" />
                <div className="ml-5 w-0 flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.name} className="border border-gray-200 dark:border-gray-700">
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 ${item.bgColor} rounded-md flex items-center justify-center`}>
                    <Icon className="text-white text-sm h-4 w-4" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      {item.name}
                    </dt>
                    <dd 
                      className="text-lg font-medium text-gray-900 dark:text-white" 
                      data-testid={item.testId}
                    >
                      {item.value.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
