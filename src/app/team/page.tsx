
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
  UserPlus, 
  Phone, 
  Shield, 
  MoreVertical,
  Loader2,
  UserCheck,
  UserMinus,
  ArrowLeft,
  Briefcase,
  Contact,
  Trash2,
  Edit
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase";
import { collection, doc, serverTimestamp, query } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { StaffMember } from "@/lib/types";

export default function TeamPage() {
  const { profile, isLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    role: "Técnico",
    identification: "",
    phone: "",
    email: ""
  });

  const staffQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return collection(db, "companies", profile.companyId, "staff");
  }, [db, profile?.companyId]);

  const { data: staffMembers, isLoading: isStaffLoading } = useCollection<StaffMember>(staffQuery);

  const filtered = (staffMembers || []).filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !profile?.companyId) return;

    const dataToSave = {
      ...formData,
      name: formData.name || "Sin nombre",
      role: formData.role || "Técnico",
      companyId: profile.companyId,
      active: true,
      createdAt: serverTimestamp()
    };

    if (editingStaff) {
      const staffRef = doc(db, "companies", profile.companyId, "staff", editingStaff.id);
      updateDocumentNonBlocking(staffRef, { ...dataToSave, updatedAt: serverTimestamp() });
      toast({ title: "Participante actualizado", description: "Cambios guardados con éxito." });
    } else {
      const colRef = collection(db, "companies", profile.companyId, "staff");
      addDocumentNonBlocking(colRef, dataToSave);
      toast({ title: "Participante registrado", description: "Se ha añadido al equipo de trabajo." });
    }

    setFormData({ name: "", role: "Técnico", identification: "", phone: "", email: "" });
    setIsCreateOpen(false);
    setEditingStaff(null);
  };

  const handleEdit = (staff: StaffMember) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      role: staff.role,
      identification: staff.identification || "",
      phone: staff.phone || "",
      email: staff.email || ""
    });
    setIsCreateOpen(true);
  };

  const toggleStatus = (staff: StaffMember) => {
    if (!db || !profile?.companyId) return;
    const staffRef = doc(db, "companies", profile.companyId, "staff", staff.id);
    updateDocumentNonBlocking(staffRef, { active: !staff.active });
    toast({ title: "Estado actualizado", description: `${staff.name} está ahora ${!staff.active ? 'Activo' : 'Inactivo'}.` });
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
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Equipo de Trabajo</h2>
            <p className="text-muted-foreground">Listado de personal operativo, técnicos y subcontratos.</p>
          </div>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setEditingStaff(null);
            setFormData({ name: "", role: "Técnico", identification: "", phone: "", email: "" });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="shadow-lg">
              <UserPlus className="mr-2 h-4 w-4" /> Nuevo Participante
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingStaff ? "Editar Participante" : "Registrar Personal Operativo"}</DialogTitle>
              <DialogDescription>Añada técnicos o especialistas para asignarles tareas.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nombre Completo</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ej: Pedro González"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rol / Función</Label>
                  <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Técnico">Técnico</SelectItem>
                      <SelectItem value="Supervisor">Supervisor de Terreno</SelectItem>
                      <SelectItem value="Especialista">Especialista</SelectItem>
                      <SelectItem value="Subcontrato">Subcontrato</SelectItem>
                      <SelectItem value="Ayudante">Ayudante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>RUT / Identificación</Label>
                  <Input 
                    value={formData.identification} 
                    onChange={(e) => setFormData({...formData, identification: e.target.value})}
                    placeholder="12.345.678-9"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+56 9 ..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email (Opcional)</Label>
                  <Input 
                    type="email"
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="nombre@correo.cl"
                  />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full">
                  {editingStaff ? "Guardar Cambios" : "Añadir al Equipo"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nombre o rol..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isStaffLoading ? (
            <div className="py-10 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Cargando equipo...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
              <Contact className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>No hay participantes registrados aún.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre / RUT</TableHead>
                  <TableHead>Rol Operativo</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((staff) => (
                  <TableRow key={staff.id} className={cn(!staff.active && "opacity-50")}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{staff.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-mono">{staff.identification || 'S/I'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                        {staff.role.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-[11px]">
                        {staff.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {staff.phone}</span>}
                        {staff.email && <span className="text-muted-foreground">{staff.email}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={staff.active ? "default" : "secondary"} className={cn(
                        staff.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100"
                      )}>
                        {staff.active ? "ACTIVO" : "INACTIVO"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(staff)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toggleStatus(staff)}>
                          {staff.active ? <UserMinus className="h-4 w-4 text-rose-500" /> : <UserCheck className="h-4 w-4 text-emerald-500" />}
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
