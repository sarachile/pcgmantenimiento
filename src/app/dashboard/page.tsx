
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
  Camera,
  Users,
  Sparkles,
  Smartphone,
  Share,
  PlusSquare,
  Timer,
  CreditCard,
  History,
  Briefcase,
  Cpu,
  Waves,
  Calendar,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
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
import { usePlanLimits } from "@/hooks/use-plan-limits";

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { profile, isLoading: isUserLoading, isTechnician, isCompanyAdmin } = useUser();
  const limits = usePlanLimits();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => { 
    setMounted(true); 
    setToday(startOfDay(new Date()));
  }, []);

  const companyId = profile?.companyId || "";

  // Consultas Reales a Firestore
  const workOrdersQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "workOrders") : null, [db, companyId]);
  const clientsQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "clients") : null, [db, companyId]);
  const assetsQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "assets") : null, [db, companyId]);
  const companyRef = useMemoFirebase(() => db && companyId ? doc(db, "companies", companyId) : null, [db, companyId]);

  const { data: workOrders, isLoading: isOrdersLoading } = useCollection<WorkOrder>(workOrdersQuery);
  const { data: clients, isLoading: isClientsLoading } = useCollection<Client>(clientsQuery);
  const { data: assets, isLoading: isAssetsLoading } = useCollection<Asset>(assetsQuery);
  const { data: company, isLoading: isCompanyLoading } = useDoc<Company>(companyRef);

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
    const active = realWorkOrders.filter(ot => ot.status !== 'aprobada').length;
    const alert = realWorkOrders.filter(ot => {
      if (ot.status === 'aprobada' || !today) return false;
      const dateToUse = ot.scheduledDate || ot.createdAt;
      const endDate = dateToUse?.toDate ? dateToUse.toDate() : (typeof dateToUse === 'string' ? parseISO(dateToUse) : null);
      return endDate && isBefore(endDate, today);
    }).length;

    return { total, completed, active, alert };
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
    const maintenanceIoT = iotAssets.filter(a => a.maintenanceRequired).length;
    return { count: iotAssets.length, active: activeIoT, maintenance: maintenanceIoT };
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
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 italic uppercase">Mi Trabajo</h2>
            <p className="text-muted-foreground font-medium">Bienvenido, {profile?.name}.</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl bg-white shadow-sm border-slate-200 text-primary">
                <Smartphone className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2.5rem]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase text-primary">Instalar App</DialogTitle>
                <DialogDescription className="font-bold text-slate-500">Ten tu herramienta siempre a mano en tu pantalla de inicio.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3"><div className="bg-blue-100 p-2 rounded-lg text-blue-600 font-bold text-xs">iOS</div><p className="text-sm font-bold text-slate-700">En iPhone (Safari):</p></div>
                  <div className="bg-slate-50 p-4 rounded-2xl border space-y-3">
                    <div className="flex items-center gap-3 text-xs"><div className="h-6 w-6 bg-white border rounded-md flex items-center justify-center shadow-sm"><Share className="h-3 w-3" /></div><span>1. Pulsa el botón <strong>"Compartir"</strong>.</span></div>
                    <div className="flex items-center gap-3 text-xs"><div className="h-6 w-6 bg-white border rounded-md flex items-center justify-center shadow-sm"><PlusSquare className="h-3 w-3" /></div><span>2. Selecciona <strong>"Agregar a Inicio"</strong>.</span></div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white max-w-4xl">
          <CardHeader className="bg-slate-50/50 p-6 border-b"><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" /> Mi Hoja de Ruta</CardTitle></CardHeader>
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
                          <div className="flex items-center gap-2 mb-1"><span className="text-sm font-black text-primary italic">{ot.id}</span><Badge variant="outline" className="text-[8px] font-black uppercase">{ot.status}</Badge></div>
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

  // VISTA ADMINISTRADOR / SUPERVISOR
  return (
    <div className="space-y-8 pb-10">
      {trialDaysRemaining !== null && trialDaysRemaining <= 5 && (
        <Card className="rounded-[2.5rem] border-none bg-rose-600 text-white shadow-xl overflow-hidden animate-in slide-in-from-top-4 duration-500">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
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
          <h2 className="text-4xl font-black tracking-tighter text-slate-900 italic uppercase">Panel de Gestión</h2>
          <p className="text-muted-foreground font-medium">Empresa: {company?.name}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button asChild variant="outline" className="h-11 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50"><Link href="/clients"><Building2 className="mr-2 h-4 w-4" /> Clientes</Link></Button>
          <Button asChild className="h-11 px-6 rounded-xl shadow-lg font-black gap-2"><Link href="/work-orders/new"><Plus className="h-5 w-5" /> Nueva OT</Link></Button>
        </div>
      </div>

      {!allStepsCompleted && (
        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-slate-900 text-white overflow-hidden">
          <div className="grid md:grid-cols-3">
            <div className="p-10 space-y-6 bg-blue-600/10 border-r border-white/5">
              <div className="bg-blue-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40"><Zap className="h-6 w-6 text-white fill-white" /></div>
              <h3 className="text-2xl font-black tracking-tighter italic uppercase leading-none">Guía de <br />Activación</h3>
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

      {/* VENTANA DE ALERTAS IOT - REDISEÑADA */}
      {limits.features.apiAccess && (
        <Link href="/iot-control" className="block group">
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-blue-600 text-white overflow-hidden transition-all group-hover:scale-[1.01] active:scale-[0.99] shadow-blue-200">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-4">
                <div className="p-8 bg-white/10 flex flex-col justify-center items-center text-center border-r border-white/10">
                  <div className="bg-white/20 p-4 rounded-3xl mb-4"><Cpu className="h-8 w-8" /></div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Monitor Estratégico</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", iotStats.count > 0 ? "bg-emerald-400 animate-pulse" : "bg-white/30")} />
                    <p className="text-sm font-black">{iotStats.count > 0 ? 'SISTEMA ONLINE' : 'STANDBY'}</p>
                  </div>
                </div>
                <div className="md:col-span-3 p-8 flex flex-col sm:flex-row items-center justify-between gap-8">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-black uppercase italic tracking-tighter">Centro de Alertas de Planta</h3>
                      <div className="bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase">Click para gestionar</div>
                    </div>
                    <p className="text-sm text-blue-100 font-medium">
                      Monitoreo activo de parámetros críticos (Solar, Temp, Vib). Detección remota de anomalías en tiempo real.
                    </p>
                  </div>
                  <div className="flex gap-8 bg-black/10 p-6 rounded-[2rem] border border-white/10">
                    <div className="text-center">
                      <p className="text-4xl font-black italic tracking-tighter">{iotStats.active}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-emerald-300">Activos Normal</p>
                    </div>
                    <div className="h-12 w-px bg-white/10 self-center" />
                    <div className="text-center">
                      <p className={cn("text-4xl font-black italic tracking-tighter", iotStats.maintenance > 0 ? "text-amber-400" : "text-white/40")}>
                        {iotStats.maintenance}
                      </p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-blue-200">Alertas Mantención</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Órdenes", value: stats.total, icon: ClipboardList, color: "bg-blue-600" },
          { label: "En Ejecución", value: stats.active, icon: Activity, color: "bg-indigo-600" },
          { label: "Finalizadas", value: stats.completed, icon: Trophy, color: "bg-emerald-600" },
          { label: "Alertas", value: stats.alert, icon: AlertTriangle, color: "bg-rose-600" }
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden group hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{stat.label}</CardTitle><div className={cn("p-2 rounded-xl", stat.color)}><stat.icon className="h-4 w-4 text-white" /></div></CardHeader>
            <CardContent><div className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="bg-slate-50 border-b p-8">
            <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
              <History className="h-6 w-6 text-primary" /> Actividad Reciente
            </CardTitle>
            <CardDescription className="font-bold text-xs uppercase text-slate-400 tracking-widest">Últimos movimientos en tu red de servicios.</CardDescription>
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
                            ot.status === 'aprobada' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                          )}>
                            {ot.status === 'aprobada' ? <Trophy className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-black text-primary italic tracking-tight">{ot.id}</span>
                              <Badge variant="outline" className={cn(
                                "text-[8px] font-black uppercase tracking-tighter h-4 px-1.5",
                                ot.status === 'aprobada' ? "border-emerald-200 text-emerald-600" : "border-blue-200 text-blue-600"
                              )}>
                                {ot.status}
                              </Badge>
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
            <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-blue-400" /> Plan {company?.currentPlan?.toUpperCase()}
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs font-bold uppercase tracking-widest">Capacidad Híbrida del Entorno</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-10">
            {/* USO DE ADMINISTRADORES */}
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

            {/* USO DE TÉCNICOS */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><HardHat className="h-3 w-3 text-emerald-400" /> Ejecución Terreno</p>
                  <p className="text-3xl font-black italic tracking-tighter">{limits.techCount} / {limits.maxTechs}</p>
                </div>
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Personal Operativo</span>
              </div>
              <Progress value={(limits.techCount / limits.maxTechs) * 100} className="h-1.5 bg-white/10" />
            </div>

            {/* MONITOREO IOT */}
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
                  Este modelo separa el valor estratégico de la oficina del valor operativo en campo. Escala tu flota de técnicos y sensores sin perder el control central.
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
