
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, ClipboardPlus, ListChecks, Plus, Trash2, HardHat } from "lucide-react";
import Link from "next/link";
import { MOCK_USERS, MOCK_CLIENTS, MOCK_ASSETS } from "@/lib/mock-data";

export default function NewWorkOrderPage() {
  const { profile, isLoading: isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [reviewerRequired, setReviewerRequired] = useState(false);
  const [assignedTo, setAssignedTo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Checklist State
  const [checklist, setChecklist] = useState<{task: string}[]>([]);
  const [newTask, setNewTask] = useState("");

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
      toast({
        title: "Error de sesión",
        description: "No se pudo identificar su empresa.",
        variant: "destructive",
      });
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
        assignedToUserId: assignedTo || null,
        createdByUserId: profile.id,
        reviewerRequired,
        checklist: checklist.map((item, idx) => ({
          id: `task-${idx}-${Date.now()}`,
          task: item.task,
          completed: false,
        })),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(colRef, newOT);

      toast({
        title: "Orden Creada",
        description: `OT generada exitosamente.`,
      });

      router.push(`/work-orders/${docRef.id}`);
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la orden.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch real data if available
  const assetsQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return collection(db, "companies", profile.companyId, "assets");
  }, [db, profile?.companyId]);

  const { data: realAssets } = useCollection(assetsQuery);
  const { data: realUsers } = useCollection(useMemoFirebase(() => db ? collection(db, "users") : null, [db]));

  const technicians = (realUsers || MOCK_USERS).filter(u => u.role === 'tecnico' && u.companyId === profile?.companyId);
  const clients = MOCK_CLIENTS.filter(c => c.companyId === profile?.companyId);
  const assets = (realAssets && realAssets.length > 0) ? realAssets : MOCK_ASSETS.filter(a => a.companyId === profile?.companyId);

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
          <Link href="/work-orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nueva Orden de Trabajo</h2>
          <p className="text-sm text-muted-foreground italic">Registro en el libro digital de obra con protocolo.</p>
        </div>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="bg-primary/5 border-b rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <ClipboardPlus className="h-5 w-5 text-primary" />
            Detalles de la Mantención
          </CardTitle>
          <CardDescription>
            Defina el alcance y el protocolo de pasos a seguir.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleCreate}>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="client" className="font-bold text-xs uppercase text-muted-foreground tracking-wider">Cliente *</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Seleccione un cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="asset" className="font-bold text-xs uppercase text-muted-foreground tracking-wider">Activo / Equipo</Label>
                <Select value={assetId} onValueChange={setAssetId}>
                  <SelectTrigger id="asset">
                    <SelectValue placeholder="Seleccione equipo (Opcional)..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map(asset => (
                      <SelectItem key={asset.id} value={asset.id}>{asset.name} ({asset.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="technician" className="font-bold text-xs uppercase text-muted-foreground tracking-wider">Técnico Asignado</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger id="technician">
                    <SelectValue placeholder="Asignar más tarde..." />
                  </SelectTrigger>
                  <SelectContent>
                    {technicians.map(tech => (
                      <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="font-bold text-xs uppercase text-muted-foreground tracking-wider">Descripción del Trabajo *</Label>
              <Textarea 
                id="description" 
                placeholder="Ej: Mantención 5.000km Camión o Reparación de tabique sala n°2..." 
                required
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
                  placeholder="Ej: Revisión de niveles o Pintura de terminación..." 
                  value={newTask} 
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTask())}
                />
                <Button type="button" onClick={handleAddTask} variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {checklist.length > 0 && (
                <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
                  {checklist.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-card p-2 rounded border shadow-sm">
                      <span className="text-sm">{idx + 1}. {item.task}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeTask(idx)}>
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 border rounded-xl bg-accent/5">
              <div className="space-y-0.5">
                <Label className="font-bold">Requiere Revisión Administrativa</Label>
                <p className="text-xs text-muted-foreground">Obliga a un supervisor a aprobar la OT una vez ejecutada.</p>
              </div>
              <Switch 
                checked={reviewerRequired}
                onCheckedChange={setReviewerRequired}
              />
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
