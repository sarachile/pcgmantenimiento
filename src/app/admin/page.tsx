
"use client";

import { useMemo, useEffect, useState, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Building2, 
  Users, 
  ArrowLeft,
  Loader2,
  ChevronRight,
  Globe,
  Activity,
  Zap,
  ShieldCheck,
  LayoutDashboard,
  LogOut,
  Droplets,
  Waves,
  ArrowUpRight,
  Server,
  KeyRound,
  Wifi,
  Database,
  LayoutGrid,
  List,
  MoreHorizontal,
  UserCog,
  Home,
  Plus,
  FileSearch,
  School,
  Sprout,
  Timer,
  AlertTriangle,
  CheckCircle2,
  Mail,
  Smartphone,
  History
} from "lucide-react";
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  useAuth,
  setDocumentNonBlocking,
  updateDocumentNonBlocking
} from "@/firebase";
import { collection, query, orderBy, doc, limit } from "firebase/firestore";
import { useRouter } from "next/navigation";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Company, User, Community } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Componente auxiliar optimizado para obtener el conteo de comunidades de un administrador
const CommunityCount = memo(function CommunityCount({ adminId }: { adminId: string }) {
  const db = useFirestore();
  
  const communitiesQuery = useMemoFirebase(() => {
    if (!db || !adminId) return null;
    return collection(db, "companies", adminId, "communities");
  }, [db, adminId]);

  const { data: communities, isLoading } = useCollection<Community>(communitiesQuery);

  // Simulación para Juan Fernández
  if (adminId === 'adm-juan-f') return <span className="font-black text-slate-900">2</span>;

  if (isLoading) return <Loader2 className="h-3 w-3 animate-spin text-slate-300" />;
  
  return (
    <span className="font-black text-slate-900">{communities?.length || 0}</span>
  );
});

