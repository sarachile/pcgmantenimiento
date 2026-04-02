
"use client";

import { useState, useEffect, useMemo, Suspense, useRef, useCallback, Fragment } from "react";
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
  Settings2,
  ArrowLeft,
  Loader2,
  Save,
  Copy,
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
  Mail,
  Send,
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
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  useAuth,
  updateDocumentNonBlocking,
  addDocumentNonBlocking
} from "@/firebase";
import { collection, doc, serverTimestamp, query, orderBy, where, setDoc } from "firebase/firestore";
import { Company, Community, WaterMeter, Asset } from "@/lib/types";
import { format, parseISO, subHours } from "date-fns";
import { es } from "date-fns/locale";
import { signOut } from "firebase/auth";
import { CHILE_REGIONS } from "@/lib/chile-data";
import jsQR from "jsqr";
import { sendSystemEmail } from "@/actions/email";

// --- SIMULATED DATA FOR JUAN FERNANDEZ ---
const SIM_JUAN_ADMIN: Company = {
  id: 'adm-juan-f',
  name: 'Juan Fernández',
  rut: '12.345.678-9',
  address: 'Avenida Libertad 450, Viña del Mar',
  currentPlan: 'enterprise',
  subscriptionStatus: 'active',
  isActive: true,
  createdAt: new Date('2024-01-15').toISOString(),
};

const SIM_JUAN_COMMUNITIES: Community[] = [
  { id: 'comm-juan-1', companyId: 'adm-juan-f', name: 'Edificio Horizonte', address: 'Calle 2 Norte 1245, Viña del Mar', region: 'Valparaíso', city: 'Viña del Mar', commune: 'Viña del Mar', createdAt: new Date('2024-01-20').toISOString(), isActive: true },
  { id: 'comm-juan-2', companyId: 'adm-juan-f', name: 'Condominio Mar Azul', address: 'Av. Libertad 450, Viña del Mar', region: 'Valparaíso', city: 'Viña del Mar', commune: 'Viña del Mar', createdAt: new Date('2024-01-22').toISOString(), isActive: true },
];

