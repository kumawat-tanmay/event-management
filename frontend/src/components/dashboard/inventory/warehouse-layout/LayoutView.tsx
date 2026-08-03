'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Warehouse } from '@/lib/services/warehouse.services';
import { warehouseService } from '@/lib/services/warehouse.services';
import { Building2, Search, ArrowRight, Layout, Sliders, Layers, Loader2, Download, FileSpreadsheet, UploadCloud, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';

export default function LayoutView() {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Warehouses
  const { data: warehouses = [], isLoading, mutate } = useSWR<Warehouse[]>(
    'warehouses',
    warehouseService.getWarehouses
  );

  const activeWarehouses = warehouses.filter(w => w.isActive);

  // Bulk Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [targetWarehouseId, setTargetWarehouseId] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Excel Template Downloader (.xlsx)
  const handleDownloadExcelTemplate = () => {
    const sampleData = [
      {
        "Zone Name": "Zone A",
        "Zone Description": "Main Tent Storage",
        "Rack Name": "Rack A-1",
        "Rack Capacity": "500"
      },
      {
        "Zone Name": "Zone A",
        "Zone Description": "Main Tent Storage",
        "Rack Name": "Rack A-2",
        "Rack Capacity": "500"
      },
      {
        "Zone Name": "Zone B",
        "Zone Description": "Catering & Crockery",
        "Rack Name": "Rack B-1",
        "Rack Capacity": "1000"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Layout Template");
    XLSX.writeFile(workbook, "warehouse_layout_template.xlsx");
    toast.success('Excel template (.xlsx) downloaded');
  };

  // CSV Template Downloader (.csv)
  const handleDownloadCSVTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Zone Name,Zone Description,Rack Name,Rack Capacity\n" +
      "Zone A,Main Tent Storage,Rack A-1,500\n" +
      "Zone A,Main Tent Storage,Rack A-2,500\n" +
      "Zone B,Catering & Crockery,Rack B-1,1000\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "warehouse_layout_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV template (.csv) downloaded');
  };

  // Universal Spreadsheet Reader (.xlsx, .xls, .csv) with instant memory release
  const parseSpreadsheetToZones = async (file: File) => {
    let arrayBuffer: ArrayBuffer | null = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    arrayBuffer = null; // Free arrayBuffer RAM immediately

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (rows.length === 0) return [];

    const zoneMap: { [key: string]: { name: string; description: string; racks: any[] } } = {};

    rows.forEach((row) => {
      const zoneName = String(
        row['Zone Name'] || row['Zone'] || row['zone_name'] || row['ZoneName'] || row['GODOWN ZONE'] || Object.values(row)[0] || ''
      ).trim();

      if (!zoneName) return;

      const zoneDesc = String(
        row['Zone Description'] || row['Description'] || row['zone_description'] || row['Desc'] || Object.values(row)[1] || ''
      ).trim();

      const rackName = String(
        row['Rack Name'] || row['Rack'] || row['rack_name'] || row['RackName'] || Object.values(row)[2] || ''
      ).trim();

      const rackCapacity = String(
        row['Rack Capacity'] || row['Capacity'] || row['rack_capacity'] || row['Cap'] || Object.values(row)[3] || '500'
      ).trim();

      const zoneKey = zoneName.toLowerCase();
      if (!zoneMap[zoneKey]) {
        zoneMap[zoneKey] = {
          name: zoneName,
          description: zoneDesc,
          racks: []
        };
      }

      if (rackName) {
        zoneMap[zoneKey].racks.push({
          name: rackName,
          capacity: rackCapacity,
          description: ''
        });
      }
    });

    return Object.values(zoneMap);
  };

  // Bulk Import Form Submit
  const handleBulkImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      toast.error('Please select an Excel or CSV file to import');
      return;
    }
    if (!targetWarehouseId) {
      toast.error('Please select a target warehouse');
      return;
    }

    setIsImporting(true);
    try {
      const importedZones = await parseSpreadsheetToZones(importFile);

      if (importedZones.length === 0) {
        toast.error('No valid zone data found in spreadsheet file');
        setIsImporting(false);
        return;
      }

      await warehouseService.bulkImportLayout(targetWarehouseId, {
        zones: importedZones as any,
        mode: importMode
      });

      toast.success(`Successfully imported ${importedZones.length} zones into warehouse layout`);
      setIsImportModalOpen(false);
      setImportFile(null);
      await mutate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to import layout');
    } finally {
      setIsImporting(false);
    }
  };

  // Filter warehouses based on search query
  const filteredWarehouses = useMemo(() => {
    return activeWarehouses.filter(wh => 
      wh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (wh.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (wh.code || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeWarehouses, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full gap-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sliders className="w-6 h-6 text-primary" />
            Storage Layouts Directory
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select a Warehouse to view its zones, racks, and storage configurations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Input 
              placeholder="Search warehouses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>

          <Button 
            type="button" 
            onClick={handleDownloadExcelTemplate} 
            variant="outline" 
            className="h-10 text-xs font-bold gap-1.5"
          >
            <Download className="w-4 h-4" /> Download Template (.xlsx)
          </Button>

          <Button 
            type="button" 
            onClick={() => setIsImportModalOpen(true)} 
            variant="primary" 
            className="h-10 text-xs font-bold gap-1.5 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" /> Bulk Import CSV
          </Button>
        </div>
      </div>

      {/* Main Grid List */}
      {filteredWarehouses.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-muted/10 border border-dashed border-border rounded-2xl">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary" />
          <p className="text-sm font-medium">No warehouses matched your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWarehouses.map((wh) => {
            const zonesCount = wh.zones?.length || 0;
            const racksCount = wh.zones?.reduce((acc, z) => acc + (z.racks?.length || 0), 0) || 0;

            return (
              <Card 
                key={wh._id}
                className="border border-border shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 flex flex-col h-full rounded-2xl overflow-hidden"
              >
                <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/10 p-5 border-b border-border flex flex-row items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                      Code: {wh.code || 'N/A'}
                    </span>
                    <CardTitle className="text-base font-extrabold text-foreground truncate mt-0.5">
                      {wh.name}
                    </CardTitle>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                </CardHeader>

                <CardContent className="p-5 flex-1 flex flex-col justify-between gap-4 bg-card">
                  {/* Warehouse stats */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-6">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Zones</span>
                        <div className="text-base font-black text-foreground flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-primary" />
                          {zonesCount}
                        </div>
                      </div>
                      <div className="w-px h-8 bg-border" />
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Racks</span>
                        <div className="text-base font-black text-foreground flex items-center gap-1">
                          <Layout className="w-3.5 h-3.5 text-primary" />
                          {racksCount}
                        </div>
                      </div>
                    </div>

                    {/* Zone list badges preview */}
                    {wh.zones && wh.zones.length > 0 ? (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Zones Overview:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {wh.zones.slice(0, 4).map((z, idx) => (
                            <span 
                              key={idx}
                              className="text-[11px] font-bold bg-zinc-100 dark:bg-zinc-800/90 text-foreground dark:text-zinc-100 px-2.5 py-1 rounded-lg border border-border/60 shadow-xs"
                            >
                              {z.name || `Zone ${idx + 1}`}
                            </span>
                          ))}
                          {wh.zones.length > 4 && (
                            <span className="text-[11px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-lg border border-primary/20">
                              +{wh.zones.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground italic">No zones configured yet.</p>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-3 pt-3 border-t border-border mt-2">
                    <button
                      onClick={() => router.push(`/inventory/warehouse-layout/${wh._id}`)}
                      className="flex-1 h-9 flex items-center justify-center gap-1.5 text-xs font-bold text-primary hover:bg-primary/5 border border-primary/20 rounded-xl transition-all cursor-pointer"
                    >
                      View Layout
                    </button>
                    <button
                      onClick={() => router.push(`/inventory/warehouse-layout/${wh._id}/edit`)}
                      className="flex-1 h-9 flex items-center justify-center gap-1.5 text-xs font-bold bg-primary hover:bg-primary/95 text-white rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      Edit Layout
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Bulk Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans">
            <div className="p-5 border-b border-border flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                Bulk Import Zones & Racks
              </h3>
              <button 
                type="button"
                onClick={() => setIsImportModalOpen(false)} 
                className="p-1 rounded-full text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkImportSubmit} className="p-6 space-y-5">
              
              {/* Target Warehouse Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Target Warehouse *
                </label>
                <select 
                  className="w-full h-10 px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground font-semibold"
                  value={targetWarehouseId}
                  onChange={(e) => setTargetWarehouseId(e.target.value)}
                  required
                  disabled={isImporting}
                >
                  <option value="" disabled>-- Select Target Warehouse --</option>
                  {activeWarehouses.map(wh => (
                    <option key={wh._id} value={wh._id}>
                      {wh.name} ({wh.code || 'No Code'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Import Mode Radio selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Import Action Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${importMode === 'merge' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <input 
                      type="radio" 
                      name="importMode" 
                      value="merge" 
                      checked={importMode === 'merge'} 
                      onChange={() => setImportMode('merge')} 
                      className="mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-foreground block">Merge / Append</span>
                      <span className="text-[10px] text-muted-foreground leading-tight block mt-0.5">
                        Keeps existing zones and appends new zones/racks from CSV.
                      </span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${importMode === 'replace' ? 'border-error bg-error/5' : 'border-border'}`}>
                    <input 
                      type="radio" 
                      name="importMode" 
                      value="replace" 
                      checked={importMode === 'replace'} 
                      onChange={() => setImportMode('replace')} 
                      className="mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-foreground block">Replace / Overwrite</span>
                      <span className="text-[10px] text-muted-foreground leading-tight block mt-0.5">
                        Replaces existing zones and racks entirely with CSV.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Interactive Drag & Drop File upload Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Upload Spreadsheet File (.xlsx, .xls, .csv) *
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) setImportFile(file);
                  }}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                    isDragging 
                      ? 'border-primary bg-primary/10' 
                      : importFile 
                      ? 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10' 
                      : 'border-border hover:border-primary/50 bg-zinc-50/50 dark:bg-zinc-900/30'
                  }`}
                >
                  {importFile ? (
                    <div className="flex items-center gap-3 w-full justify-between px-2">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileSpreadsheet className="w-8 h-8 text-primary shrink-0" />
                        <div className="text-left min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{importFile.name}</p>
                          <p className="text-[10px] text-muted-foreground">{(importFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-primary hover:underline shrink-0">Change File</span>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-primary/70 mb-1" />
                      <p className="text-xs font-bold text-foreground">Click box or Drag & Drop spreadsheet file</p>
                      <p className="text-[10px] text-muted-foreground">Supports .xlsx, .xls, and .csv files</p>
                    </>
                  )}
                  <input 
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border mt-4">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Sample Templates:</span>
                  <button
                    type="button"
                    onClick={handleDownloadExcelTemplate}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> Excel (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCSVTemplate}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> CSV (.csv)
                  </button>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsImportModalOpen(false)}
                    disabled={isImporting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    className="flex items-center gap-2 h-9 px-4 font-bold"
                    disabled={isImporting}
                  >
                    {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                    <span>Upload & Import</span>
                  </Button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

