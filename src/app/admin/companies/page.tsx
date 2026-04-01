
"use client";

import { useState, useEffect, useMemo, Suspense, useRef, useCallback } from "react";
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
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { redirect, useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  useAuth,
  updateDocumentNonBlocking,
  setDocumentNonBlocking,
  addDocumentNonBlocking
} from "@/firebase";
import { collection, doc, serverTimestamp, query, orderBy, where, setDoc } from "firebase/firestore";
import { Company, Community, WaterMeter, Asset } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { signOut } from "firebase/auth";
import { CHILE_REGIONS } from "@/lib/chile-data";
import jsQR from "jsqr";

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

const SIM_JUAN_METERS: WaterMeter[] = [
  { id: 'meter-juan-1', companyId: 'adm-juan-f', communityId: 'comm-juan-1', unitIdentifier: 'Depto 402 (Torre A)', status: 'open', currentReading: 452.12, batteryLevel: 95, signalStrength: 88, hasLeakAlert: false, lastCommunication: new Date().toISOString(), devEUI: '0011223344556601' },
  { id: 'meter-juan-2', companyId: 'adm-juan-f', communityId: 'comm-juan-1', unitIdentifier: 'Depto 505 (Torre A)', status: 'open', currentReading: 12.45, batteryLevel: 92, signalStrength: 75, hasLeakAlert: true, lastCommunication: new Date().toISOString(), devEUI: '0011223344556602' },
  { id: 'meter-juan-3', companyId: 'adm-juan-f', communityId: 'comm-juan-1', unitIdentifier: 'Oficina Admin (PB)', status: 'open', currentReading: 1245.80, batteryLevel: 100, signalStrength: 99, hasLeakAlert: false, lastCommunication: new Date().toISOString(), devEUI: '0011223344556603' },
];

const SIM_JUAN_SENSORS: Asset[] = [
  { id: 'sensor-juan-1', companyId: 'adm-juan-f', communityId: 'comm-juan-1', name: 'Matriz Principal - Caudal', code: 'CQ-01', location: 'Sala de Bombas -1', status: 'activo', isIoT: true, iotType: 'caudal', lastValue: 45.2, unit: 'L/min', createdAt: new Date().toISOString() },
  { id: 'sensor-juan-2', companyId: 'adm-juan-f', communityId: 'comm-juan-1', name: 'Presión Matriz Agua', code: 'PR-01', location: 'Estanque PB', status: 'activo', isIoT: true, iotType: 'presion', lastValue: 4.2, unit: 'Bar', createdAt: new Date().toISOString() },
];

