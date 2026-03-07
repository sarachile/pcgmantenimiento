
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
  Timer
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  updateDocumentNonBlocking,
  setDocumentNonBlocking
} from "@/firebase";
import { collection, doc, serverTimestamp, query, orderBy, limit, updateDoc, addDoc } from "firebase/firestore";
import { Company, User } from "@/lib/types";
import { format, parseISO, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { sendSystemEmail } from "@/actions/email";

export default function AdminCompaniesPage() {
  const { toast } = useToast();
  const { isSuperAdmin, profile, isLoading: isUserLoading } = useUser();
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

  const mailLogQuery = useMemoFirebase(() => {
    if (!db || !isSuperAdmin) return null;
    return query(collection(db, "mail"), orderBy("createdAt", "desc"), limit(10));
  }, [db, isSuperAdmin]);
  const { data: mailLogs } = useCollection(mailLogQuery);

  const filtered = (companies || []).filter((c: Company) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    setIsSubmitting(true);
    const companyId = `comp-${Math.random().toString(36).substr(2, 6)}`;
    const companyRef = doc(db, "companies", companyId);
    
    const companyData = {
      id: companyId,
      name: formData.name || "Nombre por definir",
      rut: "RUT por definir", 
      address: formData.address || "Dirección por definir",
      currentPlan: formData.currentPlan,
      subscriptionStatus: "active",
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setDocumentNonBlocking(companyRef, companyData, { merge: true });
    
    toast({
      title: "Entorno Generado",
      description: `Se ha creado el acceso para ${companyData.name}.`,
    });
    
    setIsCreateOpen(false);
    setFormData({ name: "", address: "", currentPlan: "free" });
    setIsSubmitting(false);
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

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedCompany) return;

    const companyRef = doc(db, "companies", selectedCompany.id);
    updateDocumentNonBlocking(companyRef, {
      currentPlan: configData.currentPlan,
      subscriptionStatus: configData.subscriptionStatus,
      isActive: configData.isActive,
      updatedAt: serverTimestamp(),
    });

    toast({
      title: "Cambios guardados",
      description: `Configuración actualizada para ${selectedCompany.name}.`,
    });
    setIsConfigOpen(false);
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
    if (!db || !detailsCompany || !inviteEmail || !profile) return;

    setIsSendingInvite(true);
    
    const mailCol = collection(db, "mail");
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; color: #1f2937; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1e3a8a; font-size: 28px; font-weight: 900; margin: 0; letter-spacing: -1px;">PCGMANTENIMIENTO ERP</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Solución de Gestión Industrial Avanzada</p>
        </div>
        
        <h2 style="color: #1e3a8a; font-size: 20px; margin-bottom: 16px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">Bienvenido a su Entorno Operativo</h2>
        
        <p>Estimados,</p>
        <p>Su ecosistema de gestión para <strong>${detailsCompany.name}</strong> ha sido activado y está listo para la operación de campo y administrativa.</p>
        
        <p>Para comenzar, cada miembro del equipo debe registrarse en el portal oficial:</p>
        
        <div style="margin: 32px 0; text-align: center;">
          <a href="https://www.pcgmantenimiento.com/auth/signup" style="background-color: #1e3a8a; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            Completar Registro de Usuario
          </a>
          <p style="color: #64748b; font-size: 12px; margin-top: 12px;">Acceso vía: www.pcgmantenimiento.com</p>
        </div>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
          <p style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px; text-align: center;">Código de Vinculación Corporativa</p>
          <div style="background-color: #ffffff; border: 2px dashed #1e3a8a; padding: 16px; text-align: center; border-radius: 8px; font-size: 32px; font-family: 'Courier New', monospace; font-weight: 900; color: #1e3a8a; letter-spacing: 6px;">
            ${detailsCompany.id}
          </div>
          <p style="color: #b45309; font-size: 12px; font-weight: bold; margin-top: 12px; text-align: center;">
            * Este código vincula su cuenta a la organización. Su contraseña personal es privada y la elige usted en el paso siguiente.
          </p>
        </div>
        
        <div style="font-size: 13px; color: #64748b; line-height: 1.6;">
          <p><strong>Nota de Seguridad:</strong> Este código permite el acceso a la infraestructura de datos de su empresa. Favor distribuirlo únicamente a personal autorizado.</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
        
        <p style="font-size: 11px; color: #94a3b8; font-style: italic; text-align: center;">
          Este es un message automático de la plataforma central de PCG OPERACIONES. Por favor no responda a esta casilla.
        </p>
      </div>
    `;

    try {
      const docRef = await addDoc(mailCol, {
        to: inviteEmail,
        createdAt: serverTimestamp(),
        message: {
          subject: `Acceso Corporativo PCGMANTENIMIENTO ERP - ${detailsCompany.name}`,
          html: htmlContent,
        },
        delivery: { state: 'PROCESANDO' }
      });

      setIsInviteOpen(false);
      setInviteEmail("");

      const result = await sendSystemEmail({
        to: inviteEmail,
        subject: `Acceso Corporativo PCGMANTENIMIENTO ERP - ${detailsCompany.name}`,
        html: htmlContent
      });

      const logRef = doc(db, "mail", docRef.id);
      await updateDoc(logRef, {
        delivery: {
          state: result.success ? 'SUCCESS' : 'ERROR',
          error: result.error || null,
          sentAt: serverTimestamp()
        }
      });

      toast({
        title: result.success ? "Invitación Enviada" : "Error en envío",
        description: result.success ? "El correo ha sido enviado exitosamente." : result.error,
        variant: result.success ? "default" : "destructive"
      });
      
    } catch (error: any) {
      toast({ title: "Error crítico", description: error.message, variant: "destructive" });
    } finally {
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

  const getTrialDaysRemaining = (trialEndsAt: any) => {
    if (!trialEndsAt) return null;
    const end = trialEndsAt.toDate ? trialEndsAt.toDate() : parseISO(trialEndsAt);
    const diff = differenceInDays(end, new Date());
    return diff > 0 ? diff : 0;
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
                  <Label>Nombre de la Empresa / Razón Social</Label>
                  <Input 
                    placeholder="Ej: Servicios Industriales S.A." 
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

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 border-none shadow-sm">
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
                    <TableHead>Plan / Trial</TableHead>
                    <TableHead>Código Acceso</TableHead>
                    <TableHead>Usuarios</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((company: Company) => {
                    const companyUsers = getCompanyUsers(company.id);
                    const daysRemaining = getTrialDaysRemaining(company.trialEndsAt);
                    
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
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className={cn(
                              "w-fit text-[9px] font-black uppercase",
                              company.currentPlan === 'enterprise' && "bg-purple-50 text-purple-700 border-purple-200",
                              company.currentPlan === 'business' && "bg-blue-50 text-blue-700 border-blue-200"
                            )}>
                              {company.currentPlan?.toUpperCase() || 'SIMPLE'}
                            </Badge>
                            {daysRemaining !== null && (
                              <span className={cn(
                                "text-[10px] font-bold flex items-center gap-1",
                                daysRemaining <= 5 ? "text-rose-600" : "text-slate-500"
                              )}>
                                <Timer className="h-3 w-3" /> {daysRemaining} días restantes
                              </span>
                            )}
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

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden">
            <CardHeader className="pb-2 border-b border-white/10">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <Send className="h-3 w-3 text-blue-400" />
                Monitor de Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-0">
              <div className="space-y-1">
                {mailLogs && mailLogs.length > 0 ? (
                  mailLogs.map((log: any) => (
                    <div key={log.id} className="px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-white/60 truncate max-w-[120px]">{log.to}</span>
                        <Badge className={cn(
                          "text-[8px] h-4 font-black uppercase",
                          log.delivery?.state === 'SUCCESS' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                          log.delivery?.state === 'ERROR' ? "bg-rose-500/20 text-rose-400 border-rose-500/30" :
                          "bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse"
                        )} variant="outline">
                          {log.delivery?.state || 'PROCESANDO'}
                        </Badge>
                      </div>
                      {log.delivery?.error && (
                        <p className="text-[9px] text-rose-300 leading-tight bg-rose-500/10 p-1.5 rounded mt-1 font-mono">
                          {log.delivery.error}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 text-[8px] text-white/40 mt-1">
                        <Clock className="h-2 w-2" />
                        {log.createdAt ? format(log.createdAt.toDate(), "HH:mm:ss") : '...'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-white/30 italic text-xs">
                    No hay envíos registrados aún...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-blue-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                Motor de Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  El sistema utiliza <strong>www.pcgmantenimiento.com</strong> como dominio oficial para todas las comunicaciones y registros.
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 bg-white p-2 rounded border text-[10px]">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Los correos se envían vía SMTP directo para máxima confiabilidad.</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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

      {/* Dialog Invitación por Email */}
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
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Vista Previa de Notificación:</p>
              <div className="text-[12px] text-slate-700 leading-relaxed space-y-2">
                <p>Estimados,</p>
                <p>Les damos la bienvenida a <strong>PCGMANTENIMIENTO ERP</strong>. Su entorno de gestión industrial ha sido configurado.</p>
                <p>Utilicen el siguiente <strong>Código de Acceso Maestro</strong>:</p>
                <div className="bg-white p-3 text-center rounded-lg border-2 border-primary/20 font-mono font-black text-xl text-primary tracking-widest shadow-sm">
                  {detailsCompany?.id}
                </div>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full h-12 text-sm font-bold gap-2" disabled={isSendingInvite}>
                {isSendingInvite ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Enviar Credenciales</>}
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
                    <SelectItem value="simple">Plan Simple (Freemium)</SelectItem>
                    <SelectItem value="business">Plan Business (1.8 UF)</SelectItem>
                    <SelectItem value="enterprise">Plan Enterprise (3.5 UF)</SelectItem>
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
