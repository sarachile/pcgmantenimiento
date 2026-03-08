
"use client";

import { useState, useRef, useMemo } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  UserPlus, 
  Loader2,
  ArrowLeft,
  Contact,
  Trash2,
  Users2,
  FileUp,
  Edit,
  MessageCircle,
  MoreVertical,
  Link2,
  Smartphone,
  CheckCircle2,
  Clock,
  Plus,
  Shield
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { StaffMember, Team, Company } from "@/lib/types";
import * as XLSX from "xlsx";
import { usePlanLimits } from "@/hooks/use-plan-limits";

export default function TeamPage() {
  const { profile, isLoading: isAuthLoading } = useUser();
  const { maxTechs, canAddTech, techCount, planName } = usePlanLimits();
  const db = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("staff");
  
  // UI States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  
  // Editing States
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  // Form States
  const [formData, setFormData] = useState({ name: "", role: "Técnico", identification: "", phone: "", email: "" });
  const [teamFormData, setTeamFormData] = useState({ name: "", leaderId: "", memberIds: [] as string[] });

  // Queries
  const companyRef = useMemoFirebase(() => db && profile?.companyId ? doc(db, "companies", profile.companyId) : null, [db, profile?.companyId]);
  const { data: company } = useDoc<Company>(companyRef);

  const staffQuery = useMemoFirebase(() => db && profile?.companyId ? collection(db, "companies", profile.companyId, "staff") : null, [db, profile?.companyId]);
  const teamsQuery = useMemoFirebase(() => db && profile?.companyId ? collection(db, "companies", profile.companyId, "teams") : null, [db, profile?.companyId]);

  const { data: staffMembers, isLoading: isStaffLoading } = useCollection<StaffMember>(staffQuery);
  const { data: teams, isLoading: isTeamsLoading } = useCollection<Team>(teamsQuery);

  const filteredStaff = (staffMembers || []).filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.identification?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAtLimit = !canAddTech && !editingStaff;

  // --- STAFF HANDLERS ---
  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !profile?.companyId) return;
    if (isAtLimit) { 
      toast({ title: "Plan Completo", description: `Has alcanzado el límite de ${maxTechs} técnicos de tu plan.`, variant: "destructive" }); 
      return; 
    }

    const dataToSave = { ...formData, companyId: profile.companyId, active: true, createdAt: serverTimestamp() };
    if (editingStaff) {
      updateDocumentNonBlocking(doc(db, "companies", profile.companyId, "staff", editingStaff.id), { ...dataToSave, updatedAt: serverTimestamp() });
      toast({ title: "Técnico actualizado" });
    } else {
      addDocumentNonBlocking(collection(db, "companies", profile.companyId, "staff"), dataToSave);
      toast({ title: "Técnico registrado", description: "Recuerde enviarle su link de activación por WhatsApp." });
    }
    setIsCreateOpen(false);
    setEditingStaff(null);
    setFormData({ name: "", role: "Técnico", identification: "", phone: "", email: "" });
  };

  const handleEditStaff = (staff: StaffMember) => {
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

  const handleDeleteStaff = (staff: StaffMember) => {
    if (!db || !profile?.companyId) return;
    deleteDocumentNonBlocking(doc(db, "companies", profile.companyId, "staff", staff.id));
    toast({ title: "Técnico eliminado" });
  };

  // --- TEAM HANDLERS ---
  const handleTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !profile?.companyId) return;

    const dataToSave = { 
      ...teamFormData, 
      companyId: profile.companyId, 
      createdAt: serverTimestamp() 
    };

    if (editingTeam) {
      updateDocumentNonBlocking(doc(db, "companies", profile.companyId, "teams", editingTeam.id), { ...dataToSave, updatedAt: serverTimestamp() });
      toast({ title: "Cuadrilla actualizada" });
    } else {
      addDocumentNonBlocking(collection(db, "companies", profile.companyId, "teams"), dataToSave);
      toast({ title: "Cuadrilla activada", description: "El equipo ya está disponible para asignación de OTs." });
    }
    setIsTeamOpen(false);
    setEditingTeam(null);
    setTeamFormData({ name: "", leaderId: "", memberIds: [] });
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setTeamFormData({
      name: team.name,
      leaderId: team.leaderId || "",
      memberIds: team.memberIds || []
    });
    setIsTeamOpen(true);
  };

  const handleDeleteTeam = (team: Team) => {
    if (!db || !profile?.companyId) return;
    deleteDocumentNonBlocking(doc(db, "companies", profile.companyId, "teams", team.id));
    toast({ title: "Cuadrilla eliminada" });
  };

  // --- UTILS ---
  const getInvitationLink = (staffId: string) => {
    if (typeof window === "undefined" || !profile?.companyId) return "";
    return `${window.location.origin}/staff/setup/${staffId}?c=${profile.companyId}`;
  };

  const handleCopyLink = (staffId: string) => {
    const link = getInvitationLink(staffId);
    navigator.clipboard.writeText(link);
    toast({ title: "Link Copiado", description: "Listo para pegar en WhatsApp." });
  };

  const handleSendWhatsApp = (staff: StaffMember) => {
    if (!staff.phone) {
      toast({ title: "Sin teléfono", description: "Debe registrar un número para enviar WhatsApp.", variant: "destructive" });
      return;
    }

    const cleanPhone = staff.phone.replace(/\D/g, "");
    const link = getInvitationLink(staff.id);
    const message = `Hola *${staff.name}*, te damos la bienvenida a *${company?.name || 'PCGMANTENIMIENTO'}*. Para activar tu cuenta de técnico y acceder a tus órdenes de trabajo, por favor ingresa a este enlace y configura tu PIN: ${link}`;
    
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !db || !profile?.companyId || isAtLimit) return;
    setIsProcessingBulk(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        const colRef = collection(db, "companies", profile.companyId, "staff");
        let count = 0;
        for (const row of data as any[]) {
          if (techCount + count >= maxTechs) break;
          await addDocumentNonBlocking(colRef, { 
            name: row.Nombre || "Sin Nombre", 
            role: row.Rol || "Técnico", 
            identification: String(row.RUT || ""), 
            phone: String(row.Telefono || ""), 
            email: row.Email || "", 
            companyId: profile.companyId, 
            active: true, 
            createdAt: serverTimestamp() 
          });
          count++;
        }
        toast({ title: "Importación Exitosa", description: `Se cargaron ${count} registros técnicos.` });
        setIsBulkOpen(false);
      } catch (e) { toast({ title: "Error al procesar Excel", variant: "destructive" }); } finally { setIsProcessingBulk(false); }
    };
    reader.readAsBinaryString(file);
  };

  if (isAuthLoading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full h-12 w-12"><Link href="/dashboard"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <h2 className="text-4xl font-black italic tracking-tighter text-slate-900 uppercase">Gestión de Personal</h2>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Control de acceso y cuadrillas de terreno</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white p-8 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-10 opacity-10 group-hover:scale-110 transition-transform"><Smartphone className="h-40 w-40 text-blue-400" /></div>
          <div className="relative z-10 space-y-4">
            <Badge className="bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest px-3 py-1">Workflow WhatsApp</Badge>
            <h3 className="text-2xl font-black italic uppercase leading-none">Invitación Directa</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Registra a tu personal y envía sus instrucciones de acceso directamente a su WhatsApp. Sin correos perdidos ni procesos complejos.
            </p>
          </div>
        </Card>
        
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-emerald-50 text-emerald-900 p-8 flex flex-col justify-center border-2 border-emerald-100">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Estado de Flota Digital</p>
          <div className="flex items-baseline gap-2">
            <p className="text-5xl font-black tracking-tighter">{techCount}</p>
            <p className="text-xl font-bold opacity-40">/ {maxTechs}</p>
          </div>
          <p className="text-xs font-bold text-emerald-700/60 mt-2 uppercase tracking-tight">Capacidad técnica ocupada en tu {planName}</p>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <TabsList className="bg-white p-1 rounded-2xl h-14 border shadow-sm">
            <TabsTrigger value="staff" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white">Personal Técnico</TabsTrigger>
            <TabsTrigger value="teams" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white">Cuadrillas</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            {activeTab === 'staff' ? (
              <>
                <Button variant="outline" className="rounded-xl h-12 border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 font-bold" onClick={() => setIsBulkOpen(true)}><FileUp className="h-4 w-4 mr-2" /> Carga Excel</Button>
                <Button className="rounded-xl h-12 px-6 font-black gap-2 shadow-lg" onClick={() => { setEditingStaff(null); setIsCreateOpen(true); }} disabled={isAtLimit}><UserPlus className="h-5 w-5" /> Nuevo Registro</Button>
              </>
            ) : (
              <Button className="rounded-xl h-12 px-6 font-black gap-2 shadow-lg" onClick={() => { setEditingTeam(null); setIsTeamOpen(true); }}><Plus className="h-5 w-5" /> Nueva Cuadrilla</Button>
            )}
          </div>
        </div>

        <TabsContent value="staff">
          <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-white border-b p-8">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input placeholder="Buscar por nombre o RUT..." className="pl-12 h-12 border-none bg-slate-50 rounded-2xl text-base font-medium shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-none">
                    <TableHead className="pl-10 h-14 font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Técnico / Identidad</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Rol & Especialidad</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Estado de Acceso</TableHead>
                    <TableHead className="text-right pr-10 font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Gestión</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isStaffLoading ? (
                    <TableRow><TableCell colSpan={4} className="py-20 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-primary/20" /></TableCell></TableRow>
                  ) : filteredStaff.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="py-20 text-center italic text-slate-400">Sin técnicos registrados.</TableCell></TableRow>
                  ) : (
                    filteredStaff.map((s) => (
                      <TableRow key={s.id} className="hover:bg-slate-50 transition-colors group">
                        <TableCell className="pl-10 py-6">
                          <div className="flex items-center gap-4">
                            <div className="bg-primary/5 p-3 rounded-2xl group-hover:bg-primary/10 transition-colors"><Contact className="h-6 w-6 text-primary" /></div>
                            <div className="flex flex-col">
                              <span className="font-black text-slate-900 tracking-tight">{s.name}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{s.identification}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px] uppercase font-black px-3 py-1 bg-white">{s.role}</Badge>
                        </TableCell>
                        <TableCell>
                          {s.hasAccount ? (
                            <div className="flex items-center gap-2 text-emerald-600">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Acceso Activo</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 text-amber-500">
                                <Clock className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Activación Pendiente</span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 px-2 text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg gap-1.5"
                                onClick={() => handleSendWhatsApp(s)}
                              >
                                <MessageCircle className="h-3 w-3" /> Invitar por WA
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-10">
                          <div className="flex justify-end gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100"><MoreVertical className="h-5 w-5 text-slate-400" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 rounded-2xl border-none shadow-2xl p-2">
                                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 p-2">Comunicación</DropdownMenuLabel>
                                <DropdownMenuItem className="rounded-xl p-3 focus:bg-emerald-50 font-bold gap-3 text-emerald-700" onClick={() => handleSendWhatsApp(s)}>
                                  <MessageCircle className="h-4 w-4" /> Enviar por WhatsApp
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-xl p-3 focus:bg-blue-50 font-bold gap-3 text-blue-700" onClick={() => handleCopyLink(s.id)}>
                                  <Link2 className="h-4 w-4" /> Copiar Link Invitación
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-50" />
                                <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 p-2">Acciones</DropdownMenuLabel>
                                <DropdownMenuItem className="rounded-xl p-3 focus:bg-slate-50 font-bold gap-3" onClick={() => handleEditStaff(s)}>
                                  <Edit className="h-4 w-4 text-slate-400" /> Editar Datos
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-xl p-3 focus:bg-rose-50 font-bold gap-3 text-rose-600" onClick={() => handleDeleteStaff(s)}>
                                  <Trash2 className="h-4 w-4" /> Eliminar Registro
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams">
          <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-white border-b p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Cuadrillas Operativas</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Equipos de trabajo consolidados</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-none">
                    <TableHead className="pl-10 h-14 font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Nombre de Cuadrilla</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-[0.2em]">Miembros</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-[0.2em]">Líder Asignado</TableHead>
                    <TableHead className="text-right pr-10 font-black uppercase text-[10px] tracking-[0.2em]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isTeamsLoading ? (
                    <TableRow><TableCell colSpan={4} className="py-20 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-primary/20" /></TableCell></TableRow>
                  ) : !teams || teams.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="py-24 text-center space-y-4">
                      <div className="bg-slate-50 p-6 rounded-full w-fit mx-auto opacity-50"><Users2 className="h-12 w-12 text-slate-300" /></div>
                      <p className="font-black italic uppercase text-slate-400">Sin cuadrillas configuradas.</p>
                      <Button variant="outline" className="rounded-xl font-black" onClick={() => setIsTeamOpen(true)}>Crear mi primera cuadrilla</Button>
                    </TableCell></TableRow>
                  ) : (
                    teams.map((t) => (
                      <TableRow key={t.id} className="hover:bg-slate-50 transition-colors group">
                        <TableCell className="pl-10 py-6">
                          <div className="flex items-center gap-4">
                            <div className="bg-blue-50 p-3 rounded-2xl group-hover:bg-blue-100 transition-colors"><Users2 className="h-6 w-6 text-blue-600" /></div>
                            <span className="font-black text-slate-900 uppercase italic tracking-tight">{t.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-slate-100 text-slate-600 border-none font-black text-[9px] uppercase tracking-widest px-3 h-6">
                            {t.memberIds?.length || 0} TÉCNICOS
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Shield className="h-3.5 w-3.5 text-amber-500" />
                            <span className="text-xs font-bold text-slate-600">
                              {staffMembers?.find(s => s.id === t.leaderId)?.name || "Sin líder asignado"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-10">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100" onClick={() => handleEditTeam(t)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-rose-500 hover:bg-rose-50" onClick={() => handleDeleteTeam(t)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIÁLOGO REGISTRO TÉCNICO */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if(!open) setEditingStaff(null); }}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">{editingStaff ? "Editar Técnico" : "Registrar Personal"}</DialogTitle>
            <DialogDescription className="font-medium">Defina los datos básicos para generar el acceso técnico.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStaffSubmit} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre Completo</Label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-12 border-2 rounded-xl font-bold" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">RUT (Solo números)</Label>
                <Input value={formData.identification} onChange={(e) => setFormData({...formData, identification: e.target.value})} className="h-12 border-2 rounded-xl font-bold font-mono" placeholder="123456789" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Rol</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                  <SelectTrigger className="h-12 border-2 rounded-xl font-bold uppercase text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Técnico">Técnico</SelectItem>
                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Teléfono (WhatsApp)</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="h-12 border-2 rounded-xl font-bold" placeholder="56912345678" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-12 border-2 rounded-xl" placeholder="personal@gmail.com" />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl">Guardar y Preparar Invitación</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO CUADRILLA */}
      <Dialog open={isTeamOpen} onOpenChange={(open) => { setIsTeamOpen(open); if(!open) setEditingTeam(null); }}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">
              {editingTeam ? "Editar Cuadrilla" : "Configurar Cuadrilla"}
            </DialogTitle>
            <DialogDescription className="font-medium">Defina el nombre y los miembros permanentes del equipo.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTeamSubmit} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre del Equipo</Label>
              <Input 
                placeholder="Ej: Cuadrilla Solar Norte" 
                value={teamFormData.name} 
                onChange={(e) => setTeamFormData({...teamFormData, name: e.target.value})} 
                className="h-12 border-2 rounded-xl font-bold uppercase" 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Líder de Cuadrilla (Opcional)</Label>
              <Select value={teamFormData.leaderId} onValueChange={(v) => setTeamFormData({...teamFormData, leaderId: v})}>
                <SelectTrigger className="h-12 border-2 rounded-xl">
                  <SelectValue placeholder="Seleccione un responsable..." />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers?.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.role})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Integrantes del Equipo</Label>
              <Card className="border-2 rounded-2xl overflow-hidden bg-slate-50/50">
                <ScrollArea className="h-[200px] p-4">
                  <div className="space-y-3">
                    {staffMembers?.map(s => (
                      <div key={s.id} className="flex items-center space-x-3">
                        <Checkbox 
                          id={`member-${s.id}`} 
                          checked={teamFormData.memberIds.includes(s.id)}
                          onCheckedChange={(checked) => {
                            const next = checked 
                              ? [...teamFormData.memberIds, s.id]
                              : teamFormData.memberIds.filter(id => id !== s.id);
                            setTeamFormData({...teamFormData, memberIds: next});
                          }}
                        />
                        <label htmlFor={`member-${s.id}`} className="text-xs font-bold text-slate-700 cursor-pointer">
                          {s.name} <span className="text-[9px] font-black text-slate-400 uppercase">({s.role})</span>
                        </label>
                      </div>
                    ))}
                    {(!staffMembers || staffMembers.length === 0) && (
                      <p className="text-[10px] text-center text-slate-400 py-10 italic">Debe registrar técnicos antes de crear cuadrillas.</p>
                    )}
                  </div>
                </ScrollArea>
              </Card>
            </div>

            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl">
                {editingTeam ? "Actualizar Cuadrilla" : "Activar Cuadrilla en Sistema"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO EXCEL */}
      <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2.5rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic">Carga Masiva</DialogTitle>
            <DialogDescription>Importe su flota técnica desde un archivo Excel (.xlsx).</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed space-y-4">
              <p className="text-xs font-bold text-slate-500 leading-relaxed">Asegúrese de usar las columnas obligatorias: **Nombre, Rol, RUT, Telefono, Email**.</p>
              <Button variant="outline" className="w-full rounded-xl font-black text-[10px] uppercase h-10 bg-white" onClick={() => XLSX.writeFile(XLSX.utils.book_new(), "Plantilla_Tecnicos.xlsx")}>Descargar Plantilla</Button>
            </div>
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleBulkUpload} accept=".xlsx,.xls" />
            <Button className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-black uppercase tracking-widest text-lg shadow-xl" onClick={() => fileInputRef.current?.click()} disabled={isProcessingBulk}>
              {isProcessingBulk ? <Loader2 className="animate-spin h-6 w-6" /> : <><FileUp className="h-6 w-6 mr-2" /> Subir Archivo</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
