
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
  MessageSquare,
  Camera,
  Users,
  Sparkles,
  Smartphone,
  Share,
  MoreVertical,
  PlusSquare,
  Info,
  Timer,
  CreditCard,
  History
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { isBefore, parseISO, startOfDay, differenceInDays } from "date-fns";
import { WorkOrder, Client, Company, StaffMember } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { profile, isLoading: isUserLoading, isTechnician, isCompanyAdmin, isSupervisor } = useUser();
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
  const staffQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "staff") : null, [db, companyId]);
  const companyRef = useMemoFirebase(() => db && companyId ? doc(db, "companies", companyId) : null, [db, companyId]);

  const { data: workOrders, isLoading: isOrdersLoading } = useCollection<WorkOrder>(workOrdersQuery);
  const { data: clients, isLoading: isClientsLoading } = useCollection<Client>(clientsQuery);
  const { data: staff, isLoading: isStaffLoading } = useCollection<StaffMember>(staffQuery);
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

  const onboardingSteps = useMemo(() => {
    if (!company || isTechnician) return [];
    return [
      { id: 'profile', label: 'Datos Empresa', desc: 'RUT y dirección', completed: !!company.rut && company.rut !== "RUT por definir", href: '/company' },
      { id: 'team', label: 'Cargar Equipo', desc: 'Registra técnicos', completed: (staff?.length || 0) > 0, href: '/team' },
      { id: 'clients', label: 'Clientes', desc: 'Añade mandantes', completed: (clients?.length || 0) > 0, href: '/clients' },
      { id: 'ots', label: 'Primera OT', desc: 'Inicia flujo', completed: realWorkOrders.length > 0, href: '/work-orders/new' }
    ];
  }, [company, staff, clients, realWorkOrders, isTechnician]);

  const allStepsCompleted = onboardingSteps.length > 0 && onboardingSteps.every(s => s.completed);

  const trialDaysRemaining = useMemo(() => {
    if (!company?.trialEndsAt || !today) return null;
    const end = company.trialEndsAt.toDate ? company.trialEndsAt.toDate() : parseISO(company.trialEndsAt);
    return differenceInDays(end, today);
  }, [company?.trialEndsAt, today]);

  // Esperar a que todo cargue para evitar parpadeos o estados vacíos falsos
  if (!mounted || isUserLoading || isOrdersLoading || isClientsLoading || isStaffLoading || isCompanyLoading || !today) {
    return (
      <div className="flex flex-col h-[400px] items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Sincronizando Entorno Operativo...</p>
      </div>
    );
  }

  // VISTA PARA EL TÉCNICO EN TERRENO
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
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600 font-bold text-xs">iOS</div>
                    <p className="text-sm font-bold text-slate-700">En iPhone (Safari):</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border space-y-3">
                    <div className="flex items-center gap-3 text-xs">
                      <div className="h-6 w-6 bg-white border rounded-md flex items-center justify-center shadow-sm"><Share className="h-3 w-3" /></div>
                      <span>1. Pulsa el botón <strong>"Compartir"</strong> en la barra inferior.</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="h-6 w-6 bg-white border rounded-md flex items-center justify-center shadow-sm"><PlusSquare className="h-3 w-3" /></div>
                      <span>2. Busca y selecciona <strong>"Agregar a Inicio"</strong>.</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 font-bold text-xs">Android</div>
                    <p className="text-sm font-bold text-slate-700">En Android (Chrome):</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border space-y-3">
                    <div className="flex items-center gap-3 text-xs">
                      <div className="h-6 w-6 bg-white border rounded-md flex items-center justify-center shadow-sm"><MoreVertical className="h-3 w-3" /></div>
                      <span>1. Pulsa los <strong>3 puntos</strong> de la esquina superior.</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="h-6 w-6 bg-white border rounded-md flex items-center justify-center shadow-sm"><Zap className="h-3 w-3" /></div>
                      <span>2. Selecciona <strong>"Instalar aplicación"</strong> o "Agregar a inicio".</span>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="md:hidden rounded-[2rem] border-none bg-blue-600 text-white shadow-xl mb-6 overflow-hidden relative animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="absolute right-0 top-0 p-6 opacity-20"><Zap className="h-16 w-16 text-white fill-white" /></div>
          <CardContent className="p-8">
            <h3 className="text-xl font-black uppercase tracking-tight italic mb-2">¿Listo para reportar?</h3>
            <p className="text-sm font-medium text-blue-50 leading-relaxed max-w-[85%]">
              Usa el botón central <span className="bg-white/20 px-2 py-1 rounded-lg inline-flex items-center gap-1.5 font-black border border-white/10 mx-1 shadow-sm"> <Camera className="h-3.5 w-3.5" /> CAPTURA </span> de la barra inferior para subir fotos y notas.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white max-w-4xl">
          <CardHeader className="bg-slate-50/50 p-6 border-b">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" /> Mi Hoja de Ruta</CardTitle>
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
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-black text-primary italic">{ot.id}</span>
                            <Badge variant="outline" className="text-[8px] font-black uppercase px-1.5 h-4">{ot.status}</Badge>
                          </div>
                          <p className="text-xs font-bold text-slate-900 truncate">{client?.name || 'Cargando...'}</p>
                          <p className="text-[10px] text-slate-400 truncate italic mt-0.5">"{ot.description}"</p>
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

  // VISTA PARA ADMINISTRADORES / SUPERVISORES
  return (
    <div className="space-y-8 pb-10">
      {/* BANNER DE TRIAL */}
      {trialDaysRemaining !== null && trialDaysRemaining <= 5 && (
        <Card className="rounded-[2.5rem] border-none bg-rose-600 text-white shadow-xl overflow-hidden animate-in slide-in-from-top-4 duration-500">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl"><Timer className="h-6 w-6" /></div>
              <div>
                <h3 className="font-black uppercase italic tracking-tight">Periodo de Prueba Finalizando</h3>
                <p className="text-sm font-medium text-rose-100">Te quedan {trialDaysRemaining} días para activar tu plan profesional y evitar la suspensión del servicio.</p>
              </div>
            </div>
            <Button asChild className="rounded-xl bg-white text-rose-600 hover:bg-rose-50 font-black uppercase tracking-widest gap-2 shadow-lg">
              <Link href="/billing/payment"><CreditCard className="h-4 w-4" /> Activar Plan Profesional</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tighter text-slate-900 italic">Panel de Gestión</h2>
          <p className="text-muted-foreground font-medium">Bienvenido, {profile?.name}.</p>
        </div>
        {(isCompanyAdmin || isSupervisor) && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button asChild variant="outline" className="h-11 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50">
              <Link href="/clients"><Building2 className="mr-2 h-4 w-4" /> Clientes</Link>
            </Button>
            <Button asChild className="h-11 px-6 rounded-xl shadow-lg font-black gap-2">
              <Link href="/work-orders/new"><Plus className="h-5 w-5" /> Nueva OT</Link>
            </Button>
          </div>
        )}
      </div>

      {!allStepsCompleted && (
        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-slate-900 text-white overflow-hidden animate-in zoom-in-95 duration-500">
          <div className="grid md:grid-cols-3">
            <div className="p-8 md:p-12 space-y-6 bg-blue-600/10 border-r border-white/5">
              <div className="bg-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                <Zap className="h-8 w-8 text-white fill-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black tracking-tighter italic uppercase leading-none">Guía de <br />Activación</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Sigue estos pasos para habilitar tu operación digital.</p>
              </div>
              <Progress value={(onboardingSteps.filter(s => s.completed).length / 4) * 100} className="h-2 bg-white/10" />
            </div>
            <div className="md:col-span-2 p-8 md:p-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {onboardingSteps.map((step) => (
                <Link key={step.id} href={step.href}>
                  <div className={cn(
                    "group p-5 rounded-[1.5rem] border-2 transition-all flex items-center justify-between h-full",
                    step.completed ? "border-emerald-500/20 bg-emerald-500/5 opacity-60" : "border-white/10 bg-white/5 hover:border-blue-500/50"
                  )}>
                    <div className="space-y-1">
                      <p className={cn("text-xs font-black uppercase tracking-widest", step.completed ? "text-emerald-400" : "text-blue-400")}>{step.label}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{step.desc}</p>
                    </div>
                    {step.completed ? <div className="bg-emerald-500/20 p-1.5 rounded-full"><Check className="h-3.5 w-3.5 text-emerald-400" /></div> : <ChevronRight className="h-4 w-4 text-white/20 group-hover:translate-x-1 transition-transform" />}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Órdenes", value: stats.total, icon: ClipboardList, color: "bg-blue-600" },
          { label: "En Ejecución", value: stats.active, icon: Activity, color: "bg-indigo-600" },
          { label: "Finalizadas", value: stats.completed, icon: Trophy, color: "bg-emerald-600" },
          { label: "Alerta Plazos", value: stats.alert, icon: AlertTriangle, color: "bg-rose-600" }
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden group hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{stat.label}</CardTitle>
              <div className={cn("p-2 rounded-xl transition-transform group-hover:scale-110", stat.color)}><stat.icon className="h-4 w-4 text-white" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="bg-slate-50 border-b p-8">
            <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3"><History className="h-6 w-6 text-primary" /> Actividad Reciente</CardTitle>
            <CardDescription className="font-bold text-xs uppercase text-slate-400 tracking-widest">Últimos movimientos en tu red de servicios.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {recentOrders.length === 0 ? (
              <div className="py-32 text-center space-y-6">
                <div className="bg-slate-50 p-8 rounded-full w-fit mx-auto opacity-50"><ClipboardList className="h-16 w-16 text-slate-200" /></div>
                <div>
                  <p className="text-xl font-black italic tracking-tighter uppercase">Sin movimientos</p>
                  <p className="text-sm text-slate-400 font-medium">Las órdenes que generes aparecerán aquí con su estado en vivo.</p>
                </div>
                {!isTechnician && (
                  <Button asChild className="rounded-xl h-12 px-8 font-black uppercase tracking-widest text-xs"><Link href="/work-orders/new">Generar Primera OT</Link></Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentOrders.map((ot) => {
                  const client = clients?.find(c => c.id === ot.clientId);
                  return (
                    <Link key={ot.id} href={`/work-orders/${ot.id}`} className="block group">
                      <div className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                            ot.status === 'aprobada' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                          )}>
                            {ot.status === 'aprobada' ? <Trophy className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">{ot.id}</p>
                            <p className="font-black text-slate-900 truncate max-w-[200px]">{client?.name || '...'}</p>
                            <p className="text-[10px] text-slate-500 truncate italic mt-0.5">"{ot.description}"</p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <Badge className={cn(
                            "text-[8px] font-black uppercase px-2 h-5 rounded-full border-none",
                            ot.status === 'aprobada' ? "bg-emerald-500 text-white" : "bg-blue-600 text-white"
                          )}>{ot.status}</Badge>
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </div>
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
              <Sparkles className="h-6 w-6 text-blue-400" /> Métricas Plan {company?.currentPlan?.toUpperCase()}
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs font-bold uppercase tracking-widest">Capacidad de tu entorno actual.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase text-slate-400">Personal Operativo</p>
                  <p className="text-3xl font-black italic tracking-tighter">{staff?.length || 0} / {company?.currentPlan === 'simple' ? 2 : company?.currentPlan === 'business' ? 10 : 100}</p>
                </div>
                <Link href="/team" className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:underline mb-1">Gestionar Equipo</Link>
              </div>
              <Progress value={((staff?.length || 0) / (company?.currentPlan === 'simple' ? 2 : 10)) * 100} className="h-1.5 bg-white/10" />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase text-slate-400">Clientes Activos</p>
                  <p className="text-3xl font-black italic tracking-tighter">{clients?.length || 0} / {company?.currentPlan === 'simple' ? 5 : 25}</p>
                </div>
                <Link href="/clients" className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:underline mb-1">Ver Clientes</Link>
              </div>
              <Progress value={((clients?.length || 0) / (company?.currentPlan === 'simple' ? 5 : 25)) * 100} className="h-1.5 bg-white/10" />
            </div>

            <div className="pt-6 border-t border-white/5">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-center gap-3 text-blue-400">
                  <Info className="h-5 w-5" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Escalabilidad Industrial</p>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  Si tu operación crece más allá de estos límites, puedes escalar tu plan en cualquier momento para obtener trazabilidad ilimitada.
                </p>
                <Button asChild variant="outline" className="w-full h-11 rounded-xl border-white/10 bg-transparent text-white hover:bg-white/10 font-bold uppercase text-[10px] tracking-widest">
                  <Link href="/subscription">Ver Planes de Potencia</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
