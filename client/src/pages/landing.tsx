import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Warehouse, BarChart3, Users, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-20 pb-16 text-center">
          <div className="flex items-center justify-center space-x-2 mb-8">
            <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
              <Warehouse className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Módulo Inventario</h1>
          </div>
          
          <h2 className="text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Sistema de Inventario
            <br />
            <span className="text-primary-500">Profesional</span>
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            Gestiona tu inventario y control de bodega de manera eficiente con nuestro sistema 
            profesional diseñado para empresas modernas.
          </p>
          
          <Button 
            size="lg" 
            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 text-lg"
            onClick={() => window.location.href = '/login'}
            data-testid="button-login"
          >
            Iniciar Sesión
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Warehouse className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Control de Inventario
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Gestiona productos, bodegas y movimientos de inventario en tiempo real
              </p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 dark:border-gray-700">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-success-100 dark:bg-success-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-success-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Reportes y Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Obtén insights valiosos con reportes detallados y métricas en tiempo real
              </p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 dark:border-gray-700">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-warning-100 dark:bg-warning-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-warning-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Multi-usuario
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Sistema diseñado para equipos con roles y permisos diferenciados
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Funcionalidades Principales
              </h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                <li className="flex items-center">
                  <Shield className="h-5 w-5 text-primary-500 mr-3" />
                  Autenticación segura y control de acceso
                </li>
                <li className="flex items-center">
                  <Shield className="h-5 w-5 text-primary-500 mr-3" />
                  Gestión completa de productos y categorías
                </li>
                <li className="flex items-center">
                  <Shield className="h-5 w-5 text-primary-500 mr-3" />
                  Control de múltiples bodegas y ubicaciones
                </li>
                <li className="flex items-center">
                  <Shield className="h-5 w-5 text-primary-500 mr-3" />
                  Registro de movimientos (entradas, salidas, transferencias)
                </li>
                <li className="flex items-center">
                  <Shield className="h-5 w-5 text-primary-500 mr-3" />
                  Alertas de stock bajo automáticas
                </li>
                <li className="flex items-center">
                  <Shield className="h-5 w-5 text-primary-500 mr-3" />
                  Dashboard con métricas y estadísticas
                </li>
              </ul>
            </div>
            <div className="text-center">
              <div className="w-48 h-48 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mx-auto flex items-center justify-center">
                <Warehouse className="h-24 w-24 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="text-center pb-16">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            ¿Listo para comenzar?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Inicia sesión para acceder a tu sistema de inventario
          </p>
          <Button 
            size="lg" 
            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 text-lg"
            onClick={() => window.location.href = '/login'}
            data-testid="button-login-footer"
          >
            Acceder al Sistema
          </Button>
        </div>
      </div>
    </div>
  );
}
