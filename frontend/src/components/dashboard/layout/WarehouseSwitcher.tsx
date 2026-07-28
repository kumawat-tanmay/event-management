'use client';

import React, { useState } from 'react';
import { cn } from '@/utils/cn';
import { Store, ChevronDown, CheckCircle2, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface WarehouseData {
  id: string;
  name: string;
  tKey?: string;
  status: 'Online' | 'Low Stock' | 'Offline';
}

const STATIC_WAREHOUSES: WarehouseData[] = [
  { id: 'all', name: 'All Warehouses', tKey: 'warehouse.allWarehouses', status: 'Online' },
  { id: '1', name: 'Main Warehouse', tKey: 'sidebar.warehouses', status: 'Online' },
  { id: '2', name: 'Jaipur Warehouse', status: 'Online' },
  { id: '3', name: 'Ajmer Warehouse', status: 'Low Stock' },
  { id: '4', name: 'Jodhpur Warehouse', status: 'Online' },
];

export function WarehouseSwitcher() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeWarehouse, setActiveWarehouse] = useState<WarehouseData>(STATIC_WAREHOUSES[0]);

  const handleSwitch = (warehouse: WarehouseData) => {
    setActiveWarehouse(warehouse);
    setIsOpen(false);
  };

  const getStatusText = (status: string) => {
    if (status === 'Online') return t('warehouse.active', 'Online');
    if (status === 'Low Stock') return t('warehouse.lowStock', 'Low Stock');
    return t('warehouse.inactive', 'Offline');
  };

  return (
    <div className="relative mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-3 py-2.5 bg-muted/20 border border-border/50 rounded-xl hover:bg-muted/40 transition-all cursor-pointer",
          isOpen ? "ring-2 ring-primary/30 border-primary/40" : ""
        )}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <Store size={16} />
          </div>
          <div className="flex flex-col items-start overflow-hidden text-left">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">
              {t('warehouse.status', 'Warehouse Status')}
            </span>
            <span className="text-sm font-bold truncate text-foreground leading-tight mt-0.5">
              {activeWarehouse.tKey ? t(activeWarehouse.tKey) : activeWarehouse.name}
            </span>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={cn(
            "text-muted-foreground transition-transform duration-300 shrink-0",
            isOpen ? "rotate-180" : ""
          )}
        />
      </button>

      {/* Dropdown Panel */}
      <div className={cn(
        "absolute top-full left-0 right-0 z-50 overflow-hidden transition-all duration-300 ease-in-out",
        isOpen ? "max-h-80 opacity-100 mt-2" : "max-h-0 opacity-0 pointer-events-none"
      )}>
        <div className="py-2 bg-card/95 backdrop-blur-md border border-border/50 shadow-xl rounded-xl space-y-0.5 overflow-y-auto max-h-72">
          <div className="px-4 py-2 border-b border-border/50 mb-1">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              {t('warehouse.switchLabel', 'Switch Warehouse')}
            </p>
          </div>

          {STATIC_WAREHOUSES.map((wh) => (
            <button
              key={wh.id}
              onClick={() => handleSwitch(wh)}
              className={cn(
                "w-full flex flex-col px-4 py-2 text-left transition-colors cursor-pointer",
                wh.id === activeWarehouse.id
                  ? "bg-primary/10"
                  : "hover:bg-muted/40"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span className={cn(
                  "text-sm font-bold truncate",
                  wh.id === activeWarehouse.id ? "text-primary" : "text-foreground"
                )}>
                  {wh.tKey ? t(wh.tKey) : wh.name}
                </span>
                {wh.id === activeWarehouse.id && (
                  <CheckCircle2 size={14} className="text-primary shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  wh.status === 'Online' ? "bg-emerald-500" :
                  wh.status === 'Low Stock' ? "bg-amber-500" : "bg-muted-foreground"
                )} />
                <span className="text-xs text-muted-foreground">
                  {getStatusText(wh.status)}
                </span>
              </div>
            </button>
          ))}

          {/* Add New Warehouse */}
          <div className="px-2 pt-1.5 mt-1 border-t border-border/50">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-primary hover:bg-primary/10 transition-colors rounded-lg group cursor-pointer"
            >
              <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                <Plus size={14} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest truncate">
                {t('warehouse.addGodown')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

