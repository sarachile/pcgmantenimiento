
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
  SelectValue 
} from "@/components/ui/select";
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
  User,
  Globe
} from "lucide-react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Client, Company } from "@/lib/types";
import { sendSystemEmail } from "@/actions/email";
import { usePlanLimits } from "@/hooks/use-plan-limits";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CHILE_REGIONS } from "@/lib/chile-data";

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
    region: "",
    city: "",
    commune: "",
    street: "",
    streetNumber: "",
    complement: "",
    contactName: "",
    contactEmail: ""
  });

  const selectedRegion = useMemo(() => CHILE_REGIONS.find(r => r.name === formData.region), [formData.region]);

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

  const clients = useMemo(() => (clientsData || []).filter(c => !c.isDeleted), [clientsData]);

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
        description: `Tu ${planName} permite hasta ${maxClients} clientes.`,
        variant: "destructive"
      });
      setIsCreateOpen(false);
      return;
    }

    const fullAddress = `${formData.street} ${formData.streetNumber}${formData.complement ? ', ' + formData.complement : ''}, ${formData.commune}, ${formData.city}, ${formData.region}`;

    const dataToSave = {
      ...formData,
      address: fullAddress,
      companyId: profile.companyId,
      evaluationEnabled: true,
      createdAt: editingClient ? editingClient.createdAt : new Date().toISOString()
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

    resetForm();
    setIsCreateOpen(false);
  };

  const resetForm = () => {
    setFormData({ 
      name: "", rut: "", region: "", city: "", commune: "", 
      street: "", streetNumber: "", complement: "", 
      contactName: "", contactEmail: "" 
    });
    setEditingClient(null);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      rut: client.rut,
      region: client.region || "",
      city: client.city || "",
      commune: client.commune || "",
      street: client.street || "",
      streetNumber: client.streetNumber || "",
      complement: client.complement || "",
      contactName: client.contactName || "",
      contactEmail: client.contactEmail || ""
    });
    setIsCreateOpen(true);
  };

  const handleDelete = (client: Client) => {
    if (!db || !profile?.companyId) return;
    const clientRef = doc(db, "companies", profile.companyId, "clients", client.id);
    // SOFT DELETE
    updateDocumentNonBlocking(clientRef, { isDeleted: true, updatedAt: serverTimestamp() });
    toast({ title: "Cliente archivado", description: "El cliente ha sido removido de la vista principal." });
  };

  const getPortalUrl = (client: Client) => {
    if (!profile?.companyId) return "";
    return `https://www.pcgmantenimiento.com/request/${client.id}?c=${profile.companyId}`;
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
            </div>
            
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
            <p style="font-size: 11px; color: #94a3b8; font-style: italic; text-align: center;">Servicio automatizado vía PCGMANTENIMIENTO ERP.</p>
          </div>
        `
      });

      if (result.success) {
        const clientRef = doc(db!, "companies", profile!.companyId, "clients", client.id);
        updateDocumentNonBlocking(clientRef, { portalLastSentAt: serverTimestamp() });
        toast({ title: "Portal Enviado" });
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
    } catch (e) { return "Error"; }
  };

  if (isAuthLoading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full h-12 w-12"><Link href="/dashboard"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <h2 className="text-4xl font-black tracking-tighter italic uppercase text-slate-900">Cartera de Clientes</h2>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Direccionamiento Granular y Portales Externos</p>
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
              toast({ title: "Upgrade Requerido", description: `Máximo de ${maxClients} clientes alcanzado.` });
              return;
            }
            setIsCreateOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button disabled={isAtLimit} className="rounded-xl h-12 px-6 font-black shadow-xl gap-2">
                <Plus className="h-5 w-5" /> Nuevo Mandante
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-[2.5rem]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">{editingClient ? "Editar Cliente" : "Registrar Mandante"}</DialogTitle>
                <DialogDescription>Defina la ubicación matriz para el direccionamiento de servicios.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">RUT Empresa *</Label>
                    <Input placeholder="76.000.000-0" value={formData.rut} onChange={(e) => setFormData({...formData, rut: e.target.value})} className="h-12 border-2 rounded-xl font-bold" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Razón Social *</Label>
                    <Input placeholder="Nombre Empresa" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-12 border-2 rounded-xl font-bold" required />
                  </div>
                </div>

                <div className="space-y-4 border-t pt-6">
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2"><Globe className="h-4 w-4" /> Ubicación Matriz Obligatoria</p>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Región *</Label>
                      <Select value={formData.region} onValueChange={(v) => setFormData({...formData, region: v, city: "", commune: ""})}>
                        <SelectTrigger className="h-12 border-2 rounded-xl">
                          <SelectValue placeholder="Región" />
                        </SelectTrigger>
                        <SelectContent>
                          {CHILE_REGIONS.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Ciudad *</Label>
                      <Select key={`city-${formData.region}`} value={formData.city} onValueChange={(v) => setFormData({...formData, city: v})} disabled={!formData.region}>
                        <SelectTrigger className="h-12 border-2 rounded-xl">
                          <SelectValue placeholder="Ciudad" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedRegion?.cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Comuna *</Label>
                      <Select key={`commune-${formData.region}`} value={formData.commune} onValueChange={(v) => setFormData({...formData, commune: v})} disabled={!formData.region}>
                        <SelectTrigger className="h-12 border-2 rounded-xl">
                          <SelectValue placeholder="Comuna" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedRegion?.communes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Calle / Avenida *</Label>
                      <Input placeholder="Ej: Av. Providencia" value={formData.street} onChange={(e) => setFormData({...formData, street: e.target.value})} className="h-12 border-2 rounded-xl" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Número *</Label>
                      <Input placeholder="1234" value={formData.streetNumber} onChange={(e) => setFormData({...formData, streetNumber: e.target.value})} className="h-12 border-2 rounded-xl" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Depto / Casa / Oficina (Opcional)</Label>
                    <Input placeholder="Ej: Depto 502" value={formData.complement} onChange={(e) => setFormData({...formData, complement: e.target.value})} className="h-12 border-2 rounded-xl" />
                  </div>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2"><Smartphone className="h-4 w-4" /> Responsable Portal Autogestión</p>
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
                <DialogFooter className="pt-6">
                  <Button type="submit" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl">Guardar en Cartera</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="pb-6 bg-slate-50/50 border-b p-8">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input placeholder="Buscar por Razón Social o RUT..." className="pl-12 h-14 border-none bg-white shadow-inner rounded-2xl font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isClientsLoading ? (
            <div className="py-32 text-center"><Loader2 className="h-12 w-12 animate-spin mx-auto text-primary/20" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-none">
                    <TableHead className="pl-10 h-14 font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Razón Social / Identidad</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Ubicación Matriz</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Autogestión</TableHead>
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
                        <div className="flex flex-col gap-1 max-w-[250px]">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate">{client.street} {client.streetNumber}</span>
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-5">{client.commune}, {client.city}, {client.region}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className={cn("h-2 w-2 rounded-full", client.portalLastSentAt ? "bg-emerald-500" : "bg-slate-200")} />
                            <span className="text-[9px] font-black uppercase text-slate-500">Último: {formatDateLabel(client.portalLastSentAt)}</span>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest gap-2 bg-white border-2 opacity-0 group-hover:opacity-100 transition-opacity" 
                            disabled={isSendingLink === client.id}
                            onClick={() => handleSendPortalEmail(client)}
                          >
                            {isSendingLink === client.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Enviar Link
                          </Button>
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
    </div>
  );
}
