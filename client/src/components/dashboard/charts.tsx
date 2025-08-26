import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, TrendingUp } from "lucide-react";

export default function Charts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Stock Overview Chart */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Resumen de Stock por Categoría
          </h3>
          <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Gráfico de Stock por Categoría
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Implementación con Recharts próximamente
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movement Trends Chart */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Tendencia de Movimientos (Últimos 30 días)
          </h3>
          <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Gráfico de Tendencias
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Línea temporal de entradas vs salidas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
