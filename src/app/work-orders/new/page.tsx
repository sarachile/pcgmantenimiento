
"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, where, doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, ClipboardPlus, ListChecks, Plus, Trash2, Calendar as CalendarIcon, Clock, Users, QrCode, Star, ShieldCheck, Ruler, Building2, MapPin, Mail, AlertTriangle, User, Hash, Users2, Zap } from "lucide-react";
import Link from "next/link";
import { addDays, format, parseISO } from "date-fns";
import { Client, Asset, StaffMember, Team } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function NewWorkOrderPage() {
  const { profile, isLoading: isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [assignedToStaffIds, setAssignedToStaffIds] = useState<string[]>([]);
  const [assignedTeamId, setAssignedTeamId] = useState<string | null>(null);
  const [assignmentMode, setAssignmentMode] = useState<'team' | 'individual'>('individual');
  
  const [reviewerRequired, setReviewerRequired] = useState(true);
  const [evaluationRequired, setEvaluationRequired] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [scheduledDate, setScheduledDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [durationDays, setDurationDays] = useState(1);
  const [serviceQuantity, setServiceQuantity] = useState("");
  const [serviceUnit, setServiceUnit] = useState("Unidades");
  const [checklist, setChecklist] = useState<{task: string}[]>([]);
  const [newTask, setNewTask] = useState("");
  const [externalEmail, setExternalEmail] = useState("");
  const [externalName, setExternalName] = useState("");

  const companyId = profile?.companyId || "";

  const clientsQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "clients") : null, [db, companyId]);
  const assetsQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "assets") : null, [db, companyId]);
  const staffQuery = useMemoFirebase(() => db && companyId ? query(collection(db, "companies", companyId, "staff"), where("active", "==", true)) : null, [db, companyId]);
  const teamsQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "teams") : null, [db, companyId]);

  const { data: clients, isLoading: isClientsLoading } = useCollection<Client>(clientsQuery);
  const { data: assets, isLoading: isAssetsLoading } = useCollection<Asset>(assetsQuery);
  const { data: staffMembers } = useCollection<StaffMember>(staffQuery);
  const { data: teams } = useCollection<Team>(teamsQuery);

  const selectedClient = useMemo(() => clients?.find(c => c.id === clientId), [clients, clientId]);

  const handleSelectTeam = (teamId: string) => {
    const team = teams?.find(t => t.id === teamId);
    if (team) {
      setAssignedTeamId(team.id);
      setAssignedToStaffIds(team.memberIds);
      toast({ title: `Cuadrilla "${team.name}" cargada`, description: `${team.memberIds.length} técnicos asignados automáticamente.` });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !clientId || !companyId || !profile) return;

    setIsSubmitting(true);
    try {
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      const colRef = collection(db!, "companies", companyId, "workOrders");
      
      const newOT = {
        companyId,
        clientId,
        assetId: assetId || null,
        description: description.trim(),
        status: "creada",
        assignedToStaffIds,
        assignedTeamId: assignmentMode === 'team' ? assignedTeamId : null,
        createdByUserId: profile.id,
        reviewerRequired,
        evaluationRequired,
        approvalPin: pin,
        scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null,
        durationDays: Number(durationDays),
        serviceQuantity: serviceQuantity ? Number(serviceQuantity) : null,
        serviceUnit: serviceUnit || null,
        checklist: checklist.map((item, idx) => ({ id: `task-${idx}-${Date.now()}`, task: item.task, completed: false })),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(colRef, newOT);
      toast({ title: "Orden Generada", description: `OT ${docRef.id} creada exitosamente.` });
      router.push(`/work-orders/${docRef.id}`);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 py-8 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/work-orders"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <h2 className="text-3xl font-black tracking-tight">Nueva Orden de Trabajo</h2>
          <p className="text-sm text-muted-foreground uppercase font-bold tracking-widest italic">Configuración de Operación Industrial</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-8">
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-8">
            <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tighter italic">
              <ClipboardPlus className="h-6 w-6 text-blue-400" /> 1. Datos del Servicio
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cliente / Entidad</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="h-12 rounded-xl border-2">
                    <SelectValue placeholder="Seleccione cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map(c => <SelectItem key={c.id} value={c.id} className="font-bold">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Equipo / Activo</Label>
                <Select value={assetId} onValueChange={setAssetId}>
                  <SelectTrigger className="h-12 rounded-xl border-2">
                    <SelectValue placeholder="Seleccione equipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin activo específico</SelectItem>
                    {assets?.map(a => <SelectItem key={a.id} value={a.id} className="font-bold">{a.name} [{a.code}]</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Descripción de los Trabajos</Label>
              <Textarea 
                placeholder="Detalle el alcance técnico de la intervención..." 
                className="min-h-[120px] rounded-2xl border-2 p-4 text-sm font-medium" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-primary p-8">
            <CardTitle className="flex items-center gap-3 text-xl font-black text-white uppercase tracking-tighter italic">
              <Users className="h-6 w-6" /> 2. Asignación de Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <Tabs defaultValue="individual" onValueChange={(v: any) => setAssignmentMode(v)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-14 bg-slate-100 rounded-2xl p-1 mb-6">
                <TabsTrigger value="individual" className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary">Asignación Directa</TabsTrigger>
                <TabsTrigger value="team" className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary">Carga de Cuadrilla</TabsTrigger>
              </TabsList>

              <TabsContent value="individual" className="space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Seleccione técnicos manualmente ({assignedToStaffIds.length})</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                  {staffMembers?.map(s => (
                    <label key={s.id} className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all",
                      assignedToStaffIds.includes(s.id) ? "border-primary bg-primary/5 shadow-inner" : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
                    )}>
                      <Checkbox checked={assignedToStaffIds.includes(s.id)} onCheckedChange={() => {
                        setAssignedToStaffIds(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]);
                        setAssignedTeamId(null);
                      }} />
                      <div className="flex-1">
                        <p className="text-xs font-black text-slate-900">{s.name}</p>
                        <p className="text-[9px] font-black uppercase text-slate-400">{s.role}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="team" className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Seleccionar Cuadrilla de Trabajo</Label>
                  <Select value={assignedTeamId || ""} onValueChange={handleSelectTeam}>
                    <SelectTrigger className="h-14 rounded-2xl border-2 text-primary font-black uppercase text-xs tracking-widest">
                      <SelectValue placeholder="Busque una cuadrilla..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {teams?.map(t => <SelectItem key={t.id} value={t.id} className="font-black py-3">{t.name.toUpperCase()} ({t.memberIds.length} TÉCNICOS)</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {assignedTeamId && (
                  <div className="p-6 bg-slate-900 text-white rounded-[2rem] space-y-4 shadow-xl">
                    <p className="text-[10px] font-black uppercase text-blue-400 tracking-[0.2em] flex items-center gap-2">
                      <Zap className="h-3 w-3" /> Resumen de Cuadrilla Cargada
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {teams?.find(t => t.id === assignedTeamId)?.memberIds.map(mid => {
                        const m = staffMembers?.find(s => s.id === mid);
                        return <Badge key={mid} variant="outline" className="bg-white/10 text-white border-none font-bold text-[9px]">{m?.name}</Badge>;
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-slate-50">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-emerald-600" /> 3. Protocolos y Cierre
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-slate-100 flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="font-black text-xs uppercase text-slate-900 tracking-tighter flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-amber-600" /> Validación Externa
                  </Label>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Firma del cliente vía PIN/QR</p>
                </div>
                <Switch checked={reviewerRequired} onCheckedChange={setReviewerRequired} />
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-slate-100 flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="font-black text-xs uppercase text-slate-900 tracking-tighter flex items-center gap-2">
                    <Star className="h-4 w-4 text-emerald-600" /> Evaluación
                  </Label>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Calificación por estrellas</p>
                </div>
                <Switch checked={evaluationRequired} onCheckedChange={setEvaluationRequired} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Inicio Programado</Label>
                <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="h-12 border-2 rounded-xl font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Plazo (Días)</Label>
                <Input type="number" min="1" value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value) || 1)} className="h-12 border-2 rounded-xl font-bold" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-8 pt-0">
            <Button type="submit" disabled={isSubmitting || !clientId || !description.trim() || assignedToStaffIds.length === 0} className="w-full h-16 rounded-2xl bg-primary text-white font-black text-lg uppercase tracking-widest shadow-xl shadow-primary/20 gap-3">
              {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : <><Plus className="h-6 w-6" /> Generar Orden de Trabajo</>}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
