'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, PackageSearch } from 'lucide-react';

export interface StockAvailabilityCheckProps {
  itemId: string;
  requestedQty: number;
  startDate?: string;
  endDate?: string;
}

export function StockAvailabilityCheck({ itemId, requestedQty, startDate, endDate }: StockAvailabilityCheckProps) {
  // Dummy stock logic based on itemId
  const mainStock = 500;
  const jaipurStock = 120;
  const ajmerStock = 50;
  const jodhpurStock = 0;
  
  const totalAvailable = mainStock + jaipurStock + ajmerStock + jodhpurStock;
  const isAvailable = totalAvailable >= requestedQty;

  if (!startDate || !endDate) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 bg-muted/30 p-2 rounded-lg">
        <PackageSearch className="w-4 h-4" />
        <span>Select dates to check live availability</span>
      </div>
    );
  }

  return (
    <div className={`mt-2 p-3 rounded-lg border text-xs ${isAvailable ? 'border-success/20 bg-success/5' : 'border-error/20 bg-error/5'}`}>
      <div className="flex items-center gap-2 font-bold mb-2">
        {isAvailable ? (
          <>
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-success">Available for dates: {requestedQty} / {totalAvailable}</span>
          </>
        ) : (
          <>
            <AlertTriangle className="w-4 h-4 text-error" />
            <span className="text-error">Insufficient Stock: {requestedQty} requested, {totalAvailable} available</span>
          </>
        )}
      </div>
      
      <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-border">
        <div>
          <span className="text-[10px] text-muted-foreground block uppercase">Main</span>
          <span className="font-bold text-foreground">{mainStock}</span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground block uppercase">Jaipur</span>
          <span className="font-bold text-foreground">{jaipurStock}</span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground block uppercase">Ajmer</span>
          <span className="font-bold text-foreground">{ajmerStock}</span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground block uppercase">Jodhpur</span>
          <span className={`font-bold ${jodhpurStock === 0 ? 'text-error' : 'text-foreground'}`}>{jodhpurStock}</span>
        </div>
      </div>
    </div>
  );
}
