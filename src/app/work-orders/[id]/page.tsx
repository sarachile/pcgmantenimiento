
"use client";

import { use, useState, useEffect, useRef } from "react";
import { 
  MOCK_WORK_ORDERS, 
  MOCK_LOGBOOK, 
  MOCK_USERS,
  MOCK_CLIENTS,
  MOCK_ASSETS,
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
  Plus
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useStorage, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp, arrayUnion, query, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from "next/image";
import { ChecklistItem, WorkOrder, DigitalLogbookEntry, Company } from "@/lib/types";
import { generateWorkOrderSummary } from "@/ai/flows/generate-work-order-summary";
import { format, parseISO } from "date-fns";
import { WorkOrderReport } from "@/components/WorkOrderReport";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Simple Signature Pad Component using Canvas
function SignaturePad({ onSave, onCancel, isSaving, title }: { 
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

  // Firestore Data
  const { data: firestoreOt, isLoading: isDocLoading } = useDoc<WorkOrder>(otRef);
  const { data: company } = useDoc<Company>(companyRef);
  const { data: firestoreLogbook } = useCollection<DigitalLogbookEntry>(logbookQuery);

  const ot = firestoreOt || MOCK_WORK_ORDERS.find(o => o.id === otId);
  const logbook = firestoreLogbook && firestoreLogbook.length > 0 ? firestoreLogbook : MOCK_LOGBOOK.filter(l => l.workOrderId === otId);
  
  const isMock = !firestoreOt;
  const client = MOCK_CLIENTS.find(c => c.id === ot?.clientId) || null;
  const asset = MOCK_ASSETS.find(a => a.id === ot?.assetId) || null;
  const technician = MOCK_USERS.find(u => u.id === ot?.assignedTo) || null;

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

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
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

  const handleAddComment = async () => {
    if (!manualComment.trim() || isMock || !profile || !ot) return;
    
    setIsAddingComment(true);
    try {
      const logRef = collection(db, "companies", profile.companyId, "workOrders", ot.id, "digitalLogbookEntries");
      await addDoc(logRef, {
        workOrderId: ot.id,
        companyId: profile.companyId,
        timestamp: serverTimestamp(),
        eventType: 'comment',
        eventDetails: manualComment.trim(),
        actor: profile.id,
      });
      setManualComment("");
      toast({ title: "Comentario guardado", description: "Bitácora actualizada." });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar el comentario.", variant: "destructive" });
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleGenerateAiSummary = async () => {
    if (isMock || !ot) {
      toast({ title: "Modo Demo", description: "La IA solo funciona con datos reales en la nube." });
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

    const logRef = collection(db, "companies", profile.companyId, "workOrders", ot.id, "digitalLogbookEntries");
    addDoc(logRef, {
      workOrderId: ot.id,
      companyId: profile.companyId,
      timestamp: serverTimestamp(),
      eventType: 'action_taken',
      eventDetails: `Actualizó tarea: ${updatedChecklist?.find(i => i.id === taskId)?.task}`,
      actor: profile.id,
    });
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
    <div className="space-y-6 max-w-5xl mx-auto pb-10 px-4 sm:px-0">
      {/* Hidden Report for PDF Capture */}
      <div className="hidden">
        <WorkOrderReport 
          ref={reportRef}
          company={company || null}
          workOrder={ot}
          client={client}
          asset={asset}
          logbook={logbook}
          technician={technician}
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
          {['en revision', 'ejecutada'].includes(ot.status) && (
            <>
              <Button variant="outline" className="text-rose-500" onClick={() => handleStatusChange('rechazada')}>
                <XCircle className="mr-2 h-4 w-4" /> Rechazar
              </Button>
              <Button className="bg-emerald-600" onClick={() => handleStatusChange('aprobada')}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Aprobar
              </Button>
            </>
          )}
        </div>
      </div>

      {ot.aiSummary && (
        <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Zap className="h-4 w-4 fill-current" />
              ANÁLISIS INTELIGENTE (IA)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed italic">{ot.aiSummary}</p>
          </CardContent>
        </Card>
      )}

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
                  <div className="flex items-center gap-1.5">
                    <HardHat className="h-3 w-3 text-primary" />
                    <p className="text-sm font-bold">{asset?.name || 'S/I'}</p>
                  </div>
                </div>
              </div>

              {ot.scheduledDate && (
                <div className="grid grid-cols-3 gap-4 border-t pt-4">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Inicio Programado</p>
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="h-3 w-3 text-primary" />
                      <p className="text-sm font-bold">{formatDate(ot.scheduledDate).split(',')[0]}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Días Plazo</p>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-primary" />
                      <p className="text-sm font-bold">{ot.durationDays || 1} días</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Término Estimado</p>
                    <p className="text-sm font-bold text-primary">{formatDate(ot.estimatedEndDate).split(',')[0]}</p>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-xs uppercase text-muted-foreground font-bold">Descripción técnica</Label>
                <p className="mt-1 text-sm leading-relaxed">{ot.description}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" /> Registro Fotográfico
                </CardTitle>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isMock}
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    Subir Foto
                  </Button>
                </div>
              </div>
              <CardDescription>Evidencia visual capturada durante la ejecución del trabajo.</CardDescription>
            </CardHeader>
            <CardContent>
              {ot.evidenceUrls && ot.evidenceUrls.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ot.evidenceUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border bg-muted group">
                      <Image 
                        src={url} 
                        alt={`Evidencia ${idx + 1}`} 
                        fill 
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg bg-muted/20">
                  <ImageIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No se han subido fotos de evidencia aún.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-primary" /> Protocolo de Verificación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ot.checklist && ot.checklist.length > 0 ? (
                ot.checklist.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 bg-card rounded-lg border shadow-sm">
                    <Checkbox 
                      id={item.id} 
                      checked={item.completed} 
                      onCheckedChange={() => toggleChecklistItem(item.id)}
                      disabled={ot.status === 'aprobada' || ot.status === 'rechazada'}
                    />
                    <div className="flex-1">
                      <Label htmlFor={item.id} className={cn("text-sm font-medium", item.completed && "line-through text-muted-foreground")}>
                        {item.task}
                      </Label>
                      {item.completed && item.completedAt && (
                        <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ COMPLETADO {formatDate(item.completedAt)}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground italic text-sm">Sin protocolo definido.</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <SignatureIcon className="h-5 w-5 text-primary" /> Cierre y Firmas Digitales
              </CardTitle>
              <CardDescription>Validación formal de la ejecución y recepción conforme.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Firma Técnico Responsable</Label>
                  {ot.technicianSignatureUrl ? (
                    <div className="border rounded-lg bg-white p-2 aspect-video relative">
                      <Image src={ot.technicianSignatureUrl} alt="Firma Técnico" fill className="object-contain" />
                    </div>
                  ) : (
                    <Dialog open={signatureType === 'technician'} onOpenChange={(open) => !open && setSignatureType(null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full" onClick={() => setSignatureType('technician')} disabled={isMock}>
                          <SignatureIcon className="h-4 w-4 mr-2" /> Firmar como Técnico
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Firma del Técnico</DialogTitle>
                          <DialogDescription>Use su dedo o mouse para firmar en el recuadro.</DialogDescription>
                        </DialogHeader>
                        <SignaturePad 
                          title="Técnico" 
                          isSaving={isSavingSignature} 
                          onCancel={() => setSignatureType(null)} 
                          onSave={handleSaveSignature} 
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                <div className="space-y-4">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Firma Cliente (Recepción)</Label>
                  {ot.clientSignatureUrl ? (
                    <div className="border rounded-lg bg-white p-2 aspect-video relative">
                      <Image src={ot.clientSignatureUrl} alt="Firma Cliente" fill className="object-contain" />
                    </div>
                  ) : (
                    <Dialog open={signatureType === 'client'} onOpenChange={(open) => !open && setSignatureType(null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full" onClick={() => setSignatureType('client')} disabled={isMock}>
                          <SignatureIcon className="h-4 w-4 mr-2" /> Capturar Firma Cliente
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Firma del Cliente</DialogTitle>
                          <DialogDescription>Solicite al cliente que firme en el recuadro para confirmar recepción.</DialogDescription>
                        </DialogHeader>
                        <SignaturePad 
                          title="Cliente" 
                          isSaving={isSavingSignature} 
                          onCancel={() => setSignatureType(null)} 
                          onSave={handleSaveSignature} 
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Libro Digital de Obra</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {!['aprobada', 'rechazada'].includes(ot.status) && (
                <div className="flex gap-2">
                  <Textarea 
                    placeholder="Añadir comentario o incidencia a la bitácora..." 
                    className="min-h-[60px]"
                    value={manualComment}
                    onChange={(e) => setManualComment(e.target.value)}
                  />
                  <Button 
                    className="self-end" 
                    size="icon" 
                    onClick={handleAddComment}
                    disabled={isAddingComment || !manualComment.trim()}
                  >
                    {isAddingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                  </Button>
                </div>
              )}

              <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-muted">
                {logbook.map((entry) => (
                  <div key={entry.id} className="relative">
                    <div className="absolute -left-[23px] top-1 h-4 w-4 rounded-full bg-background border-2 border-primary" />
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">
                          {entry.eventType === 'comment' ? 'COMENTARIO TÉCNICO' : entry.eventType.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{formatDate(entry.timestamp)}</span>
                      </div>
                      <p className="text-sm font-medium">{entry.eventDetails}</p>
                      <p className="text-[10px] text-muted-foreground">Responsable: {MOCK_USERS.find(u => u.id === entry.actor)?.name || 'Sistema'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-primary/5">
            <CardHeader><CardTitle className="text-sm">Estado del Servicio</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {['creada', 'asignada', 'ejecutada', 'en revision', 'aprobada'].map((step, idx) => {
                const steps = ['creada', 'asignada', 'ejecutada', 'en revision', 'aprobada'];
                const currentIdx = steps.indexOf(ot.status);
                const isDone = currentIdx >= idx;
                return (
                  <div key={step} className="flex items-center gap-3">
                    <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold", isDone ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground")}>
                      {isDone ? "✓" : idx + 1}
                    </div>
                    <span className={cn("text-xs uppercase", isDone ? "font-bold text-foreground" : "text-muted-foreground")}>
                      {step}
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
