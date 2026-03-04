
"use client";

import { use, useState, useEffect } from "react";
import { 
  MOCK_WORK_ORDERS, 
  MOCK_LOGBOOK, 
  MOCK_USERS,
  MOCK_CLIENTS,
  MOCK_SPARE_PARTS
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
  Receipt,
  Package,
  Plus,
  AlertTriangle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { generateWorkOrderSummary } from "@/ai/flows/generate-work-order-summary";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp, increment } from "firebase/firestore";

export default function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const otId = resolvedParams.id;
  const { toast } = useToast();
  const { profile, isReviewer, isSupervisor, isCompanyAdmin, isTechnician } = useUser();
  const db = useFirestore();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInvoicing, setIsInvoicing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAddingPart, setIsAddingPart] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Form states for spare parts
  const [selectedPartId, setSelectedPartId] = useState("");
  const [partQuantity, setPartQuantity] = useState("1");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Firestore References
  const otRef = useMemoFirebase(() => {
    if (!db || !profile?.companyId || otId.startsWith('OT-')) return null;
    return doc(db, "companies", profile.companyId, "workOrders", otId);
  }, [db, profile?.companyId, otId]);

  const logbookQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId || otId.startsWith('OT-')) return null;
    return collection(db, "companies", profile.companyId, "workOrders", otId, "digitalLogbookEntries");
  }, [db, profile?.companyId, otId]);

  const partsUsageQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId || otId.startsWith('OT-')) return null;
    return collection(db, "companies", profile.companyId, "workOrders", otId, "partUsages");
  }, [db, profile?.companyId, otId]);

  const inventoryQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return collection(db, "companies", profile.companyId, "spareParts");
  }, [db, profile?.companyId]);

  // Firestore Data
  const { data: firestoreOt, isLoading: isDocLoading } = useDoc(otRef);
  const { data: firestoreLogbook } = useCollection(logbookQuery);
  const { data: firestorePartsUsage } = useCollection(partsUsageQuery);
  const { data: inventoryParts } = useCollection(inventoryQuery);

  const ot = firestoreOt || MOCK_WORK_ORDERS.find(o => o.id === otId);
  const logbook = firestoreLogbook && firestoreLogbook.length > 0 ? firestoreLogbook : MOCK_LOGBOOK.filter(l => l.workOrderId === otId);
  const partsUsage = firestorePartsUsage || [];
  const parts = inventoryParts && inventoryParts.length > 0 ? inventoryParts : MOCK_SPARE_PARTS;
  
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

  const handleStatusChange = async (newStatus: 'aprobada' | 'rechazada') => {
    if (isMock) {
      toast({ title: "Modo Demo", description: `Estado simulado: ${newStatus}` });
      return;
    }
    if (!profile || !otRef) return;

    setIsUpdating(true);
    try {
      updateDocumentNonBlocking(otRef, { 
        status: newStatus,
        updatedAt: serverTimestamp(),
        approvedByUserId: newStatus === 'aprobada' ? profile.id : null,
        reviewedAt: serverTimestamp(),
      });

      const logRef = collection(db, "companies", profile.companyId, "workOrders", ot!.id, "digitalLogbookEntries");
      await addDoc(logRef, {
        workOrderId: ot!.id,
        companyId: profile.companyId,
        timestamp: serverTimestamp(),
        eventType: 'status_change',
        eventDetails: `Orden ${newStatus} por ${profile.name}.`,
        actor: profile.id,
      });

      toast({ title: `Orden ${newStatus}`, description: `Estado actualizado.` });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo actualizar.", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRegisterPart = async () => {
    if (isMock) {
      toast({ title: "Modo Demo", description: "Registro de repuesto simulado." });
      return;
    }
    if (!profile || !selectedPartId || !ot) return;

    const part = parts.find(p => p.id === selectedPartId);
    if (!part) return;

    const qty = parseInt(partQuantity);
    if (isNaN(qty) || qty <= 0) return;

    setIsAddingPart(true);
    try {
      // 1. Record Usage
      const usageRef = collection(db, "companies", profile.companyId, "workOrders", ot.id, "partUsages");
      await addDoc(usageRef, {
        workOrderId: ot.id,
        partId: selectedPartId,
        partName: part.name,
        quantity: qty,
        unitPrice: part.unitPrice,
        usedAt: serverTimestamp(),
      });

      // 2. Reduce Inventory Stock
      const partRef = doc(db, "companies", profile.companyId, "spareParts", selectedPartId);
      updateDocumentNonBlocking(partRef, {
        stockActual: increment(-qty)
      });

      // 3. Log event
      const logRef = collection(db, "companies", profile.companyId, "workOrders", ot.id, "digitalLogbookEntries");
      await addDoc(logRef, {
        workOrderId: ot.id,
        companyId: profile.companyId,
        timestamp: serverTimestamp(),
        eventType: 'action_taken',
        eventDetails: `Se utilizaron ${qty} unidad(es) de ${part.name}.`,
        actor: profile.id,
      });

      toast({ title: "Repuesto registrado", description: "Stock actualizado y bitácora guardada." });
      setSelectedPartId("");
      setPartQuantity("1");
    } catch (error) {
      toast({ title: "Error", description: "No se pudo registrar el repuesto.", variant: "destructive" });
    } finally {
      setIsAddingPart(false);
    }
  };

  if (isDocLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ot) return <div className="p-8 text-center">Orden de trabajo no encontrada.</div>;

  const canReview = (isReviewer || isSupervisor || isCompanyAdmin) && ot.status === 'en revision';
  const canEditParts = (isTechnician || isSupervisor || isCompanyAdmin) && !['aprobada', 'rechazada'].includes(ot.status);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/work-orders"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold">{ot.id}</h2>
            <Badge variant={ot.status === 'aprobada' ? 'default' : 'outline'} className={cn(
              ot.status === 'creada' && "border-blue-500 text-blue-500",
              ot.status === 'en revision' && "border-amber-500 text-amber-500",
              ot.status === 'aprobada' && "bg-emerald-500 text-white",
              ot.status === 'rechazada' && "border-rose-500 text-rose-500"
            )}>
              {ot.status.toUpperCase()}
            </Badge>
            {isMock && <Badge variant="outline" className="text-amber-600 bg-amber-50">EJEMPLO</Badge>}
          </div>
          <p className="text-muted-foreground text-sm">Creada: {formatDate(ot.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ot.status === 'aprobada' && (
            <Button disabled={isInvoicing} className="bg-primary">
              <Receipt className="mr-2 h-4 w-4" /> Facturar
            </Button>
          )}
          {canReview && (
            <>
              <Button variant="outline" className="text-rose-500 border-rose-200" onClick={() => handleStatusChange('rechazada')}>
                <XCircle className="mr-2 h-4 w-4" /> Rechazar
              </Button>
              <Button className="bg-emerald-600" onClick={() => handleStatusChange('aprobada')}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Aprobar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Main Details */}
          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Detalles Técnicos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Cliente</p>
                  <p className="text-sm font-bold">{client?.name || 'Cargando...'}</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Técnico</p>
                  <p className="text-sm font-bold">{MOCK_USERS.find(u => u.id === (ot.assignedTo || (ot as any).assignedToUserId))?.name || 'Sin asignar'}</p>
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase text-muted-foreground">Descripción del Trabajo</Label>
                <p className="mt-1 text-sm leading-relaxed">{ot.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Spare Parts Usage */}
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Repuestos Utilizados</CardTitle>
                <CardDescription>Materiales consumidos en esta intervención.</CardDescription>
              </div>
              {canEditParts && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" /> Registrar Uso</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Registrar Consumo de Repuesto</DialogTitle>
                      <DialogDescription>Seleccione el ítem y la cantidad. El stock se descontará automáticamente.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Repuesto</Label>
                        <Select value={selectedPartId} onValueChange={setSelectedPartId}>
                          <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                          <SelectContent>
                            {parts.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name} (Stock: {p.stockActual})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Cantidad</Label>
                        <Input type="number" min="1" value={partQuantity} onChange={(e) => setPartQuantity(e.target.value)} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleRegisterPart} disabled={isAddingPart || !selectedPartId}>
                        {isAddingPart ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Registro"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {partsUsage.length > 0 ? (
                <div className="space-y-3">
                  {partsUsage.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/10">
                      <div>
                        <p className="text-sm font-bold">{u.partName || 'Repuesto'}</p>
                        <p className="text-xs text-muted-foreground">{u.quantity} unidad(es)</p>
                      </div>
                      <p className="text-sm font-mono text-primary">${(u.quantity * u.unitPrice).toLocaleString()}</p>
                    </div>
                  ))}
                  <div className="pt-3 flex justify-end">
                    <p className="text-sm font-bold">Total Materiales: ${partsUsage.reduce((acc: number, u: any) => acc + (u.quantity * u.unitPrice), 0).toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground italic text-sm border-2 border-dashed rounded-lg">No se han registrado repuestos.</div>
              )}
            </CardContent>
          </Card>

          {/* Logbook */}
          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Libro Digital de Obra</CardTitle></CardHeader>
            <CardContent>
              {logbook.length > 0 ? (
                <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-muted">
                  {logbook.map((entry) => (
                    <div key={entry.id} className="relative">
                      <div className="absolute -left-[23px] top-1 h-4 w-4 rounded-full bg-background border-2 border-primary ring-2 ring-background" />
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-primary uppercase">{entry.eventType?.replace('_', ' ')}</span>
                          <span className="text-[10px] text-muted-foreground">{formatDate(entry.timestamp)}</span>
                        </div>
                        <p className="text-sm font-medium">{entry.eventDetails}</p>
                        <p className="text-[10px] text-muted-foreground">Responsable: {MOCK_USERS.find(u => u.id === entry.actor)?.name || 'Sistema'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">Sin registros.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Status */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-primary/5">
            <CardHeader><CardTitle className="text-sm">Progreso del Servicio</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {['creada', 'asignada', 'ejecutada', 'en revision', 'aprobada'].map((step, idx) => {
                const steps = ['creada', 'asignada', 'ejecutada', 'en revision', 'aprobada'];
                const currentIdx = steps.indexOf(ot.status);
                const isDone = currentIdx > idx;
                const isActive = ot.status === step;
                return (
                  <div key={step} className="flex items-center gap-3">
                    <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold", isActive ? "bg-primary text-white" : isDone ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground")}>
                      {isDone ? "✓" : idx + 1}
                    </div>
                    <span className={cn("text-xs", isActive ? "font-bold text-foreground" : isDone ? "text-emerald-600" : "text-muted-foreground")}>
                      {step.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
