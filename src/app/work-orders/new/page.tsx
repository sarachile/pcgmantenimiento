
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, ClipboardPlus } from "lucide-react";
import Link from "next/link";
import { MOCK_USERS } from "@/lib/mock-data";

export default function NewWorkOrderPage() {
  const { profile, isLoading: isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [description, setDescription] = useState("");
  const [reviewerRequired, setReviewerRequired] = useState(false);
  const [assignedTo, setAssignedTo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
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
        description,
        status: "creada",
        assignedToUserId: assignedTo || null,
        createdByUserId: profile.id,
        reviewerRequired,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(colRef, newOT);

      toast({
        title: "Orden Creada",
        description: `La OT se ha generado exitosamente.`,
      });

      router.push(`/work-orders/${docRef.id}`);
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: "Hubo un problema al crear la orden en la base de datos.",
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

  // En un entorno real, cargaríamos estos usuarios de la subcolección /companies/{id}/users
  const technicians = MOCK_USERS.filter(u => u.role === 'tecnico' && u.companyId === profile?.companyId);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/work-orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Nueva Orden de Trabajo</h2>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardPlus className="h-5 w-5 text-primary" />
            Detalles de Mantención
          </CardTitle>
          <CardDescription>
            Complete los campos para iniciar un nuevo proceso de mantenimiento en la plataforma.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleCreate}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="description">Descripción del Trabajo</Label>
              <Textarea 
                id="description" 
                placeholder="Ej: Mantención preventiva transformador T-400 en Planta Norte..." 
                required
                className="min-h-[120px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="technician">Asignar Técnico (Opcional)</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger id="technician">
                    <SelectValue placeholder="Seleccionar técnico..." />
                  </SelectTrigger>
                  <SelectContent>
                    {technicians.length > 0 ? (
                      technicians.map(tech => (
                        <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No hay técnicos disponibles</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="space-y-0.5">
                  <Label>Requiere Reviewer</Label>
                  <p className="text-xs text-muted-foreground">Contraparte técnica obligatoria para cierre.</p>
                </div>
                <Switch 
                  checked={reviewerRequired}
                  onCheckedChange={setReviewerRequired}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-6 bg-muted/10">
            <Button variant="outline" type="button" asChild>
              <Link href="/work-orders">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting || !description}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Crear Orden de Trabajo"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
