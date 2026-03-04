
"use client";

import { use, useState, useEffect, useRef, useMemo } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  History, 
  ArrowLeft,
  Loader2,
  FileDown,
  ListChecks,
  MessageSquare,
  Signature as SignatureIcon,
  Check,
  Star,
  ShieldCheck,
  Send,
  Users
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { doc, collection, addDoc, serverTimestamp, query, orderBy, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { WorkOrder, DigitalLogbookEntry, Company, PartUsage, Client, Asset, StaffMember } from "@/lib/types";
import { WorkOrderReport } from "@/components/WorkOrderReport";
import { FirebaseImage } from "@/components/FirebaseImage";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

function EvaluationForm({ 
  onSave, 
  isSaving 
}: { 
  onSave: (ratings: any, comment: string) => void, 
  isSaving: boolean 
}) {
  const [ratings, setRatings] = useState({
    quality: 0,
    timing: 0,
    safety: 0,
    documentation: 0
  });
  const [comment, setComment] = useState("");

  const criteria = [
    { key: 'quality', label: 'Calidad Ejecución', desc: 'Cumplimiento de especificaciones técnicas.' },
    { key: 'timing', label: 'Cumplimiento Plazos', desc: 'Respeto a las fechas comprometidas.' },
    { key: 'safety', label: 'Seguridad y Entorno', desc: 'Orden y limpieza durante el trabajo.' },
    { key: 'documentation', label: 'Claridad Reportes', desc: 'Calidad de la evidencia y documentación.' }
  ];

  const canSubmit = Object.values(ratings).every(r => r > 0) && comment.trim().length > 5;

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {criteria.map((c) => (
          <div key={c.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted/20 rounded-lg">
            <div className="space-y-0.5">
              <p className="text-sm font-bold">{c.label}</p>
              <p className="text-[10px] text-muted-foreground">{c.desc}</p>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRatings({ ...ratings, [c.key]: star })}
                  className={cn(
                    "p-1 transition-transform hover:scale-110",
                    (ratings as any)[c.key] >= star ? "text-amber-500" : "text-slate-300"
                  )}
                >
                  <Star className={cn("h-5 w-5", (ratings as any)[c.key] >= star && "fill-amber-500")} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase text-muted-foreground">Comentarios y Observaciones</Label>
        <Textarea 
          placeholder="Describa su experiencia..." 
          className="min-h-[100px] text-sm"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      <Button 
        className="w-full h-12 text-sm font-bold gap-2" 
        disabled={!canSubmit || isSaving}
        onClick={() => onSave(ratings, comment)}
      >
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Enviar Evaluación</>}
      </Button>
    </div>
  );
}

function SignaturePad({ onSave, onCancel, isSaving }: { onSave: (blob: Blob) => void, onCancel: () => void, isSaving: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#000';
  }, []);

  const startDrawing = (e: any) => { 
    setIsDrawing(true); 
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => { setIsDrawing(false); };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.touches[0].clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.touches[0].clientY - rect.top;
    
    // Support for both mouse and touch
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    if (clientX !== undefined && clientY !== undefined) {
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      ctx.lineTo(x, y); ctx.stroke();
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-lg bg-white overflow-hidden touch-none">
        <canvas 
          ref={canvasRef} 
          width={400} 
          height={200} 
          className="w-full cursor-crosshair h-[200px]" 
          onMouseDown={startDrawing} 
          onMouseUp={stopDrawing} 
          onMouseMove={draw} 
          onTouchStart={(e) => { e.preventDefault(); startDrawing(e); }} 
          onTouchEnd={stopDrawing} 
          onTouchMove={(e) => { e.preventDefault(); draw(e); }} 
        />
      </div>
      <div className="flex justify-between gap-2">
        <Button variant="outline" size="sm" onClick={() => canvasRef.current?.getContext('2d')?.clearRect(0, 0, 400, 200)} disabled={isSaving}>Limpiar</Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
          <Button size="sm" onClick={() => canvasRef.current?.toBlob(b => b && onSave(b), 'image/png')} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />} Guardar Firma
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
  const { profile, isReviewer } = useUser();
  const db = useFirestore();
  const storage = useStorage();
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [manualComment, setManualComment] = useState("");
  const [signatureType, setSignatureType] = useState<'client' | 'technician' | null>(null);
  const [isEvalOpen, setIsEvalOpen] = useState(false);
  const [resolvedSignatures, setResolvedSignatures] = useState<{tech?: string, client?: string}>({});

  const otRef = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return doc(db, "companies", profile.companyId, "workOrders", otId);
  }, [db, profile?.companyId, otId]);

  const { data: ot, isLoading: isDocLoading } = useDoc<WorkOrder>(otRef);
  
  const companyRef = useMemoFirebase(() => db && profile?.companyId ? doc(db, "companies", profile.companyId) : null, [db, profile?.companyId]);
  const { data: company } = useDoc<Company>(companyRef);

  const staffQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId || !ot?.assignedToStaffIds || ot.assignedToStaffIds.length === 0) return null;
    return query(
      collection(db, "companies", profile.companyId, "staff"), 
      where("__name__", "in", ot.assignedToStaffIds)
    );
  }, [db, profile?.companyId, ot?.assignedToStaffIds]);
  
  const { data: assignedStaff } = useCollection<StaffMember>(staffQuery);

  const clientRef = useMemoFirebase(() => {
    if (!db || !profile?.companyId || !ot?.clientId) return null;
    return doc(db, "companies", profile.companyId, "clients", ot.clientId);
  }, [db, profile?.companyId, ot?.clientId]);
  const { data: client } = useDoc<Client>(clientRef);

  const assetRef = useMemoFirebase(() => {
    if (!db || !profile?.companyId || !ot?.assetId) return null;
    return doc(db, "companies", profile.companyId, "assets", ot.assetId);
  }, [db, profile?.companyId, ot?.assetId]);
  const { data: asset } = useDoc<Asset>(assetRef);

  const logbookQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return query(collection(db, "companies", profile.companyId, "workOrders", otId, "digitalLogbookEntries"), orderBy("timestamp", "desc"));
  }, [db, profile?.companyId, otId]);
  const { data: logbook } = useCollection<DigitalLogbookEntry>(logbookQuery);

  const partUsagesQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return collection(db, "companies", profile.companyId, "workOrders", otId, "partUsages");
  }, [db, profile?.companyId, otId]);
  const { data: partUsages } = useCollection<PartUsage>(partUsagesQuery);

  const formatDateLabel = (date: any) => {
    if (!date) return "...";
    try {
      const d = date.toDate ? date.toDate() : (typeof date === 'string' ? parseISO(date) : date);
      return format(d, "dd MMM yyyy HH:mm", { locale: es });
    } catch (e) { return "N/A"; }
  };

  /**
   * Resuelve una URL de imagen a Base64 para evitar bloqueos CORS en Canvas/PDF.
   */
  const getBase64Image = async (url: string) => {
    if (!url) return undefined;
    try {
      // Intentar fetch con cache-bust para saltar bloqueos de CORS por cacheo incompleto
      const response = await fetch(url + (url.includes('?') ? '&' : '?') + 'cb=' + Date.now(), {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) throw new Error('Fetch failed');
      const blob = await response.blob();
      
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn("CORS/Fetch error resolving signature for PDF. Falling back to direct URL.", e);
      return url; // Si falla, devolvemos la URL y que html2canvas intente manejarlo
    }
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current || !ot) return;
    setIsGeneratingPdf(true);
    toast({ title: "Generando reporte...", description: "Procesando evidencias gráficas." });
    
    try {
      // Resolvemos firmas a Base64 en paralelo antes de la captura
      const [techBase64, clientBase64] = await Promise.all([
        ot.technicianSignatureUrl ? getBase64Image(ot.technicianSignatureUrl) : Promise.resolve(undefined),
        ot.clientSignatureUrl ? getBase64Image(ot.clientSignatureUrl) : Promise.resolve(undefined)
      ]);
      
      setResolvedSignatures({ tech: techBase64, client: clientBase64 });

      // Breve espera para que el componente oculto actualice sus src
      await new Promise(resolve => setTimeout(resolve, 800));

      const canvas = await html2canvas(reportRef.current, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: "#ffffff",
        logging: false,
        allowTaint: false,
        imageTimeout: 15000
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`REPORTE_TECNICO_PCG_${ot.id}.pdf`);
      
      toast({ title: "Reporte generado", description: "El documento se ha descargado." });
    } catch (e: any) { 
      console.error("PDF Generation Error:", e);
      toast({ title: "Error al generar PDF", description: "Hubo un problema al procesar las imágenes.", variant: "destructive" }); 
    } finally { 
      setIsGeneratingPdf(false); 
    }
  };

  const handleSaveEvaluation = async (ratings: any, comment: string) => {
    if (!db || !profile || !ot) return;
    setIsUpdating(true);
    try {
      const evalCol = collection(db, "companies", profile.companyId, "evaluations");
      const newEval = {
        workOrderId: ot.id,
        clientId: ot.clientId,
        companyId: profile.companyId,
        reviewerId: profile.id,
        reviewerName: profile.name,
        ratings,
        comment,
        createdAt: serverTimestamp()
      };
      const evalDoc = await addDoc(evalCol, newEval);
      updateDocumentNonBlocking(otRef!, { evaluationId: evalDoc.id, status: 'aprobada', reviewedAt: serverTimestamp() });
      toast({ title: "Evaluación enviada", description: "El trabajo ha sido aprobado y evaluado." });
      setIsEvalOpen(false);
    } catch (e: any) {
      toast({ title: "Error al evaluar", description: e.message, variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isDocLoading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!ot) return <div className="p-8 text-center border-2 border-dashed rounded-3xl m-10">Orden no encontrada.</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 px-4">
      {/* REPORTE OCULTO PARA PDF */}
      <div className="fixed -left-[10000px] top-0 pointer-events-none opacity-0">
        <WorkOrderReport 
          ref={reportRef} 
          company={company || null} 
          workOrder={ot} 
          client={client || null} 
          asset={asset || null} 
          logbook={logbook || []} 
          assignedStaff={assignedStaff || []} 
          partUsages={partUsages || []}
          techSignatureBase64={resolvedSignatures.tech}
          clientSignatureBase64={resolvedSignatures.client}
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <Button variant="ghost" size="icon" asChild><Link href="/work-orders"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black">{ot.id}</h2>
            <Badge className={cn(
              "font-black uppercase text-[10px] tracking-widest",
              ot.status === 'aprobada' ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-700'
            )}>{ot.status}</Badge>
          </div>
          <div className="text-muted-foreground text-[11px] font-bold flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-primary" /> Equipo Responsable:</span>
            {assignedStaff && assignedStaff.length > 0 ? (
              assignedStaff.map(s => <Badge key={s.id} variant="outline" className="text-[9px] h-5 bg-white border-primary/20">{s.name}</Badge>)
            ) : (
              <span className="italic text-slate-400">Sin personal asignado</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleDownloadPdf} disabled={isGeneratingPdf} className="h-11 font-bold border-2">
            {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileDown className="h-4 w-4 mr-2" />} 
            Descargar Informe PDF
          </Button>
          
          {isReviewer && ot.status === 'en revision' && client?.evaluationEnabled && (
            <Dialog open={isEvalOpen} onOpenChange={setIsEvalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-amber-600 hover:bg-amber-700 h-11 px-6 font-bold gap-2"><Star className="h-4 w-4" /> Aprobar y Evaluar</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-amber-600" /> Evaluación de Servicio</DialogTitle>
                  <DialogDescription>Su opinión técnica es fundamental para nuestra mejora continua.</DialogDescription>
                </DialogHeader>
                <EvaluationForm isSaving={isUpdating} onSave={handleSaveEvaluation} />
              </DialogContent>
            </Dialog>
          )}

          {!isReviewer && ot.status !== 'aprobada' && (
            <Button className="bg-emerald-600 hover:bg-emerald-700 h-11 px-6 font-bold" onClick={() => updateDocumentNonBlocking(otRef!, { status: 'aprobada', reviewedAt: serverTimestamp() })}>Finalizar Trabajo</Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/10 border-b"><CardTitle className="text-lg font-bold">Información de Campo</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <p className="text-[10px] font-black text-primary uppercase mb-1 tracking-widest">Cliente / Entidad</p>
                  <p className="text-sm font-black text-slate-900">{client?.name || 'S/I'}</p>
                </div>
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <p className="text-[10px] font-black text-primary uppercase mb-1 tracking-widest">Maquinaria / Activo</p>
                  <p className="text-sm font-black text-slate-900">{asset?.name || 'S/I'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción de Trabajos</Label>
                <div className="p-4 bg-slate-50 rounded-2xl text-sm leading-relaxed text-slate-700 border">
                  {ot.description}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="bg-muted/10 border-b"><CardTitle className="text-lg font-bold flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" /> Protocolo de Verificación</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-3">
              {ot.checklist?.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 p-4 bg-white border-2 rounded-2xl hover:border-primary/20 transition-all group">
                  <div className="flex items-center gap-4">
                    <Checkbox 
                      checked={item.completed} 
                      onCheckedChange={() => {
                        const newChecklist = ot.checklist?.map(i => i.id === item.id ? { ...i, completed: !i.completed, completedAt: !i.completed ? new Date().toISOString() : null } : i);
                        updateDocumentNonBlocking(otRef!, { checklist: newChecklist, updatedAt: serverTimestamp() });
                      }} 
                      disabled={ot.status === 'aprobada' || isReviewer}
                      className="h-5 w-5"
                    />
                    <span className={cn("text-sm font-medium", item.completed && "line-through text-muted-foreground font-normal")}>{item.task}</span>
                  </div>
                  {item.completedAt && (
                    <span className="text-[10px] font-black text-slate-300 uppercase italic">OK: {format(new Date(item.completedAt), "HH:mm")}</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="bg-muted/10 border-b"><CardTitle className="text-lg font-bold flex items-center gap-2"><SignatureIcon className="h-5 w-5 text-primary" /> Evidencia de Conformidad</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-8 p-6">
              <div className="space-y-3 text-center">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Firma Responsable Técnico</p>
                {ot.technicianSignatureUrl ? (
                  <div className="border-2 rounded-2xl p-4 h-40 flex items-center justify-center bg-slate-50 shadow-inner group relative">
                    <FirebaseImage url={ot.technicianSignatureUrl} className="max-h-full" />
                  </div>
                ) : (
                  <Button variant="outline" className="w-full h-24 border-2 border-dashed rounded-2xl flex flex-col gap-2" onClick={() => setSignatureType('technician')} disabled={isReviewer}>
                    <SignatureIcon className="h-6 w-6 text-slate-300" />
                    <span className="text-xs font-bold text-slate-400">Capturar Firma Personal</span>
                  </Button>
                )}
              </div>
              <div className="space-y-3 text-center">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Firma Recepción Cliente</p>
                {ot.clientSignatureUrl ? (
                  <div className="border-2 rounded-2xl p-4 h-40 flex items-center justify-center bg-slate-50 shadow-inner">
                    <FirebaseImage url={ot.clientSignatureUrl} className="max-h-full" />
                  </div>
                ) : (
                  <Button variant="outline" className="w-full h-24 border-2 border-dashed rounded-2xl flex flex-col gap-2" onClick={() => setSignatureType('client')}>
                    <SignatureIcon className="h-6 w-6 text-slate-300" />
                    <span className="text-xs font-bold text-slate-400">Capturar Firma Cliente</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm h-fit">
            <CardHeader className="bg-slate-900 text-white"><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><History className="h-4 w-4 text-primary" /> Bitácora Auditada</CardTitle></CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex gap-2">
                <Textarea placeholder="Reportar novedad..." className="min-h-[80px] text-xs bg-slate-50" value={manualComment} onChange={e => setManualComment(e.target.value)} />
                <Button size="icon" className="shrink-0 h-auto" onClick={() => {
                  if (!manualComment.trim() || !profile) return;
                  addDoc(collection(db!, "companies", profile.companyId, "workOrders", ot.id, "digitalLogbookEntries"), {
                    workOrderId: ot.id, companyId: profile.companyId, timestamp: serverTimestamp(), eventType: 'comment', eventDetails: manualComment, actor: profile.id
                  });
                  setManualComment("");
                }}><MessageSquare className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-4 border-l-2 border-slate-100 pl-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {logbook?.map(entry => (
                  <div key={entry.id} className="relative pb-4 last:pb-0">
                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-white" />
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">{entry.eventType}</p>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{entry.eventDetails}</p>
                    <p className="text-[9px] text-slate-400 mt-1 font-bold italic">{formatDateLabel(entry.timestamp)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {signatureType && (
        <Dialog open={true} onOpenChange={() => setSignatureType(null)}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader><DialogTitle className="text-xl font-black">Capturar Firma Digital: {signatureType === 'client' ? 'Cliente' : 'Técnico'}</DialogTitle></DialogHeader>
            <SignaturePad isSaving={isUpdating} onCancel={() => setSignatureType(null)} onSave={async blob => {
              if (!profile?.companyId || !storage) return;
              setIsUpdating(true);
              try {
                const path = `companies/${profile.companyId}/workOrders/${ot.id}/sig_${Date.now()}.png`;
                const sRef = ref(storage, path);
                await uploadBytes(sRef, blob);
                const url = await getDownloadURL(sRef);
                updateDocumentNonBlocking(otRef!, signatureType === 'client' ? { clientSignatureUrl: url } : { technicianSignatureUrl: url });
                setSignatureType(null);
                toast({ title: "Firma guardada", description: "La evidencia ha sido vinculada a la orden de trabajo." });
              } catch (e: any) {
                toast({ title: "Error al subir firma", description: e.message, variant: "destructive" });
              } finally {
                setIsUpdating(false);
              }
            }} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
