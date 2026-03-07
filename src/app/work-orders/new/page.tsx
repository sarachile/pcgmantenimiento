"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, where, doc, getDoc } from "firebase/firestore";
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
import { ArrowLeft, Loader2, ClipboardPlus, Plus, Users, Building2, Search, Zap, ShieldCheck, QrCode, Star, Hash, MapPin, User } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Client, Asset, StaffMember, Team } from "@/lib/types";
import { cn } from "@/lib/utils";

function NewWorkOrderContent() {
  const { profile, isLoading: isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [serviceLocation, setServiceLocation] = useState("");
  const [requestedByName, setRequestedByName] = useState("");
  const [assignedToStaffIds, setAssignedToStaffIds] = useState<string[]>([]);
  const [assignedTeamId, setAssignedTeamId] = useState<string | null>(null);
  const [assignmentMode, setAssignmentMode] = useState<'team' | 'individual'>('individual');
  
  const [staffSearch, setStaffSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [reviewerRequired, setReviewerRequired] = useState(true);
  const [evaluationRequired, setEvaluationRequired] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [scheduledDate, setScheduledDate] = useState("");
  const [durationDays, setDurationDays] = useState(1);
  const [serviceQuantity, setServiceQuantity] = useState("");
  const [serviceUnit, setServiceUnit] = useState("Unidades");
  const [checklist, setChecklist] = useState<{task: string}[]>([]);

  useEffect(() => {
    setScheduledDate(format(new Date(), 'yyyy-MM-dd'));
  }, []);

  const companyId = profile?.companyId || "";
  const duplicateFrom = searchParams.get('duplicateFrom');

  const clientsQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "clients") : null, [db, companyId]);
  const assetsQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "assets") : null, [db, companyId]);
  const staffQuery = useMemoFirebase(() => db && companyId ? query(collection(db, "companies", companyId, "staff"), where("active", "==", true)) : null, [db, companyId]);
  const teamsQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "teams") : null, [db, companyId]);

  const { data: clients } = useCollection<Client>(clientsQuery);
  const { data: assets } = useCollection<Asset>(assetsQuery);
  const { data: staffMembers } = useCollection<StaffMember>(staffQuery);
  const { data: teams } = useCollection<Team>(teamsQuery);

  useEffect(() => {
    if (clientId && clients) {
      const selected = clients.find(c => c.id === clientId);
      if (selected) {
        if (!serviceLocation) setServiceLocation(selected.address);
        if (!requestedByName) setRequestedByName(selected.contactName || "");
      }
    }
  }, [clientId, clients, serviceLocation, requestedByName]);

  useEffect(() => {
    if (duplicateFrom && db && companyId) {
      const fetchSource = async () => {
        try {
          const docRef = doc(db, "companies", companyId, "workOrders", duplicateFrom);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            setDescription(data.description || "");
            setClientId(data.clientId || "");
            setAssetId(data.assetId === 'none' ? "" : (data.assetId || ""));
            setServiceLocation(data.serviceLocation || "");
            setRequestedByName(data.requestedByName || "");
            setAssignedToStaffIds(data.assignedToStaffIds || []);
            setAssignedTeamId(data.assignedTeamId || null);
            setAssignmentMode(data.assignedTeamId ? 'team' : 'individual');
            setReviewerRequired(data.reviewerRequired ?? true);
            setEvaluationRequired(data.evaluationRequired ?? true);
            setServiceQuantity(data.serviceQuantity?.toString() || "");
            setServiceUnit(data.serviceUnit || "Unidades");
            if (data.checklist) {
              setChecklist(data.checklist.map((i: any) => ({ task: i.task })));
            }
            toast({ title: "Plantilla Cargada", description: "Se han copiado los datos de la orden anterior." });
          }
        } catch (e) {
          console.error("Error duplicando OT:", e);
        }
      };
      fetchSource();
    }
  }, [duplicateFrom, db, companyId, toast]);

  const uniqueRoles = useMemo(() => {
    if (!staffMembers) return [];
    const roles = Array.from(new Set(staffMembers.map(s => s.role)));
    return roles.sort();
  }, [staffMembers]);

  const filteredStaff = useMemo(() => {
    if (!staffMembers) return [];
    return staffMembers.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(staffSearch.toLowerCase()) || 
                           (s.identification?.toLowerCase().includes(staffSearch.toLowerCase()));
      const matchesRole = roleFilter === "all" || s.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [staffMembers, staffSearch, roleFilter]);

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
        assetId: assetId === 'none' ? null : (assetId || null),
        description: description.trim(),
        serviceLocation: serviceLocation.trim(),
        requestedByName: requestedByName.trim(),
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
        checklist: checklist.map((item, idx) => ({ 
          id: `task-${idx}-${Date.now()}`, 
          task: item.task, 
          completed: false 
        })),
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
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link href="/work-orders"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 italic leading-none">
              {duplicateFrom ? "Duplicar Orden" : "Nueva Orden de Trabajo"}
            </h2>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] mt-2">
              {duplicateFrom ? "Editando copia de seguridad" : "Configuración de Operación Industrial"}
            </p>
          </div>
        </div>
        {duplicateFrom && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-black uppercase text-[10px]">Modo Plantilla</Badge>
        )}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                  <MapPin className="h-3 w-3" /> Lugar del Servicio
                </Label>
                <Input 
                  placeholder="Dirección de la intervención" 
                  className="h-12 rounded-xl border-2 font-medium"
                  value={serviceLocation}
                  onChange={(e) => setServiceLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                  <User className="h-3 w-3" /> Solicitado Por
                </Label>
                <Input 
                  placeholder="Nombre de quien requiere el servicio" 
                  className="h-12 rounded-xl border-2 font-medium"
                  value={requestedByName}
                  onChange={(e) => setRequestedByName(e.target.value)}
                />
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

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cantidad / Magnitud</Label>
                <Input 
                  type="number" 
                  placeholder="Ej: 500" 
                  className="h-12 rounded-xl border-2 font-bold"
                  value={serviceQuantity}
                  onChange={(e) => setServiceQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Unidad de Medida</Label>
                <Select value={serviceUnit} onValueChange={setServiceUnit}>
                  <SelectTrigger className="h-12 rounded-xl border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unidades">Unidades</SelectItem>
                    <SelectItem value="Metros">Metros</SelectItem>
                    <SelectItem value="Kg">Kilogramos</SelectItem>
                    <SelectItem value="Lt">Litros</SelectItem>
                    <SelectItem value="Hr">Horas</SelectItem>
                    <SelectItem value="Gl">Galones</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            <Tabs value={assignmentMode} onValueChange={(v: any) => setAssignmentMode(v)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-14 bg-slate-100 rounded-2xl p-1 mb-6">
                <TabsTrigger value="individual" className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary">Asignación Directa</TabsTrigger>
                <TabsTrigger value="team" className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary">Carga de Cuadrilla</TabsTrigger>
              </TabsList>

              <TabsContent value="individual" className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Buscar por nombre..." 
                      className="pl-9 h-10 rounded-xl border-none shadow-sm bg-white"
                      value={staffSearch}
                      onChange={(e) => setStaffSearch(e.target.value)}
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="h-10 rounded-xl border-none shadow-sm bg-white font-bold text-xs uppercase tracking-tighter">
                      <SelectValue placeholder="Filtrar por Rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los Roles</SelectItem>
                      {uniqueRoles.map(role => (
                        <SelectItem key={role} value={role}>{role.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Personal Filtrado ({filteredStaff.length})</p>
                    {assignedToStaffIds.length > 0 && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[9px] font-black">{assignedToStaffIds.length} SELECCIONADOS</Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredStaff.map(s => (
                      <label key={s.id} className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all",
                        assignedToStaffIds.includes(s.id) ? "border-primary bg-primary/5 shadow-inner" : "border-slate-100 hover:border-slate-200 bg-white"
                      )}>
                        <Checkbox 
                          checked={assignedToStaffIds.includes(s.id)} 
                          onCheckedChange={() => {
                            setAssignedToStaffIds(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]);
                            setAssignedTeamId(null);
                          }} 
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-slate-900 truncate">{s.name}</p>
                          <p className="text-[9px] font-black uppercase text-slate-400">{s.role}</p>
                        </div>
                      </label>
                    ))}
                  </div>
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
                        return <Badge key={mid} variant="outline" className="bg-white/10 text-white border-none font-bold text-[9px]">{m?.name || "Técnico"}</Badge>;
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
            <CardTitle className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-3 text-slate-900">
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
              {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : <><Plus className="h-6 w-6" /> {duplicateFrom ? "Generar OT desde Copia" : "Generar Orden de Trabajo"}</>}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

export default function NewWorkOrderPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <NewWorkOrderContent />
    </Suspense>
  );
}
