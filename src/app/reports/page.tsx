
"use client";

import { useState, useEffect, useMemo } from "react";
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
  Loader2,
  Zap,
  ShieldCheck,
  Package
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { WorkOrder, Client, SparePart, StaffMember } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
  const { profile, isLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const companyId = profile?.companyId || "";

  // Consultas Reales a Firestore
  const workOrdersQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return collection(db, "companies", companyId, "workOrders");
  }, [db, companyId]);

  const inventoryQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return collection(db, "companies", companyId, "spareParts");
  }, [db, companyId]);

  const clientsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return collection(db, "companies", companyId, "clients");
  }, [db, companyId]);

  const staffQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return collection(db, "companies", companyId, "staff");
  }, [db, companyId]);

  const { data: workOrders, isLoading: isOrdersLoading } = useCollection<WorkOrder>(workOrdersQuery);
  const { data: inventory } = useCollection<SparePart>(inventoryQuery);
  const { data: clients } = useCollection<Client>(clientsQuery);
  const { data: staff } = useCollection<StaffMember>(staffQuery);

  // Procesamiento de Métricas
  const stats = useMemo(() => {
    const ots = workOrders || [];
    const inv = inventory || [];
    
    const approvedCount = ots.filter(ot => ot.status === 'aprobada').length;
    const approvalRate = ots.length > 0 ? Math.round((approvedCount / ots.length) * 100) : 0;
    
    const totalInventoryValue = inv.reduce((acc, p) => acc + (Number(p.stockActual || 0) * Number(p.unitPrice || 0)), 0);

    const statusDist = [
      { name: "Creadas", count: ots.filter(ot => ot.status === 'creada').length, fill: "#3b82f6" },
      { name: "En Revisión", count: ots.filter(ot => ot.status === 'en revision').length, fill: "#f59e0b" },
      { name: "Aprobadas", count: approvedCount, fill: "#10b981" },
      { name: "Rechazadas", count: ots.filter(ot => ot.status === 'rechazada').length, fill: "#ef4444" },
    ];

    // Mapear actividad por cliente
    const clientStats = (clients || []).map(c => ({
      name: c.name,
      count: ots.filter(ot => ot.clientId === c.id).length
    })).sort((a, b) => b.count - a.count).slice(0, 5);

    return {
      otsCount: ots.length,
      approvalRate,
      inventoryValue: totalInventoryValue,
      statusDist,
      clientStats,
      activeStaff: (staff || []).filter(s => s.active).length
    };
  }, [workOrders, inventory, clients, staff]);

  if (isAuthLoading || !mounted) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 italic">Análisis de Operaciones</h2>
            <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">Inteligencia de Datos Corporativos</p>
          </div>
        </div>
        <Button variant="outline" className="rounded-xl font-bold shadow-sm">
          <FileDown className="mr-2 h-4 w-4" /> Exportar Informe Ejecutivo
        </Button>
      </div>

      {/* Tarjetas de Resumen KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm bg-blue-600 text-white overflow-hidden relative group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <ClipboardList className="h-32 w-32" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">Carga de Trabajo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black">{stats.otsCount}</div>
            <p className="text-[10px] font-bold text-blue-200 mt-1 uppercase">Órdenes Gestionadas</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-emerald-600 text-white overflow-hidden relative group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <ShieldCheck className="h-32 w-32" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100">Efectividad Técnica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black">{stats.approvalRate}%</div>
            <p className="text-[10px] font-bold text-emerald-200 mt-1 uppercase">Tasa de Aprobación</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <Users className="h-32 w-32" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Recurso Humano</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black">{stats.activeStaff}</div>
            <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Técnicos Operativos</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-amber-500 text-white overflow-hidden relative group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <Package className="h-32 w-32" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100">Valor de Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black">${stats.inventoryValue.toLocaleString()}</div>
            <p className="text-[10px] font-bold text-amber-100 mt-1 uppercase">Capital Inmovilizado</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-md rounded-3xl">
          <CardHeader>
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              Embudo de Estados Operacionales
            </CardTitle>
            <CardDescription className="text-xs font-bold uppercase text-slate-400">Distribución de OTs por etapa de gestión.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {isOrdersLoading ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-muted" /></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.statusDist}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    fontFamily="Inter"
                    fontWeight="bold"
                  />
                  <YAxis 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    fontFamily="Inter"
                  />
                  <RechartsTooltip 
                    cursor={{ fill: '#f8fafc' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-[10px] font-black border-none">
                            <p className="uppercase tracking-widest">{payload[0].payload.name}</p>
                            <p className="text-xl">{payload[0].value} Órdenes</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    radius={[10, 10, 0, 0]} 
                    barSize={60}
                  >
                    {stats.statusDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md rounded-3xl">
          <CardHeader>
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              Actividad por Cuenta de Cliente
            </CardTitle>
            <CardDescription className="text-xs font-bold uppercase text-slate-400">Top 5 clientes con mayor demanda de servicios.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {stats.clientStats.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground italic text-sm">
                <Users className="h-10 w-10 mb-2 opacity-20" />
                No hay suficientes datos para generar el ranking.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.clientStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={8}
                    dataKey="count"
                    stroke="none"
                  >
                    {stats.clientStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={[`#6366f1`, `#8b5cf6`, `#ec4899`, `#f43f5e`, `#fb923c`][index % 5]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white border-2 p-3 rounded-xl shadow-lg text-[10px] font-black">
                            <p className="text-slate-400 uppercase">{payload[0].name}</p>
                            <p className="text-slate-900 text-base">{payload[0].value} Trabajos</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-[10px] font-black uppercase text-slate-500">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
