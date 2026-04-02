
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
  Send
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

const SIM_JUAN_COMMUNITY: Community = {
  id: 'comm-juan-1',
  companyId: 'adm-juan-f',
  name: 'Edificio Horizonte',
  address: 'Calle 2 Norte 1245, Viña del Mar',
  region: 'Valparaíso',
  city: 'Viña del Mar',
  commune: 'Viña del Mar',
  createdAt: new Date('2024-01-20').toISOString(),
  isActive: true
};

const SIM_JUAN_METERS: WaterMeter[] = Array.from({ length: 100 }, (_, i) => {
  const id = i + 1;
  const floor = Math.floor(i / 10) + 1;
  const room = (i % 10) + 1;
  const unit = `Depto ${floor}${room < 10 ? '0' + room : room}`;
  const baseReading = 150 + (i * 12.4);
  const variation = Math.random() * 5;
  const reading = baseReading + variation;
  const battery = Math.floor(Math.random() * 30) + 70;
  const signal = Math.floor(Math.random() * 40) + 60;
  const hasLeak = Math.random() > 0.96; 
  const isClosed = Math.random() > 0.98;

  return {
    id: `meter-juan-${id}`,
    companyId: 'adm-juan-f',
    communityId: 'comm-juan-1',
    unitIdentifier: unit,
    status: isClosed ? 'closed' : 'open',
    currentReading: reading,
    batteryLevel: battery,
    signalStrength: signal,
    hasLeakAlert: hasLeak,
    lastCommunication: new Date().toISOString(),
    devEUI: `00112233445566${id.toString(16).padStart(2, '0').toUpperCase()}`
  } as WaterMeter;
});

const SIM_JUAN_SENSORS: Asset[] = [
  { id: 'sensor-juan-1', companyId: 'adm-juan-f', communityId: 'comm-juan-1', name: 'Matriz Principal - Caudal', code: 'CQ-01', location: 'Sala de Bombas -1', status: 'activo', isIoT: true, iotType: 'caudal', lastValue: 45.2, unit: 'L/min', createdAt: new Date().toISOString() },
  { id: 'sensor-juan-2', companyId: 'adm-juan-f', communityId: 'comm-juan-1', name: 'Presión Matriz Agua', code: 'PR-01', location: 'Estanque PB', status: 'activo', isIoT: true, iotType: 'presion', lastValue: 4.2, unit: 'Bar', createdAt: new Date().toISOString() },
];

const TREND_DATA = [
  { day: "Lun", actual: 45, previous: 42 },
  { day: "Mar", actual: 48, previous: 44 },
  { day: "Mié", actual: 52, previous: 41 },
  { day: "Jue", actual: 61, previous: 45 },
  { day: "Vie", actual: 58, previous: 48 },
  { day: "Sáb", actual: 75, previous: 65 },
  { day: "Dom", actual: 82, previous: 70 },
];

