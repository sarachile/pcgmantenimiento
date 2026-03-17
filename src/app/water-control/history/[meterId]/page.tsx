
"use client";

import { use, useState, useEffect, useMemo } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Loader2, 
  History, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  Droplets,
  AlertTriangle,
  Download,
  Filter,
  Zap,
  ShieldCheck
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { WaterReading, WaterMeter } from "@/lib/types";
import Link from "next/link";
import { format, subHours, startOfHour } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

// GENERADOR DE DATOS SIMULADOS PARA PRESENTACIÓN
const generateSimulatedHistory = () => {
  const data = [];
  const now = new Date();
  for (let i = 24; i >= 0; i--) {
    const time = subHours(now, i);
    // Simular picos de consumo (mañana y noche)
    const hour = time.getHours();
    let baseValue = 0.5;
    if (hour >= 7 && hour <= 9) baseValue = Math.random() * 5 + 3;
    else if (hour >= 19 && hour <= 22) baseValue = Math.random() * 4 + 2;
    else baseValue = Math.random() * 1;

    data.push({
      id: `sim-${i}`,
      timestamp: time.toISOString(),
      value: Number(baseValue.toFixed(2))
    });
  }
  return data;
};

export default function MeterHistoryPage({ params }: { params: Promise<{ meterId: string }> }) {
  const resolvedParams = use(params);
  const meterId = resolvedParams.meterId;
  const { profile, isLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  
  const companyId = profile?.companyId || "";

  // Consulta de Lecturas Reales
  const readingsQuery = useMemoFirebase(() => 
    db && companyId && meterId ? query(
      collection(db, "companies", companyId, "waterMeters", meterId, "readings"),
      orderBy("timestamp", "desc"),
      limit(100)
    ) : null, 
    [db, companyId, meterId]
  );

  const { data: firestoreReadings, isLoading: isReadingsLoading } = useCollection<WaterReading>(readingsQuery);

  const readings = useMemo(() => {
    if (!isReadingsLoading && (!firestoreReadings || firestoreReadings.length === 0)) {
      return generateSimulatedHistory();
    }
    return (firestoreReadings || []).map(r => ({
      ...r,
      timestamp: r.timestamp?.toDate ? r.timestamp.toDate().toISOString() : r.timestamp
    })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [firestoreReadings, isReadingsLoading]);

  const stats = useMemo(() => {
    if (readings.length === 0) return { total: 0, avg: 0, peak: 0 };
    const total = readings.reduce((acc, r) => acc + r.value, 0);
    const peak = Math.max(...readings.map(r => r.value));
    const avg = total / readings.length;
    return { total, avg, peak };
  }, [readings]);

  const chartData = useMemo(() => {
    return readings.map(r => ({
      time: format(new Date(r.timestamp), "HH:mm"),
      consumo: r.value
    }));
  }, [readings]);

  if (isAuthLoading || isReadingsLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full h-12 w-12"><Link href="/water-control"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <h2 className="text-4xl font-black tracking-tighter italic uppercase text-slate-900">Historial de Consumo</h2>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Unidad: {meterId.startsWith('sim') ? 'Unidad de Prueba' : meterId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl font-bold gap-2">
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
          <Button variant="outline" className="rounded-xl font-bold gap-2">
            <Filter className="h-4 w-4" /> 24 Horas
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-blue-600 text-white rounded-[2rem] overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">Consumo Acumulado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black italic">{stats.total.toFixed(2)}</span>
              <span className="text-xl font-bold opacity-50 italic">m³</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-slate-900 text-white rounded-[2rem] overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pico de Demanda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 text-blue-400">
              <span className="text-4xl font-black italic">{stats.peak.toFixed(2)}</span>
              <span className="text-xl font-bold opacity-50 italic">m³</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden border-2 border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Consumo Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 text-slate-900">
              <span className="text-4xl font-black italic">{stats.avg.toFixed(2)}</span>
              <span className="text-xl font-bold opacity-50 italic">m³/h</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
        <CardHeader className="p-8 border-b bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-blue-600" /> Curva de Consumo Detallada
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase text-slate-400">Trazabilidad por hora de flujo hídrico</CardDescription>
            </div>
            {firestoreReadings?.length === 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[8px] uppercase tracking-widest">Vista de Simulación</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-8 h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorConsumo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" fontSize={10} axisLine={false} tickLine={false} stroke="#64748b" fontWeight="bold" />
              <YAxis fontSize={10} axisLine={false} tickLine={false} stroke="#64748b" fontWeight="bold" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                itemStyle={{ color: '#3b82f6', fontWeight: '900' }}
              />
              <Area type="monotone" dataKey="consumo" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorConsumo)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="p-8 border-b bg-slate-50/50">
          <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-blue-600" /> Log de Auditoría IoT
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Fecha y Hora</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Lectura Pulso (m³)</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Estado Gateway</th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Integridad</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {readings.slice().reverse().map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-slate-300" />
                        <span className="text-sm font-bold text-slate-700">{format(new Date(r.timestamp), "dd MMM, HH:mm:ss", { locale: es })}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="text-sm font-black text-slate-900">{r.value.toFixed(3)} m³</span>
                    </td>
                    <td className="p-6">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[8px] font-black uppercase">Online</Badge>
                    </td>
                    <td className="p-6 text-right">
                      <Zap className="h-4 w-4 text-blue-400 inline" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
