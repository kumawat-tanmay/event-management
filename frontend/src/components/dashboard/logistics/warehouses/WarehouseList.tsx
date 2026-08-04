import React from 'react';
import { Warehouse } from '@/lib/services/warehouse.services';
import { Building2, MapPin, Calendar } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTranslation } from 'react-i18next';

interface WarehouseListProps {
  warehouses: Warehouse[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function WarehouseList({ warehouses, selectedId, onSelect }: WarehouseListProps) {
  const { t, i18n } = useTranslation();

  if (warehouses.length === 0) {
    return <div className="text-sm text-muted-foreground p-4 text-center">{t('warehouse.noGodowns', 'No warehouses found.')}</div>;
  }

  const dateLocale = i18n.language === 'hi' ? 'hi-IN' : 'en-IN';

  return (
    <div className="flex flex-col gap-2">
      {warehouses.map((warehouse) => (
        <button
          key={warehouse._id}
          onClick={() => onSelect(warehouse._id)}
          className={cn(
            "text-left px-4 py-3 rounded-xl transition-all flex flex-col gap-1.5 border",
            selectedId === warehouse._id 
              ? "bg-primary/10 border-primary/20" 
              : "bg-transparent border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
          )}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Building2 className={cn("w-4 h-4 shrink-0", selectedId === warehouse._id ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("font-semibold text-sm truncate", selectedId === warehouse._id ? "text-primary" : "text-foreground")}>
                {warehouse.name}
              </span>
            </div>
            {!warehouse.isActive && (
              <span className="text-[10px] uppercase font-bold bg-error/10 text-error px-1.5 py-0.5 rounded shrink-0">{t('warehouse.inactive', 'Disabled')}</span>
            )}
          </div>

          <div className="flex flex-col gap-1 pl-6">
            {warehouse.address && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{warehouse.address}</span>
              </div>
            )}

            {warehouse.createdAt && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/75 font-medium">
                <Calendar className="w-3 h-3 shrink-0" />
                <span>{t('warehouse.created', 'Created')} {new Date(warehouse.createdAt).toLocaleDateString(dateLocale, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

