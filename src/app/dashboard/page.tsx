
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
  Users
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { isBefore, parseISO, startOfDay } from "date-fns";
import { WorkOrder, Client, Company, StaffMember } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { profile, isLoading: isUserLoading, isTechnician } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => { 
    setMounted(true); 
    setToday(startOfDay(new Date()));
  }, []);

  const companyId = profile?.companyId || "";

  const workOrdersQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "workOrders") : null, [db, companyId]);
  const clientsQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "clients") : null, [db, companyId]);
  const staffQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "staff") : null, [db, companyId]);
  const companyRef = useMemoFirebase(() => db && companyId ? doc(db, "companies", companyId) : null, [db, companyId]);

  const { data: workOrders, isLoading: isOrdersLoading } = useCollection<WorkOrder>(workOrdersQuery);
  const { data: clients } = useCollection<Client>(clientsQuery);
  const { data: staff } = useCollection<StaffMember>(staffQuery);
  const { data: company } = useDoc<Company>(companyRef);

  const realWorkOrders = useMemo(() => {
    if (!workOrders) return [];
    if (isTechnician && profile?.id) {
      return workOrders.filter(ot => ot.assignedToStaffIds?.includes(profile.id));
    }
    return workOrders;
  }, [workOrders, isTechnician, profile?.id]);

  const criticalOrders = useMemo(() => {
    if (!today || !realWorkOrders) return [];
    return realWorkOrders.filter(ot => {
      if (ot.status === 'aprobada') return false;
      const dateToUse = ot.scheduledDate || ot.createdAt;
      if (!dateToUse) return false;
      const endDate = dateToUse?.toDate ? dateToUse.toDate() : (typeof dateToUse === 'string' ? parseISO(dateToUse) : null);
      
      const isOverdue = endDate && isBefore(endDate, today);
      const isUrgent = ot.urgency === 'high';
      
      return isOverdue || isUrgent;
    }).slice(0, 5);
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

  const allStepsCompleted = onboardingSteps.length === 0 || onboardingSteps.every(s => s.completed);

  if (!mounted || isUserLoading || isOrdersLoading || !today) {
    return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tighter text-slate-900 italic">
            {isTechnician ? "Mi Hoja de Ruta" : "Panel de Gestión"}
          </h2>
          <p className="text-muted-foreground font-medium">Bienvenido, {profile?.name}.</p>
        </div>
        {!isTechnician && (
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="h-12 px-6 rounded-xl font-bold border-primary/20 text-primary hover:bg-primary/5">
              <Link href="/field/capture"><Activity className="mr-2 h-4 w-4" /> Monitor en Vivo</Link>
            </Button>
            <Button asChild className="h-12 px-6 rounded-xl shadow-xl shadow-primary/20 font-black gap-2">
              <Link href="/work-orders/new"><Plus className="h-5 w-5" /> Nueva OT</Link>
            </Button>
          </div>
        )}
      </div>

      {!isTechnician && !allStepsCompleted && (
        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-slate-900 text-white overflow-hidden">
          <div className="grid md:grid-cols-3">
            <div className="p-8 md:p-12 space-y-6 bg-blue-600/10 border-r border-white/5">
              <div className="bg-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center">
                <Zap className="h-8 w-8 text-white fill-white" />
              </div>
              <h3 className="text-3xl font-black tracking-tighter italic uppercase leading-none">Guía de <br />Activación</h3>
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
                    {step.completed ? <Check className="h-4 w-4 text-emerald-400" /> : <ChevronRight className="h-4 w-4 text-white/20" />}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Órdenes", value: realWorkOrders.length, icon: ClipboardList, color: "bg-blue-600" },
          { label: "En Ejecución", value: realWorkOrders.filter(ot => ot.status !== 'aprobada').length, icon: Activity, color: "bg-indigo-600" },
          { label: "Finalizadas", value: realWorkOrders.filter(ot => ot.status === 'aprobada').length, icon: Trophy, color: "bg-emerald-600" },
          { label: "Alerta Plazos", value: realWorkOrders.filter(ot => {
            if (ot.status === 'aprobada') return false;
            const dateToUse = ot.scheduledDate || ot.createdAt;
            const endDate = dateToUse?.toDate ? dateToUse.toDate() : (typeof dateToUse === 'string' ? parseISO(dateToUse) : null);
            return endDate && isBefore(endDate, today);
          }).length, icon: AlertTriangle, color: "bg-rose-600" }
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{stat.label}</CardTitle>
              <div className={cn("p-2 rounded-xl", stat.color)}><stat.icon className="h-4 w-4 text-white" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2 rounded-[2rem] border-none shadow-sm overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 p-8 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight italic flex items-center gap-3">
                  <Activity className="h-5 w-5 text-primary" /> Gestión Operativa
                </CardTitle>
                <CardDescription className="text-xs font-bold uppercase text-slate-400 mt-1">Órdenes críticas y actividad reciente</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="rounded-xl font-bold">
                <Link href="/work-orders">Ver todas <ArrowRight className="ml-2 h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {criticalOrders.length > 0 && (
                <div className="bg-rose-50/30 p-4">
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest px-4 mb-3">Alertas Prioritarias</p>
                  {criticalOrders.map((ot) => (
                    <Link key={ot.id} href={`/work-orders/${ot.id}`}>
                      <div className="flex items-center justify-between p-4 hover:bg-white rounded-2xl transition-all group border border-transparent hover:border-rose-100 mb-2">
                        <div className="flex items-center gap-4">
                          <div className="bg-rose-100 p-2 rounded-xl text-rose-600 group-hover:scale-110 transition-transform">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">{ot.id}</p>
                            <p className="text-xs text-slate-500 font-medium truncate max-w-[200px]">{ot.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="bg-white text-rose-600 border-rose-200 text-[9px] font-black uppercase">Crítica</Badge>
                          <p className="text-[10px] text-slate-400 mt-1 font-bold">
                            {ot.urgency === 'high' ? 'URGENTE' : 'ATRASADA'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <div className="p-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-3">Últimas Órdenes Generadas</p>
                {recentOrders.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 italic text-sm">No hay actividad reciente.</div>
                ) : (
                  recentOrders.map((ot) => {
                    const client = clients?.find(c => c.id === ot.clientId);
                    return (
                      <Link key={ot.id} href={`/work-orders/${ot.id}`}>
                        <div className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="bg-slate-100 p-2 rounded-xl text-slate-500 group-hover:bg-primary group-hover:text-white transition-colors">
                              <ClipboardList className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">{ot.id}</p>
                              <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                <Building2 className="h-3 w-3" /> {client?.name || 'Cargando...'}
                              </p>
                            </div>
                          </div>
                          <Badge className={cn(
                            "text-[9px] font-black uppercase",
                            ot.status === 'aprobada' ? "bg-emerald-500" : "bg-blue-600"
                          )}>
                            {ot.status}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[2rem] border-none shadow-sm bg-slate-900 text-white overflow-hidden relative group">
            <div className="absolute -right-4 -top-4 p-8 opacity-10 group-hover:scale-110 transition-transform"><Zap className="h-32 w-32 text-amber-400" /></div>
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-lg font-black italic tracking-tighter uppercase text-amber-400">Acceso Técnico</CardTitle>
              <CardDescription className="text-slate-400 font-medium">Control directo para personal de campo.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              <Button asChild className="w-full h-14 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black uppercase tracking-widest gap-3 shadow-xl">
                <Link href="/field/capture"><Camera className="h-5 w-5" /> Iniciar Captura</Link>
              </Button>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">Estado del Equipo</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{staff?.length || 0} Técnicos activos</span>
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-6 border-b bg-slate-50/50">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <HardHat className="h-4 w-4 text-primary" /> Recursos Críticos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase">Personal Técnico</span>
                  <span className="text-sm font-black">{staff?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase">Clientes</span>
                  <span className="text-sm font-black">{clients?.length || 0}</span>
                </div>
              </div>
              <Button variant="outline" className="w-full rounded-xl font-bold text-xs" asChild>
                <Link href="/team">Gestionar Equipo <Users className="ml-2 h-3 w-3" /></Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
