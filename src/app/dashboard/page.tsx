
"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  ArrowRight,
  Loader2,
  Calendar as CalendarIcon,
  AlertTriangle,
  Activity
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Panel de Control</h2>
          <p className="text-muted-foreground">Monitoreo operacional de PCGMANTENIMIENTO.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild>
            <Link href="/work-orders/new">
              <Plus className="mr-2 h-4 w-4" /> Nueva OT
            </Link>
          </Button>
        </div>
      </div>

      {overdueOrders.length > 0 && (
        <Alert variant="destructive" className="border-2 shadow-md">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="font-bold">Atención: Órdenes Fuera de Plazo</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Hay {overdueOrders.length} órdenes de trabajo que han excedido su fecha estimada de término.</span>
            <Button variant="link" className="text-destructive font-bold p-0 h-auto" asChild>
              <Link href="/work-orders">Ver todas <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm bg-blue-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total OTs</CardTitle>
            <ClipboardList className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realWorkOrders.length}</div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Órdenes en sistema</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-amber-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Revisión</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realWorkOrders.filter(ot => ot.status === 'en revision').length}</div>
            <p className="text-[10px] text-amber-600 font-bold mt-1">Pendientes de firma</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realWorkOrders.filter(ot => ot.status === 'aprobada').length}</div>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">Trabajos finalizados</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-indigo-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próxima Semana</CardTitle>
            <CalendarIcon className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingOrders.length}</div>
            <p className="text-[10px] text-indigo-600 font-bold mt-1">Programadas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Seguimiento de Avance Técnico</CardTitle>
              <CardDescription>Progreso basado en tareas completadas del protocolo.</CardDescription>
            </div>
            <Activity className="h-5 w-5 text-muted-foreground opacity-50" />
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
                          progress === 100 ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                        )}>
                          {progress}% COMPLETADO
                        </Badge>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-muted-foreground italic">
                  No hay órdenes activas para mostrar progreso.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-none shadow-sm bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Cronograma Semanal
            </CardTitle>
            <CardDescription>Próximas ejecuciones programadas.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingOrders.length > 0 ? (
                upcomingOrders.map((ot) => (
                  <div key={ot.id} className="flex items-start gap-3 p-3 rounded-lg bg-background border shadow-sm">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary text-center min-w-[50px]">
                      <p className="text-[10px] font-bold uppercase">
                        {format(ot.scheduledDate?.toDate ? ot.scheduledDate.toDate() : parseISO(ot.scheduledDate), 'MMM')}
                      </p>
                      <p className="text-lg font-bold leading-none">
                        {format(ot.scheduledDate?.toDate ? ot.scheduledDate.toDate() : parseISO(ot.scheduledDate), 'dd')}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold line-clamp-1">{ot.id}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{ot.description}</p>
                      <Button variant="link" className="p-0 h-auto text-[10px] font-bold mt-1" asChild>
                        <Link href={`/work-orders/${ot.id}`}>VER DETALLE <ArrowRight className="ml-1 h-3 w-3" /></Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground italic text-sm">
                  Sin tareas programadas para los próximos 7 días.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Resumen Operacional de OTs</CardTitle>
                <CardDescription>Estado actual de todas las órdenes en curso.</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/work-orders">Ver todas las OTs</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {realWorkOrders.length > 0 ? (
                realWorkOrders.slice(0, 5).map((ot) => (
                  <div key={ot.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                    <div className="bg-primary/5 p-2 rounded-full">
                      <ClipboardList className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{ot.id}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{ot.description}</p>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        ot.status === 'creada' && "bg-blue-100 text-blue-700",
                        ot.status === 'asignada' && "bg-indigo-100 text-indigo-700",
                        ot.status === 'en revision' && "bg-amber-100 text-amber-700",
                        ot.status === 'aprobada' && "bg-emerald-100 text-emerald-700",
                        ot.status === 'rechazada' && "bg-rose-100 text-rose-700"
                      )}>
                        {ot.status.charAt(0).toUpperCase() + ot.status.slice(1)}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/work-orders/${ot.id}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No hay órdenes de trabajo registradas.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
