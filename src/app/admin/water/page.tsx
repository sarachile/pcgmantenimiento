
"use client";

import { useState, useMemo, useEffect } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Droplets, 
  Plus, 
  Search, 
  Mail, 
  KeyRound, 
  Smartphone, 
  Building2, 
  Loader2, 
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  History,
  Send,
  Zap,
  Globe,
  Monitor,
  ShieldCheck,
  UserPlus,
  ArrowRight,
  LogOut,
  ChevronDown,
  ChevronUp,
  Waves,
  MoreVertical,
  Edit,
  Trash2,
  RefreshCcw,
  UserCog,
  Battery,
  Power,
  PowerOff,
  Lock
} from "lucide-react";
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  useAuth,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking
} from "@/firebase";
import { collection, doc, serverTimestamp, query, where, getDocs, updateDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { User, Company, WaterMeter } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { sendSystemEmail } from "@/actions/email";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cleanRut } from "@/lib/utils-rut";
import { useToast } from "@/hooks/use-toast";

// DATOS SIMULADOS PARA PRESENTACIÓN
const MOCK_METERS: WaterMeter[] = [
  { id: "sim-1", companyId: "mock", clientId: "mock", unitIdentifier: "Depto 101", status: "open", currentReading: 42.55, batteryLevel: 92, signalStrength: 88, hasLeakAlert: false, lastCommunication: new Date().toISOString() },
  { id: "sim-2", companyId: "mock", clientId: "mock", unitIdentifier: "Depto 102", status: "open", currentReading: 15.30, batteryLevel: 85, signalStrength: 72, hasLeakAlert: true, lastCommunication: new Date().toISOString() },
  { id: "sim-3", companyId: "mock", clientId: "mock", unitIdentifier: "Depto 201", status: "open", currentReading: 122.10, batteryLevel: 98, signalStrength: 95, hasLeakAlert: false, lastCommunication: new Date().toISOString() },
  { id: "sim-4", companyId: "mock", clientId: "mock", unitIdentifier: "Depto 202", status: "closed", currentReading: 88.45, batteryLevel: 78, signalStrength: 65, hasLeakAlert: false, lastCommunication: new Date().toISOString() },
  { id: "sim-5", companyId: "mock", clientId: "mock", unitIdentifier: "Depto 301", status: "open", currentReading: 210.00, batteryLevel: 90, signalStrength: 82, hasLeakAlert: false, lastCommunication: new Date().toISOString() },
  { id: "sim-6", companyId: "mock", clientId: "mock", unitIdentifier: "Depto 302", status: "open", currentReading: 5.12, batteryLevel: 100, signalStrength: 99, hasLeakAlert: false, lastCommunication: new Date().toISOString() },
];

