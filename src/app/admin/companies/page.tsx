
"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
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
  Zap
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
import { collection, doc, serverTimestamp, query, orderBy, limit, updateDoc, addDoc } from "firebase/firestore";
import { Company, Community } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { signOut } from "firebase/auth";
import { CHILE_REGIONS } from "@/lib/chile-data";

function AdminCompaniesContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSuperAdmin, isLoading: isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  const [viewingAdminId, setViewingAdminId] = useState<string | null>(null);
  
  // State para creación/edición
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", address: "", currentPlan: "simple" as any });
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configData, setConfigData] = useState({ currentPlan: "simple" as any, subscriptionStatus: "active" as any, isActive: true });

  // Community Form State
  const [isAddCommunityOpen, setIsAddCommunityOpen] = useState(false);
  const [commData, setCommData] = useState({ name: "", region: "", city: "", commune: "", street: "", number: "", complement: "" });

  useEffect(() => {
    setMounted(true);
    const adminId = searchParams.get('id');
    if (adminId) setViewingAdminId(adminId);
  }, [searchParams]);

  // FORCE UNLOCK BODY: Garantiza que la UI no quede bloqueada tras cerrar modales
  useEffect(() => {
    if (!isAddCommunityOpen && !isConfigOpen && !isCreateOpen) {
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = 'auto';
        document.body.style.overflow = 'auto';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isAddCommunityOpen, isConfigOpen, isCreateOpen]);

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

  const administratorsQuery = useMemoFirebase(() => {
    if (!db || !isSuperAdmin) return null;
    return query(collection(db, "companies"), orderBy("createdAt", "desc"));
  }, [db, isSuperAdmin]);

  const { data: administrators, isLoading: isAdminsLoading } = useCollection<Company>(administratorsQuery);

  const selectedAdmin = useMemo(() => {
    if (!viewingAdminId || !administrators) return null;
    return administrators.find(a => a.id === viewingAdminId) || null;
  }, [viewingAdminId, administrators]);

  // Consulta de Comunidades para el Administrador Seleccionado
  const communitiesQuery = useMemoFirebase(() => {
    if (!db || !isSuperAdmin || !viewingAdminId) return null;
    return query(collection(db, "companies", viewingAdminId, "communities"), orderBy("createdAt", "desc"));
  }, [db, isSuperAdmin, viewingAdminId]);

  const { data: linkedCommunities, isLoading: isCommunitiesLoading } = useCollection<Community>(communitiesQuery);

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
        street: commData.street,
        number: commData.number,
        complement: commData.complement,
        isActive: true,
        createdAt: serverTimestamp()
      });
      toast({ title: "Comunidad Vinculada", description: `${commData.name} activada para ${selectedAdmin.name}.` });
      setIsAddCommunityOpen(false);
      setCommData({ name: "", region: "", city: "", commune: "", street: "", number: "", complement: "" });
    } catch (e) {
      toast({ title: "Error", description: "No se pudo vincular la comunidad.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
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

  // RENDERIZADO DE VISTA ENFOCADA (DETAIL VIEW)
  if (viewingAdminId && selectedAdmin) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 hover:bg-slate-100" onClick={() => { setViewingAdminId(null); router.push('/admin/companies'); }}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h2 className="text-4xl font-black tracking-tighter text-slate-900 italic uppercase">Ficha del Administrador</h2>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Control de gestión y comunidades asociadas</p>
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
                  <DialogDescription>Asigne un edificio o recinto para que este administrador pueda gestionarlo.</DialogDescription>
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
                        <Select value={commData.region} onValueChange={(v) => setCommData({...commData, region: v, city: "", commune: ""})}>
                          <SelectTrigger className="h-11 border-2 rounded-xl bg-white">
                            <SelectValue placeholder="Región" />
                          </SelectTrigger>
                          <SelectContent>
                            {CHILE_REGIONS.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-slate-400">Ciudad</Label>
                        <Select key={`city-select-${commData.region}`} value={commData.city} onValueChange={(v) => setCommData({...commData, city: v})} disabled={!commData.region}>
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
                        <Select key={`commune-select-${commData.region}`} value={commData.commune} onValueChange={(v) => setCommData({...commData, commune: v})} disabled={!commData.region}>
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
                <Card key={comm.id} className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white group hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-100">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><Building2 className="h-6 w-6" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xl font-black text-slate-900 uppercase italic tracking-tighter truncate">{comm.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5"><MapPin className="h-2.5 w-2.5" /> {comm.city}, {comm.region}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Dirección Operativa</p>
                      <p className="text-xs font-bold text-slate-600 leading-relaxed">{comm.address}</p>
                    </div>
                    <div className="flex gap-2">
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

  // RENDERIZADO DE LISTA GLOBAL
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
