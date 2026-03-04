
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
import { ArrowLeft, Loader2, ClipboardPlus, AlertCircle } from "lucide-react";
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

    if (!description.trim()) {
      toast({
        title: "Campo requerido",
        description: "Por favor, ingrese una descripción para el trabajo.",
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
        description: description.trim(),
        status: "creada",
        assignedToUserId: assignedTo || null,
        createdByUserId: profile.id,
        reviewerRequired,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(colRef, newOT);

      toast({
        title: "Orden Creada Exitosamente",
        description: `Se ha generado la OT con ID temporal: ${docRef.id.substring(0, 8)}...`,
      });

      router.push(`/work-orders/${docRef.id}`);
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la orden en la base de datos. Verifique su conexión.",
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

  // Filtrado de técnicos de la empresa actual (usando mocks para demo)
  const technicians = MOCK_USERS.filter(u => u.role === 'tecnico' && u.companyId === profile?.companyId);

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 py-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/work-orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nueva Orden de Trabajo</h2>
          <p className="text-sm text-muted-foreground italic">Paso inicial del libro digital de obra.</p>
        </div>
      </div>

      <Card className="border-none shadow-lg overflow-hidden">
        <CardHeader className="bg-primary/5 border-b">
          <CardTitle className="flex items-center gap-2">
            <ClipboardPlus className="h-5 w-5 text-primary" />
            Detalles de la Mantención
          </CardTitle>
          <CardDescription>
            Toda la información ingresada será registrada de forma inmutable en el historial de la empresa.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleCreate}>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className="font-bold">Descripción del Trabajo *</Label>
                <span className="text-[10px] text-muted-foreground uppercase">Obligatorio</span>
              </div>
              <Textarea 
                id="description" 
                placeholder="Describa detalladamente el problema o la tarea preventiva (ej: Falla en bomba de impulsión sector B)..." 
                required
                className="min-h-[140px] resize-none focus:ring-2 focus:ring-primary/20"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <SelectItem value="none" disabled>No se encontraron técnicos activos</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">Puede dejarlo vacío para asignar después.</p>
              </div>

              <div className="flex items-center justify-between p-4 border-2 rounded-xl bg-accent/5 border-dashed border-accent/20">
                <div className="space-y-0.5">
                  <Label className="font-bold">Requiere Reviewer</Label>
                  <p className="text-xs text-muted-foreground">Obliga a una contraparte técnica a validar antes del cierre.</p>
                </div>
                <Switch 
                  checked={reviewerRequired}
                  onCheckedChange={setReviewerRequired}
                />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Al crear esta orden, se generará una entrada automática en el <strong>Libro Digital</strong>. Asegúrese de que la descripción sea clara para auditorías futuras.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-6 bg-muted/20">
            <Button variant="outline" type="button" asChild disabled={isSubmitting}>
              <Link href="/work-orders">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting || !description.trim()} className="min-w-[160px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Crear Orden de Trabajo"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
