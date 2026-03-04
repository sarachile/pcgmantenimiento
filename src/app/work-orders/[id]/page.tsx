"use client";

import { use, useState, useEffect, useRef } from "react";
import { 
  MOCK_WORK_ORDERS, 
  MOCK_LOGBOOK, 
  MOCK_USERS,
  MOCK_CLIENTS,
  MOCK_ASSETS,
  MOCK_SPARE_PARTS
} from "@/lib/mock-data";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardList, 
  History, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft,
  Loader2,
  FileDown,
  Camera,
  Image as ImageIcon,
  ListChecks,
  ShieldCheck,
  Zap,
  MessageSquare,
  HardHat,
  Signature as SignatureIcon,
  Eraser,
  Check,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Package,
  Trash2,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useStorage, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp, arrayUnion, query, orderBy, increment } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from "next/image";
import { ChecklistItem, WorkOrder, DigitalLogbookEntry, Company, PartUsage, SparePart, Client, User, Asset } from "@/lib/types";
import { generateWorkOrderSummary } from "@/ai/flows/generate-work-order-summary";
import { format, parseISO } from "date-fns";
import { WorkOrderReport } from "@/components/WorkOrderReport";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Simple Signature Pad Component using Canvas
function SignaturePad({ onSave, onCancel, isSaving }: { 
  onSave: (blob: Blob) => void, 
  onCancel: () => void, 
  isSaving: boolean,
  title: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.beginPath();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) onSave(blob);
    }, 'image/png');
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-lg bg-white overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          className="w-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
        />
      </div>
      <div className="flex justify-between gap-2">
        <Button variant="outline" size="sm" onClick={clearCanvas} disabled={isSaving}>
          <Eraser className="h-4 w-4 mr-2" /> Limpiar
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSaving}>Cancelar</Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
            Guardar Firma
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const otId = resolvedParams.id;
  const { toast } = useToast();
  const { profile } = useUser();
  const db = useFirestore();
  const storage = useStorage();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [manualComment, setManualComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isSavingSignature, setIsSavingSignature] = useState(false);
  const [signatureType, setSignatureType] = useState<'client' | 'technician' | null>(null);
  const [mounted, setMounted] = useState(false);

  // Material usage states
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
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

  const companyRef = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return doc(db, "companies", profile.companyId);
  }, [db, profile?.companyId]);

  const logbookQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId || otId.startsWith('OT-')) return null;
    return query(
      collection(db, "companies", profile.companyId, "workOrders", otId, "digitalLogbookEntries"),
      orderBy("timestamp", "desc")
    );
  }, [db, profile?.companyId, otId]);

  const partUsagesQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId || otId.startsWith('OT-')) return null;
    return collection(db, "companies", profile.companyId, "workOrders", otId, "partUsages");
  }, [db, profile?.companyId, otId]);

  const inventoryQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return collection(db, "companies", profile.companyId, "spareParts");
  }, [db, profile?.companyId]);

  // Firestore Data
  const { data: firestoreOt, isLoading: isDocLoading } = useDoc<WorkOrder>(otRef);
  const { data: company } = useDoc<Company>(companyRef);
  const { data: firestoreLogbook } = useCollection<DigitalLogbookEntry>(logbookQuery);
  const { data: partUsages } = useCollection<PartUsage>(partUsagesQuery);
  const { data: inventory } = useCollection<SparePart>(inventoryQuery);

  const ot = firestoreOt || MOCK_WORK_ORDERS.find(o => o.id === otId);
  const logbook = firestoreLogbook && firestoreLogbook.length > 0 ? firestoreLogbook : MOCK_LOGBOOK.filter(l => l.workOrderId === otId);
  
  const isMock = !firestoreOt;

  // Real data for related entities
  const clientRef = useMemoFirebase(() => {
    if (!db || !profile?.companyId || !ot?.clientId) return null;
    return doc(db, "companies", profile.companyId, "clients", ot.clientId);
  }, [db, profile?.companyId, ot?.clientId]);
  const { data: realClient } = useDoc<Client>(clientRef);

  const assetRef = useMemoFirebase(() => {
    if (!db || !profile?.companyId || !ot?.assetId) return null;
    return doc(db, "companies", profile.companyId, "assets", ot.assetId);
  }, [db, profile?.companyId, ot?.assetId]);
  const { data: realAsset } = useDoc<Asset>(assetRef);

  const techId = ot?.assignedTo || ot?.assignedToUserId;
  const techRef = useMemoFirebase(() => {
    if (!db || !techId) return null;
    return doc(db, "users", techId);
  }, [db, techId]);
  const { data: realTechnician } = useDoc<User>(techRef);

  const client = realClient || MOCK_CLIENTS.find(c => c.id === ot?.clientId) || null;
  const asset = realAsset || MOCK_ASSETS.find(a => a.id === ot?.assetId) || null;
  const technician = realTechnician || MOCK_USERS.find(u => u.id === techId) || null;

  const formatDate = (date: any) => {
    if (!mounted || !date) return '...';
    try {
      const d = date.toDate ? date.toDate() : (typeof date === 'string' ? parseISO(date) : date);
      return d.toLocaleString();
    } catch (e) {
      return 'N/A';
    }
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Reporte_PCG_${ot?.id}_${Date.now()}.pdf`);
      
      toast({ title: "Reporte generado", description: "El PDF se ha descargado exitosamente." });
    } catch (error: any) {
      toast({ title: "Error al generar PDF", description: error.message, variant: "destructive" });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleAddMaterial = async () => {
    if (!selectedPartId || isMock || !profile || !ot || !otRef) {
      if (isMock) toast({ title: "Modo Demo", description: "El inventario requiere una base de datos real." });
      return;
    }

    const part = inventory?.find(p => p.id === selectedPartId);
    if (!part) return;

    const qty = Number(partQuantity);
    if (qty <= 0) return;

    try {
      const usageRef = collection(db, "companies", profile.companyId, "workOrders", ot.id, "partUsages");
      await addDoc(usageRef, {
        workOrderId: ot.id,
        partId: part.id,
        partName: part.name,
        quantity: qty,
        unitPrice: part.unitPrice,
        usedAt: serverTimestamp(),
      });

      // Update inventory stock
      const partRef = doc(db, "companies", profile.companyId, "spareParts", part.id);
      updateDocumentNonBlocking(partRef, {
        stockActual: increment(-qty)
      });

      const logRef = collection(db, "companies", profile.companyId, "workOrders", ot.id, "digitalLogbookEntries");
      await addDoc(logRef, {
        workOrderId: ot.id,
        companyId: profile.companyId,
        timestamp: serverTimestamp(),
        eventType: 'action_taken',
        eventDetails: `Consumió material: ${part.name} (x${qty})`,
        actor: profile.id,
      });

      toast({ title: "Material añadido", description: "Se ha descontado del inventario." });
      setIsAddingMaterial(false);
      setSelectedPartId("");
      setPartQuantity("1");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || isMock || !profile || !ot || !otRef) {
      if (isMock) toast({ title: "Modo Demo", description: "La subida de fotos requiere una base de datos real." });
      return;
    }

    setIsUploading(true);
    try {
      const storagePath = `companies/${profile.companyId}/workOrders/${ot.id}/evidence/${Date.now()}_${file.name}`;
      const imageRef = ref(storage, storagePath);
      
      await uploadBytes(imageRef, file);
      const downloadUrl = await getDownloadURL(imageRef);

      updateDocumentNonBlocking(otRef, {
        evidenceUrls: arrayUnion(downloadUrl),
        updatedAt: serverTimestamp()
      });

      const logRef = collection(db, "companies", profile.companyId, "workOrders", ot.id, "digitalLogbookEntries");
      await addDoc(logRef, {
        workOrderId: ot.id,
        companyId: profile.companyId,
        timestamp: serverTimestamp(),
        eventType: 'action_taken',
        eventDetails: `Se añadió nueva evidencia fotográfica: ${file.name}`,
        actor: profile.id,
      });

      toast({ title: "Foto subida", description: "La evidencia se guardó correctamente." });
    } catch (error: any) {
      toast({ title: "Error al subir", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveSignature = async (blob: Blob) => {
    if (!signatureType || isMock || !profile || !ot || !otRef) {
      if (isMock) toast({ title: "Modo Demo", description: "La firma requiere una base de datos real." });
      return;
    }

    setIsSavingSignature(true);
    try {
      const fileName = `${signatureType}_signature_${Date.now()}.png`;
      const storagePath = `companies/${profile.companyId}/workOrders/${ot.id}/signatures/${fileName}`;
      const signatureRef = ref(storage, storagePath);

      await uploadBytes(signatureRef, blob);
      const downloadUrl = await getDownloadURL(signatureRef);

      const updateData: any = { updatedAt: serverTimestamp() };
      if (signatureType === 'client') updateData.clientSignatureUrl = downloadUrl;
      else updateData.technicianSignatureUrl = downloadUrl;

      updateDocumentNonBlocking(otRef, updateData);

      const logRef = collection(db, "companies", profile.companyId, "workOrders", ot.id, "digitalLogbookEntries");
      await addDoc(logRef, {
        workOrderId: ot.id,
        companyId: profile.companyId,
        timestamp: serverTimestamp(),
        eventType: 'action_taken',
        eventDetails: `Firma de ${signatureType === 'client' ? 'Cliente' : 'Técnico'} capturada.`,
        actor: profile.id,
      });

      toast({ title: "Firma guardada", description: "El documento ha sido firmado exitosamente." });
      setSignatureType(null);
    } catch (error: any) {
      toast({ title: "Error al firmar", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingSignature(false);
    }
  };

  const toggleChecklistItem = (taskId: string) => {
    if (isMock || !ot || !otRef || !profile) return;

    const updatedChecklist = ot.checklist?.map((item: ChecklistItem) => {
      if (item.id === taskId) {
        const newCompleted = !item.completed;
        return { ...item, completed: newCompleted, completedAt: newCompleted ? new Date().toISOString() : null };
      }
      return item;
    });

    updateDocumentNonBlocking(otRef, {
      checklist: updatedChecklist,
      updatedAt: serverTimestamp()
    });
  };

  const handleGenerateAiSummary = async () => {
    if (isMock || !ot) {
      toast({ title: "Modo Demo", description: "La IA requiere datos reales." });
      return;
    }

    setIsGeneratingAi(true);
    try {
      const result = await generateWorkOrderSummary({
        workOrder: {
          id: ot.id,
          description: ot.description,
          status: ot.status as any,
          createdAt: ot.createdAt?.toDate ? ot.createdAt.toDate().toISOString() : ot.createdAt,
          companyId: ot.companyId,
        },
        digitalLogbookEntries: logbook.map(l => ({
          id: l.id,
          timestamp: l.timestamp?.toDate ? l.timestamp.toDate().toISOString() : l.timestamp,
          eventType: l.eventType as any,
          eventDetails: l.eventDetails,
          actor: l.actor,
          workOrderId: l.workOrderId
        }))
      });

      if (otRef) {
        updateDocumentNonBlocking(otRef, {
          aiSummary: result.summary,
          updatedAt: serverTimestamp()
        });
      }

      toast({ title: "Resumen Generado", description: "La IA ha procesado la bitácora." });
    } catch (error: any) {
      toast({ title: "Error de IA", description: error.message, variant: "destructive" });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  if (isDocLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ot) return <div className="p-8 text-center">Orden no encontrada.</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 px-4 sm:px-0 relative">
      <div className="absolute -left-[9999px] top-0 pointer-events-none opacity-0">
        <WorkOrderReport 
          ref={reportRef}
          company={company || null}
          workOrder={ot}
          client={client}
          asset={asset}
          logbook={logbook}
          technician={technician}
          partUsages={partUsages || []}
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/work-orders"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{ot.id}</h2>
            <Badge variant={ot.status === 'aprobada' ? 'default' : 'outline'}>
              {ot.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Creada el {formatDate(ot.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleGenerateAiSummary} disabled={isGeneratingAi}>
            {isGeneratingAi ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2 text-amber-500 fill-amber-500" />}
            Resumen IA
          </Button>
          <Button variant="outline" onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
            {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileDown className="h-4 w-4 mr-2" />}
            Reporte PDF
          </Button>
          {['en revision', 'ejecutada', 'creada', 'asignada'].includes(ot.status) && (
            <>
              <Button variant="outline" className="text-rose-500" onClick={() => handleStatusChange('rechazada')} disabled={isUpdating}>
                <XCircle className="mr-2 h-4 w-4" /> Rechazar
              </Button>
              <Button className="bg-emerald-600" onClick={() => handleStatusChange('aprobada')} disabled={isUpdating}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Aprobar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle className="text-lg">Detalles de la OT</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Cliente</p>
                  <p className="text-sm font-bold">{client?.name || 'S/I'}</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Activo / Equipo</p>
                  <p className="text-sm font-bold">{asset?.name || 'S/I'}</p>
                </div>
              </div>
              <p className="text-sm">{ot.description}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" /> Insumos y Repuestos
                </CardTitle>
                <Dialog open={isAddingMaterial} onOpenChange={setIsAddingMaterial}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={ot.status === 'aprobada' || isMock}>
                      <Plus className="h-4 w-4 mr-2" /> Registrar Uso
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Añadir Material al Trabajo</DialogTitle>
                      <DialogDescription>El stock se actualizará automáticamente en el inventario.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Seleccionar Repuesto</Label>
                        <Select value={selectedPartId} onValueChange={setSelectedPartId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione del catálogo..." />
                          </SelectTrigger>
                          <SelectContent>
                            {inventory?.map(p => (
                              <SelectItem key={p.id} value={p.id} disabled={p.stockActual <= 0}>
                                {p.name} (Stock: {p.stockActual})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Cantidad Utilizada</Label>
                        <Input 
                          type="number" 
                          min="1" 
                          value={partQuantity} 
                          onChange={(e) => setPartQuantity(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setIsAddingMaterial(false)}>Cancelar</Button>
                      <Button onClick={handleAddMaterial} disabled={!selectedPartId}>Confirmar Uso</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {partUsages && partUsages.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Repuesto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partUsages.map((usage) => (
                      <TableRow key={usage.id}>
                        <TableCell className="text-sm font-medium">{usage.partName}</TableCell>
                        <TableCell className="text-sm">{usage.quantity}</TableCell>
                        <TableCell className="text-sm">${usage.unitPrice.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm font-bold">
                          ${(usage.quantity * usage.unitPrice).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={3} className="text-right font-bold">Total Materiales</TableCell>
                      <TableCell className="text-right font-black text-primary">
                        ${partUsages.reduce((acc, p) => acc + (p.quantity * p.unitPrice), 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6 text-muted-foreground italic text-sm">No se han registrado materiales aún.</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2"><Camera className="h-5 w-5 text-primary" /> Evidencia Fotográfica</CardTitle>
                <div className="relative">
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading || isMock}>
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    Subir Foto
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {ot.evidenceUrls?.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                    <Image src={url} alt="Evidencia" fill className="object-cover" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" /> Protocolo Técnico</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {ot.checklist?.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                  <Checkbox 
                    checked={item.completed} 
                    onCheckedChange={() => toggleChecklistItem(item.id)}
                    disabled={ot.status === 'aprobada'}
                  />
                  <span className={cn("text-sm", item.completed && "line-through text-muted-foreground")}>{item.task}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><SignatureIcon className="h-5 w-5 text-primary" /> Cierre y Firmas</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Firma Técnico</Label>
                  {ot.technicianSignatureUrl ? (
                    <div className="border rounded-lg bg-white p-2 aspect-video relative">
                      <Image src={ot.technicianSignatureUrl} alt="Firma Técnico" fill className="object-contain" />
                    </div>
                  ) : (
                    <Dialog open={signatureType === 'technician'} onOpenChange={(open) => !open && setSignatureType(null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full" onClick={() => setSignatureType('technician')} disabled={isMock}>
                          Firmar Técnico
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <SignaturePad title="Técnico" isSaving={isSavingSignature} onCancel={() => setSignatureType(null)} onSave={handleSaveSignature} />
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Firma Cliente</Label>
                  {ot.clientSignatureUrl ? (
                    <div className="border rounded-lg bg-white p-2 aspect-video relative">
                      <Image src={ot.clientSignatureUrl} alt="Firma Cliente" fill className="object-contain" />
                    </div>
                  ) : (
                    <Dialog open={signatureType === 'client'} onOpenChange={(open) => !open && setSignatureType(null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full" onClick={() => setSignatureType('client')} disabled={isMock}>
                          Firma Cliente
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <SignaturePad title="Cliente" isSaving={isSavingSignature} onCancel={() => setSignatureType(null)} onSave={handleSaveSignature} />
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Bitácora</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Textarea 
                  placeholder="Comentario técnico..." 
                  className="min-h-[60px]" 
                  value={manualComment} 
                  onChange={(e) => setManualComment(e.target.value)} 
                />
                <Button size="icon" onClick={() => {
                  if (!manualComment.trim() || isMock || !profile) return;
                  addDoc(collection(db, "companies", profile.companyId, "workOrders", ot.id, "digitalLogbookEntries"), {
                    workOrderId: ot.id,
                    companyId: profile.companyId,
                    timestamp: serverTimestamp(),
                    eventType: 'comment',
                    eventDetails: manualComment,
                    actor: profile.id
                  });
                  setManualComment("");
                }} disabled={!manualComment.trim() || isMock}>
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4 border-l pl-4">
                {logbook.map((entry) => (
                  <div key={entry.id} className="text-xs">
                    <p className="font-bold text-primary uppercase">{entry.eventType.replace('_', ' ')}</p>
                    <p className="text-muted-foreground">{entry.eventDetails}</p>
                    <p className="text-[10px] text-muted-foreground opacity-70">{formatDate(entry.timestamp)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}