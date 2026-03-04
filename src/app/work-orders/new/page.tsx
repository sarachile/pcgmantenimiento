
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, where } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, ClipboardPlus, ListChecks, Plus, Trash2, Calendar as CalendarIcon, Clock, HardHat, UserPlus } from "lucide-react";
import Link from "next/link";
import { addDays, format, parseISO } from "date-fns";
import { Client, Asset, StaffMember } from "@/lib/types";

export default function NewWorkOrderPage() {
  const { profile, isLoading: isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [reviewerRequired, setReviewerRequired] = useState(false);
  const [assignedToStaffId, setAssignedToStaffId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Schedule state
  const [scheduledDate, setScheduledDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [durationDays, setDurationDays] = useState(1);
  const [estimatedEndDate, setEstimatedEndDate] = useState("");

  // Checklist State
  const [checklist, setChecklist] = useState<{task: string}[]>([]);
  const [newTask, setNewTask] = useState("");

  useEffect(() => {
    if (scheduledDate && durationDays) {
      try {
        const start = parseISO(scheduledDate);
        const end = addDays(start, Number(durationDays));
        setEstimatedEndDate(format(end, 'yyyy-MM-dd'));
      } catch (e) {
        setEstimatedEndDate("");
      }
    }
  }, [scheduledDate, durationDays]);

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    setChecklist([...checklist, { task: newTask.trim() }]);
    setNewTask("");
  };

  const removeTask = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || !clientId) {
      toast({
        title: "Campos requeridos",
        description: "Por favor, complete la descripción y seleccione un cliente.",
        variant: "destructive",
      });
      return;
    }

    if (!profile?.companyId) {
      toast({ title: "Error de sesión", description: "No se pudo identificar su empresa.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const colRef = collection(db, "companies", profile.companyId, "workOrders");
      
      const newOT = {
        companyId: profile.companyId,
        clientId,
        assetId: assetId || null,
        description: description.trim(),
        status: "creada",
        assignedToStaffId: assignedToStaffId || null,
        createdByUserId: profile.id,
        reviewerRequired,
        scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null,
        durationDays: Number(durationDays),
        estimatedEndDate: estimatedEndDate ? new Date(estimatedEndDate).toISOString() : null,
        checklist: checklist.map((item, idx) => ({
          id: `task-${idx}-${Date.now()}`,
          task: item.task,
          completed: false,
        })),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(colRef, newOT);
      toast({ title: "Orden Creada", description: "OT generada exitosamente." });
      router.push(`/work-orders/${docRef.id}`);
    } catch (error: any) {
      toast({ title: "Error al guardar", description: "No se pudo guardar la orden.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch real data
  const assetsQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return collection(db, "companies", profile.companyId, "assets");
  }, [db, profile?.companyId]);

  const clientsQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return collection(db, "companies", profile.companyId, "clients");
  }, [db, profile?.companyId]);

  const staffQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    // IMPORTANTE: Aseguramos que la subcolección sea la correcta bajo el tenant del perfil
    return query(
      collection(db, "companies", profile.companyId, "staff"), 
      where("active", "==", true)
    );
  }, [db, profile?.companyId]);

  const { data: realAssets, isLoading: isAssetsLoading } = useCollection<Asset>(assetsQuery);
  const { data: realClients, isLoading: isClientsLoading } = useCollection<Client>(clientsQuery);
  const { data: staffMembers, isLoading: isStaffLoading } = useCollection<StaffMember>(staffQuery);

  if (isUserLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 py-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/work-orders"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nueva Orden de Trabajo</h2>
          <p className="text-sm text-muted-foreground italic">Planificación técnica con asignación de equipo.</p>
        </div>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="bg-primary/5 border-b rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <ClipboardPlus className="h-5 w-5 text-primary" />
            Detalles de la Operación
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleCreate}>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-muted-foreground tracking-wider">Cliente *</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder={isClientsLoading ? "Cargando clientes..." : "Seleccione un cliente..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {realClients && realClients.length > 0 ? (
                      realClients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-xs text-muted-foreground text-center">No hay clientes registrados</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-muted-foreground tracking-wider">Activo / Equipo</Label>
                <Select value={assetId} onValueChange={setAssetId}>
                  <SelectTrigger>
                    <SelectValue placeholder={isAssetsLoading ? "Cargando activos..." : "Seleccione equipo (Opcional)..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {realAssets && realAssets.length > 0 ? (
                      realAssets.map(asset => (
                        <SelectItem key={asset.id} value={asset.id}>{asset.name} ({asset.code})</SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-xs text-muted-foreground text-center">No hay activos en catálogo</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card className="border shadow-none bg-muted/10">
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                    <CalendarIcon className="h-3 w-3" /> Inicio Ejecución
                  </Label>
                  <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                    <Clock className="h-3 w-3" /> Días de Plazo
                  </Label>
                  <Input type="number" min="1" value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Término Estimado</Label>
                  <div className="h-10 px-3 flex items-center bg-background border rounded-md font-medium text-primary">
                    {estimatedEndDate ? format(parseISO(estimatedEndDate), 'dd/MM/yyyy') : '...'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                <HardHat className="h-3 w-3" /> Personal Operativo Asignado
              </Label>
              <Select value={assignedToStaffId} onValueChange={setAssignedToStaffId}>
                <SelectTrigger>
                  <SelectValue placeholder={isStaffLoading ? "Cargando equipo..." : "Seleccione del equipo de trabajo..."} />
                </SelectTrigger>
                <SelectContent>
                  {isStaffLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  ) : staffMembers && staffMembers.length > 0 ? (
                    staffMembers.map(staff => (
                      <SelectItem key={staff.id} value={staff.id}>{staff.name} ({staff.role})</SelectItem>
                    ))
                  ) : (
                    <div className="p-4 text-center space-y-2">
                      <p className="text-xs text-muted-foreground">No hay personal activo registrado.</p>
                      <Button variant="outline" size="sm" asChild className="w-full h-7 text-[10px]">
                        <Link href="/team"><UserPlus className="h-3 w-3 mr-1" /> Ir a Equipo</Link>
                      </Button>
                    </div>
                  )}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground italic">El personal disponible corresponde a los trabajadores asociados a su empresa.</p>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase text-muted-foreground tracking-wider">Descripción del Trabajo *</Label>
              <Textarea 
                placeholder="Ej: Mantención preventiva..." 
                className="min-h-[100px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <ListChecks className="h-4 w-4 text-primary" />
                <Label className="font-bold text-xs uppercase text-muted-foreground tracking-wider">Protocolo de Trabajo (Checklist)</Label>
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="Añadir tarea..." 
                  value={newTask} 
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTask())}
                />
                <Button type="button" onClick={handleAddTask} variant="outline" size="icon"><Plus className="h-4 w-4" /></Button>
              </div>
              {checklist.length > 0 && (
                <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
                  {checklist.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-card p-2 rounded border shadow-sm">
                      <span className="text-sm">{idx + 1}. {item.task}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeTask(idx)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-6 bg-muted/20 rounded-b-lg">
            <Button variant="outline" type="button" asChild disabled={isSubmitting}>
              <Link href="/work-orders">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting || !description.trim() || !clientId} className="min-w-[140px]">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Crear OT"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
