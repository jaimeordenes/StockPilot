import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import TabbedForm from '@/components/forms/tabbed-form';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { Product, ProductFormData, Category, Supplier } from '@/lib/types';

const productSchema = z.object({
  code: z.string().min(1, "Requerido"),
  name: z.string().min(1, "Requerido"),
  unit: z.string().min(1, "Requerido"),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  brand: z.string().optional(),
  purchasePrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional(),
  minStock: z.number().min(0).optional(),
  maxStock: z.number().min(0).optional(),
  supplierId: z.string().optional(),
  barcode: z.string().optional(),
  ean13: z.string().optional(),
  family: z.string().optional(),
  subfamily: z.string().optional(),
  group: z.string().optional(),
  presentation: z.string().optional(),
  entryDate: z.string().optional(),
  expiryDate: z.string().optional(),
  batch: z.string().optional(),
  serialNumber: z.string().optional(),
  condition: z.string().optional(),
  location: z.string().optional(),
  supplierTaxId: z.string().optional(),
  supplierContact: z.string().optional(),
  supplierAddress: z.string().optional(),
  supplierRepresentative: z.string().optional(),
  documentType: z.string().optional(),
  documentNumber: z.string().optional(),
  documentDate: z.string().optional(),
  documentTotal: z.number().optional(),
  enteredBy: z.string().optional(),
  notes: z.string().optional(),
});

interface ProductFormProps {
  product?: Product | null;
  categories: Category[];
  suppliers: Supplier[];
  onSubmit: (data: ProductFormData) => void;
  isLoading: boolean;
}

