
"use client";

import { useState, useMemo } from "react";
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
  Droplets, 
  Activity, 
  ArrowLeft, 
  Loader2, 
  Zap, 
  Building2, 
  AlertTriangle,
  Waves,
  Gauge,
  Wifi,
  Battery,
  Power,
  PowerOff,
  LineChart as ChartIcon,
  Search,
  Settings2,
  Lock,
  Unlock
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { collection, query, where, doc, serverTimestamp } from "firebase/firestore";
import { WaterMeter, Client } from "@/lib/types";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function WaterControlPage() {
  const { profile, isLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const companyId = profile?.companyId || "";

  const metersQuery = useMemoFirebase(() => 
    db && companyId ? collection(db, "companies", companyId, "waterMeters") : null, 
    [db, companyId]
  );
  
  const clientsQuery = useMemoFirebase(() => 
    db && companyId ? collection(db, "companies", companyId, "clients") : null, 
    [db, companyId]
  );

  const { data: meters, isLoading: isMetersLoading } = useCollection<WaterMeter>(metersQuery);
  const { data: clients } = useCollection<Client>(clientsQuery);

  const filteredMeters = useMemo(() => {
    return (meters || []).filter(m => 
      m.unitIdentifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [meters, searchTerm]);

  const stats = useMemo(() => {
    const list = meters || [];
    const totalConsumption = list.reduce((acc, m) => acc + (m.currentReading || 0), 0);
    const leakAlerts = list.filter(m => m.hasLeakAlert).length;
    const closedValves = list.filter(m => m.status === 'closed').length;
    return { totalConsumption, leakAlerts, closedValves };
  }, [meters]);

  const consumptionData = [
    { hour: "00:00", value: 45 },
    { hour: "04:00", value: 30 },
    { hour: "08:00", value: 85 },
    { hour: "12:00", value: 60 },
    { hour: "16:00", value: 75 },
    { hour: "20:00", value: 95 },
    { hour: "23:59", value: 55 },
  ];

  const toggleValve = async (meter: WaterMeter) => {
    if (!db || !companyId) return;
    setIsProcessing(meter.id);
    
    const newStatus = meter.status === 'open' ? 'closed' : 'open';
    const meterRef = doc(db, "companies", companyId, "waterMeters", meter.id);
    
    updateDocumentNonBlocking(meterRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });

    toast({
      title: newStatus === 'open' ? "Suministro Restablecido" : "Suministro Cortado",
      description: `Válvula remota de ${meter.unitIdentifier} ha sido ${newStatus === 'open' ? 'abierta' : 'cerrada'}.`,
      variant: newStatus === 'open' ? 'default' : 'destructive'
    });

    setTimeout(() => setIsProcessing(null), 1000);
  };

  if (isAuthLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full h-12 w-12"><Link href="/dashboard"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <h2 className="text-4xl font-black tracking-tighter italic uppercase text-slate-900">PCG AGUA <span className="text-blue-600">IoT</span></h2>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Telemetría y Control de Paso Remoto</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl font-bold gap-2"><ChartIcon className="h-4 w-4" /> Reporte Consumos</Button>
          <Button className="rounded-xl font-black shadow-lg gap-2 bg-blue-600 hover:bg-blue-700"><Settings2 className="h-4 w-4" /> Configurar Umbrales</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm bg-blue-600 text-white rounded-[2rem] overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">Consumo Acumulado (Mes)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black italic">{stats.totalConsumption.toFixed(1)}</span>
              <span className="text-xl font-bold opacity-50 italic">m³</span>
            </div>
          </CardContent>
        </Card>

        <Card className={cn("border-none shadow-sm rounded-[2rem] overflow-hidden", stats.leakAlerts > 0 ? "bg-rose-600 text-white animate-pulse" : "bg-white")}>
          <CardHeader className="pb-2">
            <CardTitle className={cn("text-[10px] font-black uppercase tracking-[0.2em]", stats.leakAlerts > 0 ? "text-rose-100" : "text-slate-400")}>Alertas de Fuga Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black italic">{stats.leakAlerts}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-slate-900 text-white rounded-[2rem] overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Válvulas Cerradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black italic">{stats.closedValves}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden border-2 border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Salud de Red (SLA)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black italic text-emerald-600">99.8%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8 border-b bg-slate-50/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                  <Droplets className="h-6 w-6 text-blue-600" /> Monitoreo de Unidades
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase text-slate-400">Lectura instantánea y estado de válvulas</CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Buscar unidad..." 
                  className="pl-10 h-11 bg-white rounded-xl border-slate-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isMetersLoading ? (
              <div className="py-20 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-200" /></div>
            ) : filteredMeters.length === 0 ? (
              <div className="py-32 text-center space-y-4">
                <Waves className="h-12 w-12 mx-auto text-slate-200" />
                <p className="font-black italic uppercase text-slate-400">Sin medidores IoT activos</p>
                <Button variant="outline" className="rounded-xl font-bold h-10">Vincular Nuevo Medidor</Button>
              </div>
            ) : (
              <div className="divide-y">
                {filteredMeters.map((m) => (
                  <div key={m.id} className="p-6 md:p-8 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                    <div className="flex items-start gap-6">
                      <div className={cn(
                        "h-16 w-16 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110",
                        m.status === 'open' ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"
                      )}>
                        <Droplets className="h-8 w-8" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-black italic tracking-tighter uppercase">{m.unitIdentifier}</span>
                          {m.hasLeakAlert && <Badge className="bg-rose-600 text-white font-black animate-pulse text-[8px] h-5">FUGA DETECTADA</Badge>}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span className="flex items-center gap-1.5"><Wifi className="h-3 w-3" /> {m.signalStrength}% Señal</span>
                          <span className="flex items-center gap-1.5"><Battery className="h-3 w-3" /> {m.batteryLevel}% Batería</span>
                          <span className="flex items-center gap-1.5 text-slate-300">ID: {m.id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-10">
                      <div className="text-center md:text-right space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Lectura Actual</p>
                        <div className="flex items-baseline justify-center md:justify-end gap-1">
                          <span className="text-3xl font-black italic text-slate-900">{m.currentReading.toFixed(2)}</span>
                          <span className="text-sm font-bold text-slate-400 italic">m³</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-2">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Válvula Remota</p>
                        <Button 
                          onClick={() => toggleValve(m)}
                          disabled={isProcessing === m.id}
                          className={cn(
                            "h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl transition-all active:scale-95",
                            m.status === 'open' ? "bg-slate-900 text-white hover:bg-rose-600" : "bg-blue-600 text-white hover:bg-blue-500"
                          )}
                        >
                          {isProcessing === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                            m.status === 'open' ? <><PowerOff className="h-4 w-4" /> Cortar Paso</> : <><Power className="h-4 w-4" /> Abrir Paso</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute -right-10 -bottom-10 opacity-10"><ChartIcon className="h-48 w-48 text-blue-400" /></div>
            <CardHeader className="p-8 border-b border-white/5">
              <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                <Activity className="h-6 w-6 text-blue-400" /> Demanda Histórica
              </CardTitle>
              <CardDescription className="text-slate-400 text-[10px] font-bold uppercase">Consumo total edificio - 24 Horas</CardDescription>
            </CardHeader>
            <CardContent className="p-8 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={consumptionData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                  <XAxis dataKey="hour" fontSize={9} axisLine={false} tickLine={false} stroke="#64748b" fontWeight="bold" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                    itemStyle={{ color: '#3b82f6', fontWeight: '900' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" /> Auditoría de Pérdidas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-slate-400">Consumo Matriz</span>
                  <span className="text-sm font-black italic text-slate-900">1,245 m³</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-slate-400">Suma Deptos</span>
                  <span className="text-sm font-black italic text-slate-900">1,210 m³</span>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-rose-600">Pérdida No Facturada</span>
                  <span className="text-lg font-black italic text-rose-600">35 m³</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed italic text-center">
                * El diferencial de 35 m³ sugiere una posible fuga en áreas comunes o descalibración de medidores secundarios.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
