
"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp, query, where, doc, getDoc, setDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Loader2, 
  ClipboardPlus, 
  Plus, 
  Users, 
  Edit2, 
  Trash2,
  Camera,
  ShieldCheck,
  Globe,
  QrCode,
  Star
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Client, Asset, StaffMember, Team } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CHILE_REGIONS } from "@/lib/chile-data";

export const dynamic = 'force-dynamic';

function NewWorkOrderContent() {
  const { profile, isLoading: isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const editId = searchParams.get('editId');
  const duplicateFrom = searchParams.get('duplicateFrom');
  const isEditing = !!editId;

  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [requestedByName, setRequestedByName] = useState("");
  const [assignedToStaffIds, setAssignedToStaffIds] = useState<string[]>([]);
  const [assignedTeamId, setAssignedTeamId] = useState<string | null>(null);
  const [assignmentMode, setAssignmentMode] = useState<'team' | 'individual'>('individual');
  
  // Direccionamiento Estructurado
  const [region, setRegion] = useState("");
  const [city, setCity] = useState(""); 
  const [commune, setCommune] = useState("");
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [locationComment, setLocationComment] = useState("");

  const [reviewerRequired, setReviewerRequired] = useState(false);
  const [evaluationRequired, setEvaluationRequired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [durationDays, setDurationDays] = useState(1);
  const [serviceQuantity, setServiceQuantity] = useState("");
  const [serviceUnit, setServiceUnit] = useState("Unidades");
  const [checklist, setChecklist] = useState<{task: string}[]>([]);

  const selectedRegion = useMemo(() => CHILE_REGIONS.find(r => r.name === region), [region]);

  useEffect(() => {
    if (!isEditing) setScheduledDate(format(new Date(), 'yyyy-MM-dd'));
  }, [isEditing]);

  const companyId = profile?.companyId || "";

  const clientsQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "clients") : null, [db, companyId]);
  const assetsQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "assets") : null, [db, companyId]);
  const staffQuery = useMemoFirebase(() => db && companyId ? query(collection(db, "companies", companyId, "staff"), where("active", "==", true)) : null, [db, companyId]);
  const teamsQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "teams") : null, [db, companyId]);

  const { data: rawClients } = useCollection<Client>(clientsQuery);
  const { data: rawAssets } = useCollection<Asset>(assetsQuery);
  const { data: staffMembers } = useCollection<StaffMember>(staffQuery);
  const { data: teams } = useCollection<Team>(teamsQuery);

  const clients = useMemo(() => (rawClients || []).filter(c => !c.isDeleted), [rawClients]);
  const assets = useMemo(() => (rawAssets || []).filter(a => !a.isDeleted), [rawAssets]);

  // Auto-fill client defaults
  useEffect(() => {
    if (!isEditing && !duplicateFrom && clientId && clients) {
      const selectedClient = clients.find(c => c.id === clientId);
      if (selectedClient) {
        setRegion(selectedClient.region || "");
        setTimeout(() => {
          setCity(selectedClient.city || "");
          setCommune(selectedClient.commune || "");
          setStreet(selectedClient.street || "");
          setStreetNumber(selectedClient.streetNumber || "");
          setComplement(selectedClient.complement || "");
          setRequestedByName(selectedClient.contactName || "");
        }, 50);
        toast({ title: "Dirección de cliente cargada" });
      }
    }
  }, [clientId, clients, isEditing, duplicateFrom, toast]);

  useEffect(() => {
    const sourceId = editId || duplicateFrom;
    if (sourceId && db && companyId) {
      const fetchData = async () => {
        setIsLoadingData(true);
        try {
          const docRef = doc(db, "companies", companyId, "workOrders", sourceId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            setDescription(data.description || "");
            setClientId(data.clientId || "");
            setAssetId(data.assetId === 'none' ? "" : (data.assetId || ""));
            setRegion(data.region || "");
            setCity(data.city || "");
            setCommune(data.commune || "");
            setStreet(data.street || "");
            setStreetNumber(data.streetNumber || "");
            setComplement(data.complement || "");
            setLocationComment(data.locationComment || "");
            setRequestedByName(data.requestedByName || "");
            setAssignedToStaffIds(data.assignedToStaffIds || []);
            setAssignmentMode(data.assignedTeamId ? 'team' : 'individual');
            setAssignedTeamId(data.assignedTeamId || null);
            setReviewerRequired(data.reviewerRequired ?? false);
            setEvaluationRequired(data.evaluationRequired ?? false);
            setServiceQuantity(data.serviceQuantity?.toString() || "");
            setServiceUnit(data.serviceUnit || "Unidades");
            if (data.scheduledDate) {
              const d = data.scheduledDate.toDate ? data.scheduledDate.toDate() : new Date(data.scheduledDate);
              setScheduledDate(format(d, 'yyyy-MM-dd'));
            }
            setDurationDays(data.durationDays || 1);
            if (data.checklist) setChecklist(data.checklist.map((i: any) => ({ task: i.task })));
          }
        } catch (e) { console.error(e); } finally { setIsLoadingData(false); }
      };
      fetchData();
    }
  }, [editId, duplicateFrom, db, companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // VALIDACIÓN GRANULAR
    const missingFields = [];
    if (!description.trim()) missingFields.push("Descripción técnica");
    if (!clientId) missingFields.push("Cliente");
    if (!region) missingFields.push("Región");
    if (!city) missingFields.push("Ciudad");
    if (!commune) missingFields.push("Comuna");
    if (!street) missingFields.push("Calle");
    if (!streetNumber) missingFields.push("Número de calle");
    if (assignedToStaffIds.length === 0) missingFields.push("Técnico asignado");
    if (!profile) missingFields.push("Sesión de usuario");

    if (missingFields.length > 0) {
      toast({ 
        title: "Faltan campos obligatorios", 
        description: `Por favor complete: ${missingFields.join(", ")}.`,
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const fullAddress = `${street} ${streetNumber}${complement ? ', ' + complement : ''}, ${commune}, ${city}, ${region}`;
      const commonData = {
        clientId,
        assetId: assetId === 'none' ? null : (assetId || null),
        description: description.trim(),
        serviceLocation: fullAddress,
        region, city, commune, street, streetNumber, complement, locationComment,
        requestedByName: requestedByName.trim(),
        assignedToStaffIds,
        assignedTeamId: assignmentMode === 'team' ? assignedTeamId : null,
        reviewerRequired,
        evaluationRequired,
        scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null,
        durationDays: Number(durationDays),
        serviceQuantity: serviceQuantity ? Number(serviceQuantity) : null,
        serviceUnit: serviceUnit || null,
        checklist: checklist.map((item, idx) => ({ 
          id: `task-${idx}-${Date.now()}`, 
          task: item.task, 
          completed: false 
        })),
        updatedAt: serverTimestamp(),
      };

      if (isEditing) {
        const docRef = doc(db!, "companies", companyId, "workOrders", editId);
        updateDocumentNonBlocking(docRef, commonData);
        toast({ title: "Orden Actualizada" });
        router.push(`/work-orders/${editId}`);
      } else {
        const shortId = `OT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const docRef = doc(db!, "companies", companyId, "workOrders", shortId);
        await setDoc(docRef, { ...commonData, id: shortId, companyId, status: "creada", createdByUserId: profile.id, approvalPin: Math.floor(100000 + Math.random() * 900000).toString(), createdAt: serverTimestamp() });
        toast({ title: "Orden Generada" });
        router.push(`/work-orders/${shortId}`);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  if (isUserLoading || isLoadingData) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 py-8 pb-32">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href={isEditing ? `/work-orders/${editId}` : "/work-orders"}><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 italic leading-none">{isEditing ? "Editar Orden" : "Generar Orden"}</h2>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] mt-2">Direccionamiento Granular Obligatorio</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className={cn("text-white p-8", isEditing ? "bg-amber-600" : "bg-slate-900")}>
            <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tighter italic">
              {isEditing ? <Edit2 className="h-6 w-6" /> : <ClipboardPlus className="h-6 w-6 text-blue-400" />} 1. Datos del Servicio
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cliente / Entidad *</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="h-12 rounded-xl border-2"><SelectValue placeholder="Seleccione cliente..." /></SelectTrigger>
                  <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={c.id} className="font-bold">{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Equipo / Activo</Label>
                <Select value={assetId} onValueChange={setAssetId}>
                  <SelectTrigger className="h-12 rounded-xl border-2"><SelectValue placeholder="Seleccione equipo..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin activo específico</SelectItem>
                    {assets?.map(a => <SelectItem key={a.id} value={a.id} className="font-bold">{a.name} [{a.code}]</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border-2 border-slate-100">
              <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /><p className="text-[10px] font-black uppercase text-primary tracking-widest">Direccionamiento Estructurado</p></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Región *</Label>
                  <Select value={region} onValueChange={(v) => { setRegion(v); setCity(""); setCommune(""); }}>
                    <SelectTrigger className="h-12 rounded-xl border-2 bg-white"><SelectValue placeholder="Región" /></SelectTrigger>
                    <SelectContent>{CHILE_REGIONS.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Ciudad *</Label>
                  <Select key={`city-${region}`} value={city} onValueChange={(v) => { setCity(v); setCommune(""); }} disabled={!region}>
                    <SelectTrigger className="h-12 rounded-xl border-2 bg-white"><SelectValue placeholder="Ciudad" /></SelectTrigger>
                    <SelectContent>{selectedRegion?.cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Comuna *</Label>
                  <Select key={`commune-${city}`} value={commune} onValueChange={setCommune} disabled={!city}>
                    <SelectTrigger className="h-12 rounded-xl border-2 bg-white"><SelectValue placeholder="Comuna" /></SelectTrigger>
                    <SelectContent>{selectedRegion?.communes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Calle / Avenida *</Label>
                  <Input value={street} onChange={e => setStreet(e.target.value)} className="h-12 rounded-xl border-2 bg-white" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">N° *</Label>
                  <Input value={streetNumber} onChange={e => setStreetNumber(e.target.value)} className="h-12 rounded-xl border-2 bg-white" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Depto / Casa / Of</Label>
                  <Input value={complement} onChange={e => setComplement(e.target.value)} className="h-12 rounded-xl border-2 bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Punto Específico (Recepción, Auditorio...)</Label>
                  <Input value={locationComment} onChange={e => setLocationComment(e.target.value)} className="h-12 rounded-xl border-2 bg-white" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Descripción Técnica del Servicio *</Label>
              <Textarea placeholder="Detalle el alcance..." className="min-h-[100px] rounded-2xl border-2 p-4 text-sm bg-slate-50/50" value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Magnitud</Label><Input type="number" value={serviceQuantity} onChange={e => setServiceQuantity(e.target.value)} className="h-12 rounded-xl border-2 font-bold" /></div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Unidad</Label>
                <Select value={serviceUnit} onValueChange={setServiceUnit}>
                  <SelectTrigger className="h-12 rounded-xl border-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Unidades", "Metros", "Kg", "Lt", "Hr"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-primary p-8"><CardTitle className="flex items-center gap-3 text-xl font-black text-white uppercase tracking-tighter italic"><Users className="h-6 w-6" /> 2. Personal Técnico *</CardTitle></CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto">
              {staffMembers?.map(s => (
                <label key={s.id} className={cn("flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all", assignedToStaffIds.includes(s.id) ? "border-primary bg-primary/5" : "border-slate-100 bg-white")}>
                  <Checkbox checked={assignedToStaffIds.includes(s.id)} onCheckedChange={() => setAssignedToStaffIds(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])} />
                  <div className="flex-1 min-w-0"><p className="text-xs font-black text-slate-900 truncate">{s.name}</p><p className="text-[9px] font-black uppercase text-slate-400">{s.role}</p></div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-8"><CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tighter italic"><Camera className="h-6 w-6 text-amber-400" /> 3. Protocolos Técnicos</CardTitle></CardHeader>
          <CardContent className="p-8 space-y-4">
            <div className="flex items-center justify-between"><Label className="text-[10px] font-black uppercase text-slate-400">Items de Inspección</Label><Button type="button" variant="outline" size="sm" onClick={() => setChecklist([...checklist, { task: "" }])} className="h-10 rounded-xl font-black text-[10px] uppercase gap-2 border-primary/20 text-primary"><Plus className="h-4 w-4" /> Añadir Punto</Button></div>
            {checklist.map((item, idx) => (
              <div key={idx} className="flex gap-2"><Input value={item.task} onChange={e => { const n = [...checklist]; n[idx].task = e.target.value; setChecklist(n); }} className="h-12 rounded-xl border-2 font-bold" /><Button type="button" variant="ghost" size="icon" onClick={() => setChecklist(checklist.filter((_, i) => i !== idx))} className="h-12 w-12 text-rose-500 rounded-xl"><Trash2 className="h-5 w-5" /></Button></div>
            ))}
          </CardContent>
        </Card>

        <Card className={cn("border-none shadow-xl rounded-[2.5rem] overflow-hidden transition-all", (reviewerRequired || evaluationRequired) ? "bg-indigo-50/50" : "bg-slate-50")}>
          <CardHeader className="p-8 pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-3 text-slate-900"><ShieldCheck className="h-6 w-6 text-emerald-600" /> 4. Cierre y Validación</CardTitle>
              <div className="flex gap-2">
                {(reviewerRequired || evaluationRequired) && (
                  <Badge className="bg-indigo-600 text-white font-black text-[8px] uppercase tracking-[0.2em] animate-pulse">Interacción con Cliente Activa</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl border-2 flex items-center justify-between bg-white"><div className="space-y-1"><Label className="font-black text-xs uppercase tracking-tighter flex items-center gap-2"><QrCode className="h-4 w-4" /> Validación Externa</Label></div><Switch checked={reviewerRequired} onCheckedChange={setReviewerRequired} /></div>
              <div className="p-6 rounded-3xl border-2 flex items-center justify-between bg-white"><div className="space-y-1"><Label className="font-black text-xs uppercase tracking-tighter flex items-center gap-2"><Star className="h-4 w-4" /> Evaluación</Label></div><Switch checked={evaluationRequired} onCheckedChange={setEvaluationRequired} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Inicio Programado</Label><Input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="h-12 border-2 rounded-xl font-bold" /></div>
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Plazo (Días)</Label><Input type="number" min="1" value={durationDays} onChange={e => setDurationDays(Number(e.target.value) || 1)} className="h-12 border-2 rounded-xl font-bold" /></div>
            </div>
          </CardContent>
          <CardFooter className="p-8 pt-0">
            <Button type="submit" disabled={isSubmitting} className={cn("w-full h-20 rounded-[2rem] text-white font-black text-xl uppercase tracking-widest shadow-2xl transition-all", isEditing ? "bg-amber-600 shadow-amber-900/20" : "bg-primary shadow-primary/20 hover:scale-[1.02]")}>
              {isSubmitting ? <Loader2 className="animate-spin h-8 w-8" /> : (isEditing ? <Edit2 className="h-8 w-8 mr-2" /> : <Plus className="h-8 w-8 mr-2" />) + (isEditing ? "Actualizar Orden" : "Activar Orden")}
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