export default function ProductForm({ product, categories, suppliers, onSubmit, isLoading }: ProductFormProps) {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      code: product?.code || "",
      name: product?.name || "",
      unit: product?.unit || "unit",
      description: product?.description || "",
      categoryId: product?.categoryId || "",
      brand: product?.brand || "",
      purchasePrice: product?.purchasePrice ? parseFloat(product.purchasePrice) : undefined,
      salePrice: product?.salePrice ? parseFloat(product.salePrice) : undefined,
      minStock: product?.minStock || 0,
      maxStock: product?.maxStock || undefined,
      supplierId: product?.supplierId || "__none__",
      barcode: product?.barcode || "",
      ean13: (product as any)?.ean13 || "",
      family: (product as any)?.family || "",
      subfamily: (product as any)?.subfamily || "",
      group: (product as any)?.group || "",
      presentation: (product as any)?.presentation || "",
      entryDate: undefined,
      expiryDate: (product as any)?.expiryDate || undefined,
      batch: (product as any)?.batch || "",
      serialNumber: (product as any)?.serialNumber || "",
      condition: (product as any)?.condition || "",
      location: (product as any)?.location || "",
      supplierTaxId: (product as any)?.supplierTaxId || "",
      supplierContact: (product as any)?.supplierContact || "",
      supplierAddress: (product as any)?.supplierAddress || "",
      supplierRepresentative: (product as any)?.supplierRepresentative || "",
      documentType: (product as any)?.documentType || undefined,
      documentNumber: (product as any)?.documentNumber || undefined,
      documentDate: (product as any)?.documentDate || undefined,
      documentTotal: (product as any)?.documentTotal || undefined,
      enteredBy: (product as any)?.enteredBy || undefined,
      notes: (product as any)?.notes || undefined,
    }
  });

  const [attachment, setAttachment] = React.useState<File | undefined>();
  const draftKey = React.useMemo(()=> product ? `product-form-draft-${product.id}` : 'product-form-draft-new', [product]);

  // Restaurar borrador
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        form.reset({ ...form.getValues(), ...parsed });
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  // Autosave (debounce simple)
  React.useEffect(() => {
    const sub = form.watch((values) => {
      const handle = setTimeout(() => {
        try { localStorage.setItem(draftKey, JSON.stringify(values)); } catch {}
      }, 400);
      return () => clearTimeout(handle);
    });
    return () => sub.unsubscribe();
  }, [form, draftKey]);

  const handleSubmit = (data: ProductFormData) => {
    (async () => {
      if (attachment) {
        try {
          const fd = new FormData();
          fd.append('file', attachment);
          const r = await fetch('/api/uploads', { method: 'POST', body: fd });
          if (r.ok) {
            const j = await r.json();
            (data as any).attachmentUrl = j.url;
          }
        } catch (e) { console.error(e); }
      }
      const payload: any = { ...data };
      if (payload.categoryId === '__none__') payload.categoryId = '';
      if (payload.supplierId === '__none__') payload.supplierId = '';
      onSubmit(payload);
    })();
  };

  // Limpiar borrador al submit exitoso
  React.useEffect(() => {
    if (form.formState.isSubmitSuccessful) {
      try { localStorage.removeItem(draftKey); } catch {}
    }
  }, [form.formState.isSubmitSuccessful, draftKey]);

  // Configuración de pestañas usando componente reutilizable
  // Calcular errores por campo -> agrupar por pestaña
  const fieldErrors = form.formState.errors;
  const errorFieldsByTab: Record<string,string[]> = {
    basico: ['code','unit','name','description','brand','barcode'].filter(f=> fieldErrors[f as keyof typeof fieldErrors]),
    clasificacion: ['family','subfamily','group','presentation','categoryId'].filter(f=> fieldErrors[f as keyof typeof fieldErrors]),
    control: ['entryDate','expiryDate','batch','serialNumber','condition','location'].filter(f=> fieldErrors[f as keyof typeof fieldErrors]),
    proveedor: ['supplierId','supplierTaxId','supplierContact','supplierRepresentative','supplierAddress'].filter(f=> fieldErrors[f as keyof typeof fieldErrors]),
    documento: ['documentType','documentNumber','documentDate','documentTotal'].filter(f=> fieldErrors[f as keyof typeof fieldErrors]),
    precios: ['purchasePrice','salePrice','minStock','maxStock'].filter(f=> fieldErrors[f as keyof typeof fieldErrors]),
    otros: ['enteredBy','notes'].filter(f=> fieldErrors[f as keyof typeof fieldErrors])
  };
  const count = (...fields: string[]) => fields.reduce((acc, f) => acc + (fieldErrors[f as keyof typeof fieldErrors] ? 1 : 0), 0);

  const badge = (tabId: string, n: number) => n>0 ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-[10px] leading-none px-1.5 py-0.5 rounded-md bg-destructive text-destructive-foreground font-medium ml-1 cursor-help" aria-label={`${n} errores`}>
          {n}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs font-medium mb-1">Campos con error:</p>
        <ul className="text-xs list-disc pl-4 space-y-0.5 max-w-[180px]">
          {errorFieldsByTab[tabId].map(f=> <li key={f}>{f}</li>)}
        </ul>
      </TooltipContent>
    </Tooltip>
  ) : null;

  const tabs = [
    {
      id: 'basico',
  label: <>Básico {badge('basico', count('code','unit','name'))}</>,
      content: (
        <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="code" render={({ field }) => (<FormItem><FormLabel>Código *</FormLabel><FormControl><Input {...field} placeholder="Ej: PROD-001" /></FormControl><FormMessage/></FormItem>)} />
                <FormField control={form.control} name="unit" render={({ field }) => (<FormItem><FormLabel>Unidad *</FormLabel><FormControl><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Unidad" /></SelectTrigger><SelectContent><SelectItem value="unit">Unidad</SelectItem><SelectItem value="kg">Kilogramo</SelectItem><SelectItem value="g">Gramo</SelectItem><SelectItem value="lb">Libra</SelectItem><SelectItem value="l">Litro</SelectItem><SelectItem value="ml">Mililitro</SelectItem><SelectItem value="m">Metro</SelectItem><SelectItem value="cm">Centímetro</SelectItem><SelectItem value="m2">Metro cuadrado</SelectItem><SelectItem value="pack">Paquete</SelectItem><SelectItem value="box">Caja</SelectItem></SelectContent></Select></FormControl><FormMessage/></FormItem>)} />
              </div>
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre *</FormLabel><FormControl><Input {...field} placeholder="Nombre del producto" /></FormControl><FormMessage/></FormItem>)} />
              <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea {...field} placeholder="Descripción" /></FormControl><FormMessage/></FormItem>)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="brand" render={({ field }) => (<FormItem><FormLabel>Marca</FormLabel><FormControl><Input {...field} placeholder="Marca" /></FormControl><FormMessage/></FormItem>)} />
                <FormField control={form.control} name="barcode" render={({ field }) => (<FormItem><FormLabel>Código Barras</FormLabel><FormControl><Input {...field} placeholder="EAN / UPC" /></FormControl><FormMessage/></FormItem>)} />
              </div>
            </div>
      ),
    },
    {
      id: 'clasificacion',
  label: <>Clasificación {badge('clasificacion', count('family','subfamily','group','presentation','categoryId'))}</>,
      content: (
        <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="family" render={({ field }) => (<FormItem><FormLabel>Familia</FormLabel><FormControl><Input {...field} placeholder="Familia" /></FormControl><FormMessage/></FormItem>)} />
                <FormField control={form.control} name="subfamily" render={({ field }) => (<FormItem><FormLabel>Subfamilia</FormLabel><FormControl><Input {...field} placeholder="Subfamilia" /></FormControl><FormMessage/></FormItem>)} />
                <FormField control={form.control} name="group" render={({ field }) => (<FormItem><FormLabel>Grupo</FormLabel><FormControl><Input {...field} placeholder="Grupo" /></FormControl><FormMessage/></FormItem>)} />
              </div>
              <FormField control={form.control} name="presentation" render={({ field }) => (<FormItem><FormLabel>Presentación</FormLabel><FormControl><Input {...field} placeholder="Ej: 1kg / Caja 6" /></FormControl><FormMessage/></FormItem>)} />
              <FormField control={form.control} name="categoryId" render={({ field }) => (<FormItem><FormLabel>Categoría</FormLabel><FormControl><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger><SelectContent><SelectItem value="__none__">Sin categoría</SelectItem>{categories.map(c=> <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></FormControl><FormMessage/></FormItem>)} />
            </div>
      ),
    },
    {
      id: 'control',
  label: <>Control {badge('control', count('entryDate','expiryDate','batch','serialNumber','condition','location'))}</>,
      content: (
        <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="entryDate" render={({ field }) => (<FormItem><FormLabel>Ingreso</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage/></FormItem>)} />
                <FormField control={form.control} name="expiryDate" render={({ field }) => (<FormItem><FormLabel>Vencimiento</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage/></FormItem>)} />
                <FormField control={form.control} name="batch" render={({ field }) => (<FormItem><FormLabel>Lote</FormLabel><FormControl><Input {...field} placeholder="Lote" /></FormControl><FormMessage/></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="serialNumber" render={({ field }) => (<FormItem><FormLabel>Serie</FormLabel><FormControl><Input {...field} placeholder="Serie" /></FormControl><FormMessage/></FormItem>)} />
                <FormField control={form.control} name="condition" render={({ field }) => (<FormItem><FormLabel>Estado</FormLabel><FormControl><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger><SelectContent><SelectItem value="Nuevo">Nuevo</SelectItem><SelectItem value="Reposición">Reposición</SelectItem><SelectItem value="Devolución">Devolución</SelectItem><SelectItem value="Oferta">Oferta</SelectItem></SelectContent></Select></FormControl><FormMessage/></FormItem>)} />
                <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Ubicación</FormLabel><FormControl><Input {...field} placeholder="Pasillo / Estante" /></FormControl><FormMessage/></FormItem>)} />
              </div>
            </div>
      ),
    },
    {
      id: 'proveedor',
  label: <>Proveedor {badge('proveedor', count('supplierId','supplierTaxId','supplierContact','supplierRepresentative','supplierAddress'))}</>,
      content: (
        <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="supplierId" render={({ field }) => (<FormItem><FormLabel>Proveedor</FormLabel><FormControl><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Proveedor" /></SelectTrigger><SelectContent><SelectItem value="__none__">Sin proveedor</SelectItem>{suppliers.map(s=> <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></FormControl><FormMessage/></FormItem>)} />
                <FormField control={form.control} name="supplierTaxId" render={({ field }) => (<FormItem><FormLabel>ID Fiscal</FormLabel><FormControl><Input {...field} placeholder="RUT / NIT" /></FormControl><FormMessage/></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="supplierContact" render={({ field }) => (<FormItem><FormLabel>Contacto</FormLabel><FormControl><Input {...field} placeholder="Teléfono / Email" /></FormControl><FormMessage/></FormItem>)} />
                <FormField control={form.control} name="supplierRepresentative" render={({ field }) => (<FormItem><FormLabel>Representante</FormLabel><FormControl><Input {...field} placeholder="Vendedor" /></FormControl><FormMessage/></FormItem>)} />
              </div>
              <FormField control={form.control} name="supplierAddress" render={({ field }) => (<FormItem><FormLabel>Dirección</FormLabel><FormControl><Input {...field} placeholder="Dirección" /></FormControl><FormMessage/></FormItem>)} />
            </div>
      ),
    },
    {
      id: 'documento',
  label: <>Documento {badge('documento', count('documentType','documentNumber','documentDate','documentTotal'))}</>,
      content: (
        <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="documentType" render={({ field }) => (<FormItem><FormLabel>Tipo</FormLabel><FormControl><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger><SelectContent><SelectItem value="Factura">Factura</SelectItem><SelectItem value="Guía de despacho">Guía de despacho</SelectItem><SelectItem value="Boleta">Boleta</SelectItem><SelectItem value="Nota de crédito">Nota de crédito</SelectItem></SelectContent></Select></FormControl><FormMessage/></FormItem>)} />
                <FormField control={form.control} name="documentNumber" render={({ field }) => (<FormItem><FormLabel>Número</FormLabel><FormControl><Input {...field} placeholder="Número" /></FormControl><FormMessage/></FormItem>)} />
                <FormField control={form.control} name="documentDate" render={({ field }) => (<FormItem><FormLabel>Fecha</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage/></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="documentTotal" render={({ field }) => (<FormItem><FormLabel>Total</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e=> field.onChange(e.target.value? parseFloat(e.target.value): undefined)} /></FormControl><FormMessage/></FormItem>)} />
                <FormItem><FormLabel>Adjunto</FormLabel><FormControl><input type="file" accept="application/pdf,image/*" onChange={e=> setAttachment(e.target.files?.[0])} /></FormControl></FormItem>
              </div>
            </div>
      ),
    },
    {
      id: 'precios',
  label: <>Precios & Stock {badge('precios', count('purchasePrice','salePrice','minStock','maxStock'))}</>,
      content: (
        <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="purchasePrice" render={({ field }) => (<FormItem><FormLabel>Compra</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e=> field.onChange(e.target.value? parseFloat(e.target.value): undefined)} /></FormControl><FormMessage/></FormItem>)} />
                <FormField control={form.control} name="salePrice" render={({ field }) => (<FormItem><FormLabel>Venta</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e=> field.onChange(e.target.value? parseFloat(e.target.value): undefined)} /></FormControl><FormMessage/></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="minStock" render={({ field }) => (<FormItem><FormLabel>Stock Min</FormLabel><FormControl><Input type="number" {...field} onChange={e=> field.onChange(e.target.value? parseInt(e.target.value): 0)} /></FormControl><FormMessage/></FormItem>)} />
                <FormField control={form.control} name="maxStock" render={({ field }) => (<FormItem><FormLabel>Stock Max</FormLabel><FormControl><Input type="number" {...field} onChange={e=> field.onChange(e.target.value? parseInt(e.target.value): undefined)} /></FormControl><FormMessage/></FormItem>)} />
              </div>
            </div>
      ),
    },
    {
      id: 'otros',
  label: <>Otros {badge('otros', count('enteredBy','notes'))}</>,
      content: (
        <div className="space-y-4">
              <FormField control={form.control} name="enteredBy" render={({ field }) => (<FormItem><FormLabel>Ingresado por</FormLabel><FormControl><Input {...field} placeholder="Usuario" /></FormControl><FormMessage/></FormItem>)} />
              <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Notas</FormLabel><FormControl><Textarea {...field} placeholder="Observaciones" /></FormControl><FormMessage/></FormItem>)} />
            </div>
      ),
    },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit, () => {
        // Scroll a primer error
        const firstErrorKey = Object.keys(fieldErrors)[0];
        if (firstErrorKey) {
          const el = document.querySelector(`[name="${firstErrorKey}"]`);
          if (el && 'scrollIntoView' in el) {
            (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      })} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <TabbedForm tabs={tabs} storageKey="product-form-tab" />
        <div className="mt-4 pt-3 border-t flex justify-end bg-background sticky bottom-0">
          <div className="flex items-center gap-4 w-full justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-3">
              <span>Borrador auto • {Object.keys(fieldErrors).length} errores</span>
              <button
                type="button"
                onClick={() => { try { localStorage.removeItem(draftKey); } catch {}; }}
                className="underline text-muted-foreground hover:text-foreground"
              >Limpiar borrador</button>
            </span>
            <Button type="submit" disabled={isLoading}>{isLoading? 'Guardando...' : product ? 'Actualizar' : 'Crear'} Producto</Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
