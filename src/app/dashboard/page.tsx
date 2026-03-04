
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  ArrowRight,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { MOCK_WORK_ORDERS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { profile, isLoading: isUserLoading } = useUser();
  const db = useFirestore();

  const workOrdersQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return collection(db, "companies", profile.companyId, "workOrders");
  }, [db, profile?.companyId]);

  const { data: realWorkOrders, isLoading: isOrdersLoading } = useCollection(workOrdersQuery);

  // Fallback a mocks si no hay datos reales
  const workOrders = realWorkOrders && realWorkOrders.length > 0 ? realWorkOrders : MOCK_WORK_ORDERS;
  const isDemo = !realWorkOrders || realWorkOrders.length === 0;

  if (isUserLoading || isOrdersLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    { 
      label: "Total OTs", 
      value: workOrders.length, 
      icon: ClipboardList, 
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    { 
      label: "En Revisión", 
      value: workOrders.filter(ot => ot.status === 'en revision').length, 
      icon: Clock, 
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
    { 
      label: "Aprobadas", 
      value: workOrders.filter(ot => ot.status === 'aprobada').length, 
      icon: CheckCircle2, 
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    { 
      label: "Pendientes", 
      value: workOrders.filter(ot => ['creada', 'asignada'].includes(ot.status)).length, 
      icon: AlertCircle, 
      color: "text-red-600",
      bg: "bg-red-50"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Panel de Control</h2>
          <p className="text-muted-foreground">Bienvenido al sistema de gestión de mantención PCG.</p>
        </div>
        <div className="flex items-center gap-3">
          {isDemo && <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">MODO DEMO</Badge>}
          <Button asChild>
            <Link href="/work-orders/new">
              <Plus className="mr-2 h-4 w-4" /> Nueva OT
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm bg-card overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <div className={`${stat.bg} p-2 rounded-lg`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Órdenes de Trabajo Recientes</CardTitle>
            <CardDescription>Ultimas OTs generadas en el sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workOrders.slice(0, 5).map((ot) => (
                <div key={ot.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                  <div className="bg-primary/5 p-2 rounded-full">
                    <ClipboardList className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium leading-none">{ot.id}</p>
                      {isDemo && <span className="text-[10px] text-muted-foreground bg-muted px-1 rounded">MOCK</span>}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{ot.description}</p>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      ot.status === 'creada' && "bg-blue-100 text-blue-700",
                      ot.status === 'asignada' && "bg-indigo-100 text-indigo-700",
                      ot.status === 'en revision' && "bg-amber-100 text-amber-700",
                      ot.status === 'aprobada' && "bg-emerald-100 text-emerald-700"
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
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Flujo de Trabajo</CardTitle>
            <CardDescription>Resumen de estados actuales.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] flex flex-col items-center justify-center text-muted-foreground text-center gap-2">
              <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[60%]" title="Completadas" />
              </div>
              <p className="text-xs">60% de OTs completadas este mes</p>
              <div className="mt-4 italic text-sm">Visualización de métricas operacionales</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
