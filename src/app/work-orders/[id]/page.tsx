
"use client";

import { use, useState, useEffect } from "react";
import { 
  MOCK_WORK_ORDERS, 
  MOCK_LOGBOOK, 
  MOCK_USERS,
  MOCK_CLIENTS
} from "@/lib/mock-data";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ClipboardList, 
  History, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  FileText,
  Loader2,
  Building2,
  Receipt
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { generateWorkOrderSummary } from "@/ai/flows/generate-work-order-summary";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const otId = resolvedParams.id;
  const { toast } = useToast();
  const { profile } = useUser();
  const db = useFirestore();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInvoicing, setIsInvoicing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const otRef = useMemoFirebase(() => {
    if (!db || !profile?.companyId || otId.startsWith('OT-')) return null;
    return doc(db, "companies", profile.companyId, "workOrders", otId);
  }, [db, profile?.companyId, otId]);

  const { data: firestoreOt, isLoading: isDocLoading } = useDoc(otRef);

  const ot = firestoreOt || MOCK_WORK_ORDERS.find(o => o.id === otId);
  const logbook = MOCK_LOGBOOK.filter(l => l.workOrderId === otId);
  const isMock = !firestoreOt;

  const client = MOCK_CLIENTS.find(c => c.id === ot?.clientId);

  const formatDate = (date: any) => {
    if (!mounted || !date) return '...';
    try {
      if (typeof date === 'string') return new Date(date).toLocaleString();
      if (date?.toDate) return date.toDate().toLocaleString();
      return new Date(date).toLocaleString();
    } catch (e) {
      return 'N/A';
    }
  };

  if (isDocLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ot) {
    return <div className="p-8 text-center">Orden de trabajo no encontrada.</div>;
  }

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      const result = await generateWorkOrderSummary({
        workOrder: {
          ...ot,
          id: ot.id,
          description: ot.description || "",
          status: ot.status as any,
          createdAt: typeof ot.createdAt === 'string' ? ot.createdAt : (ot.createdAt as any)?.toDate().toISOString(),
          companyId: profile?.companyId || "demo-company"
        },
        digitalLogbookEntries: logbook.map(entry => ({
          ...entry,
          timestamp: entry.timestamp,
        }))
      });
      setAiSummary(result.summary);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el resumen inteligente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (isMock) {
      toast({
        title: "Simulación de Factura",
        description: "Se ha solicitado la emisión a SimpleAPI (Modo Demo).",
      });
      return;
    }

    if (!profile?.companyId || !client) return;

    setIsInvoicing(true);
    try {
      const invoiceRef = collection(db, "companies", profile.companyId, "workOrders", ot.id, "invoices");
      
      // En una app real, aquí se llamaría a la Cloud Function de SimpleAPI
      await addDoc(invoiceRef, {
        companyId: profile.companyId,
        clientId: client.id,
        workOrderId: ot.id,
        amount: 150000, // Monto simulado
        status: "pendiente",
        issuedBy: profile.id,
        issuedAt: serverTimestamp(),
      });

      toast({
        title: "Solicitud enviada",
        description: "La factura está siendo procesada por SimpleAPI.",
      });
    } catch (error) {
      toast({
        title: "Error de emisión",
        description: "No se pudo registrar la solicitud de factura.",
        variant: "destructive"
      });
    } finally {
      setIsInvoicing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/work-orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              {ot.id}
              <Badge variant={ot.status === 'aprobada' ? 'default' : 'outline'} className={cn(
                ot.status === 'creada' && "border-blue-500 text-blue-500",
                ot.status === 'en revision' && "border-amber-500 text-amber-500",
                ot.status === 'aprobada' && "bg-emerald-500 text-white border-emerald-500"
              )}>
                {ot.status.toUpperCase()}
              </Badge>
            </h2>
            {isMock && <Badge variant="outline" className="text-amber-600 bg-amber-50">EJEMPLO</Badge>}
          </div>
          <p className="text-muted-foreground text-sm">
            Creada el {formatDate(ot.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          {ot.status === 'aprobada' && (
            <Button onClick={handleCreateInvoice} disabled={isInvoicing} className="bg-primary hover:bg-primary/90">
              {isInvoicing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Receipt className="mr-2 h-4 w-4" />}
              Facturar (SimpleAPI)
            </Button>
          )}
          {ot.status === 'en revision' && !isMock && (
            <>
              <Button variant="outline" className="border-rose-500 text-rose-500 hover:bg-rose-50">
                <XCircle className="mr-2 h-4 w-4" /> Rechazar
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Aprobar OT
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Detalles de la Orden</CardTitle>
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg flex items-start gap-3">
                <Building2 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Cliente</p>
                  <p className="text-sm font-bold">{client?.name || 'Cliente no identificado'}</p>
                  <p className="text-[10px] text-muted-foreground">{client?.rut}</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descripción del Trabajo</label>
                <p className="mt-1 text-base leading-relaxed">{ot.description}</p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Técnico Asignado</label>
                  <p className="mt-1">{MOCK_USERS.find(u => u.id === (ot.assignedTo || (ot as any).assignedToUserId))?.name || 'Sin asignar'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha de Ejecución</label>
                  <p className="mt-1">{ot.executedAt ? formatDate(ot.executedAt) : 'Pendiente'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-primary/5 border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Resumen Inteligente (IA)
                </CardTitle>
                <CardDescription>Análisis ejecutivo de la intervención.</CardDescription>
              </div>
              <Button onClick={handleGenerateSummary} disabled={isGenerating} variant="outline" size="sm" className="bg-background">
                {isGenerating ? "Generando..." : "Actualizar"}
              </Button>
            </CardHeader>
            <CardContent>
              {aiSummary ? (
                <div className="prose prose-sm max-w-none text-primary">{aiSummary}</div>
              ) : (
                <div className="text-center py-6 text-muted-foreground italic">
                   <p>Presione el botón para generar un resumen ejecutivo.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                Libro Digital de Obra
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logbook.length > 0 ? (
                <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-muted">
                  {logbook.map((entry) => (
                    <div key={entry.id} className="relative">
                      <div className="absolute -left-[23px] top-1 h-4 w-4 rounded-full bg-background border-2 border-primary ring-4 ring-background" />
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-primary uppercase">{entry.eventType.replace('_', ' ')}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(entry.timestamp)}</span>
                        </div>
                        <p className="text-sm font-medium">{entry.eventDetails}</p>
                        <p className="text-xs text-muted-foreground">Actor: {MOCK_USERS.find(u => u.id === entry.actor)?.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm italic">
                  No hay registros en el libro.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Estado del Proceso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['creada', 'asignada', 'ejecutada', 'en revision', 'aprobada'].map((step, idx) => {
                  const isActive = ot.status === step;
                  const steps = ['creada', 'asignada', 'ejecutada', 'en revision', 'aprobada'];
                  const currentIdx = steps.indexOf(ot.status);
                  const isDone = currentIdx > idx;
                  
                  return (
                    <div key={step} className="flex items-center gap-3">
                      <div className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                        isActive ? "bg-accent text-white" : isDone ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
                      )}>
                        {isDone ? "✓" : idx + 1}
                      </div>
                      <span className={cn(
                        "text-sm",
                        isActive ? "font-bold text-foreground" : isDone ? "text-accent" : "text-muted-foreground"
                      )}>
                        {step.charAt(0).toUpperCase() + step.slice(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