// --- COMPONENTE ESCÁNER QR ---
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
            
            {/* Overlay de escaneo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-blue-500 rounded-2xl relative animate-pulse">
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-tr-lg" />
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-50/50 shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-[scan_2s_ease-in-out_infinite]" />
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

function AdminCompaniesContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSuperAdmin, isLoading: isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  
  // Niveles de Navegación
  const [viewingAdminId, setViewingAdminId] = useState<string | null>(null);
  const [viewingCommunityId, setViewingCommunityId] = useState<string | null>(null);
  
  // State para creación/edición
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", address: "", currentPlan: "simple" as any });
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configData, setConfigData] = useState({ currentPlan: "simple" as any, subscriptionStatus: "active" as any, isActive: true });

  // Community Form State
  const [isAddCommunityOpen, setIsAddCommunityOpen] = useState(false);
  const [commData, setCommData] = useState({ name: "", region: "", city: "", commune: "", street: "", number: "", complement: "" });

  // Enrollment State (Provisioning LoRaWAN/NB-IoT)
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [enrollType, setEnrollOpenType] = useState<"meter" | "sensor">("meter");
  const [enrollData, setEnrollData] = useState({ 
    devEUI: "", 
    appEUI: "70B3D57ED0000000", 
    appKey: "", 
    alias: "", 
    sensorType: "caudal", 
    initialReading: "0" 
  });

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/auth/login");
  };

  useEffect(() => {
    setMounted(true);
    const adminId = searchParams.get('id');
    if (adminId) setViewingAdminId(adminId);
  }, [searchParams]);

  // FORCE UNLOCK BODY
  useEffect(() => {
    if (!isAddCommunityOpen && !isConfigOpen && !isCreateOpen && !isEnrollOpen && !isScannerOpen) {
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = 'auto';
        document.body.style.overflow = 'auto';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isAddCommunityOpen, isConfigOpen, isCreateOpen, isEnrollOpen, isScannerOpen]);

  // Consultas Globales
  const administratorsQuery = useMemoFirebase(() => {
    if (!db || !isSuperAdmin) return null;
    return query(collection(db, "companies"), orderBy("createdAt", "desc"));
  }, [db, isSuperAdmin]);

  const { data: rawAdministrators, isLoading: isAdminsLoading } = useCollection<Company>(administratorsQuery);

  // Inyectar Juan Fernández
  const administrators = useMemo(() => {
    const list = rawAdministrators || [];
    if (!list.some(a => a.id === 'adm-juan-f')) {
      return [SIM_JUAN_ADMIN, ...list];
    }
    return list;
  }, [rawAdministrators]);

  const selectedAdmin = useMemo(() => {
    if (!viewingAdminId || !administrators) return null;
    return administrators.find(a => a.id === viewingAdminId) || null;
  }, [viewingAdminId, administrators]);

  // Consulta de Comunidades
  const communitiesQuery = useMemoFirebase(() => {
    if (!db || !isSuperAdmin || !viewingAdminId || viewingAdminId === 'adm-juan-f') return null;
    return query(collection(db, "companies", viewingAdminId, "communities"), orderBy("createdAt", "desc"));
  }, [db, isSuperAdmin, viewingAdminId]);

  const { data: rawLinkedCommunities, isLoading: isCommunitiesLoading } = useCollection<Community>(communitiesQuery);

  // Inyectar comunidad de Juan
  const linkedCommunities = useMemo(() => {
    if (viewingAdminId === 'adm-juan-f') return [SIM_JUAN_COMMUNITY];
    return rawLinkedCommunities || [];
  }, [rawLinkedCommunities, viewingAdminId]);

  const selectedCommunity = useMemo(() => {
    if (!viewingCommunityId || !linkedCommunities) return null;
    return linkedCommunities.find(c => c.id === viewingCommunityId) || null;
  }, [viewingCommunityId, linkedCommunities]);

  // Consulta de Equipos por Comunidad
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

  const communityMeters = useMemo(() => {
    if (viewingCommunityId === 'comm-juan-1') return SIM_JUAN_METERS;
    return rawCommunityMeters || [];
  }, [rawCommunityMeters, viewingCommunityId]);

  const communitySensors = useMemo(() => {
    if (viewingCommunityId === 'comm-juan-1') return SIM_JUAN_SENSORS;
    return rawCommunitySensors || [];
  }, [rawCommunitySensors, viewingCommunityId]);

  const filtered = (administrators || []).filter((c: Company) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSubmitting(true);
    const adminId = `adm-${Math.random().toString(36).substr(2, 6)}`;
    const adminRef = doc(db, "companies", adminId);
    const adminData = {
      id: adminId,
      name: formData.name || "Nombre por definir",
      rut: "RUT por definir", 
      address: formData.address || "Dirección por definir",
      currentPlan: formData.currentPlan,
      subscriptionStatus: "active",
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    setDocumentNonBlocking(adminRef, adminData, { merge: true });
    toast({ title: "Administrador Creado" });
    setIsCreateOpen(false);
    setFormData({ name: "", address: "", currentPlan: "simple" });
    setIsSubmitting(false);
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
        description: "El dispositivo ha sido vinculado. Esperando mensaje de activación (JOIN)..." 
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

    if (!data.devEUI && pairs.length >= 3) {
      if (pairs[0].length >= 16) data.devEUI = pairs[0].trim();
      if (pairs[1].length >= 16) data.appEUI = pairs[1].trim();
      if (pairs[2].length >= 32) data.appKey = pairs[2].trim();
    }

    if (data.devEUI || data.appEUI || data.appKey) {
      setEnrollData(prev => ({
        ...prev,
        devEUI: data.devEUI || prev.devEUI,
        appEUI: data.appEUI || prev.appEUI,
        appKey: data.appKey || prev.appKey
      }));
      setIsScannerOpen(false);
      toast({ title: "QR Decodificado", description: "Datos de hardware cargados automáticamente." });
    } else {
      toast({ 
        title: "QR no reconocido", 
        description: "El formato del código no es compatible con el estándar de red. Ingrese los datos manualmente.",
        variant: "destructive"
      });
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

  const formatDate = (date: any) => {
    if (!mounted || !date) return '...';
    try {
      const d = date?.toDate ? date.toDate() : (typeof date === 'string' ? parseISO(date) : date);
      return format(d, "dd MMM yyyy", { locale: es });
    } catch (e) { return 'N/A'; }
  };

  const selectedRegionData = useMemo(() => CHILE_REGIONS.find(r => r.name === commData.region), [commData.region]);

  if (isUserLoading || !isSuperAdmin) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  // RENDERIZADO NIVEL 3: DETALLE DE COMUNIDAD (EQUIPOS)
  if (viewingCommunityId && selectedCommunity) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
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
          <Dialog open={isEnrollOpen} onOpenChange={setIsEnrollOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl h-11 px-6 font-black uppercase text-[10px] gap-2 shadow-xl bg-blue-600">
                <Plus className="h-4 w-4" /> Enrolar Nuevo Sistema
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
              <DialogHeader className="bg-slate-900 text-white p-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-blue-600 p-2 rounded-lg"><QrCode className="h-6 w-6" /></div>
                  <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Provisioning IoT</DialogTitle>
                </div>
                <DialogDescription className="text-slate-400 font-medium">Sincronice hardware LoRaWAN/NB-IoT con esta comunidad.</DialogDescription>
              </DialogHeader>
              
              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
                  <Button variant={enrollType === 'meter' ? 'default' : 'ghost'} className={cn("rounded-xl text-[10px] font-black uppercase h-10 transition-all", enrollType === 'meter' && "bg-white text-slate-900 shadow-sm")} onClick={() => setEnrollOpenType('meter')}>Medidor Agua</Button>
                  <Button variant={enrollType === 'sensor' ? 'default' : 'ghost'} className={cn("rounded-xl text-[10px] font-black uppercase h-10 transition-all", enrollType === 'sensor' && "bg-white text-slate-900 shadow-sm")} onClick={() => setEnrollOpenType('sensor')}>Sensor Clap-On</Button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase text-primary tracking-widest">
                    <div className="flex items-center gap-2"><Wifi className="h-4 w-4" /> Credenciales de Red</div>
                    <Button variant="ghost" size="sm" className="h-7 px-2 bg-slate-100 text-slate-600 rounded-lg gap-1.5" onClick={() => setIsScannerOpen(true)}>
                      <Camera className="h-3 w-3" /> Escanear QR
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">DevEUI (ID Único del Hardware)</Label>
                    <div className="relative">
                      <Input placeholder="Ej: 0011223344556677" value={enrollData.devEUI} onChange={e => setEnrollData({...enrollData, devEUI: e.target.value})} className="h-12 border-2 rounded-xl font-bold font-mono uppercase pl-4" />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors" title="Escanear QR" onClick={() => setIsScannerOpen(true)}><Smartphone className="h-5 w-5" /></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">AppEUI</Label>
                      <Input value={enrollData.appEUI} onChange={e => setEnrollData({...enrollData, appEUI: e.target.value})} className="h-11 border-2 rounded-xl font-mono text-xs" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">AppKey (AES-128)</Label>
                      <div className="relative">
                        <Input type="password" placeholder="Key de Encriptación" value={enrollData.appKey} onChange={e => setEnrollData({...enrollData, appKey: e.target.value})} className="h-11 border-2 rounded-xl font-mono text-xs pr-10" />
                        <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t-2 border-dashed border-slate-100">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest"><MapPin className="h-4 w-4" /> Asignación Lógica</div>
                  
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Ubicación / Vertical / Identificador</Label>
                    <Input placeholder={enrollType === 'meter' ? "Ej: Depto 405 (Torre A)" : "Ej: Matriz Principal - Sala Calderas"} value={enrollData.alias} onChange={e => setEnrollData({...enrollData, alias: e.target.value})} className="h-12 border-2 rounded-xl font-bold" />
                  </div>

                  {enrollType === 'meter' && (
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Lectura Inicial / Offset (m³)</Label>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="Ej: 450.00" 
                        value={enrollData.initialReading} 
                        onChange={e => setEnrollData({...enrollData, initialReading: e.target.value})} 
                        className="h-12 border-2 rounded-xl font-black text-blue-600 text-center text-lg" 
                      />
                      <p className="text-[9px] text-slate-400 font-medium italic text-center">Sincronice el CRM con la lectura actual del medidor físico análogo.</p>
                    </div>
                  )}

                  {enrollType === 'sensor' && (
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Magnitud de Monitoreo</Label>
                      <Select modal={false} value={enrollData.sensorType} onValueChange={v => setEnrollData({...enrollData, sensorType: v})}>
                        <SelectTrigger className="h-12 border-2 rounded-xl font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="caudal" className="font-bold">Caudal (L/min)</SelectItem>
                          <SelectItem value="vibracion">Vibración (Hz)</SelectItem>
                          <SelectItem value="temperatura">Temperatura (°C)</SelectItem>
                          <SelectItem value="presion">Presión (Bar)</SelectItem>
                          <SelectItem value="otro">Genérico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter className="p-8 bg-slate-50 border-t">
                <Button disabled={isSubmitting || !enrollData.devEUI} className="w-full h-16 rounded-2xl font-black uppercase tracking-widest shadow-xl text-lg bg-blue-600 hover:bg-blue-700" onClick={handleEnrollSystem}>
                  {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : "Vincular y Activar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <QRScannerDialog 
            isOpen={isScannerOpen} 
            onOpenChange={setIsScannerOpen} 
            onScan={handleQRScanResult} 
          />
        </div>

        <div className="grid gap-8">
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2 pl-2">
              <Droplets className="h-4 w-4 text-blue-600" /> Medidores de Agua Inteligentes
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(communityMeters || []).map((m) => (
                <Card key={m.id} className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden group">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><Droplets className="h-6 w-6" /></div>
                      <Badge className="bg-emerald-50 text-emerald-700 font-black text-[8px] uppercase px-2 h-5">Online</Badge>
                    </div>
                    <div>
                      <p className="text-xl font-black italic uppercase tracking-tighter text-slate-900">{m.unitIdentifier}</p>
                      <p className="text-[10px] font-mono text-slate-400">DevEUI: {m.devEUI || m.id}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-baseline">
                      <span className="text-[9px] font-black uppercase text-slate-400">Lectura m³</span>
                      <span className="text-2xl font-black italic">{m.currentReading.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(communityMeters || []).length === 0 && (
                <div className="col-span-full py-20 text-center border-4 border-dashed rounded-[3rem] bg-slate-50/50 opacity-40 italic">Sin medidores registrados.</div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2 pl-2">
              <Cpu className="h-4 w-4 text-indigo-600" /> Sensores de Activos Críticos
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(communitySensors || []).map((s) => (
                <Card key={s.id} className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden group">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all"><Cpu className="h-6 w-6" /></div>
                      <Badge className="bg-blue-50 text-blue-700 font-black text-[8px] uppercase px-2 h-5">{s.iotType?.toUpperCase()}</Badge>
                    </div>
                    <div>
                      <p className="text-xl font-black italic uppercase tracking-tighter text-slate-900">{s.name}</p>
                      <p className="text-[10px] font-mono text-slate-400">DevEUI: {s.devEUI || s.id}</p>
                    </div>
                    <div className="bg-indigo-950 p-4 rounded-2xl flex justify-between items-baseline text-white">
                      <span className="text-[9px] font-black uppercase text-blue-400">Valor Live</span>
                      <span className="text-2xl font-black italic">{s.lastValue || '0.0'} {s.unit}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(communitySensors || []).length === 0 && (
                <div className="col-span-full py-20 text-center border-4 border-dashed rounded-[3rem] bg-slate-50/50 opacity-40 italic">Sin sensores de monitoreo.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RENDERIZADO NIVEL 2: DETALLE DE ADMINISTRADOR (COMUNIDADES)
  if (viewingAdminId && selectedAdmin) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="rounded-full h-12 w-12 hover:bg-slate-100 flex items-center justify-center transition-colors" onClick={() => { setViewingAdminId(null); router.push('/admin/companies'); }}>
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h2 className="text-4xl font-black tracking-tighter text-slate-900 italic uppercase">Ficha del Administrador</h2>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Control de gestión y recintos vinculados</p>
            </div>
          </div>
          <Button variant="outline" className="rounded-xl font-bold h-11 px-6 border-slate-200" onClick={() => handleOpenConfig(selectedAdmin)}>
            <Settings2 className="h-4 w-4 mr-2" /> Ajustar Suscripción
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white overflow-hidden relative group">
            <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><UserCog className="h-40 w-40 text-blue-400" /></div>
            <CardHeader className="p-10 pb-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <Badge className="bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest px-3 py-1 mb-4">Registro SaaS Activo</Badge>
                  <CardTitle className="text-4xl font-black italic uppercase tracking-tighter">{selectedAdmin.name}</CardTitle>
                  <p className="text-blue-400 font-mono text-xs pt-2">ID ÚNICO: {selectedAdmin.id}</p>
                </div>
                <Badge variant="outline" className="border-white/20 text-white font-black uppercase text-[10px] px-4 py-2 rounded-full backdrop-blur-md bg-white/5">
                  Plan {selectedAdmin.currentPlan?.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-10 pt-6 grid grid-cols-2 gap-8 relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Fecha de Ingreso</p>
                <p className="text-lg font-bold">{formatDate(selectedAdmin.createdAt)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Estado Operativo</p>
                <div className="flex items-center gap-2">
                  <div className={cn("h-2.5 w-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)]", selectedAdmin.isActive ? "bg-emerald-500" : "bg-rose-500")} />
                  <p className="text-lg font-black italic uppercase tracking-tight">{selectedAdmin.isActive ? 'Operativo' : 'Suspendido'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-xl bg-blue-600 text-white p-10 flex flex-col justify-center text-center space-y-4">
            <div className="bg-white/20 p-4 rounded-3xl w-fit mx-auto mb-2"><Home className="h-10 w-10" /></div>
            <div className="space-y-1">
              <p className="text-5xl font-black italic tracking-tighter">{linkedCommunities?.length || 0}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Comunidades Vinculadas</p>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-blue-600" /> Cartera de Recintos
            </h3>
            <Dialog open={isAddCommunityOpen} onOpenChange={setIsAddCommunityOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl h-11 px-6 font-black uppercase text-[10px] gap-2 shadow-lg shadow-blue-900/10">
                  <Plus className="h-4 w-4" /> Vincular Nueva Comunidad
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black italic uppercase">Nuevo Registro de Comunidad</DialogTitle>
                  <DialogDescription>Asigne un recinto para que este administrador pueda gestionarlo.</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Nombre del Recinto *</Label>
                    <Input placeholder="Ej: Edificio Vista Mar" value={commData.name} onChange={e => setCommData({...commData, name: e.target.value})} className="h-12 border-2 rounded-xl font-bold" />
                  </div>
                  <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border-2 border-slate-100">
                    <p className="text-[10px] font-black uppercase text-primary flex items-center gap-2"><Globe className="h-4 w-4" /> Ubicación Geográfica</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-slate-400">Región</Label>
                        <Select modal={false} value={commData.region} onValueChange={(v) => setCommData({...commData, region: v, city: "", commune: ""})}>
                          <SelectTrigger className="h-11 border-2 rounded-xl bg-white">
                            <SelectValue placeholder="Seleccione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {CHILE_REGIONS.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-slate-400">Ciudad</Label>
                        <Select modal={false} key={`city-${commData.region}`} value={commData.city} onValueChange={(v) => setCommData({...commData, city: v})} disabled={!commData.region}>
                          <SelectTrigger className="h-11 border-2 rounded-xl bg-white">
                            <SelectValue placeholder="Ciudad" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedRegionData?.cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-slate-400">Comuna</Label>
                        <Select modal={false} key={`commune-${commData.region}`} value={commData.commune} onValueChange={(v) => setCommData({...commData, commune: v})} disabled={!commData.region}>
                          <SelectTrigger className="h-11 border-2 rounded-xl bg-white">
                            <SelectValue placeholder="Comuna" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedRegionData?.communes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-2"><Label className="text-[9px] font-black uppercase text-slate-400">Calle / Avenida</Label><Input value={commData.street} onChange={e => setCommData({...commData, street: e.target.value})} className="h-11 border-2 rounded-xl bg-white" /></div>
                      <div className="space-y-2"><Label className="text-[9px] font-black uppercase text-slate-400">N°</Label><Input value={commData.number} onChange={e => setCommData({...commData, number: e.target.value})} className="h-11 border-2 rounded-xl bg-white" /></div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button disabled={isSubmitting} className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl" onClick={handleAddCommunity}>
                    {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : "Activar Comunidad"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {isCommunitiesLoading ? (
            <div className="py-20 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-200" /></div>
          ) : linkedCommunities && linkedCommunities.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {linkedCommunities.map((comm) => (
                <Card key={comm.id} className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white group hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-100 cursor-pointer" onClick={() => setViewingCommunityId(comm.id)}>
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><Building2 className="h-6 w-6" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xl font-black text-slate-900 uppercase italic tracking-tighter truncate">{comm.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5"><MapPin className="h-2.5 w-2.5" /> {comm.city || 'S/I'}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Dirección Operativa</p>
                      <p className="text-xs font-bold text-slate-600 leading-relaxed truncate">{comm.address}</p>
                    </div>
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                      <Button variant="outline" size="sm" asChild className="flex-1 rounded-xl h-10 font-black uppercase text-[9px] gap-2 border-slate-100 bg-white hover:bg-blue-50 hover:text-blue-600">
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(comm.address)}`} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-3 w-3" /> Maps
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="flex-1 rounded-xl h-10 font-black uppercase text-[9px] gap-2 border-slate-100 bg-white hover:bg-indigo-50 hover:text-indigo-600">
                        <a href={`https://waze.com/ul?q=${encodeURIComponent(comm.address)}&navigate=yes`} target="_blank" rel="noopener noreferrer">
                          <Navigation className="h-3 w-3" /> Waze
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-32 text-center border-4 border-dashed rounded-[3rem] bg-slate-50/50 space-y-4">
              <Home className="h-16 w-16 mx-auto text-slate-200" />
              <div className="space-y-1">
                <p className="text-xl font-black italic uppercase text-slate-400">Sin comunidades activas</p>
                <p className="text-sm text-slate-400">Este administrador no tiene recintos vinculados a su gestión todavía.</p>
              </div>
              <Button onClick={() => setIsAddCommunityOpen(true)} className="rounded-xl h-11 px-8 font-black uppercase text-[10px] gap-2 mt-4 shadow-xl">Vincular mi primer edificio</Button>
            </div>
          )}
        </div>

        {/* Dialog Configuración Comercial (Reutilizado) */}
        <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-[2.5rem]">
            <DialogHeader>
              <DialogTitle className="font-black italic uppercase text-xl">Parámetros de Servicio</DialogTitle>
              <DialogDescription>Ajuste el nivel de suscripción para {selectedAdmin?.name}.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveConfig} className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Plan de Suscripción</Label>
                  <Select value={configData.currentPlan} onValueChange={(val) => setConfigData({...configData, currentPlan: val})}>
                    <SelectTrigger className="h-12 border-2 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Plan Inicio (Demo)</SelectItem>
                      <SelectItem value="business">Plan Business (1.8 UF)</SelectItem>
                      <SelectItem value="enterprise">Plan Enterprise (3.5 UF)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Estado de Operación</Label>
                  <Select value={configData.isActive ? "true" : "false"} onValueChange={(val) => setConfigData({...configData, isActive: val === "true"})}>
                    <SelectTrigger className="h-12 border-2 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Activa / Operativa</SelectItem>
                      <SelectItem value="false">Suspendida / Bloqueada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl"><Save className="h-4 w-4 mr-2" /> Actualizar Configuración</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // RENDERIZADO NIVEL 1: LISTA GLOBAL DE ADMINISTRADORES
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
              <Button className="rounded-xl font-black gap-2 shadow-lg"><Plus className="h-4 w-4" /> Nuevo Administrador</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black italic uppercase">Registrar Nuevo Gestor</DialogTitle>
                <DialogDescription>Cree el entorno para que el gestor pueda administrar sus comunidades.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateAdmin} className="space-y-6 py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre Administrador / Empresa</Label>
                    <Input placeholder="Ej: Administraciones Cordillera" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-12 border-2 rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Plan de Inicio</Label>
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
                <DialogFooter><Button type="submit" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generar Entorno SaaS"}</Button></DialogFooter>
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
