
"use client";

import { useState, useRef, useCallback } from "react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  UserPlus, 
  Users, 
  Loader2,
  UserCheck,
  UserMinus,
  ArrowLeft,
  Contact,
  Trash2,
  Zap,
  Users2,
  FileUp,
  Download,
  CheckCircle2,
  AlertTriangle,
  Edit,
  MessageCircle,
  Copy,
  Smartphone
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { StaffMember, Team } from "@/lib/types";
import * as XLSX from "xlsx";

export default function TeamPage() {
  const { profile, isLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  // Form State Staff
  const [formData, setFormData] = useState({
    name: "",
    role: "Técnico",
    identification: "",
    phone: "",
    email: ""
  });

  // Form State Team
  const [teamFormData, setTeamFormData] = useState({
    name: "",
    memberIds: [] as string[]
  });

  const staffQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return collection(db, "companies", profile.companyId, "staff");
  }, [db, profile?.companyId]);

  const teamsQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return collection(db, "companies", profile.companyId, "teams");
  }, [db, profile?.companyId]);

  const { data: staffMembers, isLoading: isStaffLoading } = useCollection<StaffMember>(staffQuery);
  const { data: teams, isLoading: isTeamsLoading } = useCollection<Team>(teamsQuery);

  const filteredStaff = (staffMembers || []).filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTeams = (teams || []).filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !profile?.companyId) return;

    const dataToSave = {
      ...formData,
      companyId: profile.companyId,
      active: true,
      createdAt: serverTimestamp()
    };

    if (editingStaff) {
      const staffRef = doc(db, "companies", profile.companyId, "staff", editingStaff.id);
      updateDocumentNonBlocking(staffRef, { ...dataToSave, updatedAt: serverTimestamp() });
      toast({ title: "Participante actualizado" });
    } else {
      const colRef = collection(db, "companies", profile.companyId, "staff");
      addDocumentNonBlocking(colRef, dataToSave);
      toast({ title: "Participante registrado" });
    }

    setFormData({ name: "", role: "Técnico", identification: "", phone: "", email: "" });
    setIsCreateOpen(false);
    setEditingStaff(null);
  };

  const handleTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !profile?.companyId || !teamFormData.name || teamFormData.memberIds.length === 0) return;

    const dataToSave = {
      name: teamFormData.name,
      memberIds: teamFormData.memberIds,
      companyId: profile.companyId,
      updatedAt: serverTimestamp()
    };

    if (editingTeam) {
      const teamRef = doc(db, "companies", profile.companyId, "teams", editingTeam.id);
      updateDocumentNonBlocking(teamRef, dataToSave);
      toast({ title: "Cuadrilla actualizada" });
    } else {
      const colRef = collection(db, "companies", profile.companyId, "teams");
      addDocumentNonBlocking(colRef, { ...dataToSave, createdAt: serverTimestamp() });
      toast({ title: "Cuadrilla creada" });
    }

    setTeamFormData({ name: "", memberIds: [] });
    setIsTeamOpen(false);
    setEditingTeam(null);
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setTeamFormData({
      name: team.name,
      memberIds: team.memberIds
    });
    setIsTeamOpen(true);
  };

  const toggleMember = useCallback((id: string) => {
    setTeamFormData(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(id) 
        ? prev.memberIds.filter(mid => mid !== id) 
        : [...prev.memberIds, id]
    }));
  }, []);

  const handleDeleteTeam = (id: string) => {
    if (!db || !profile?.companyId) return;
    const teamRef = doc(db, "companies", profile.companyId, "teams", id);
    deleteDocumentNonBlocking(teamRef);
    toast({ title: "Equipo eliminado" });
  };

  const handleWhatsAppInvite = (staff: StaffMember) => {
    if (!staff.phone || !profile?.companyId) {
      toast({ 
        title: "Faltan datos", 
        description: "El técnico debe tener un teléfono móvil registrado para invitarlo por WhatsApp.", 
        variant: "destructive" 
      });
      return;
    }
    const baseUrl = window.location.origin;
    const inviteLink = `${baseUrl}/staff/setup/${staff.id}?c=${profile.companyId}`;
    const message = `Hola ${staff.name}, bienvenido al equipo técnico de PCGMANTENIMIENTO. Para ver tus órdenes asignadas y reportar tus trabajos, activa tu acceso aquí: ${inviteLink}`;
    const encodedMsg = encodeURIComponent(message);
    const cleanPhone = staff.phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
    window.open(whatsappUrl, '_blank');
  };

  // LÓGICA DE CARGA MASIVA
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !db || !profile?.companyId) return;

    setIsProcessingBulk(true);
    const reader = new FileReader();
    
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const colRef = collection(db, "companies", profile.companyId, "staff");
        let count = 0;

        for (const row of data as any[]) {
          const staffData = {
            name: row.Nombre || row.nombre || "Sin Nombre",
            role: row.Rol || row.rol || "Técnico",
            identification: row.RUT || row.rut || row.Identificacion || "",
            phone: String(row.Telefono || row.telefono || ""),
            email: row.Email || row.email || "",
            companyId: profile.companyId,
            active: true,
            createdAt: serverTimestamp()
          };
          
          await addDocumentNonBlocking(colRef, staffData);
          count++;
        }

        toast({
          title: "Proceso Completado",
          description: `Se han importado ${count} técnicos exitosamente.`,
        });
        setIsBulkOpen(false);
      } catch (error) {
        toast({
          title: "Error en importación",
          description: "El formato del archivo no es válido.",
          variant: "destructive"
        });
      } finally {
        setIsProcessingBulk(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const template = [
      { Nombre: "Juan Perez", Rol: "Técnico", RUT: "12.345.678-9", Telefono: "56912345678", Email: "juan@empresa.cl" },
      { Nombre: "Maria Soto", Rol: "Supervisor", RUT: "9.876.543-2", Telefono: "56987654321", Email: "maria@empresa.cl" }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Personal");
    XLSX.writeFile(wb, "Plantilla_Carga_Personal_PCG.xlsx");
  };

  if (isAuthLoading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <h2 className="text-3xl font-black tracking-tight italic">Gestión de Equipos</h2>
            <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">Escalabilidad Operativa y Cuadrillas</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="staff" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="bg-muted/50 p-1 rounded-xl h-12">
            <TabsTrigger value="staff" className="rounded-lg px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Contact className="h-4 w-4 mr-2" /> Personal ({staffMembers?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="teams" className="rounded-lg px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Users2 className="h-4 w-4 mr-2" /> Cuadrillas / Brigadas ({teams?.length || 0})
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2 flex-wrap">
            <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-black gap-2">
                  <FileUp className="h-4 w-4" /> Carga Masiva (Excel)
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-[2.5rem]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black italic">Importar desde Excel</DialogTitle>
                  <DialogDescription>Cargue cientos de técnicos en segundos utilizando nuestra plantilla oficial.</DialogDescription>
                </DialogHeader>
                <div className="py-6 space-y-6">
                  <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed space-y-4">
                    <p className="text-sm font-bold text-slate-600">1. Descarga la plantilla base:</p>
                    <Button variant="secondary" className="w-full rounded-xl gap-2 font-bold" onClick={downloadTemplate}>
                      <Download className="h-4 w-4" /> Descargar Plantilla .xlsx
                    </Button>
                  </div>
                  
                  <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed space-y-4">
                    <p className="text-sm font-bold text-slate-600">2. Sube el archivo completado:</p>
                    <input 
                      type="file" 
                      accept=".xlsx, .xls, .csv" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleBulkUpload}
                    />
                    <Button 
                      className="w-full h-16 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest gap-2" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingBulk}
                    >
                      {isProcessingBulk ? <Loader2 className="animate-spin h-5 w-5" /> : <><FileUp className="h-5 w-5" /> Seleccionar Archivo</>}
                    </Button>
                  </div>

                  <div className="flex items-start gap-2 text-amber-600 bg-amber-50 p-4 rounded-2xl border border-amber-100">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold leading-relaxed uppercase tracking-tighter">
                      Asegúrese de no cambiar los encabezados de la plantilla para que el motor de mapeo funcione correctamente.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl shadow-lg font-black gap-2">
                  <UserPlus className="h-4 w-4" /> Nuevo Técnico
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-[2.5rem]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black italic">Registrar Personal</DialogTitle>
                  <DialogDescription>Añada un nuevo colaborador a la base de datos maestra.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleStaffSubmit} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Nombre Completo</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Ej: Pedro González" className="h-12 rounded-xl border-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Rol Operativo</Label>
                      <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val})}>
                        <SelectTrigger className="h-12 rounded-xl border-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Técnico">Técnico</SelectItem>
                          <SelectItem value="Supervisor">Supervisor</SelectItem>
                          <SelectItem value="Especialista">Especialista</SelectItem>
                          <SelectItem value="Subcontrato">Subcontrato</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">RUT / Identificación</Label>
                      <Input value={formData.identification} onChange={(e) => setFormData({...formData, identification: e.target.value})} placeholder="12.345.678-9" className="h-12 rounded-xl border-2" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Teléfono (WhatsApp)</Label>
                      <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="569XXXXXXXX" className="h-12 rounded-xl border-2" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Email (Opcional)</Label>
                      <Input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="tecnico@empresa.cl" className="h-12 rounded-xl border-2" />
                    </div>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="submit" className="w-full h-12 rounded-xl font-black uppercase tracking-widest">Guardar Registro</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isTeamOpen} onOpenChange={(open) => {
              setIsTeamOpen(open);
              if (!open) {
                setEditingTeam(null);
                setTeamFormData({ name: "", memberIds: [] });
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl border-primary/20 text-primary font-black gap-2">
                  <Zap className="h-4 w-4" /> Crear Cuadrilla
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-[2.5rem]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black italic">{editingTeam ? "Editar Cuadrilla" : "Nueva Cuadrilla / Equipo"}</DialogTitle>
                  <DialogDescription>Agrupe técnicos para agilizar la asignación de obras masivas.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleTeamSubmit} className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Nombre del Equipo</Label>
                    <Input 
                      placeholder="Ej: Cuadrilla Eléctrica Sur" 
                      className="h-12 rounded-xl border-2 font-bold" 
                      value={teamFormData.name}
                      onChange={(e) => setTeamFormData({...teamFormData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Seleccionar Integrantes ({teamFormData.memberIds.length})</Label>
                    <div className="max-h-[250px] overflow-y-auto border-2 rounded-2xl p-2 space-y-1">
                      {staffMembers?.map(s => (
                        <label 
                          key={s.id} 
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2",
                            teamFormData.memberIds.includes(s.id) ? "border-primary bg-primary/5 shadow-inner" : "border-transparent hover:bg-slate-50"
                          )}
                        >
                          <Checkbox 
                            checked={teamFormData.memberIds.includes(s.id)} 
                            onCheckedChange={() => toggleMember(s.id)}
                          />
                          <div className="flex-1">
                            <p className="text-xs font-bold text-slate-900">{s.name}</p>
                            <p className="text-[9px] font-black uppercase text-slate-400">{s.role}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full h-14 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-primary/20" disabled={!teamFormData.name || teamFormData.memberIds.length === 0}>
                      {editingTeam ? "Actualizar Cuadrilla" : "Activar Cuadrilla"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="staff">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-white border-b">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Buscar personal..." className="pl-10 h-11 border-none bg-muted/20 rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isStaffLoading ? (
                <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="font-black pl-6 text-[10px] uppercase tracking-widest">Nombre / Identificación</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Especialidad</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Estado</TableHead>
                      <TableHead className="text-right pr-6 font-black text-[10px] uppercase tracking-widest">Invitación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.map((staff) => (
                      <TableRow key={staff.id} className="hover:bg-muted/5 group">
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/5 p-2 rounded-lg font-black text-xs text-primary">{staff.name.charAt(0)}</div>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{staff.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{staff.identification || 'S/I'}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="font-black text-[9px] uppercase">{staff.role}</Badge></TableCell>
                        <TableCell><Badge className={staff.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100"}>{staff.active ? "ACTIVO" : "INACTIVO"}</Badge></TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-emerald-600 bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity" 
                              title="Invitar por WhatsApp"
                              onClick={() => handleWhatsAppInvite(staff)}
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-slate-400" 
                              onClick={() => updateDocumentNonBlocking(doc(db!, "companies", profile!.companyId, "staff", staff.id), { active: !staff.active })}
                            >
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
        </TabsContent>

        <TabsContent value="teams">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isTeamsLoading ? (
              <div className="col-span-full py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
            ) : filteredTeams.length === 0 ? (
              <div className="col-span-full py-20 text-center border-2 border-dashed rounded-[3rem] opacity-40">
                <Users2 className="h-12 w-12 mx-auto mb-4" />
                <p className="font-bold">No hay cuadrillas configuradas.</p>
                <p className="text-xs">Cree equipos para agilizar la asignación de personal.</p>
              </div>
            ) : (
              filteredTeams.map((team) => (
                <Card key={team.id} className="rounded-[2rem] border-none shadow-md hover:shadow-xl transition-all group overflow-hidden">
                  <CardHeader className="bg-slate-900 text-white p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-black italic tracking-tight">{team.name}</CardTitle>
                        <CardDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{team.memberIds.length} Miembros</CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="text-white/20 hover:text-white" onClick={() => handleEditTeam(team)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-white/20 hover:text-white" onClick={() => handleDeleteTeam(team.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Integrantes del Equipo</p>
                      <div className="flex flex-wrap gap-2">
                        {team.memberIds.map(mid => {
                          const member = staffMembers?.find(s => s.id === mid);
                          return member ? (
                            <Badge key={mid} variant="secondary" className="rounded-lg h-7 font-bold text-[10px] bg-slate-100 border-none">
                              {member.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
