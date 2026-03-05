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
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
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
  CalendarDays
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { WorkOrder, Client } from "@/lib/types";
import { format, parseISO, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";

export default function WorkOrdersPage() {
  const { profile, isLoading: isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const workOrdersQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return collection(db, "companies", profile.companyId, "workOrders");
  }, [db, profile?.companyId]);

  const { data: realWorkOrders, isLoading: isOrdersLoading } = useCollection<WorkOrder>(workOrdersQuery);

  const clientsQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return collection(db, "companies", profile.companyId, "clients");
  }, [db, profile?.companyId]);

  const { data: clients } = useCollection<Client>(clientsQuery);

  const handleDelete = (id: string) => {
    if (!profile?.companyId) return;
    const docRef = doc(db, "companies", profile.companyId, "workOrders", id);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: "Orden eliminada",
      description: "La orden de trabajo ha sido eliminada del sistema.",
    });
  };

  const workOrders = realWorkOrders || [];

  const filteredOTs = useMemo(() => {
    return workOrders.filter(ot => {
      const client = clients?.find(c => c.id === ot.clientId);
      return (
        ot.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ot.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }).sort((a, b) => {
      // Ordenar por fecha de creación descendente
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (typeof a.createdAt === 'string' ? parseISO(a.createdAt) : new Date(0));
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (typeof b.createdAt === 'string' ? parseISO(b.createdAt) : new Date(0));
      return dateB.getTime() - dateA.getTime();
    });
  }, [workOrders, searchTerm, clients]);

  // Agrupar por mes
  const groupedOTs = useMemo(() => {
    const groups: Record<string, { label: string, orders: WorkOrder[] }> = {};
    
    filteredOTs.forEach(ot => {
      const date = ot.createdAt?.toDate ? ot.createdAt.toDate() : (typeof ot.createdAt === 'string' ? parseISO(ot.createdAt) : new Date());
      const monthKey = format(date, "yyyy-MM");
      const monthLabel = format(date, "MMMM yyyy", { locale: es });
      
      if (!groups[monthKey]) {
        groups[monthKey] = { label: monthLabel, orders: [] };
      }
      groups[monthKey].orders.push(ot);
    });
    
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredOTs]);

  const formatTableDate = (date: any) => {
    if (!mounted || !date) return '...';
    try {
      if (date.toDate) return date.toDate().toLocaleDateString();
      return new Date(date).toLocaleDateString();
    } catch (e) {
      return 'N/A';
    }
  };

  if (isUserLoading) {
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
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Órdenes de Trabajo</h2>
            <p className="text-muted-foreground text-sm">Administre y supervise todas las órdenes de trabajo por periodos.</p>
          </div>
        </div>
        <Button asChild className="rounded-xl shadow-lg">
          <Link href="/work-orders/new">
            <Plus className="mr-2 h-4 w-4" /> Crear Nueva OT
          </Link>
        </Button>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="pb-3 bg-white">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por ID, cliente o descripción..." 
                className="pl-10 h-11 border-none bg-muted/20 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="rounded-xl h-11 w-11">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isOrdersLoading ? (
            <div className="py-20 text-center text-muted-foreground font-medium">
              <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4 text-primary" />
              Sincronizando órdenes de trabajo...
            </div>
          ) : filteredOTs.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed m-6 rounded-3xl bg-slate-50/50">
              <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <p className="text-lg font-bold text-slate-500">No se encontraron órdenes</p>
              <p className="text-sm text-slate-400 mb-6">Comience creando una nueva orden de trabajo para verla aquí.</p>
              <Button asChild className="rounded-xl font-bold">
                <Link href="/work-orders/new">Generar Primera OT</Link>
              </Button>
            </div>
          ) : (
            <Accordion type="multiple" defaultValue={[groupedOTs[0]?.[0]]} className="w-full">
              {groupedOTs.map(([monthKey, group]) => (
                <AccordionItem key={monthKey} value={monthKey} className="border-b last:border-0 px-6">
                  <AccordionTrigger className="hover:no-underline py-4 group">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg group-data-[state=open]:bg-primary group-data-[state=open]:text-white transition-colors">
                        <CalendarDays className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-black uppercase tracking-widest text-slate-700 group-data-[state=open]:text-slate-900 transition-colors">
                        {group.label}
                      </span>
                      <Badge variant="secondary" className="text-[10px] font-bold rounded-md">
                        {group.orders.length} Órdenes
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <div className="border rounded-2xl overflow-hidden bg-white shadow-sm">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest pl-6">ID / Fecha</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Cliente / Entidad</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Descripción</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Evidencia</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest">Estado</TableHead>
                            <TableHead className="text-right font-black uppercase text-[10px] tracking-widest pr-6">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.orders.map((ot) => {
                            const client = clients?.find(c => c.id === ot.clientId);
                            return (
                              <TableRow key={ot.id} className="hover:bg-muted/10 transition-colors group">
                                <TableCell className="pl-6">
                                  <div className="flex flex-col">
                                    <span className="font-black text-primary text-sm tracking-tight">{ot.id}</span>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{formatTableDate(ot.createdAt)}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="bg-primary/5 p-2 rounded-lg shrink-0">
                                      <Building2 className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="font-bold text-slate-900 text-sm truncate">{client?.name || 'Cargando...'}</span>
                                      <span className="text-[10px] text-muted-foreground font-mono">{client?.rut || '-'}</span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-[200px]">
                                  <p className="text-xs font-medium text-slate-600 truncate">{ot.description}</p>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1.5">
                                    {ot.technicianSignatureUrl || ot.technicianApprovalCode ? (
                                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[8px] font-black uppercase py-0 px-1.5 h-5">Tech</Badge>
                                    ) : null}
                                    {ot.clientSignatureUrl || ot.clientApprovalCode ? (
                                      <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[8px] font-black uppercase py-0 px-1.5 h-5">Client</Badge>
                                    ) : null}
                                    {!ot.technicianApprovalCode && !ot.clientApprovalCode && (
                                      <span className="text-[10px] text-muted-foreground italic">Sin sellos</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={cn(
                                    "text-[9px] font-black uppercase tracking-tighter",
                                    ot.status === 'creada' && "bg-blue-100 text-blue-700 hover:bg-blue-100",
                                    ot.status === 'asignada' && "bg-indigo-100 text-indigo-700 hover:bg-indigo-100",
                                    ot.status === 'ejecutada' && "bg-purple-100 text-purple-700 hover:bg-purple-100",
                                    ot.status === 'en revision' && "bg-amber-100 text-amber-700 hover:bg-amber-100",
                                    ot.status === 'aprobada' && "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
                                    ot.status === 'rechazada' && "bg-rose-100 text-rose-700 hover:bg-rose-100"
                                  )}>
                                    {ot.status.replace(' ', '_')}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                  <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="icon" asChild title="Ver Detalle" className="rounded-xl h-9 w-9">
                                      <Link href={`/work-orders/${ot.id}`}>
                                        <Eye className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-none">
                                        <DropdownMenuLabel className="text-xs font-black uppercase text-slate-400">Acciones de Orden</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild className="rounded-lg">
                                          <Link href={`/work-orders/${ot.id}`} className="font-bold">
                                            <Eye className="mr-2 h-4 w-4" /> Ver Detalles
                                          </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          className="text-rose-600 font-bold rounded-lg" 
                                          onClick={() => handleDelete(ot.id)}
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
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
