import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import useRequireAuth from "@/hooks/useRequireAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ProductForm from "@/components/forms/product-form";
import { Plus, Search, Eye, Edit, Trash2, Package, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Product, ProductFormData } from "@/lib/types";
import Sparkline from "@/components/charts/sparkline";
import { invalidateInventoryRelated } from "@/lib/invalidate";

export default function Products() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewProductId, setViewProductId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | undefined>();
  const [filterSupplier, setFilterSupplier] = useState<string | undefined>();
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { ready } = useRequireAuth();
  const queryClient = useQueryClient();

  const limit = 20;

  // Redirección centralizada en useRequireAuth

  const { data: productsData, isLoading, error: productsError } = useQuery({
    queryKey: ["/api/products", { limit, offset: page * limit, search, categoryId: filterCategory, supplierId: filterSupplier, lowStockOnly: onlyLowStock }],
    retry: false,
  });

  const { data: viewedProduct, isFetching: viewingLoading } = useQuery<any>({
    queryKey: viewProductId ? ["/api/products/" + viewProductId] : ["/api/products/__disabled"],
    enabled: !!viewProductId,
    retry: false,
  });
  const { data: movementSummary } = useQuery<any>({
    queryKey: viewProductId ? ["/api/products/" + viewProductId + "/movement-summary"] : ["/api/products/__disabled_summary"],
    enabled: !!viewProductId,
    retry: false,
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    retry: false,
  });

  const { data: suppliers } = useQuery({
    queryKey: ["/api/suppliers"],
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      await apiRequest("POST", "/api/products", data);
    },
    onMutate: async (data: ProductFormData) => {
      await queryClient.cancelQueries({ queryKey: ["/api/products"] });
      const prev = queryClient.getQueryData<any>(["/api/products", { limit, offset: page * limit, search, categoryId: filterCategory, supplierId: filterSupplier, lowStockOnly: onlyLowStock }]);
      if (prev) {
        const optimistic = { ...prev };
        const fakeId = 'optimistic-' + Date.now();
        optimistic.products = [{ id: fakeId, code: data.code, name: data.name, unit: data.unit, minStock: data.minStock, maxStock: data.maxStock, purchasePrice: data.purchasePrice, salePrice: data.salePrice, description: data.description, totalStock: 0, isLowStock: false }, ...optimistic.products];
        optimistic.total += 1;
        queryClient.setQueryData(["/api/products", { limit, offset: page * limit, search, categoryId: filterCategory, supplierId: filterSupplier, lowStockOnly: onlyLowStock }], optimistic);
        return { prev };
      }
      return { prev: null };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["/api/products", { limit, offset: page * limit, search, categoryId: filterCategory, supplierId: filterSupplier, lowStockOnly: onlyLowStock }], ctx.prev);
      }
      toast({ title: 'Error', description: 'No se pudo crear el producto', variant: 'destructive' });
    },
  onSettled: () => {
      invalidateInventoryRelated(queryClient);
      setIsFormOpen(false);
      toast({
        title: "Producto creado",
        description: "El producto ha sido creado exitosamente.",
      });
  }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProductFormData> }) => {
      await apiRequest("PUT", `/api/products/${id}`, data);
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/products"] });
      const key = ["/api/products", { limit, offset: page * limit, search, categoryId: filterCategory, supplierId: filterSupplier, lowStockOnly: onlyLowStock }];
      const prev = queryClient.getQueryData<any>(key);
      if (prev) {
        const optimistic = { ...prev };
        optimistic.products = optimistic.products.map((p: any) => p.id === id ? { ...p, ...data } : p);
        queryClient.setQueryData(key, optimistic);
        return { prev };
      }
      return { prev: null };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        const key = ["/api/products", { limit, offset: page * limit, search, categoryId: filterCategory, supplierId: filterSupplier, lowStockOnly: onlyLowStock }];
        queryClient.setQueryData(key, ctx.prev);
      }
      toast({ title: 'Error', description: 'No se pudo actualizar el producto', variant: 'destructive' });
    },
  onSettled: () => {
      invalidateInventoryRelated(queryClient);
      setEditingProduct(null);
      setIsFormOpen(false);
      toast({
        title: "Producto actualizado",
        description: "El producto ha sido actualizado exitosamente.",
      });
  }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["/api/products"] });
      const key = ["/api/products", { limit, offset: page * limit, search, categoryId: filterCategory, supplierId: filterSupplier, lowStockOnly: onlyLowStock }];
      const prev = queryClient.getQueryData<any>(key);
      if (prev) {
        const optimistic = { ...prev };
        optimistic.products = optimistic.products.filter((p: any) => p.id !== id);
        optimistic.total = Math.max(0, optimistic.total - 1);
        queryClient.setQueryData(key, optimistic);
        return { prev };
      }
      return { prev: null };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        const key = ["/api/products", { limit, offset: page * limit, search, categoryId: filterCategory, supplierId: filterSupplier, lowStockOnly: onlyLowStock }];
        queryClient.setQueryData(key, ctx.prev);
      }
      toast({ title: 'Error', description: 'No se pudo eliminar el producto', variant: 'destructive' });
    },
  onSettled: () => {
      invalidateInventoryRelated(queryClient);
      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado exitosamente.",
      });
  }
  });

  const handleCreate = (data: ProductFormData) => {
    createMutation.mutate(data);
  };

  const handleUpdate = (data: ProductFormData) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Está seguro que desea eliminar este producto?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const canWrite = (user as any)?.role === 'administrator' || (user as any)?.role === 'operator';

  if (authLoading || !ready) {
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
            Productos
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestiona el catálogo de productos de tu inventario
          </p>
        </div>
        
        {canWrite && (
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={handleNewProduct}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  data-testid="button-new-product"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Producto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                  </DialogTitle>
                </DialogHeader>
                <ProductForm
                  product={editingProduct}
                  categories={(categories as any) || []}
                  suppliers={(suppliers as any) || []}
                  onSubmit={editingProduct ? handleUpdate : handleCreate}
                  isLoading={createMutation.isPending || updateMutation.isPending}
                />
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              className="ml-2"
              onClick={() => {
                const params = new URLSearchParams();
                if (search) params.set('search', search);
                if (filterCategory) params.set('categoryId', filterCategory);
                if (filterSupplier) params.set('supplierId', filterSupplier);
                if (onlyLowStock) params.set('lowStockOnly', 'true');
                const url = '/api/export/products' + (params.toString() ? ('?' + params.toString()) : '');
                window.open(url, '_blank', 'noopener');
              }}
              data-testid="button-export-products"
            >Exportar CSV</Button>
          </div>
        )}
      </div>

      {/* Search and filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 relative min-w-[220px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar productos por nombre o código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-products"
                aria-label="Buscar productos"
              />
            </div>
            <div className="w-48">
              <Select
                onValueChange={(v) => {
                  setFilterCategory(v === 'all' ? undefined : v);
                  setPage(0);
                }}
                value={filterCategory ?? 'all'}
              >
                <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {(categories as any)?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select
                onValueChange={(v) => {
                  setFilterSupplier(v === 'all' ? undefined : v);
                  setPage(0);
                }}
                value={filterSupplier ?? 'all'}
              >
                <SelectTrigger><SelectValue placeholder="Proveedor" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(suppliers as any)?.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center space-x-2 text-sm">
              <Checkbox checked={onlyLowStock} onCheckedChange={(v) => { setOnlyLowStock(Boolean(v)); setPage(0); }} />
              <span>Bajo stock</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Products grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="w-8 h-8" />
                    <Skeleton className="w-8 h-8" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : productsError ? (
        <div className="p-6 text-center text-sm text-red-600">Error cargando productos</div>
      ) : (productsData as any)?.products?.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {(productsData as any).products.map((product: Product) => (
              <Card key={product.id} className={`hover:shadow-lg transition-shadow ${(product as any).isLowStock ? 'border-red-400 ring-1 ring-red-300 dark:border-red-500' : ''}` }>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white" data-testid={`text-product-name-${product.id}`}>
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400" data-testid={`text-product-code-${product.id}`}>
                          {product.code}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`button-view-product-${product.id}`}
                        onClick={() => setViewProductId(product.id)}
                        aria-label="Ver detalle producto"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canWrite && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                            data-testid={`button-edit-product-${product.id}`}
                            aria-label="Editar producto"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {(user as any)?.role === 'administrator' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(product.id)}
                              className="text-red-600 hover:text-red-900"
                              data-testid={`button-delete-product-${product.id}`}
                              aria-label="Eliminar producto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {/* Sparkline placeholder retirado hasta tener datos históricos */}
                    {product.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Unidad:</span>
                      <Badge variant="outline">{product.unit}</Badge>
                    </div>
                    
                    {product.purchasePrice && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Precio compra:</span>
                        <span className="text-sm font-medium">${parseFloat(product.purchasePrice).toFixed(2)}</span>
                      </div>
                    )}
                    
                    {product.salePrice && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Precio venta:</span>
                        <span className="text-sm font-medium">${parseFloat(product.salePrice).toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Stock mínimo:</span>
                      <span className="text-sm font-medium">{product.minStock || 0}</span>
                    </div>
                    { (product as any).totalStock !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Stock total:</span>
                        <span className={`text-sm font-medium ${(product as any).isLowStock ? 'text-red-600 font-semibold' : ''}`}>{(product as any).totalStock}</span>
                      </div>
                    ) }
                    { (product as any).isLowStock && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-red-600">Bajo stock</span>
                        <span className="text-xs text-red-500">Reponer</span>
                      </div>
                    ) }
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {page * limit + 1} a {Math.min((page + 1) * limit, (productsData as any).total)} de {(productsData as any).total} productos
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                data-testid="button-previous-page"
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={(page + 1) * limit >= (productsData as any).total}
                data-testid="button-next-page"
              >
                Siguiente
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No hay productos
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {search ? "No se encontraron productos con ese criterio de búsqueda." : "Comienza agregando tu primer producto al inventario."}
          </p>
          {canWrite && !search && (
            <Button onClick={handleNewProduct} data-testid="button-add-first-product">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Primer Producto
            </Button>
          )}
        </div>
      )}
      {/* Product Detail Dialog */}
      <Dialog open={!!viewProductId} onOpenChange={(open) => { if (!open) setViewProductId(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <DialogTitle>Detalle Producto</DialogTitle>
              {viewingLoading && <p className="text-xs text-gray-500">Cargando...</p>}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setViewProductId(null)} aria-label="Cerrar detalle producto">
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <Separator className="my-2" />
          {(viewedProduct as any) && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Información Básica</h3>
                    <dl className="text-sm space-y-1">
                      <div className="flex justify-between"><dt className="text-gray-500">Nombre</dt><dd className="font-medium">{(viewedProduct as any).name}</dd></div>
                      <div className="flex justify-between"><dt className="text-gray-500">Código</dt><dd>{(viewedProduct as any).code}</dd></div>
                      {(viewedProduct as any).brand && <div className="flex justify-between"><dt className="text-gray-500">Marca</dt><dd>{(viewedProduct as any).brand}</dd></div>}
                      <div className="flex justify-between"><dt className="text-gray-500">Unidad</dt><dd>{(viewedProduct as any).unit}</dd></div>
                      <div className="flex justify-between"><dt className="text-gray-500">Stock mín.</dt><dd>{(viewedProduct as any).minStock || 0}</dd></div>
                      {(viewedProduct as any).maxStock && <div className="flex justify-between"><dt className="text-gray-500">Stock máx.</dt><dd>{(viewedProduct as any).maxStock}</dd></div>}
                      {(viewedProduct as any).purchasePrice && <div className="flex justify-between"><dt className="text-gray-500">Precio compra</dt><dd>${parseFloat((viewedProduct as any).purchasePrice).toFixed(2)}</dd></div>}
                      {(viewedProduct as any).salePrice && <div className="flex justify-between"><dt className="text-gray-500">Precio venta</dt><dd>${parseFloat((viewedProduct as any).salePrice).toFixed(2)}</dd></div>}
                    </dl>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Categorías / Proveedor</h3>
                    <dl className="text-sm space-y-1">
                      {(viewedProduct as any).category && <div className="flex justify-between"><dt className="text-gray-500">Categoría</dt><dd>{(viewedProduct as any).category.name}</dd></div>}
                      {(viewedProduct as any).supplier && <div className="flex justify-between"><dt className="text-gray-500">Proveedor</dt><dd>{(viewedProduct as any).supplier.name}</dd></div>}
                      {(viewedProduct as any).barcode && <div className="flex justify-between"><dt className="text-gray-500">Código de barras</dt><dd>{(viewedProduct as any).barcode}</dd></div>}
                      {(viewedProduct as any).attachmentUrl && <div className="flex justify-between"><dt className="text-gray-500">Adjunto</dt><dd><a href={(viewedProduct as any).attachmentUrl} className="text-primary underline" target="_blank" rel="noopener noreferrer">Ver archivo</a></dd></div>}
                    </dl>
                  </div>
                </div>

                {(viewedProduct as any).description && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Descripción</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{(viewedProduct as any).description}</p>
                  </div>
                )}

                {(viewedProduct as any).metadata && Object.keys((viewedProduct as any).metadata).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Metadatos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {Object.entries((viewedProduct as any).metadata).map(([k,v]) => (
                        <div key={k} className="flex justify-between bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                          <span className="text-gray-500">{k}</span>
                          <span className="font-medium truncate max-w-[160px]" title={String(v)}>{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold mb-2">Inventario por Bodega</h3>
                  {Array.isArray((viewedProduct as any).inventory) && (viewedProduct as any).inventory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border" data-testid="table-product-inventory">
                        <thead className="bg-gray-100 dark:bg-gray-800">
                          <tr>
                            <th className="text-left px-2 py-1 font-medium">Bodega</th>
                            <th className="text-right px-2 py-1 font-medium">Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(viewedProduct as any).inventory.map((row: any) => (
                            <tr key={row.warehouse?.id} className="border-t">
                              <td className="px-2 py-1">{row.warehouse?.name || '-'}</td>
                              <td className="px-2 py-1 text-right">{row.currentStock}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t font-semibold">
                            <td className="px-2 py-1 text-right">Total</td>
                            <td className="px-2 py-1 text-right">{(viewedProduct as any).inventory.reduce((acc: number, r: any) => acc + (r.currentStock || 0), 0)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Sin inventario registrado.</p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">Movimientos últimos 7 días</h3>
                  {Array.isArray(movementSummary) && movementSummary.length > 0 ? (
                    <div className="overflow-x-auto">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[11px] text-gray-500">Tendencia (entradas - salidas + transfer)</div>
                        <Sparkline
                          data={movementSummary.map((r: any) => (r.entries - r.exits + r.transfers))}
                          width={140}
                          height={28}
                          stroke={(movementSummary as any).some((r: any) => r.exits > r.entries) ? '#dc2626' : '#16a34a'}
                        />
                      </div>
                      <table className="w-full text-xs border">
                        <thead className="bg-gray-100 dark:bg-gray-800">
                          <tr>
                            <th className="px-2 py-1 text-left">Día</th>
                            <th className="px-2 py-1 text-right">Entradas</th>
                            <th className="px-2 py-1 text-right">Salidas</th>
                            <th className="px-2 py-1 text-right">Transfer.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {movementSummary.map((row: any) => (
                            <tr key={row.day} className="border-t">
                              <td className="px-2 py-1">{new Date(row.day).toLocaleDateString()}</td>
                              <td className="px-2 py-1 text-right text-emerald-600 font-medium">{row.entries}</td>
                              <td className="px-2 py-1 text-right text-rose-600 font-medium">{row.exits}</td>
                              <td className="px-2 py-1 text-right text-indigo-600 font-medium">{row.transfers}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Sin movimientos recientes.</p>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
