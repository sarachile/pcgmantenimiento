
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
  Search, 
  Plus, 
  Mail, 
  MapPin, 
  Loader2, 
  ArrowLeft,
  Edit,
  Trash2,
  Building2,
  Lock,
  Copy,
  Send,
  Zap,
  Smartphone,
  ExternalLink,
  Info,
  Clock,
  History,
  MousePointer2,
  ShieldCheck,
  User
} from "lucide-react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Client, Company } from "@/lib/types";
import { sendSystemEmail } from "@/actions/email";
import { usePlanLimits } from "@/hooks/use-plan-limits";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function ClientsPage() {
  const { profile, isLoading: isAuthLoading } = useUser();
  const { maxClients, canAddClient, planName } = usePlanLimits();
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isSendingLink, setIsSendingLink] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    rut: "",
    address: "",
    contactName: "",
    contactEmail: ""
  });

  const companyRef = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return doc(db, "companies", profile.companyId);
  }, [db, profile?.companyId]);

  const { data: company } = useDoc<Company>(companyRef);

  const clientsQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return collection(db, "companies", profile.companyId, "clients");
  }, [db, profile?.companyId]);

  const { data: clientsData, isLoading: isClientsLoading } = useCollection<Client>(clientsQuery);

  const clients = clientsData || [];

  const isAtLimit = !canAddClient && !editingClient;

  const filtered = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.rut.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !profile?.companyId) return;

    if (isAtLimit) {
      toast({
        title: "Límite alcanzado",
        description: `Tu ${planName} permite hasta ${maxClients} clientes. Mejora tu plan para añadir más.`,
        variant: "destructive"
      });
      setIsCreateOpen(false);
      return;
    }

    const dataToSave = {
      ...formData,
      name: formData.name || "Nombre por definir",
      rut: formData.rut || "RUT por definir",
      address: formData.address || "Dirección por definir",
      companyId: profile.companyId,
      evaluationEnabled: true,
      createdAt: new Date().toISOString()
    };

    if (editingClient) {
      const clientRef = doc(db, "companies", profile.companyId, "clients", editingClient.id);
      updateDocumentNonBlocking(clientRef, {
        ...dataToSave,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Cliente actualizado" });
    } else {
      const colRef = collection(db, "companies", profile.companyId, "clients");
      addDocumentNonBlocking(colRef, dataToSave);
      toast({ title: "Cliente registrado" });
    }

    setFormData({ name: "", rut: "", address: "", contactName: "", contactEmail: "" });
    setIsCreateOpen(false);
    setEditingClient(null);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      rut: client.rut,
      address: client.address,
      contactName: client.contactName || "",
      contactEmail: client.contactEmail || ""
    });
    setIsCreateOpen(true);
  };

  const handleDelete = (client: Client) => {
    if (!db || !profile?.companyId) return;
    const clientRef = doc(db, "companies", profile.companyId, "clients", client.id);
    deleteDocumentNonBlocking(clientRef);
    toast({ title: "Cliente eliminado" });
  };

  const getPortalUrl = (client: Client) => {
    if (typeof window === "undefined" || !profile?.companyId) return "";
    return `${window.location.origin}/request/${client.id}?c=${profile.companyId}`;
  };

  const handleCopyLink = (client: Client) => {
    const url = getPortalUrl(client);
    navigator.clipboard.writeText(url);
    toast({ title: "Link Copiado" });
  };

  const handleSendPortalEmail = async (client: Client) => {
    if (!client.contactEmail) {
      toast({ title: "Sin Email", description: "El cliente no tiene un correo de contacto.", variant: "destructive" });
      return;
    }

    setIsSendingLink(client.id);
    const url = getPortalUrl(client);

    try {
      const result = await sendSystemEmail({
        to: client.contactEmail,
        subject: `PORTAL DE AUTOGESTIÓN - ${company?.name || 'PCGMANTENIMIENTO'}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff; color: #1e293b;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #1e3a8a; font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: -1px;">${company?.name || 'PCGMANTENIMIENTO'}</h1>
              <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Servicios Industriales Avanzados</p>
            </div>
            
            <h2 style="color: #1e3a8a; font-size: 20px; margin-bottom: 24px; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; font-weight: 800;">Portal de Autogestión de Requerimientos</h2>
            
            <p style="font-size: 15px; line-height: 1.6;">Estimados <strong>${client.name}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.6;">Para agilizar la atención de sus requerimientos técnicos y garantizar la trazabilidad total de sus activos, hemos habilitado su <strong>Portal de Autogestión Exclusivo</strong>.</p>
            
            <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; margin: 32px 0; border: 1px solid #e2e8f0;">
              <p style="margin-top: 0; font-weight: bold; color: #1e3a8a;">¿Qué puede hacer desde su portal?</p>
              <ul style="padding-left: 20px; margin-bottom: 0; font-size: 14px; color: #475569; line-height: 1.8;">
                <li>Solicitar servicios de emergencia o mantención 24/7.</li>
                <li>Recibir notificaciones de asignación de técnicos en tiempo real.</li>
                <li>Visualizar el histórico de intervenciones y reportes PDF.</li>
                <li>Firmar digitalmente la recepción conforme de sus trabajos.</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${url}" style="background-color: #1e3a8a; color: #ffffff; padding: 20px 40px; text-decoration: none; border-radius: 14px; font-weight: 900; font-size: 16px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(30, 58, 138, 0.2);">
                ACCEDER AL PORTAL TÉCNICO
              </a>
              <p style="color: #94a3b8; font-size: 11px; margin-top: 16px;">* Le recomendamos guardar este link en sus marcadores o favoritos.</p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
            <p style="font-size: 11px; color: #94a3b8; font-style: italic; text-align: center;">Este es un servicio automatizado de gestión industrial vía PCGMANTENIMIENTO ERP.</p>
          </div>
        `
      });

      if (result.success) {
        // Actualizar fecha de envío en Firestore
        const clientRef = doc(db!, "companies", profile!.companyId, "clients", client.id);
        updateDocumentNonBlocking(clientRef, { portalLastSentAt: serverTimestamp() });
        toast({ title: "Portal Enviado", description: "El cliente ha sido notificado." });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Fallo en envío", description: e.message, variant: "destructive" });
    } finally {
      setIsSendingLink(null);
    }
  };

  const formatDateLabel = (date: any) => {
    if (!mounted || !date) return "Nunca";
    try {
      const d = date.toDate ? date.toDate() : (typeof date === 'string' ? parseISO(date) : date);
      return format(d, "dd MMM, HH:mm", { locale: es });
    } catch (e) { return "Error fecha"; }
  };

  if (isAuthLoading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full h-12 w-12"><Link href="/dashboard"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <h2 className="text-4xl font-black tracking-tighter italic uppercase text-slate-900">Cartera de Clientes</h2>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Administración de Mandantes y Portales Externos</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isAtLimit && (
            <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200 gap-1 px-3 py-1.5 font-black uppercase text-[10px]">
              <Lock className="h-3 w-3" /> Plan Completo
            </Badge>
          )}
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            if (open && isAtLimit) {
              toast({ title: "Upgrade Requerido", description: `Has alcanzado el máximo de ${maxClients} clientes de tu plan.` });
              return;
            }
            setIsCreateOpen(open);
            if (!open) { setEditingClient(null); setFormData({ name: "", rut: "", address: "", contactName: "", contactEmail: "" }); }
          }}>
            <DialogTrigger asChild>
              <Button disabled={isAtLimit} className="rounded-xl h-12 px-6 font-black shadow-xl shadow-primary/20 gap-2">
                <Plus className="h-5 w-5" /> Nuevo Mandante
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem]">
              <DialogHeader><DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">{editingClient ? "Editar Cliente" : "Registrar Mandante"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400">RUT Empresa</Label>
                    <Input placeholder="76.000.000-0" value={formData.rut} onChange={(e) => setFormData({...formData, rut: e.target.value})} className="h-12 border-2 rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Razón Social</Label>
                    <Input placeholder="Nombre Empresa" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-12 border-2 rounded-xl font-bold" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Dirección Operativa</Label>
                  <Input placeholder="Calle, Número, Ciudad" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="h-12 border-2 rounded-xl font-medium" />
                </div>
                <div className="border-t pt-6 mt-2 space-y-4">
                  <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-2"><Smartphone className="h-4 w-4" /> Responsable Portal Autogestión</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black text-slate-400 uppercase">Nombre Responsable</Label>
                      <Input placeholder="Nombre Apellido" value={formData.contactName} onChange={(e) => setFormData({...formData, contactName: e.target.value})} className="h-12 border-2 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black text-slate-400 uppercase">Email Corporativo</Label>
                      <Input placeholder="email@empresa.cl" value={formData.contactEmail} onChange={(e) => setFormData({...formData, contactEmail: e.target.value})} className="h-12 border-2 rounded-xl" />
                    </div>
                  </div>
                </div>
                <DialogFooter className="pt-6"><Button type="submit" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl">Guardar en Cartera</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* BANNER ESTRATÉGICO DE AUTOGESTIÓN */}
      <Card className="border-none shadow-2xl bg-slate-900 text-white rounded-[2.5rem] overflow-hidden relative group">
        <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700"><Zap className="h-64 w-64 text-blue-400" /></div>
        <CardContent className="p-10 flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="bg-blue-600/20 p-6 rounded-[2rem] border border-blue-500/30 shrink-0">
            <Smartphone className="h-16 w-16 text-blue-400" />
          </div>
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-2"><Badge className="bg-blue-600 text-white font-black px-3 py-1 uppercase tracking-widest text-[9px]">Valor Agregado</Badge><Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 uppercase text-[9px] font-black">24/7 Activo</Badge></div>
            <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Potencia tus contratos con <br /><span className="text-blue-400">Autogestión de Servicios</span></h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-2xl font-medium">
              Elimina la burocracia de los llamados telefónicos. Dale a tus clientes un portal exclusivo para reportar fallas e incidencias. Cada solicitud se convierte en una **Orden de Trabajo automática**, con trazabilidad inalterable desde el primer segundo.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center"><p className="text-xl font-black text-blue-400 leading-none">0%</p><p className="text-[8px] font-black uppercase text-slate-500 tracking-widest mt-1">Llamadas Perdidas</p></div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center"><p className="text-xl font-black text-emerald-400 leading-none">100%</p><p className="text-[8px] font-black uppercase text-slate-500 tracking-widest mt-1">Trazabilidad</p></div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="pb-6 bg-slate-50/50 border-b p-8">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input placeholder="Buscar por Razón Social o RUT..." className="pl-12 h-14 border-none bg-white shadow-inner rounded-2xl font-medium text-lg" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capacidad de Cartera</p>
              <p className="text-2xl font-black text-slate-900 tracking-tighter">{clients.length} <span className="text-slate-300 text-sm">/ {maxClients}</span></p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isClientsLoading ? (
            <div className="py-32 text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary/20" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Sincronizando Base de Mandantes...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="py-32 text-center border-2 border-dashed m-10 rounded-[3rem] bg-slate-50/50 space-y-4">
              <Building2 className="h-16 w-16 mx-auto text-slate-200" />
              <p className="font-black italic uppercase text-slate-400">Sin clientes registrados aún.</p>
              <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="rounded-xl font-black">Crear mi primer cliente</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-none">
                    <TableHead className="pl-10 h-14 font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Razón Social / Identidad</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Ecosistema Digital & Autogestión</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Ubicación & Contacto</TableHead>
                    <TableHead className="text-right pr-10 font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((client) => (
                    <TableRow key={client.id} className="hover:bg-slate-50/80 group transition-colors">
                      <TableCell className="pl-10 py-8">
                        <div className="flex items-center gap-4">
                          <div className="bg-primary/5 p-3 rounded-[1.2rem] group-hover:bg-primary/10 transition-colors"><Building2 className="h-6 w-6 text-primary" /></div>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-lg tracking-tighter leading-none">{client.name}</span>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">RUT: {client.rut}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-2 w-2 rounded-full",
                              client.portalLastSentAt ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-200"
                            )} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                              Último Envío: <span className={client.portalLastSentAt ? "text-slate-900" : ""}>{formatDateLabel(client.portalLastSentAt)}</span>
                            </span>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 bg-white border-2 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700" 
                              disabled={isSendingLink === client.id}
                              onClick={() => handleSendPortalEmail(client)}
                            >
                              {isSendingLink === client.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Send className="h-3 w-3" /> Enviar Link Acceso</>}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 bg-white border-2" 
                              onClick={() => handleCopyLink(client)}
                            >
                              <Copy className="h-3 w-3" /> Copiar Link
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate max-w-[200px]">{client.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <User className="h-3 w-3" /> {client.contactName || 'S/I'} 
                            <span className="opacity-20 mx-1">|</span>
                            <Mail className="h-3 w-3" /> {client.contactEmail || 'S/I'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-10">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100" onClick={() => handleEdit(client)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-rose-500 hover:bg-rose-50" onClick={() => handleDelete(client)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-blue-50/50 p-8 space-y-4">
          <div className="bg-white p-3 rounded-2xl w-fit shadow-sm text-blue-600"><History className="h-6 w-6" /></div>
          <h4 className="font-black uppercase italic tracking-tighter text-blue-900">Histórico por Cliente</h4>
          <p className="text-xs text-blue-800/70 font-medium leading-relaxed">
            Habilitar el portal le permite a su cliente ver su propio historial de mantenciones, aumentando la confianza en sus servicios recurrentes.
          </p>
        </Card>
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-emerald-50/50 p-8 space-y-4">
          <div className="bg-white p-3 rounded-2xl w-fit shadow-sm text-emerald-600"><ShieldCheck className="h-6 w-6" /></div>
          <h4 className="font-black uppercase italic tracking-tighter text-emerald-900">Firma en Terreno</h4>
          <p className="text-xs text-emerald-800/70 font-medium leading-relaxed">
            Recuerde que el portal de autogestión es también el medio por el cual sus clientes firman digitalmente la recepción conforme de cada O.T.
          </p>
        </Card>
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white p-8 space-y-4">
          <div className="bg-white/10 p-3 rounded-2xl w-fit border border-white/10 text-blue-400"><MousePointer2 className="h-6 w-6" /></div>
          <h4 className="font-black uppercase italic tracking-tighter">Captura de Leads</h4>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            Cada solicitud desde el portal ingresa con prioridad personalizada y trazabilidad GPS opcional del punto de falla.
          </p>
        </Card>
      </div>
    </div>
  );
}