export default function AdminWaterControlPage() {
  const { isSuperAdmin, isLoading: isUserLoading, profile } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  const [expandedBuildingId, setExpandedBuildingId] = useState<string | null>(null);

  // Management States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);
  const [editingBuilding, setEditingBuilding] = useState<Company | null>(null);

  // PIN Dialog for valve toggle
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pendingMeter, setPendingMeter] = useState<WaterMeter | null>(null);
  const [isProcessingValve, setIsProcessingValve] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    rut: "",
    buildingName: "",
    pin: Math.floor(100000 + Math.random() * 900000).toString(),
  });

  const [editData, setEditData] = useState({
    name: "",
    buildingName: ""
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirigir si no es superadmin
  useEffect(() => {
    if (!isUserLoading && !isSuperAdmin) {
      redirect("/dashboard");
    }
  }, [isUserLoading, isSuperAdmin]);

  const handleLogout = async () => {
    await signOut(auth);
    redirect("/auth/login");
  };

  // Consultas Globales
  const adminsQuery = useMemoFirebase(() => {
    if (!db || !isSuperAdmin) return null;
    return query(collection(db, "users"), where("role", "==", "buildingAdmin"));
  }, [db, isSuperAdmin]);

  const companiesQuery = useMemoFirebase(() => {
    if (!db || !isSuperAdmin) return null;
    return collection(db, "companies");
  }, [db, isSuperAdmin]);

  const { data: buildingAdmins, isLoading: isAdminsLoading } = useCollection<User>(adminsQuery);
  const { data: companies } = useCollection<Company>(companiesQuery);

  // Meter Monitor State
  const [buildingMeters, setBuildingMeters] = useState<Record<string, WaterMeter[]>>({});
  const [isLoadingMeters, setIsLoadingMeters] = useState<string | null>(null);

  const fetchMeters = async (compId: string) => {
    if (!db || isLoadingMeters === compId) return;
    setIsLoadingMeters(compId);
    try {
      const q = collection(db, "companies", compId, "waterMeters");
      const snap = await getDocs(q);
      let meters = snap.docs.map(d => ({ ...d.data(), id: d.id } as WaterMeter));
      
      // FALLBACK PARA PRESENTACIÓN: Si no hay medidores reales, inyectar simulados
      if (meters.length === 0) {
        meters = MOCK_METERS.map(m => ({ ...m, companyId: compId }));
      }
      
      setBuildingMeters(prev => ({ ...prev, [compId]: meters }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMeters(null);
    }
  };

  // VALVE TOGGLE LOGIC
  const handleToggleValveRequest = (meter: WaterMeter) => {
    setPendingMeter(meter);
    setPinInput("");
    setIsPinDialogOpen(true);
  };

  const handleConfirmPin = async () => {
    if (!pendingMeter || !profile) return;
    // Master PIN para Superadmin
    const isCorrect = pinInput === "123456";

    if (isCorrect) {
      setIsPinDialogOpen(false);
      executeToggleValve(pendingMeter);
    } else {
      toast({
        title: "PIN Incorrecto",
        description: "Acceso denegado al comando maestro.",
        variant: "destructive"
      });
      setPinInput("");
    }
  };

  const executeToggleValve = async (meter: WaterMeter) => {
    setIsProcessingValve(meter.id);
    const newStatus = meter.status === 'open' ? 'closed' : 'open';

    try {
      if (db && !meter.id.startsWith('sim-')) {
        const meterRef = doc(db, "companies", meter.companyId, "waterMeters", meter.id);
        updateDocumentNonBlocking(meterRef, { status: newStatus, updatedAt: serverTimestamp() });
      } else {
        // Simulation update
        setBuildingMeters(prev => {
          const compMeters = prev[meter.companyId] || [];
          return {
            ...prev,
            [meter.companyId]: compMeters.map(m => m.id === meter.id ? { ...m, status: newStatus } : m)
          };
        });
      }

      toast({
        title: newStatus === 'open' ? "Válvula Abierta" : "Válvula Cerrada",
        description: `Comando maestro enviado con éxito.`,
        variant: newStatus === 'open' ? 'default' : 'destructive'
      });
    } catch (e) {
      toast({ title: "Error al enviar comando", variant: "destructive" });
    } finally {
      setTimeout(() => setIsProcessingValve(null), 1000);
    }
  };

  const handleCreateBuildingAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !auth) return;

    setIsSubmitting(true);
    try {
      const cleanRutStr = cleanRut(formData.rut);
      const virtualEmail = `${cleanRutStr}@building.pcg`;
      const buildingId = `bld-${Math.random().toString(36).substr(2, 6)}`;

      const companyRef = doc(db, "companies", buildingId);
      await setDocumentNonBlocking(companyRef, {
        id: buildingId,
        name: formData.buildingName,
        rut: formData.rut,
        address: "Ubicación por definir",
        currentPlan: "business",
        subscriptionStatus: "active",
        isActive: true,
        createdAt: serverTimestamp(),
      }, { merge: true });

      const userCredential = await createUserWithEmailAndPassword(auth, virtualEmail, formData.pin);
      const uid = userCredential.user.uid;

      const userRef = doc(db, "users", uid);
      await setDocumentNonBlocking(userRef, {
        id: uid,
        email: virtualEmail,
        corporateEmail: formData.email,
        name: formData.name,
        role: "buildingAdmin",
        companyId: buildingId,
        pin: formData.pin,
        active: true,
        createdAt: serverTimestamp(),
      }, { merge: true });

      toast({ title: "Administrador Creado" });
      setIsCreateOpen(false);
      setFormData({ name: "", email: "", rut: "", buildingName: "", pin: Math.floor(100000 + Math.random() * 900000).toString() });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBuilding = (admin: User, company: Company) => {
    setSelectedAdmin(admin);
    setEditingBuilding(company);
    setEditData({ name: admin.name, buildingName: company.name });
    setIsEditOpen(true);
  };

  const handleUpdateBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedAdmin || !editingBuilding) return;
    setIsSubmitting(true);
    try {
      updateDocumentNonBlocking(doc(db, "companies", editingBuilding.id), { name: editData.buildingName, updatedAt: serverTimestamp() });
      updateDocumentNonBlocking(doc(db, "users", selectedAdmin.id), { name: editData.name, updatedAt: serverTimestamp() });
      toast({ title: "Datos Actualizados" });
      setIsEditOpen(false);
    } catch (e: any) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBuilding = async () => {
    if (!db || !selectedAdmin || !editingBuilding) return;
    setIsSubmitting(true);
    try {
      updateDocumentNonBlocking(doc(db, "companies", editingBuilding.id), { isActive: false, isDeleted: true, updatedAt: serverTimestamp() });
      updateDocumentNonBlocking(doc(db, "users", selectedAdmin.id), { active: false, updatedAt: serverTimestamp() });
      toast({ title: "Comunidad Eliminada" });
      setIsDeleteOpen(false);
    } catch (e: any) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAdmins = (buildingAdmins || []).filter(a => {
    const company = companies?.find(c => c.id === a.companyId);
    return (
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (isUserLoading || !mounted) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6 md:p-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/admin"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h2 className="text-4xl font-black italic tracking-tighter text-slate-900 uppercase">Gestión Agua IoT</h2>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Control de Administradores y Telemetría Hídrica</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleLogout} variant="ghost" className="text-rose-600 hover:bg-rose-50 font-black uppercase text-[10px] h-12 px-6">
            <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 px-8 rounded-xl shadow-xl shadow-blue-900/20 font-black gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-5 w-5" /> Nuevo Admin Edificio
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem]">
              <DialogHeader><DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Alta de Admin IoT</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateBuildingAdmin} className="space-y-6 py-4">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Nombre Edificio</Label><Input value={formData.buildingName} onChange={e => setFormData({...formData, buildingName: e.target.value})} className="h-12 rounded-xl font-bold" required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Admin</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-12 rounded-xl font-bold" required /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">RUT</Label><Input value={formData.rut} onChange={e => setFormData({...formData, rut: e.target.value})} className="h-12 rounded-xl font-bold" required /></div>
                </div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Email Corporativo</Label><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-12 rounded-xl font-bold" required /></div>
                <div className="bg-slate-900 p-6 rounded-2xl text-center space-y-2"><p className="text-[10px] font-black uppercase text-blue-400 tracking-[0.3em]">PIN Generado</p><p className="text-4xl font-black text-white italic">{formData.pin}</p></div>
                <DialogFooter><Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-2xl bg-blue-600 font-black uppercase shadow-xl">Activar y Notificar</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 p-8 border-b">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input placeholder="Buscar por administrador o edificio..." className="pl-12 h-14 bg-white border-none shadow-inner rounded-2xl font-medium" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isAdminsLoading ? (
              <div className="py-20 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-200" /></div>
            ) : (
              <div className="divide-y">
                {filteredAdmins.map((admin) => {
                  const company = companies?.find(c => c.id === admin.companyId);
                  if (company?.isDeleted) return null;
                  const meters = buildingMeters[admin.companyId] || [];
                  const isExpanded = expandedBuildingId === admin.companyId;

                  return (
                    <div key={admin.id} className="group">
                      <div className={cn("flex items-center justify-between p-8 hover:bg-slate-50/50 transition-colors cursor-pointer", isExpanded && "bg-blue-50/30")} onClick={() => { if (isExpanded) setExpandedBuildingId(null); else { setExpandedBuildingId(admin.companyId); fetchMeters(admin.companyId); }}}>
                        <div className="flex items-center gap-6"><div className={cn("p-4 rounded-3xl transition-transform group-hover:scale-110", isExpanded ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600")}><Building2 className="h-8 w-8" /></div><div><h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">{company?.name || 'Cargando...'}</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{admin.name} • {admin.companyId}</p></div></div>
                        <div className="flex items-center gap-8"><div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sensores</p><p className="text-2xl font-black italic text-slate-900">{meters.length || '?'}</p></div>{isExpanded ? <ChevronUp className="h-6 w-6 text-blue-600" /> : <ChevronDown className="h-6 w-6 text-slate-300" />}</div>
                      </div>

                      {isExpanded && (
                        <div className="p-8 bg-blue-50/20 border-t border-blue-100 animate-in slide-in-from-top-4 duration-300">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {meters.map(m => (
                              <Card key={m.id} className={cn("rounded-2xl border-2 shadow-sm bg-white overflow-hidden transition-all", m.hasLeakAlert ? "border-rose-200" : "border-slate-100")}>
                                <div className={cn("p-4 flex items-center justify-between border-b", m.hasLeakAlert ? "bg-rose-50" : "bg-slate-50/50")}>
                                  <span className="text-xs font-black uppercase tracking-tighter">{m.unitIdentifier}</span>
                                  <div className="flex gap-1">
                                    <Button size="icon" className={cn("h-6 w-6 rounded-lg", m.status === 'open' ? "bg-slate-900" : "bg-blue-600")} onClick={() => handleToggleValveRequest(m)} disabled={isProcessingValve === m.id}>
                                      {isProcessingValve === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : (m.status === 'open' ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />)}
                                    </Button>
                                  </div>
                                </div>
                                <div className="p-4 flex justify-between items-baseline"><span className="text-[9px] font-black text-slate-400 uppercase">Lectura m³</span><span className="text-xl font-black italic">{m.currentReading.toFixed(2)}</span></div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* DIÁLOGO DE SEGURIDAD (PIN CHALLENGE) */}
      <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] p-8 text-center">
          <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><Lock className="h-10 w-10 text-slate-900" /></div>
          <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Mando Maestro</DialogTitle>
          <DialogDescription className="font-bold text-slate-500 mb-6">Confirme el corte/apertura de <strong>{pendingMeter?.unitIdentifier}</strong>. Ingrese PIN maestro.</DialogDescription>
          <Input type="password" placeholder="******" className="h-16 text-center text-3xl font-black tracking-[0.5em] rounded-2xl border-2 mb-6" value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))} />
          <Button className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase shadow-xl" onClick={handleConfirmPin} disabled={pinInput.length < 6}>Confirmar Operación</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
