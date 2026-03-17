
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  ArrowLeft, 
  Loader2, 
  History, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Droplets,
  Download,
  Filter,
  Zap,
  ShieldCheck,
  ChevronDown,
  LayoutList
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
import { WaterReading } from "@/lib/types";
import Link from "next/link";
import { format, subHours, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

// GENERADOR DE DATOS SIMULADOS PARA PRESENTACIÓN
const generateSimulatedHistory = () => {
  const data = [];
  const now = new Date();
  // Generamos datos para los últimos 3 días para demostrar la agrupación
  for (let i = 72; i >= 0; i--) {
    const time = subHours(now, i);
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
      limit(200)
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

  // Agrupación por Día
  const groupedReadings = useMemo(() => {
    const groups: Record<string, { label: string, items: any[] }> = {};
    const sortedDesc = [...readings].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    sortedDesc.forEach(r => {
      const date = new Date(r.timestamp);
      const key = format(date, "yyyy-MM-dd");
      const label = format(date, "eeee d 'de' MMMM", { locale: es });
      if (!groups[key]) groups[key] = { label, items: [] };
      groups[key].items.push(r);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [readings]);

  const stats = useMemo(() => {
    if (readings.length === 0) return { total: 0, avg: 0, peak: 0 };
    // Mostrar solo las últimas 24h en los stats de arriba
    const last24 = readings.slice(-24);
    const total = last24.reduce((acc, r) => acc + r.value, 0);
    const peak = Math.max(...last24.map(r => r.value));
    const avg = total / last24.length;
    return { total, avg, peak };
  }, [readings]);

  const chartData = useMemo(() => {
    // El gráfico muestra solo las últimas 24 lecturas para claridad
    return readings.slice(-24).map(r => ({
      time: format(new Date(r.timestamp), "HH:mm"),
      consumo: r.value
    }));
  }, [readings]);

  if (isAuthLoading || isReadingsLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full h-12 w-12 hover:bg-blue-50"><Link href="/water-control"><ArrowLeft className="h-5 w-5" /></Link></Button>
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
            <Filter className="h-4 w-4" /> Filtrar Rango
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-blue-600 text-white rounded-[2rem] overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">Consumo (Últ. 24h)</CardTitle>
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
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Promedio Horario</CardTitle>
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
                <TrendingUp className="h-6 w-6 text-blue-600" /> Curva de Consumo (24h)
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

      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2 pl-4">
          <LayoutList className="h-4 w-4" /> Log de Auditoría por Día
        </h3>
        
        <Accordion type="single" collapsible defaultValue={groupedReadings[0]?.[0]} className="space-y-4">
          {groupedReadings.map(([dayKey, group]) => (
            <AccordionItem key={dayKey} value={dayKey} className="border-none">
              <Card className="border-none shadow-sm rounded-[1.5rem] overflow-hidden bg-white">
                <AccordionTrigger className="px-8 py-6 hover:no-underline hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-4 text-left">
                    <div className="bg-blue-50 p-2 rounded-xl text-blue-600 group-data-[state=open]:bg-blue-600 group-data-[state=open]:text-white transition-all">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-base font-black uppercase italic tracking-tighter text-slate-900 block capitalize">{group.label}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{group.items.length} Pulsos de telemetría</span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-0">
                  <div className="overflow-x-auto border-t border-slate-50">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/50">
                        <tr>
                          <th className="p-6 text-[9px] font-black uppercase text-slate-400 tracking-widest">Hora de Lectura</th>
                          <th className="p-6 text-[9px] font-black uppercase text-slate-400 tracking-widest">Valor Pulso (m³)</th>
                          <th className="p-6 text-[9px] font-black uppercase text-slate-400 tracking-widest">Estado Gateway</th>
                          <th className="p-6 text-[9px] font-black uppercase text-slate-400 tracking-widest text-right">Integridad</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {group.items.map((r) => (
                          <tr key={r.id} className="hover:bg-blue-50/20 transition-colors">
                            <td className="p-6">
                              <div className="flex items-center gap-3">
                                <Clock className="h-3.5 w-3.5 text-slate-300" />
                                <span className="text-xs font-bold text-slate-700">{format(new Date(r.timestamp), "HH:mm:ss")}</span>
                              </div>
                            </td>
                            <td className="p-6">
                              <span className="text-sm font-black text-slate-900">{r.value.toFixed(3)} m³</span>
                            </td>
                            <td className="p-6">
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[8px] font-black uppercase">Online</Badge>
                            </td>
                            <td className="p-6 text-right">
                              <Zap className="h-3.5 w-3.5 text-blue-400 inline" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </Card>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
