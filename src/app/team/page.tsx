
"use client";

import { useState, useEffect, useRef } from "react";
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
  Edit,
  FileSpreadsheet,
  Download,
  Upload
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase";
import { collection, doc, serverTimestamp, query } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { StaffMember } from "@/lib/types";
import * as XLSX from "xlsx";

export default function TeamPage() {
  const { profile, isLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleDownloadTemplate = () => {
    const templateData = [
      { Nombre: "Pedro González", Rol: "Técnico", Identificacion: "12.345.678-9", Telefono: "+56912345678", Email: "pedro@empresa.cl" },
      { Nombre: "Juan Pérez", Rol: "Supervisor", Identificacion: "11.222.333-4", Telefono: "+56987654321", Email: "juan@empresa.cl" }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Participantes");
    XLSX.writeFile(wb, "Plantilla_Carga_Masiva_PCG.xlsx");
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !db || !profile?.companyId) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet) as any[];

        const colRef = collection(db, "companies", profile.companyId, "staff");
        let count = 0;

        for (const row of rows) {
          const name = row.Nombre || row.nombre || row.Name || row.name;
          const role = row.Rol || row.rol || row.Role || row.role || row.Especialidad || row.especialidad || "Técnico";
          const iden = row.Identificacion || row.identificacion || row.RUT || row.rut || "";
          const phone = row.Telefono || row.telefono || row.Phone || row.phone || "";
          const email = row.Email || row.email || row.Correo || row.correo || "";

          if (name) {
            addDocumentNonBlocking(colRef, {
              name,
              role,
              identification: String(iden),
              phone: String(phone),
              email: String(email),
              companyId: profile.companyId,
              active: true,
              createdAt: serverTimestamp()
            });
            count++;
          }
        }

        toast({
          title: "Importación Completada",
          description: `Se han registrado ${count} nuevos participantes.`,
        });
        setIsBulkOpen(false);
      } catch (error) {
        toast({
          title: "Error al procesar",
          description: "No se pudo leer el archivo. Verifique el formato.",
          variant: "destructive"
        });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
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
        
        <div className="flex items-center gap-3">
          <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FileSpreadsheet className="h-4 w-4" /> Carga Masiva
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle>Carga Masiva de Personal</DialogTitle>
                <DialogDescription>Importe su listado de trabajadores desde un archivo Excel o CSV.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">Paso 1: Usar formato correcto</p>
                  <p className="text-xs text-muted-foreground">Para una importación exitosa, su archivo debe tener las columnas: <strong>Nombre, Rol, Identificación, Teléfono, Email</strong>.</p>
                  <Button variant="outline" size="sm" className="w-full gap-2 text-primary border-primary/20" onClick={handleDownloadTemplate}>
                    <Download className="h-3 w-3" /> Descargar Plantilla Excel
                  </Button>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Paso 2: Subir archivo</p>
                  <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleBulkUpload}
                  />
                  <Button 
                    className="w-full h-24 border-2 border-dashed flex flex-col gap-2 hover:bg-muted/50" 
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                  >
                    {isImporting ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-muted-foreground" />}
                    <span className="text-xs font-medium">Haga clic para seleccionar archivo</span>
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" className="w-full" onClick={() => setIsBulkOpen(false)}>Cancelar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
