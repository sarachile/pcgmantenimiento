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
  AlertTriangle,
  Edit,
  MessageCircle,
  Lock
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { StaffMember, Team } from "@/lib/types";
import * as XLSX from "xlsx";
import { usePlanLimits } from "@/hooks/use-plan-limits";

export default function TeamPage() {
  const { profile, isLoading: isAuthLoading } = useUser();
  const { maxTechs, canAddTech, techCount, planName } = usePlanLimits();
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

  const [formData, setFormData] = useState({ name: "", role: "Técnico", identification: "", phone: "", email: "" });
  const [teamFormData, setTeamFormData] = useState({ name: "", memberIds: [] as string[] });

  const staffQuery = useMemoFirebase(() => db && profile?.companyId ? collection(db, "companies", profile.companyId, "staff") : null, [db, profile?.companyId]);
  const teamsQuery = useMemoFirebase(() => db && profile?.companyId ? collection(db, "companies", profile.companyId, "teams") : null, [db, profile?.companyId]);

  const { data: staffMembers, isLoading: isStaffLoading } = useCollection<StaffMember>(staffQuery);
  const { data: teams, isLoading: isTeamsLoading } = useCollection<Team>(teamsQuery);

  const filteredStaff = (staffMembers || []).filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredTeams = (teams || []).filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const isAtLimit = !canAddTech && !editingStaff;

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !profile?.companyId) return;
    if (isAtLimit) { toast({ title: "Plan Completo", description: `Has alcanzado el límite de ${maxTechs} técnicos.`, variant: "destructive" }); return; }

    const dataToSave = { ...formData, companyId: profile.companyId, active: true, createdAt: serverTimestamp() };
    if (editingStaff) {
      updateDocumentNonBlocking(doc(db, "companies", profile.companyId, "staff", editingStaff.id), { ...dataToSave, updatedAt: serverTimestamp() });
      toast({ title: "Técnico actualizado" });
    } else {
      addDocumentNonBlocking(collection(db, "companies", profile.companyId, "staff"), dataToSave);
      toast({ title: "Técnico registrado" });
    }
    setIsCreateOpen(false);
    setEditingStaff(null);
  };

  const handleEditStaff = (staff: StaffMember) => {
    setEditingStaff(staff);
    setFormData({ name: staff.name, role: staff.role, identification: staff.identification || "", phone: staff.phone || "", email: staff.email || "" });
    setIsCreateOpen(true);
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
          await addDocumentNonBlocking(colRef, { name: row.Nombre || "Sin Nombre", role: row.Rol || "Técnico", identification: row.RUT || "", phone: String(row.Telefono || ""), email: row.Email || "", companyId: profile.companyId, active: true, createdAt: serverTimestamp() });
          count++;
        }
        toast({ title: "Importación Exitosa", description: `Se cargaron ${count} registros.` });
        setIsBulkOpen(false);
      } catch (e) { toast({ title: "Error Excel", variant: "destructive" }); } finally { setIsProcessingBulk(false); }
    };
    reader.readAsBinaryString(file);
  };

  if (isAuthLoading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div><h2 className="text-3xl font-black italic">Gestión de Equipos</h2><p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Escalabilidad Operativa</p></div>
        </div>
      </div>

      <Tabs defaultValue="staff" className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <TabsList className="bg-muted/50 p-1 rounded-xl h-12">
            <TabsTrigger value="staff" className="rounded-lg px-6 font-bold">Personal ({staffMembers?.length || 0})</TabsTrigger>
            <TabsTrigger value="teams" className="rounded-lg px-6 font-bold">Cuadrillas ({teams?.length || 0})</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl border-emerald-200 text-emerald-700 bg-emerald-50" onClick={() => setIsBulkOpen(true)}><FileUp className="h-4 w-4 mr-2" /> Excel</Button>
            <Button className="rounded-xl font-black" onClick={() => setIsCreateOpen(true)} disabled={isAtLimit}><UserPlus className="h-4 w-4 mr-2" /> Nuevo Técnico</Button>
          </div>
        </div>

        <TabsContent value="staff">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-white border-b flex flex-row items-center justify-between p-6">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Buscar..." className="pl-10 h-11 border-none bg-slate-50 rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cupos Utilizados</p>
                <p className={cn("text-lg font-black", isAtLimit ? "text-rose-600" : "text-slate-900")}>{staffMembers?.length || 0} / {maxTechs}</p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow><TableHead className="pl-6 font-black uppercase text-[10px]">Nombre / ID</TableHead><TableHead className="font-black uppercase text-[10px]">Rol</TableHead><TableHead className="font-black uppercase text-[10px]">Estado</TableHead><TableHead className="text-right pr-6 font-black uppercase text-[10px]">Acciones</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((s) => (
                    <TableRow key={s.id} className="hover:bg-slate-50">
                      <TableCell className="pl-6 py-4"><span className="font-bold text-slate-900">{s.name}</span><br/><span className="text-[10px] text-slate-400">{s.identification}</span></TableCell>
                      <TableCell><Badge variant="outline" className="text-[9px] uppercase font-black">{s.role}</Badge></TableCell>
                      <TableCell><Badge className={s.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100"}>{s.active ? "ACTIVO" : "INACTIVO"}</Badge></TableCell>
                      <TableCell className="text-right pr-6"><Button variant="ghost" size="icon" onClick={() => handleEditStaff(s)}><Edit className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIÁLOGO REGISTRO */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem]">
          <DialogHeader><DialogTitle className="text-2xl font-black italic">{editingStaff ? "Editar Técnico" : "Registrar Personal"}</DialogTitle></DialogHeader>
          <form onSubmit={handleStaffSubmit} className="space-y-4 py-4">
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Nombre Completo</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-12 border-2 rounded-xl" required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">RUT</Label><Input value={formData.identification} onChange={(e) => setFormData({...formData, identification: e.target.value})} className="h-12 border-2 rounded-xl" /></div>
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Rol</Label><Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}><SelectTrigger className="h-12 border-2 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Técnico">Técnico</SelectItem><SelectItem value="Supervisor">Supervisor</SelectItem></SelectContent></Select></div>
            </div>
            <DialogFooter><Button type="submit" className="w-full h-12 font-black uppercase tracking-widest">Guardar Registro</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO EXCEL */}
      <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2.5rem]">
          <DialogHeader><DialogTitle className="text-2xl font-black">Carga Masiva</DialogTitle></DialogHeader>
          <div className="py-6 space-y-6">
            <Button variant="outline" className="w-full" onClick={() => XLSX.writeFile(XLSX.utils.book_new(), "Plantilla.xlsx")}>Descargar Plantilla</Button>
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleBulkUpload} />
            <Button className="w-full h-16 rounded-xl bg-emerald-600" onClick={() => fileInputRef.current?.click()} disabled={isProcessingBulk}>{isProcessingBulk ? <Loader2 className="animate-spin" /> : "Subir Archivo"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
