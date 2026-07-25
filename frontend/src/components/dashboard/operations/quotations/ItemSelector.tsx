'use client';

import React, { useState } from 'react';
import { Search, Plus, Minus } from 'lucide-react';
import { FormDrawer } from '@/components/common/FormDrawer';
import { Button } from '@/components/common/Button';
import { StockAvailabilityCheck } from './StockAvailabilityCheck';

// Dummy inventory data
const DUMMY_ITEMS = [
  { id: 'ITM-001', code: 'CHAIR-PL-01', name: 'Plastic Chair', category: 'Furniture', rate: 10, unit: 'pc', available: 1200 },
  { id: 'ITM-002', code: 'TBL-RND-01', name: 'Round Table 5ft', category: 'Furniture', rate: 150, unit: 'pc', available: 250 },
  { id: 'ITM-003', code: 'SOFA-WHT-01', name: 'White VIP Sofa', category: 'Furniture', rate: 800, unit: 'pc', available: 45 },
  { id: 'ITM-004', code: 'LED-P4-001', name: 'P4 LED Screen', category: 'AV & Lighting', rate: 150, unit: 'sqft', available: 1000 },
  { id: 'ITM-005', code: 'TENT-WHT-01', name: 'White Pagoda Tent 10x10', category: 'Tents & Decor', rate: 2500, unit: 'pc', available: 15 },
];

export interface ItemSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItems: (items: any[]) => void;
  startDate?: string;
  endDate?: string;
}

export function ItemSelector({ isOpen, onClose, onAddItems, startDate, endDate }: ItemSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Furniture', 'Tents & Decor', 'AV & Lighting'];

  const filteredItems = DUMMY_ITEMS.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleQuantityChange = (id: string, delta: number) => {
    setSelectedItems(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      
      const newItems = { ...prev };
      if (next === 0) {
        delete newItems[id];
      } else {
        newItems[id] = next;
      }
      return newItems;
    });
  };

  const handleAddSelected = () => {
    const itemsToAdd = Object.entries(selectedItems).map(([id, qty]) => {
      const item = DUMMY_ITEMS.find(i => i.id === id)!;
      return {
        id: item.id,
        code: item.code,
        name: item.name,
        category: item.category,
        rate: item.rate,
        unit: item.unit,
        qty: qty,
        total: item.rate * qty,
      };
    });

    onAddItems(itemsToAdd);
    setSelectedItems({});
    onClose();
  };

  const totalSelectedItems = Object.keys(selectedItems).length;

  return (
    <FormDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Select Inventory Items"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            variant="primary" 
            onClick={handleAddSelected}
            disabled={totalSelectedItems === 0}
          >
            Add {totalSelectedItems} Item(s) to Quote
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Date Range Check Info */}
        {startDate && endDate && (
          <div className="bg-primary/10 text-primary p-3 rounded-lg text-sm font-medium border border-primary/20">
            Checking availability for event dates: {startDate} to {endDate}
          </div>
        )}

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat 
                    ? 'bg-primary text-on-primary shadow-sm' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Item List */}
        <div className="space-y-3">
          {filteredItems.map(item => {
            const selectedQty = selectedItems[item.id] || 0;
            return (
              <div key={item.id} className={`p-4 rounded-xl border transition-all ${selectedQty > 0 ? 'border-primary/50 bg-primary/5' : 'border-border bg-card'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">{item.code}</span>
                      <span className="text-xs text-muted-foreground">{item.category}</span>
                    </div>
                    <h4 className="font-bold text-foreground">{item.name}</h4>
                    <div className="text-sm font-medium text-foreground mt-1">
                      ₹ {item.rate} <span className="text-muted-foreground font-normal">/ {item.unit} / day</span>
                    </div>
                    
                    {/* Live Stock Check Subcomponent */}
                    <div className="mt-3">
                       <StockAvailabilityCheck itemId={item.id} requestedQty={selectedQty > 0 ? selectedQty : 1} startDate={startDate} endDate={endDate} />
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between h-full">
                    <div className="flex items-center gap-3 bg-background border border-border rounded-lg p-1">
                      <button 
                        onClick={() => handleQuantityChange(item.id, -1)}
                        disabled={selectedQty === 0}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-muted text-foreground hover:bg-border disabled:opacity-50 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-bold text-sm">{selectedQty}</span>
                      <button 
                        onClick={() => handleQuantityChange(item.id, 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-primary text-on-primary hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    {selectedQty > 0 && (
                      <div className="text-sm font-bold text-primary mt-2">
                        Total: ₹ {(item.rate * selectedQty).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </FormDrawer>
  );
}
