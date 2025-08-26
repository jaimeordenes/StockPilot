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
import { Package, Search, Eye, Edit, Plus } from "lucide-react";
import type { Product } from "@/lib/types";

export default function ProductsTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 10;

  const { data: productsData, isLoading } = useQuery<any>({
    queryKey: ["/api/products", { limit, offset: page * limit, search }],
    retry: false,
  });

  const getStockStatus = (product: Product, currentStock: number = 0) => {
    if (!product.minStock) return { status: "normal", text: "Normal", variant: "outline" as const };
    
    if (currentStock === 0) {
      return { status: "out", text: "Sin Stock", variant: "destructive" as const };
    } else if (currentStock <= product.minStock) {
      return { status: "low", text: "Stock Bajo", variant: "secondary" as const };
    } else {
      return { status: "normal", text: "Normal", variant: "outline" as const };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Productos Más Movidos
            </h3>
            <div className="flex space-x-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-10" />
            </div>
          </div>
          
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <div className="flex space-x-2">
                    <Skeleton className="w-8 h-8" />
                    <Skeleton className="w-8 h-8" />
                    <Skeleton className="w-8 h-8" />
                  </div>
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
            Productos Más Movidos
          </h3>
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search-products-table"
              />
            </div>
            <Button className="bg-primary-600 hover:bg-primary-700" data-testid="button-search-products">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Stock Actual</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Última Actualización</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsData?.products?.length > 0 ? (
                productsData.products.map((product: Product) => {
                  const stockStatus = getStockStatus(product, 0);
                  
                  return (
                    <TableRow key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white" data-testid={`text-table-product-name-${product.id}`}>
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400" data-testid={`text-table-product-code-${product.id}`}>
                              SKU: {product.code}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-900 dark:text-white">
                        {product.categoryId || "Sin categoría"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-900 dark:text-white">
                        0 {/* This would come from inventory data */}
                      </TableCell>
                      <TableCell>
                        <Badge variant={stockStatus.variant}>
                          {stockStatus.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                        Hace 2 horas
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`button-view-table-product-${product.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`button-edit-table-product-${product.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-success-600 hover:text-success-900"
                            data-testid={`button-add-movement-table-product-${product.id}`}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {search ? "No se encontraron productos" : "No hay productos disponibles"}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {productsData?.total > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {page * limit + 1} a {Math.min((page + 1) * limit, productsData.total)} de {productsData.total} productos
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                data-testid="button-previous-page-table"
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
                disabled={(page + 1) * limit >= productsData.total}
                data-testid="button-next-page-table"
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
