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
  Lock
} from "lucide-react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Client, Company } from "@/lib/types";

export default function ClientsPage() {
  const { profile, isLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

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

  // Lógica de límites
  const planLimits = {
    free: 1,
    pro: 5,
    enterprise: 15
  };
  
  const currentPlan = company?.currentPlan || 'free';
  const maxClients = planLimits[currentPlan as keyof typeof planLimits] || 1;
  const isAtLimit = clients.length >= maxClients && !editingClient;

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
        description: `Tu plan ${currentPlan.toUpperCase()} permite hasta ${maxClients} clientes. Mejora tu plan para añadir más.`,
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
      createdAt: serverTimestamp()
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

  if (isAuthLoading) {
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
          <Button variant="ghost" size="icon" asChild title="Volver al escritorio">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Cartera de Clientes</h2>
            <p className="text-muted-foreground">Administre sus clientes y puntos de servicio.</p>
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
                description: `Has alcanzado el máximo de ${maxClients} clientes para el plan ${currentPlan.toUpperCase()}.`,
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
                  <p className="text-sm font-bold text-muted-foreground mb-4">Contacto Responsable</p>
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
                  <TableHead>Contacto</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((client) => (
                  <TableRow key={client.id}>
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
                      <div className="flex flex-col text-xs gap-1">
                        <span className="font-medium">{client.contactName || "S/I"}</span>
                        {client.contactEmail && (
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {client.contactEmail}
                          </span>
                        )}
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
