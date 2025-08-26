import * as React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export interface TabConfig {
  id: string;
  label: React.ReactNode; // permite badges dinámicos
  content: React.ReactNode;
  disabled?: boolean; // pestaña deshabilitada
}

interface TabbedFormProps {
  tabs: TabConfig[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  onInvalidTabFallback?: (from: string | undefined, to: string) => void; // callback cuando se autocorrige
  storageKey?: string; // si se provee, se persiste la pestaña activa
  orientation?: 'horizontal' | 'vertical';
  animated?: boolean; // transición de opacidad entre contenidos
  // clases opcionales para personalización
  className?: string;
  listClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

// Estilos base de trigger
const baseTrigger = 'px-3 py-1.5 text-xs md:text-sm rounded-md border transition-colors select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary hover:bg-accent/60';

export const TabbedForm: React.FC<TabbedFormProps> = ({
  tabs,
  defaultTab,
  onTabChange,
  onInvalidTabFallback,
  storageKey,
  orientation = 'horizontal',
  animated = false,
  className,
  listClassName,
  triggerClassName,
  contentClassName,
}) => {
  const first = tabs[0]?.id;
  const persisted = React.useMemo(() => {
    if (!storageKey) return undefined;
    try { return localStorage.getItem(storageKey) || undefined; } catch { return undefined; }
  }, [storageKey]);
  const initial = persisted || defaultTab || first;
  const [value, setValue] = React.useState(initial);

  const handleValueChange = (v: string) => {
    setValue(v);
    if (storageKey) {
      try { localStorage.setItem(storageKey, v); } catch {}
    }
    onTabChange?.(v);
  };

  // Si la pestaña actual ya no existe (tabs dinámicas), autocorrige.
  React.useEffect(() => {
    if (!tabs.find(t => t.id === value)) {
      const fallback = tabs[0]?.id;
      if (fallback) {
        onInvalidTabFallback?.(value, fallback);
        setValue(fallback);
      }
    }
  }, [tabs, value, onInvalidTabFallback]);

  // Memorizar listado de triggers para evitar renders innecesarios.
  const triggers = React.useMemo(() => {
    return tabs.map(t => {
      const isActive = t.id === value;
      const fallbackActive = isActive ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-muted/30 hover:bg-muted/60';
      return (
        <Tabs.Trigger
          key={t.id}
          value={t.id}
          className={cn(baseTrigger, fallbackActive, triggerClassName, t.disabled && 'opacity-50 cursor-not-allowed')}
          data-active={isActive ? 'true' : 'false'}
          disabled={t.disabled}
        >
          <span className="inline-flex items-center gap-1">{t.label}</span>
        </Tabs.Trigger>
      );
    });
  }, [tabs, value, triggerClassName]);

  const contentBase = cn('outline-none', animated && 'transition-opacity data-[state=inactive]:opacity-0 data-[state=active]:opacity-100');

  return (
    <Tabs.Root value={value} onValueChange={handleValueChange} orientation={orientation} className={cn('flex h-full', orientation === 'vertical' ? 'flex-row' : 'flex-col', className)}>
      <Tabs.List
        className={cn(
          'gap-2 border-b pb-2 mb-2 sticky top-0 bg-background z-10',
          orientation === 'vertical' ? 'flex flex-col min-w-40 border-b-0 border-r pr-2 mr-4' : 'flex flex-wrap',
          listClassName,
        )}
      >
        {triggers}
      </Tabs.List>
      <div className={cn('flex-1 overflow-y-auto pr-1 space-y-6', contentClassName)}>
        {tabs.map(t => (
          <Tabs.Content key={t.id} value={t.id} className={contentBase}>
            {t.content}
          </Tabs.Content>
        ))}
      </div>
    </Tabs.Root>
  );
};

export default TabbedForm;
