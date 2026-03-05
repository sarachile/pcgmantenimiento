
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
  UserPlus,
  Building2,
  Zap,
  ChevronRight,
  Camera
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { isBefore, isAfter, addDays, parseISO, startOfDay } from "date-fns";
import { WorkOrder } from "@/lib/types";

export default function DashboardPage() {
  const { profile, isLoading: isUserLoading } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const workOrdersQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return collection(db, "companies", profile.companyId, "workOrders");
  }, [db, profile?.companyId]);

  const { data: workOrders, isLoading: isOrdersLoading } = useCollection<WorkOrder>(workOrdersQuery);

  const realWorkOrders = workOrders || [];

  const today = startOfDay(new Date());
  
  const overdueOrders = useMemo(() => {
    return realWorkOrders.filter(ot => {
      if (ot.status === 'aprobada') return false;
      const endDate = ot.estimatedEndDate?.toDate ? ot.estimatedEndDate.toDate() : (ot.estimatedEndDate ? parseISO(ot.estimatedEndDate) : null);
      return endDate && isBefore(endDate, today);
    });
  }, [realWorkOrders, today]);

  const upcomingOrders = useMemo(() => {
    const nextWeek = addDays(today, 7);
    return realWorkOrders.filter(ot => {
      const startDate = ot.scheduledDate?.toDate ? ot.scheduledDate.toDate() : (ot.scheduledDate ? parseISO(ot.scheduledDate) : null);
      return startDate && isAfter(startDate, today) && isBefore(startDate, nextWeek);
    }).sort((a, b) => {
      const dateA = a.scheduledDate?.toDate ? a.scheduledDate.toDate() : parseISO(a.scheduledDate);
      const dateB = b.scheduledDate?.toDate ? b.scheduledDate.toDate() : parseISO(b.scheduledDate);
      return dateA.getTime() - dateB.getTime();
    });
  }, [realWorkOrders, today]);

  const calculateProgress = (ot: WorkOrder) => {
    if (!ot.checklist || ot.checklist.length === 0) return 0;
    const completed = ot.checklist.filter(i => i.completed).length;
    return Math.round((completed / ot.checklist.length) * 100);
  };

  if (isUserLoading || isOrdersLoading || !mounted) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Panel de Control</h2>
          <p className="text-muted-foreground">Bienvenido, {profile?.name}. Aquí está el resumen de tu operación.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild className="shadow-lg shadow-primary/20">
            <Link href="/work-orders/new">
              <Plus className="mr-2 h-4 w-4" /> Nueva Orden de Trabajo
            </Link>
          </Button>
        </div>
      </div>

      {/* ACCESO RÁPIDO MÓVIL (VISIBLE SOLO EN CELULARES) */}
      <div className="block md:hidden mb-6">
        <Link href="/field/capture" className="group">
          <Card className="bg-primary text-white border-none shadow-2xl overflow-hidden relative active:scale-95 transition-transform">
            <div className="absolute top-0 right-0 p-6 opacity-20">
              <Camera className="h-24 w-24" />
            </div>
            <CardContent className="p-8">
              <div className="bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-4">
                <Camera className="h-8 w-8" />
              </div>
              <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none mb-2">Captura en Terreno</h3>
              <p className="text-primary-foreground/80 font-bold text-sm uppercase tracking-widest">Sube fotos a una OT ahora</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ACCESOS DIRECTOS PRO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/clients" className="group">
          <Card className="relative overflow-hidden border-none shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br from-indigo-600 to-blue-700 text-white">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Building2 className="h-32 w-32" />
            </div>
            <CardHeader className="pb-2">
              <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-black italic tracking-tight">Creación de Cliente</CardTitle>
              <CardDescription className="text-indigo-100 text-base font-medium">
                Registra nuevas empresas y puntos de servicio para comenzar a asignar trabajos.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex items-center text-sm font-bold uppercase tracking-widest gap-2">
              Gestionar Cartera <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/team" className="group">
          <Card className="relative overflow-hidden border-none shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="h-32 w-32" />
            </div>
            <CardHeader className="pb-2">
              <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-black italic tracking-tight">Equipo de Trabajo</CardTitle>
              <CardDescription className="text-emerald-100 text-base font-medium">
                Crea el listado de participantes, técnicos y supervisores para tus actividades.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex items-center text-sm font-bold uppercase tracking-widest gap-2">
              Configurar Participantes <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {overdueOrders.length > 0 && (
        <Alert variant="destructive" className="border-2 shadow-md bg-rose-50 border-rose-200 text-rose-900">
          <AlertTriangle className="h-5 w-5 text-rose-600" />
          <AlertTitle className="font-black uppercase tracking-wider text-xs mb-1">Alerta de Plazos</AlertTitle>
          <AlertDescription className="flex items-center justify-between font-medium">
            <span>Atención: {overdueOrders.length} órdenes han excedido su fecha de término.</span>
            <Button variant="link" className="text-rose-700 font-bold p-0 h-auto underline decoration-2 underline-offset-4" asChild>
              <Link href="/work-orders">Intervenir ahora <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* METRICAS SECUNDARIAS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Órdenes</CardTitle>
            <div className="bg-blue-50 p-1.5 rounded-lg">
              <ClipboardList className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{realWorkOrders.length}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest">En Revisión</CardTitle>
            <div className="bg-amber-50 p-1.5 rounded-lg">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{realWorkOrders.filter(ot => ot.status === 'en revision').length}</div>
          </CardContent>
          </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Finalizadas</CardTitle>
            <div className="bg-emerald-50 p-1.5 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{realWorkOrders.filter(ot => ot.status === 'aprobada').length}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Planificadas</CardTitle>
            <div className="bg-indigo-50 p-1.5 rounded-lg">
              <CalendarIcon className="h-4 w-4 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{upcomingOrders.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Avance Técnico</CardTitle>
              <CardDescription>Progreso real de las tareas en terreno.</CardDescription>
            </div>
            <Activity className="h-5 w-5 text-slate-300" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {realWorkOrders.filter(ot => ot.status !== 'aprobada').length > 0 ? (
                realWorkOrders.filter(ot => ot.status !== 'aprobada').slice(0, 5).map((ot) => {
                  const progress = calculateProgress(ot);
                  return (
                    <div key={ot.id} className="space-y-2 group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-primary group-hover:underline cursor-pointer">
                            <Link href={`/work-orders/${ot.id}`}>{ot.id}</Link>
                          </span>
                          <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{ot.description}</span>
                        </div>
                        <Badge variant="outline" className={cn(
                          "text-[10px] font-bold uppercase",
                          progress === 100 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"
                        )}>
                          {progress}% COMPLETADO
                        </Badge>
                      </div>
                      <Progress value={progress} className="h-2 rounded-full" />
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-muted-foreground italic border-2 border-dashed rounded-xl">
                  No hay órdenes activas para mostrar progreso.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-none shadow-sm bg-slate-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Próximas Ejecuciones
            </CardTitle>
            <CardDescription>Cronograma para los próximos 7 días.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingOrders.length > 0 ? (
                upcomingOrders.map((ot) => (
                  <div key={ot.id} className="flex items-start gap-3 p-3 rounded-lg bg-white border shadow-sm group hover:border-primary/50 transition-colors">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary text-center min-w-[50px]">
                      <p className="text-[10px] font-black uppercase">
                        {format(ot.scheduledDate?.toDate ? ot.scheduledDate.toDate() : parseISO(ot.scheduledDate), 'MMM')}
                      </p>
                      <p className="text-lg font-black leading-none">
                        {format(ot.scheduledDate?.toDate ? ot.scheduledDate.toDate() : parseISO(ot.scheduledDate), 'dd')}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-900 truncate">{ot.id}</p>
                      <p className="text-xs text-slate-500 truncate">{ot.description}</p>
                      <Button variant="link" className="p-0 h-auto text-[10px] font-black mt-1 text-primary" asChild>
                        <Link href={`/work-orders/${ot.id}`}>DETALLES <ChevronRight className="ml-0.5 h-3 w-3" /></Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground italic text-sm border-2 border-dashed rounded-xl bg-white">
                  Sin tareas programadas para esta semana.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
