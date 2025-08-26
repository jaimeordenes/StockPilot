import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Warehouse, WarehouseFormData, User } from "@/lib/types";

const warehouseSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  location: z.string().optional(),
  capacity: z.number().min(1, "La capacidad debe ser mayor a 0").optional(),
  managerId: z.string().optional(),
});

interface WarehouseFormProps {
  warehouse?: Warehouse | null;
  users: User[];
  onSubmit: (data: WarehouseFormData) => void;
  isLoading: boolean;
}

export default function WarehouseForm({ warehouse, users, onSubmit, isLoading }: WarehouseFormProps) {
  const form = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: warehouse?.name || "",
      location: warehouse?.location || "",
      capacity: warehouse?.capacity || undefined,
      managerId: warehouse?.managerId || "__none__",
    },
  });

  const handleSubmit = (data: WarehouseFormData) => {
    const payload: any = { ...data };
    if (payload.managerId === '__none__') payload.managerId = '';
    onSubmit(payload as WarehouseFormData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre *</FormLabel>
              <FormControl>
                <Input placeholder="Nombre de la bodega" {...field} data-testid="input-warehouse-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ubicación</FormLabel>
              <FormControl>
                <Input placeholder="Dirección o ubicación" {...field} data-testid="input-warehouse-location" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacidad (unidades)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Capacidad máxima" 
                  {...field}
                  onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  data-testid="input-warehouse-capacity"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="managerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Responsable</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger data-testid="select-warehouse-manager">
                    <SelectValue placeholder="Seleccionar responsable" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin responsable</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={isLoading} data-testid="button-submit-warehouse">
            {isLoading ? "Guardando..." : warehouse ? "Actualizar" : "Crear"} Bodega
          </Button>
        </div>
      </form>
    </Form>
  );
}
