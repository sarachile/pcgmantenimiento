
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
  HardHat,
  Camera,
  Image as ImageIcon,
  Trash2,
  XCircle,
  AlertTriangle,
  Plus
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
import { doc, collection, addDoc, serverTimestamp, query, orderBy, where, arrayUnion, arrayRemove } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { WorkOrder, DigitalLogbookEntry, Company, PartUsage, Client, Asset, StaffMember } from "@/lib/types";
import { WorkOrderReport } from "@/components/WorkOrderReport";
import { FirebaseImage } from "@/components/FirebaseImage";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { sendSystemEmail } from "@/actions/email";

function InternalApprovalForm({ 
  onSave, 
  isSaving,
  isReApproval = false
}: { 
  onSave: (ratings: any, comment: string) => void, 
  isSaving: boolean,
  isReApproval?: boolean
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

  const canSubmit = isReApproval ? true : Object.values(ratings).every(r => r > 0);

  return (
    <div className="space-y-6">
      {!isReApproval && (
        <div className="grid gap-4">
          <p className="text-xs font-bold text-primary uppercase tracking-widest border-b pb-2">Evaluación Técnica Interna</p>
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
      )}

      {isReApproval && (
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-amber-900">Preparar Nueva Solicitud</p>
            <p className="text-[11px] text-amber-700 leading-tight">Esta acción notificará nuevamente al cliente que las observaciones del rechazo han sido subsanadas.</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase text-muted-foreground">Observaciones de Supervisión</Label>
        <Textarea 
          placeholder={isReApproval ? "Indique qué correcciones se realizaron..." : "Comentarios adicionales sobre el desempeño técnico..."} 
          className="min-h-[100px] text-sm"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      <Button 
        className="w-full h-12 text-sm font-bold gap-2" 
        disabled={!canSubmit || isSaving}
        onClick={() => onSave(isReApproval ? {quality: 5, timing: 5, safety: 5, documentation: 5} : ratings, comment)}
      >
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> {isReApproval ? "Solicitar Nueva Aprobación al Cliente" : "Validar y Enviar al Cliente"}</>}
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
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#000000';
  }, []);

  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: any) => { 
    setIsDrawing(true); 
    const { x, y } = getCoordinates(e);
    canvasRef.current?.getContext('2d')?.beginPath();
    canvasRef.current?.getContext('2d')?.moveTo(x, y);
  };

  const stopDrawing = () => { setIsDrawing(false); };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(x, y); ctx.stroke();
  };

  return (
    <div className="space-y-4">
      <div className="border-4 border-slate-100 rounded-2xl bg-white overflow-hidden touch-none shadow-inner">
        <canvas 
          ref={canvasRef} width={400} height={250} className="w-full cursor-crosshair h-[250px]" 
          onMouseDown={startDrawing} onMouseUp={stopDrawing} onMouseMove={draw} 
          onTouchStart={(e) => { e.preventDefault(); startDrawing(e); }} 
          onTouchEnd={stopDrawing} onTouchMove={(e) => { e.preventDefault(); draw(e); }} 
        />
      </div>
      <div className="flex justify-between gap-4">
        <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => canvasRef.current?.getContext('2d')?.clearRect(0, 0, 400, 250)} disabled={isSaving}>Limpiar</Button>
        <div className="flex gap-2 flex-[2]">
          <Button variant="ghost" className="flex-1 h-12" onClick={onCancel} disabled={isSaving}>Cancelar</Button>
          <Button className="flex-[2] h-12 rounded-xl" onClick={() => canvasRef.current?.toBlob(b => b && onSave(b), 'image/png')} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <><Check className="mr-2 h-4 w-4" /> Guardar Firma</>}
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
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

  const companyId = profile?.companyId || "";

  const otRef = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return doc(db, "companies", companyId, "workOrders", otId);
  }, [db, companyId, otId]);

  const { data: ot, isLoading: isDocLoading } = useDoc<WorkOrder>(otRef);
  
  const companyRef = useMemoFirebase(() => db && companyId ? doc(db, "companies", companyId) : null, [db, companyId]);
  const { data: company } = useDoc<Company>(companyRef);

  const staffQuery = useMemoFirebase(() => {
    if (!db || !companyId || !ot?.assignedToStaffIds || ot.assignedToStaffIds.length === 0) return null;
    return query(collection(db, "companies", companyId, "staff"), where("__name__", "in", ot.assignedToStaffIds));
  }, [db, companyId, ot?.assignedToStaffIds]);
  const { data: assignedStaff } = useCollection<StaffMember>(staffQuery);

  const clientRef = useMemoFirebase(() => db && companyId && ot?.clientId ? doc(db, "companies", companyId, "clients", ot.clientId) : null, [db, companyId, ot?.clientId]);
  const { data: client } = useDoc<Client>(clientRef);

  const assetRef = useMemoFirebase(() => db && companyId && ot?.assetId ? doc(db, "companies", companyId, "assets", ot.assetId) : null, [db, companyId, ot?.assetId]);
  const { data: asset } = useDoc<Asset>(assetRef);

  const logbookQuery = useMemoFirebase(() => db && companyId ? query(collection(db, "companies", companyId, "workOrders", otId, "digitalLogbookEntries"), orderBy("timestamp", "desc")) : null, [db, companyId, otId]);
  const { data: logbook } = useCollection<DigitalLogbookEntry>(logbookQuery);

  const partUsagesQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "workOrders", otId, "partUsages") : null, [db, companyId, otId]);
  const { data: partUsages } = useCollection<PartUsage>(partUsagesQuery);

  const formatDateLabel = (date: any) => {
    if (!date) return "...";
    try {
      const d = date.toDate ? date.toDate() : (typeof date === 'string' ? parseISO(date) : date);
      return format(d, "dd MMM yyyy HH:mm", { locale: es });
    } catch (e) { return "N/A"; }
  };

  const qrUrl = useMemo(() => currentUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}` : "", [currentUrl]);

  const handleResendEmail = async () => {
    if (!ot || !client?.contactEmail || !companyId) return;
    setIsResendingEmail(true);
    try {
      const result = await sendSystemEmail({
        to: client.contactEmail,
        subject: `RE-ENVÍO: SOLICITUD DE APROBACIÓN TÉCNICA - OT ${ot.id}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px; color: #1e293b; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #1e3a8a; font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase;">${company?.name || 'PCGMANTENIMIENTO'}</h1>
              <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Servicios de Mantenimiento Industrial</p>
            </div>
            
            <h2 style="color: #1e3a8a; font-size: 20px; margin-bottom: 24px; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; font-weight: 800;">Solicitud de Aprobación de Servicio</h2>
            
            <p style="font-size: 15px; line-height: 1.6;">Estimados <strong>${client?.name}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.6;">Se ha completado la intervención técnica programada. A continuación, presentamos los detalles para su revisión y conformidad digital:</p>
            
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #e2e8f0;">
              <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold; width: 140px;">ORDEN DE TRABAJO:</td><td style="padding: 6px 0; font-weight: 900; color: #1e3a8a;">${ot.id}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">EQUIPO / ACTIVO:</td><td style="padding: 6px 0; font-weight: bold;">${asset?.name || 'S/I'} [${asset?.code || '-'}]</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">FECHA EJECUCIÓN:</td><td style="padding: 6px 0;">${formatDateLabel(ot.executedAt)}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">RESPONSABLE:</td><td style="padding: 6px 0;">${profile?.name || 'Equipo Técnico'}</td></tr>
              </table>
            </div>

            <div style="margin-bottom: 32px;">
              <p style="font-size: 13px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Trabajos Realizados:</p>
              <p style="font-size: 14px; color: #334155; font-style: italic; background: #fffbeb; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b;">"${ot.description}"</p>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${currentUrl}" style="background-color: #1e3a8a; color: #ffffff; padding: 18px 36px; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 16px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(30, 58, 138, 0.3);">
                REVISAR Y FIRMAR CONFORMIDAD
              </a>
              <p style="color: #94a3b8; font-size: 11px; margin-top: 16px;">Este link expira automáticamente al ser firmado.</p>
            </div>

            <div style="border-top: 1px solid #f1f5f9; padding-top: 24px; text-align: center;">
              <p style="font-size: 11px; color: #94a3b8;">Mensaje automático enviado vía <strong>PCGMANTENIMIENTO ERP</strong>. Por favor no responda a este correo.</p>
            </div>
          </div>
        `
      });
      if (result.success) toast({ title: "Correo Re-enviado", description: `Se envió la invitación a ${client.contactEmail}` });
      else throw new Error(result.error);
    } catch (e: any) { toast({ title: "Error en envío", description: e.message, variant: "destructive" }); } finally { setIsResendingEmail(false); }
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current || !ot) return;
    setIsGeneratingPdf(true);
    toast({ title: "Generando reporte técnico...", description: "Procesando firmas y evidencias." });
    try {
      const getBase64 = async (url: string) => {
        try {
          const resp = await fetch(url + (url.includes('?') ? '&' : '?') + 'cb=' + Date.now());
          const blob = await resp.blob();
          return new Promise<string>((res) => { const r = new FileReader(); r.onloadend = () => res(r.result as string); r.readAsDataURL(blob); });
        } catch (e) { return undefined; }
      };
      const [t, c] = await Promise.all([
        ot.technicianSignatureUrl ? getBase64(ot.technicianSignatureUrl) : Promise.resolve(undefined),
        ot.clientSignatureUrl ? getBase64(ot.clientSignatureUrl) : Promise.resolve(undefined)
      ]);
      setResolvedSignatures({ tech: t, client: c });
      await new Promise(r => setTimeout(r, 1500));
      const canv = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff", imageTimeout: 20000 });
      const img = canv.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pw = pdf.internal.pageSize.getWidth();
      pdf.addImage(img, "PNG", 0, 0, pw, (canv.height * pw) / canv.width);
      pdf.save(`REPORTE_PCG_${ot.id}_${new Date().getTime()}.pdf`);
      toast({ title: "PDF Generado Exitosamente" });
    } catch (e) { toast({ title: "Error al generar PDF", variant: "destructive" }); } finally { setIsGeneratingPdf(false); }
  };

  const handleInternalApproval = async (ratings: any, comment: string) => {
    if (!db || !profile || !ot || !otRef) return;
    setIsUpdating(true);
    try {
      const evalDoc = await addDoc(collection(db, "companies", companyId, "evaluations"), {
        workOrderId: ot.id, clientId: ot.clientId, companyId: companyId, reviewerId: profile.id, reviewerName: profile.name, ratings, comment, createdAt: serverTimestamp()
      });
      const nextStatus = ot.reviewerRequired ? 'pendiente cliente' : 'aprobada';
      updateDocumentNonBlocking(otRef, { evaluationId: evalDoc.id, status: nextStatus, reviewedAt: serverTimestamp(), updatedAt: serverTimestamp(), rejectedReason: null });
      
      if (ot.reviewerRequired && client?.contactEmail) {
        await handleResendEmail();
      }
      setIsEvalOpen(false);
      toast({ title: "Aprobación Interna Completada" });
    } catch (e: any) { toast({ title: "Error crítico", description: e.message, variant: "destructive" }); } finally { setIsUpdating(false); }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId || !ot || !storage || !otRef) return;
    setIsUploading(true);
    try {
      const path = `companies/${companyId}/workOrders/${ot.id}/evidence_${Date.now()}`;
      const sRef = ref(storage, path);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      updateDocumentNonBlocking(otRef, { evidenceUrls: arrayUnion(url), updatedAt: serverTimestamp() });
      toast({ title: "Evidencia fotográfica cargada" });
    } catch (e: any) { toast({ title: "Error al subir foto", description: e.message, variant: "destructive" }); } finally { setIsUploading(false); }
  };

  if (isDocLoading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!ot) return <div className="p-8 text-center border-2 border-dashed rounded-3xl opacity-50">La orden solicitada no existe o no tiene permisos.</div>;

  const canEditPhotos = ot.status !== 'aprobada' && ot.status !== 'pendiente cliente';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="fixed -left-[10000px] top-0 pointer-events-none opacity-0">
        <WorkOrderReport forwardedRef={reportRef} company={company || null} workOrder={ot} client={client || null} asset={asset || null} logbook={logbook || []} assignedStaff={assignedStaff || []} partUsages={partUsages || []} techSignatureBase64={resolvedSignatures.tech} clientSignatureBase64={resolvedSignatures.client} qrCodeUrl={qrUrl} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white p-6 rounded-[2rem] border shadow-sm sticky top-4 z-20 backdrop-blur-md bg-white/90">
        <Button variant="ghost" size="icon" asChild className="rounded-full"><Link href="/work-orders"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black italic tracking-tighter text-slate-900">{ot.id}</h2>
            <Badge className={cn(
              "px-3 py-1 font-black uppercase text-[10px] tracking-widest",
              ot.status === 'aprobada' && "bg-emerald-100 text-emerald-700", 
              ot.status === 'rechazada' && "bg-rose-100 text-rose-700", 
              ot.status === 'pendiente cliente' && "bg-indigo-100 text-indigo-700", 
              ot.status === 'en revision' && "bg-amber-100 text-amber-700"
            )}>{ot.status.replace(' ', '_').toUpperCase()}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPdf} disabled={isGeneratingPdf} className="rounded-xl h-11">
            {isGeneratingPdf ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <FileDown className="h-4 w-4 mr-2" />} Exportar PDF
          </Button>
          {(isSupervisor || isCompanyAdmin) && (ot.status === 'en revision' || ot.status === 'rechazada') && (
            <Dialog open={isEvalOpen} onOpenChange={setIsEvalOpen}>
              <DialogTrigger asChild>
                <Button className={cn("rounded-xl h-11 px-6 font-bold shadow-lg", ot.status === 'rechazada' ? "bg-rose-600" : "bg-amber-600")}>
                  {ot.status === 'rechazada' ? "Reiniciar Validación" : "Aprobación Interna"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-[2.5rem]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black italic">{ot.status === 'rechazada' ? "Reiniciar Ciclo" : "Revisión Técnica"}</DialogTitle>
                  <DialogDescription>Valide el trabajo técnico realizado antes de enviarlo al cliente final.</DialogDescription>
                </DialogHeader>
                <InternalApprovalForm isSaving={isUpdating} onSave={handleInternalApproval} isReApproval={ot.status === 'rechazada'} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {ot.status === 'rechazada' && ot.rejectedReason && (
        <Card className="border-2 border-rose-500 bg-rose-50 p-6 rounded-3xl shadow-md">
          <p className="text-[10px] font-black text-rose-700 uppercase mb-2 flex items-center gap-2 tracking-widest"><XCircle className="h-4 w-4" /> Motivo del Rechazo del Cliente</p>
          <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-inner">
            <p className="text-sm italic text-rose-900 font-medium leading-relaxed">"{ot.rejectedReason}"</p>
          </div>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {ot.status === 'pendiente cliente' && (
            <Card className="border-4 border-indigo-500 border-dashed bg-indigo-50/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 shadow-xl">
              <div className="bg-white p-4 rounded-3xl shadow-inner border-2 border-indigo-100 shrink-0">
                <img src={qrUrl} className="w-32 h-32" alt="QR de Aprobación" />
              </div>
              <div className="text-center md:text-left space-y-4 flex-1">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-indigo-900 uppercase tracking-tighter">Validación Externa Activa</h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">El cliente debe revisar y firmar desde su dispositivo. El enlace seguro ha sido enviado a su correo electrónico.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" className="rounded-xl bg-white gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50" onClick={handleResendEmail} disabled={isResendingEmail}>
                    {isResendingEmail ? <Loader2 className="animate-spin h-4 w-4" /> : <Mail className="h-4 w-4" />} 
                    Re-enviar Notificación
                  </Button>
                  <Button variant="ghost" className="rounded-xl h-10 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600" onClick={() => {
                    navigator.clipboard.writeText(currentUrl);
                    toast({ title: "Link Copiado", description: "El enlace seguro está en su portapapeles." });
                  }}><ExternalLink className="h-3.5 w-3.5 mr-2" /> Copiar Link Directo</Button>
                </div>
              </div>
            </Card>
          )}

          <Card className="rounded-3xl border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between p-6">
              <div>
                <CardTitle className="text-lg font-black flex items-center gap-2 uppercase tracking-tight"><Camera className="h-5 w-5 text-primary" /> Evidencias de Campo</CardTitle>
                <CardDescription>Registro visual de la intervención técnica.</CardDescription>
              </div>
              {canEditPhotos && (
                <>
                  <input type="file" className="hidden" ref={fileInputRef} onChange={handleUploadPhoto} accept="image/*" />
                  <Button size="sm" variant="outline" className="rounded-xl border-primary/20 text-primary" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    {isUploading ? <Loader2 className="animate-spin h-4 w-4" /> : <><Plus className="h-4 w-4 mr-2" /> Añadir Foto</>}
                  </Button>
                </>
              )}
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {ot.evidenceUrls && ot.evidenceUrls.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {ot.evidenceUrls.map((u, i) => (
                    <div key={i} className="group relative aspect-video rounded-2xl overflow-hidden border bg-slate-50 shadow-sm">
                      <FirebaseImage url={u} className="w-full h-full object-cover" />
                      {canEditPhotos && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button size="icon" variant="destructive" className="h-10 w-10 rounded-full" onClick={() => updateDocumentNonBlocking(otRef!, { evidenceUrls: arrayRemove(u) })}>
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-3xl bg-slate-50 opacity-40">
                  <ImageIcon className="h-10 w-10 mx-auto mb-2 text-slate-400" />
                  <p className="text-xs font-bold uppercase tracking-widest">Sin evidencias capturadas aún</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/5 p-6 border-b"><CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><ListChecks className="h-5 w-5" /> Protocolo de Inspección</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-3 bg-white">
              {ot.checklist && ot.checklist.length > 0 ? ot.checklist.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-white border-2 rounded-2xl hover:border-primary/20 transition-colors shadow-sm group">
                  <div className="flex items-center gap-4">
                    <Checkbox 
                      checked={item.completed} 
                      onCheckedChange={() => {
                        const newChecklist = ot.checklist?.map(i => i.id === item.id ? { ...i, completed: !i.completed, completedAt: !i.completed ? new Date().toISOString() : null } : i);
                        updateDocumentNonBlocking(otRef!, { checklist: newChecklist });
                      }} 
                      disabled={ot.status === 'aprobada' || ot.status === 'pendiente cliente'} 
                      className="h-6 w-6 rounded-lg"
                    />
                    <span className={cn("text-sm font-bold", item.completed ? "line-through text-slate-400" : "text-slate-700")}>{item.task}</span>
                  </div>
                  {item.completedAt && <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-tighter">{format(new Date(item.completedAt), "HH:mm 'hrs'")}</span>}
                </div>
              )) : (
                <p className="text-center py-6 text-xs font-bold text-slate-400 uppercase tracking-widest italic">No se definieron ítems para esta OT.</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
            <CardHeader className="p-6"><CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><SignatureIcon className="h-5 w-5" /> Firmas de Validación</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-8 p-6 bg-slate-50/50 border-t">
              <div className="text-center space-y-3">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Firma Técnico Responsable</p>
                {ot.technicianSignatureUrl ? (
                  <div className="h-40 border-2 rounded-[2rem] bg-white flex items-center justify-center p-4 shadow-inner">
                    <FirebaseImage url={ot.technicianSignatureUrl} className="max-h-full" />
                  </div>
                ) : (
                  <Button variant="outline" className="w-full h-40 border-4 border-dashed rounded-[2rem] flex-col gap-3 group" onClick={() => setSignatureType('technician')} disabled={ot.status === 'aprobada' || ot.status === 'pendiente cliente'}>
                    <SignatureIcon className="h-8 w-8 text-slate-300 group-hover:text-primary group-hover:scale-110 transition-all" />
                    <span className="text-[10px] font-black text-slate-400 uppercase">Capturar Firma</span>
                  </Button>
                )}
              </div>
              <div className="text-center space-y-3">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Firma Recepción Cliente</p>
                {ot.clientSignatureUrl ? (
                  <div className="h-40 border-2 rounded-[2rem] bg-white flex items-center justify-center p-4 shadow-inner">
                    <FirebaseImage url={ot.clientSignatureUrl} className="max-h-full" />
                  </div>
                ) : (
                  <div className="h-40 border-4 border-dashed rounded-[2rem] flex flex-col items-center justify-center bg-slate-100/50 italic text-[10px] text-slate-400 uppercase font-black tracking-widest">
                    Pendiente
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white overflow-hidden flex flex-col h-[700px]">
            <CardHeader className="bg-white/5 p-6 border-b border-white/10">
              <CardTitle className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3">
                <History className="h-4 w-4 text-blue-400" /> Historial de Operación
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
              <div className="p-6 bg-white/5 border-b border-white/10">
                <div className="flex gap-2">
                  <Textarea 
                    placeholder="Nuevo comentario técnico..." 
                    className="min-h-[80px] text-xs bg-white/10 border-white/20 text-white placeholder:text-white/30 rounded-xl" 
                    value={manualComment} 
                    onChange={e => setManualComment(e.target.value)} 
                  />
                  <Button size="icon" className="shrink-0 h-auto bg-blue-600 hover:bg-blue-500 rounded-xl" onClick={() => {
                    if (!manualComment.trim() || !profile) return;
                    addDoc(collection(db!, "companies", companyId, "workOrders", ot.id, "digitalLogbookEntries"), {
                      workOrderId: ot.id, companyId: companyId, timestamp: serverTimestamp(), eventType: 'comment', eventDetails: manualComment, actor: profile.id
                    });
                    setManualComment("");
                  }}><MessageSquare className="h-4 w-4" /></Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {logbook && logbook.length > 0 ? logbook.map(e => (
                  <div key={e.id} className="relative pl-6 border-l-2 border-white/10 pb-2 last:pb-0">
                    <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">{e.eventType.replace('_', ' ')}</p>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium mb-1">{e.eventDetails}</p>
                    <p className="text-[9px] text-slate-500 italic font-bold">{formatDateLabel(e.timestamp)}</p>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 italic text-xs py-20">Sin registros en bitácora</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {signatureType && (
        <Dialog open={true} onOpenChange={() => setSignatureType(null)}>
          <DialogContent className="sm:max-w-[450px] rounded-[2.5rem]">
            <DialogHeader><DialogTitle className="text-2xl font-black italic">Firma: {signatureType === 'technician' ? 'Técnico' : 'Cliente'}</DialogTitle></DialogHeader>
            <SignaturePad isSaving={isUpdating} onCancel={() => setSignatureType(null)} onSave={async b => {
              if (!companyId || !storage) return;
              setIsUpdating(true);
              try {
                const sRef = ref(storage, `companies/${companyId}/workOrders/${ot.id}/sig_${Date.now()}`);
                await uploadBytes(sRef, b);
                const url = await getDownloadURL(sRef);
                const data: any = signatureType === 'client' ? { clientSignatureUrl: url } : { technicianSignatureUrl: url };
                if (signatureType === 'technician' && (ot.status === 'creada' || ot.status === 'rechazada')) { data.status = 'en revision'; data.executedAt = serverTimestamp(); }
                updateDocumentNonBlocking(otRef!, { ...data, updatedAt: serverTimestamp() });
                setSignatureType(null);
                toast({ title: "Firma digital guardada exitosamente" });
              } catch (e: any) { toast({ title: "Error al guardar firma", description: e.message, variant: "destructive" }); } finally { setIsUpdating(false); }
            }} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
