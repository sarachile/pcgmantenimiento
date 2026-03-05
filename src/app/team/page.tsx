
"use client";

import { useState, useRef } from "react";
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
  Phone, 
  Users, 
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
  Upload,
  Shield,
  Zap,
  Users2
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase";
import { collection, doc, serverTimestamp, query, where } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { StaffMember, Team } from "@/lib/types";
import * as XLSX from "xlsx";

export default function TeamPage() {
  const { profile, isLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      createdAt: serverTimestamp()
    };

    if (editingTeam) {
      const teamRef = doc(db, "companies", profile.companyId, "teams", editingTeam.id);
      updateDocumentNonBlocking(teamRef, { ...dataToSave });
      toast({ title: "Cuadrilla actualizada" });
    } else {
      const colRef = collection(db, "companies", profile.companyId, "teams");
      addDocumentNonBlocking(colRef, dataToSave);
      toast({ title: "Cuadrilla creada" });
    }

    setTeamFormData({ name: "", memberIds: [] });
    setIsTeamOpen(false);
    setEditingTeam(null);
  };

  const toggleMember = (id: string) => {
    setTeamFormData(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(id) 
        ? prev.memberIds.filter(mid => mid !== id) 
        : [...prev.memberIds, id]
    }));
  };

  const handleDeleteTeam = (id: string) => {
    if (!db || !profile?.companyId) return;
    const teamRef = doc(db, "companies", profile.companyId, "teams", id);
    deleteDocumentNonBlocking(teamRef);
    toast({ title: "Equipo eliminado" });
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

          <div className="flex gap-2">
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
                      <Label className="text-[10px] font-black uppercase text-slate-400">Identificación</Label>
                      <Input value={formData.identification} onChange={(e) => setFormData({...formData, identification: e.target.value})} placeholder="12.345.678-9" className="h-12 rounded-xl border-2" />
                    </div>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="submit" className="w-full h-12 rounded-xl font-black uppercase tracking-widest">Guardar Registro</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isTeamOpen} onOpenChange={setIsTeamOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl border-primary/20 text-primary font-black gap-2">
                  <Zap className="h-4 w-4" /> Crear Cuadrilla
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-[2.5rem]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black italic">Nueva Cuadrilla / Equipo</DialogTitle>
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
                        <div 
                          key={s.id} 
                          onClick={() => toggleMember(s.id)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2",
                            teamFormData.memberIds.includes(s.id) ? "border-primary bg-primary/5" : "border-transparent hover:bg-slate-50"
                          )}
                        >
                          <Checkbox checked={teamFormData.memberIds.includes(s.id)} />
                          <div className="flex-1">
                            <p className="text-xs font-bold text-slate-900">{s.name}</p>
                            <p className="text-[9px] font-black uppercase text-slate-400">{s.role}</p>
                          </div>
                        </div>
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
                      <TableHead className="text-right pr-6 font-black text-[10px] uppercase tracking-widest">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.map((staff) => (
                      <TableRow key={staff.id} className="hover:bg-muted/5">
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
                          <Button variant="ghost" size="icon" onClick={() => updateDocumentNonBlocking(doc(db!, "companies", profile!.companyId, "staff", staff.id), { active: !staff.active })}>
                            {staff.active ? <UserMinus className="h-4 w-4 text-rose-500" /> : <UserCheck className="h-4 w-4 text-emerald-500" />}
                          </Button>
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
                      <Button variant="ghost" size="icon" className="text-white/20 hover:text-white" onClick={() => handleDeleteTeam(team.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