export default function SuperadminDashboardPage() {
  const { isSuperAdmin, isLoading: isAuthLoading, isAuthenticated, profile } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAudit, setSelectedAudit] = useState<any | null>(null);

  // Creation State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    currentPlan: "simple" as any,
  });

  useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || !isSuperAdmin)) {
      router.push("/auth/login");
    }
  }, [isAuthLoading, isSuperAdmin, isAuthenticated, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/auth/login");
  };

  const administratorsQuery = useMemoFirebase(() => {
    if (!db || !isSuperAdmin) return null;
    return query(collection(db, "companies"), orderBy("createdAt", "desc"));
  }, [db, isSuperAdmin]);

  const auditsQuery = useMemoFirebase(() => {
    if (!db || !isSuperAdmin) return null;
    return query(collection(db, "auditSubmissions"), orderBy("createdAt", "desc"), limit(10));
  }, [db, isSuperAdmin]);

  const { data: rawAdministrators, isLoading: isAdminsLoading } = useCollection<Company>(administratorsQuery);
  const { data: auditSubmissions, isLoading: isAuditsLoading } = useCollection<any>(auditsQuery);

  // Inyectar a Juan Fernández en la lista si no existe
  const administrators = useMemo(() => {
    const list = rawAdministrators || [];
    const juanExists = list.some(a => a.id === 'adm-juan-f');
    
    if (!juanExists) {
      return [
        {
          id: 'adm-juan-f',
          name: 'Juan Fernández',
          currentPlan: 'enterprise' as any,
          isActive: true,
          createdAt: new Date('2024-01-15').toISOString(),
          address: 'Viña del Mar, Chile',
          subscriptionStatus: 'active' as any
        },
        ...list
      ];
    }
    return list;
  }, [rawAdministrators]);

  const stats = useMemo(() => {
    const totalAdmins = administrators?.length || 0;
    const activeAdmins = (administrators || []).filter(c => c.isActive).length;
    const newAudits = (auditSubmissions || []).filter(a => a.status === 'pending_review').length;
    return { totalAdmins, activeAdmins, newAudits };
  }, [administrators, auditSubmissions]);

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
      address: "Dirección por definir",
      currentPlan: formData.currentPlan,
      subscriptionStatus: "active",
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setDocumentNonBlocking(adminRef, adminData, { merge: true });
    
    toast({
      title: "Administrador Creado",
      description: `Se ha generado el acceso para ${adminData.name}.`,
    });
    
    setIsCreateOpen(false);
    setFormData({ name: "", currentPlan: "simple" });
    setIsSubmitting(false);
  };

  const updateAuditStatus = (auditId: string, newStatus: string) => {
    if (!db) return;
    const auditRef = doc(db, "auditSubmissions", auditId);
    updateDocumentNonBlocking(auditRef, { status: newStatus });
    toast({ title: "Estado Actualizado", description: `La auditoría ahora está en estado: ${newStatus}` });
  };

  if (isAuthLoading || !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Accediendo a Control Maestro...</p>
        </div>
      </div>
    );
  }

  const platformStats = [
    { label: "Administradores SaaS", value: stats.totalAdmins, icon: UserCog, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Nuevas Auditorías", value: stats.newAudits, icon: FileSearch, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Nivel de Servicio", value: "SLA 99.9%", icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Estado Infra", value: "Online", icon: Globe, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  const handleAdminClick = (adminId: string) => {
    router.push(`/admin/companies?id=${adminId}`);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-12">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-xl shadow-lg"><Globe className="text-white h-6 w-6" /></div>
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 italic uppercase">Control Maestro</h2>
          </div>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest pl-1">Gestión de Ecosistema SaaS GENKO</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleLogout} variant="ghost" className="rounded-2xl font-black uppercase text-[10px] h-12 px-6 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
            <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
          </Button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {platformStats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm rounded-[2rem] overflow-hidden group hover:shadow-md transition-all bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</CardTitle>
              <div className={cn("p-2.5 rounded-2xl transition-transform group-hover:rotate-12", stat.bg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SECCIÓN 1: LEVANTAMIENTOS TÉCNICOS (LEADS) - NUEVO */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="space-y-1">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 flex items-center gap-3">
              <FileSearch className="h-6 w-6 text-amber-600" /> Levantamientos de Nuevos Clientes
            </h3>
            <p className="text-[10px] font-bold uppercase text-slate-400">Prospectos que han realizado el autodiagnóstico institucional</p>
          </div>
          <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[10px] px-3 py-1 uppercase">{stats.newAudits} PENDIENTES</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isAuditsLoading ? (
            <div className="col-span-full py-10 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-amber-200" /></div>
          ) : auditSubmissions && auditSubmissions.length > 0 ? (
            auditSubmissions.map((audit: any) => (
              <Sheet key={audit.id}>
                <SheetTrigger asChild>
                  <Card className="rounded-[2rem] border-none shadow-sm hover:shadow-xl transition-all bg-white overflow-hidden group cursor-pointer border-l-8 border-l-amber-500">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="bg-slate-100 p-3 rounded-2xl text-slate-900 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                          {audit.entityType === 'colegio' ? <School className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
                        </div>
                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest">{audit.status.replace('_', ' ')}</Badge>
                      </div>
                      <div>
                        <p className="text-lg font-black text-slate-900 uppercase italic tracking-tight line-clamp-1">{audit.entityName}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{audit.contactName}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
                          <span>Principal Interés:</span>
                          <span className="text-blue-600">{audit.mainPainPoint.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
                          <span>Riego:</span>
                          <span className="text-slate-900">{audit.irrigationAreaM2} m²</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-dashed">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{audit.createdAt ? format(audit.createdAt.toDate ? audit.createdAt.toDate() : new Date(audit.createdAt), "dd MMM yyyy", { locale: es }) : '...'}</span>
                        <div className="flex items-center text-amber-600 font-black text-[9px] uppercase tracking-widest gap-1 group-hover:translate-x-1 transition-transform">Ver Levantamiento <ChevronRight className="h-3 w-3" /></div>
                      </div>
                    </CardContent>
                  </Card>
                </SheetTrigger>
                <SheetContent className="sm:max-w-[600px] overflow-y-auto bg-slate-50 p-0 border-none">
                  <SheetHeader className="p-8 bg-slate-900 text-white">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-amber-600 p-2 rounded-lg"><FileSearch className="h-6 w-6 text-white" /></div>
                      <Badge className="bg-white/10 text-white border-white/20 uppercase font-black text-[9px]">Expediente Técnico del Prospecto</Badge>
                    </div>
                    <SheetTitle className="text-3xl font-black italic uppercase text-white tracking-tighter">{audit.entityName}</SheetTitle>
                    <SheetDescription className="text-slate-400 font-medium">Levantamiento recibido el {audit.createdAt ? format(audit.createdAt.toDate ? audit.createdAt.toDate() : new Date(audit.createdAt), "dd/MM/yyyy HH:mm") : '...'}</SheetDescription>
                  </SheetHeader>

                  <div className="p-8 space-y-8">
                    {/* ACCIONES DE ESTADO */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border space-y-4">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Settings className="h-3.5 w-3.5" /> Gestión del Lead</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="rounded-xl h-12 font-black uppercase text-[10px] border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100" onClick={() => updateAuditStatus(audit.id, 'reviewed')}>Marcar como Revisado</Button>
                        <Button variant="outline" className="rounded-xl h-12 font-black uppercase text-[10px] border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100" onClick={() => updateAuditStatus(audit.id, 'proposal_sent')}>Propuesta Enviada</Button>
                      </div>
                    </div>

                    {/* CONTACTO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-5 rounded-2xl shadow-sm space-y-3">
                        <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Smartphone className="h-3.5 w-3.5" /> Contacto</p>
                        <div>
                          <p className="font-black text-slate-900">{audit.contactName}</p>
                          <p className="text-xs font-bold text-blue-600">{audit.contactEmail}</p>
                          <p className="text-xs font-bold text-slate-500">{audit.contactPhone}</p>
                        </div>
                      </div>
                      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg space-y-3">
                        <p className="text-[10px] font-black uppercase text-blue-400 flex items-center gap-2"><Zap className="h-3.5 w-3.5" /> Prioridad 1</p>
                        <p className="text-xl font-black italic uppercase tracking-tighter">{audit.mainPainPoint.replace('_', ' ')}</p>
                      </div>
                    </div>

                    {/* INFRAESTRUCTURA */}
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Building2 className="h-4 w-4" /> Diagnóstico de Instalaciones</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white p-4 rounded-xl border text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase">Pabellones</p>
                          <p className="text-xl font-black">{audit.buildingsCount || '0'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase">Sanitarios</p>
                          <p className="text-xl font-black">{audit.toiletsCount || '0'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase">Duchas</p>
                          <p className="text-xl font-black">{audit.showersCount || '0'}</p>
                        </div>
                      </div>
                      <div className={cn("p-4 rounded-2xl border-2 flex items-center justify-between", audit.detectedLeaks === 'si' ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100")}>
                        <div className="flex items-center gap-3">
                          <AlertTriangle className={cn("h-5 w-5", audit.detectedLeaks === 'si' ? "text-rose-600" : "text-emerald-600")} />
                          <p className="text-xs font-black uppercase">{audit.detectedLeaks === 'si' ? 'Existen fugas detectadas' : 'Red estable / Sin fugas'}</p>
                        </div>
                      </div>
                      {audit.leaksDescription && (
                        <div className="bg-slate-100 p-4 rounded-xl italic text-xs text-slate-600">"{audit.leaksDescription}"</div>
                      )}
                    </div>

                    {/* RIEGO TÉCNICO */}
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Sprout className="h-4 w-4" /> Gestión de Riego y Áreas Verdes</p>
                      <Card className="rounded-2xl border-none shadow-sm overflow-hidden bg-white">
                        <CardContent className="p-0">
                          <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase text-slate-400">Superficie Total</p>
                              <p className="text-2xl font-black italic">{audit.irrigationAreaM2} <span className="text-sm opacity-40">m²</span></p>
                            </div>
                            <Badge className="bg-blue-600 text-white font-black uppercase text-[8px] px-3">{audit.irrigationType}</Badge>
                          </div>
                          <div className="p-6 grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400"><Timer className="h-3.5 w-3.5" /> Ventana de Riego</div>
                              <p className="text-sm font-bold text-slate-700">De {audit.irrigationStartTime} a {audit.irrigationEndTime}</p>
                            </div>
                            <div className="space-y-3 border-l pl-6">
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400"><CheckCircle2 className="h-3.5 w-3.5" /> Frecuencia</div>
                              <p className="text-sm font-bold text-slate-700">{audit.irrigationDaysPerWeek} Días/Semana</p>
                            </div>
                            <div className="col-span-2 pt-3 border-t">
                              <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Circuitos Detectados: <span className="text-slate-900">{audit.irrigationCircuitsCount || '?'}</span></p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* CONSUMO Y FACTURACIÓN */}
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Indicadores de Consumo</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Consumo Estimado</p>
                          <p className="text-xl font-black italic">{audit.avgMonthlyConsumptionM3} <span className="text-xs">m³/mes</span></p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Gasto Último Mes</p>
                          <p className="text-xl font-black italic text-emerald-600">$ {Number(audit.lastMonthlyBillCLP).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-10 text-center opacity-30">
                      <p className="text-[8px] font-black uppercase tracking-[0.5em]">Expediente Técnico GENKO Hídrica</p>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            ))
          ) : (
            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-[3rem] bg-slate-50/50">
              <FileSearch className="h-10 w-10 text-slate-200 mx-auto mb-4" />
              <p className="text-sm font-black uppercase text-slate-400">No hay levantamientos recientes.</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Cartera de Administradores</h3>
            <p className="text-[10px] font-bold uppercase text-slate-400">Control de gestión y comunidades asociadas</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl h-10 px-4 font-black uppercase text-[10px] gap-2 shadow-lg shadow-blue-900/10">
                  <Plus className="h-4 w-4" /> Nuevo Administrador
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px] rounded-[2.5rem]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black italic uppercase italic tracking-tighter">Registrar Nuevo Gestor</DialogTitle>
                  <DialogDescription>Cree el entorno para que el gestor pueda administrar sus comunidades.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateAdmin} className="space-y-6 py-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre del Administrador / Empresa</Label>
                      <Input 
                        placeholder="Ej: Administraciones Cordillera" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="h-12 rounded-xl border-2 font-bold"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Plan de Inicio</Label>
                      <Select 
                        value={formData.currentPlan} 
                        onValueChange={(val) => setFormData({...formData, currentPlan: val})}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">Plan Inicio (Demo)</SelectItem>
                          <SelectItem value="business">Plan Business (1.8 UF)</SelectItem>
                          <SelectItem value="enterprise">Plan Enterprise (3.5 UF)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="submit" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Generar Entorno SaaS"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border ml-2">
              <Button 
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                size="sm" 
                className={cn("h-9 px-3 rounded-lg font-black uppercase text-[9px] gap-2", viewMode === 'grid' && "bg-white shadow-sm")}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Tarjetas
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                size="sm" 
                className={cn("h-9 px-3 rounded-lg font-black uppercase text-[9px] gap-2", viewMode === 'list' && "bg-white shadow-sm")}
                onClick={() => setViewMode('list')}
              >
                <List className="h-3.5 w-3.5" /> Listado
              </Button>
            </div>
          </div>
        </div>

        {isAdminsLoading ? (
          <div className="py-20 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-600/20" /></div>
        ) : administrators && administrators.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {administrators.map((admin) => (
                <Card key={admin.id} className="rounded-[2.5rem] border-none shadow-sm hover:shadow-xl transition-all bg-white overflow-hidden group cursor-pointer" onClick={() => handleAdminClick(admin.id)}>
                  <CardHeader className="p-8 pb-4">
                    <div className="flex justify-between items-start">
                      <div className={cn(
                        "p-4 rounded-3xl transition-transform group-hover:scale-110",
                        admin.isActive ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"
                      )}>
                        <UserCog className="h-8 w-8" />
                      </div>
                      <Badge variant="outline" className={cn(
                        "text-[9px] font-black uppercase border-none px-3 py-1",
                        admin.currentPlan === 'enterprise' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                      )}>
                        Plan {admin.currentPlan}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 pt-0 space-y-6">
                    <div>
                      <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter truncate">Admin: {admin.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {admin.id}</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Home className="h-3.5 w-3.5 text-blue-600" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comunidades</span>
                      </div>
                      <div className="text-sm">
                        <CommunityCount adminId={admin.id} />
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full", admin.isActive ? "bg-emerald-500" : "bg-rose-500")} />
                        <span className="text-[10px] font-black uppercase text-slate-500">{admin.isActive ? 'Operativo' : 'Suspendido'}</span>
                      </div>
                      <div className="rounded-xl h-10 w-10 flex items-center justify-center">
                        <ArrowUpRight className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardContent className="p-0">
                <div className="divide-y">
                  {administrators.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => handleAdminClick(admin.id)}>
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-50 p-3 rounded-2xl group-hover:bg-blue-100 transition-colors">
                          <UserCog className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 uppercase">Administrador: {admin.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">ID: {admin.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Comunidades</p>
                            <div className="text-xs">
                              <CommunityCount adminId={admin.id} />
                            </div>
                          </div>
                          <Badge variant="outline" className={cn(
                            "text-[9px] font-black uppercase",
                            admin.currentPlan === 'enterprise' ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"
                          )}>
                            {admin.currentPlan}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          <div className="py-20 text-center text-slate-400 italic text-sm">No hay administradores registrados aún.</div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="rounded-[3rem] border-none shadow-xl bg-slate-900 text-white overflow-hidden group hover:shadow-2xl transition-all">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-5 h-full">
              <div className="md:col-span-2 bg-slate-800 p-8 flex flex-col justify-center items-center text-center space-y-4">
                <div className="bg-white/10 p-4 rounded-3xl"><UserCog className="h-10 w-10 text-white" /></div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Gestión de Administradores</h3>
              </div>
              <div className="md:col-span-3 p-8 flex flex-col justify-center space-y-4">
                <p className="text-sm text-slate-400 font-medium">Control total de Administradores, gestión de sus comunidades asignadas y monitoreo de suscripciones.</p>
                <Button asChild className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 font-black uppercase tracking-widest text-[10px] gap-2">
                  <Link href="/admin/companies">Configurar Clientes SaaS <ArrowUpRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[3rem] border-none shadow-xl bg-blue-600 text-white overflow-hidden group hover:shadow-2xl transition-all">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-5 h-full">
              <div className="md:col-span-2 bg-blue-700 p-8 flex flex-col justify-center items-center text-center space-y-4">
                <div className="bg-white/20 p-4 rounded-3xl"><Droplets className="h-10 w-10 text-white" /></div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Gestión Agua IoT</h3>
              </div>
              <div className="md:col-span-3 p-8 flex flex-col justify-center space-y-4">
                <p className="text-sm text-blue-100 font-medium">Monitoreo granular de telemetría por comunidad y control de medidores inteligentes.</p>
                <Button asChild className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 font-black uppercase tracking-widest text-[10px] gap-2">
                  <Link href="/admin/water">Monitor Hídrico Maestro <ArrowUpRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

