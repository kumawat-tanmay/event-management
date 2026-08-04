'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Warehouse, Zone, Rack } from '@/lib/services/warehouse.services';
import { warehouseService } from '@/lib/services/warehouse.services';
import { 
  Building2, Layers, Plus, Trash2, X, Loader2, Save, ArrowLeft, Search, AlertTriangle, Download, FileSpreadsheet, UploadCloud
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import { ConfirmModal } from '@/components/common/ConfirmModal';

interface LayoutFormProps {
  id: string;
}

export default function LayoutForm({ id }: LayoutFormProps) {
  const { t } = useTranslation();
  const router = useRouter();

  // Search filter for zones
  const [searchQuery, setSearchQuery] = useState('');

  // Local state for layout builder
  const [localZones, setLocalZones] = useState<Zone[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [deleteZoneIndex, setDeleteZoneIndex] = useState<number | null>(null);
  const [savingWarehouse, setSavingWarehouse] = useState(false);

  // Bulk Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [targetWarehouseId, setTargetWarehouseId] = useState(id);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Fetch all warehouses for target selection in modal
  const { data: allWarehouses = [] } = useSWR<Warehouse[]>('warehouses', warehouseService.getWarehouses);
  const activeWarehouses = (allWarehouses || []).filter(w => w.isActive);

  useEffect(() => {
    if (id) setTargetWarehouseId(id);
  }, [id]);

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
  const parseSpreadsheetToZones = async (file: File): Promise<Zone[]> => {
    let arrayBuffer: ArrayBuffer | null = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    arrayBuffer = null; // Free arrayBuffer RAM immediately

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (rows.length === 0) return [];

    const zoneMap: { [key: string]: { name: string; description: string; racks: Rack[] } } = {};

    rows.forEach((row) => {
      // Flexible column header matching
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

      const updatedWh = await warehouseService.bulkImportLayout(targetWarehouseId, {
        zones: importedZones,
        mode: importMode
      });

      toast.success(`Successfully imported ${importedZones.length} zones into warehouse layout`);
      setIsImportModalOpen(false);
      setImportFile(null);

      // If imported into currently active warehouse page, sync local state
      if (targetWarehouseId === id) {
        setLocalZones(JSON.parse(JSON.stringify(updatedWh.zones || [])));
        setHasChanges(false);
        await mutate();
      } else {
        toast.success(`Updated layout for selected warehouse`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to import layout');
    } finally {
      setIsImporting(false);
    }
  };

  // Fetch Warehouse Layout
  const { data: warehouse, isLoading, error, mutate } = useSWR<Warehouse>(
    id ? ['warehouse', id] : null,
    () => warehouseService.getWarehouseById(id)
  );

  // Load zones into local state
  useEffect(() => {
    if (warehouse) {
      setLocalZones(JSON.parse(JSON.stringify(warehouse.zones || [])));
      setHasChanges(false);
    } else {
      setLocalZones([]);
      setHasChanges(false);
    }
  }, [warehouse]);

  // Add Zone locally
  const handleAddZone = () => {
    const newZoneName = `Zone ${localZones.length + 1}`;
    setLocalZones(prev => [
      ...prev,
      {
        name: newZoneName,
        description: '',
        racks: []
      }
    ]);
    setHasChanges(true);
  };

  // Update Zone locally
  const handleUpdateZone = (index: number, field: 'name' | 'description', value: string) => {
    setLocalZones(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
    setHasChanges(true);
  };

  // Remove Zone locally
  const handleRemoveZone = (index: number) => {
    setDeleteZoneIndex(index);
  };

  const confirmRemoveZone = () => {
    if (deleteZoneIndex === null) return;
    setLocalZones(prev => prev.filter((_, idx) => idx !== deleteZoneIndex));
    setHasChanges(true);
    setDeleteZoneIndex(null);
  };

  // Add Rack locally inside Zone
  const handleAddRack = (zoneIndex: number) => {
    setLocalZones(prev => {
      const updated = [...prev];
      const newRackName = `Rack ${updated[zoneIndex].racks.length + 1}`;
      updated[zoneIndex].racks = [
        ...updated[zoneIndex].racks,
        {
          name: newRackName,
          capacity: '500',
          description: ''
        }
      ];
      return updated;
    });
    setHasChanges(true);
  };

  const handleUpdateRack = (zoneIndex: number, rackIndex: number, field: 'name' | 'capacity', value: string) => {
    setLocalZones(prev => {
      const updated = [...prev];
      const updatedRacks = [...updated[zoneIndex].racks];
      updatedRacks[rackIndex] = {
        ...updatedRacks[rackIndex],
        [field]: value
      };
      updated[zoneIndex].racks = updatedRacks;
      return updated;
    });
    setHasChanges(true);
  };

  // Remove Rack locally
  const handleRemoveRack = (zoneIndex: number, rackIndex: number) => {
    setLocalZones(prev => {
      const updated = [...prev];
      updated[zoneIndex].racks = updated[zoneIndex].racks.filter((_, idx) => idx !== rackIndex);
      return updated;
    });
    setHasChanges(true);
  };

  // Submit back to DB
  const handleSaveLayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouse) return;

    // Validate
    for (let z = 0; z < localZones.length; z++) {
      if (!localZones[z].name.trim()) {
        toast.error(`Zone ${z + 1} must have a name`);
        return;
      }
      for (let r = 0; r < localZones[z].racks.length; r++) {
        if (!localZones[z].racks[r].name.trim()) {
          toast.error(`Rack ${r + 1} in Zone "${localZones[z].name}" must have a name`);
          return;
        }
      }
    }

    setSavingWarehouse(true);
    try {
      const payload = {
        name: warehouse.name,
        isActive: warehouse.isActive,
        zones: localZones,
        managerId: warehouse.managerId ? (warehouse.managerId as any)._id || warehouse.managerId : undefined,
      };

      await warehouseService.updateWarehouse(warehouse._id, payload);
      toast.success('Warehouse layout saved successfully');
      setHasChanges(false);
      await mutate();
      router.push(`/inventory/warehouse-layout/${id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save layout');
    } finally {
      setSavingWarehouse(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // Search filter
  const filteredZones = useMemo(() => {
    return localZones.map((zone, index) => ({ zone, originalIndex: index }))
      .filter(item => 
        item.zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.zone.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [localZones, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !warehouse) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center p-6">
        <Building2 className="w-12 h-12 text-error mb-4 opacity-50" />
        <h3 className="text-base font-extrabold text-foreground">Failed to Load Warehouse Layout Form</h3>
        <Button onClick={() => router.push('/inventory/warehouse-layout')} className="mt-4" size="sm">
          Return to Directory
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 w-full gap-6 font-sans">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={handleCancel}
            className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted text-muted-foreground transition-all shrink-0 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded uppercase">
                {warehouse.code || 'NO-CODE'}
              </span>
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> {warehouse.address}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mt-0.5">
              Edit {warehouse.name} Layout
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={savingWarehouse}
            className="h-10 px-4"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="layout-form-editor"
            variant="primary"
            className="flex items-center gap-2 h-10 px-5 shadow-sm"
            disabled={savingWarehouse}
          >
            {savingWarehouse ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Layout</span>
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="flex items-center gap-2 p-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 animate-bounce" /> Unsaved adjustments made. Press "Save Layout" above to sync changes.
        </div>
      )}

      {/* Main Layout Editor Form */}
      <form id="layout-form-editor" onSubmit={handleSaveLayoutSubmit} className="space-y-6">
        
        {/* Layout Builder Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-4 border border-border rounded-2xl">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
              Warehouse Layout
            </h3>
            
            {localZones.length > 5 && (
              <div className="relative w-64">
                <Input 
                  placeholder="Filter zones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-background"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button 
              type="button" 
              onClick={handleDownloadExcelTemplate} 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1.5 font-bold"
            >
              <Download className="w-3.5 h-3.5" /> Download Template (.xlsx)
            </Button>

            <Button 
              type="button" 
              onClick={() => setIsImportModalOpen(true)} 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1.5 font-bold text-primary border-primary/30"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Bulk Import CSV
            </Button>

            <Button 
              type="button" 
              onClick={handleAddZone} 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1.5 font-bold"
            >
              <Plus className="w-3.5 h-3.5" /> Add Zone
            </Button>
          </div>
        </div>

        {/* Zones List Cards */}
        {filteredZones.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/30">
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No zones matched your filter.' : 'No zones added yet. Click "Add Zone" to begin configuration.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredZones.map(({ zone, originalIndex }) => (
              <div 
                key={originalIndex} 
                className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-5 hover:shadow-md transition-shadow"
              >
                
                {/* Zone metadata inputs */}
                <div className="flex items-start gap-4">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Zone Name</label>
                      <Input 
                        value={zone.name} 
                        onChange={(e) => handleUpdateZone(originalIndex, 'name', e.target.value)}
                        placeholder="Zone Name" 
                        required
                        className="h-9 text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Description (Optional)</label>
                      <Input 
                        value={zone.description || ''} 
                        onChange={(e) => handleUpdateZone(originalIndex, 'description', e.target.value)}
                        placeholder="Description (Optional)" 
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    onClick={() => handleRemoveZone(originalIndex)} 
                    variant="outline" 
                    className="text-error border-error/20 hover:bg-error/10 h-9 px-3 mt-5 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Racks list in Zone */}
                <div className="pl-4 border-l-2 border-border/70 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h5 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      Racks in {zone.name || 'Unlabeled Zone'}
                    </h5>
                    <button 
                      type="button" 
                      onClick={() => handleAddRack(originalIndex)} 
                      className="text-xs font-bold gap-1 text-primary hover:underline flex items-center"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Rack
                    </button>
                  </div>
                  
                  {zone.racks.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground italic py-1 pl-4">No racks configured in this zone.</p>
                  ) : (
                    <div className="space-y-2 max-w-2xl">
                      {zone.racks.map((rack, rIndex) => (
                        <div key={rIndex} className="flex gap-3 items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          <div className="flex-1">
                            <Input 
                              value={rack.name} 
                              onChange={(e) => handleUpdateRack(originalIndex, rIndex, 'name', e.target.value)}
                              placeholder="Rack Name" 
                              className="h-8 text-xs font-bold"
                              required
                            />
                          </div>
                          <div className="w-40">
                            <Input 
                              value={rack.capacity || ''} 
                              onChange={(e) => handleUpdateRack(originalIndex, rIndex, 'capacity', e.target.value)}
                              placeholder="Capacity (e.g. 500)" 
                              className="h-8 text-xs text-center"
                            />
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveRack(originalIndex, rIndex)} 
                            className="text-muted-foreground hover:text-error transition-colors p-1"
                            title="Delete Rack"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </form>

      {/* Bulk Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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

      <ConfirmModal
        isOpen={deleteZoneIndex !== null}
        title="Delete Zone"
        message="Are you sure you want to delete this zone and all its racks locally?"
        onConfirm={confirmRemoveZone}
        onClose={() => setDeleteZoneIndex(null)}
        isDestructive={true}
      />
    </div>
  );
}

