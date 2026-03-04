
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
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc, serverTimestamp, setDoc, addDoc } from "firebase/firestore";
import { Company, User } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export default function AdminCompaniesPage() {
  const { toast } = useToast();
  const { isSuperAdmin, isLoading: isUserLoading } = useUser();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  
  // Create Company State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    currentPlan: "free" as any,
  });

  // Config Subscription State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [configData, setConfigData] = useState({
    currentPlan: "free" as any,
    subscriptionStatus: "active" as any,
    isActive: true
  });

  // Details / Users State
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsCompany, setDetailsCompany] = useState<Company | null>(null);

  // Invite State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const companiesQuery = useMemoFirebase(() => {
    if (!db || !isSuperAdmin) return null;
    return collection(db, "companies");
  }, [db, isSuperAdmin]);

  const { data: companies, isLoading: isCompaniesLoading } = useCollection<Company>(companiesQuery);

  const usersQuery = useMemoFirebase(() => {
    if (!db || !isSuperAdmin) return null;
    return collection(db, "users");
  }, [db, isSuperAdmin]);
  const { data: allUsers } = useCollection<User>(usersQuery);

  const filtered = (companies || []).filter((c: Company) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    setIsSubmitting(true);
    try {
      const companyId = `comp-${Math.random().toString(36).substr(2, 6)}`;
      
      await setDoc(doc(db, "companies", companyId), {
        id: companyId,
        name: formData.name,
        rut: "", 
        address: formData.address || "Dirección por definir",
        currentPlan: formData.currentPlan,
        subscriptionStatus: "active",
        isActive: true,
        createdAt: new Date().toISOString(),
      });

      toast({
        title: "Empresa Registrada",
        description: `Código de acceso: ${companyId}. Entréguelo al cliente.`,
      });
      
      setIsCreateOpen(false);
      setFormData({ name: "", address: "", currentPlan: "free" });
    } catch (error: any) {
      toast({
        title: "Error al crear",
        description: error.message || "No se pudo registrar la empresa.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenConfig = (company: Company) => {
    setSelectedCompany(company);
    setConfigData({
      currentPlan: company.currentPlan || "free",
      subscriptionStatus: company.subscriptionStatus || "active",
      isActive: company.isActive ?? true
    });
    setIsConfigOpen(true);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedCompany) return;

    try {
      const companyRef = doc(db, "companies", selectedCompany.id);
      updateDocumentNonBlocking(companyRef, {
        currentPlan: configData.currentPlan,
        subscriptionStatus: configData.subscriptionStatus,
        isActive: configData.isActive,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Parámetros Actualizados",
        description: `Configuración guardada para ${selectedCompany.name}.`,
      });
      setIsConfigOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios.",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (company: Company) => {
    setDetailsCompany(company);
    setIsDetailsOpen(true);
  };

  const handleOpenInvite = (company: Company) => {
    setDetailsCompany(company);
    setIsInviteOpen(true);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !detailsCompany || !inviteEmail) return;

    setIsSendingInvite(true);
    try {
      // Escribir en la colección 'mail' para activar el Trigger Email Extension
      const mailCol = collection(db, "mail");
      await addDoc(mailCol, {
        to: inviteEmail,
        message: {
          subject: `Bienvenido a PCGMANTENIMIENTO ERP - Acceso Maestro ${detailsCompany.name}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; color: #1f2937;">
              <h2 style="color: #1e3a8a; font-size: 24px; margin-bottom: 16px;">¡Bienvenido a PCGMANTENIMIENTO ERP!</h2>
              <p>Estimados,</p>
              <p>Su entorno de gestión industrial para <strong>${detailsCompany.name}</strong> ha sido configurado y se encuentra listo para operar.</p>
              <p>Para comenzar, cada miembro del equipo debe registrarse en nuestra plataforma oficial:</p>
              <div style="margin: 24px 0;">
                <a href="https://www.pcgmantenimiento.com" style="background-color: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Ir a www.pcgmantenimiento.com
                </a>
              </div>
              <p>Durante el registro, se le solicitará el siguiente <strong>Código de Acceso Maestro</strong>:</p>
              <div style="background-color: #f3f4f6; border: 2px dashed #1e3a8a; padding: 16px; text-align: center; border-radius: 8px; font-size: 28px; font-family: monospace; font-weight: bold; color: #1e3a8a; letter-spacing: 4px;">
                ${detailsCompany.id}
              </div>
              <p style="color: #b45309; font-size: 13px; font-weight: bold; margin-top: 16px;">
                * Importante: Este código es solo para vincular su cuenta a la organización. Su contraseña personal la define usted en el paso siguiente.
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
              <p style="font-size: 12px; color: #6b7280; font-style: italic;">
                Este es un mensaje automático del sistema de control maestro de PCG OPERACIONES. Por favor no responda a este correo.
              </p>
            </div>
          `,
        },
      });

      toast({
        title: "Invitación Procesada",
        description: `El correo de bienvenida se ha enviado a ${inviteEmail}.`,
      });
      setIsSendingInvite(false);
      setIsInviteOpen(false);
      setInviteEmail("");
    } catch (error: any) {
      toast({
        title: "Error de Envío",
        description: error.message || "No se pudo registrar la solicitud de correo.",
        variant: "destructive",
      });
      setIsSendingInvite(false);
    }
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

  const getCompanyUsers = (compId: string) => {
    return (allUsers || []).filter(u => u.companyId === compId);
  };

  if (isUserLoading) {
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
            <h2 className="text-3xl font-bold tracking-tight">Gestión de Empresas</h2>
            <p className="text-muted-foreground">Control central de tenants, usuarios y planes activos.</p>
          </div>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nueva Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Cliente (Tenant)</DialogTitle>
              <DialogDescription>Cree el entorno para que el cliente pueda registrar sus usuarios operativos.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCompany} className="space-y-4 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre de la Empresa / Razón Social *</Label>
                  <Input 
                    placeholder="Ej: Servicios Industriales S.A." 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dirección Inicial (Opcional)</Label>
                  <Input 
                    placeholder="Calle, Ciudad..." 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
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
                      <SelectItem value="free">Plan Inicio (Demo)</SelectItem>
                      <SelectItem value="pro">Plan Pro (1.5 UF)</SelectItem>
                      <SelectItem value="enterprise">Plan Enterprise (2.5 UF)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generar Entorno y Código Maestro"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nombre o código..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isCompaniesLoading ? (
            <div className="py-10 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Cargando tenantes...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa / Inicio</TableHead>
                  <TableHead>Código Acceso</TableHead>
                  <TableHead>Plan / Estado</TableHead>
                  <TableHead>Usuarios</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((company: Company) => {
                  const companyUsers = getCompanyUsers(company.id);
                  return (
                    <TableRow key={company.id} className="group">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{company.name}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {formatDate(company.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded text-xs font-mono font-bold text-primary">
                            {company.id}
                          </code>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" 
                            onClick={() => {
                              navigator.clipboard.writeText(company.id);
                              toast({ title: "Copiado", description: "Código de acceso copiado." });
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className={cn(
                            "w-fit text-[9px] font-black uppercase",
                            company.currentPlan === 'enterprise' && "bg-purple-50 text-purple-700 border-purple-200",
                            company.currentPlan === 'pro' && "bg-blue-50 text-blue-700 border-blue-200"
                          )}>
                            {company.currentPlan?.toUpperCase() || 'FREE'}
                          </Badge>
                          <span className={cn(
                            "text-[10px] font-bold",
                            !company.isActive ? "text-rose-600" : "text-emerald-600"
                          )}>
                            {company.isActive ? 'OPERATIVA' : 'SUSPENDIDA'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-medium">{companyUsers.length}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleViewDetails(company)}
                            title="Ver Ficha y Usuarios"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleOpenConfig(company)}
                            title="Ajustar Suscripción"
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

      {/* Dialog Ficha de Empresa y Usuarios */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black">{detailsCompany?.name}</DialogTitle>
                  <DialogDescription>ID de Entorno: {detailsCompany?.id}</DialogDescription>
                </div>
              </div>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => handleOpenInvite(detailsCompany!)}>
                <Send className="h-3.5 w-3.5" /> Invitar por Email
              </Button>
            </div>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-muted/30 p-3 rounded-lg border">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">RUT Empresa</p>
                <p className="text-sm font-bold">{detailsCompany?.rut || 'Pendiente'}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Plan Activo</p>
                <Badge variant="default" className="text-[10px] h-5">{detailsCompany?.currentPlan?.toUpperCase()}</Badge>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Estado Operativo</p>
                <p className={cn("text-sm font-bold capitalize", detailsCompany?.isActive ? "text-emerald-600" : "text-rose-600")}>
                  {detailsCompany?.isActive ? 'Activo' : 'Suspendido'}
                </p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Fecha Registro</p>
                <p className="text-sm font-bold">{formatDate(detailsCompany?.createdAt)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2 flex items-center gap-2">
                <Users className="h-4 w-4" /> Usuarios Vinculados ({getCompanyUsers(detailsCompany?.id || '').length})
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
                    {getCompanyUsers(detailsCompany?.id || '').length > 0 ? (
                      getCompanyUsers(detailsCompany?.id || '').map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">{user.name}</span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Mail className="h-2 w-2" /> {user.email}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              <Shield className={cn("h-3 w-3", user.role === 'companyAdmin' ? "text-primary" : "text-muted-foreground")} />
                              <span className="text-[9px] font-bold uppercase">{user.role}</span>
                            </div>
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
                          No hay usuarios registrados aún en esta empresa.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="w-full" onClick={() => setIsDetailsOpen(false)}>Cerrar Ficha</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Invitación por Email Profesional */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Notificación de Credenciales
            </DialogTitle>
            <DialogDescription>
              Envíe el código maestro de activación para <strong>{detailsCompany?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendInvite} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Correo Electrónico de Contacto</Label>
              <Input 
                id="invite-email" 
                type="email" 
                placeholder="gerencia@cliente.cl" 
                required 
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="bg-slate-50 p-5 rounded-xl space-y-3 border border-slate-200">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Vista Previa de Notificación SaaS:</p>
              <div className="text-[12px] text-slate-700 leading-relaxed space-y-2">
                <p>Estimados,</p>
                <p>Les damos la bienvenida a <strong>PCGMANTENIMIENTO ERP</strong>. Su entorno de gestión industrial ha sido configurado y se encuentra listo para operar.</p>
                <p>Para comenzar, cada miembro del equipo debe registrarse en nuestra plataforma oficial:</p>
                <div className="py-1">
                  <Link href="https://www.pcgmantenimiento.com" className="text-primary font-bold hover:underline flex items-center gap-1">
                    www.pcgmantenimiento.com <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                <p>Utilicen el siguiente <strong>Código de Acceso Maestro</strong> en el campo correspondiente del formulario de registro corporativo:</p>
                <div className="bg-white p-3 text-center rounded-lg border-2 border-primary/20 font-mono font-black text-xl text-primary tracking-widest shadow-sm">
                  {detailsCompany?.id}
                </div>
                <p className="text-[10px] text-amber-600 font-bold mt-2">
                  * Importante: Este código es solo para vincular su cuenta a la empresa. Su contraseña personal la define usted en el paso siguiente.
                </p>
                <p className="text-[10px] text-slate-500 italic mt-4">
                  * Este código permite la vinculación segura de usuarios a su organización. Por seguridad, no lo comparta fuera de su equipo técnico.
                </p>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full h-12 text-sm font-bold gap-2" disabled={isSendingInvite}>
                {isSendingInvite ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Enviar Credenciales Corporativas</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Suscripción */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Parámetros Comerciales</DialogTitle>
            <DialogDescription>
              Ajuste el nivel de servicio para {selectedCompany?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveConfig} className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Plan de Suscripción</Label>
                <Select 
                  value={configData.currentPlan} 
                  onValueChange={(val) => setConfigData({...configData, currentPlan: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Plan Inicio (Demo)</SelectItem>
                    <SelectItem value="pro">Plan Pro (1.5 UF)</SelectItem>
                    <SelectItem value="enterprise">Plan Enterprise (2.5 UF)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado de Operación</Label>
                <Select 
                  value={configData.isActive ? "true" : "false"} 
                  onValueChange={(val) => setConfigData({...configData, isActive: val === "true"})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activa / Operativa</SelectItem>
                    <SelectItem value="false">Suspendida / Bloqueada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado de Facturación</Label>
                <Select 
                  value={configData.subscriptionStatus} 
                  onValueChange={(val) => setConfigData({...configData, subscriptionStatus: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Pagos al Día</SelectItem>
                    <SelectItem value="past_due">Pendiente de Pago</SelectItem>
                    <SelectItem value="canceled">Suscripción Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full">
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
