'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Package, Truck, CheckSquare, 
  Square, Save, UserCircle, MapPin
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { cn } from '@/utils/cn';

export function DispatchPackingForm() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [items, setItems] = useState([
    { id: 'ITM-001', name: 'Plastic Chair (White)', reserved: 300, loaded: 300, checked: true },
    { id: 'ITM-002', name: 'Banquet Table (Round)', reserved: 50, loaded: 48, checked: false },
    { id: 'ITM-003', name: 'Sofa Set (3-Seater)', reserved: 5, loaded: 5, checked: true },
    { id: 'ITM-004', name: 'LED PAR Lights', reserved: 24, loaded: 24, checked: true },
  ]);

  const toggleCheck = (index: number) => {
    const newItems = [...items];
    newItems[index].checked = !newItems[index].checked;
    setItems(newItems);
  };

  return (
    <div className="flex flex-col h-full space-y-6 p-4 md:p-6 lg:p-8 w-full max-w-full">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="h-8 w-8 p-0 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <PageHeader 
            title="Dispatch & Packing Checklist" 
            description={`Verify loading quantities for ${eventId || 'Event'}`}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-2">
          <Button variant="primary" size="sm">
            <Truck className="w-4 h-4 mr-2" />
            Mark as Dispatched
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Logistics Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">
                  Dispatch #DSP-291
                </span>
                <StatusBadge status="Loading" />
              </div>
              <CardTitle className="text-lg font-bold leading-tight">Logistics Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-start gap-3">
                <Truck className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">RJ-14-GA-1234 (Heavy Truck)</p>
                  <p className="text-xs text-muted-foreground">Assigned Vehicle</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UserCircle className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Ramesh Driver (+91 9876543210)</p>
                  <p className="text-xs text-muted-foreground">Driver Contact</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Fairmont Hotel, Jaipur</p>
                  <p className="text-xs text-muted-foreground">Destination Site</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border">
                <div className="flex justify-between items-end mb-1">
                  <p className="text-xs font-medium text-muted-foreground">Loading Progress</p>
                  <p className="text-sm font-bold">
                    {items.filter(i => i.checked).length} / {items.length}
                  </p>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                  <div 
                    className="h-1.5 rounded-full bg-primary transition-all duration-300" 
                    style={{ width: `${(items.filter(i => i.checked).length / items.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Checklist */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-sm h-full flex flex-col min-h-[500px]">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                Material Loading Checklist
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-0 p-0 flex-1 overflow-auto">
              <div className="divide-y divide-border">
                {items.map((item, idx) => (
                  <div 
                    key={item.id} 
                    className={cn(
                      "p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors cursor-pointer",
                      item.checked ? "bg-success/5 hover:bg-success/10" : "hover:bg-muted/30"
                    )}
                    onClick={() => toggleCheck(idx)}
                  >
                    <div className="flex items-center gap-3">
                      {item.checked ? (
                        <CheckSquare className="w-5 h-5 text-success" />
                      ) : (
                        <Square className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className={cn("font-bold text-sm", item.checked && "text-muted-foreground line-through")}>
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{item.id}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 sm:w-auto w-full justify-between sm:justify-end">
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Reserved</p>
                        <p className="text-sm font-semibold">{item.reserved}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Loaded</p>
                        <input 
                          type="number" 
                          value={item.loaded}
                          onChange={(e) => {
                            e.stopPropagation();
                            const newItems = [...items];
                            newItems[idx].loaded = parseInt(e.target.value) || 0;
                            setItems(newItems);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            "w-16 text-center text-sm font-bold border rounded py-1 bg-transparent",
                            item.loaded < item.reserved ? "border-error text-error focus:ring-error" : "border-border text-foreground"
                          )}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
