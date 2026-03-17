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
  Waves
} from "lucide-react";
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  useAuth,
  setDocumentNonBlocking
} from "@/firebase";
import { collection, doc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
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

export default function AdminWaterControlPage() {
  const { isSuperAdmin, isLoading: isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  const [expandedBuildingId, setExpandedBuildingId] = useState<string | null>(null);

  // Building Admin Creation State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    rut: "",
    buildingName: "",
    pin: Math.floor(100000 + Math.random() * 900000).toString(),
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
      const meters = snap.docs.map(d => ({ ...d.data(), id: d.id } as WaterMeter));
      setBuildingMeters(prev => ({ ...prev, [compId]: meters }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMeters(null);
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

      // 1. Crear Empresa (Edificio)
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

      // 2. Crear Usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, virtualEmail, formData.pin);
      const uid = userCredential.user.uid;

      // 3. Crear Perfil en Firestore
      const userRef = doc(db, "users", uid);
      await setDocumentNonBlocking(userRef, {
        id: uid,
        email: virtualEmail,
        corporateEmail: formData.email,
        name: formData.name,
        role: "buildingAdmin",
        companyId: buildingId,
        active: true,
        createdAt: serverTimestamp(),
      }, { merge: true });

      // 4. Enviar Email con PIN
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 24px; padding: 40px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #1e3a8a; font-size: 28px; font-weight: 900; margin: 0; text-transform: uppercase;">PCG AGUA <span style="color: #3b82f6;">IoT</span></h1>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Activación de Acceso Remoto</p>
          </div>
          <h2 style="color: #1e3a8a; font-size: 20px; margin-bottom: 24px;">Bienvenido al Monitor Hídrico</h2>
          <p>Estimado(a) <strong>${formData.name}</strong>,</p>
          <p>Se ha configurado su portal de administración remota para <strong>${formData.buildingName}</strong>. Desde este panel podrá monitorear consumos en tiempo real y realizar cortes de suministro ante emergencias.</p>
          <div style="background-color: #f8fafc; border: 2px dashed #3b82f6; border-radius: 20px; padding: 32px; margin: 32px 0; text-align: center;">
            <p style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 2px;">Sus Credenciales de Seguridad</p>
            <table style="width: 100%; margin-bottom: 20px;">
              <tr><td style="text-align: right; width: 40%; color: #64748b; font-size: 13px; padding-right: 10px;">RUT:</td><td style="text-align: left; font-weight: bold; color: #1e293b;">${formData.rut}</td></tr>
              <tr><td style="text-align: right; color: #64748b; font-size: 13px; padding-right: 10px;">PIN de Acceso:</td><td style="text-align: left; font-weight: 900; color: #3b82f6; font-size: 24px; letter-spacing: 4px;">${formData.pin}</td></tr>
            </table>
            <a href="https://www.pcgmantenimiento.com/water-control/login" style="background-color: #1e3a8a; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">ENTRAR AL PORTAL</a>
          </div>
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">Este PIN es personal e intransferible. PCGMANTENIMIENTO nunca le pedirá su PIN por teléfono.</p>
        </div>
      `;

      await sendSystemEmail({
        to: formData.email,
        subject: `ACCESO PCG AGUA IoT - ${formData.buildingName}`,
        html: htmlContent
      });

      toast({ title: "Administrador Creado", description: "Credenciales enviadas al correo corporativo." });
      setIsCreateOpen(false);
      setFormData({ name: "", email: "", rut: "", buildingName: "", pin: Math.floor(100000 + Math.random() * 900000).toString() });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAdmins = (buildingAdmins || []).filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <DialogHeader>
                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Alta de Admin IoT</DialogTitle>
                <DialogDescription>Se generará un entorno building-only y se enviará el PIN por email.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateBuildingAdmin} className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Nombre del Edificio / Comunidad</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Ej: Edificio Vista Hermosa" value={formData.buildingName} onChange={e => setFormData({...formData, buildingName: e.target.value})} className="h-12 pl-10 border-2 rounded-xl font-bold" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Nombre Admin</Label>
                    <Input placeholder="Juan Pérez" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-12 border-2 rounded-xl font-bold" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">RUT (ID de Acceso)</Label>
                    <Input placeholder="12.345.678-9" value={formData.rut} onChange={e => setFormData({...formData, rut: e.target.value})} className="h-12 border-2 rounded-xl font-bold" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Email Corporativo (Envío PIN)</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input type="email" placeholder="admin@comunidad.cl" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-12 pl-10 border-2 rounded-xl font-bold" required />
                  </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-2xl text-center space-y-2 border border-white/10">
                  <p className="text-[10px] font-black uppercase text-blue-400 tracking-[0.3em]">PIN de Seguridad Generado</p>
                  <p className="text-4xl font-black text-white italic tracking-widest">{formData.pin}</p>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-2xl bg-blue-600 font-black uppercase tracking-widest shadow-xl">
                    {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : "Activar y Notificar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 p-8 border-b">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input placeholder="Buscar por administrador o edificio..." className="pl-12 h-14 bg-white border-none shadow-inner rounded-2xl font-medium" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isAdminsLoading ? (
              <div className="py-20 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-200" /></div>
            ) : filteredAdmins.length === 0 ? (
              <div className="py-32 text-center space-y-4 opacity-40">
                <Droplets className="h-16 w-16 mx-auto text-slate-200" />
                <p className="font-black italic uppercase text-slate-400">Sin administradores IoT registrados</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredAdmins.map((admin) => {
                  const company = companies?.find(c => c.id === admin.companyId);
                  const meters = buildingMeters[admin.companyId] || [];
                  const isExpanded = expandedBuildingId === admin.companyId;

                  return (
                    <div key={admin.id} className="group">
                      <div 
                        className={cn(
                          "flex items-center justify-between p-8 hover:bg-slate-50/50 transition-colors cursor-pointer",
                          isExpanded && "bg-blue-50/30"
                        )}
                        onClick={() => {
                          if (isExpanded) setExpandedBuildingId(null);
                          else {
                            setExpandedBuildingId(admin.companyId);
                            fetchMeters(admin.companyId);
                          }
                        }}
                      >
                        <div className="flex items-center gap-6">
                          <div className="bg-blue-100 p-4 rounded-3xl text-blue-600 group-hover:scale-110 transition-transform">
                            <Building2 className="h-8 w-8" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">{company?.name || 'Cargando...'}</h3>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" /> {admin.name}</span>
                              <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1.5"><Zap className="h-3 w-3" /> ID: {admin.companyId}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sensores Activos</p>
                            <p className="text-2xl font-black italic text-slate-900">{meters.length || '?'}</p>
                          </div>
                          {isExpanded ? <ChevronUp className="h-6 w-6 text-slate-300" /> : <ChevronDown className="h-6 w-6 text-slate-300" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-8 bg-blue-50/20 border-t border-blue-100 animate-in slide-in-from-top-4 duration-300">
                          <div className="flex items-center justify-between mb-6">
                            <h4 className="text-sm font-black uppercase text-blue-600 tracking-[0.2em] flex items-center gap-2">
                              <Monitor className="h-4 w-4" /> Monitor de Telemetría Live
                            </h4>
                            <Badge className="bg-emerald-500 text-white font-black text-[8px] uppercase">Online</Badge>
                          </div>

                          {isLoadingMeters === admin.companyId ? (
                            <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-400" /></div>
                          ) : meters.length === 0 ? (
                            <div className="py-10 text-center border-2 border-dashed rounded-3xl text-slate-400 italic text-sm">
                              No hay medidores vinculados a esta comunidad aún.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {meters.map(m => (
                                <Card key={m.id} className="rounded-2xl border shadow-sm bg-white overflow-hidden">
                                  <div className="p-4 flex items-center justify-between border-b bg-slate-50/50">
                                    <span className="text-xs font-black uppercase tracking-tighter">{m.unitIdentifier}</span>
                                    {m.hasLeakAlert && <Badge className="bg-rose-600 text-white animate-pulse text-[7px] h-4">ALERTA FUGA</Badge>}
                                  </div>
                                  <div className="p-4 space-y-3">
                                    <div className="flex justify-between items-baseline">
                                      <span className="text-[9px] font-black text-slate-400 uppercase">Lectura</span>
                                      <div className="flex items-baseline gap-1">
                                        <span className="text-xl font-black italic">{m.currentReading.toFixed(2)}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase italic">m³</span>
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase">
                                      <span className="flex items-center gap-1"><Zap className={cn("h-3 w-3", m.status === 'open' ? "text-emerald-500" : "text-rose-500")} /> {m.status === 'open' ? 'Abierto' : 'Cerrado'}</span>
                                      <span>Batería: {m.batteryLevel}%</span>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          )}
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
    </div>
  );
}
