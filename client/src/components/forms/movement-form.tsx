import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { MovementFormData, Product, Warehouse } from "@/lib/types";

const movementSchema = z.object({
  productId: z.string().min(1, "El producto es requerido"),
  type: z.enum(['entry', 'exit', 'transfer', 'adjustment'], {
    required_error: "El tipo de movimiento es requerido",
  }),
  quantity: z.number().min(1, "La cantidad debe ser mayor a 0"),
  sourceWarehouseId: z.string().optional(),
  destinationWarehouseId: z.string().optional(),
  unitPrice: z.number().min(0, "El precio debe ser mayor o igual a 0").optional(),
  reason: z.string().optional(),
}).refine((data) => {
  if (data.type === 'entry' && !data.destinationWarehouseId) {
    return false;
  }
  if (data.type === 'exit' && !data.sourceWarehouseId) {
    return false;
  }
  if (data.type === 'transfer' && (!data.sourceWarehouseId || !data.destinationWarehouseId)) {
    return false;
  }
  return true;
}, {
  message: "Debe seleccionar las bodegas apropiadas según el tipo de movimiento",
  path: ["sourceWarehouseId"],
});

interface MovementFormProps {
  products: Product[];
  warehouses: Warehouse[];
  onSubmit: (data: MovementFormData) => void;
  isLoading: boolean;
}

export default function MovementForm({ products, warehouses, onSubmit, isLoading }: MovementFormProps) {
  const form = useForm<MovementFormData>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      productId: "",
      type: "entry",
      quantity: 1,
      sourceWarehouseId: "",
      destinationWarehouseId: "",
      unitPrice: undefined,
      reason: "",
    },
  });

  const watchType = form.watch("type");

  const handleSubmit = (data: MovementFormData) => {
    onSubmit(data);
  };

  const getMovementTypeLabel = (type: string) => {
    const labels = {
      entry: "Entrada",
      exit: "Salida", 
      transfer: "Transferencia",
      adjustment: "Ajuste"
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="productId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Producto *</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger data-testid="select-movement-product">
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Movimiento *</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger data-testid="select-movement-type">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entrada</SelectItem>
                    <SelectItem value="exit">Salida</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                    <SelectItem value="adjustment">Ajuste</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cantidad *</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="1"
                  placeholder="Cantidad" 
                  {...field}
                  onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : 1)}
                  data-testid="input-movement-quantity"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {(watchType === 'exit' || watchType === 'transfer') && (
          <FormField
            control={form.control}
            name="sourceWarehouseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bodega Origen *</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger data-testid="select-movement-source-warehouse">
                      <SelectValue placeholder="Seleccionar bodega origen" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {(watchType === 'entry' || watchType === 'transfer') && (
          <FormField
            control={form.control}
            name="destinationWarehouseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bodega Destino *</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger data-testid="select-movement-destination-warehouse">
                      <SelectValue placeholder="Seleccionar bodega destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="unitPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Precio Unitario</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  {...field}
                  onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  data-testid="input-movement-unit-price"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivo/Observaciones</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Motivo del movimiento u observaciones" 
                  {...field} 
                  data-testid="textarea-movement-reason"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={isLoading} data-testid="button-submit-movement">
            {isLoading ? "Registrando..." : "Registrar"} Movimiento
          </Button>
        </div>
      </form>
    </Form>
  );
}
