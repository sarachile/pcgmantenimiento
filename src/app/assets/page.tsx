
"use client";

import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Search, 
  Plus, 
  Construction, 
  MapPin, 
  History,
  MoreVertical,
  Loader2,
  ArrowLeft,
  Edit,
  Trash2,
  Cpu,
  Zap
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Asset, AssetStatus, IoTType } from "@/lib/types";

export default function AssetsPage() {
  const { profile, isLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  
  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    location: "",
    status: "activo" as AssetStatus,
    isIoT: false,
    iotType: "otro" as IoTType,
    unit: ""
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const assetsQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return collection(db, "companies", profile.companyId, "assets");
  }, [db, profile?.companyId]);

  const { data: assets, isLoading: isAssetsLoading } = useCollection<Asset>(assetsQuery);

  const realAssets = assets || [];

  const filtered = realAssets.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !profile?.companyId) return;

    const dataToSave = {
      ...formData,
      companyId: profile.companyId,
      updatedAt: serverTimestamp(),
    };

    if (editingAsset) {
      const assetRef = doc(db, "companies", profile.companyId, "assets", editingAsset.id);
      updateDocumentNonBlocking(assetRef, dataToSave);
      toast({ title: "Activo actualizado", description: "Los datos han sido guardados." });
    } else {
      const colRef = collection(db, "companies", profile.companyId, "assets");
      addDocumentNonBlocking(colRef, {
        ...dataToSave,
        createdAt: serverTimestamp(),
        lastValue: 0,
        maintenanceRequired: false
      });
      toast({ title: "Activo registrado", description: "Nuevo equipo añadido al catálogo." });
    }

    setIsCreateOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      location: "",
      status: "activo",
      isIoT: false,
      iotType: "otro",
      unit: ""
    });
    setEditingAsset(null);
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      code: asset.code,
      location: asset.location,
      status: asset.status,
      isIoT: asset.isIoT || false,
      iotType: asset.iotType || "otro",
      unit: asset.unit || ""
    });
    setIsCreateOpen(true);
  };

  const handleDelete = (asset: Asset) => {
    if (!db || !profile?.companyId) return;
    const assetRef = doc(db, "companies", profile.companyId, "assets", asset.id);
    deleteDocumentNonBlocking(assetRef);
    toast({ title: "Activo eliminado", description: "El equipo ha sido removido del sistema." });
  };

  const formatDate = (date: any) => {
    if (!mounted || !date) return 'Sin registros';
    try {
      const d = date?.toDate ? date.toDate() : (typeof date === 'string' ? new Date(date) : date);
      return d.toLocaleDateString();
    } catch (e) {
      return 'N/A';
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild title="Volver al escritorio">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Activos y Equipos</h2>
            <p className="text-muted-foreground">Catálogo maestro de maquinaria sujeta a mantenimiento.</p>
          </div>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="font-bold shadow-lg gap-2">
              <Plus className="h-4 w-4" /> Nuevo Activo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic tracking-tight">
                {editingAsset ? "Editar Activo" : "Registrar Nuevo Activo"}
              </DialogTitle>
              <DialogDescription>Defina las características técnicas del equipo.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Nombre del Equipo</Label>
                  <Input 
                    placeholder="Ej: Grupo Electrógeno 500kVA" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Código Interno</Label>
                  <Input 
                    placeholder="Ej: GE-001" 
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Estado Inicial</Label>
                  <Select value={formData.status} onValueChange={(v: any) => setFormData({...formData, status: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Operativo</SelectItem>
                      <SelectItem value="inactivo">Fuera de Servicio</SelectItem>
                      <SelectItem value="en mantenimiento">En Mantención</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Ubicación / Planta</Label>
                <Input 
                  placeholder="Ej: Sala Técnica Piso -1" 
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  required
                />
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-blue-600" />
                    <Label className="font-black text-sm uppercase tracking-tighter">Configuración IoT</Label>
                  </div>
                  <Switch checked={formData.isIoT} onCheckedChange={(v) => setFormData({...formData, isIoT: v})} />
                </div>
                
                {formData.isIoT && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase text-slate-400">Tipo de Sensor</Label>
                      <Select value={formData.iotType} onValueChange={(v: any) => setFormData({...formData, iotType: v})}>
                        <SelectTrigger className="h-10 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solar">Solar (kW)</SelectItem>
                          <SelectItem value="temperatura">Temperatura (°C)</SelectItem>
                          <SelectItem value="vibracion">Vibración (Hz)</SelectItem>
                          <SelectItem value="presion">Presión (Bar)</SelectItem>
                          <SelectItem value="otro">Genérico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase text-slate-400">Unidad Medida</Label>
                      <Input 
                        placeholder="Ej: kW, °C, Bar" 
                        className="h-10 text-xs"
                        value={formData.unit}
                        onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      />
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full h-12 font-black uppercase tracking-widest shadow-xl">
                  {editingAsset ? "Guardar Cambios" : "Activar Activo en Sistema"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre, código o ubicación..." 
                className="pl-10 h-11 bg-slate-50/50 border-none rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isAssetsLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sincronizando Catálogo...</p>
            </div>
          ) : realAssets.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground border-2 border-dashed rounded-3xl bg-slate-50/50">
              <Construction className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-bold">No hay activos registrados.</p>
              <p className="text-xs">Comience por añadir su primera máquina o equipo.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest pl-6">Equipo / Código</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Ubicación</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Modo</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Estado</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest">Última Mantención</TableHead>
                  <TableHead className="text-right pr-6 font-black text-[10px] uppercase tracking-widest">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((asset) => (
                  <TableRow key={asset.id} className="hover:bg-slate-50 transition-colors group">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/5 p-2 rounded-lg">
                          <Construction className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{asset.name}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">{asset.code}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {asset.location}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {asset.isIoT ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[8px] font-black uppercase gap-1 px-2">
                          <Zap className="h-2 w-2" /> IoT
                        </Badge>
                      ) : (
                        <span className="text-[8px] font-black text-slate-300 uppercase">Manual</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[9px] font-black uppercase px-3",
                        asset.status === 'activo' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                        asset.status === 'inactivo' && "bg-rose-50 text-rose-700 border-rose-200",
                        asset.status === 'en mantenimiento' && "bg-amber-50 text-amber-700 border-amber-200"
                      )}>
                        {asset.status === 'activo' ? 'Operativo' : asset.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] font-bold text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <History className="h-3 w-3 opacity-50" />
                        {formatDate(asset.lastMaintenanceAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-xl">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-none">
                          <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400">Gestión Activo</DropdownMenuLabel>
                          <DropdownMenuItem className="font-bold gap-2" onClick={() => handleEdit(asset)}>
                            <Edit className="h-4 w-4 text-blue-600" /> Editar Datos
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="font-bold gap-2 text-rose-600" onClick={() => handleDelete(asset)}>
                            <Trash2 className="h-4 w-4" /> Eliminar Activo
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
