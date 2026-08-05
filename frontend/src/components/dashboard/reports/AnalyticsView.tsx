'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, ReceiptText, AlertTriangle, Box, Truck, Wallet, 
  RefreshCw, BarChart3, ArrowDownRight, ArrowUpRight 
} from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { reportService } from '@/lib/services/report.services';
import { auditService, AuditLog } from '@/lib/services/audit.services';
import { dashboardService } from '@/lib/services/dashboard.services';
import useSWR from 'swr';
import toast from 'react-hot-toast';

export function AnalyticsView() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'gst' | 'damage' | 'inventory' | 'dispatch' | 'expenses'>('overview');
  const [loadingLists, setLoadingLists] = useState(true);
  
  // Tab Lists States
  const [gstData, setGstData] = useState<any[]>([]);
  const [damageData, setDamageData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [dispatchData, setDispatchData] = useState<any[]>([]);
  const [expensesData, setExpensesData] = useState<any>({ total: 0, breakdown: {}, list: [] });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Fetch Dashboard API using useSWR (Main stats, line chart, donut, top clients)
  const { data: statsData, error: statsError, mutate: mutateStats } = useSWR(
    '/dashboard/stats',
    () => dashboardService.getStats()
  );

  const fetchTabLists = async () => {
    setLoadingLists(true);
    try {
      const [gstRes, damageRes, inventoryRes, dispatchRes, expensesRes, auditRes] = await Promise.allSettled([
        reportService.getReport('gst'),
        reportService.getReport('damage'),
        reportService.getReport('inventory'),
        reportService.getReport('dispatches'),
        reportService.getReport('expenses'),
        auditService.getAuditLogs()
      ]);

      if (gstRes.status === 'fulfilled') setGstData(gstRes.value || []);
      if (damageRes.status === 'fulfilled') setDamageData(damageRes.value || []);
      if (inventoryRes.status === 'fulfilled') setInventoryData(inventoryRes.value || []);
      if (dispatchRes.status === 'fulfilled') setDispatchData(dispatchRes.value || []);
      if (expensesRes.status === 'fulfilled') setExpensesData(expensesRes.value || { total: 0, breakdown: {}, list: [] });
      if (auditRes.status === 'fulfilled') setAuditLogs(auditRes.value || []);
    } catch (err: any) {
      console.error('Error fetching list reports:', err);
    } finally {
      setLoadingLists(false);
    }
  };

  useEffect(() => {
    fetchTabLists();
  }, []);

  const handleRefresh = async () => {
    await mutateStats();
    await fetchTabLists();
    toast.success(t('reports.syncedSuccess', 'Reports updated successfully'));
  };

  // OVERVIEW CALCULATIONS
  const stats = statsData?.summary;
  const recentBookings = statsData?.recentBookings || [];
  
  const growthAnalysis: any[] = React.useMemo(() => {
    const ga = statsData?.growthAnalysis;
    if (!ga) return [];
    if (Array.isArray(ga)) return ga;
    return ga.monthly || ga.weekly || ga.daily || [];
  }, [statsData]);

  const categoryBreakdown = statsData?.categoryBreakdown || {
    'Transport': 0,
    'Material Purchase': 0,
    'Maintenance': 0,
    'Staff Salary': 0,
    'Other': 0
  };

  // Dynamic values
  const totalSalesRevenue = recentBookings.reduce((acc: number, curr: any) => acc + (curr.grandTotal || 0), 0);
  const totalReceivedRevenue = recentBookings.reduce((acc: number, curr: any) => acc + (curr.advancePaid || 0), 0);
  const totalExpensesOutflow = (categoryBreakdown.Transport || 0) +
                               (categoryBreakdown['Material Purchase'] || 0) +
                               (categoryBreakdown.Maintenance || 0) +
                               (categoryBreakdown['Staff Salary'] || 0) +
                               (categoryBreakdown.Other || 0);

  const settlementRate = totalSalesRevenue > 0 ? Math.round((totalReceivedRevenue / totalSalesRevenue) * 100) : 0;
  const activeClientsCount = new Set(recentBookings.map((b: any) => b.customerName).filter(Boolean)).size;

  // DYNAMIC CHART SVG SCALING
  const maxVal = React.useMemo(() => {
    if (!Array.isArray(growthAnalysis) || growthAnalysis.length === 0) return 10000;
    return Math.max(...growthAnalysis.map((g: any) => Math.max(g?.revenue || 0, g?.expenses || 0)), 10000);
  }, [growthAnalysis]);
  
  const pointsSales = React.useMemo(() => {
    if (!Array.isArray(growthAnalysis) || growthAnalysis.length === 0) return '';
    return growthAnalysis.map((g: any, idx: number) => {
      const count = growthAnalysis.length || 1;
      const x = (idx / (count - 1 || 1)) * 100;
      const y = maxVal > 0 ? 50 - ((g?.revenue || 0) / maxVal) * 40 : 45;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');
  }, [growthAnalysis, maxVal]);

  const pointsExpenses = React.useMemo(() => {
    if (!Array.isArray(growthAnalysis) || growthAnalysis.length === 0) return '';
    return growthAnalysis.map((g: any, idx: number) => {
      const count = growthAnalysis.length || 1;
      const x = (idx / (count - 1 || 1)) * 100;
      const y = maxVal > 0 ? 50 - ((g?.expenses || 0) / maxVal) * 40 : 45;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');
  }, [growthAnalysis, maxVal]);

  // DONUT CALCULATIONS
  const transportPct = totalExpensesOutflow > 0 ? Math.round((categoryBreakdown.Transport / totalExpensesOutflow) * 100) : 0;
  const materialPct = totalExpensesOutflow > 0 ? Math.round((categoryBreakdown['Material Purchase'] / totalExpensesOutflow) * 100) : 0;
  const staffPct = totalExpensesOutflow > 0 ? Math.round((categoryBreakdown['Staff Salary'] / totalExpensesOutflow) * 100) : 0;
  const maintenancePct = totalExpensesOutflow > 0 ? Math.round((categoryBreakdown.Maintenance / totalExpensesOutflow) * 100) : 0;
  const otherPct = totalExpensesOutflow > 0 ? Math.round((categoryBreakdown.Other / totalExpensesOutflow) * 100) : 0;

  // Render Tabs switcher
  const tabsList = [
    { id: 'overview', label: 'Business Overview', icon: TrendingUp },
    { id: 'gst', label: 'GST Tax Ledger', icon: ReceiptText },
    { id: 'damage', label: 'Damage & Scrap Log', icon: AlertTriangle },
    { id: 'inventory', label: 'Inventory Stock', icon: Box },
    { id: 'dispatch', label: 'Dispatch Gatepass', icon: Truck },
    { id: 'expenses', label: 'Operating Expenses', icon: Wallet }
  ] as const;

  // TAB COLUMNS DEFINITIONS
  const gstColumns = [
    {
      header: 'Booking ID',
      accessorKey: 'bookingId',
      cell: (row: any) => <span className="font-bold text-foreground">{row.bookingId?.bookingId || '—'}</span>
    },
    { header: 'Party / Client', accessorKey: 'customerName' },
    {
      header: 'Taxable Amount',
      accessorKey: 'subtotal',
      cell: (row: any) => <span className="font-semibold text-foreground">₹{row.subtotal.toLocaleString()}</span>
    },
    { header: 'GST Rate', accessorKey: 'taxRate', cell: (row: any) => `${row.taxRate}%` },
    {
      header: 'GST Collected',
      accessorKey: 'taxAmount',
      cell: (row: any) => <span className="font-bold text-primary">₹{row.taxAmount.toLocaleString()}</span>
    },
    {
      header: 'Gross Total',
      accessorKey: 'grandTotal',
      cell: (row: any) => <span className="font-bold text-foreground">₹{row.grandTotal.toLocaleString()}</span>
    }
  ];

  const damageColumns = [
    {
      header: 'Date Logged',
      accessorKey: 'date',
      cell: (row: any) => new Date(row.date).toLocaleDateString()
    },
    { header: 'Log Category', accessorKey: 'category' },
    {
      header: 'Repair Cost',
      accessorKey: 'amount',
      cell: (row: any) => <span className="font-bold text-error">₹{row.amount.toLocaleString()}</span>
    },
    { header: 'Payment Mode', accessorKey: 'paymentMode' },
    { header: 'Remarks', accessorKey: 'notes', cell: (row: any) => row.notes || '—' }
  ];

  const inventoryColumns = [
    { header: 'SKU Code', accessorKey: 'sku', cell: (row: any) => <span className="font-mono text-xs text-foreground">{row.sku}</span> },
    { header: 'Item Name', accessorKey: 'name', cell: (row: any) => <span className="font-bold text-foreground">{row.name}</span> },
    { header: 'Category', accessorKey: 'category' },
    { header: 'Purchase Cost', accessorKey: 'purchaseCost', cell: (row: any) => `₹${row.purchaseCost.toLocaleString()}` },
    { header: 'Min Stock Level', accessorKey: 'minStockAlert', cell: (row: any) => <span className="font-semibold text-warning">{row.minStockAlert}</span> }
  ];

  const dispatchColumns = [
    { header: 'Dispatch Date', accessorKey: 'createdAt', cell: (row: any) => new Date(row.createdAt).toLocaleDateString() },
    { header: 'Booking ID', accessorKey: 'bookingId.bookingId', cell: (row: any) => row.bookingId?.bookingId || '—' },
    { header: 'Event Title', accessorKey: 'bookingId.eventTitle', cell: (row: any) => row.bookingId?.eventTitle || '—' },
    { header: 'Warehouse Source', accessorKey: 'warehouseId.name', cell: (row: any) => row.warehouseId?.name || '—' },
    { header: 'Driver', accessorKey: 'driverName' },
    { header: 'Vehicle Plate', accessorKey: 'vehicleNumber' },
    { header: 'Gate Pass #', accessorKey: 'gatePassNumber', cell: (row: any) => row.gatePassNumber || '—' }
  ];

  const expensesColumns = [
    { header: 'Date', accessorKey: 'date', cell: (row: any) => new Date(row.date).toLocaleDateString() },
    { header: 'Category', accessorKey: 'category', cell: (row: any) => <span className="font-semibold text-foreground">{row.category}</span> },
    { header: 'Amount Paid', accessorKey: 'amount', cell: (row: any) => <span className="font-bold text-error">₹{row.amount.toLocaleString()}</span> },
    { header: 'Mode', accessorKey: 'paymentMode' },
    { header: 'Associated Module', accessorKey: 'refModel', cell: (row: any) => row.refModel || 'Operational' },
    { header: 'Remarks', accessorKey: 'notes', cell: (row: any) => <span className="text-xs text-muted-foreground truncate max-w-[200px] block">{row.notes || '—'}</span> }
  ];

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full text-foreground">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 border-b border-border pb-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            Platform Analytics
          </h2>
          <p className="text-sm font-medium text-muted-foreground">Deep dive into user growth, category performance, and system health.</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            className="flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Stats
          </Button>
        </div>
      </div>

      {/* Tabs list pills */}
      <div className="flex flex-wrap gap-2 mb-8 bg-muted/30 p-1.5 rounded-2xl border border-border shadow-inner">
        {tabsList.map(tab => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                isActive 
                  ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <TabIcon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* RENDER ACTIVE VIEW */}
      {activeTab === 'overview' ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Row 1: 4 Mini KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            
            {/* Card 1: Total Sales */}
            <Card className="p-6 flex flex-col justify-between min-h-[140px]">
              <div>
                <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest block">Total Talent Pool (Sales)</span>
                <span className="text-3xl font-black text-foreground mt-2 block">₹ {totalSalesRevenue.toLocaleString()}</span>
              </div>
              <div className="flex items-end justify-between mt-4">
                <span className="text-xs text-error font-bold flex items-center gap-1 bg-error/10 px-2 py-0.5 rounded-full">
                  <ArrowDownRight className="w-3 h-3" /> -8.1% vs last month
                </span>
                {/* SVG Mini sparklines bar using application primary theme */}
                <svg className="w-20 h-8" viewBox="0 0 100 40">
                  <rect x="0" y="25" width="8" height="15" rx="2" fill="#8a5a32" />
                  <rect x="15" y="20" width="8" height="20" rx="2" fill="#8a5a32" />
                  <rect x="30" y="10" width="8" height="30" rx="2" fill="#8a5a32" />
                  <rect x="45" y="30" width="8" height="10" rx="2" fill="#8a5a32" opacity="0.6" />
                  <rect x="60" y="15" width="8" height="25" rx="2" fill="#8a5a32" opacity="0.6" />
                  <rect x="75" y="5" width="8" height="35" rx="2" fill="#8a5a32" />
                </svg>
              </div>
            </Card>

            {/* Card 2: Active Clients */}
            <Card className="p-6 flex flex-col justify-between min-h-[140px]">
              <div>
                <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest block">Active Recruiters (Clients)</span>
                <span className="text-3xl font-black text-foreground mt-2 block">{activeClientsCount} Clients</span>
              </div>
              <div className="flex items-end justify-between mt-4">
                <span className="text-xs text-error font-bold flex items-center gap-1 bg-error/10 px-2 py-0.5 rounded-full">
                  <ArrowDownRight className="w-3 h-3" /> -3.5% vs last month
                </span>
                {/* SVG Mini bar using terracotta highlight variation */}
                <svg className="w-20 h-8" viewBox="0 0 100 40">
                  <rect x="0" y="10" width="8" height="30" rx="2" fill="#b37542" />
                  <rect x="15" y="15" width="8" height="25" rx="2" fill="#b37542" />
                  <rect x="30" y="5" width="8" height="35" rx="2" fill="#b37542" />
                  <rect x="45" y="25" width="8" height="15" rx="2" fill="#b37542" opacity="0.6" />
                  <rect x="60" y="20" width="8" height="20" rx="2" fill="#b37542" opacity="0.6" />
                  <rect x="75" y="12" width="8" height="28" rx="2" fill="#b37542" />
                </svg>
              </div>
            </Card>

            {/* Card 3: Settlement Rate */}
            <Card className="p-6 flex flex-col justify-between min-h-[140px]">
              <div>
                <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest block">Placement Rate (Settled %)</span>
                <span className="text-3xl font-black text-foreground mt-2 block">{settlementRate}%</span>
              </div>
              <div className="mt-4">
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${settlementRate}%` }}></div>
                </div>
                <span className="text-[10px] text-emerald-600 font-bold block mt-2 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" /> +12.2% vs last month
                </span>
              </div>
            </Card>

            {/* Card 4: Platform Health */}
            <Card className="p-6 flex flex-col justify-between min-h-[140px]">
              <div>
                <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest block">Platform Health (Audit logs)</span>
                <span className="text-3xl font-black text-foreground mt-2 block">99.9%</span>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0"></span>
                <span className="text-xs font-black text-emerald-600 tracking-wider">NOMINAL</span>
                <span className="text-xs text-muted-foreground font-medium">({auditLogs.length} total events logged)</span>
              </div>
            </Card>

          </div>

          {/* Row 2: Charts (Growth & Category Performance) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Growth & Engagement (Line Chart) */}
            <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-sm font-black text-muted-foreground uppercase tracking-wider">Growth & Engagement Analysis</h3>
                  <p className="text-xs text-muted-foreground mt-1">Event Sales vs. Operating Expenses (Last 6 Months)</p>
                </div>
                <select className="text-xs bg-muted border border-border text-foreground rounded-xl px-3 py-1.5 outline-none cursor-pointer">
                  <option>Last 6 Months</option>
                </select>
              </div>

              {/* Fully dynamic responsive SVG line chart based on backend Growth Analysis */}
              <div className="h-64 relative flex items-end w-full">
                {growthAnalysis.length > 0 && pointsSales ? (
                  <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8a5a32" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#8a5a32" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#b37542" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#b37542" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    {/* Grid lines */}
                    <line x1="0" y1="12.5" x2="100" y2="12.5" stroke="currentColor" strokeOpacity="0.05" strokeWidth="0.5" />
                    <line x1="0" y1="25" x2="100" y2="25" stroke="currentColor" strokeOpacity="0.05" strokeWidth="0.5" />
                    <line x1="0" y1="37.5" x2="100" y2="37.5" stroke="currentColor" strokeOpacity="0.05" strokeWidth="0.5" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.8" />

                    {/* Gradient Area Fills */}
                    <path d={`M 0,50 L ${pointsSales} L 100,50 Z`} fill="url(#colorSales)" />
                    <path d={`M 0,50 L ${pointsExpenses} L 100,50 Z`} fill="url(#colorExpenses)" />

                    {/* Stroke lines */}
                    <path d={`M ${pointsSales}`} fill="none" stroke="#8a5a32" strokeWidth="1.5" strokeLinecap="round" />
                    <path d={`M ${pointsExpenses}`} fill="none" stroke="#b37542" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                    Generating dynamic monthly lines...
                  </div>
                )}
              </div>

              {/* Chart Legend */}
              <div className="flex gap-6 mt-4 pt-4 border-t border-border text-xs text-muted-foreground font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#8a5a32]"></span>
                  Event Sales (Revenue)
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#b37542]"></span>
                  Operational Expenses
                </div>
              </div>
            </Card>

            {/* Category Performance (Donut) */}
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-muted-foreground uppercase tracking-wider mb-1">Category Performance</h3>
                <p className="text-xs text-muted-foreground">Expenses breakdown by volume</p>
              </div>

              {/* Donut Chart Ring */}
              <div className="relative w-44 h-44 mx-auto flex items-center justify-center my-6">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeOpacity="0.05" strokeWidth="12" />
                  
                  {/* Segment 1 */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#8a5a32" strokeWidth="12" strokeDasharray={`${transportPct} 238.6`} strokeDashoffset="0" />
                  {/* Segment 2 */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#b37542" strokeWidth="12" strokeDasharray={`${materialPct} 238.6`} strokeDashoffset={`-${transportPct}`} />
                  {/* Segment 3 */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#f59e0b" strokeWidth="12" strokeDasharray={`${staffPct} 238.6`} strokeDashoffset={`-${transportPct + materialPct}`} />
                  {/* Segment 4 */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="#10b981" strokeWidth="12" strokeDasharray={`${maintenancePct + otherPct} 238.6`} strokeDashoffset={`-${transportPct + materialPct + staffPct}`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-muted-foreground uppercase font-black">Total Outflow</span>
                  <span className="text-lg font-black text-foreground">₹{totalExpensesOutflow.toLocaleString()}</span>
                </div>
              </div>

              {/* Dynamic Categories Legend */}
              <div className="space-y-2 text-xs font-bold text-muted-foreground">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#8a5a32]"></span> Transport / Fuel</span>
                  <span className="text-foreground">{transportPct}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#b37542]"></span> Material Purchases</span>
                  <span className="text-foreground">{materialPct}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span> Wages / Salaries</span>
                  <span className="text-foreground">{staffPct}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span> Repairs & Other</span>
                  <span className="text-foreground">{maintenancePct + otherPct}%</span>
                </div>
              </div>
            </Card>

          </div>

          {/* Row 3: Client Talent/Party Distribution */}
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-sm font-black text-muted-foreground uppercase tracking-wider mb-1">Top Clients & Regional Distribution</h3>
              <p className="text-xs text-muted-foreground">Sales contract valuation, collected advances, and operating profitability ratio.</p>
            </div>

            {/* Table layout */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-medium text-slate-400">
                <thead>
                  <tr className="border-b border-border text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                    <th className="pb-3">Client / Venue</th>
                    <th className="pb-3">Total Value</th>
                    <th className="pb-3">Settlement</th>
                    <th className="pb-3 text-right">Profit Heat Map</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {recentBookings.map((b, idx) => {
                    const collectPct = b.grandTotal > 0 ? Math.round((b.advancePaid / b.grandTotal) * 100) : 0;
                    return (
                      <tr key={b._id}>
                        <td className="py-4">
                          <span className="font-bold text-foreground block">{b.eventTitle}</span>
                          <span className="text-[10px] text-muted-foreground block">{b.customerName}</span>
                        </td>
                        <td className="py-4 font-bold text-foreground">₹{b.grandTotal.toLocaleString()}</td>
                        <td className="py-4 text-emerald-600 font-bold">+{collectPct}%</td>
                        <td className="py-4">
                          <div className="flex items-center justify-end gap-3">
                            <span className="text-[10px] font-mono text-muted-foreground">{collectPct}%</span>
                            <div className="w-24 bg-muted h-2 rounded-full overflow-hidden">
                              {/* Gradient profit heat bar */}
                              <div className="bg-gradient-to-r from-[#8a5a32] to-[#b37542] h-full rounded-full" style={{ width: `${collectPct}%` }}></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {recentBookings.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">No active bookings datasets loaded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
          {loadingLists ? (
            <div className="flex flex-col items-center justify-center min-h-[250px] gap-2 text-muted-foreground">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs">Loading ledger tables...</p>
            </div>
          ) : activeTab === 'gst' ? (
            <Card className="p-6">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-foreground">GST Tax Ledger Report</h3>
                  <p className="text-xs text-muted-foreground mt-1">Historical list of CGST and SGST collections from all tax invoices.</p>
                </div>
                <div className="bg-primary/10 text-primary border border-primary/20 rounded-2xl px-4 py-2.5 text-center">
                  <span className="text-[10px] uppercase font-black text-muted-foreground block">Total GST Collected</span>
                  <span className="text-lg font-black">₹{gstData.reduce((acc, c) => acc + (c.taxAmount || 0), 0).toLocaleString()}</span>
                </div>
              </div>
              <DataTable columns={gstColumns} data={gstData} />
            </Card>
          ) : activeTab === 'damage' ? (
            <Card className="p-6">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-foreground">Damage, Scrap & Repair Logs</h3>
                  <p className="text-xs text-muted-foreground mt-1">Broken material maintenance log history and scrap write-offs.</p>
                </div>
                <div className="bg-error/10 text-error border border-error/20 rounded-2xl px-4 py-2.5 text-center">
                  <span className="text-[10px] uppercase font-black text-muted-foreground block">Total Repair Losses</span>
                  <span className="text-lg font-black">₹{damageData.reduce((acc, c) => acc + (c.amount || 0), 0).toLocaleString()}</span>
                </div>
              </div>
              <DataTable columns={damageColumns} data={damageData} />
            </Card>
          ) : activeTab === 'inventory' ? (
            <Card className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-black text-foreground">Inventory Stock Status</h3>
                <p className="text-xs text-muted-foreground mt-1">Valuation list of all warehouse catalog models and purchase rates.</p>
              </div>
              <DataTable columns={inventoryColumns} data={inventoryData} />
            </Card>
          ) : activeTab === 'dispatch' ? (
            <Card className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-black text-foreground">Logistics Dispatch Gatepasses</h3>
                <p className="text-xs text-muted-foreground mt-1">Vehicle loading dispatches records index.</p>
              </div>
              <DataTable columns={dispatchColumns} data={dispatchData} />
            </Card>
          ) : (
            <Card className="p-6">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-foreground">Operational Expenses Ledger</h3>
                  <p className="text-xs text-muted-foreground mt-1">Operational costs audit trail.</p>
                </div>
                <div className="bg-error/10 text-error border border-error/20 rounded-2xl px-4 py-2.5 text-center">
                  <span className="text-[10px] uppercase font-black text-muted-foreground block">Total Outflow Sum</span>
                  <span className="text-lg font-black">₹{totalExpensesOutflow.toLocaleString()}</span>
                </div>
              </div>
              <DataTable columns={expensesColumns} data={expensesData.list || []} />
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
export default AnalyticsView;
