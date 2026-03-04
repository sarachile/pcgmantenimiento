
"use client";

import { use, useState, useEffect, useRef, useMemo } from "react";
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
  Users,
  QrCode,
  ExternalLink,
  Mail,
  Building2,
  HardHat
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
import { sendSystemEmail } from "@/actions/email";

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
                  type="button"
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
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Enviar Evaluación y Aprobar</>}
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

  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: any) => { 
    setIsDrawing(true); 
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => { setIsDrawing(false); };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
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
        <Button variant="outline" size="sm" onClick={() => canvasRef.current?.getContext('2d')?.clearRect(0, 0, 400, 200)} disabled={isDrawing || isSaving}>Limpiar</Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSaving}>Cancelar</Button>
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
  const { profile, isSupervisor, isCompanyAdmin } = useUser();
  const db = useFirestore();
  const storage = useStorage();
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [manualComment, setManualComment] = useState("");
  const [signatureType, setSignatureType] = useState<'client' | 'technician' | null>(null);
  const [isEvalOpen, setIsEvalOpen] = useState(false);
  const [resolvedSignatures, setResolvedSignatures] = useState<{tech?: string, client?: string}>({});
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && profile?.companyId) {
      const baseUrl = window.location.origin;
      setCurrentUrl(`${baseUrl}/portal/approve/${otId}?c=${profile.companyId}`);
    }
  }, [otId, profile?.companyId]);

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

  const qrUrl = useMemo(() => {
    if (!currentUrl) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}`;
  }, [currentUrl]);

  const getBase64Image = async (url: string) => {
    if (!url) return undefined;
    try {
      const response = await fetch(url + (url.includes('?') ? '&' : '?') + 'cb=' + Date.now());
      if (!response.ok) throw new Error('Fetch failed');
      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      return url; 
    }
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current || !ot) return;
    setIsGeneratingPdf(true);
    toast({ title: "Generando reporte...", description: "Procesando evidencias gráficas." });
    
    try {
      const [techBase64, clientBase64] = await Promise.all([
        ot.technicianSignatureUrl ? getBase64Image(ot.technicianSignatureUrl) : Promise.resolve(undefined),
        ot.clientSignatureUrl ? getBase64Image(ot.clientSignatureUrl) : Promise.resolve(undefined)
      ]);
      
      setResolvedSignatures({ tech: techBase64, client: clientBase64 });
      await new Promise(resolve => setTimeout(resolve, 1000));

      const canvas = await html2canvas(reportRef.current, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: "#ffffff",
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
      toast({ title: "Error al generar PDF", description: "Hubo un problema al procesar las imágenes.", variant: "destructive" }); 
    } finally { 
      setIsGeneratingPdf(false); 
    }
  };

  const generateEmailHtml = (subject: string) => {
    const techNames = assignedStaff?.map(s => s.name).join(', ') || "Equipo Técnico";
    const approvalLink = currentUrl;
    
    return `
      <div style="font-family: sans-serif; max-width: 650px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; color: #1e293b; background-color: #ffffff;">
        <div style="background-color: #1e3a8a; padding: 40px 32px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0;">${subject}</h1>
        </div>
        <div style="padding: 32px;">
          <p>Estimados <strong>${client?.name}</strong>,</p>
          <p>Se ha completado una Orden de Trabajo. Detalles:</p>
          <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <p><strong>ID OT:</strong> ${ot?.id}</p>
            <p><strong>Equipo:</strong> ${asset?.name || 'S/I'}</p>
            <p><strong>Fecha:</strong> ${formatDateLabel(ot?.executedAt || new Date())}</p>
            <p><strong>Técnicos:</strong> ${techNames}</p>
          </div>
          <p>Para finalizar, favor revisar y firmar en el siguiente link:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${approvalLink}" style="background-color: #1e3a8a; color: #ffffff; padding: 18px 36px; text-decoration: none; border-radius: 12px; font-weight: 800; display: inline-block;">
              REVISAR Y FIRMAR SERVICIO
            </a>
          </div>
        </div>
      </div>
    `;
  };

  const handleInternalApproval = async (ratings: any, comment: string) => {
    if (!db || !profile || !ot || !otRef) return;
    setIsUpdating(true);
    try {
      const evalCol = collection(db, "companies", profile.companyId, "evaluations");
      const evalDoc = await addDoc(evalCol, {
        workOrderId: ot.id,
        clientId: ot.clientId,
        companyId: profile.companyId,
        reviewerId: profile.id,
        reviewerName: profile.name,
        ratings,
        comment,
        createdAt: serverTimestamp()
      });
      
      const nextStatus = ot.reviewerRequired ? 'pendiente cliente' : 'aprobada';
      
      updateDocumentNonBlocking(otRef, { 
        evaluationId: evalDoc.id, 
        status: nextStatus, 
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      if (ot.reviewerRequired && client?.contactEmail) {
        await sendSystemEmail({
          to: client.contactEmail,
          subject: `SOLICITUD DE APROBACIÓN: OT ${ot.id} - ${company?.name || 'PCGMANTENIMIENTO'}`,
          html: generateEmailHtml(`SOLICITUD DE APROBACIÓN: OT ${ot.id}`)
        });
      }
      
      setIsEvalOpen(false);
      toast({ title: "Validación completada" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResendInvitation = async () => {
    if (!ot || !client?.contactEmail) return;
    setIsUpdating(true);
    try {
      await sendSystemEmail({
        to: client.contactEmail,
        subject: `RE-ENVÍO: SOLICITUD DE APROBACIÓN: OT ${ot.id}`,
        html: generateEmailHtml(`RE-ENVÍO: SOLICITUD DE APROBACIÓN - OT ${ot.id}`)
      });
      toast({ title: "Invitación re-enviada" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isDocLoading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!ot) return <div className="p-8 text-center">Orden no encontrada.</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="fixed -left-[10000px] top-0 pointer-events-none opacity-0">
        <WorkOrderReport 
          forwardedRef={reportRef} 
          company={company || null} 
          workOrder={ot} 
          client={client || null} 
          asset={asset || null} 
          logbook={logbook || []} 
          assignedStaff={assignedStaff || []} 
          partUsages={partUsages || []}
          techSignatureBase64={resolvedSignatures.tech}
          clientSignatureBase64={resolvedSignatures.client}
          qrCodeUrl={qrUrl}
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-card p-6 rounded-2xl border">
        <Button variant="ghost" size="icon" asChild><Link href="/work-orders"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black">{ot.id}</h2>
            <Badge>{ot.status}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
            {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileDown className="h-4 w-4 mr-2" />} Reporte PDF
          </Button>
          {(isSupervisor || isCompanyAdmin) && ot.status === 'en revision' && (
            <Dialog open={isEvalOpen} onOpenChange={setIsEvalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-amber-600 hover:bg-amber-700">Aprobación Interna</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Validación de Supervisión</DialogTitle>
                </DialogHeader>
                <EvaluationForm isSaving={isUpdating} onSave={handleInternalApproval} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {ot.status === 'pendiente cliente' && (
            <Card className="border-2 border-indigo-500 border-dashed bg-indigo-50/30">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <img src={qrUrl} alt="QR Validación" className="w-32 h-32 border-2 rounded-xl" />
                  <div className="space-y-2 text-center md:text-left">
                    <h3 className="font-black text-indigo-900">ESPERANDO VALIDACIÓN EXTERNA</h3>
                    <p className="text-sm text-slate-600">Cliente debe firmar para cerrar la OT.</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild><a href={currentUrl} target="_blank">Ver Portal</a></Button>
                      <Button variant="ghost" size="sm" onClick={handleResendInvitation} disabled={isUpdating}>Re-enviar Mail</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Información de Campo</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Cliente</p>
                  <p className="text-sm font-bold">{client?.name || 'S/I'}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Activo</p>
                  <p className="text-sm font-bold">{asset?.name || 'S/I'}</p>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Descripción de Trabajos</Label>
                <div className="p-4 bg-slate-50 rounded-lg text-sm border">{ot.description}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5" /> Protocolo</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {ot.checklist?.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-white border rounded-xl">
                  <div className="flex items-center gap-4">
                    <Checkbox 
                      checked={item.completed} 
                      onCheckedChange={() => {
                        const newList = ot.checklist?.map(i => i.id === item.id ? { ...i, completed: !i.completed, completedAt: !i.completed ? new Date().toISOString() : null } : i);
                        updateDocumentNonBlocking(otRef!, { checklist: newList, updatedAt: serverTimestamp() });
                      }} 
                      disabled={ot.status === 'aprobada' || ot.status === 'pendiente cliente'}
                    />
                    <span className={cn("text-sm", item.completed && "line-through text-muted-foreground")}>{item.task}</span>
                  </div>
                  {item.completedAt && (
                    <span className="text-[10px] text-slate-400 italic">OK: {format(new Date(item.completedAt), "HH:mm")}</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Firmas</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-8">
              <div className="text-center space-y-2">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Firma Técnico</p>
                {ot.technicianSignatureUrl ? (
                  <FirebaseImage url={ot.technicianSignatureUrl} className="h-32 border rounded-xl bg-slate-50" />
                ) : (
                  <Button variant="outline" className="w-full h-32 border-dashed flex flex-col gap-2" onClick={() => setSignatureType('technician')} disabled={ot.status === 'aprobada' || ot.status === 'pendiente cliente'}>
                    <SignatureIcon className="h-6 w-6 opacity-20" />
                    <span className="text-xs">Capturar Firma</span>
                  </Button>
                )}
              </div>
              <div className="text-center space-y-2">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Firma Cliente</p>
                {ot.clientSignatureUrl ? (
                  <FirebaseImage url={ot.clientSignatureUrl} className="h-32 border rounded-xl bg-slate-50" />
                ) : (
                  <div className="h-32 border border-dashed rounded-xl flex items-center justify-center bg-slate-50/50">
                    <p className="text-[10px] text-slate-400 italic">Pendiente validación</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="bg-slate-900 text-white"><CardTitle className="text-sm font-bold flex items-center gap-2"><History className="h-4 w-4" /> Bitácora</CardTitle></CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex gap-2">
                <Textarea placeholder="Comentario..." className="min-h-[60px] text-xs" value={manualComment} onChange={e => setManualComment(e.target.value)} />
                <Button size="icon" onClick={() => {
                  if (!manualComment.trim() || !profile) return;
                  addDoc(collection(db!, "companies", profile.companyId, "workOrders", ot.id, "digitalLogbookEntries"), {
                    workOrderId: ot.id, companyId: profile.companyId, timestamp: serverTimestamp(), eventType: 'comment', eventDetails: manualComment, actor: profile.id
                  });
                  setManualComment("");
                }}><MessageSquare className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-4 border-l-2 pl-4 max-h-[400px] overflow-y-auto">
                {logbook?.map(entry => (
                  <div key={entry.id} className="relative pb-4 last:pb-0">
                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-white" />
                    <p className="text-[10px] font-bold text-primary">{entry.eventType.toUpperCase()}</p>
                    <p className="text-xs text-slate-600">{entry.eventDetails}</p>
                    <p className="text-[9px] text-slate-400 italic">{formatDateLabel(entry.timestamp)}</p>
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
            <DialogHeader><DialogTitle>Capturar Firma: {signatureType === 'client' ? 'Cliente' : 'Técnico'}</DialogTitle></DialogHeader>
            <SignaturePad isSaving={isUpdating} onCancel={() => setSignatureType(null)} onSave={async blob => {
              if (!profile?.companyId || !storage) return;
              setIsUpdating(true);
              try {
                const path = `companies/${profile.companyId}/workOrders/${ot.id}/sig_${Date.now()}.png`;
                const sRef = ref(storage, path);
                await uploadBytes(sRef, blob);
                const url = await getDownloadURL(sRef);
                const updateData: any = signatureType === 'client' ? { clientSignatureUrl: url } : { technicianSignatureUrl: url };
                
                if (signatureType === 'technician' && ot.status === 'creada') {
                  updateData.status = 'en revision';
                  updateData.executedAt = serverTimestamp();
                }

                updateDocumentNonBlocking(otRef!, { ...updateData, updatedAt: serverTimestamp() });
                setSignatureType(null);
                toast({ title: "Firma guardada" });
              } catch (e: any) {
                toast({ title: "Error", description: e.message, variant: "destructive" });
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
