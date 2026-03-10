
"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  MoreVertical,
  Trash2,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Building2,
  CalendarDays,
  Target,
  ShieldCheck,
  Zap,
  ArrowRight,
  Copy,
  Edit2,
  X,
  AlertTriangle,
  Clock,
  Timer,
  History,
  RefreshCcw,
  Archive,
  CheckSquare,
  Square
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { WorkOrder, Client, OTStatus } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export default function WorkOrdersPage() {
  const { profile, isLoading: isUserLoading, isTechnician, isCompanyAdmin, isSupervisor } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("active"); // 'active' | 'archived'
  const [mounted, setMounted] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Limpiar selección al cambiar de pestaña
  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab]);

  const workOrdersQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return collection(db, "companies", profile.companyId, "workOrders");
  }, [db, profile?.companyId]);

  const { data: rawWorkOrders, isLoading: isOrdersLoading } = useCollection<WorkOrder>(workOrdersQuery);

  const clientsQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return collection(db, "companies", profile.companyId, "clients");
  }, [db, profile?.companyId]);

  const { data: clients } = useCollection<Client>(clientsQuery);

  const handleDelete = (id: string) => {
    if (!profile?.companyId) return;
    const docRef = doc(db!, "companies", profile.companyId, "workOrders", id);
    updateDocumentNonBlocking(docRef, { isDeleted: true, updatedAt: serverTimestamp() });
    toast({ title: "Orden archivada", description: "La orden ha sido movida al histórico por seguridad." });
  };

  const handleRestore = (id: string) => {
    if (!profile?.companyId) return;
    const docRef = doc(db!, "companies", profile.companyId, "workOrders", id);
    updateDocumentNonBlocking(docRef, { isDeleted: false, updatedAt: serverTimestamp() });
    toast({ title: "Orden restaurada", description: "La orden ha vuelto al panel de operaciones activas." });
  };

  const handlePermanentDelete = (id: string) => {
    if (!profile?.companyId) return;
    const docRef = doc(db!, "companies", profile.companyId, "workOrders", id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Orden Eliminada", description: "El registro ha sido borrado definitivamente." });
  };

  const handleBulkDelete = async () => {
    if (!profile?.companyId || selectedIds.length === 0) return;
    
    setIsBulkDeleting(true);
    try {
      selectedIds.forEach(id => {
        const docRef = doc(db!, "companies", profile!.companyId, "workOrders", id);
        deleteDocumentNonBlocking(docRef);
      });
      
      toast({ 
        title: "Eliminación Masiva", 
        description: `Se han eliminado ${selectedIds.length} órdenes del histórico.` 
      });
      setSelectedIds([]);
    } catch (e) {
      toast({ title: "Error", description: "No se pudieron eliminar todos los registros.", variant: "destructive" });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const workOrders = useMemo(() => {
    if (!rawWorkOrders) return [];
    
    // Filtrar según la pestaña activa (Activas vs Archivadas)
    let list = rawWorkOrders.filter(ot => {
      if (activeTab === 'archived') return ot.isDeleted === true;
      return ot.isDeleted !== true;
    });
    
    if (isTechnician && profile) {
      return list.filter(ot => 
        ot.assignedToStaffIds?.includes(profile.id) || 
        ot.assignedToStaffIds?.includes(profile.staffId || '')
      );
    }
    return list;
  }, [rawWorkOrders, isTechnician, profile, activeTab]);

  const filteredOTs = useMemo(() => {
    return workOrders.filter(ot => {
      const client = clients?.find(c => c.id === ot.clientId);
      
      const matchesSearch = 
        ot.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ot.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || ot.status === statusFilter;
      const matchesClient = clientFilter === "all" || ot.clientId === clientFilter;
      const matchesUrgency = urgencyFilter === "all" || ot.urgency === urgencyFilter;

      return matchesSearch && matchesStatus && matchesClient && matchesUrgency;
    }).sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (typeof a.createdAt === 'string' ? parseISO(a.createdAt) : new Date(0));
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (typeof b.createdAt === 'string' ? parseISO(b.createdAt) : new Date(0));
      return dateB.getTime() - dateA.getTime();
    });
  }, [workOrders, searchTerm, statusFilter, clientFilter, urgencyFilter, clients]);

  const groupedOTs = useMemo(() => {
    const groups: Record<string, { label: string, orders: WorkOrder[] }> = {};
    filteredOTs.forEach(ot => {
      const date = ot.createdAt?.toDate ? ot.createdAt.toDate() : (typeof ot.createdAt === 'string' ? parseISO(ot.createdAt) : new Date());
      const monthKey = format(date, "yyyy-MM");
      const monthLabel = format(date, "MMMM yyyy", { locale: es });
      if (!groups[monthKey]) groups[monthKey] = { label: monthLabel, orders: [] };
      groups[monthKey].orders.push(ot);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredOTs]);

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setClientFilter("all");
    setUrgencyFilter("all");
    setSelectedIds([]);
  };

  const handleSelectOT = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleSelectGroup = (orders: WorkOrder[], checked: boolean) => {
    const orderIds = orders.map(o => o.id);
    if (checked) {
      setSelectedIds(prev => Array.from(new Set([...prev, ...orderIds])));
    } else {
      setSelectedIds(prev => prev.filter(id => !orderIds.includes(id)));
    }
  };

  const hasActiveFilters = searchTerm !== "" || statusFilter !== "all" || clientFilter !== "all" || urgencyFilter !== "all";

  if (isUserLoading || !mounted) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const isAdminOrSupervisor = isCompanyAdmin || isSupervisor;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprobada':
        return <Badge className="bg-emerald-500 text-white font-black uppercase text-[9px] tracking-widest px-3 h-6 rounded-full border-none">Aprobada</Badge>;
      case 'pendiente cliente':
        return <Badge className="bg-indigo-600 text-white font-black uppercase text-[9px] tracking-widest px-3 h-6 rounded-full border-none shadow-lg shadow-indigo-900/20">Pendiente Cliente</Badge>;
      case 'en revision':
        return <Badge className="bg-amber-500 text-white font-black uppercase text-[9px] tracking-widest px-3 h-6 rounded-full border-none">En Revisión</Badge>;
      case 'en proceso':
        return <Badge className="bg-blue-500 text-white font-black uppercase text-[9px] tracking-widest px-3 h-6 rounded-full border-none">En Proceso</Badge>;
      case 'creada':
      case 'asignada':
        return <Badge className="bg-slate-200 text-slate-600 font-black uppercase text-[9px] tracking-widest px-3 h-6 rounded-full border-none">{status}</Badge>;
      case 'rechazada':
        return <Badge className="bg-rose-500 text-white font-black uppercase text-[9px] tracking-widest px-3 h-6 rounded-full border-none">Rechazada</Badge>;
      default:
        return <Badge className="bg-slate-200 text-slate-600 font-black uppercase text-[9px] tracking-widest px-3 h-6 rounded-full border-none">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* BARRA DE ACCIONES MASIVAS (Solo histórico) */}
      {selectedIds.length > 0 && activeTab === 'archived' && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10">
          <Card className="bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-6 border-white/10 border">
            <div className="flex items-center gap-3 pr-6 border-r border-white/10">
              <div className="bg-blue-600 h-8 w-8 rounded-full flex items-center justify-center font-black text-xs">
                {selectedIds.length}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">Seleccionadas</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/10 text-[10px] font-black uppercase"
                onClick={() => setSelectedIds([])}
              >
                Cancelar
              </Button>
              <Button 
                className="bg-rose-600 hover:bg-rose-700 text-white h-10 rounded-xl text-[10px] font-black uppercase gap-2"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
              >
                {isBulkDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                Eliminar Definitivamente
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full h-12 w-12 hover:bg-slate-100 transition-colors"><Link href="/dashboard"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 italic">
              {activeTab === 'archived' ? "Archivo Histórico" : (isTechnician ? "Mis Servicios Asignados" : "Órdenes de Trabajo")}
            </h2>
            <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">
              {activeTab === 'archived' ? "Respaldo de auditoría y trabajos archivados" : (isTechnician ? "Hoja de ruta y protocolos" : "Gestión Operacional y Trazabilidad")}
            </p>
          </div>
        </div>
        {!isTechnician && activeTab === 'active' && (
          <Button asChild className="h-12 px-8 rounded-xl shadow-xl shadow-primary/20 font-black gap-2 hover:scale-105 transition-transform">
            <Link href="/work-orders/new"><Plus className="h-5 w-5" /> Generar Nueva OT</Link>
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <TabsList className="bg-white p-1 rounded-2xl h-14 border shadow-sm w-full sm:w-auto">
            <TabsTrigger value="active" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <Zap className="h-4 w-4 mr-2" /> Operativas
            </TabsTrigger>
            <TabsTrigger value="archived" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <Archive className="h-4 w-4 mr-2" /> Histórico
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 bg-white px-4 py-2 rounded-xl border">
            <Clock className="h-3 w-3 text-primary" /> Mostrando: {filteredOTs.length} resultados
          </div>
        </div>

        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8 pb-4 border-b border-slate-50">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input 
                    placeholder="Buscar por ID, mandante o descripción técnica..." 
                    className="pl-12 h-14 border-none bg-slate-50 rounded-2xl text-base font-medium focus-visible:ring-primary shadow-inner"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    variant={showFilters ? "default" : "outline"} 
                    className={cn("h-14 px-6 rounded-2xl border-slate-100 flex-1 sm:flex-none", showFilters ? "bg-slate-900 text-white" : "bg-slate-50")}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className={cn("h-5 w-5 mr-2", showFilters && "text-blue-400")} />
                    {showFilters ? "Ocultar Filtros" : "Filtros Avanzados"}
                  </Button>
                  {hasActiveFilters && (
                    <Button 
                      variant="ghost" 
                      className="h-14 w-14 rounded-2xl text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                      onClick={resetFilters}
                      title="Limpiar Filtros"
                    >
                      <X className="h-6 w-6" />
                    </Button>
                  )}
                </div>
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Estado de Orden</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-12 rounded-xl border-2 bg-white">
                        <SelectValue placeholder="Todos los estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="solicitada">Solicitada</SelectItem>
                        <SelectItem value="creada">Creada</SelectItem>
                        <SelectItem value="asignada">Asignada</SelectItem>
                        <SelectItem value="en proceso">En Proceso</SelectItem>
                        <SelectItem value="ejecutada">Ejecutada</SelectItem>
                        <SelectItem value="en revision">En Revisión</SelectItem>
                        <SelectItem value="pendiente cliente">Pendiente Cliente</SelectItem>
                        <SelectItem value="aprobada">Aprobada</SelectItem>
                        <SelectItem value="rechazada">Rechazada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Filtrar por Cliente</Label>
                    <Select value={clientFilter} onValueChange={setClientFilter}>
                      <SelectTrigger className="h-12 rounded-xl border-2 bg-white">
                        <SelectValue placeholder="Todos los clientes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los clientes</SelectItem>
                        {clients?.filter(c => !c.isDeleted).map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nivel de Urgencia</Label>
                    <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                      <SelectTrigger className="h-12 rounded-xl border-2 bg-white">
                        <SelectValue placeholder="Cualquier urgencia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Cualquier urgencia</SelectItem>
                        <SelectItem value="low">Baja</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="high">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isOrdersLoading ? (
              <div className="py-32 text-center space-y-4">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary/20" />
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Sincronizando Órdenes de Trabajo</p>
              </div>
            ) : filteredOTs.length === 0 ? (
              <div className="py-32 text-center max-w-sm mx-auto space-y-6">
                <div className="bg-slate-50 p-8 rounded-full w-fit mx-auto"><AlertCircle className="h-16 w-16 text-slate-200" /></div>
                <div>
                  <p className="text-xl font-black italic tracking-tighter uppercase">
                    {activeTab === 'archived' ? "Histórico Vacío" : "Sin resultados"}
                  </p>
                  <p className="text-sm text-slate-400 font-medium">
                    {hasActiveFilters 
                      ? "Ninguna orden coincide con los filtros aplicados. Intenta ajustar los parámetros." 
                      : (activeTab === 'archived' ? "No se han encontrado órdenes en el archivo histórico." : (isTechnician ? "No tienes órdenes asignadas actualmente." : "Comienza generando tu primera Orden de Trabajo."))
                    }
                  </p>
                </div>
                {!isTechnician && !hasActiveFilters && activeTab === 'active' && (
                  <Button asChild className="rounded-xl h-12 font-black uppercase tracking-widest text-[10px] w-full"><Link href="/work-orders/new">Generar Primera OT</Link></Button>
                )}
                {hasActiveFilters && (
                  <Button variant="outline" className="rounded-xl h-12 font-black uppercase tracking-widest text-[10px] w-full" onClick={resetFilters}>Limpiar Filtros</Button>
                )}
              </div>
            ) : (
              <Accordion type="multiple" defaultValue={[groupedOTs[0]?.[0]]} className="w-full">
                {groupedOTs.map(([monthKey, group]) => {
                  const allSelectedInGroup = group.orders.every(o => selectedIds.includes(o.id));
                  const someSelectedInGroup = group.orders.some(o => selectedIds.includes(o.id)) && !allSelectedInGroup;

                  return (
                    <AccordionItem key={monthKey} value={monthKey} className="border-b last:border-0">
                      <AccordionTrigger className="hover:no-underline py-6 px-8 group bg-slate-50/30">
                        <div className="flex items-center gap-4">
                          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 group-data-[state=open]:bg-primary group-data-[state=open]:text-white transition-all">
                            <CalendarDays className="h-5 w-5" />
                          </div>
                          <div className="text-left">
                            <span className="text-lg font-black uppercase tracking-tighter text-slate-900 italic leading-none block">{group.label}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{group.orders.length} Servicios procesados</span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-0">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader className="bg-slate-50/50">
                              <TableRow className="border-none">
                                {activeTab === 'archived' && (
                                  <TableHead className="w-12 pl-8">
                                    <Checkbox 
                                      checked={allSelectedInGroup}
                                      onCheckedChange={(checked) => handleSelectGroup(group.orders, checked as boolean)}
                                      className={cn(someSelectedInGroup && "opacity-50")}
                                    />
                                  </TableHead>
                                )}
                                <TableHead className={cn("font-black uppercase text-[10px] tracking-[0.2em] h-12", activeTab !== 'archived' && "pl-8")}>ID / Operativo</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-[0.2em]">Mandante / Entidad</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-[0.2em]">Descripción Alcance</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-center">Prioridad</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-[0.2em]">Estado</TableHead>
                                <TableHead className="text-right font-black uppercase text-[10px] tracking-[0.2em] pr-8">Acción</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.orders.map((ot) => {
                                const client = clients?.find(c => c.id === ot.clientId);
                                const date = ot.createdAt?.toDate ? ot.createdAt.toDate() : (typeof ot.createdAt === 'string' ? parseISO(ot.createdAt) : new Date());
                                const isSelected = selectedIds.includes(ot.id);

                                return (
                                  <TableRow key={ot.id} className={cn(
                                    "hover:bg-slate-50 transition-colors border-slate-100 group",
                                    isSelected && "bg-blue-50/50"
                                  )}>
                                    {activeTab === 'archived' && (
                                      <TableCell className="w-12 pl-8">
                                        <Checkbox 
                                          checked={isSelected}
                                          onCheckedChange={(checked) => handleSelectOT(ot.id, checked as boolean)}
                                        />
                                      </TableCell>
                                    )}
                                    <TableCell className={cn("py-6", activeTab !== 'archived' && "pl-8")}>
                                      <div className="flex flex-col">
                                        <span className="font-black text-primary text-base tracking-tighter italic leading-none">{ot.id}</span>
                                        <span className="text-[10px] font-bold text-slate-400 mt-1">{format(date, "dd MMM, yyyy", { locale: es })}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-3">
                                        <div className="bg-slate-100 p-2 rounded-xl group-hover:bg-white transition-colors"><Building2 className="h-4 w-4 text-slate-500" /></div>
                                        <div className="flex flex-col min-w-0">
                                          <span className="font-bold text-slate-900 text-sm truncate max-w-[180px]">{client?.name || '...' }</span>
                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{client?.rut || '-'}</span>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="max-w-[250px]">
                                      <p className="text-xs font-medium text-slate-600 line-clamp-2 italic leading-relaxed">"{ot.description}"</p>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {ot.urgency === 'high' ? (
                                        <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[8px] font-black uppercase gap-1 px-2">
                                          <AlertTriangle className="h-2 w-2" /> Urgente
                                        </Badge>
                                      ) : ot.urgency === 'medium' ? (
                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[8px] font-black uppercase px-2">
                                          Media
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 text-[8px] font-black uppercase px-2">
                                          Baja
                                        </Badge>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {getStatusBadge(ot.status)}
                                    </TableCell>
                                    <TableCell className="text-right pr-8">
                                      <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" asChild className="rounded-xl h-10 w-10 hover:bg-primary hover:text-white transition-all shadow-sm">
                                          <Link href={`/work-orders/${ot.id}`}><ArrowRight className="h-4 w-4" /></Link>
                                        </Button>
                                        {!isTechnician && (
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10"><MoreVertical className="h-4 w-4 text-slate-400" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-2xl border-none p-2">
                                              <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 p-2">Acciones de Orden</DropdownMenuLabel>
                                              <DropdownMenuSeparator className="bg-slate-50" />
                                              <DropdownMenuItem asChild className="rounded-xl p-3 focus:bg-slate-50">
                                                <Link href={`/work-orders/${ot.id}`} className="font-bold flex items-center gap-2">
                                                  <Eye className="h-4 w-4 text-primary" /> Ver Dashboard OT
                                                </Link>
                                              </DropdownMenuItem>
                                              
                                              {activeTab === 'active' ? (
                                                <>
                                                  {isAdminOrSupervisor && ot.status !== 'aprobada' && (
                                                    <DropdownMenuItem asChild className="rounded-xl p-3 focus:bg-slate-50">
                                                      <Link href={`/work-orders/new?editId=${ot.id}`} className="font-bold flex items-center gap-2 text-amber-600">
                                                        <Edit2 className="h-4 w-4" /> Editar Orden
                                                      </Link>
                                                    </DropdownMenuItem>
                                                  )}
                                                  <DropdownMenuItem asChild className="rounded-xl p-3 focus:bg-slate-50">
                                                    <Link href={`/work-orders/new?duplicateFrom=${ot.id}`} className="font-bold flex items-center gap-2 text-blue-600">
                                                      <Copy className="h-4 w-4" /> Duplicar OT (Plantilla)
                                                    </Link>
                                                  </DropdownMenuItem>
                                                  <DropdownMenuSeparator className="bg-slate-50" />
                                                  <DropdownMenuItem 
                                                    className="text-rose-600 font-bold rounded-xl p-3 focus:bg-rose-50 flex items-center gap-2" 
                                                    onClick={() => handleDelete(ot.id)}
                                                  >
                                                    <Trash2 className="h-4 w-4" /> Archivar Orden
                                                  </DropdownMenuItem>
                                                </>
                                              ) : (
                                                <>
                                                  <DropdownMenuItem 
                                                    className="text-emerald-600 font-bold rounded-xl p-3 focus:bg-emerald-50 flex items-center gap-2" 
                                                    onClick={() => handleRestore(ot.id)}
                                                  >
                                                    <RefreshCcw className="h-4 w-4" /> Restaurar Orden
                                                  </DropdownMenuItem>
                                                  <DropdownMenuSeparator className="bg-slate-50" />
                                                  <DropdownMenuItem 
                                                    className="text-rose-600 font-bold rounded-xl p-3 focus:bg-rose-50 flex items-center gap-2" 
                                                    onClick={() => handlePermanentDelete(ot.id)}
                                                  >
                                                    <Trash2 className="h-4 w-4" /> Borrar Definitivamente
                                                  </DropdownMenuItem>
                                                </>
                                              )}
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
