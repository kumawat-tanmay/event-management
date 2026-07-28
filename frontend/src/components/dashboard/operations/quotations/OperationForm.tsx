'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Trash2, CalendarDays, Calculator, Truck, Users, Search, Minus, AlertTriangle, CheckCircle, PackageSearch, IndianRupee, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { FormDrawer } from '@/components/common/FormDrawer';
import { crmService, Customer } from '@/lib/services/crm.services';
import { inventoryService, Item } from '@/lib/services/inventory.services';
import { quotationService, StockAvailabilityItem } from '@/lib/services/quotation.services';
import { bookingService } from '@/lib/services/booking.services';

// ==========================================
// 1. StockAvailabilityCheck Subcomponent
// ==========================================
interface StockAvailabilityCheckProps {
  itemId: string;
  requestedQty: number;
  startDate?: string;
  endDate?: string;
  availabilityData?: StockAvailabilityItem;
}

function StockAvailabilityCheck({ itemId, requestedQty, startDate, endDate, availabilityData }: StockAvailabilityCheckProps) {
  const { t } = useTranslation();

  if (!startDate || !endDate) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 bg-muted/30 p-2 rounded-lg font-sans">
        <PackageSearch className="w-4 h-4" />
        <span>Select dates to check live availability</span>
      </div>
    );
  }

  if (!availabilityData) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 bg-muted/30 p-2 rounded-lg font-sans">
        <PackageSearch className="w-4 h-4 animate-pulse" />
        <span>Checking availability...</span>
      </div>
    );
  }

  const isAvailable = availabilityData.isFullyAvailable;
  const totalAvailable = availabilityData.totalAvailable;

  return (
    <div className={`mt-2 p-3 rounded-lg border text-xs font-sans ${isAvailable ? 'border-success/20 bg-success/5' : 'border-error/20 bg-error/5'}`}>
      <div className="flex items-center gap-2 font-bold mb-2">
        {isAvailable ? (
          <>
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-success">{t('reservation.checkStock')}: {requestedQty} / {totalAvailable}</span>
          </>
        ) : (
          <>
            <AlertTriangle className="w-4 h-4 text-error" />
            <span className="text-error">{t('reservation.conflicts')}: {requestedQty} requested, {totalAvailable} available</span>
          </>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 pt-2 border-t border-border">
        {availabilityData.warehouses.map((wh) => (
          <div key={wh.warehouseId}>
            <span className="text-[10px] text-muted-foreground block uppercase truncate" title={wh.warehouseName}>{wh.warehouseName}</span>
            <span className={`font-bold ${wh.available === 0 ? 'text-error' : 'text-foreground'}`}>{wh.available}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 2. ItemSelector Drawer Subcomponent
// ==========================================
export interface ItemSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItems: (items: any[]) => void;
  startDate?: string;
  endDate?: string;
  stockAvailabilityMap: Record<string, StockAvailabilityItem>;
  triggerStockCheck: (itemsToCheck: { item: string; quantity: number }[]) => void;
}

function ItemSelector({ isOpen, onClose, onAddItems, startDate, endDate, stockAvailabilityMap, triggerStockCheck }: ItemSelectorProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [categories, setCategories] = useState<string[]>(['All']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [catsRes, itemsRes] = await Promise.all([
          inventoryService.getCategories(),
          inventoryService.getItems({ limit: 100 })
        ]);
        setCategories(['All', ...catsRes.map(c => c.name)]);
        setItems(itemsRes.data);
      } catch (error) {
        console.error('Error loading item selector data:', error);
      } finally {
        setLoading(false);
      }
    };
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.code.toLowerCase().includes(searchQuery.toLowerCase());
    const itemCatName = typeof item.category === 'object' ? item.category?.name : '';
    const matchesCategory = activeCategory === 'All' || itemCatName === activeCategory;
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

      // Automatically trigger live stock check if date is available
      if (next > 0 && startDate && endDate) {
        const payload = Object.entries(newItems).map(([itemId, qty]) => ({
          item: itemId,
          quantity: qty
        }));
        if (payload.length > 0) {
          triggerStockCheck(payload);
        }
      }

      return newItems;
    });
  };

  const handleAddSelected = () => {
    const itemsToAdd = Object.entries(selectedItems).map(([id, qty]) => {
      const item = items.find(i => i._id === id)!;
      const catName = typeof item.category === 'object' ? item.category?.name : '';
      return {
        id: item._id,
        code: item.code,
        name: item.name,
        category: catName,
        rate: item.rentalPrice,
        unit: item.unit,
        qty: qty,
        total: item.rentalPrice * qty,
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
      title={t('inventory.selectItems', 'Select Inventory Items')}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>{t('roles.cancel')}</Button>
          <Button 
            variant="primary" 
            onClick={handleAddSelected}
            disabled={totalSelectedItems === 0}
          >
            Add {totalSelectedItems} Item(s)
          </Button>
        </>
      }
    >
      <div className="space-y-6 font-sans">
        {startDate && endDate && (
          <div className="bg-primary/10 text-primary p-3 rounded-lg text-sm font-medium border border-primary/20">
            Checking availability for event dates: {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
          </div>
        )}

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('item.searchPlace', 'Search by name or code...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat 
                    ? 'bg-primary text-on-primary shadow-sm' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {cat === 'All' ? t('category.allCategories', 'All') : cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center p-8 text-muted-foreground animate-pulse">Loading items...</div>
        ) : (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {filteredItems.map(item => {
              const selectedQty = selectedItems[item._id] || 0;
              const catName = typeof item.category === 'object' ? item.category?.name : '';
              return (
                <div key={item._id} className={`p-4 rounded-xl border transition-all ${selectedQty > 0 ? 'border-primary/50 bg-primary/5' : 'border-border bg-card'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">{item.code}</span>
                        <span className="text-xs text-muted-foreground">{catName}</span>
                      </div>
                      <h4 className="font-bold text-foreground truncate">{item.name}</h4>
                      <div className="text-sm font-medium text-foreground mt-1">
                        ₹ {item.rentalPrice} <span className="text-muted-foreground font-normal">/ {item.unit} / day</span>
                      </div>
                      
                      <div className="mt-3">
                         <StockAvailabilityCheck itemId={item._id} requestedQty={selectedQty > 0 ? selectedQty : 1} startDate={startDate} endDate={endDate} availabilityData={stockAvailabilityMap[item._id]} />
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-between h-full shrink-0">
                      <div className="flex items-center gap-3 bg-background border border-border rounded-lg p-1">
                        <button 
                          type="button"
                          onClick={() => handleQuantityChange(item._id, -1)}
                          disabled={selectedQty === 0}
                          className="w-7 h-7 flex items-center justify-center rounded-md bg-muted text-foreground hover:bg-border disabled:opacity-50 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-bold text-sm">{selectedQty}</span>
                        <button 
                          type="button"
                          onClick={() => handleQuantityChange(item._id, 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-md bg-primary text-on-primary hover:bg-primary/90 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      {selectedQty > 0 && (
                        <div className="text-sm font-bold text-primary mt-2">
                          Total: ₹ {(item.rentalPrice * selectedQty).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </FormDrawer>
  );
}

// ==========================================
// 3. Primary OperationForm Component
// ==========================================
interface OperationFormProps {
  mode: 'quotation' | 'booking';
  isEdit?: boolean;
}

export function OperationForm({ mode, isEdit = false }: OperationFormProps) {
  const { t } = useTranslation();

  const getBilingualText = useCallback((key: string) => {
    return t(key);
  }, [t]);
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [isItemSelectorOpen, setIsItemSelectorOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [, setItemsList] = useState<Item[]>([]);
  const [stockAvailabilityMap, setStockAvailabilityMap] = useState<Record<string, StockAvailabilityItem>>({});

  // Shared Form Fields
  const [customer, setCustomer] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState('Wedding');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [transportCharges, setTransportCharges] = useState(0);
  const [labourCharges, setLabourCharges] = useState(0);
  const [taxRate, setTaxRate] = useState(18);
  const [applyGst, setApplyGst] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  // Quotation Specific Fields
  const [discount, setDiscount] = useState(0);
  const [validUntil, setValidUntil] = useState('');

  // Booking Specific Fields
  const [advancePaid, setAdvancePaid] = useState(0);
  const [advanceRequired, setAdvanceRequired] = useState(0);
  const [quotationRefId, setQuotationRefId] = useState('');

  // Fetch initial dropdown options
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [custRes, itemsRes] = await Promise.all([
          crmService.getCustomers({ limit: 100 }),
          inventoryService.getItems({ limit: 100 })
        ]);
        setCustomers(custRes.data);
        setItemsList(itemsRes.data);
      } catch (error) {
        console.error('Error fetching dropdowns:', error);
      }
    };
    fetchDropdowns();
  }, []);

  // Fetch stock availability helper
  const triggerStockCheck = useCallback(async (itemsToCheck: { item: string; quantity: number }[]) => {
    if (!eventStartDate || !eventEndDate || itemsToCheck.length === 0) return;
    try {
      // Filter out items with undefined ID
      const filtered = itemsToCheck.filter(i => i.item);
      if (filtered.length === 0) return;

      const response = await quotationService.checkStock(
        filtered,
        eventStartDate,
        eventEndDate
      );
      const newMap = { ...stockAvailabilityMap };
      response.data.forEach(itemAv => {
        newMap[itemAv.itemId] = itemAv;
      });
      setStockAvailabilityMap(newMap);
    } catch (error) {
      console.error('Error checking stock availability:', error);
    }
  }, [eventStartDate, eventEndDate, stockAvailabilityMap]);

  // Load existing data in Edit Mode
  useEffect(() => {
    const loadDetails = async () => {
      if (!isEdit || !id) return;
      try {
        setPageLoading(true);
        const formatDate = (dStr: string) => {
          if (!dStr) return '';
          return dStr.split('T')[0];
        };

        if (mode === 'quotation') {
          const data = await quotationService.getQuotationById(id as string);
          setCustomer(typeof data.customer === 'object' ? data.customer?._id || '' : data.customer || '');
          setEventTitle(data.eventTitle);
          setEventType(data.eventType || 'Wedding');
          setEventStartDate(formatDate(data.eventStartDate));
          setEventEndDate(formatDate(data.eventEndDate));
          setVenueAddress(data.venueAddress);
          setTransportCharges(data.transportCharges || 0);
          setLabourCharges(data.labourCharges || 0);
          setTaxRate(data.taxRate || 18);
          setApplyGst(data.taxAmount > 0);
          setDiscount(data.discount || 0);
          if (data.validUntil) setValidUntil(formatDate(data.validUntil));

          // Robust mapping to support both old and new DB line item formats
          const mappedItems = data.items.map((item: any) => {
            const itemObj = (item.item && typeof item.item === 'object') ? (item.item as any) : null;
            const rate = item.rentalRate !== undefined ? item.rentalRate : (item.rentalPrice !== undefined ? item.rentalPrice : (itemObj?.rentalPrice || 0));
            const qty = item.quantity || 0;
            return {
              id: itemObj?._id || item.item || '',
              name: item.itemName || itemObj?.name || 'Unknown Item',
              code: item.itemCode || itemObj?.code || '',
              rate,
              unit: item.unit || itemObj?.unit || 'pc',
              qty,
              total: rate * qty
            };
          });
          setItems(mappedItems);

          // Check stock
          const validStockItems = mappedItems
            .filter(item => item.id)
            .map(item => ({ item: item.id, quantity: item.qty }));

          if (validStockItems.length > 0) {
            const response = await quotationService.checkStock(
              validStockItems,
              formatDate(data.eventStartDate),
              formatDate(data.eventEndDate)
            );
            const map: Record<string, StockAvailabilityItem> = {};
            response.data.forEach(i => { map[i.itemId] = i; });
            setStockAvailabilityMap(map);
          }
        } else {
          // Booking mode edit
          const data = await bookingService.getBookingById(id as string);
          setCustomer(typeof data.customer === 'object' ? data.customer?._id || '' : data.customer || '');
          setQuotationRefId(typeof data.quotation === 'object' ? data.quotation?.quotationId || '' : data.quotation || '');
          setEventTitle(data.eventTitle);
          setEventType(data.eventType || 'Wedding');
          setEventStartDate(formatDate(data.eventStartDate));
          setEventEndDate(formatDate(data.eventEndDate));
          setVenueAddress(data.venueAddress);
          setTransportCharges(data.transportCharges || 0);
          setLabourCharges(data.labourCharges || 0);
          setTaxRate(data.taxRate || 18);
          setApplyGst(data.taxAmount > 0);
          setAdvancePaid(data.advancePaid || 0);
          setAdvanceRequired(data.advanceRequired || 0);

          // Robust mapping to support both old and new DB line item formats
          const mappedItems = data.items.map((item: any) => {
            const itemObj = (item.item && typeof item.item === 'object') ? (item.item as any) : null;
            const rate = item.rentalRate !== undefined ? item.rentalRate : (item.rentalPrice !== undefined ? item.rentalPrice : (itemObj?.rentalPrice || 0));
            const qty = item.quantity || 0;
            return {
              id: itemObj?._id || item.item || '',
              name: item.itemName || itemObj?.name || 'Unknown Item',
              code: item.itemCode || itemObj?.code || '',
              rate,
              unit: item.unit || itemObj?.unit || 'pc',
              qty,
              total: rate * qty
            };
          });
          setItems(mappedItems);

          // Check stock
          const validStockItems = mappedItems
            .filter(item => item.id)
            .map(item => ({ item: item.id, quantity: item.qty }));

          if (validStockItems.length > 0) {
            const response = await quotationService.checkStock(
              validStockItems,
              formatDate(data.eventStartDate),
              formatDate(data.eventEndDate)
            );
            const map: Record<string, StockAvailabilityItem> = {};
            response.data.forEach(i => { map[i.itemId] = i; });
            setStockAvailabilityMap(map);
          }
        }
      } catch (error) {
        console.error('Error loading operational form data:', error);
      } finally {
        setPageLoading(false);
      }
    };
    loadDetails();
  }, [id, isEdit, mode]);

  const durationDays = () => {
    if (!eventStartDate || !eventEndDate) return 1;
    const start = new Date(eventStartDate);
    const end = new Date(eventEndDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const handleAddItems = (newItems: any[]) => {
    const updatedItems = [...items];
    
    newItems.forEach(newItem => {
      const existingIdx = updatedItems.findIndex(i => i.id === newItem.id);
      if (existingIdx >= 0) {
        updatedItems[existingIdx].qty += newItem.qty;
        updatedItems[existingIdx].total = updatedItems[existingIdx].qty * updatedItems[existingIdx].rate;
      } else {
        updatedItems.push({
          id: newItem.id,
          name: newItem.name,
          code: newItem.code,
          rate: newItem.rate,
          unit: newItem.unit,
          qty: newItem.qty,
          total: newItem.qty * newItem.rate
        });
      }
    });

    setItems(updatedItems);
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formItems = items.map(item => {
        const rate = Number(item.rate) || 0;
        const qty = Number(item.qty) || 0;
        const days = durationDays();
        return {
          item: item.id,
          itemName: item.name || 'Unknown Item',
          itemCode: item.code || '',
          unit: item.unit || 'pc',
          rentalRate: rate,
          quantity: qty,
          duration: days,
          totalAmount: rate * qty * days
        };
      });

      if (mode === 'quotation') {
        const payload = {
          customer,
          eventTitle,
          eventType,
          eventStartDate,
          eventEndDate,
          venueAddress,
          transportCharges: Number(transportCharges) || 0,
          labourCharges: Number(labourCharges) || 0,
          discount: Number(discount) || 0,
          taxRate: applyGst ? (Number(taxRate) || 0) : 0,
          validUntil: validUntil || undefined,
          items: formItems
        };

        if (isEdit && id) {
          await quotationService.updateQuotation(id as string, payload);
        } else {
          await quotationService.createQuotation(payload);
        }
        router.push('/operations/quotations');
      } else {
        // Booking mode submission
        const payload = {
          customer,
          eventTitle,
          eventType,
          eventStartDate,
          eventEndDate,
          venueAddress,
          transportCharges: Number(transportCharges) || 0,
          labourCharges: Number(labourCharges) || 0,
          taxRate: applyGst ? (Number(taxRate) || 0) : 0,
          advancePaid: Number(advancePaid) || 0,
          advanceRequired: Number(advanceRequired) || Math.round(grandTotal * 0.3),
          items: formItems
        };

        if (isEdit && id) {
          await bookingService.updateBooking(id as string, payload);
        } else {
          await bookingService.createBooking(payload);
        }
        router.push('/operations/bookings');
      }
    } catch (error) {
      console.error('Error submitting operational form:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const itemTotal = items.reduce((acc, item) => acc + item.total, 0) * durationDays();
  const subTotal = itemTotal + Number(transportCharges) + Number(labourCharges);
  const discountAmount = mode === 'quotation' ? (subTotal * Number(discount)) / 100 : 0;
  const taxableAmount = subTotal - discountAmount;
  const gst = applyGst ? taxableAmount * (taxRate / 100) : 0;
  const grandTotal = taxableAmount + gst;
  const balanceDue = mode === 'booking' ? grandTotal - advancePaid : 0;

  if (pageLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">{t('crm.loading', 'Loading...')}</div>;

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full font-sans">
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight mb-1">
            {isEdit 
              ? (mode === 'quotation' ? t('quotation.editQuotation') : t('bookings.editBooking')) 
              : (mode === 'quotation' ? t('quotation.newQuotation') : t('bookings.newBooking'))
            }
          </h2>
          <p className="text-sm font-medium text-muted-foreground">
            {mode === 'quotation' 
              ? 'Draft an event proposal and compute warehouse stocks.' 
              : 'Record event logistics, timelines, and payment receipts.'
            }
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Details & Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <FileText className="w-5 h-5 text-primary" />
                {getBilingualText('quotation.eventDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">{getBilingualText('operationForm.customerLabel')}</label>
                  <select 
                    className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={customer}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      setCustomer(selectedId);
                      const selectedCust = customers.find(c => c._id === selectedId);
                      if (selectedCust && selectedCust.address) {
                        setVenueAddress(selectedCust.address);
                      }
                    }}
                    required
                  >
                    <option value="">{getBilingualText('quotation.selectCustomer')}</option>
                    {customers.map(c => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.type === 'Retail' ? t('crm.retail') : t('crm.corporate')})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">{getBilingualText('operationForm.eventTypeLabel')}</label>
                  <select 
                    className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                  >
                    <option value="Wedding">{t('operationForm.wedding')}</option>
                    <option value="Reception">{t('operationForm.reception')}</option>
                    <option value="Corporate">{t('operationForm.corporate')}</option>
                    <option value="Birthday">{t('operationForm.birthday')}</option>
                    <option value="Exhibition">{t('operationForm.exhibition')}</option>
                    <option value="Other">{t('operationForm.other')}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Input 
                  label={getBilingualText('operationForm.eventTitleLabel')} 
                  type="text"
                  placeholder={getBilingualText('operationForm.eventTitlePlaceholder')}
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label={getBilingualText('operationForm.eventStartDateLabel')} 
                  type="date"
                  value={eventStartDate}
                  onChange={(e) => setEventStartDate(e.target.value)}
                  required
                />
                <Input 
                  label={getBilingualText('operationForm.eventEndDateLabel')} 
                  type="date"
                  value={eventEndDate}
                  onChange={(e) => setEventEndDate(e.target.value)}
                  required
                />
              </div>

              {mode === 'booking' && quotationRefId && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground uppercase">{getBilingualText('operationForm.quotationRefLabel')}</label>
                  <input
                    type="text"
                    disabled
                    value={quotationRefId}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-muted-foreground cursor-not-allowed"
                  />
                </div>
              )}

              {mode === 'quotation' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label={getBilingualText('operationForm.validUntilLabel')} 
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">{getBilingualText('operationForm.venueAddressLabel')}</label>
                <textarea 
                  className="w-full min-h-[80px] p-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder={getBilingualText('operationForm.venueAddressPlaceholder')}
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <Calculator className="w-5 h-5 text-primary" />
                  {getBilingualText('operationForm.itemsSubtotal')}
                </CardTitle>
                <CardDescription>{t('operationForm.materialsDesc')}</CardDescription>
              </div>
              <Button 
                type="button"
                variant="outline" 
                size="sm" 
                onClick={() => setIsItemSelectorOpen(true)}
                className="flex items-center gap-2"
                disabled={!eventStartDate || !eventEndDate}
              >
                <Plus className="w-4 h-4" />
                {t('operationForm.addItems')}
              </Button>
            </CardHeader>
            <CardContent>
              {!eventStartDate || !eventEndDate ? (
                <div className="text-center p-8 border border-dashed rounded-lg bg-muted/20">
                  <CalendarDays className="w-8 h-8 mx-auto text-muted-foreground mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground font-medium">{t('operationForm.datesFirst')}</p>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center p-8 border border-dashed rounded-lg bg-muted/20">
                  <p className="text-sm text-muted-foreground font-medium mb-3">{t('operationForm.noItems')}</p>
                  <Button type="button" variant="primary" onClick={() => setIsItemSelectorOpen(true)}>
                    {t('operationForm.selectItems')}
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 rounded-l-lg font-medium">{t('operationForm.itemDetailsHeader')}</th>
                        <th className="px-4 py-2 font-medium">{t('operationForm.rateDayHeader')}</th>
                        <th className="px-4 py-2 font-medium">{t('operationForm.qtyHeader')}</th>
                        <th className="px-4 py-2 font-medium text-right">{t('operationForm.totalHeader')}</th>
                        <th className="px-4 py-2 rounded-r-lg"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="px-4 py-3">
                            <p className="font-bold text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.code}</p>
                            {stockAvailabilityMap[item.id] && (
                              <StockAvailabilityCheck itemId={item.id} requestedQty={item.qty} startDate={eventStartDate} endDate={eventEndDate} availabilityData={stockAvailabilityMap[item.id]} />
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium">₹ {Number(item.rate || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 font-bold">{item.qty} {item.unit || 'pc'}</td>
                          <td className="px-4 py-3 font-bold text-right">₹ {(item.qty * (item.rate || 0) * durationDays()).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            <button 
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1.5 text-muted-foreground hover:text-error hover:bg-error/10 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Financial Summaries & Submit */}
        <div className="space-y-6">
          <Card className="sticky top-6 bg-card border border-border shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold">{getBilingualText('operationForm.billingFinancials')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 pb-4 border-b border-border">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">{getBilingualText('operationForm.rentalDuration')}</span>
                  <span className="font-bold">{durationDays()} {t('operationForm.days')}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">{getBilingualText('operationForm.itemsSubtotal')}</span>
                  <span className="font-bold">₹ {itemTotal.toLocaleString()}</span>
                </div>
                
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Input 
                      placeholder={getBilingualText('operationForm.transportLabel')} 
                      type="number"
                      value={transportCharges}
                      onChange={(e) => setTransportCharges(Number(e.target.value))}
                      className="h-8 text-right font-semibold"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Input 
                      placeholder={getBilingualText('operationForm.labourLabel')} 
                      type="number"
                      value={labourCharges}
                      onChange={(e) => setLabourCharges(Number(e.target.value))}
                      className="h-8 text-right font-semibold"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm pt-2">
                  <span className="text-muted-foreground font-medium">{t('operationForm.subtotalCharges')}</span>
                  <span className="font-bold">₹ {subTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-3 pb-4 border-b border-border">
                {mode === 'quotation' && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">{getBilingualText('operationForm.discountLabel')}</span>
                    <Input 
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="h-8 w-20 text-right font-semibold"
                      max="100"
                    />
                    <span className="text-sm font-bold text-success ml-auto">- ₹ {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">{getBilingualText('operationForm.taxableAmountLabel')}</span>
                  <span className="font-bold">₹ {taxableAmount.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-medium text-muted-foreground">{getBilingualText('operationForm.gstLabel')}</span>
                  <select 
                    value={applyGst ? taxRate : 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val === 0) {
                        setApplyGst(false);
                      } else {
                        setApplyGst(true);
                        setTaxRate(val);
                      }
                    }}
                    className="h-8 w-36 px-2 py-1 rounded-lg border border-border bg-card text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 text-right"
                  >
                    <option value="0">No GST (0%)</option>
                    <option value="5">GST (5%)</option>
                    <option value="12">GST (12%)</option>
                    <option value="18">GST (18%)</option>
                    <option value="28">GST (28%)</option>
                  </select>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">{getBilingualText('operationForm.gstLabel')} ({applyGst ? taxRate : 0}%)</span>
                  <span className="font-bold">₹ {gst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-lg font-black text-gray-900">{getBilingualText('operationForm.grandTotalLabel')}</span>
                <span className="text-xl font-black text-primary">₹ {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              {mode === 'booking' && (
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-black text-muted-foreground uppercase">{getBilingualText('operationForm.advanceRequiredLabel')}</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="number"
                        value={advanceRequired}
                        onChange={(e) => setAdvanceRequired(Number(e.target.value))}
                        className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-right font-bold text-foreground focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-black text-muted-foreground uppercase">{getBilingualText('operationForm.advancePaidLabel')}</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="number"
                        value={advancePaid}
                        onChange={(e) => setAdvancePaid(Number(e.target.value))}
                        className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-right font-bold text-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between border-t border-border pt-4 text-base font-bold text-foreground">
                    <span>{getBilingualText('operationForm.balanceDueLabel')}</span>
                    <span className={balanceDue > 0 ? 'text-amber-600' : 'text-muted-foreground'}>
                      ₹ {balanceDue.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <Button type="submit" variant="primary" className="w-full mt-4" disabled={loading || items.length === 0}>
                {loading 
                  ? getBilingualText('operationForm.saving') 
                  : isEdit 
                    ? getBilingualText('operationForm.updateDetails') 
                    : getBilingualText('operationForm.saveDetails')
                }
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>

      <ItemSelector 
        isOpen={isItemSelectorOpen} 
        onClose={() => setIsItemSelectorOpen(false)}
        onAddItems={handleAddItems}
        startDate={eventStartDate}
        endDate={eventEndDate}
        stockAvailabilityMap={stockAvailabilityMap}
        triggerStockCheck={triggerStockCheck}
      />
    </div>
  );
}
