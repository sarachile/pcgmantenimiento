
"use client";

import { useState, useEffect } from "react";
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
  Mail,
  Shield,
  Send,
  ExternalLink,
  Globe,
  Info,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Timer,
  LogOut,
  UserCog,
  Home
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
import { Company, User, Community } from "@/lib/types";
import { format, parseISO, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { sendSystemEmail } from "@/actions/email";
import { signOut } from "firebase/auth";

export default function AdminCompaniesPage() {
  const { toast } = useToast();
  const { isSuperAdmin, profile, isLoading: isUserLoading } = useUser();
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
  const [newCommunityName, setNewCommunityName] = useState("");
  const [newCommunityAddress, setNewCommunityAddress] = useState("");

  const administratorsQuery = useMemoFirebase(() => {
    if (!db || !isSuperAdmin) return null;
    return collection(db, "companies");
  }, [db, isSuperAdmin]);

  const { data: administrators, isLoading: isAdminsLoading } = useCollection<Company>(administratorsQuery);

  // Consulta de Comunidades para el Administrador Seleccionado
  const communitiesQuery = useMemoFirebase(() => {
    if (!db || !isSuperAdmin || !detailsAdmin) return null;
    return collection(db, "companies", detailsAdmin.id, "communities");
  }, [db, isSuperAdmin, detailsAdmin]);

  const { data: linkedCommunities, isLoading: isCommunitiesLoading } = useCollection<Community>(communitiesQuery);

  const usersQuery = useMemoFirebase(() => {
    if (!db || !isSuperAdmin) return null;
    return collection(db, "users");
  }, [db, isSuperAdmin]);
  const { data: allUsers } = useCollection<User>(usersQuery);

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
    if (!db || !detailsAdmin || !newCommunityName) return;

    const communitiesCol = collection(db, "companies", detailsAdmin.id, "communities");
    await addDocumentNonBlocking(communitiesCol, {
      name: newCommunityName,
      address: newCommunityAddress || "Dirección por definir",
      isActive: true,
      createdAt: serverTimestamp()
    });

    toast({ title: "Comunidad Vinculada", description: `${newCommunityName} ahora es gestionada por ${detailsAdmin.name}.` });
    setIsAddCommunityOpen(false);
    setNewCommunityName("");
    setNewCommunityAddress("");
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

  const getAdminUsers = (adminId: string) => {
    return (allUsers || []).filter(u => u.companyId === adminId);
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
                    <TableHead>Personal Gestor</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((admin: Company) => {
                    const adminUsers = getAdminUsers(admin.id);
                    
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
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-medium">{adminUsers.length} Usuarios</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleViewDetails(admin)}
                              title="Ver Comunidades y Usuarios"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleOpenConfig(admin)}
                              title="Ajustar Parámetros"
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

      {/* Dialog Ficha de Administrador y sus Comunidades */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-[2.5rem]">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <UserCog className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">{detailsAdmin?.name}</DialogTitle>
                  <DialogDescription>Administrador ID: {detailsAdmin?.id}</DialogDescription>
                </div>
              </div>
              <Dialog open={isAddCommunityOpen} onOpenChange={setIsAddCommunityOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-3.5 w-3.5" /> Vincular Comunidad
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[400px] rounded-[2rem]">
                  <DialogHeader>
                    <DialogTitle className="font-black uppercase italic text-lg">Nueva Comunidad Vinculada</DialogTitle>
                    <DialogDescription>Registre un edificio o recinto para este administrador.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Nombre del Recinto</Label>
                      <Input placeholder="Ej: Edificio Vista Mar" value={newCommunityName} onChange={e => setNewCommunityName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Dirección</Label>
                      <Input placeholder="Calle, Número, Comuna" value={newCommunityAddress} onChange={e => setNewCommunityAddress(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button className="w-full h-12 rounded-xl font-black uppercase" onClick={handleAddCommunity}>Activar Comunidad</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </DialogHeader>
          
          <div className="space-y-8 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-muted/30 p-3 rounded-lg border">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">RUT Administrador</p>
                <p className="text-sm font-bold">{detailsAdmin?.rut || 'Pendiente'}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Plan</p>
                <Badge variant="default" className="text-[10px] h-5">{detailsAdmin?.currentPlan?.toUpperCase()}</Badge>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Estado</p>
                <p className={cn("text-sm font-bold capitalize", detailsAdmin?.isActive ? "text-emerald-600" : "text-rose-600")}>
                  {detailsAdmin?.isActive ? 'Activo' : 'Suspendido'}
                </p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Registro</p>
                <p className="text-sm font-bold">{formatDate(detailsAdmin?.createdAt)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-blue-600 border-b pb-2 flex items-center gap-2">
                <Home className="h-4 w-4" /> Comunidades Bajo Gestión ({linkedCommunities?.length || 0})
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isCommunitiesLoading ? (
                  <div className="col-span-full py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-200" /></div>
                ) : linkedCommunities && linkedCommunities.length > 0 ? (
                  linkedCommunities.map((comm) => (
                    <Card key={comm.id} className="border-2 border-slate-100 shadow-none rounded-2xl overflow-hidden hover:border-blue-200 transition-colors">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-blue-50 p-3 rounded-xl"><Building2 className="h-5 w-5 text-blue-600" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-900 uppercase truncate">{comm.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold truncate">{comm.address}</p>
                        </div>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[8px] font-black uppercase">Live</Badge>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center border-2 border-dashed rounded-3xl bg-slate-50/50">
                    <p className="text-slate-400 italic text-sm">Este administrador no tiene comunidades vinculadas aún.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 border-b pb-2 flex items-center gap-2">
                <Users className="h-4 w-4" /> Personal Administrativo ({getAdminUsers(detailsAdmin?.id || '').length})
              </h3>
              
              <div className="border rounded-xl overflow-hidden bg-card">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="text-[10px] uppercase font-bold">Nombre / Email</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-center">Rol</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-right">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getAdminUsers(detailsAdmin?.id || '').length > 0 ? (
                      getAdminUsers(detailsAdmin?.id || '').map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">{user.name}</span>
                              <span className="text-[10px] text-muted-foreground">{user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-[9px] font-bold uppercase bg-slate-100 px-2 py-1 rounded">{user.role}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={user.active ? "default" : "secondary"} className="text-[9px]">
                              {user.active ? "ACTIVO" : "INACTIVO"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic text-sm">
                          Sin usuarios registrados en este tenant.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="w-full h-12 rounded-xl font-bold" onClick={() => setIsDetailsOpen(false)}>Cerrar Ficha</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Suscripción */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="font-black italic uppercase text-xl">Parámetros Comerciales</DialogTitle>
            <DialogDescription>
              Ajuste el nivel de servicio para {selectedAdmin?.name}.
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
