
"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  Plus, 
  ArrowRight, 
  Loader2, 
  Calendar as CalendarIcon, 
  AlertTriangle, 
  Activity,
  Users,
  Building2,
  Zap,
  ChevronRight,
  Camera,
  Target,
  Trophy,
  ArrowUpRight,
  Lightbulb,
  Check,
  Globe,
  Contact,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { isBefore, isAfter, addDays, parseISO, startOfDay, format } from "date-fns";
import { es } from "date-fns/locale";
import { WorkOrder, Client, Company, StaffMember, Asset } from "@/lib/types";
import { usePlanLimits } from "@/hooks/use-plan-limits";

export default function DashboardPage() {
  const { profile, isLoading: isUserLoading, isTechnician } = useUser();
  const { staffCount, clientsCount, maxStaff, maxClients } = usePlanLimits();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const companyId = profile?.companyId || "";

  const workOrdersQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "workOrders") : null, [db, companyId]);
  const clientsQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "clients") : null, [db, companyId]);
  const staffQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "staff") : null, [db, companyId]);
  const companyRef = useMemoFirebase(() => db && companyId ? doc(db, "companies", companyId) : null, [db, companyId]);

  const { data: workOrders, isLoading: isOrdersLoading } = useCollection<WorkOrder>(workOrdersQuery);
  const { data: clients } = useCollection<Client>(clientsQuery);
  const { data: staff } = useCollection<StaffMember>(staffQuery);
  const { data: company } = useDoc<Company>(companyRef);

  // Filtrar OTs si es técnico: solo las que tiene asignadas
  const realWorkOrders = useMemo(() => {
    if (!workOrders) return [];
    if (isTechnician && profile?.id) {
      return workOrders.filter(ot => ot.assignedToStaffIds?.includes(profile.id));
    }
    return workOrders;
  }, [workOrders, isTechnician, profile?.id]);

  const today = startOfDay(new Date());
  
  const onboardingSteps = useMemo(() => {
    if (!company || isTechnician) return [];
    return [
      { id: 'profile', label: 'Datos Legales Empresa', desc: 'Configura tu RUT y dirección comercial', completed: !!company.rut && company.rut !== "RUT por definir", href: '/company' },
      { id: 'team', label: 'Cargar Equipo Técnico', desc: 'Registra a tus técnicos o brigadas', completed: (staff?.length || 0) > 0, href: '/team' },
      { id: 'clients', label: 'Primeros Clientes', desc: 'Añade empresas mandantes', completed: (clients?.length || 0) > 0, href: '/clients' },
      { id: 'ots', label: 'Crear Primera OT', desc: 'Inicia el flujo operacional', completed: realWorkOrders.length > 0, href: '/work-orders/new' }
    ];
  }, [company, staff, clients, realWorkOrders, isTechnician]);

  const allStepsCompleted = onboardingSteps.length === 0 || onboardingSteps.every(s => s.completed);

  const overdueOrders = useMemo(() => {
    return realWorkOrders.filter(ot => {
      if (ot.status === 'aprobada') return false;
      const dateToUse = ot.scheduledDate || ot.createdAt;
      const endDate = dateToUse?.toDate ? dateToUse.toDate() : (typeof dateToUse === 'string' ? parseISO(dateToUse) : null);
      return endDate && isBefore(endDate, today);
    });
  }, [realWorkOrders, today]);

  const pendingRequests = useMemo(() => {
    return (workOrders || []).filter(ot => ot.status === 'solicitada');
  }, [workOrders]);

  const upcomingOrders = useMemo(() => {
    const nextWeek = addDays(today, 7);
    return realWorkOrders.filter(ot => {
      const dateToUse = ot.scheduledDate || ot.createdAt;
      const startDate = dateToUse?.toDate ? dateToUse.toDate() : (typeof dateToUse === 'string' ? parseISO(dateToUse) : null);
      return startDate && isAfter(startDate, today) && isBefore(startDate, nextWeek);
    }).sort((a, b) => {
      const dateA = a.scheduledDate?.toDate ? a.scheduledDate.toDate() : parseISO(a.scheduledDate);
      const dateB = b.scheduledDate?.toDate ? b.scheduledDate.toDate() : parseISO(b.scheduledDate);
      return dateA.getTime() - dateB.getTime();
    });
  }, [realWorkOrders, today]);

  if (isUserLoading || isOrdersLoading || !mounted) {
    return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tighter text-slate-900 italic">
            {isTechnician ? "Mi Hoja de Ruta" : "Central de Comando"}
          </h2>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Bienvenido, {profile?.name}. Tienes {realWorkOrders.filter(ot => ot.status !== 'aprobada').length} tareas activas.
          </p>
        </div>
        {!isTechnician && (
          <Button asChild className="h-12 px-6 rounded-xl shadow-xl shadow-primary/20 font-black gap-2 hover:scale-105 transition-transform">
            <Link href="/work-orders/new"><Plus className="h-5 w-5" /> Nueva Orden de Trabajo</Link>
          </Button>
        )}
      </div>

      {pendingRequests.length > 0 && !isTechnician && (
        <Alert className="border-none bg-indigo-600 text-white rounded-[2rem] p-6 shadow-xl shadow-indigo-900/20 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl"><Globe className="h-6 w-6" /></div>
              <div>
                <AlertTitle className="text-lg font-black uppercase tracking-tighter italic">Nuevos Pedidos Externos</AlertTitle>
                <AlertDescription className="font-bold opacity-90">Tienes {pendingRequests.length} servicios solicitados por clientes esperando triage.</AlertDescription>
              </div>
            </div>
            <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white rounded-xl font-black uppercase text-[10px] tracking-widest h-10" asChild>
              <Link href="/work-orders">Ver Solicitudes <ArrowUpRight className="ml-2 h-3 w-3" /></Link>
            </Button>
          </div>
        </Alert>
      )}

      {/* SISTEMA DE ONBOARDING INTUITIVO - SOLO ADMINS */}
      {!isTechnician && !allStepsCompleted && (
        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-slate-900 text-white overflow-hidden animate-in slide-in-from-top-4 duration-700">
          <div className="grid md:grid-cols-3">
            <div className="p-8 md:p-12 space-y-6 bg-blue-600/10 border-r border-white/5">
              <div className="bg-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                <Zap className="h-8 w-8 text-white fill-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black tracking-tighter italic uppercase leading-none">Guía de <br />Activación</h3>
                <p className="text-slate-400 text-sm font-medium">Completa estos pasos para profesionalizar tu gestión técnica.</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Progreso de Configuración</p>
                <div className="flex items-center gap-3">
                  <Progress value={(onboardingSteps.filter(s => s.completed).length / 4) * 100} className="h-2 flex-1 bg-white/10" />
                  <span className="text-xs font-black">{Math.round((onboardingSteps.filter(s => s.completed).length / 4) * 100)}%</span>
                </div>
              </div>
            </div>
            <div className="md:col-span-2 p-8 md:p-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {onboardingSteps.map((step) => (
                <Link key={step.id} href={step.href}>
                  <div className={cn(
                    "group p-5 rounded-[1.5rem] border-2 transition-all flex items-center justify-between h-full",
                    step.completed ? "border-emerald-500/20 bg-emerald-500/5 opacity-60" : "border-white/10 bg-white/5 hover:border-blue-500/50 hover:bg-white/10"
                  )}>
                    <div className="space-y-1">
                      <p className={cn("text-xs font-black uppercase tracking-widest", step.completed ? "text-emerald-400" : "text-blue-400")}>{step.label}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{step.desc}</p>
                    </div>
                    {step.completed ? (
                      <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                        <Check className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* ACCESOS DIRECTOS DE GESTIÓN PERMANENTES PARA ADMINS */}
      {!isTechnician && allStepsCompleted && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/clients">
            <Card className="rounded-3xl border-none shadow-sm hover:shadow-md transition-all group overflow-hidden bg-white">
              <div className="flex items-center p-6 gap-4">
                <div className="bg-primary/10 p-3 rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors">
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-slate-900 uppercase tracking-tighter">Cartera de Clientes</h4>
                  <p className="text-xs text-muted-foreground font-medium">{clientsCount} de {maxClients} cupos utilizados</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300" />
              </div>
            </Card>
          </Link>
          <Link href="/team">
            <Card className="rounded-3xl border-none shadow-sm hover:shadow-md transition-all group overflow-hidden bg-white">
              <div className="flex items-center p-6 gap-4">
                <div className="bg-blue-100 p-3 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Users className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-slate-900 uppercase tracking-tighter">Equipo Técnico</h4>
                  <p className="text-xs text-muted-foreground font-medium">{staffCount} de {maxStaff} técnicos activos</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300" />
              </div>
            </Card>
          </Link>
        </div>
      )}

      {overdueOrders.length > 0 && (
        <Alert variant="destructive" className="border-none bg-rose-500 text-white rounded-[2rem] p-6 shadow-xl shadow-rose-900/20 animate-pulse">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl"><AlertTriangle className="h-6 w-6" /></div>
              <div>
                <AlertTitle className="text-lg font-black uppercase tracking-tighter italic">Alerta de Plazos</AlertTitle>
                <AlertDescription className="font-bold opacity-90">Atención: {overdueOrders.length} {isTechnician ? 'de tus servicios han' : 'servicios han'} excedido su fecha estimada.</AlertDescription>
              </div>
            </div>
            <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white rounded-xl font-black uppercase text-[10px] tracking-widest h-10" asChild>
              <Link href="/work-orders">Intervenir Ahora <ArrowUpRight className="ml-2 h-3 w-3" /></Link>
            </Button>
          </div>
        </Alert>
      )}

      {/* METRICAS TÉCNICAS SEGMENTADAS */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: isTechnician ? "Mis Tareas" : "Total Órdenes", value: realWorkOrders.length, icon: ClipboardList, color: "bg-blue-600", desc: "Historial acumulado" },
          { label: "En Ejecución", value: realWorkOrders.filter(ot => ot.status !== 'aprobada' && ot.status !== 'creada' && ot.status !== 'solicitada').length, icon: Activity, color: "bg-indigo-600", desc: "Tareas de campo" },
          { label: "Finalizadas", value: realWorkOrders.filter(ot => ot.status === 'aprobada').length, icon: Trophy, color: "bg-emerald-600", desc: "Con sello digital" },
          { label: "Solicitudes", value: pendingRequests.length, icon: Globe, color: "bg-purple-600", desc: "Pedidos externos" }
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden group hover:shadow-xl transition-all duration-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{stat.label}</CardTitle>
              <div className={cn("p-2 rounded-xl transition-transform group-hover:scale-110", stat.color)}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-slate-900 tracking-tighter mb-1">{stat.value}</div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-7">
        <Card className="md:col-span-4 border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="flex flex-row items-center justify-between p-8 bg-slate-50/50 border-b">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" /> Avance Operativo
              </CardTitle>
              <CardDescription className="text-xs font-bold uppercase text-slate-400">Progreso real de servicios abiertos.</CardDescription>
            </div>
            <div className="bg-primary/10 p-3 rounded-2xl"><Activity className="h-5 w-5 text-primary" /></div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {realWorkOrders.filter(ot => ot.status !== 'aprobada' && ot.status !== 'solicitada').length > 0 ? (
              realWorkOrders.filter(ot => ot.status !== 'aprobada' && ot.status !== 'solicitada').slice(0, 5).map((ot) => {
                const completed = ot.checklist?.filter(i => i.completed).length || 0;
                const total = ot.checklist?.length || 1;
                const progress = Math.round((completed / total) * 100);
                return (
                  <div key={ot.id} className="space-y-3 group cursor-pointer">
                    <Link href={`/work-orders/${ot.id}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-[10px] tracking-widest shadow-lg shadow-slate-900/20 group-hover:scale-110 transition-transform">
                            {ot.id.slice(-3)}
                          </div>
                          <div>
                            <span className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors">{ot.id}</span>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Estado: {ot.status}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="h-6 px-3 rounded-full font-black text-[9px] border-primary/20 text-primary">
                          {progress}% COMPLETADO
                        </Badge>
                      </div>
                      <Progress value={progress} className="h-2 rounded-full mt-3" />
                    </Link>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed space-y-4">
                <div className="bg-white p-4 rounded-full w-fit mx-auto shadow-sm"><Lightbulb className="h-8 w-8 text-slate-300" /></div>
                <div>
                  <p className="font-black text-slate-900 uppercase tracking-tighter italic">Sin Tareas Activas</p>
                  <p className="text-xs text-slate-400 font-medium">Todas tus órdenes están al día o aprobadas.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-slate-900 text-white">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-blue-400" /> Próximos Hitos
              </CardTitle>
              <Badge className="bg-blue-600 text-white border-none font-bold text-[9px] tracking-widest uppercase">7 Días</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <div className="space-y-4">
              {upcomingOrders.length > 0 ? (
                upcomingOrders.slice(0, 4).map((ot) => {
                  const date = ot.scheduledDate?.toDate ? ot.scheduledDate.toDate() : (typeof ot.scheduledDate === 'string' ? parseISO(ot.scheduledDate) : new Date());
                  return (
                    <Link key={ot.id} href={`/work-orders/${ot.id}`} className="block">
                      <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/50 transition-all group">
                        <div className="bg-blue-600/20 p-2 rounded-xl text-blue-400 text-center min-w-[50px] group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <p className="text-[10px] font-black uppercase leading-none mb-1">{format(date, 'MMM', { locale: es })}</p>
                          <p className="text-xl font-black leading-none">{format(date, 'dd')}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black truncate">{ot.id}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Comienza en {ot.durationDays || 1} días</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1 italic">"{ot.description}"</p>
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="text-center py-16 opacity-30 italic space-y-2">
                  <Clock className="h-10 w-10 mx-auto" />
                  <p className="text-xs font-bold uppercase tracking-widest">Sin hitos cercanos</p>
                </div>
              )}
            </div>
            {upcomingOrders.length > 0 && (
              <Button variant="ghost" className="w-full mt-6 text-blue-400 font-black uppercase text-[10px] tracking-[0.3em] hover:bg-white/5 h-12" asChild>
                <Link href="/calendar">Ver Calendario Completo</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
