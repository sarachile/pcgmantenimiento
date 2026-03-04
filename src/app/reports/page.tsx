
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  BarChart3, 
  ArrowLeft, 
  FileDown, 
  TrendingUp, 
  Users, 
  ClipboardList,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { MOCK_WORK_ORDERS, MOCK_CLIENTS, MOCK_SPARE_PARTS } from "@/lib/mock-data";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export default function ReportsPage() {
  const { profile, isLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const workOrdersQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return collection(db, "companies", profile.companyId, "workOrders");
  }, [db, profile?.companyId]);

  const inventoryQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return collection(db, "companies", profile.companyId, "spareParts");
  }, [db, profile?.companyId]);

  const { data: realWorkOrders, isLoading: isOrdersLoading } = useCollection(workOrdersQuery);
  const { data: realParts } = useCollection(inventoryQuery);

  const workOrders = realWorkOrders && realWorkOrders.length > 0 ? realWorkOrders : MOCK_WORK_ORDERS;
  const parts = realParts && realParts.length > 0 ? realParts : MOCK_SPARE_PARTS;

  // Data Processing
  const statusData = [
    { name: "Creadas", count: workOrders.filter(ot => ot.status === 'creada').length, fill: "hsl(var(--chart-1))" },
    { name: "En Revisión", count: workOrders.filter(ot => ot.status === 'en revision').length, fill: "hsl(var(--chart-2))" },
    { name: "Aprobadas", count: workOrders.filter(ot => ot.status === 'aprobada').length, fill: "hsl(var(--chart-3))" },
    { name: "Rechazadas", count: workOrders.filter(ot => ot.status === 'rechazada').length, fill: "hsl(var(--destructive))" },
  ];

  const clientActivity = MOCK_CLIENTS.map(client => ({
    name: client.name,
    count: workOrders.filter(ot => ot.clientId === client.id).length
  })).sort((a, b) => b.count - a.count).slice(0, 5);

  const inventoryValue = parts.reduce((acc, p) => acc + (p.stockActual * p.unitPrice), 0);

  if (isAuthLoading || !mounted) {
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
            <h2 className="text-3xl font-bold tracking-tight">Reportes y Estadísticas</h2>
            <p className="text-muted-foreground">Análisis de rendimiento operacional y financiero de la empresa.</p>
          </div>
        </div>
        <Button variant="outline">
          <FileDown className="mr-2 h-4 w-4" /> Exportar Datos
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-blue-500" />
              OTs Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workOrders.length}</div>
            <p className="text-xs text-muted-foreground">+12% respecto al mes anterior</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Tasa de Aprobación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workOrders.length > 0 
                ? Math.round((workOrders.filter(ot => ot.status === 'aprobada').length / workOrders.length) * 100) 
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Calidad de ejecución técnica</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              Clientes Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{MOCK_CLIENTS.length}</div>
            <p className="text-xs text-muted-foreground">Cartera vigente en el sistema</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-amber-500" />
              Valor Inventario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">${inventoryValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Capital en repuestos e insumos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Distribución de Estados de OT</CardTitle>
            <CardDescription>Visualización actual de la carga de trabajo.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border p-2 rounded-lg shadow-sm text-xs">
                          <p className="font-bold">{payload[0].payload.name}</p>
                          <p>Cantidad: {payload[0].value}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Actividad por Cliente</CardTitle>
            <CardDescription>Top 5 clientes con mayor volumen de OTs.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={clientActivity}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {clientActivity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
