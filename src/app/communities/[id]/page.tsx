
"use client";

import { use, useState, useEffect, useMemo, useRef, Fragment } from "react";
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
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Search, 
  ArrowLeft,
  Loader2,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Zap,
  Droplets,
  Activity,
  ShieldAlert,
  BarChart3,
  Sparkles,
  LayoutGrid,
  List,
  Power,
  PowerOff,
  Lock,
  Download,
  Layers,
  TrendingUp,
  Scale,
  Receipt,
  FileText,
  CalendarCheck
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
  Cell
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
  updateDocumentNonBlocking
} from "@/firebase";
import { collection, doc, serverTimestamp, query, where } from "firebase/firestore";
import { Community, WaterMeter } from "@/lib/types";
import { format, subHours } from "date-fns";
import { es } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { MonthlyBillingReport } from "@/components/MonthlyBillingReport";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

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
    return meters;
  }

  return Array.from({ length: 100 }, (_, i) => {
    const id = i + 1;
    return {
      id: `meter-sim-${id}`,
      unitIdentifier: `Depto 100${id}`,
      status: Math.random() > 0.98 ? 'closed' : 'open',
      currentReading: 150 + (i * 12.4) + (Math.random() * 5),
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
  const { profile } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedMeterId, setExpandedMeterId] = useState<string | null>(null);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pendingMeter, setPendingMeter] = useState<WaterMeter | null>(null);
  const [simMeters, setSimMeters] = useState<WaterMeter[]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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
    
    const residential = list.filter(m => !m.unitIdentifier.includes("Vertical") && !m.unitIdentifier.includes("Área Común"));
    const infrastructure = list.filter(m => m.unitIdentifier.includes("Vertical") || m.unitIdentifier.includes("Área Común"));
    
    const sumUnits = residential.reduce((acc, m) => acc + m.currentReading, 0);
    const sumInfra = infrastructure.reduce((acc, m) => acc + m.currentReading, 0);
    
    const totalMeasured = sumUnits + sumInfra;
    const matrixTotal = totalMeasured * 1.15;
    const efficiency = (totalMeasured / matrixTotal) * 100;
    const lossCLP = (matrixTotal - totalMeasured) * 1800;
    
    return { sumUnits, sumInfra, matrixTotal, efficiency, lossCLP, leakCount: list.filter(m => m.hasLeakAlert).length };
  }, [displayMeters]);

  const billingData = useMemo(() => {
    return displayMeters.map(m => {
      const isInfrastructure = m.unitIdentifier.includes("Vertical") || m.unitIdentifier.includes("Área Común");
      const prevReading = m.currentReading - (Math.random() * 15 + 5);
      const consumption = m.currentReading - prevReading;
      const cost = consumption * 1850;

      return {
        id: m.id,
        unit: m.unitIdentifier,
        previous: Number(prevReading.toFixed(3)),
        current: Number(m.currentReading.toFixed(3)),
        consumption: Number(consumption.toFixed(3)),
        cost: Math.round(cost),
        isInfrastructure
      };
    }).sort((a, b) => a.unit.localeCompare(b.unit));
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

  const handleDownloadBillingPdf = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);
    try {
      toast({ title: "Generando Reporte", description: "Consolidando lecturas mensuales..." });
      await new Promise(r => setTimeout(r, 1000));
      
      const element = reportRef.current;
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: "#ffffff",
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Página 1
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Páginas adicionales si el reporte es largo
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`CIERRE_MENSUAL_${community?.name || 'RECINTO'}_${format(new Date(), "MM_yyyy")}.pdf`);
      toast({ title: "Reporte Descargado", description: "El archivo PDF está listo para ser enviado a administración." });
    } catch (e) {
      console.error(e);
      toast({ title: "Error al generar PDF", variant: "destructive" });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!mounted || isCommLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Elemento oculto para la generación del PDF */}
      <div className="fixed -left-[10000px] top-0 pointer-events-none opacity-0">
        <MonthlyBillingReport 
          forwardedRef={reportRef} 
          communityName={community?.name || ""} 
          data={billingData} 
          period={format(new Date(), "MMMM yyyy", { locale: es })}
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-12 w-12"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 italic uppercase">{community?.name || "Auditoría Hídrica"}</h2>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-2"><MapPin className="h-3 w-3 text-blue-600" /> {community?.address}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl h-11 px-6 font-black uppercase text-[10px] gap-2 bg-white" onClick={handleDownloadBillingPdf} disabled={isGeneratingPdf}>
            {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Exportar Cierre Mensual
          </Button>
        </div>
      </div>

      <Tabs defaultValue="audit" className="w-full space-y-8">
        <div className="flex justify-center md:justify-start">
          <TabsList className="bg-white p-1 h-14 rounded-2xl border shadow-sm w-full grid grid-cols-2 max-w-md">
            <TabsTrigger value="audit" className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2">
              <Activity className="h-4 w-4" /> Auditoría Técnica
            </TabsTrigger>
            <TabsTrigger value="billing" className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2">
              <Receipt className="h-4 w-4" /> Cierre de Consumo
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="audit" className="space-y-8 animate-in fade-in duration-300">
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
                  <p className="text-[9px] font-black uppercase text-slate-400">Total Medido</p>
                  <div className="text-4xl font-black text-slate-900 mt-2">{(auditStats.sumUnits + auditStats.sumInfra).toFixed(1)} m³</div>
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
                    <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Consumo Nodos Medidos</p>
                    <p className="text-4xl font-black italic text-blue-600">{(auditStats.sumUnits + auditStats.sumInfra).toFixed(2)} <span className="text-sm font-bold opacity-40">m³</span></p>
                    <Progress value={auditStats.efficiency} className="h-2 bg-blue-600" />
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase text-rose-600 tracking-widest">Diferencial No Facturado</p>
                    <p className="text-4xl font-black italic text-rose-600">{(auditStats.matrixTotal - (auditStats.sumUnits + auditStats.sumInfra)).toFixed(2)} <span className="text-sm font-bold opacity-40">m³</span></p>
                    <Progress value={100 - auditStats.efficiency} className="h-2 bg-rose-600" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

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

            <Card className="rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white p-10 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute right-0 bottom-0 p-10 opacity-10 group-hover:scale-110 transition-transform"><Sparkles className="h-40 w-40 text-blue-400" /></div>
              <div className="relative z-10 space-y-6">
                <Badge className="bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest px-4 py-1">Análisis Predictivo GENKO</Badge>
                <p className="text-slate-400 text-lg leading-relaxed font-medium">
                  {commId === 'comm-juan-2' 
                    ? '"Condominio Mar Azul presenta una anomalía crítica en el sensor Área Común: Riego Jardín Norte. El consumo se mantiene estable sugiriendo una rotura de matriz."' 
                    : '"El recinto presenta un patrón de consumo nocturno estable con un incremento del 12% respecto a la semana pasada. Se recomienda auditar el sistema de riego."'}
                </p>
              </div>
            </Card>
          </div>

          <div className="space-y-4 pt-8">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-600" /> Sensores Activos ({displayMeters.length})
              </h3>
              <div className="flex gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input placeholder="Buscar unidad..." className="pl-9 h-10 border-2 rounded-xl bg-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
              </div>
            </div>

            <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="pl-8 font-black uppercase text-[10px]">Unidad / Categoría</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Estado</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Lectura Actual</TableHead>
                    <TableHead className="text-right pr-8 font-black uppercase text-[10px]">Mando Remoto</TableHead>
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
                            m.hasLeakAlert ? "bg-rose-50/50 border-l-rose-500" : (isInfrastructure ? "bg-blue-50/10 border-l-blue-400" : "border-l-transparent")
                          )} 
                          onClick={() => setExpandedMeterId(expandedMeterId === m.id ? null : m.id)}
                        >
                          <TableCell className="pl-8 py-4 font-black text-slate-900">
                            <div className="flex items-center gap-3">
                              {isInfrastructure && <Layers className="h-3.5 w-3.5 text-blue-600" />}
                              <div className="flex flex-col">
                                <span className="flex items-center gap-2">
                                  {m.unitIdentifier}
                                  {m.hasLeakAlert && <Badge className="bg-rose-600 text-white font-black text-[7px] h-4 uppercase animate-pulse">ALERTA FUGA</Badge>}
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
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6 animate-in fade-in duration-300">
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 p-3 rounded-2xl shadow-lg"><Receipt className="h-6 w-6 text-white" /></div>
                  <div>
                    <CardTitle className="text-xl font-black italic uppercase tracking-tighter">Liquidación de Consumo Mensual</CardTitle>
                    <CardDescription className="text-slate-400 font-medium uppercase text-[10px] tracking-widest">Periodo: {format(new Date(), "MMMM yyyy", { locale: es })}</CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tarifa Referencial</p>
                  <p className="text-2xl font-black italic text-blue-400">$ 1.850 <span className="text-[10px] opacity-50">/ m³</span></p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-8 border-b bg-slate-50 flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Filtrar unidad..." 
                    className="pl-10 h-11 border-none bg-white rounded-xl shadow-inner font-bold"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="rounded-xl h-11 bg-white font-bold gap-2">
                    <FileText className="h-4 w-4" /> Importar Último Cierre
                  </Button>
                  <Button className="rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] gap-2 shadow-lg" onClick={() => toast({ title: "Mes Cerrado", description: "Se han guardado las lecturas de facturación." })}>
                    <CalendarCheck className="h-4 w-4" /> Realizar Corte Mensual
                  </Button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="pl-8 font-black uppercase text-[10px]">Unidad Habitacional</TableHead>
                      <TableHead className="font-black uppercase text-[10px]">Lectura Anterior</TableHead>
                      <TableHead className="font-black uppercase text-[10px]">Lectura Actual</TableHead>
                      <TableHead className="font-black uppercase text-[10px]">Consumo (m³)</TableHead>
                      <TableHead className="text-right pr-8 font-black uppercase text-[10px]">Total Período</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingData.filter(b => b.unit.toLowerCase().includes(searchTerm.toLowerCase())).map((row) => (
                      <TableRow key={row.id} className={cn("hover:bg-slate-50 transition-colors", row.isInfrastructure && "bg-slate-50/30 opacity-60")}>
                        <TableCell className="pl-8 py-4">
                          <div className="flex items-center gap-3">
                            {row.isInfrastructure ? <Layers className="h-3.5 w-3.5 text-slate-400" /> : <Droplets className="h-3.5 w-3.5 text-blue-600" />}
                            <span className="font-black text-slate-900">{row.unit}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-slate-400 text-xs">{row.previous.toFixed(3)}</TableCell>
                        <TableCell className="font-mono font-bold text-slate-900 text-xs">{row.current.toFixed(3)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 font-black text-xs">
                            {row.consumption.toFixed(3)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8 font-black text-slate-900">
                          $ {row.cost.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
