
"use client";

import { useState, useEffect, useMemo } from "react";
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
  Navigation
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { redirect } from "next/navigation";
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

export default function AdminCompaniesPage() {
  const { toast } = useToast();
  const { isSuperAdmin, isLoading: isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  
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

  // Administradores State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    currentPlan: "simple" as any,
  });

  // Config Subscription State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Company | null>(null);
  const [configData, setConfigData] = useState({
    currentPlan: "simple" as any,
    subscriptionStatus: "active" as any,
    isActive: true
  });

  // Details / Communities State
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsAdmin, setDetailsAdmin] = useState<Company | null>(null);
  const [isAddCommunityOpen, setIsAddCommunityOpen] = useState(false);
  
  // Community Form State
  const [commData, setCommData] = useState({
    name: "",
    region: "",
    city: "",
    commune: "",
    street: "",
    number: "",
    complement: ""
  });

  const selectedRegion = useMemo(() => CHILE_REGIONS.find(r => r.name === commData.region), [commData.region]);

  const administratorsQuery = useMemoFirebase(() => {
    if (!db || !isSuperAdmin) return null;
    return query(collection(db, "companies"), orderBy("createdAt", "desc"));
  }, [db, isSuperAdmin]);

  const { data: administrators, isLoading: isAdminsLoading } = useCollection<Company>(administratorsQuery);

  // Consulta de Comunidades para el Administrador Seleccionado
  const communitiesQuery = useMemoFirebase(() => {
    if (!db || !isSuperAdmin || !detailsAdmin) return null;
    return query(collection(db, "companies", detailsAdmin.id, "communities"), orderBy("createdAt", "desc"));
  }, [db, isSuperAdmin, detailsAdmin]);

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
    
    toast({
      title: "Administrador Creado",
      description: `Se ha generado el acceso para ${adminData.name}.`,
    });
    
    setIsCreateOpen(false);
    setFormData({ name: "", address: "", currentPlan: "simple" });
    setIsSubmitting(false);
  };

  const handleAddCommunity = async () => {
    if (!db || !detailsAdmin || !commData.name) return;

    const fullAddress = `${commData.street} ${commData.number}${commData.complement ? ', ' + commData.complement : ''}, ${commData.commune}, ${commData.city}, ${commData.region}`;

    const communitiesCol = collection(db, "companies", detailsAdmin.id, "communities");
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

    toast({ title: "Comunidad Vinculada", description: `${commData.name} ahora es gestionada por ${detailsAdmin.name}.` });
    setIsAddCommunityOpen(false);
    setCommData({ name: "", region: "", city: "", commune: "", street: "", number: "", complement: "" });
  };

  const handleOpenConfig = (admin: Company) => {
    setSelectedAdmin(admin);
    setConfigData({
      currentPlan: admin.currentPlan || "simple",
      subscriptionStatus: admin.subscriptionStatus || "active",
      isActive: admin.isActive ?? true
    });
    setIsConfigOpen(true);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedAdmin) return;

    const adminRef = doc(db, "companies", selectedAdmin.id);
    updateDocumentNonBlocking(adminRef, {
      currentPlan: configData.currentPlan,
      subscriptionStatus: configData.subscriptionStatus,
      isActive: configData.isActive,
      updatedAt: serverTimestamp(),
    });

    toast({
      title: "Cambios guardados",
      description: `Configuración actualizada para ${selectedAdmin.name}.`,
    });
    setIsConfigOpen(false);
  };

  const handleViewDetails = (admin: Company) => {
    setDetailsAdmin(admin);
    setIsDetailsOpen(true);
  };

  const formatDate = (date: any) => {
    if (!mounted || !date) return '...';
    try {
      const d = date?.toDate ? date.toDate() : (typeof date === 'string' ? parseISO(date) : date);
      return format(d, "dd MMM yyyy", { locale: es });
    } catch (e) {
      return 'N/A';
    }
  };

  if (isUserLoading || !isSuperAdmin) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild title="Volver al Panel Maestro">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gestión de Administradores</h2>
            <p className="text-muted-foreground">Control central de gestores SaaS y sus comunidades vinculadas.</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleLogout} variant="ghost" className="text-rose-600 hover:bg-rose-50 font-bold uppercase text-[10px]">
            <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nuevo Administrador
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Registrar Administrador (Tenant)</DialogTitle>
                <DialogDescription>Cree el entorno para que el gestor pueda administrar sus comunidades.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateAdmin} className="space-y-4 py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nombre del Administrador / Empresa</Label>
                    <Input 
                      placeholder="Ej: Administraciones Cordillera" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Plan de Inicio</Label>
                    <Select 
                      value={formData.currentPlan} 
                      onValueChange={(val) => setFormData({...formData, currentPlan: val})}
                    >
                      <SelectTrigger>
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
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generar Entorno Administrador"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre o ID de administrador..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {isAdminsLoading ? (
              <div className="py-10 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Cargando administradores...
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Administrador / Registro</TableHead>
                    <TableHead>Plan de Servicio</TableHead>
                    <TableHead>Código Acceso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((admin: Company) => {
                    return (
                      <TableRow key={admin.id} className="group">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{admin.name}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {formatDate(admin.createdAt)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(
                            "w-fit text-[9px] font-black uppercase",
                            admin.currentPlan === 'enterprise' && "bg-purple-50 text-purple-700 border-purple-200",
                            admin.currentPlan === 'business' && "bg-blue-50 text-blue-700 border-blue-200"
                          )}>
                            {admin.currentPlan?.toUpperCase() || 'SIMPLE'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="bg-muted px-2 py-1 rounded text-xs font-mono font-bold text-primary">
                              {admin.id}
                            </code>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" 
                              onClick={() => {
                                navigator.clipboard.writeText(admin.id);
                                toast({ title: "Copiado", description: "Código de administrador copiado." });
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleViewDetails(admin)}
                              title="Ver Comunidades Asociadas"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleOpenConfig(admin)}
                              title="Ajustar Parámetros Comerciales"
                            >
                              <Settings2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog FICHA DE COMUNIDADES POR ADMINISTRADOR */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-[2.5rem] border-none shadow-2xl">
          <DialogHeader className="bg-slate-900 text-white p-8 -m-6 mb-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="bg-white/10 p-3 rounded-2xl">
                  <UserCog className="h-8 w-8 text-blue-400" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">{detailsAdmin?.name}</DialogTitle>
                  <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                    ID Administrador: {detailsAdmin?.id}
                  </DialogDescription>
                </div>
              </div>
              
              <Dialog open={isAddCommunityOpen} onOpenChange={setIsAddCommunityOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-500 font-black uppercase text-[10px] gap-2 rounded-xl h-10 px-4">
                    <Plus className="h-4 w-4" /> Vincular Comunidad
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-black uppercase italic text-lg">Nueva Comunidad Vinculada</DialogTitle>
                    <DialogDescription>Registre un edificio o recinto para este administrador.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Nombre del Recinto *</Label>
                      <Input placeholder="Ej: Edificio Vista Mar" value={commData.name} onChange={e => setCommData({...commData, name: e.target.value})} className="h-12 border-2 rounded-xl font-bold" />
                    </div>

                    <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border-2 border-slate-100">
                      <p className="text-[10px] font-black uppercase text-primary flex items-center gap-2">
                        <Globe className="h-4 w-4" /> Ubicación Geográfica
                      </p>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-slate-400">Región *</Label>
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
                          <Label className="text-[9px] font-black uppercase text-slate-400">Ciudad *</Label>
                          <Select key={`city-${commData.region}`} value={commData.city} onValueChange={(v) => setCommData({...commData, city: v})} disabled={!commData.region}>
                            <SelectTrigger className="h-11 border-2 rounded-xl bg-white">
                              <SelectValue placeholder="Ciudad" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedRegion?.cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-slate-400">Comuna *</Label>
                          <Select key={`commune-${commData.region}`} value={commData.commune} onValueChange={(v) => setCommData({...commData, commune: v})} disabled={!commData.region}>
                            <SelectTrigger className="h-11 border-2 rounded-xl bg-white">
                              <SelectValue placeholder="Comuna" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedRegion?.communes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-2">
                          <Label className="text-[9px] font-black uppercase text-slate-400">Calle / Avenida *</Label>
                          <Input placeholder="Ej: Av. Providencia" value={commData.street} onChange={e => setCommData({...commData, street: e.target.value})} className="h-11 border-2 rounded-xl bg-white" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-slate-400">N° *</Label>
                          <Input placeholder="1234" value={commData.number} onChange={e => setCommData({...commData, number: e.target.value})} className="h-11 border-2 rounded-xl bg-white" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-slate-400">Depto / Of / Casa (Opcional)</Label>
                        <Input placeholder="Ej: Depto 502" value={commData.complement} onChange={e => setCommData({...commData, complement: e.target.value})} className="h-11 border-2 rounded-xl bg-white" />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl" onClick={handleAddCommunity}>Activar Comunidad</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </DialogHeader>
          
          <div className="space-y-8 py-2 px-2">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-600 border-b pb-2 flex items-center gap-2">
                <Home className="h-4 w-4" /> Comunidades Asociadas ({linkedCommunities?.length || 0})
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                {isCommunitiesLoading ? (
                  <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-200" /></div>
                ) : linkedCommunities && linkedCommunities.length > 0 ? (
                  linkedCommunities.map((comm) => (
                    <Card key={comm.id} className="border-2 border-slate-100 shadow-none rounded-[1.5rem] overflow-hidden hover:border-blue-200 transition-colors group">
                      <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="bg-blue-50 p-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                            <Building2 className="h-6 w-6 text-blue-600 group-hover:text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-base font-black text-slate-900 uppercase italic tracking-tighter truncate">{comm.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              <p className="text-[10px] text-slate-400 font-bold truncate">{comm.address}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          <Button variant="outline" size="sm" asChild className="rounded-xl border-blue-200 text-blue-700 font-black text-[9px] uppercase gap-2 h-9 px-3">
                            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(comm.address)}`} target="_blank" rel="noopener noreferrer">
                              <Globe className="h-3.5 w-3.5" /> Maps
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" asChild className="rounded-xl border-blue-400 text-blue-600 bg-blue-50 hover:bg-blue-100 font-black text-[9px] uppercase gap-2 h-9 px-3">
                            <a href={`https://waze.com/ul?q=${encodeURIComponent(comm.address)}&navigate=yes`} target="_blank" rel="noopener noreferrer">
                              <Navigation className="h-3.5 w-3.5 fill-blue-600" /> Waze
                            </a>
                          </Button>
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[8px] font-black uppercase h-9 px-3">Operativo</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="py-24 text-center border-2 border-dashed rounded-[2rem] bg-slate-50/50">
                    <Home className="h-12 w-12 mx-auto mb-4 text-slate-200" />
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Este administrador no tiene comunidades asociadas aún.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter className="pt-6">
            <Button variant="ghost" className="w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400" onClick={() => setIsDetailsOpen(false)}>
              Cerrar Ficha de Administrador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Configuración Comercial */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-black italic uppercase text-xl">Parámetros de Servicio</DialogTitle>
            <DialogDescription>
              Ajuste el nivel de suscripción para {selectedAdmin?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveConfig} className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Plan de Suscripción</Label>
                <Select 
                  value={configData.currentPlan} 
                  onValueChange={(val) => setConfigData({...configData, currentPlan: val})}
                >
                  <SelectTrigger className="h-12 border-2 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Plan Inicio (Demo)</SelectItem>
                    <SelectItem value="business">Plan Business (1.8 UF)</SelectItem>
                    <SelectItem value="enterprise">Plan Enterprise (3.5 UF)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Estado de Operación</Label>
                <Select 
                  value={configData.isActive ? "true" : "false"} 
                  onValueChange={(val) => setConfigData({...configData, isActive: val === "true"})}
                >
                  <SelectTrigger className="h-12 border-2 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activa / Operativa</SelectItem>
                    <SelectItem value="false">Suspendida / Bloqueada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full h-12 rounded-xl font-black uppercase shadow-xl">
                <Save className="h-4 w-4 mr-2" />
                Actualizar Configuración
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
