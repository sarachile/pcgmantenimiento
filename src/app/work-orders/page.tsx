
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
  Edit2
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { WorkOrder, Client } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export default function WorkOrdersPage() {
  const { profile, isLoading: isUserLoading, isTechnician, isCompanyAdmin, isSupervisor } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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
    const docRef = doc(db, "companies", profile.companyId, "workOrders", id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Orden eliminada", description: "La orden de trabajo ha sido removida." });
  };

  const workOrders = useMemo(() => {
    if (!rawWorkOrders) return [];
    if (isTechnician && profile) {
      return rawWorkOrders.filter(ot => 
        ot.assignedToStaffIds?.includes(profile.id) || 
        ot.assignedToStaffIds?.includes(profile.staffId || '')
      );
    }
    return rawWorkOrders;
  }, [rawWorkOrders, isTechnician, profile]);

  const filteredOTs = useMemo(() => {
    return workOrders.filter(ot => {
      const client = clients?.find(c => c.id === ot.clientId);
      return (
        ot.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ot.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }).sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (typeof a.createdAt === 'string' ? parseISO(a.createdAt) : new Date(0));
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (typeof b.createdAt === 'string' ? parseISO(b.createdAt) : new Date(0));
      return dateB.getTime() - dateA.getTime();
    });
  }, [workOrders, searchTerm, clients]);

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

  if (isUserLoading || !mounted) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const isAdminOrSupervisor = isCompanyAdmin || isSupervisor;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full h-12 w-12 hover:bg-slate-100 transition-colors"><Link href="/dashboard"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 italic">
              {isTechnician ? "Mis Servicios Asignados" : "Órdenes de Trabajo"}
            </h2>
            <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">
              {isTechnician ? "Hoja de ruta y protocolos" : "Gestión Operacional y Trazabilidad"}
            </p>
          </div>
        </div>
        {!isTechnician && (
          <Button asChild className="h-12 px-8 rounded-xl shadow-xl shadow-primary/20 font-black gap-2 hover:scale-105 transition-transform">
            <Link href="/work-orders/new"><Plus className="h-5 w-5" /> Generar Nueva OT</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm rounded-3xl bg-blue-600 text-white overflow-hidden relative group">
          <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><Target className="h-20 w-20" /></div>
          <CardContent className="p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-70">En Ejecución</p>
            <p className="text-4xl font-black tracking-tighter italic">{workOrders.filter(o => o.status !== 'aprobada').length}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl bg-emerald-600 text-white overflow-hidden relative group">
          <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><ShieldCheck className="h-20 w-20" /></div>
          <CardContent className="p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-70">Finalizadas</p>
            <p className="text-4xl font-black tracking-tighter italic">{workOrders.filter(o => o.status === 'aprobada').length}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl bg-slate-900 text-white overflow-hidden relative group">
          <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><Zap className="h-20 w-20 text-amber-400" /></div>
          <CardContent className="p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-70">Meta de Cumplimiento</p>
            <p className="text-4xl font-black tracking-tighter italic">94%</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="p-8 pb-4 border-b border-slate-50">
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
            <Button variant="outline" className="h-14 w-14 rounded-2xl border-slate-100 bg-slate-50"><Filter className="h-5 w-5" /></Button>
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
                <p className="text-xl font-black italic tracking-tighter uppercase">Sin resultados</p>
                <p className="text-sm text-slate-400 font-medium">
                  {isTechnician ? "No tienes órdenes asignadas que coincidan con tu búsqueda." : "Ajusta tu búsqueda o crea una nueva orden para poblar el listado."}
                </p>
              </div>
              {!isTechnician && (
                <Button asChild className="rounded-xl h-12 font-black uppercase tracking-widest text-[10px] w-full"><Link href="/work-orders/new">Generar Primera OT</Link></Button>
              )}
            </div>
          ) : (
            <Accordion type="multiple" defaultValue={[groupedOTs[0]?.[0]]} className="w-full">
              {groupedOTs.map(([monthKey, group]) => (
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
                            <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] pl-8 h-12">ID / Operativo</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-[0.2em]">Mandante / Entidad</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-[0.2em]">Descripción Alcance</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-center">Evidencias</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-[0.2em]">Estado</TableHead>
                            <TableHead className="text-right font-black uppercase text-[10px] tracking-[0.2em] pr-8">Acción</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.orders.map((ot) => {
                            const client = clients?.find(c => c.id === ot.clientId);
                            const date = ot.createdAt?.toDate ? ot.createdAt.toDate() : (typeof ot.createdAt === 'string' ? parseISO(ot.createdAt) : new Date());
                            return (
                              <TableRow key={ot.id} className="hover:bg-slate-50 transition-colors border-slate-100 group">
                                <TableCell className="pl-8 py-6">
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
                                  <div className="flex justify-center gap-1">
                                    {(ot.evidenceUrls?.length || 0) > 0 && <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 text-[8px] h-5">{ot.evidenceUrls?.length} FOTOS</Badge>}
                                    {ot.clientApprovalCode && <Badge className="bg-emerald-100 text-emerald-700 text-[8px] h-5 font-black uppercase">FIRMADA</Badge>}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={cn(
                                    "text-[9px] font-black uppercase tracking-widest px-3 h-6 rounded-full border-none",
                                    ot.status === 'aprobada' ? "bg-emerald-500 text-white" : 
                                    ot.status === 'pendiente cliente' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20" :
                                    ot.status === 'en revision' ? "bg-amber-500 text-white" :
                                    "bg-slate-200 text-slate-600"
                                  )}>
                                    {ot.status.replace(' ', '_')}
                                  </Badge>
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
                                            <Trash2 className="h-4 w-4" /> Eliminar Registro
                                          </DropdownMenuItem>
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
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
