
"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, where } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, ClipboardPlus, ListChecks, Plus, Trash2, Calendar as CalendarIcon, Clock, Users, QrCode } from "lucide-react";
import Link from "next/link";
import { addDays, format, parseISO } from "date-fns";
import { Client, Asset, StaffMember } from "@/lib/types";
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
  const [reviewerRequired, setReviewerRequired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [scheduledDate, setScheduledDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [durationDays, setDurationDays] = useState(1);
  const [checklist, setChecklist] = useState<{task: string}[]>([]);
  const [newTask, setNewTask] = useState("");

  // Usar IDs primitivos para las dependencias de las queries para evitar re-renders infinitos
  const companyId = profile?.companyId || "";

  const clientsQuery = useMemoFirebase(() => 
    db && companyId ? collection(db, "companies", companyId, "clients") : null, 
    [db, companyId]
  );
  
  const assetsQuery = useMemoFirebase(() => 
    db && companyId ? collection(db, "companies", companyId, "assets") : null, 
    [db, companyId]
  );
  
  const staffQuery = useMemoFirebase(() => 
    db && companyId ? query(collection(db, "companies", companyId, "staff"), where("active", "==", true)) : null, 
    [db, companyId]
  );

  const { data: clients, isLoading: isClientsLoading } = useCollection<Client>(clientsQuery);
  const { data: assets, isLoading: isAssetsLoading } = useCollection<Asset>(assetsQuery);
  const { data: staffMembers, isLoading: isStaffLoading } = useCollection<StaffMember>(staffQuery);

  const estimatedEndDateStr = useMemo(() => {
    if (!scheduledDate || !durationDays) return "";
    try {
      const start = parseISO(scheduledDate);
      const end = addDays(start, Number(durationDays));
      return format(end, 'yyyy-MM-dd');
    } catch (e) { return ""; }
  }, [scheduledDate, durationDays]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !clientId || !companyId || !profile) return;

    setIsSubmitting(true);
    try {
      const colRef = collection(db, "companies", companyId, "workOrders");
      const newOT = {
        companyId,
        clientId,
        assetId: assetId || null,
        description: description.trim(),
        status: "creada",
        assignedToStaffIds,
        createdByUserId: profile.id,
        reviewerRequired,
        scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null,
        durationDays: Number(durationDays),
        estimatedEndDate: estimatedEndDateStr ? new Date(estimatedEndDateStr).toISOString() : null,
        checklist: checklist.map((item, idx) => ({
          id: `task-${idx}-${Date.now()}`,
          task: item.task,
          completed: false,
        })),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(colRef, newOT);
      toast({ title: "Orden Generada", description: `La orden ${docRef.id} ha sido creada.` });
      router.push(`/work-orders/${docRef.id}`);
    } catch (error: any) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTask = useCallback(() => {
    if (newTask.trim()) {
      setChecklist(prev => [...prev, { task: newTask.trim() }]);
      setNewTask("");
    }
  }, [newTask]);

  if (isUserLoading) {
    return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 py-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/work-orders"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <h2 className="text-3xl font-black tracking-tight">Nueva Orden de Trabajo</h2>
          <p className="text-sm text-muted-foreground uppercase font-bold tracking-widest">Planificación técnica centralizada</p>
        </div>
      </div>

      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-primary/5 border-b py-6">
          <CardTitle className="flex items-center gap-3 text-xl font-black"><ClipboardPlus className="h-6 w-6 text-primary" /> Detalles de la Operación</CardTitle>
        </CardHeader>
        <form onSubmit={handleCreate}>
          <CardContent className="space-y-8 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase text-slate-400 tracking-[0.2em]">Selección de Cliente *</Label>
                <Select value={clientId || ""} onValueChange={setClientId}>
                  <SelectTrigger className="h-12 rounded-xl border-2">
                    <SelectValue placeholder={isClientsLoading ? "Cargando..." : "Busque un cliente..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {(clients || []).map(c => (
                      <SelectItem key={c.id} value={c.id} className="font-bold">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase text-slate-400 tracking-[0.2em]">Maquinaria / Activo</Label>
                <Select value={assetId || "none"} onValueChange={(val) => setAssetId(val === "none" ? "" : val)}>
                  <SelectTrigger className="h-12 rounded-xl border-2">
                    <SelectValue placeholder={isAssetsLoading ? "Cargando..." : "Seleccione equipo (Opcional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin activo específico</SelectItem>
                    {(assets || []).map(a => (
                      <SelectItem key={a.id} value={a.id} className="font-bold">
                        {a.name} <span className="text-[10px] opacity-50 ml-2">[{a.code}]</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 shadow-inner">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest"><CalendarIcon className="h-3 w-3" /> Fecha Inicio</Label>
                <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="h-11 border-2 bg-white font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest"><Clock className="h-3 w-3" /> Plazo (Días)</Label>
                <Input type="number" min="1" value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value) || 1)} className="h-11 border-2 bg-white font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Término Previsto</Label>
                <div className="h-11 px-4 flex items-center bg-white border-2 rounded-xl font-black text-primary">
                  {estimatedEndDateStr ? format(parseISO(estimatedEndDateStr), 'dd/MM/yyyy') : '...'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-amber-50 border-2 border-amber-100 rounded-2xl">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-amber-600" />
                  <Label className="text-amber-900 font-black text-sm">Validación Externa Requerida</Label>
                </div>
                <p className="text-[10px] text-amber-700 font-medium">Requiere firma del cliente desde su propio dispositivo vía QR/Email.</p>
              </div>
              <Switch checked={reviewerRequired} onCheckedChange={setReviewerRequired} />
            </div>

            <div className="space-y-4">
              <Label className="font-black text-[10px] uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2"><Users className="h-4 w-4" /> Personal Técnico Asignado</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {staffMembers?.map(staff => (
                  <label 
                    key={staff.id} 
                    className={cn(
                      "flex items-center space-x-4 border-2 p-4 rounded-2xl transition-all cursor-pointer",
                      assignedToStaffIds.includes(staff.id) ? "border-primary bg-primary/5 shadow-sm" : "bg-white hover:border-slate-300"
                    )}
                  >
                    <Checkbox 
                      checked={assignedToStaffIds.includes(staff.id)} 
                      onCheckedChange={() => {
                        setAssignedToStaffIds(prev => 
                          prev.includes(staff.id) ? prev.filter(id => id !== staff.id) : [...prev, staff.id]
                        );
                      }} 
                    />
                    <div className="flex flex-col">
                      <p className="font-black text-sm text-slate-900">{staff.name}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{staff.role}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-black text-[10px] uppercase text-slate-400 tracking-[0.2em]">Alcance de los Trabajos *</Label>
              <Textarea 
                placeholder="Describa el servicio técnico a realizar..." 
                className="min-h-[120px] rounded-2xl border-2 p-4 text-sm" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
              />
            </div>

            <div className="space-y-4 pt-6 border-t-2 border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <ListChecks className="h-5 w-5 text-primary" />
                <Label className="font-black text-[10px] uppercase text-slate-400 tracking-[0.2em]">Checklist de Ejecución</Label>
              </div>
              <div className="flex gap-3">
                <Input 
                  placeholder="Añadir ítem de control..." 
                  value={newTask} 
                  onChange={(e) => setNewTask(e.target.value)} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTask();
                    }
                  }} 
                  className="h-12 rounded-xl border-2"
                />
                <Button 
                  type="button" 
                  onClick={handleAddTask} 
                  variant="outline" 
                  className="h-12 w-12 border-2 rounded-xl shrink-0"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              {checklist.length > 0 && (
                <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border-2 border-dashed">
                  {checklist.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-xl border shadow-sm group">
                      <span className="text-sm font-bold text-slate-700">{idx + 1}. {item.task}</span>
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" 
                        onClick={() => setChecklist(prev => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t py-8 px-8 bg-slate-50 mt-10">
            <Button variant="ghost" type="button" asChild disabled={isSubmitting} className="font-bold">
              <Link href="/work-orders">Descartar</Link>
            </Button>
            <Button 
              type="submit" 
              size="lg" 
              disabled={isSubmitting || !description.trim() || !clientId} 
              className="h-14 px-10 rounded-2xl font-black text-base shadow-xl shadow-primary/20"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Generar Orden de Trabajo"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
