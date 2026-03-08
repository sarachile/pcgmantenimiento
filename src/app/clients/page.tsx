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
  Send
} from "lucide-react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Client, Company } from "@/lib/types";
import { sendSystemEmail } from "@/actions/email";
import { usePlanLimits } from "@/hooks/use-plan-limits";

export default function ClientsPage() {
  const { profile, isLoading: isAuthLoading } = useUser();
  const { maxClients, canAddClient, planName } = usePlanLimits();
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isSendingLink, setIsSendingLink] = useState<string | null>(null);

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
        subject: `PORTAL DE REQUERIMIENTOS - ${company?.name || 'PCGMANTENIMIENTO'}`,
        html: `<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 20px;">
          <h2>Portal de Autogestión de Servicios</h2>
          <p>Estimados <strong>${client.name}</strong>,</p>
          <p>Para agilizar la atención de sus requerimientos técnicos, hemos habilitado su portal exclusivo.</p>
          <div style="text-align: center; margin: 40px 0;">
            <a href="${url}" style="background-color: #1e3a8a; color: #ffffff; padding: 18px 36px; text-decoration: none; border-radius: 12px; font-weight: 900;">
              SOLICITAR SERVICIO TÉCNICO
            </a>
          </div>
          <p style="font-size: 11px; color: #94a3b8; font-style: italic;">Este link es exclusivo para su organización.</p>
        </div>`
      });

      if (result.success) toast({ title: "Portal Enviado" });
      else throw new Error(result.error);
    } catch (e: any) {
      toast({ title: "Fallo en envío", description: e.message, variant: "destructive" });
    } finally {
      setIsSendingLink(null);
    }
  };

  if (isAuthLoading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Cartera de Clientes</h2>
            <p className="text-muted-foreground">Administre sus clientes y portales de autogestión.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isAtLimit && (
            <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200 gap-1 px-3 py-1">
              <Lock className="h-3 w-3" /> Límite Alcanzado
            </Badge>
          )}
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            if (open && isAtLimit) {
              toast({ title: "Upgrade Requerido", description: `Has alcanzado el máximo de ${maxClients} clientes.` });
              return;
            }
            setIsCreateOpen(open);
            if (!open) { setEditingClient(null); setFormData({ name: "", rut: "", address: "", contactName: "", contactEmail: "" }); }
          }}>
            <DialogTrigger asChild>
              <Button disabled={isAtLimit} className="rounded-xl font-bold shadow-lg"><Plus className="mr-2 h-4 w-4" /> Nuevo Cliente</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem]">
              <DialogHeader><DialogTitle className="text-2xl font-black italic">{editingClient ? "Editar Cliente" : "Registrar Nuevo Cliente"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400">RUT</Label>
                    <Input placeholder="76.000.000-0" value={formData.rut} onChange={(e) => setFormData({...formData, rut: e.target.value})} className="h-12 border-2 rounded-xl" />
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Razón Social</Label>
                    <Input placeholder="Empresa SPA" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-12 border-2 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Dirección</Label>
                  <Input placeholder="Calle, Número, Ciudad" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="h-12 border-2 rounded-xl" />
                </div>
                <div className="border-t pt-4 space-y-4">
                  <p className="text-xs font-black uppercase text-primary tracking-widest">Contacto Portal</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="Nombre" value={formData.contactName} onChange={(e) => setFormData({...formData, contactName: e.target.value})} className="h-12 border-2 rounded-xl" />
                    <Input placeholder="Email" value={formData.contactEmail} onChange={(e) => setFormData({...formData, contactEmail: e.target.value})} className="h-12 border-2 rounded-xl" />
                  </div>
                </div>
                <DialogFooter className="pt-4"><Button type="submit" className="w-full h-12 rounded-xl font-black uppercase tracking-widest">Guardar Registro</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="pb-3 bg-white border-b">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre o RUT..." className="pl-10 h-11 border-none bg-muted/20 rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capacidad de Clientes</p>
              <p className="text-sm font-black text-slate-900">{clients.length} / {maxClients}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isClientsLoading ? (
            <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
          ) : clients.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed m-6 rounded-3xl opacity-40 italic">No hay clientes registrados aún.</div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="pl-6 font-black uppercase text-[10px] tracking-widest">Razón Social / RUT</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Contacto / Autogestión</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Ubicación</TableHead>
                  <TableHead className="text-right pr-6 font-black uppercase text-[10px] tracking-widest">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((client) => (
                  <TableRow key={client.id} className="hover:bg-muted/5 group">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/5 p-2 rounded-lg"><Building2 className="h-4 w-4 text-primary" /></div>
                        <div className="flex flex-col"><span className="font-bold text-slate-900">{client.name}</span><span className="text-[10px] text-slate-400 font-mono">{client.rut}</span></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col text-xs"><span className="font-medium">{client.contactName}</span><span className="text-slate-400 flex items-center gap-1"><Mail className="h-3 w-3" /> {client.contactEmail}</span></div>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="outline" size="sm" className="h-7 text-[9px] font-black uppercase" onClick={() => handleCopyLink(client)}><Copy className="h-3 w-3 mr-1" /> Link Portal</Button>
                          <Button variant="outline" size="sm" className="h-7 text-[9px] font-black uppercase" disabled={isSendingLink === client.id} onClick={() => handleSendPortalEmail(client)}>{isSendingLink === client.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Send className="h-3 w-3 mr-1" /> Email</>}</Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-medium"><MapPin className="h-3 w-3 inline mr-1" /> {client.address}</TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(client)} className="text-rose-500"><Trash2 className="h-4 w-4" /></Button>
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
