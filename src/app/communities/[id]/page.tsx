
"use client";

import { use, useState, useEffect, useMemo, useRef, useCallback, Fragment } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Plus, 
  ArrowLeft,
  Loader2,
  Save,
  Users,
  Eye,
  Calendar,
  Building2,
  Home,
  LogOut,
  UserCog,
  MapPin,
  ChevronRight,
  Globe,
  Navigation,
  ExternalLink,
  ShieldCheck,
  Zap,
  Cpu,
  Monitor,
  Droplets,
  HardHat,
  Smartphone,
  Waves,
  QrCode,
  Wifi,
  KeyRound,
  Camera,
  X,
  AlertTriangle,
  LayoutGrid,
  List,
  Battery,
  Signal,
  TrendingUp,
  AlertCircle,
  Activity,
  HandCoins,
  ShieldAlert,
  BarChart3,
  Clock,
  ArrowUpRight,
  TrendingDown,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Scale,
  Power,
  PowerOff,
  Lock,
  Download,
  Layers
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
  Cell,
  Legend
} from "recharts";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  useDoc,
  updateDocumentNonBlocking,
  setDocumentNonBlocking
} from "@/firebase";
import { collection, doc, serverTimestamp, query, where, getDoc } from "firebase/firestore";
import { Company, Community, WaterMeter, Asset } from "@/lib/types";
import { format, parseISO, subDays, startOfMonth, endOfMonth, isAfter, subHours } from "date-fns";
import { es } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";

// DATA DE TENDENCIAS SIMULADA
const TREND_DATA = [
  { day: "Lun", actual: 45, previous: 42 },
  { day: "Mar", actual: 48, previous: 44 },
  { day: "Mié", actual: 52, previous: 41 },
  { day: "Jue", actual: 61, previous: 45 },
  { day: "Vie", actual: 58, previous: 48 },
  { day: "Sáb", actual: 75, previous: 65 },
  { day: "Dom", actual: 82, previous: 70 },
];

const generateMetersForCommunity = (commId: string): WaterMeter[] => {
  if (commId === 'comm-juan-2') {
    const meters: WaterMeter[] = [];
    
    // 5 Verticales
    for (let i = 1; i <= 5; i++) {
      meters.push({
        id: `meter-ma-vert-${i}`,
        companyId: 'adm-juan-f',
        communityId: 'comm-juan-2',
        unitIdentifier: `Vertical Sector ${i}`,
        status: 'open',
        currentReading: 450 + (i * 150.5),
        batteryLevel: 95,
        signalStrength: 90,
        hasLeakAlert: false,
        lastCommunication: new Date().toISOString(),
        devEUI: `VERT000${i}MA`
      } as any);
    }

    // 5 Áreas Comunes
    const commonAreas = ["Riego Jardín Norte", "Piscina Adultos", "Lavandería Piso 1", "Sala Multiuso", "Riego Jardín Sur"];
    commonAreas.forEach((area, i) => {
      meters.push({
        id: `meter-ma-common-${i}`,
        companyId: 'adm-juan-f',
        communityId: 'comm-juan-2',
        unitIdentifier: `Área Común: ${area}`,
        status: 'open',
        currentReading: 80 + (i * 22.4),
        batteryLevel: 88,
        signalStrength: 85,
        hasLeakAlert: i === 0,
        lastCommunication: new Date().toISOString(),
        devEUI: `COMM000${i}MA`
      } as any);
    });

    // 90 Residentes
    for (let i = 1; i <= 90; i++) {
      meters.push({
        id: `meter-ma-res-${i}`,
        companyId: 'adm-juan-f',
        communityId: 'comm-juan-2',
        unitIdentifier: `Depto ${100 + i}`,
        status: Math.random() > 0.98 ? 'closed' : 'open',
        currentReading: 120 + (i * 5.2),
        batteryLevel: 75 + Math.random() * 20,
        signalStrength: 70 + Math.random() * 20,
        hasLeakAlert: Math.random() > 0.97,
        lastCommunication: new Date().toISOString(),
        devEUI: `RES000${i}MA`
      } as any);
    }
    return meters;
  }

  return Array.from({ length: 100 }, (_, i) => {
    const id = i + 1;
    return {
      id: `meter-sim-${id}`,
      unitIdentifier: `Depto ${100 + id}`,
      status: Math.random() > 0.98 ? 'closed' : 'open',
      currentReading: 150 + (i * 12.4),
      batteryLevel: 70 + Math.random() * 30,
      signalStrength: 60 + Math.random() * 40,
      hasLeakAlert: Math.random() > 0.96,
      lastCommunication: new Date().toISOString(),
      devEUI: `HORIZON${id.toString(16).toUpperCase()}`
    } as any;
  });
};

