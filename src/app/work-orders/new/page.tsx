
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, ClipboardPlus, AlertCircle, ListChecks, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { MOCK_USERS, MOCK_CLIENTS } from "@/lib/mock-data";
import { ChecklistItem } from "@/lib/types";

export default function NewWorkOrderPage() {
  const { profile, isLoading: isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
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
        description: "No se pudo identificar su empresa. Intente iniciar sesión nuevamente.",
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
        title: "Orden Creada Exitosamente",
        description: `Se ha generado la OT y se registró el protocolo de trabajo.`,
      });

      router.push(`/work-orders/${docRef.id}`);
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la orden en la base de datos.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const technicians = MOCK_USERS.filter(u => u.role === 'tecnico' && u.companyId === profile?.companyId);
  const clients = MOCK_CLIENTS.filter(c => c.companyId === profile?.companyId);

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

      <Card className="border-none shadow-lg overflow-hidden">
        <CardHeader className="bg-primary/5 border-b">
          <CardTitle className="flex items-center gap-2">
            <ClipboardPlus className="h-5 w-5 text-primary" />
            Detalles de la Mantención
          </CardTitle>
          <CardDescription>
            Defina el alcance y el protocolo de pasos a seguir por el técnico.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleCreate}>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="client" className="font-bold">Cliente Seleccionado *</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger id="client" className="bg-background">
                    <SelectValue placeholder="Seleccione un cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.length > 0 ? (
                      clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No hay clientes registrados</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="technician" className="font-bold">Técnico Asignado</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger id="technician" className="bg-background">
                    <SelectValue placeholder="Asignar más tarde..." />
                  </SelectTrigger>
                  <SelectContent>
                    {technicians.length > 0 ? (
                      technicians.map(tech => (
                        <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>Sin técnicos activos</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className="font-bold">Descripción del Trabajo *</Label>
              </div>
              <Textarea 
                id="description" 
                placeholder="Ej: Mantención 5.000km Camión Patente XX-12 o Reparación de tabique sala n°2..." 
                required
                className="min-h-[100px] resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" />
                <Label className="font-bold">Protocolo / Checklist Dinámico</Label>
              </div>
              
              <div className="flex gap-2">
                <Input 
                  placeholder="Ej: Revisión niveles de aceite o Pintura de terminación..." 
                  value={newTask} 
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTask())}
                />
                <Button type="button" onClick={handleAddTask} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {checklist.length > 0 && (
                <div className="space-y-2 border rounded-lg p-4 bg-muted/30">
                  {checklist.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-card p-2 rounded border shadow-sm">
                      <span className="text-sm font-medium">{idx + 1}. {item.task}</span>
                      <Button variant="ghost" size="icon" onClick={() => removeTask(idx)}>
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 border-2 rounded-xl bg-accent/5 border-dashed border-accent/20">
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
          <CardFooter className="flex justify-between border-t p-6 bg-muted/20">
            <Button variant="outline" type="button" asChild disabled={isSubmitting}>
              <Link href="/work-orders">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting || !description.trim() || !clientId} className="min-w-[160px]">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generar OT"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