const generateMetersForCommunity = (commId: string): WaterMeter[] => {
  if (commId === 'comm-juan-2') {
    // Caso Mar Azul: Verticales y Áreas Comunes
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
        hasLeakAlert: i === 0, // Fuga simulada en riego
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

  // Caso Horizonte: Solo residentes (100)
  return Array.from({ length: 100 }, (_, i) => {
    const id = i + 1;
    const floor = Math.floor(i / 10) + 1;
    const room = (i % 10) + 1;
    const unit = `Depto ${floor}${room < 10 ? '0' + room : room}`;
    return {
      id: `meter-juan-${id}`,
      companyId: 'adm-juan-f',
      communityId: 'comm-juan-1',
      unitIdentifier: unit,
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

const TREND_DATA = [
  { day: "Lun", actual: 45, previous: 42 },
  { day: "Mar", actual: 48, previous: 44 },
  { day: "Mié", actual: 52, previous: 41 },
  { day: "Jue", actual: 61, previous: 45 },
  { day: "Vie", actual: 58, previous: 48 },
  { day: "Sáb", actual: 75, previous: 65 },
  { day: "Dom", actual: 82, previous: 70 },
];

const generateUnitHistory = () => {
  const now = new Date();
  const hourly = Array.from({ length: 24 }, (_, i) => {
    const time = subHours(now, 23 - i);
    const hour = time.getHours();
    let val = 0.05;
    if (hour >= 7 && hour <= 9) val = 0.4 + Math.random() * 0.3;
    if (hour >= 19 && hour <= 21) val = 0.5 + Math.random() * 0.4;
    if (hour >= 2 && hour <= 4) val = 0.01 + Math.random() * 0.05;
    return { time: format(time, "HH:00"), value: Number(val.toFixed(3)) };
  });

  const daily = [
    { day: "Lun", value: 0.8, avg: 0.75 },
    { day: "Mar", value: 0.9, avg: 0.75 },
    { day: "Mié", value: 0.7, avg: 0.75 },
    { day: "Jue", value: 1.2, avg: 0.75 },
    { day: "Vie", value: 0.85, avg: 0.75 },
    { day: "Sáb", value: 1.5, avg: 0.75 },
    { day: "Dom", value: 1.8, avg: 0.75 },
  ];

  return { hourly, daily };
};

function UnitAnalysisSection({ meter }: { meter: WaterMeter }) {
  const { hourly, daily } = useMemo(() => generateUnitHistory(), [meter.id]);

  return (
    <div className="p-8 bg-blue-50/20 border-t border-blue-100 animate-in slide-in-from-top-4 duration-500">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-black uppercase text-blue-600 tracking-widest flex items-center gap-2">
                <Activity className="h-4 w-4" /> Diagnóstico de Unidad
              </h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase">{meter.unitIdentifier} • {meter.devEUI}</p>
            </div>
            {meter.hasLeakAlert && (
              <Badge className="bg-rose-600 text-white font-black text-[8px] animate-pulse">ALERTA FUGA</Badge>
            )}
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
            <p className="text-xs font-medium leading-relaxed italic text-slate-300">
              "El patrón nocturno muestra un flujo residual constante de 0.05 m³/h entre las 02:00 y 05:00 AM. Probable fuga en válvula de estanque WC."
            </p>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardHeader className="p-4 bg-slate-50 border-b">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-blue-600" /> Curva de Consumo (24h)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourly}>
                    <defs>
                      <linearGradient id="colorUnit" x1="0" x1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" fontSize={8} axisLine={false} tickLine={false} stroke="#64748b" />
                    <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUnit)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardHeader className="p-4 bg-slate-50 border-b">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <HandCoins className="h-3.5 w-3.5 text-indigo-600" /> Histórico Semanal (m³)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={daily}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" fontSize={8} axisLine={false} tickLine={false} stroke="#64748b" />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ fontSize: '10px', borderRadius: '12px' }} />
                    <ReferenceLine y={0.75} stroke="#6366f1" strokeDasharray="3 3" label={{ position: 'right', value: 'PROM', fill: '#6366f1', fontSize: 8, fontWeight: '900' }} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminCompaniesContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSuperAdmin, isLoading: isUserLoading, profile } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [meterSearchTerm, setMeterSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  const [expandedMeterId, setExpandedMeterId] = useState<string | null>(null);
  const [isProcessingValve, setIsProcessingValve] = useState<string | null>(null);
  
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pendingMeter, setPendingMeter] = useState<WaterMeter | null>(null);

  const [viewingAdminId, setViewingAdminId] = useState<string | null>(null);
  const [viewingCommunityId, setViewingCommunityId] = useState<string | null>(null);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ companyName: "", adminName: "", adminEmail: "", adminRut: "", address: "", currentPlan: "simple" as any });

  useEffect(() => {
    setMounted(true);
    const adminId = searchParams.get('id');
    if (adminId) setViewingAdminId(adminId);
  }, [searchParams]);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push("/auth/login");
  };

  const administratorsQuery = useMemoFirebase(() => {
    if (!db || !isSuperAdmin) return null;
    return query(collection(db, "companies"), orderBy("createdAt", "desc"));
  }, [db, isSuperAdmin]);

  const { data: rawAdministrators, isLoading: isAdminsLoading } = useCollection<Company>(administratorsQuery);

  const administrators = useMemo(() => {
    const list = rawAdministrators || [];
    const juanExists = list.some(a => a.id === 'adm-juan-f');
    if (!juanExists) return [SIM_JUAN_ADMIN, ...list];
    return list;
  }, [rawAdministrators]);

  const selectedAdmin = useMemo(() => {
    if (!viewingAdminId || !administrators) return null;
    return administrators.find(a => a.id === viewingAdminId) || null;
  }, [viewingAdminId, administrators]);

  const communitiesQuery = useMemoFirebase(() => {
    if (!db || !isSuperAdmin || !viewingAdminId || viewingAdminId === 'adm-juan-f') return null;
    return query(collection(db, "companies", viewingAdminId, "communities"), orderBy("createdAt", "desc"));
  }, [db, isSuperAdmin, viewingAdminId]);

  const { data: rawLinkedCommunities, isLoading: isCommunitiesLoading } = useCollection<Community>(communitiesQuery);

  const linkedCommunities = useMemo(() => {
    if (viewingAdminId === 'adm-juan-f') return SIM_JUAN_COMMUNITIES;
    return rawLinkedCommunities || [];
  }, [rawLinkedCommunities, viewingAdminId]);

  const selectedCommunity = useMemo(() => {
    if (!viewingCommunityId || !linkedCommunities) return null;
    return linkedCommunities.find(c => c.id === viewingCommunityId) || null;
  }, [viewingCommunityId, linkedCommunities]);

  const [simMeters, setSimMeters] = useState<WaterMeter[]>([]);
  useEffect(() => {
    if (viewingCommunityId) {
      setSimMeters(generateMetersForCommunity(viewingCommunityId));
    }
  }, [viewingCommunityId]);

  const metersQuery = useMemoFirebase(() => {
    if (!db || !viewingAdminId || !viewingCommunityId || viewingAdminId === 'adm-juan-f') return null;
    return query(collection(db, "companies", viewingAdminId, "waterMeters"), where("communityId", "==", viewingCommunityId));
  }, [db, viewingAdminId, viewingCommunityId]);

  const { data: rawCommunityMeters } = useCollection<WaterMeter>(metersQuery);

  const communityMeters = useMemo(() => {
    let list = (viewingAdminId === 'adm-juan-f') ? simMeters : (rawCommunityMeters || []);
    if (meterSearchTerm) {
      list = list.filter(m => m.unitIdentifier.toLowerCase().includes(meterSearchTerm.toLowerCase()));
    }
    return list;
  }, [rawCommunityMeters, viewingAdminId, meterSearchTerm, simMeters]);

  const auditStats = useMemo(() => {
    const list = communityMeters;
    if (list.length === 0) return null;
    
    // Si es Mar Azul, el total residencial excluye verticales
    const residential = list.filter(m => !m.unitIdentifier.includes("Vertical"));
    const sumUnits = residential.reduce((acc, m) => acc + m.currentReading, 0);
    
    // Matriz es un 15% más que la suma de unidades
    const matrixTotal = sumUnits * 1.15;
    const commonAreas = matrixTotal - sumUnits;
    
    return { 
      sumUnits, 
      matrixTotal, 
      commonAreas, 
      efficiency: (sumUnits / matrixTotal) * 100, 
      lossCLP: commonAreas * 1800, 
      leakCount: list.filter(m => m.hasLeakAlert).length 
    };
  }, [communityMeters]);

  const handleToggleValveRequest = (meter: WaterMeter) => {
    setPendingMeter(meter);
    setPinInput("");
    setIsPinDialogOpen(true);
  };

  const handleConfirmPin = async () => {
    if (!pendingMeter) return;
    if (pinInput === "123456") {
      setIsPinDialogOpen(false);
      const newStatus = pendingMeter.status === 'open' ? 'closed' : 'open';
      if (viewingAdminId === 'adm-juan-f') {
        setSimMeters(prev => prev.map(m => m.id === pendingMeter.id ? { ...m, status: newStatus as any } : m));
      } else if (db && viewingAdminId) {
        updateDocumentNonBlocking(doc(db, "companies", viewingAdminId, "waterMeters", pendingMeter.id), { status: newStatus, updatedAt: serverTimestamp() });
      }
      toast({ title: newStatus === 'open' ? "Válvula Abierta" : "Válvula Cerrada" });
    } else {
      toast({ title: "PIN Incorrecto", variant: "destructive" });
    }
  };

  const formatDate = (date: any) => {
    if (!mounted || !date) return '...';
    try {
      const d = date?.toDate ? date.toDate() : (typeof date === 'string' ? parseISO(date) : date);
      return format(d, "dd MMM yyyy", { locale: es });
    } catch (e) { return 'N/A'; }
  };

  if (isUserLoading || !isSuperAdmin) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  // --- VISTA 3: DETALLE DE AUDITORÍA DE COMUNIDAD ---
  if (viewingCommunityId && selectedCommunity) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button className="rounded-full h-12 w-12 hover:bg-slate-100 flex items-center justify-center transition-colors" onClick={() => setViewingCommunityId(null)}>
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h2 className="text-4xl font-black tracking-tighter text-slate-900 italic uppercase">{selectedCommunity.name}</h2>
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-2"><MapPin className="h-3 w-3 text-blue-600" /> {selectedCommunity.address}</p>
            </div>
          </div>
        </div>

        {auditStats && (
          <div className="space-y-6">
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
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Consumo Residentes</p>
                  <p className="text-4xl font-black italic text-blue-600">{auditStats.sumUnits.toFixed(2)} <span className="text-sm font-bold opacity-40">m³</span></p>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase text-rose-600 tracking-widest">Diferencial Áreas Comunes</p>
                  <p className="text-4xl font-black italic text-rose-600">{auditStats.commonAreas.toFixed(2)} <span className="text-sm font-bold opacity-40">m³</span></p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="lg:col-span-2 border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="p-8 border-b bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3"><TrendingUp className="h-6 w-6 text-blue-600" /> Tendencia Semanal</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-8 h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={TREND_DATA}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="day" fontSize={10} axisLine={false} tickLine={false} stroke="#64748b" fontWeight="bold" />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} stroke="#64748b" />
                      <Tooltip />
                      <Area type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={4} fill="#3b82f6" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-1 rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white p-10 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute right-0 bottom-0 p-10 opacity-10 group-hover:scale-110 transition-transform"><Sparkles className="h-40 w-40 text-blue-400" /></div>
                <div className="relative z-10 space-y-6">
                  <Badge className="bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest px-4 py-1">Análisis Predictivo GENKO</Badge>
                  <p className="text-slate-400 text-lg leading-relaxed font-medium italic">
                    {viewingCommunityId === 'comm-juan-2' 
                      ? '"Se detecta flujo anómalo en Área Común: Riego Jardín Norte. Posible aspersor roto o fuga en matriz de patio."' 
                      : '"Se detecta incremento del 12% en horas punta. Recomendado auditar riego."'}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        )}

        <div className="space-y-4 pt-8">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2"><Droplets className="h-4 w-4 text-blue-600" /> Medidores de Agua ({communityMeters.length})</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Buscar unidad..." className="pl-9 h-10 border-2 rounded-xl bg-white" value={meterSearchTerm} onChange={e => setMeterSearchTerm(e.target.value)} />
            </div>
          </div>

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
                {communityMeters.map((m) => {
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
                          <Button size="sm" className={cn("h-8 px-4 rounded-xl font-black uppercase text-[8px] gap-2", m.status === 'open' ? "bg-slate-900 text-white" : "bg-blue-600 text-white")} onClick={(e) => { e.stopPropagation(); handleToggleValveRequest(m); }}>
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
      </div>
    );
  }

  // --- VISTA 2: LISTADO DE COMUNIDADES DE UN ADMINISTRADOR ---
  if (viewingAdminId && selectedAdmin) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button className="rounded-full h-12 w-12 hover:bg-slate-100 flex items-center justify-center transition-colors" onClick={() => setViewingAdminId(null)}>
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h2 className="text-4xl font-black tracking-tighter text-slate-900 italic uppercase">Cartera: {selectedAdmin.name}</h2>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Gestión de recintos y telemetría hídrica</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {linkedCommunities.map((comm) => (
            <Card key={comm.id} className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white group hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-blue-100" onClick={() => setViewingCommunityId(comm.id)}>
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-4 rounded-3xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><Building2 className="h-8 w-8" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter truncate">{comm.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" /> {comm.city || 'S/I'}</p>
                  </div>
                </div>
                <div className="bg-slate-900 p-5 rounded-2xl space-y-2">
                  <p className="text-[9px] font-black uppercase text-blue-400 tracking-widest">Ubicación</p>
                  <p className="text-xs font-bold text-slate-300 leading-relaxed line-clamp-1">{comm.address}</p>
                </div>
                <Button className="w-full h-12 rounded-2xl bg-slate-100 text-slate-900 group-hover:bg-blue-600 group-hover:text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-sm transition-all border-none">
                  Entrar a Auditoría <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // --- VISTA 1: LISTADO GLOBAL DE ADMINISTRADORES ---
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild title="Volver al Panel Maestro">
            <Link href="/admin"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gestión de Administradores</h2>
            <p className="text-muted-foreground">Control central de gestores SaaS y sus carteras de comunidades.</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleLogout} variant="ghost" className="text-rose-600 hover:bg-rose-50 font-bold uppercase text-[10px]">
            <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl h-11 px-6 font-black gap-2 shadow-lg bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" /> Registrar Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Alta de Administrador SaaS</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre Administrador / Empresa *</Label>
                    <Input placeholder="Ej: Administraciones Cordillera" value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} className="h-12 border-2 rounded-xl font-bold" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email Corporativo (Invitación) *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input type="email" placeholder="admin@empresa.cl" value={formData.adminEmail} onChange={(e) => setFormData({...formData, adminEmail: e.target.value})} className="h-12 pl-10 border-2 rounded-xl font-bold" required />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button className="w-full h-14 rounded-2xl font-black uppercase shadow-xl bg-blue-600" onClick={() => setIsCreateOpen(false)}>Generar Invitación</Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="pb-6 p-8 border-b">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input placeholder="Buscar por nombre o ID..." className="pl-12 h-14 border-none bg-slate-50 rounded-2xl text-base font-medium shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isAdminsLoading ? (
            <div className="py-20 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-primary/20" /></div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-none">
                  <TableHead className="pl-10 h-14 font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Administrador / Registro</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Plan</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Código Acceso</TableHead>
                  <TableHead className="text-right pr-10 font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {administrators.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())).map((admin: Company) => (
                  <TableRow key={admin.id} className="group hover:bg-slate-50/80 transition-colors cursor-pointer" onClick={() => setViewingAdminId(admin.id)}>
                    <TableCell className="pl-10 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-lg tracking-tight">{admin.name}</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5 mt-1"><Calendar className="h-3 w-3" /> {formatDate(admin.createdAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge className="text-[9px] font-black uppercase border-none px-3 py-1 rounded-full bg-blue-100 text-blue-700">{admin.currentPlan}</Badge></TableCell>
                    <TableCell><code className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-mono font-black text-blue-600 border border-slate-200">{admin.id}</code></TableCell>
                    <TableCell className="text-right pr-10" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white hover:text-blue-600 transition-all" onClick={() => setViewingAdminId(admin.id)}><Eye className="h-5 w-5" /></Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white" onClick={() => handleLogout()}><Settings2 className="h-5 w-5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] p-8 text-center">
          <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><Lock className="h-10 w-10 text-slate-900" /></div>
          <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Validación de Comando</DialogTitle>
          <DialogDescription className="font-bold text-slate-500 mb-6">Está a punto de alterar el suministro. Ingrese PIN maestro.</DialogDescription>
          <Input type="password" placeholder="******" className="h-16 text-center text-3xl font-black tracking-[0.5em] rounded-2xl border-2 mb-6" value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))} />
          <Button className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase" onClick={handleConfirmPin} disabled={pinInput.length < 6}>Confirmar Operación</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminCompaniesPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <AdminCompaniesContent />
    </Suspense>
  );
}
