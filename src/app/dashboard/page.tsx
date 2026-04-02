
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
  Inbox,
  Droplets,
  TrendingUp,
  Settings,
  MapPin,
  Scale,
  UserCog,
  Home,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Progress } from "@/components/ui/progress";
import { isBefore, parseISO, startOfDay, differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { WorkOrder, Client, Company, Asset, WaterMeter, Community } from "@/lib/types";
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

// SIMULACIÓN PARA JUAN FERNÁNDEZ CUANDO SE LOGUEA COMO ADMIN
const SIM_JUAN_COMMUNITIES: Community[] = [
  { id: 'comm-juan-1', companyId: 'adm-juan-f', name: 'Edificio Horizonte', address: 'Calle 2 Norte 1245, Viña del Mar', city: 'Viña del Mar', isActive: true, createdAt: new Date().toISOString() },
  { id: 'comm-juan-2', companyId: 'adm-juan-f', name: 'Condominio Mar Azul', address: 'Av. Libertad 450, Viña del Mar', city: 'Viña del Mar', isActive: true, createdAt: new Date().toISOString() },
];

export default function DashboardPage() {
  const { profile, isLoading: isUserLoading, isTechnician, isCompanyAdmin, isSupervisor, isBuildingAdmin } = useUser();
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

  // Queries generales
  const workOrdersQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "workOrders") : null, [db, companyId]);
  const communitiesQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "communities") : null, [db, companyId]);
  const companyRef = useMemoFirebase(() => db && companyId ? doc(db, "companies", companyId) : null, [db, companyId]);
  
  const { data: rawWorkOrders, isLoading: isOrdersLoading } = useCollection<WorkOrder>(workOrdersQuery);
  const { data: rawCommunities, isLoading: isCommunitiesLoading } = useCollection<Community>(communitiesQuery);
  const { data: company, isLoading: isCompanyLoading } = useDoc<Company>(companyRef);

  const workOrders = useMemo(() => (rawWorkOrders || []).filter(o => !o.isDeleted), [rawWorkOrders]);
  
  // Lógica de Cartera (Communities)
  const communities = useMemo(() => {
    // Si el administrador es Juan Fernández, inyectamos su cartera simulada
    if (profile?.name?.includes("Juan Fernández") || company?.id === 'adm-juan-f') {
      return SIM_JUAN_COMMUNITIES;
    }
    return rawCommunities || [];
  }, [rawCommunities, profile, company]);

  const stats = useMemo(() => {
    const total = workOrders.length;
    const completed = workOrders.filter(ot => ot.status === 'aprobada').length;
    const reviewPending = workOrders.filter(ot => ot.status === 'en revision').length;
    const clientRequests = workOrders.filter(ot => ot.status === 'solicitada');
    
    return { 
      total, completed, reviewPending,
      clientRequests: clientRequests.length,
      activeRecintos: communities.length
    };
  }, [workOrders, communities]);

  if (!mounted || isUserLoading || isOrdersLoading || isCompanyLoading || isCommunitiesLoading || !today) {
    return (
      <div className="flex flex-col h-[400px] items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Sincronizando Entorno Operativo...</p>
      </div>
    );
  }

  // --- VISTA ADMINISTRADOR DE CARTERA (JUAN FERNÁNDEZ / EMPRESA) ---
  if (isCompanyAdmin || isSupervisor) {
    return (
      <div className="space-y-10 pb-20 animate-in fade-in duration-700">
        {/* SECCIÓN 1: FICHA DEL ADMINISTRADOR (CORPO) */}
        <div className="flex flex-col lg:flex-row gap-6">
          <Card className="flex-1 rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white overflow-hidden relative group">
            <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><UserCog className="h-40 w-40 text-blue-400" /></div>
            <CardContent className="p-10 flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="h-24 w-24 rounded-[2rem] bg-blue-600 flex items-center justify-center shadow-2xl border-4 border-white/10 shrink-0">
                <Building2 className="h-12 w-12 text-white" />
              </div>
              <div className="text-center md:text-left space-y-2 flex-1">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <Badge className="bg-blue-600 text-white font-black uppercase text-[10px] px-3 w-fit mx-auto md:mx-0">Registro SaaS Activo</Badge>
                  <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">ID: {company?.id}</span>
                </div>
                <h2 className="text-4xl font-black italic tracking-tighter uppercase">{company?.name || "Administración de Recintos"}</h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-400 font-bold text-xs">
                  <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> RUT: {company?.rut}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {company?.address}</span>
                </div>
              </div>
              <div className="shrink-0 flex flex-col gap-2">
                <Badge variant="outline" className="border-white/20 text-white font-black uppercase text-[10px] px-4 py-2 rounded-full backdrop-blur-md bg-white/5">
                  Plan {company?.currentPlan?.toUpperCase() || "ENTERPRISE"}
                </Badge>
                <Button asChild variant="ghost" className="text-blue-400 hover:text-blue-300 font-black uppercase text-[9px] tracking-widest">
                  <Link href="/company">Ver Ficha Completa <ChevronRight className="h-3 w-3" /></Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:w-80 rounded-[2.5rem] border-none shadow-xl bg-blue-600 text-white p-10 flex flex-col justify-center text-center space-y-4">
            <div className="bg-white/20 p-4 rounded-3xl w-fit mx-auto mb-2"><Home className="h-10 w-10" /></div>
            <div className="space-y-1">
              <p className="text-5xl font-black italic tracking-tighter">{stats.activeRecintos}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Recintos en Cartera</p>
            </div>
          </Card>
        </div>

        {/* SECCIÓN 2: KPIs DE CARTERA */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Consumo Agregado", value: "1,452.4 m³", desc: "Toda la cartera", icon: Droplets, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Eficiencia Promedio", value: "94.2%", desc: "Balance hídrico global", icon: Scale, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Fugas Detectadas", value: "12", desc: "Requieren atención", icon: ShieldAlert, color: "text-rose-600", bg: "bg-rose-50" },
            { label: "Servicios en Curso", value: stats.total - stats.completed, desc: "Órdenes activas", icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50" },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</CardTitle>
                  <p className="text-[8px] font-bold text-slate-300 uppercase">{stat.desc}</p>
                </div>
                <div className={cn("p-2.5 rounded-2xl", stat.bg)}><stat.icon className={cn("h-4 w-4", stat.color)} /></div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* SECCIÓN 3: CARTERA DE RECINTOS (COMUNIDADES) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="space-y-1">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-blue-600" /> Cartera de Recintos
              </h3>
              <p className="text-[10px] font-bold uppercase text-slate-400">Edificios y Condominios bajo su administración</p>
            </div>
            <Button asChild variant="outline" className="rounded-xl font-bold h-10 border-slate-200">
              <Link href="/team">Gestionar Cuadrillas</Link>
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {communities.map((comm) => (
              <Card key={comm.id} className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white group hover:shadow-2xl transition-all border-2 border-transparent hover:border-blue-100 flex flex-col">
                <CardContent className="p-8 space-y-6 flex-1">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-50 p-4 rounded-3xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><Building2 className="h-8 w-8" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter truncate">{comm.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" /> {comm.city || 'S/I'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl space-y-1">
                      <p className="text-[9px] font-black uppercase text-slate-400">Eficiencia</p>
                      <p className="text-xl font-black text-emerald-600 italic">96.4%</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl space-y-1">
                      <p className="text-[9px] font-black uppercase text-slate-400">Alertas</p>
                      <p className="text-xl font-black text-rose-600 italic">2 Activas</p>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-5 rounded-2xl space-y-2">
                    <p className="text-[9px] font-black uppercase text-blue-400 tracking-widest">Dirección Operativa</p>
                    <p className="text-xs font-bold text-slate-300 leading-relaxed line-clamp-1">{comm.address}</p>
                  </div>
                </CardContent>
                <CardFooter className="p-8 pt-0">
                  <Button asChild className="w-full h-12 rounded-2xl bg-slate-900 group-hover:bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-xl transition-all">
                    <Link href={`/communities/${comm.id}`}>Administrar Recinto <ArrowUpRight className="h-4 w-4" /></Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}

            <button className="border-4 border-dashed rounded-[3rem] p-10 flex flex-col items-center justify-center text-center space-y-4 hover:bg-white hover:border-blue-200 transition-all group">
              <div className="bg-slate-100 p-6 rounded-full group-hover:bg-blue-50 transition-colors"><Plus className="h-10 w-10 text-slate-300 group-hover:text-blue-600" /></div>
              <div className="space-y-1">
                <p className="text-xl font-black italic uppercase text-slate-400 group-hover:text-blue-900 transition-colors">Nuevo Recinto</p>
                <p className="text-xs text-slate-400 font-medium">Amplía tu cartera de administración</p>
              </div>
            </button>
          </div>
        </div>

        {/* SECCIÓN 4: ACCIONES RÁPIDAS ERP */}
        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="rounded-[3rem] border-none shadow-xl bg-white overflow-hidden group hover:shadow-2xl transition-all">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-5 h-full">
                <div className="md:col-span-2 bg-slate-100 p-8 flex flex-col justify-center items-center text-center space-y-4">
                  <div className="bg-white p-4 rounded-3xl shadow-sm"><Users className="h-10 w-10 text-slate-900" /></div>
                  <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Equipo de Campo</h3>
                </div>
                <div className="md:col-span-3 p-8 flex flex-col justify-center space-y-4">
                  <p className="text-sm text-slate-500 font-medium">Gestione su flota de técnicos, configure cuadrillas y monitoree el cumplimiento de protocolos.</p>
                  <Button asChild className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 font-black uppercase tracking-widest text-[10px] gap-2">
                    <Link href="/team">Administrar Personal <ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[3rem] border-none shadow-xl bg-emerald-600 text-white overflow-hidden group hover:shadow-2xl transition-all">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-5 h-full">
                <div className="md:col-span-2 bg-emerald-700 p-8 flex flex-col justify-center items-center text-center space-y-4">
                  <div className="bg-white/20 p-4 rounded-3xl"><Receipt className="h-10 w-10 text-white" /></div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Facturación DTE</h3>
                </div>
                <div className="md:col-span-3 p-8 flex flex-col justify-center space-y-4">
                  <p className="text-sm text-emerald-50 font-medium">Emita facturas y boletas electrónicas integradas con el SII basándose en sus OTs aprobadas.</p>
                  <Button asChild className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 font-black uppercase tracking-widest text-[10px] gap-2">
                    <Link href="/billing">Emitir Documento <ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // --- VISTA ADMINISTRADOR DE EDIFICIO (YA EXISTENTE) ---
  if (isBuildingAdmin) {
    return (
      <div className="space-y-8 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 italic uppercase">Dashboard Hídrico</h2>
            <p className="text-muted-foreground font-medium">Estado de telemetría para {company?.name}.</p>
          </div>
          <Button asChild className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 font-black gap-2 shadow-xl shadow-blue-900/20">
            <Link href="/water-control"><Droplets className="h-5 w-5" /> Monitor Tiempo Real</Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-blue-600 text-white overflow-hidden relative group">
            <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Activity className="h-32 w-32" /></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-blue-100">Consumo Acumulado (Mes)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black italic tracking-tighter">1,242.1</span>
                <span className="text-xl font-bold opacity-50 italic">m³</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden relative group">
            <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><AlertTriangle className="h-32 w-32" /></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fugas Detectadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-black italic tracking-tighter">2</div>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Eventos críticos activos</p>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white overflow-hidden relative group">
            <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Zap className="h-32 w-32 text-blue-400" /></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Válvulas de Corte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-black italic tracking-tighter">1</div>
              <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Suministros suspendidos</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="rounded-[3rem] border-none shadow-xl bg-white overflow-hidden group hover:shadow-2xl transition-all">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-5">
                <div className="md:col-span-2 bg-blue-600 p-10 flex flex-col justify-center items-center text-center space-y-4">
                  <div className="bg-white/20 p-5 rounded-3xl shadow-inner"><Monitor className="h-12 w-12 text-white" /></div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">Gestión<br/>Avanzada</h3>
                </div>
                <div className="md:col-span-3 p-10 flex flex-col justify-center space-y-6">
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">Acceda al monitor detallado para ver la telemetría de cada unidad y realizar cortes remotos de emergencia.</p>
                  <Button asChild className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest text-[10px] gap-3 shadow-lg">
                    <Link href="/water-control">Abrir Monitor Live <ChevronRight className="h-4 w-4" /></Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[3rem] border-none shadow-xl bg-slate-900 text-white p-10 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 opacity-10"><History className="h-48 w-48 text-blue-400" /></div>
            <div className="relative z-10 space-y-6">
              <div className="space-y-2">
                <Badge className="bg-blue-600 text-white font-black uppercase text-[9px] px-3 py-1">Trazabilidad Total</Badge>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Historial Auditivo</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Revise las curvas de consumo históricas de su comunidad. Identifique patrones de desperdicio y valide la integridad de su red.
              </p>
              <Button asChild variant="outline" className="w-full h-12 rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10 font-bold uppercase text-[10px] tracking-widest">
                <Link href="/water-control">Ver historial por unidad</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // --- VISTA TÉCNICO ---
  if (isTechnician) {
    return (
      <div className="space-y-8 pb-32">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 italic uppercase">Hola, {profile?.name?.split(' ')[0]}</h2>
            <p className="text-muted-foreground font-medium">Esta es tu hoja de ruta para hoy en {company?.name}.</p>
          </div>
        </div>

        <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white max-w-4xl">
          <CardHeader className="bg-slate-50/50 p-6 border-b">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" /> Mi Hoja de Ruta
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {workOrders.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="bg-slate-50 p-6 rounded-full w-fit mx-auto opacity-50"><HardHat className="h-10 w-10 text-slate-300" /></div>
                <p className="text-slate-400 italic text-sm font-medium">No tienes órdenes asignadas para hoy.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {workOrders.slice(0, 5).map((ot) => (
                  <Link key={ot.id} href={`/work-orders/${ot.id}`}>
                    <div className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1"><span className="text-sm font-black text-primary italic">{ot.id}</span></div>
                        <p className="text-xs font-bold text-slate-900 truncate">{ot.description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 ml-4" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