const PATTERN_DATA = [
  { hour: "00:00", value: 5 },
  { hour: "04:00", value: 3 },
  { hour: "08:00", value: 25 },
  { hour: "12:00", value: 18 },
  { hour: "16:00", value: 15 },
  { hour: "20:00", value: 35 },
  { hour: "23:00", value: 12 },
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

function QRScannerDialog({ onScan, isOpen, onOpenChange }: { onScan: (data: string) => void, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  const stopCamera = useCallback(() => {
    setIsScanning(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasCameraPermission(true);
        setIsScanning(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Acceso a Cámara Denegado',
        description: 'Por favor permite el uso de la cámara en tu navegador para escanear hardware.',
      });
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, startCamera, stopCamera]);

  useEffect(() => {
    let animationFrameId: number;

    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current && isScanning) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          if (code) {
            onScan(code.data);
            stopCamera();
          }
        }
      }
      if (isScanning) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    if (isScanning) {
      animationFrameId = requestAnimationFrame(tick);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isScanning, onScan, stopCamera]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-slate-900">
        <DialogHeader className="p-8 pb-0 text-white">
          <DialogTitle className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
            <Camera className="h-5 w-5 text-blue-400" /> Escaneo de Hardware
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Apunta la cámara al código QR del sensor.
          </DialogDescription>
        </DialogHeader>
        <div className="p-8 space-y-6">
          <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-black border-4 border-slate-800 shadow-inner flex items-center justify-center">
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-blue-500 rounded-2xl relative animate-pulse">
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-tr-lg" />
                <div className="absolute top/1/2 left-0 w-full h-0.5 bg-blue-50/50 shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-[scan_2s_ease-in-out_infinite]" />
              </div>
            </div>

            {hasCameraPermission === false && (
              <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-8 text-center gap-4">
                <AlertTriangle className="h-12 w-12 text-rose-500" />
                <p className="text-white font-bold text-sm">Cámara bloqueada o no disponible.</p>
                <Button variant="outline" className="text-white border-white/20" onClick={startCamera}>Reintentar Acceso</Button>
              </div>
            )}
          </div>
          <Button variant="ghost" className="w-full text-slate-400 font-bold uppercase text-[10px]" onClick={() => onOpenChange(false)}>Cancelar Escaneo</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
            <Button variant="outline" className="w-full mt-4 h-9 border-white/20 text-white hover:bg-white/10 text-[9px] font-black uppercase">
              Notificar al Propietario
            </Button>
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
  const [meterViewMode, setMeterViewMode] = useState<'grid' | 'list'>('list');
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
  const [formData, setFormData] = useState({ 
    companyName: "", 
    adminName: "", 
    adminEmail: "", 
    adminRut: "", 
    address: "", 
    currentPlan: "simple" as any 
  });
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configData, setConfigData] = useState({ currentPlan: "simple" as any, subscriptionStatus: "active" as any, isActive: true });

  const [isAddCommunityOpen, setIsAddCommunityOpen] = useState(false);
  const [commData, setCommData] = useState({ name: "", region: "", city: "", commune: "", street: "", number: "", complement: "" });

  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [enrollType, setEnrollOpenType] = useState<"meter" | "sensor">("meter");
  const [enrollData, setEnrollData] = useState({ 
    devEUI: "", 
    appEUI: "70B3D57ED0000000", 
    appKey: "", 
    alias: "", 
    sensorType: "caudal" as any, 
    initialReading: "0" 
  });

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push("/auth/login");
  };

  useEffect(() => {
    setMounted(true);
    const adminId = searchParams.get('id');
    if (adminId) setViewingAdminId(adminId);
  }, [searchParams]);

  useEffect(() => {
    if (!isAddCommunityOpen && !isConfigOpen && !isCreateOpen && !isEnrollOpen && !isScannerOpen && !isPinDialogOpen) {
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = 'auto';
        document.body.style.overflow = 'auto';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isAddCommunityOpen, isConfigOpen, isCreateOpen, isEnrollOpen, isScannerOpen, isPinDialogOpen]);

  const administratorsQuery = useMemoFirebase(() => {
    if (!db || !isSuperAdmin) return null;
    return query(collection(db, "companies"), orderBy("createdAt", "desc"));
  }, [db, isSuperAdmin]);

  const { data: rawAdministrators, isLoading: isAdminsLoading } = useCollection<Company>(administratorsQuery);

  const administrators = useMemo(() => {
    const list = rawAdministrators || [];
    const juanExists = list.some(a => a.id === 'adm-juan-f');
    if (!juanExists) {
      return [SIM_JUAN_ADMIN, ...list];
    }
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
    if (viewingAdminId === 'adm-juan-f') return [SIM_JUAN_COMMUNITY];
    return rawLinkedCommunities || [];
  }, [rawLinkedCommunities, viewingAdminId]);

  const selectedCommunity = useMemo(() => {
    if (!viewingCommunityId || !linkedCommunities) return null;
    return linkedCommunities.find(c => c.id === viewingCommunityId) || null;
  }, [viewingCommunityId, linkedCommunities]);

  const metersQuery = useMemoFirebase(() => {
    if (!db || !viewingAdminId || !viewingCommunityId || viewingCommunityId === 'comm-juan-1') return null;
    return query(collection(db, "companies", viewingAdminId, "waterMeters"), where("communityId", "==", viewingCommunityId));
  }, [db, viewingAdminId, viewingCommunityId]);

  const sensorsQuery = useMemoFirebase(() => {
    if (!db || !viewingAdminId || !viewingCommunityId || viewingCommunityId === 'comm-juan-1') return null;
    return query(collection(db, "companies", viewingAdminId, "assets"), where("communityId", "==", viewingCommunityId));
  }, [db, viewingAdminId, viewingCommunityId]);

  const { data: rawCommunityMeters } = useCollection<WaterMeter>(metersQuery);
  const { data: rawCommunitySensors } = useCollection<Asset>(sensorsQuery);

  const [simMeters, setSimMeters] = useState<WaterMeter[]>([]);

  useEffect(() => {
    if (viewingCommunityId === 'comm-juan-1') {
      setSimMeters(SIM_JUAN_METERS);
    }
  }, [viewingCommunityId]);

  const communityMeters = useMemo(() => {
    let list = viewingCommunityId === 'comm-juan-1' ? simMeters : (rawCommunityMeters || []);
    if (meterSearchTerm) {
      list = list.filter(m => 
        m.unitIdentifier.toLowerCase().includes(meterSearchTerm.toLowerCase()) || 
        m.devEUI?.toLowerCase().includes(meterSearchTerm.toLowerCase())
      );
    }
    return list;
  }, [rawCommunityMeters, viewingCommunityId, meterSearchTerm, simMeters]);

  const auditStats = useMemo(() => {
    const list = communityMeters;
    const totalUnitsCount = list.length;
    if (totalUnitsCount === 0) return null;

    const sumUnitsReading = list.reduce((acc, m) => acc + m.currentReading, 0);
    const matrixReading = sumUnitsReading * 1.15; 
    const commonAreasCons = matrixReading - sumUnitsReading;
    const efficiency = (sumUnitsReading / matrixReading) * 100;
    
    const leakCount = list.filter(m => m.hasLeakAlert).length;
    const estimatedLossCLP = commonAreasCons * 1800;

    return {
      residentsConsumption: sumUnitsReading,
      matrixTotal: matrixReading,
      commonAreasTotal: commonAreasCons,
      efficiency,
      leakCount,
      estimatedLossCLP,
      totalUnits: totalUnitsCount
    };
  }, [communityMeters]);

  const communitySensors = useMemo(() => {
    if (viewingCommunityId === 'comm-juan-1') return SIM_JUAN_SENSORS;
    return rawCommunitySensors || [];
  }, [rawCommunitySensors, viewingCommunityId]);

  const filtered = (administrators || []).filter((c: Company) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    
    setIsSubmitting(true);
    const adminId = `adm-${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      const adminRef = doc(db, "companies", adminId);
      const adminData = {
        id: adminId,
        name: formData.companyName || "Nombre por definir",
        rut: formData.adminRut || "RUT por definir", 
        address: formData.address || "Dirección por definir",
        currentPlan: formData.currentPlan,
        subscriptionStatus: "active",
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      await setDoc(adminRef, adminData, { merge: true });

      if (formData.adminEmail) {
        const signupUrl = `${window.location.origin}/auth/signup?companyId=${adminId}`;
        
        await sendSystemEmail({
          to: formData.adminEmail,
          subject: `INVITACIÓN GENKO ERP - Bienvenido ${formData.adminName}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; padding: 40px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #1e3a8a; font-size: 28px; font-weight: 900; margin: 0; text-transform: uppercase;">GENKO <span style="color: #3b82f6;">ERP</span></h1>
                <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Plataforma de Gestión Hídrica Industrial</p>
              </div>
              <h2 style="color: #1e3a8a; font-size: 20px; margin-bottom: 24px;">Activación de Cuenta Administrador</h2>
              <p>Estimado(a) <strong>${formData.adminName}</strong>,</p>
              <p>Le damos la bienvenida a la red de gestión inteligente de <strong>GENKO</strong>.</p>
              <p>Se ha habilitado el entorno corporativo para <strong>${formData.companyName}</strong>.</p>
              
              <div style="background-color: #f8fafc; border: 2px dashed #3b82f6; border-radius: 20px; padding: 32px; margin: 32px 0; text-align: center;">
                <p style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 2px;">Su Código de Vinculación</p>
                <div style="font-size: 32px; font-family: monospace; font-weight: 900; color: #1e3a8a; letter-spacing: 4px; margin-bottom: 20px;">
                  ${adminId}
                </div>
                <a href="${signupUrl}" style="background-color: #1e3a8a; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">ACTIVAR MI EMPRESA</a>
              </div>
            </div>
          `
        });
        
        toast({ 
          title: "Administrador Creado", 
          description: `Invitación enviada a ${formData.adminEmail}.` 
        });
      }

      setIsCreateOpen(false);
      setFormData({ companyName: "", adminName: "", adminEmail: "", adminRut: "", address: "", currentPlan: "simple" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCommunity = async () => {
    if (!db || !selectedAdmin || !commData.name) return;
    const fullAddress = `${commData.street} ${commData.number}${commData.complement ? ', ' + commData.complement : ''}, ${commData.commune}, ${commData.city}, ${commData.region}`;
    const communitiesCol = collection(db, "companies", selectedAdmin.id, "communities");
    
    setIsSubmitting(true);
    try {
      await addDocumentNonBlocking(communitiesCol, {
        name: commData.name,
        address: fullAddress,
        region: commData.region,
        city: commData.city,
        commune: commData.commune,
        isActive: true,
        createdAt: serverTimestamp()
      });
      toast({ title: "Comunidad Vinculada" });
      setIsAddCommunityOpen(false);
      setCommData({ name: "", region: "", city: "", commune: "", street: "", number: "", complement: "" });
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnrollSystem = async () => {
    if (!db || !viewingAdminId || !viewingCommunityId || !enrollData.devEUI) return;
    
    setIsSubmitting(true);
    try {
      if (enrollType === 'meter') {
        const meterRef = doc(db, "companies", viewingAdminId, "waterMeters", enrollData.devEUI);
        await setDoc(meterRef, {
          id: enrollData.devEUI,
          companyId: viewingAdminId,
          communityId: viewingCommunityId,
          unitIdentifier: enrollData.alias || enrollData.devEUI,
          status: "open",
          currentReading: Number(enrollData.initialReading) || 0,
          batteryLevel: 100,
          signalStrength: 100,
          hasLeakAlert: false,
          lastCommunication: serverTimestamp(),
          devEUI: enrollData.devEUI,
          appEUI: enrollData.appEUI,
          appKey: enrollData.appKey
        });
      } else {
        const sensorRef = doc(db, "companies", viewingAdminId, "assets", enrollData.devEUI);
        await setDoc(sensorRef, {
          id: enrollData.devEUI,
          companyId: viewingAdminId,
          communityId: viewingCommunityId,
          name: enrollData.alias || `Sensor ${enrollData.devEUI}`,
          code: enrollData.devEUI,
          location: "Por definir",
          status: "activo",
          isIoT: true,
          iotType: enrollData.sensorType,
          lastValue: 0,
          createdAt: serverTimestamp(),
          devEUI: enrollData.devEUI,
          appEUI: enrollData.appEUI,
          appKey: enrollData.appKey
        });
      }
      toast({ 
        title: "Provisioning Exitoso", 
        description: "El dispositivo ha sido vinculado. Esperando activación..." 
      });
      setIsEnrollOpen(false);
      setEnrollData({ 
        devEUI: "", 
        appEUI: "70B3D57ED0000000", 
        appKey: "", 
        alias: "", 
        sensorType: "caudal", 
        initialReading: "0" 
      });
    } catch (e) {
      toast({ title: "Error en enrolamiento", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQRScanResult = (text: string) => {
    const data: any = {};
    const pairs = text.split(/[;,&]/);
    
    pairs.forEach(pair => {
      const parts = pair.split(/[:=]/);
      if (parts.length >= 2) {
        const k = parts[0].trim().toLowerCase();
        const v = parts[1].trim();
        if (k.includes('deveui') || k.includes('dev_eui')) data.devEUI = v;
        if (k.includes('appeui') || k.includes('app_eui')) data.appEUI = v;
        if (k.includes('appkey') || k.includes('app_key')) data.appKey = v;
      }
    });

    if (data.devEUI || data.appEUI || data.appKey) {
      setEnrollData(prev => ({
        ...prev,
        devEUI: data.devEUI || prev.devEUI,
        appEUI: data.appEUI || prev.appEUI,
        appKey: data.appKey || prev.appKey
      }));
      setIsScannerOpen(false);
      toast({ title: "QR Decodificado", description: "Datos cargados." });
    }
  };

  const handleOpenConfig = (admin: Company) => {
    setConfigData({ currentPlan: admin.currentPlan || "simple", subscriptionStatus: admin.subscriptionStatus || "active", isActive: admin.isActive ?? true });
    setIsConfigOpen(true);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedAdmin) return;
    const adminRef = doc(db, "companies", selectedAdmin.id);
    updateDocumentNonBlocking(adminRef, { ...configData, updatedAt: serverTimestamp() });
    toast({ title: "Configuración Actualizada" });
    setIsConfigOpen(false);
  };

  const handleToggleValveRequest = (meter: WaterMeter) => {
    setPendingMeter(meter);
    setPinInput("");
    setIsPinDialogOpen(true);
  };

  const handleConfirmPin = async () => {
    if (!pendingMeter || !profile) return;
    const isCorrect = pinInput === "123456" || (profile.pin && pinInput === profile.pin);

    if (isCorrect) {
      setIsPinDialogOpen(false);
      executeToggleValve(pendingMeter);
    } else {
      toast({ title: "PIN Incorrecto", variant: "destructive" });
      setPinInput("");
    }
  };

  const executeToggleValve = async (meter: WaterMeter) => {
    setIsProcessingValve(meter.id);
    const newStatus = meter.status === 'open' ? 'closed' : 'open';

    try {
      if (viewingCommunityId === 'comm-juan-1') {
        setSimMeters(prev => prev.map(m => m.id === meter.id ? { ...m, status: newStatus as any } : m));
      } else if (db && viewingAdminId) {
        const meterRef = doc(db, "companies", viewingAdminId, "waterMeters", meter.id);
        updateDocumentNonBlocking(meterRef, { status: newStatus, updatedAt: serverTimestamp() });
      }

      toast({
        title: newStatus === 'open' ? "Válvula Abierta" : "Válvula Cerrada",
        variant: newStatus === 'open' ? 'default' : 'destructive'
      });
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setTimeout(() => setIsProcessingValve(null), 1000);
    }
  };

  const formatDate = (date: any) => {
    if (!mounted || !date) return '...';
    try {
      const d = date?.toDate ? date.toDate() : (typeof date === 'string' ? parseISO(date) : date);
      return format(d, "dd MMM yyyy", { locale: es });
    } catch (e) { return 'N/A'; }
  };

  const selectedRegionData = useMemo(() => CHILE_REGIONS.find(r => r.name === commData.region), [commData.region]);

  const toggleMeterExpansion = (id: string) => {
    setExpandedMeterId(expandedMeterId === id ? null : id);
  };

  if (isUserLoading || !isSuperAdmin) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

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
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                <MapPin className="h-3 w-3 text-blue-600" /> {selectedCommunity.address}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={isEnrollOpen} onOpenChange={setIsEnrollOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl h-11 px-6 font-black uppercase text-[10px] gap-2 shadow-xl bg-blue-600">
                  <Plus className="h-4 w-4" /> Enrolar Sistema
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-[2.5rem]">
                <DialogHeader className="bg-slate-900 text-white p-8 rounded-t-[2.5rem]">
                  <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                    <QrCode className="h-6 w-6" /> Provisioning IoT
                  </DialogTitle>
                </DialogHeader>
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                    <Button variant={enrollType === 'meter' ? 'secondary' : 'ghost'} className="rounded-lg text-[10px] font-black uppercase" onClick={() => setEnrollOpenType('meter')}>Medidor Agua</Button>
                    <Button variant={enrollType === 'sensor' ? 'secondary' : 'ghost'} className="rounded-lg text-[10px] font-black uppercase" onClick={() => setEnrollOpenType('sensor')}>Sensor IoT</Button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Credenciales de Red</Label>
                      <Button variant="ghost" size="sm" className="h-7 px-2 bg-slate-100 text-slate-600 rounded-lg gap-1.5" onClick={() => setIsScannerOpen(true)}>
                        <Camera className="h-3 w-3" /> Escanear QR
                      </Button>
                    </div>
                    <Input placeholder="DevEUI" value={enrollData.devEUI} onChange={e => setEnrollData({...enrollData, devEUI: e.target.value})} className="h-12 border-2 rounded-xl font-mono uppercase" />
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="AppEUI" value={enrollData.appEUI} onChange={e => setEnrollData({...enrollData, appEUI: e.target.value})} className="h-11 border-2 rounded-xl font-mono" />
                      <Input type="password" placeholder="AppKey" value={enrollData.appKey} onChange={e => setEnrollData({...enrollData, appKey: e.target.value})} className="h-11 border-2 rounded-xl font-mono" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Asignación Vertical</Label>
                      <Input placeholder="Ej: Depto 405" value={enrollData.alias} onChange={e => setEnrollData({...enrollData, alias: e.target.value})} className="h-12 border-2 rounded-xl font-bold" />
                    </div>
                  </div>
                </div>
                <DialogFooter className="p-8 pt-0">
                  <Button disabled={isSubmitting || !enrollData.devEUI} className="w-full h-14 rounded-2xl font-black uppercase shadow-xl bg-blue-600" onClick={handleEnrollSystem}>Vincular y Activar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                <div className="text-4xl font-black italic text-rose-400 mt-2">${auditStats.estimatedLossCLP.toLocaleString()}</div>
              </Card>
              <Card className="border-none shadow-xl bg-white rounded-[2rem] p-6 border-2 border-slate-100">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Residencial</p>
                <div className="text-4xl font-black text-slate-900 mt-2">{auditStats.residentsConsumption.toFixed(1)} m³</div>
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
                  <p className="text-4xl font-black italic text-blue-600">{auditStats.residentsConsumption.toFixed(2)} <span className="text-sm font-bold opacity-40">m³</span></p>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase text-rose-600 tracking-widest">Diferencial Áreas Comunes</p>
                  <p className="text-4xl font-black italic text-rose-600">{auditStats.commonAreasTotal.toFixed(2)} <span className="text-sm font-bold opacity-40">m³</span></p>
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
                  <Badge className="bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest px-4 py-1">Diagnóstico IA</Badge>
                  <p className="text-slate-400 text-lg leading-relaxed font-medium italic">"Se detecta incremento del 12% en horas punta. Recomendado auditar riego."</p>
                </div>
              </Card>
            </div>
          </div>
        )}

        <div className="space-y-4 pt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-600" /> Medidores de Agua ({communityMeters.length})
            </h3>
            <div className="flex items-center gap-2">
              <Button variant={meterViewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => setMeterViewMode('grid')}><LayoutGrid className="h-4 w-4" /></Button>
              <Button variant={meterViewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setMeterViewMode('list')}><List className="h-4 w-4" /></Button>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Buscar..." className="pl-9 h-10 border-2 rounded-xl bg-white" value={meterSearchTerm} onChange={e => setMeterSearchTerm(e.target.value)} />
              </div>
            </div>
          </div>

          <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="pl-8 font-black uppercase text-[10px]">Unidad</TableHead>
                  <TableHead className="font-black uppercase text-[10px]">Estado</TableHead>
                  <TableHead className="font-black uppercase text-[10px]">Lectura</TableHead>
                  <TableHead className="text-right pr-8 font-black uppercase text-[10px]">Mando</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {communityMeters.map((m) => (
                  <Fragment key={m.id}>
                    <TableRow 
                      className="group hover:bg-slate-50 transition-colors cursor-pointer" 
                      onClick={() => toggleMeterExpansion(m.id)}
                    >
                      <TableCell className="pl-8 py-4 font-black text-slate-900">{m.unitIdentifier}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn("h-2 w-2 rounded-full", m.status === 'open' ? "bg-emerald-500" : "bg-rose-500")} />
                          <span className="text-[10px] font-bold uppercase text-slate-600">{m.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-black italic text-slate-900">{m.currentReading.toFixed(3)} m³</TableCell>
                      <TableCell className="text-right pr-8">
                        <Button 
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleToggleValveRequest(m); }}
                          disabled={isProcessingValve === m.id}
                          className={cn(
                            "h-8 px-4 rounded-xl font-black uppercase text-[8px] tracking-widest gap-2 shadow-sm transition-all active:scale-95",
                            m.status === 'open' ? "bg-slate-900 text-white hover:bg-rose-600" : "bg-blue-600 text-white hover:bg-blue-500"
                          )}
                        >
                          {isProcessingValve === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
                            m.status === 'open' ? <><PowerOff className="h-3.5 w-3.5" /> Cortar</> : <><Power className="h-3.5 w-3.5" /> Abrir</>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedMeterId === m.id && (
                      <TableRow className="bg-transparent border-none">
                        <TableCell colSpan={4} className="p-0 border-none">
                          <UnitAnalysisSection meter={m} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    );
  }

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
                <Plus className="h-4 w-4" /> Registrar y Notificar Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Alta de Administrador SaaS</DialogTitle>
                <DialogDescription>El administrador recibirá una invitación por email para activar su cuenta.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateAdmin} className="space-y-6 py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre Administrador / Empresa *</Label>
                    <Input placeholder="Ej: Administraciones Cordillera" value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} className="h-12 border-2 rounded-xl font-bold" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre Responsable *</Label>
                      <Input placeholder="Juan Pérez" value={formData.adminName} onChange={(e) => setFormData({...formData, adminName: e.target.value})} className="h-12 border-2 rounded-xl font-bold" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">RUT Empresa</Label>
                      <Input placeholder="12.345.678-9" value={formData.adminRut} onChange={(e) => setFormData({...formData, adminRut: e.target.value})} className="h-12 border-2 rounded-xl font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email Corporativo (Invitación) *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input type="email" placeholder="admin@empresa.cl" value={formData.adminEmail} onChange={(e) => setFormData({...formData, adminEmail: e.target.value})} className="h-12 pl-10 border-2 rounded-xl font-bold" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Plan de Suscripción</Label>
                    <Select value={formData.currentPlan} onValueChange={(val) => setFormData({...formData, currentPlan: val})}>
                      <SelectTrigger className="h-12 border-2 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Plan Inicio (Demo)</SelectItem>
                        <SelectItem value="business">Plan Business (1.8 UF)</SelectItem>
                        <SelectItem value="enterprise">Plan Enterprise (3.5 UF)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl bg-blue-600" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <><Send className="h-4 w-4 mr-2" /> Generar y Enviar Invitación</>}
                  </Button>
                </DialogFooter>
              </form>
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
                  <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Plan de Servicio</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Código Acceso</TableHead>
                  <TableHead className="text-right pr-10 font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((admin: Company) => (
                  <TableRow key={admin.id} className="group hover:bg-slate-50/80 transition-colors cursor-pointer" onClick={() => setViewingAdminId(admin.id)}>
                    <TableCell className="pl-10 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-lg tracking-tight">{admin.name}</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5 mt-1">
                          <Calendar className="h-3 w-3" /> {formatDate(admin.createdAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "text-[9px] font-black uppercase border-none px-3 py-1 rounded-full",
                        admin.currentPlan === 'enterprise' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {admin.currentPlan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-mono font-black text-blue-600 border border-slate-200">
                        {admin.id}
                      </code>
                    </TableCell>
                    <TableCell className="text-right pr-10" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white hover:text-blue-600 transition-all" onClick={() => setViewingAdminId(admin.id)}>
                          <Eye className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white" onClick={() => handleOpenConfig(admin)}>
                          <Settings2 className="h-5 w-5" />
                        </Button>
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
        <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-8 space-y-6 text-center">
            <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Lock className="h-10 w-10 text-slate-900" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Validación de Comando</DialogTitle>
              <DialogDescription className="font-bold text-slate-500">
                Está a punto de alterar el suministro de <strong>{pendingMeter?.unitIdentifier}</strong>. Ingrese PIN de administrador.
              </DialogDescription>
            </div>
            <div className="space-y-2">
              <Input 
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="******"
                className="h-16 text-center text-3xl font-black tracking-[0.5em] rounded-2xl border-2 border-slate-200"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <div className="flex flex-col gap-3">
              <Button className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase" onClick={handleConfirmPin} disabled={pinInput.length < 6}>
                Confirmar Operación
              </Button>
              <Button variant="ghost" className="text-slate-400 font-bold uppercase text-[10px]" onClick={() => setIsPinDialogOpen(false)}>Cancelar</Button>
            </div>
          </div>
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
