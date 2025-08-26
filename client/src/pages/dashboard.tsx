import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import useRequireAuth from "@/hooks/useRequireAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import StatsCards from "@/components/dashboard/stats-cards";
import Charts from "@/components/dashboard/charts";
import LowStockAlerts from "@/components/dashboard/low-stock-alerts";
import RecentMovements from "@/components/dashboard/recent-movements";
import ProductsTable from "@/components/tables/products-table";
import { useQuery as useRQ } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeftRight } from "lucide-react";
import type { DashboardStats } from "@/lib/types";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { ready } = useRequireAuth();

  // Redirección centralizada en useRequireAuth

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  // Inventory overview (public)
  const { data: inventory } = useRQ({
    queryKey: ['/api/inventory'],
    queryFn: async () => {
      const res = await fetch('/api/inventory');
      if (!res.ok) throw new Error('Failed to fetch inventory');
      return res.json();
    },
    retry: false,
  });

  if (isLoading || !ready) {
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
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Resumen general del inventario y operaciones
          </p>
        </div>
        
        {/* Quick actions */}
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <Button 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            data-testid="button-new-product"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Button>
          <Button 
            variant="outline"
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            data-testid="button-new-movement"
          >
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            Registrar Movimiento
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <StatsCards stats={stats} isLoading={statsLoading} />

      {/* Charts section */}
      <Charts />

      {/* Recent Activity and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <LowStockAlerts />
        <RecentMovements />
      </div>

      {/* Products table */}
      <ProductsTable />

      {/* Inventory quick list */}
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-2">Inventario (resumen)</h3>
        <div className="mb-2 flex justify-end">
          <button
            onClick={() => { window.open('/api/export/inventory','_blank'); }}
            className="text-xs px-3 py-1 border rounded bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            data-testid="button-export-inventory"
          >Exportar CSV (Bajo stock)</button>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded">
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1">Código</th>
                  <th className="px-2 py-1">Producto</th>
                  <th className="px-2 py-1">Bodega</th>
                  <th className="px-2 py-1">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(inventory) && inventory.map((row: any, idx: number) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900' : ''}>
                    <td className="px-2 py-1">{row.product_code}</td>
                    <td className="px-2 py-1">{row.product_name}</td>
                    <td className="px-2 py-1">{row.warehouse_name}</td>
                    <td className="px-2 py-1">{row.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
