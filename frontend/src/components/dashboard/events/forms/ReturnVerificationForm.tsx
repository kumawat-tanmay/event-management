'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, ClipboardCheck, Truck, CheckCircle2, 
  AlertTriangle, Save, Store, Trash2
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { cn } from '@/utils/cn';

export function ReturnVerificationForm() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [items, setItems] = useState([
    { id: 'ITM-001', name: 'Plastic Chair (White)', dispatched: 300, returned: 300, good: 295, damaged: 5, scrap: 0, missing: 0 },
    { id: 'ITM-002', name: 'Banquet Table (Round)', dispatched: 50, returned: 50, good: 50, damaged: 0, scrap: 0, missing: 0 },
    { id: 'ITM-003', name: 'Sofa Set (3-Seater)', dispatched: 5, returned: 4, good: 4, damaged: 0, scrap: 0, missing: 1 },
  ]);

  const [remarks, setRemarks] = useState('');

  const updateItem = (index: number, field: string, value: string) => {
    const val = parseInt(value) || 0;
    const newItems = [...items];
    (newItems[index] as any)[field] = val;
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
            title="Return Verification & QC" 
            description={`Verify materials received from ${eventId || 'Event'} and assess condition`}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-2">
          <Button variant="primary" size="sm">
            <Save className="w-4 h-4 mr-2" />
            Save Verification
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Logistics Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">
                  Return #RET-092
                </span>
                <StatusBadge status="Pending QC" />
              </div>
              <CardTitle className="text-lg font-bold leading-tight">Receipt Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-start gap-3">
                <Store className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Main Godown</p>
                  <p className="text-xs text-muted-foreground">Receiving Warehouse</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Truck className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">RJ-14-GA-1234</p>
                  <p className="text-xs text-muted-foreground">Return Vehicle</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border space-y-2">
                <label className="text-sm font-semibold text-foreground">Store Manager Remarks</label>
                <textarea 
                  className="w-full h-24 p-3 border border-border rounded-lg bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Notes on missing or damaged items for customer billing..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Verification Checklist */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-border shadow-sm h-full flex flex-col min-h-[500px]">
            <CardHeader className="border-b border-border bg-muted/30 pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-primary" />
                Item Quality Control (QC) Checklist
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-0 p-0 flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground sticky top-0 z-10 backdrop-blur-sm border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-semibold w-[25%]">Item Name</th>
                    <th className="px-4 py-3 font-semibold text-center">Dispatched</th>
                    <th className="px-4 py-3 font-semibold text-center">Returned</th>
                    <th className="px-4 py-3 font-semibold text-center text-success">Good (OK)</th>
                    <th className="px-4 py-3 font-semibold text-center text-warning">Repairable</th>
                    <th className="px-4 py-3 font-semibold text-center text-error">Scrap</th>
                    <th className="px-4 py-3 font-semibold text-center text-error">Missing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-sm text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{item.id}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold">
                          {item.dispatched}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input 
                          type="number" 
                          value={item.returned}
                          onChange={(e) => updateItem(idx, 'returned', e.target.value)}
                          className="w-16 text-center text-sm font-bold border border-border rounded py-1.5 bg-background focus:ring-1 focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input 
                          type="number" 
                          value={item.good}
                          onChange={(e) => updateItem(idx, 'good', e.target.value)}
                          className="w-16 text-center text-sm font-bold border border-success/30 bg-success/5 text-success rounded py-1.5 focus:ring-1 focus:ring-success"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input 
                          type="number" 
                          value={item.damaged}
                          onChange={(e) => updateItem(idx, 'damaged', e.target.value)}
                          className={cn(
                            "w-16 text-center text-sm font-bold border rounded py-1.5 focus:ring-1 focus:ring-warning",
                            item.damaged > 0 ? "border-warning/50 bg-warning/10 text-warning" : "border-border bg-background"
                          )}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input 
                          type="number" 
                          value={item.scrap}
                          onChange={(e) => updateItem(idx, 'scrap', e.target.value)}
                          className={cn(
                            "w-16 text-center text-sm font-bold border rounded py-1.5 focus:ring-1 focus:ring-error",
                            item.scrap > 0 ? "border-error/50 bg-error/10 text-error" : "border-border bg-background"
                          )}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input 
                          type="number" 
                          value={item.missing}
                          onChange={(e) => updateItem(idx, 'missing', e.target.value)}
                          className={cn(
                            "w-16 text-center text-sm font-bold border rounded py-1.5 focus:ring-1 focus:ring-error",
                            item.missing > 0 ? "border-error/50 bg-error/10 text-error" : "border-border bg-background"
                          )}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