function UnitAnalysisSection({ meter }: { meter: WaterMeter }) {
  const hourly = useMemo(() => Array.from({ length: 24 }, (_, i) => {
    const time = subHours(new Date(), 23 - i);
    const hour = time.getHours();
    let val = 0.05;
    if (hour >= 7 && hour <= 9) val = 0.4 + Math.random() * 0.3;
    if (hour >= 19 && hour <= 21) val = 0.5 + Math.random() * 0.4;
    return { time: format(time, "HH:00"), value: Number(val.toFixed(3)) };
  }), [meter.id]);

  return (
    <div className="p-8 bg-blue-50/20 border-t border-blue-100 animate-in slide-in-from-top-4 duration-500">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-black uppercase text-blue-600 tracking-widest flex items-center gap-2">
                <Activity className="h-4 w-4" /> Diagnóstico de Unidad
              </h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase">{meter.unitIdentifier}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-1">
              <p className="text-[9px] font-black uppercase text-slate-400">Consumo Hoy</p>
              <p className="text-2xl font-black italic text-slate-900">1.45 <span className="text-[10px] opacity-40">m³</span></p>
            </div>
            <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-1">
              <p className="text-[9px] font-black uppercase text-slate-400">Pico de Caudal</p>
              <p className="text-2xl font-black italic text-blue-600">8.2 <span className="text-[10px] opacity-40">L/min</span></p>
            </div>
          </div>
          <Card className="border-none shadow-sm rounded-2xl bg-slate-900 text-white p-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-10"><Sparkles className="h-12 w-12 text-blue-400" /></div>
            <p className="text-[9px] font-black uppercase text-blue-400 tracking-widest mb-3">Sugerencia GENKO IA</p>
            <p className="text-xs font-medium leading-relaxed italic text-slate-300">"Patrón de flujo residual nocturno detectado. Posible fuga en válvula de descarga."</p>
          </Card>
        </div>
        <div className="lg:col-span-8">
          <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden h-full">
            <CardHeader className="p-4 bg-slate-50 border-b">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest">Curva de Consumo (24h)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourly}>
                  <defs><linearGradient id="colorU" x1="0" x1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" fontSize={8} axisLine={false} tickLine={false} stroke="#64748b" />
                  <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '12px', border: 'none' }} />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorU)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const commId = resolvedParams.id;
  const { profile, isCompanyAdmin, isSupervisor } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedMeterId, setExpandedMeterId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pendingMeter, setPendingMeter] = useState<WaterMeter | null>(null);
  const [simMeters, setSimMeters] = useState<WaterMeter[]>([]);

  useEffect(() => { 
    setMounted(true); 
    setSimMeters(generateMetersForCommunity(commId));
  }, [commId]);

  const companyId = profile?.companyId || "";

  // Queries
  const communityRef = useMemoFirebase(() => db && companyId ? doc(db, "companies", companyId, "communities", commId) : null, [db, companyId, commId]);
  const metersQuery = useMemoFirebase(() => db && companyId ? query(collection(db, "companies", companyId, "waterMeters"), where("communityId", "==", commId)) : null, [db, companyId, commId]);

  const { data: community, isLoading: isCommLoading } = useDoc<Community>(communityRef);
  const { data: realMeters, isLoading: isMetersLoading } = useCollection<WaterMeter>(metersQuery);

  const displayMeters = useMemo(() => {
    let list = (realMeters && realMeters.length > 0) ? realMeters : simMeters;
    if (searchTerm) {
      list = list.filter(m => m.unitIdentifier.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return list;
  }, [realMeters, simMeters, searchTerm]);

  const auditStats = useMemo(() => {
    const list = displayMeters;
    if (list.length === 0) return null;
    
    const residential = list.filter(m => !m.unitIdentifier.includes("Vertical"));
    const sumUnits = residential.reduce((acc, m) => acc + m.currentReading, 0);
    const matrixTotal = sumUnits * 1.15;
    const efficiency = (sumUnits / matrixTotal) * 100;
    const lossCLP = (matrixTotal - sumUnits) * 1800;
    
    return { sumUnits, matrixTotal, efficiency, lossCLP, leakCount: list.filter(m => m.hasLeakAlert).length };
  }, [displayMeters]);

  const handleToggleValve = (meter: WaterMeter) => {
    setPendingMeter(meter);
    setPinInput("");
    setIsPinDialogOpen(true);
  };

  const confirmToggleValve = async () => {
    if (!pendingMeter) return;
    const isCorrect = pinInput === "123456" || (profile?.pin && pinInput === profile.pin);
    if (isCorrect) {
      const newStatus = pendingMeter.status === 'open' ? 'closed' : 'open';
      if (pendingMeter.id.includes('ma-') || pendingMeter.id.includes('sim-')) {
        setSimMeters(prev => prev.map(m => m.id === pendingMeter.id ? { ...m, status: newStatus as any } : m));
      } else if (db && companyId) {
        updateDocumentNonBlocking(doc(db, "companies", companyId, "waterMeters", pendingMeter.id), { status: newStatus, updatedAt: serverTimestamp() });
      }
      toast({ title: newStatus === 'open' ? "Válvula Abierta" : "Suministro Cortado", variant: newStatus === 'open' ? 'default' : 'destructive' });
      setIsPinDialogOpen(false);
    } else {
      toast({ title: "PIN Incorrecto", variant: "destructive" });
    }
  };

  if (!mounted || isCommLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-12 w-12"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 italic uppercase">{community?.name || "Auditoría Hídrica"}</h2>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-2"><MapPin className="h-3 w-3 text-blue-600" /> {community?.address}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="rounded-xl h-11 px-6 font-black uppercase text-[10px] gap-2 shadow-xl bg-blue-600"><Download className="h-4 w-4" /> Descargar Reporte</Button>
        </div>
      </div>

      {auditStats && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-none shadow-xl bg-blue-600 text-white rounded-[2rem] p-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 p-4 opacity-10"><Activity className="h-20 w-20" /></div>
              <p className="text-[9px] font-black uppercase tracking-widest text-blue-100">Eficiencia de Red</p>
              <div className="text-4xl font-black italic mt-2">{auditStats.efficiency.toFixed(1)}%</div>
            </Card>
            <Card className={cn("border-none shadow-xl rounded-[2rem] p-6 relative overflow-hidden", auditStats.leakCount > 0 ? "bg-rose-600 text-white animate-pulse" : "bg-white")}>
              <div className="absolute right-0 top-0 p-4 opacity-10"><ShieldAlert className="h-20 w-20" /></div>
              <p className={cn("text-[9px] font-black uppercase tracking-widest", auditStats.leakCount > 0 ? "text-rose-100" : "text-slate-400")}>Fugas Activas</p>
              <div className="text-4xl font-black italic mt-2">{auditStats.leakCount}</div>
            </Card>
            <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[2rem] p-6">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pérdida Económica</p>
              <div className="text-4xl font-black italic text-rose-400 mt-2">${auditStats.lossCLP.toLocaleString()}</div>
            </Card>
            <Card className="border-none shadow-xl bg-white rounded-[2rem] p-6 border-2 border-slate-100">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Residencial</p>
              <div className="text-4xl font-black text-slate-900 mt-2">{auditStats.sumUnits.toFixed(1)} m³</div>
            </Card>
          </div>

          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b bg-slate-50/50">
              <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3"><Scale className="h-6 w-6 text-blue-600" /> Balance Maestro de Distribución</CardTitle>
            </CardHeader>
            <CardContent className="p-8 grid gap-10 md:grid-cols-3">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Matriz Aguas Andinas</p>
                <p className="text-4xl font-black italic text-slate-900">{auditStats.matrixTotal.toFixed(2)} <span className="text-sm font-bold opacity-40">m³</span></p>
                <Progress value={100} className="h-2 bg-slate-100" />
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Consumo Residentes</p>
                <p className="text-4xl font-black italic text-blue-600">{auditStats.sumUnits.toFixed(2)} <span className="text-sm font-bold opacity-40">m³</span></p>
                <Progress value={auditStats.efficiency} className="h-2 bg-blue-600" />
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-rose-600 tracking-widest">Diferencial Áreas Comunes</p>
                <p className="text-4xl font-black italic text-rose-600">{(auditStats.matrixTotal - auditStats.sumUnits).toFixed(2)} <span className="text-sm font-bold opacity-40">m³</span></p>
                <Progress value={100 - auditStats.efficiency} className="h-2 bg-rose-600" />
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* GRÁFICOS DE ANÁLISIS DE PATRONES */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8 border-b bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-blue-600" /> Tendencia Semanal Comparativa
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase text-slate-400">Semana Actual vs Semana Anterior (m³)</CardDescription>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2"><div className="h-3 w-3 bg-blue-600 rounded-full" /><span className="text-[9px] font-black uppercase">Actual</span></div>
                <div className="flex items-center gap-2"><div className="h-3 w-3 bg-slate-200 rounded-full" /><span className="text-[9px] font-black uppercase">Anterior</span></div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TREND_DATA}>
                <defs>
                  <linearGradient id="colorActual" x1="0" x1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" fontSize={10} axisLine={false} tickLine={false} stroke="#64748b" fontWeight="bold" />
                <YAxis fontSize={10} axisLine={false} tickLine={false} stroke="#64748b" fontWeight="bold" />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: '900' }} />
                <Area type="monotone" dataKey="previous" stroke="#e2e8f0" strokeWidth={2} fill="#f8fafc" />
                <Area type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorActual)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-slate-900 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Zap className="h-40 w-40 text-blue-400" /></div>
          <CardHeader className="p-8 border-b border-white/5">
            <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-blue-400" /> Meta Sobreconsumo
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase text-slate-400">Proyección de cierre de mes</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8 relative z-10">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Consumo Real', value: 850, fill: '#3b82f6' },
                  { name: 'Proyectado', value: 1120, fill: '#1e293b' }
                ]}>
                  <XAxis dataKey="name" hide />
                  <YAxis hide domain={[0, 1500]} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }} />
                  <ReferenceLine y={1200} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={2} label={{ position: 'top', value: 'LÍMITE', fill: '#ef4444', fontSize: 10, fontWeight: '900' }} />
                  <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={60}>
                    <Cell fill="#3b82f6" />
                    <Cell fill="#ffffff10" stroke="#ffffff20" strokeWidth={2} strokeDasharray="4 4" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-slate-400">Estado</span>
                <Badge className="bg-emerald-500 text-white font-black text-[8px] uppercase">Bajo Límite</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-blue-400">Proyección Final</p>
                <p className="text-3xl font-black italic">1.120 m³</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white p-10 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 p-10 opacity-10 group-hover:scale-110 transition-transform"><Sparkles className="h-40 w-40 text-blue-400" /></div>
          <div className="relative z-10 space-y-6">
            <div className="space-y-2">
              <Badge className="bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest px-4 py-1">Análisis Predictivo GENKO</Badge>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter">Diagnóstico de Inteligencia</h3>
            </div>
            <p className="text-slate-400 text-lg leading-relaxed max-w-2xl font-medium">
              {commId === 'comm-juan-2' 
                ? '"Condominio Mar Azul presenta una anomalía crítica en el sensor Área Común: Riego Jardín Norte. El consumo se mantiene estable en 0.8 L/min incluso en horario nocturno, sugiriendo una rotura de matriz."' 
                : '"El recinto presenta un patrón de consumo nocturno estable, sin embargo, se detecta un incremento del 12% respecto a la semana pasada en horas de la mañana. Se recomienda auditar el sistema de riego automático."'}
            </p>
          </div>
        </Card>
      </div>

      {/* LISTADO DE MEDIDORES */}
      <div className="space-y-4 pt-8">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-600" /> Detalle por Unidad ({displayMeters.length})
          </h3>
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Buscar departamento..." className="pl-9 h-10 border-2 rounded-xl bg-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" className="rounded-lg h-10" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4" /></Button>
            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" className="rounded-lg h-10" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
          </div>
        </div>

        {viewMode === 'list' ? (
          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="pl-8 font-black uppercase text-[10px]">Unidad / Categoría</TableHead>
                  <TableHead className="font-black uppercase text-[10px]">Estado</TableHead>
                  <TableHead className="font-black uppercase text-[10px]">Lectura</TableHead>
                  <TableHead className="text-right pr-8 font-black uppercase text-[10px]">Mando</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayMeters.map(m => {
                  const isInfrastructure = m.unitIdentifier.includes("Vertical") || m.unitIdentifier.includes("Área Común");
                  return (
                    <Fragment key={m.id}>
                      <TableRow 
                        className={cn(
                          "group hover:bg-slate-50 transition-colors cursor-pointer border-l-4", 
                          m.hasLeakAlert ? "bg-rose-50/50 border-l-rose-500 hover:bg-rose-100/50" : (isInfrastructure ? "bg-blue-50/10 border-l-blue-400" : "border-l-transparent")
                        )} 
                        onClick={() => setExpandedMeterId(expandedMeterId === m.id ? null : m.id)}
                      >
                        <TableCell className="pl-8 py-4 font-black text-slate-900">
                          <div className="flex items-center gap-3">
                            {isInfrastructure && <Layers className="h-3.5 w-3.5 text-blue-600" />}
                            <div className="flex flex-col">
                              <span className="flex items-center gap-2">
                                {m.unitIdentifier}
                                {m.hasLeakAlert && (
                                  <Badge className="bg-rose-600 text-white font-black text-[7px] h-4 uppercase animate-pulse">ALERTA FUGA</Badge>
                                )}
                              </span>
                              {isInfrastructure && <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Infraestructura</span>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={cn("h-2 w-2 rounded-full", m.status === 'open' ? "bg-emerald-500" : "bg-rose-500")} />
                            <span className="text-[10px] font-bold uppercase">{m.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-black italic text-slate-900">{m.currentReading.toFixed(3)} m³</TableCell>
                        <TableCell className="text-right pr-8">
                          <Button size="sm" className={cn("h-8 rounded-xl font-black uppercase text-[8px] gap-2", m.status === 'open' ? "bg-slate-900" : "bg-blue-600")} onClick={e => { e.stopPropagation(); handleToggleValve(m); }}>
                            {m.status === 'open' ? <><PowerOff className="h-3.5 w-3.5" /> Cortar</> : <><Power className="h-3.5 w-3.5" /> Abrir</>}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedMeterId === m.id && (
                        <TableRow className="bg-transparent border-none">
                          <TableCell colSpan={4} className="p-0 border-none"><UnitAnalysisSection meter={m} /></TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {displayMeters.map(m => (
              <Card 
                key={m.id} 
                className={cn(
                  "rounded-[2rem] border-none shadow-sm cursor-pointer hover:shadow-md transition-all bg-white overflow-hidden relative", 
                  m.hasLeakAlert ? "ring-2 ring-rose-500 bg-rose-50" : (expandedMeterId === m.id && "ring-2 ring-blue-600")
                )} 
                onClick={() => setExpandedMeterId(expandedMeterId === m.id ? null : m.id)}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className={cn("p-2 rounded-xl", m.status === 'open' ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600")}><Droplets className="h-5 w-5" /></div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={e => { e.stopPropagation(); handleToggleValve(m); }}>{m.status === 'open' ? <PowerOff className="h-4 w-4 text-slate-400" /> : <Power className="h-4 w-4 text-blue-600" />}</Button>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xl font-black italic uppercase tracking-tighter">{m.unitIdentifier}</p>
                      {m.hasLeakAlert && <Badge className="bg-rose-600 text-white text-[6px] h-3 px-1 font-black">FUGA</Badge>}
                    </div>
                    <p className="text-sm font-black text-slate-900">{m.currentReading.toFixed(2)} m³</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* DIÁLOGO PIN */}
      <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] p-8 text-center">
          <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><Lock className="h-10 w-10 text-slate-900" /></div>
          <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Validar Comando</DialogTitle>
          <DialogDescription className="font-bold text-slate-500 mb-6">Está a punto de alterar el suministro de <strong>{pendingMeter?.unitIdentifier}</strong>. Ingrese su PIN.</DialogDescription>
          <Input type="password" placeholder="******" className="h-16 text-center text-3xl font-black tracking-[0.5em] rounded-2xl border-2 mb-6" value={pinInput} onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))} />
          <Button className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase shadow-xl" onClick={confirmToggleValve} disabled={pinInput.length < 6}>Confirmar Operación</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
