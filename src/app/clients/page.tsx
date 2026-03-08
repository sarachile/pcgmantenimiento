
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
  Globe,
  Copy,
  Send,
  Smartphone
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

  // La lógica de bloqueo se basa ahora estrictamente en canAddClient del hook global
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
      toast({ title: "Cliente actualizado", description: "Los cambios han sido guardados." });
    } else {
      const colRef = collection(db, "companies", profile.companyId, "clients");
      addDocumentNonBlocking(colRef, dataToSave);
      toast({ title: "Cliente registrado", description: "Nuevo cliente añadido exitosamente." });
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
    toast({ title: "Cliente eliminado", description: "El registro ha sido removido." });
  };

  const getPortalUrl = (client: Client) => {
    if (typeof window === "undefined" || !profile?.companyId) return "";
    return `${window.location.origin}/request/${client.id}?c=${profile.companyId}`;
  };

  const handleCopyLink = (client: Client) => {
    const url = getPortalUrl(client);
    navigator.clipboard.writeText(url);
    toast({ title: "Link Copiado", description: "Enlace de requerimiento listo para enviar." });
  };

  const handleSendPortalEmail = async (client: Client) => {
    if (!client.contactEmail) {
      toast({ title: "Sin Email", description: "El cliente no tiene un correo de contacto registrado.", variant: "destructive" });
      return;
    }

    setIsSendingLink(client.id);
    const url = getPortalUrl(client);

    try {
      const result = await sendSystemEmail({
        to: client.contactEmail,
        subject: `PORTAL DE REQUERIMIENTOS TÉCNICOS - ${company?.name || 'PCGMANTENIMIENTO'}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1e3a8a; font-size: 24px; margin: 0; text-transform: uppercase;">${company?.name || 'PCGMANTENIMIENTO'}</h1>
              <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Portal de Gestión de Servicios</p>
            </div>
            
            <h2 style="color: #1e3a8a; font-size: 20px; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Acceso a Autogestión de Órdenes</h2>
            <p style="font-size: 15px; line-height: 1.6; color: #334155;">Estimados <strong>${client.name}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.6; color: #334155;">Para agilizar la atención de sus requerimientos técnicos, hemos habilitado su portal exclusivo de autogestión. A través de este enlace, podrá solicitar servicios, reportar fallas y adjuntar descripciones sin necesidad de login adicional.</p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${url}" style="background-color: #1e3a8a; color: #ffffff; padding: 18px 36px; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 16px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(30, 58, 138, 0.3);">
                SOLICITAR SERVICIO TÉCNICO
              </a>
            </div>

            <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; border: 1px dashed #cbd5e1; margin-top: 40px;">
              <h3 style="font-size: 14px; color: #1e3a8a; margin-top: 0; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">¿Cómo tenernos siempre a mano?</h3>
              <p style="font-size: 12px; color: #64748b; margin-bottom: 16px;">Siga estas instrucciones para guardar este portal como un ícono en su teléfono móvil:</p>
              
              <div style="margin-bottom: 16px;">
                <p style="font-size: 13px; font-weight: bold; color: #334155; margin-bottom: 4px;">En iPhone (Safari):</p>
                <p style="font-size: 12px; color: #475569;">Abra el link, pulse el botón <strong>"Compartir"</strong> (cuadrado con flecha) y seleccione <strong>"Agregar a Inicio"</strong>.</p>
              </div>
              
              <div>
                <p style="font-size: 13px; font-weight: bold; color: #334155; margin-bottom: 4px;">En Android (Chrome):</p>
                <p style="font-size: 12px; color: #475569;">Abra el link, pulse los <strong>3 puntos</strong> superiores y seleccione <strong>"Instalar aplicación"</strong> o <strong>"Agregar a pantalla principal"</strong>.</p>
              </div>
            </div>

            <p style="font-size: 11px; color: #94a3b8; font-style: italic; text-align: center; margin-top: 30px;">Este link es exclusivo para su organización. No lo comparta con terceros.</p>
          </div>
        `
      });

      if (result.success) {
        toast({ title: "Portal Enviado", description: `Enlace enviado a ${client.contactEmail}` });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Fallo en envío", description: e.message, variant: "destructive" });
    } finally {
      setIsSendingLink(null);
    }
  };

  if (isAuthLoading) {
    return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild title="Volver al escritorio">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Cartera de Clientes</h2>
            <p className="text-muted-foreground">Administre sus clientes y portales de autogestión.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isAtLimit && (
            <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200 gap-1 px-3 py-1">
              <Lock className="h-3 w-3" /> Límite del Plan alcanzado
            </Badge>
          )}
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            if (open && isAtLimit) {
              toast({
                title: "Actualización Requerida",
                description: `Has alcanzado el máximo de ${maxClients} clientes para tu ${planName}.`,
              });
              return;
            }
            setIsCreateOpen(open);
            if (!open) {
              setEditingClient(null);
              setFormData({ name: "", rut: "", address: "", contactName: "", contactEmail: "" });
            }
          }}>
            <DialogTrigger asChild>
              <Button disabled={isAtLimit}>
                <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingClient ? "Editar Cliente" : "Registrar Nuevo Cliente"}</DialogTitle>
                <DialogDescription>Complete los datos legales y de contacto del cliente.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="rut">RUT del Cliente</Label>
                    <Input 
                      id="rut" 
                      placeholder="76.000.000-0" 
                      value={formData.rut}
                      onChange={(e) => setFormData({...formData, rut: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="name">Razón Social</Label>
                    <Input 
                      id="name" 
                      placeholder="Nombre de la empresa" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección Principal</Label>
                  <Input 
                    id="address" 
                    placeholder="Calle, Número, Ciudad" 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-bold text-muted-foreground mb-4">Contacto Responsable (Portal)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Nombre</Label>
                      <Input 
                        id="contactName" 
                        placeholder="Juan Soto" 
                        value={formData.contactName}
                        onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Email</Label>
                      <Input 
                        id="contactEmail" 
                        type="email"
                        placeholder="juan@cliente.cl" 
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full">
                    {editingClient ? "Guardar Cambios" : "Registrar Cliente"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre o RUT..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-muted-foreground uppercase">Capacidad Clientes</p>
              <p className="text-sm font-black">{clients.length} / {maxClients}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isClientsLoading ? (
            <div className="py-10 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Cargando clientes...
            </div>
          ) : clients.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border rounded-lg border-dashed">
              No hay clientes registrados en la cartera.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Razón Social / RUT</TableHead>
                  <TableHead>Contacto / Autogestión</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((client) => (
                  <TableRow key={client.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/5 p-2 rounded-lg">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold">{client.name}</span>
                          <span className="text-xs text-muted-foreground font-mono">{client.rut}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col text-xs">
                          <span className="font-medium">{client.contactName || "S/I"}</span>
                          <span className="text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {client.contactEmail || 'Sin email'}</span>
                        </div>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="outline" size="sm" className="h-7 text-[10px] font-black uppercase tracking-tighter" onClick={() => handleCopyLink(client)}>
                            <Copy className="h-3 w-3 mr-1" /> Link Portal
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-[10px] font-black uppercase tracking-tighter border-primary/20 text-primary hover:bg-primary/5"
                            disabled={isSendingLink === client.id}
                            onClick={() => handleSendPortalEmail(client)}
                          >
                            {isSendingLink === client.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Send className="h-3 w-3 mr-1" /> Enviar por Mail</>}
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {client.address}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(client)} className="text-rose-500">
                          <Trash2 className="h-4 w-4" />
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
