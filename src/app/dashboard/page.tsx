"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ClipboardList, 
  Plus, 
  Loader2, 
  AlertTriangle, 
  Activity,
  Zap,
  ChevronRight,
  Trophy,
  Check,
  Clock,
  ArrowRight,
  Building2,
  HardHat,
  Smartphone,
  Users,
  Sparkles,
  Share,
  PlusSquare,
  Timer,
  CreditCard,
  History,
  Briefcase,
  Cpu,
  Waves,
  Calendar,
  XCircle,
  BellRing,
  Monitor,
  Download,
  ShieldCheck,
  Inbox
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Progress } from "@/components/ui/progress";
import { isBefore, parseISO, startOfDay, differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { WorkOrder, Client, Company, Asset } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlanLimits } from "@/hooks/use-plan-limits";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { profile, isLoading: isUserLoading, isTechnician, isCompanyAdmin, isSupervisor } = useUser();
  const limits = usePlanLimits();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => { 
    setMounted(true); 
    setToday(startOfDay(new Date()));
  }, []);

  const isAdminOrSupervisor = isCompanyAdmin || isSupervisor;
  const companyId = profile?.companyId || "";

  const workOrdersQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "workOrders") : null, [db, companyId]);
  const clientsQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "clients") : null, [db, companyId]);
  const assetsQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "assets") : null, [db, companyId]);
  const companyRef = useMemoFirebase(() => db && companyId ? doc(db, "companies", companyId) : null, [db, companyId]);

  const { data: rawWorkOrders, isLoading: isOrdersLoading } = useCollection<WorkOrder>(workOrdersQuery);
  const { data: rawClients, isLoading: isClientsLoading } = useCollection<Client>(clientsQuery);
  const { data: rawAssets, isLoading: isAssetsLoading } = useCollection<Asset>(assetsQuery);
  const { data: company, isLoading: isCompanyLoading } = useDoc<Company>(companyRef);

  const workOrders = useMemo(() => (rawWorkOrders || []).filter(o => !o.isDeleted), [rawWorkOrders]);
  const clients = useMemo(() => (rawClients || []).filter(c => !c.isDeleted), [rawClients]);
  const assets = useMemo(() => (rawAssets || []).filter(a => !a.isDeleted), [rawAssets]);

  const realWorkOrders = useMemo(() => {
    if (!workOrders) return [];
    if (isTechnician && profile?.id) {
      return workOrders.filter(ot => 
        ot.assignedToStaffIds?.includes(profile.id) || 
        ot.assignedToStaffIds?.includes(profile.staffId || '')
      );
    }
    return workOrders;
  }, [workOrders, isTechnician, profile?.id, profile?.staffId]);

  const stats = useMemo(() => {
    const total = realWorkOrders.length;
    const completed = realWorkOrders.filter(ot => ot.status === 'aprobada').length;
    const reviewPending = realWorkOrders.filter(ot => ot.status === 'en revision').length;
    const clientRequests = realWorkOrders.filter(ot => ot.status === 'solicitada');
    const rejected = realWorkOrders.filter(ot => ot.status === 'rechazada');
    const active = realWorkOrders.filter(ot => ot.status !== 'aprobada').length;
    
    const delayed = realWorkOrders.filter(ot => {
      if (ot.status === 'aprobada' || !today) return false;
      const dateToUse = ot.scheduledDate || ot.createdAt;
      const endDate = dateToUse?.toDate ? dateToUse.toDate() : (typeof dateToUse === 'string' ? parseISO(dateToUse) : null);
      return endDate && isBefore(endDate, today);
    });

    return { 
      total, 
      completed, 
      active, 
      reviewPending,
      clientRequests: clientRequests.length,
      clientRequestsList: clientRequests,
      rejected: rejected.length,
      rejectedList: rejected,
      delayed: delayed.length,
      delayedList: delayed,
      alertCount: rejected.length + delayed.length 
    };
  }, [realWorkOrders, today]);

  const recentOrders = useMemo(() => {
    return [...realWorkOrders].sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (typeof a.createdAt === 'string' ? parseISO(a.createdAt) : new Date(0));
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (typeof b.createdAt === 'string' ? parseISO(b.createdAt) : new Date(0));
      return dateB.getTime() - dateA.getTime();
    }).slice(0, 5);
  }, [realWorkOrders]);

  const iotStats = useMemo(() => {
    const iotAssets = (assets || []).filter(a => a.isIoT);
    const activeIoT = iotAssets.filter(a => a.status === 'activo').length;
    const maintenanceIoT = iotAssets.filter(a => a.maintenanceRequired);
    return { 
      count: iotAssets.length, 
      active: activeIoT, 
      maintenanceCount: maintenanceIoT.length,
      maintenanceList: maintenanceIoT 
    };
  }, [assets]);

  const onboardingSteps = useMemo(() => {
    if (!company || isTechnician) return [];
    return [
      { id: 'profile', label: 'Datos Empresa', desc: 'RUT y dirección', completed: !!company.rut && company.rut !== "RUT por definir", href: '/company' },
      { id: 'team', label: 'Cargar Equipo', desc: 'Registra técnicos', completed: limits.techCount > 0, href: '/team' },
      { id: 'clients', label: 'Clientes', desc: 'Añade mandantes', completed: limits.clientsCount > 0, href: '/clients' },
      { id: 'ots', label: 'Primera OT', desc: 'Inicia flujo', completed: realWorkOrders.length > 0, href: '/work-orders/new' }
    ];
  }, [company, limits.techCount, limits.clientsCount, realWorkOrders, isTechnician]);

  const allStepsCompleted = onboardingSteps.length > 0 && onboardingSteps.every(s => s.completed);

  const trialDaysRemaining = useMemo(() => {
    if (!company?.trialEndsAt || !today) return null;
    const end = company.trialEndsAt.toDate ? company.trialEndsAt.toDate() : parseISO(company.trialEndsAt);
    return differenceInDays(end, today);
  }, [company?.trialEndsAt, today]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprobada':
        return <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter h-4 px-1.5 border-emerald-200 text-emerald-600">Aprobada</Badge>;
      case 'en proceso':
        return <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter h-4 px-1.5 border-blue-200 text-blue-600">En Proceso</Badge>;
      case 'en revision':
        return <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter h-4 px-1.5 border-amber-200 text-amber-600">En Revisión</Badge>;
      case 'solicitada':
        return <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter h-4 px-1.5 border-indigo-200 bg-indigo-50 text-indigo-600 shadow-sm">Solicitud Mandante</Badge>;
      default:
        return <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter h-4 px-1.5 border-slate-200 text-slate-600">{status}</Badge>;
    }
  };

  if (!mounted || isUserLoading || isOrdersLoading || isClientsLoading || isCompanyLoading || isAssetsLoading || !today) {
    return (
      <div className="flex flex-col h-[400px] items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Sincronizando Entorno Operativo...</p>
      </div>
    );
  }

  // VISTA TÉCNICO
  if (isTechnician) {
    return (
      <div className="space-y-8 pb-32">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 italic uppercase">Hola, {profile?.name?.split(' ')[0]}</h2>
            <p className="text-muted-foreground font-medium">Esta es tu hoja de ruta para hoy en {company?.name}.</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl bg-white shadow-sm border-slate-200 text-primary">
                <Monitor className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase text-primary">Anclar Plataforma</DialogTitle>
                <DialogDescription className="font-bold text-slate-500">Ten tu herramienta siempre a mano en tu PC o móvil.</DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="mobile" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-12 bg-slate-100 p-1 rounded-xl mb-6">
                  <TabsTrigger value="mobile" className="rounded-lg font-black uppercase text-[10px] tracking-widest gap-2">
                    <Smartphone className="h-3 w-3" /> Móvil
                  </TabsTrigger>
                  <TabsTrigger value="pc" className="rounded-lg font-black uppercase text-[10px] tracking-widest gap-2">
                    <Monitor className="h-3 w-3" /> Computador
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="mobile" className="space-y-6 animate-in fade-in slide-in-from-left-2">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3"><div className="bg-blue-100 p-2 rounded-lg text-blue-600 font-bold text-xs uppercase">iOS</div><p className="text-sm font-bold text-slate-700">En iPhone (Safari):</p></div>
                    <div className="bg-slate-50 p-4 rounded-2xl border space-y-3">
                      <div className="flex items-center gap-3 text-xs"><div className="h-6 w-6 bg-white border rounded-md flex items-center justify-center shadow-sm"><Share className="h-3 w-3 text-slate-400" /></div><span>1. Pulsa el botón <strong>"Compartir"</strong>.</span></div>
                      <div className="flex items-center gap-3 text-xs"><div className="h-6 w-6 bg-white border rounded-md flex items-center justify-center shadow-sm"><PlusSquare className="h-3 w-3 text-slate-400" /></div><span>2. Selecciona <strong>"Agregar a Inicio"</strong>.</span></div>
                    </div>
                  </div>
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-3"><div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 font-bold text-xs uppercase">Android</div><p className="text-sm font-bold text-slate-700">En Chrome:</p></div>
                    <div className="bg-slate-50 p-4 rounded-2xl border space-y-3">
                      <div className="flex items-center gap-3 text-xs"><div className="h-6 w-6 bg-white border rounded-md flex items-center justify-center shadow-sm font-black text-slate-400">⋮</div><span>1. Pulsa los <strong>tres puntos</strong> arriba a la derecha.</span></div>
                      <div className="flex items-center gap-3 text-xs"><div className="h-6 w-6 bg-white border rounded-md flex items-center justify-center shadow-sm"><Smartphone className="h-3 w-3 text-slate-400" /></div><span>2. Selecciona <strong>"Instalar aplicación"</strong>.</span></div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="pc" className="space-y-6 animate-in fade-in slide-in-from-right-2">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3"><div className="bg-blue-100 p-2 rounded-lg text-blue-600 font-bold text-xs uppercase">Chrome / Edge</div><p className="text-sm font-bold text-slate-700">Instalar en Escritorio:</p></div>
                    <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed space-y-4">
                      <div className="flex items-start gap-4 text-xs">
                        <div className="h-8 w-8 bg-white border rounded-lg flex items-center justify-center shadow-sm shrink-0"><Download className="h-4 w-4 text-blue-600" /></div>
                        <div className="space-y-1">
                          <p className="font-black text-slate-900 uppercase tracking-tight">1. Busca el icono de instalar</p>
                          <p className="text-slate-500">En la derecha de la barra de direcciones (URL), verás una pequeña pantalla con una flecha.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 text-xs">
                        <div className="h-8 w-8 bg-white border rounded-lg flex items-center justify-center shadow-sm shrink-0"><Check className="h-4 w-4 text-emerald-600" /></div>
                        <div className="space-y-1">
                          <p className="font-black text-slate-900 uppercase tracking-tight">2. Confirma la instalación</p>
                          <p className="text-slate-500">Pulsa "Instalar" y la App se anclará a tu menú de inicio y escritorio automáticamente.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white max-w-4xl">
          <CardHeader className="bg-slate-50/50 p-6 border-b">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" /> Mi Hoja de Ruta
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase text-slate-400">Trabajos asignados pendientes de ejecución</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {recentOrders.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="bg-slate-50 p-6 rounded-full w-fit mx-auto opacity-50"><HardHat className="h-10 w-10 text-slate-300" /></div>
                <p className="text-slate-400 italic text-sm font-medium">No tienes órdenes asignadas para hoy.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentOrders.map((ot) => {
                  const client = clients?.find(c => c.id === ot.clientId);
                  return (
                    <Link key={ot.id} href={`/work-orders/${ot.id}`}>
                      <div className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1"><span className="text-sm font-black text-primary italic">{ot.id}</span>{getStatusBadge(ot.status)}</div>
                          <p className="text-xs font-bold text-slate-900 truncate">{client?.name || 'Cargando...'}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 ml-4" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {trialDaysRemaining !== null && trialDaysRemaining <= 5 && (
        <Card className="rounded-[2.5rem] border-none bg-rose-600 text-white shadow-xl overflow-hidden animate-in slide-in-from-top-4 duration-500">
          <CardContent className="p-6 flex flex-col sm:row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl"><Timer className="h-6 w-6" /></div>
              <div><h3 className="font-black uppercase italic tracking-tight">Periodo de Prueba Finalizando</h3><p className="text-sm font-medium text-rose-100">Te quedan {trialDaysRemaining} días de prueba gratuita.</p></div>
            </div>
            <Button asChild className="rounded-xl bg-white text-rose-600 hover:bg-rose-50 font-black uppercase tracking-widest gap-2 shadow-lg"><Link href="/subscription"><CreditCard className="h-4 w-4" /> Activar Plan Pro</Link></Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tighter text-slate-900 italic uppercase">Hola, {profile?.name?.split(' ')[0]}</h2>
          <p className="text-muted-foreground font-medium">Resumen operativo de {company?.name}.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button asChild variant="outline" className="h-11 px-6 rounded-xl shadow-sm font-black gap-2 bg-white"><Link href="/work-orders"><ClipboardList className="h-5 w-5" /> Ver Órdenes</Link></Button>
          <Button asChild className="h-11 px-6 rounded-xl shadow-lg font-black gap-2"><Link href="/work-orders/new"><Plus className="h-5 w-5" /> Nueva OT</Link></Button>
        </div>
      </div>

      {/* ALERTAS OPERATIVAS */}
      {(stats.alertCount > 0 || iotStats.maintenanceCount > 0 || stats.reviewPending > 0 || stats.clientRequests > 0) && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* NUEVOS REQUERIMIENTOS MANDANTE */}
          {stats.clientRequests > 0 && isAdminOrSupervisor && (
            <Card className="rounded-[2.5rem] border-none shadow-xl bg-indigo-600 text-white overflow-hidden border-l-[12px] border-indigo-800 animate-in slide-in-from-left-4">
              <CardHeader className="bg-indigo-700/30 p-6 border-b border-indigo-700/10">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <Inbox className="h-4 w-4" /> Requerimientos Mandante
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold text-indigo-100 uppercase">Órdenes generadas desde el Portal QR</CardDescription>
                  </div>
                  <Badge className="bg-white text-indigo-600 font-black text-[10px]">{stats.clientRequests}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 max-h-[200px] overflow-y-auto">
                <div className="divide-y divide-indigo-500/20">
                  {stats.clientRequestsList.map(ot => (
                    <Link key={ot.id} href={`/work-orders/${ot.id}`} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
                      <div className="flex items-start gap-3">
                        <div className="bg-white/20 p-2 rounded-xl"><ClipboardList className="h-4 w-4" /></div>
                        <div>
                          <p className="text-xs font-black">{ot.id}</p>
                          <p className="text-[10px] text-indigo-100 line-clamp-1">{clients?.find(c => c.id === ot.clientId)?.name}</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-indigo-300 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {stats.reviewPending > 0 && isAdminOrSupervisor && (
            <Card className="rounded-[2.5rem] border-none shadow-xl bg-amber-500 text-white overflow-hidden border-l-[12px] border-amber-600 animate-in slide-in-from-left-4">
              <CardHeader className="bg-amber-600/20 p-6 border-b border-amber-600/10">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" /> Visados Pendientes
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold text-amber-100 uppercase">Órdenes ejecutadas por técnicos</CardDescription>
                  </div>
                  <Badge className="bg-white text-amber-600 font-black text-[10px]">{stats.reviewPending}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-xs font-medium mb-4">Tienes trabajos terminados que requieren tu validación técnica para cerrar el ciclo.</p>
                <Button asChild variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 font-black uppercase text-[10px] tracking-widest h-12 rounded-xl">
                  <Link href="/reviews">Ir a Centro de Revisiones <ArrowRight className="ml-2 h-3 w-3" /></Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden border-l-[12px] border-rose-500 animate-in slide-in-from-left-4">
            <CardHeader className="bg-rose-50/50 p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-rose-700">
                    <BellRing className="h-4 w-4" /> Alertas Operativas OT
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold text-rose-600 uppercase">Órdenes que requieren gestión urgente</CardDescription>
                </div>
                <Badge className="bg-rose-600 text-white font-black text-[10px]">{stats.alertCount}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[200px] overflow-y-auto">
              <div className="divide-y divide-rose-100">
                {stats.rejectedList.map(ot => (
                  <Link key={ot.id} href={`/work-orders/${ot.id}`} className="flex items-center justify-between p-4 hover:bg-rose-50/30 transition-colors group">
                    <div className="flex items-start gap-3">
                      <div className="bg-rose-100 p-2 rounded-xl text-rose-600"><XCircle className="h-4 w-4" /></div>
                      <div>
                        <p className="text-xs font-black text-slate-900">{ot.id} - RECHAZADA</p>
                        <p className="text-[10px] text-slate-500 line-clamp-1">{clients?.find(c => c.id === ot.clientId)?.name}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-rose-300 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ))}
                {stats.delayedList.map(ot => (
                  <Link key={ot.id} href={`/work-orders/${ot.id}`} className="flex items-center justify-between p-4 hover:bg-amber-50/30 transition-colors group">
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-100 p-2 rounded-xl text-amber-600"><Clock className="h-4 w-4" /></div>
                      <div>
                        <p className="text-xs font-black text-slate-900">{ot.id} - ATRASADA</p>
                        <p className="text-[10px] text-slate-500 line-clamp-1">{clients?.find(c => c.id === ot.clientId)?.name}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-amber-300 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* GUÍA DE ACTIVACIÓN */}
      {!allStepsCompleted && (
        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-slate-900 text-white overflow-hidden">
          <div className="grid md:grid-cols-3">
            <div className="p-10 space-y-6 bg-blue-600/10 border-r border-white/5">
              <div className="bg-blue-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40"><Zap className="h-6 w-6 text-white fill-white" /></div>
              <h3 className="text-2xl font-black tracking-tighter italic uppercase leading-none">Guía de <br />Activación</h3>
              <p className="text-xs text-slate-400 font-bold uppercase">Pasos críticos para configurar tu entorno</p>
              <Progress value={(onboardingSteps.filter(s => s.completed).length / 4) * 100} className="h-2 bg-white/10" />
            </div>
            <div className="md:col-span-2 p-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {onboardingSteps.map((step) => (
                <Link key={step.id} href={step.href}>
                  <div className={cn("group p-5 rounded-[1.5rem] border-2 transition-all flex items-center justify-between h-full", step.completed ? "border-emerald-500/20 bg-emerald-500/5 opacity-60" : "border-white/10 bg-white/5 hover:border-blue-500/50")}>
                    <div className="space-y-1"><p className={cn("text-xs font-black uppercase tracking-widest", step.completed ? "text-emerald-400" : "text-blue-400")}>{step.label}</p><p className="text-[11px] text-slate-400 font-medium">{step.desc}</p></div>
                    {step.completed ? <Check className="h-4 w-4 text-emerald-400" /> : <ChevronRight className="h-4 w-4 text-white/20" />}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* GESTIÓN DE INFRAESTRUCTURA */}
      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/clients" className="block group">
          <Card className="rounded-[2.5rem] border-none shadow-sm hover:shadow-xl transition-all bg-white overflow-hidden h-full">
            <CardContent className="p-8 flex items-start gap-6">
              <div className="bg-primary/10 p-4 rounded-3xl text-primary group-hover:scale-110 transition-transform">
                <Building2 className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Gestión de Clientes</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Administre su cartera de mandantes, configure portales de autogestión y gestione las aprobaciones digitales externas para sus servicios.
                </p>
                <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest pt-2">
                  Ver listado <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/team" className="block group">
          <Card className="rounded-[2.5rem] border-none shadow-sm hover:shadow-xl transition-all bg-white overflow-hidden h-full">
            <CardContent className="p-8 flex items-start gap-6">
              <div className="bg-emerald-50 p-4 rounded-3xl text-emerald-600 group-hover:scale-110 transition-transform">
                <Users className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Gestión de Usuarios</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Controle su fuerza técnica de campo, organize cuadrillas de trabajo y gestione las credenciales de acceso de sus operarios y supervisores.
                </p>
                <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest pt-2">
                  Administrar personal <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Órdenes", desc: "Histórico acumulado", value: stats.total, icon: ClipboardList, color: "bg-blue-600" },
          { label: "En Ejecución", desc: "Trabajos en curso", value: stats.active, icon: Activity, color: "bg-indigo-600" },
          { label: "Finalizadas", desc: "OTs cerradas con éxito", value: stats.completed, icon: Trophy, color: "bg-emerald-600" },
          { label: "Alertas Críticas", desc: "Atención inmediata", value: stats.alertCount, icon: AlertTriangle, color: "bg-rose-600" }
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden group hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{stat.label}</CardTitle>
                <CardDescription className="text-[8px] font-bold uppercase text-slate-300">{stat.desc}</CardDescription>
              </div>
              <div className={cn("p-2 rounded-xl", stat.color)}><stat.icon className="h-4 w-4 text-white" /></div>
            </CardHeader>
            <CardContent><div className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="bg-slate-50 border-b p-8">
            <div className="space-y-1">
              <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                <History className="h-6 w-6 text-primary" /> Actividad Reciente
              </CardTitle>
              <CardDescription className="font-bold text-xs uppercase text-slate-400 tracking-widest">Últimos movimientos detectados en tu red de servicios</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentOrders.length === 0 ? (
              <div className="py-32 text-center space-y-6">
                <div className="bg-slate-50 p-8 rounded-full w-fit mx-auto opacity-50"><ClipboardList className="h-16 w-16 text-slate-200" /></div>
                <p className="text-xl font-black italic uppercase">Sin movimientos</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentOrders.map((ot) => {
                  const client = clients?.find(c => c.id === ot.clientId);
                  const date = ot.createdAt?.toDate ? ot.createdAt.toDate() : (typeof ot.createdAt === 'string' ? parseISO(ot.createdAt) : new Date());
                  return (
                    <Link key={ot.id} href={`/work-orders/${ot.id}`} className="block group">
                      <div className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start gap-4 min-w-0">
                          <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 mt-1", 
                            ot.status === 'aprobada' ? "bg-emerald-50 text-emerald-600" : 
                            ot.status === 'solicitada' ? "bg-indigo-50 text-indigo-600 shadow-inner" : "bg-blue-50 text-blue-600"
                          )}>
                            {ot.status === 'aprobada' ? <Trophy className="h-6 w-6" /> : 
                             ot.status === 'solicitada' ? <Inbox className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-black text-primary italic tracking-tight">{ot.id}</span>
                              {getStatusBadge(ot.status)}
                            </div>
                            <p className="font-black text-slate-900 truncate text-sm">{client?.name || '...'}</p>
                            <p className="text-xs text-slate-500 line-clamp-1 italic mt-0.5">"{ot.description}"</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> {format(date, "dd MMM, HH:mm", { locale: es })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute -right-10 -bottom-10 opacity-10"><Zap className="h-48 w-48 text-blue-400" /></div>
          <CardHeader className="border-b border-white/5 p-8">
            <div className="space-y-1">
              <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-blue-400" /> Plan {company?.currentPlan?.toUpperCase()}
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs font-bold uppercase tracking-widest">Capacidad y límites de tu infraestructura digital</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-10">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Briefcase className="h-3 w-3 text-blue-400" /> Gestión Oficina</p>
                  <p className="text-3xl font-black italic tracking-tighter">{limits.adminCount} / {limits.maxAdmins}</p>
                </div>
                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Admins & Supervisores</span>
              </div>
              <Progress value={(limits.adminCount / limits.maxAdmins) * 100} className="h-1.5 bg-white/10" />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><HardHat className="h-3 w-3 text-emerald-400" /> Ejecución Terreno</p>
                  <p className="text-3xl font-black italic tracking-tighter">{limits.techCount} / {limits.maxTechnicians}</p>
                </div>
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Técnicos de Campo</span>
              </div>
              <Progress value={(limits.techCount / limits.maxTechnicians) * 100} className="h-1.5 bg-white/10" />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Cpu className="h-3 w-3 text-amber-400" /> Monitoreo de Planta</p>
                  <p className="text-3xl font-black italic tracking-tighter">{limits.iotAssetsCount} / {limits.maxIoT}</p>
                </div>
                <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">Activos IoT</span>
              </div>
              <Progress value={limits.maxIoT > 0 ? (limits.iotAssetsCount / limits.maxIoT) * 100 : 0} className="h-1.5 bg-white/10" />
            </div>

            <div className="pt-6 border-t border-white/5">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  Escala tu flota de técnicos y sensores sin perder el control centralizado de tu operación.
                </p>
                <Button asChild variant="outline" className="w-full h-11 rounded-xl border-white/10 bg-transparent text-white hover:bg-white/10 font-bold uppercase text-[10px] tracking-widest">
                  <Link href="/subscription">Gestionar Suscripción</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
