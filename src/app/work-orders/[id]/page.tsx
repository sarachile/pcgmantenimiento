
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
  AlertTriangle
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
    ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#000';
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
      <div className="border-2 border-dashed rounded-lg bg-white overflow-hidden touch-none">
        <canvas 
          ref={canvasRef} width={400} height={200} className="w-full cursor-crosshair h-[200px]" 
          onMouseDown={startDrawing} onMouseUp={stopDrawing} onMouseMove={draw} 
          onTouchStart={(e) => { e.preventDefault(); startDrawing(e); }} 
          onTouchEnd={stopDrawing} onTouchMove={(e) => { e.preventDefault(); draw(e); }} 
        />
      </div>
      <div className="flex justify-between gap-2">
        <Button variant="outline" size="sm" onClick={() => canvasRef.current?.getContext('2d')?.clearRect(0, 0, 400, 200)} disabled={isSaving}>Limpiar</Button>
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
  const { data: company } = useDoc<Company>(useMemoFirebase(() => db && profile?.companyId ? doc(db, "companies", profile.companyId) : null, [db, profile?.companyId]));

  const staffQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId || !ot?.assignedToStaffIds || ot.assignedToStaffIds.length === 0) return null;
    return query(collection(db, "companies", profile.companyId, "staff"), where("__name__", "in", ot.assignedToStaffIds));
  }, [db, profile?.companyId, ot?.assignedToStaffIds]);
  const { data: assignedStaff } = useCollection<StaffMember>(staffQuery);

  const clientRef = useMemoFirebase(() => db && profile?.companyId && ot?.clientId ? doc(db, "companies", profile.companyId, "clients", ot.clientId) : null, [db, profile?.companyId, ot?.clientId]);
  const { data: client } = useDoc<Client>(clientRef);

  const assetRef = useMemoFirebase(() => db && profile?.companyId && ot?.assetId ? doc(db, "companies", profile.companyId, "assets", ot.assetId) : null, [db, profile?.companyId, ot?.assetId]);
  const { data: asset } = useDoc<Asset>(assetRef);

  const logbookQuery = useMemoFirebase(() => db && profile?.companyId ? query(collection(db, "companies", profile.companyId, "workOrders", otId, "digitalLogbookEntries"), orderBy("timestamp", "desc")) : null, [db, profile?.companyId, otId]);
  const { data: logbook } = useCollection<DigitalLogbookEntry>(logbookQuery);

  const partUsagesQuery = useMemoFirebase(() => db && profile?.companyId ? collection(db, "companies", profile.companyId, "workOrders", otId, "partUsages") : null, [db, profile?.companyId, otId]);
  const { data: partUsages } = useCollection<PartUsage>(partUsagesQuery);

  const formatDateLabel = (date: any) => {
    if (!date) return "...";
    try {
      const d = date.toDate ? date.toDate() : (typeof date === 'string' ? parseISO(date) : date);
      return format(d, "dd MMM yyyy HH:mm", { locale: es });
    } catch (e) { return "N/A"; }
  };

  const qrUrl = useMemo(() => currentUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}` : "", [currentUrl]);

  const handleDownloadPdf = async () => {
    if (!reportRef.current || !ot) return;
    setIsGeneratingPdf(true);
    toast({ title: "Generando reporte...", description: "Procesando evidencias." });
    try {
      const getBase64 = async (url: string) => {
        const resp = await fetch(url + (url.includes('?') ? '&' : '?') + 'cb=' + Date.now());
        const blob = await resp.blob();
        return new Promise<string>((res) => { const r = new FileReader(); r.onloadend = () => res(r.result as string); r.readAsDataURL(blob); });
      };
      const [t, c] = await Promise.all([ot.technicianSignatureUrl ? getBase64(ot.technicianSignatureUrl) : Promise.resolve(undefined), ot.clientSignatureUrl ? getBase64(ot.clientSignatureUrl) : Promise.resolve(undefined)]);
      setResolvedSignatures({ tech: t, client: c });
      await new Promise(r => setTimeout(r, 1000));
      const canv = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff", imageTimeout: 15000 });
      const img = canv.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pw = pdf.internal.pageSize.getWidth();
      pdf.addImage(img, "PNG", 0, 0, pw, (canv.height * pw) / canv.width);
      pdf.save(`REPORTE_TECNICO_PCG_${ot.id}.pdf`);
      toast({ title: "Reporte descargado" });
    } catch (e) { toast({ title: "Error en PDF", variant: "destructive" }); } finally { setIsGeneratingPdf(false); }
  };

  const handleInternalApproval = async (ratings: any, comment: string) => {
    if (!db || !profile || !ot || !otRef) return;
    setIsUpdating(true);
    try {
      const evalDoc = await addDoc(collection(db, "companies", profile.companyId, "evaluations"), {
        workOrderId: ot.id, clientId: ot.clientId, companyId: profile.companyId, reviewerId: profile.id, reviewerName: profile.name, ratings, comment, createdAt: serverTimestamp()
      });
      const nextStatus = ot.reviewerRequired ? 'pendiente cliente' : 'aprobada';
      updateDocumentNonBlocking(otRef, { evaluationId: evalDoc.id, status: nextStatus, reviewedAt: serverTimestamp(), updatedAt: serverTimestamp(), rejectedReason: null });
      if (ot.reviewerRequired && client?.contactEmail) {
        await sendSystemEmail({ to: client.contactEmail, subject: `SOLICITUD DE APROBACIÓN: OT ${ot.id}`, html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #eee;padding:30px;border-radius:12px;"><h2>Orden de Trabajo Finalizada: ${ot.id}</h2><p>Estimados <strong>${client?.name}</strong>, se ha completado el servicio técnico.</p><p>Favor revisar el reporte y firmar en el siguiente link:</p><div style="text-align:center;margin:30px;"><a href="${currentUrl}" style="background:#1e3a8a;color:white;padding:15px 30px;text-decoration:none;border-radius:8px;font-weight:bold;">REVISAR Y FIRMAR</a></div></div>` });
      }
      setIsEvalOpen(false);
      toast({ title: "Validación completada" });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); } finally { setIsUpdating(false); }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.companyId || !ot || !storage || !otRef) return;
    setIsUploading(true);
    try {
      const path = `companies/${profile.companyId}/workOrders/${ot.id}/evidence_${Date.now()}`;
      const sRef = ref(storage, path);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      updateDocumentNonBlocking(otRef, { evidenceUrls: arrayUnion(url), updatedAt: serverTimestamp() });
      toast({ title: "Foto cargada" });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); } finally { setIsUploading(false); }
  };

  if (isDocLoading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!ot) return <div className="p-8 text-center">Orden no encontrada.</div>;

  const canEditPhotos = ot.status !== 'aprobada' && ot.status !== 'pendiente cliente';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="fixed -left-[10000px] top-0 pointer-events-none opacity-0">
        <WorkOrderReport forwardedRef={reportRef} company={company || null} workOrder={ot} client={client || null} asset={asset || null} logbook={logbook || []} assignedStaff={assignedStaff || []} partUsages={partUsages || []} techSignatureBase64={resolvedSignatures.tech} clientSignatureBase64={resolvedSignatures.client} qrCodeUrl={qrUrl} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-card p-6 rounded-2xl border">
        <Button variant="ghost" size="icon" asChild><Link href="/work-orders"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black">{ot.id}</h2>
            <Badge className={cn(ot.status === 'aprobada' && "bg-emerald-100 text-emerald-700", ot.status === 'rechazada' && "bg-rose-100 text-rose-700", ot.status === 'pendiente cliente' && "bg-indigo-100 text-indigo-700", ot.status === 'en revision' && "bg-amber-100 text-amber-700")}>{ot.status.toUpperCase()}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPdf} disabled={isGeneratingPdf}><FileDown className="h-4 w-4 mr-2" /> PDF</Button>
          {(isSupervisor || isCompanyAdmin) && (ot.status === 'en revision' || ot.status === 'rechazada') && (
            <Dialog open={isEvalOpen} onOpenChange={setIsEvalOpen}>
              <DialogTrigger asChild>
                <Button className={cn(ot.status === 'rechazada' ? "bg-rose-600" : "bg-amber-600")}>{ot.status === 'rechazada' ? "Solicitar Nueva Aprobación" : "Aprobar y Enviar"}</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{ot.status === 'rechazada' ? "Reiniciar Ciclo de Validación" : "Revisión Técnica de Supervisión"}</DialogTitle>
                  <DialogDescription>{ot.status === 'rechazada' ? "Confirme que las observaciones del cliente fueron resueltas." : "Evalúe internamente el trabajo antes de enviarlo al cliente."}</DialogDescription>
                </DialogHeader>
                <InternalApprovalForm isSaving={isUpdating} onSave={handleInternalApproval} isReApproval={ot.status === 'rechazada'} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {ot.status === 'rechazada' && ot.rejectedReason && (
        <Card className="border-2 border-rose-500 bg-rose-50 p-4">
          <p className="text-[10px] font-black text-rose-700 uppercase mb-1 flex items-center gap-2"><XCircle className="h-3 w-3" /> Motivo del Rechazo del Cliente</p>
          <p className="text-sm italic text-rose-900 bg-white p-4 rounded-xl border border-rose-200">"{ot.rejectedReason}"</p>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {ot.status === 'pendiente cliente' && (
            <Card className="border-2 border-indigo-500 border-dashed bg-indigo-50/30 p-6 flex flex-col md:flex-row items-center gap-6">
              <img src={qrUrl} className="w-32 h-32 border-2 rounded-xl" />
              <div className="text-center md:text-left space-y-2">
                <h3 className="font-black text-indigo-900 uppercase">Esperando Validación Externa</h3>
                <p className="text-sm text-slate-600">El cliente debe evaluar y firmar vía QR o link de correo.</p>
                <Button variant="outline" size="sm" asChild><a href={currentUrl} target="_blank">Abrir Portal Cliente</a></Button>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2"><Camera className="h-4 w-4" /> Evidencia Fotográfica</CardTitle>
              {canEditPhotos && (
                <>
                  <input type="file" className="hidden" ref={fileInputRef} onChange={handleUploadPhoto} />
                  <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>{isUploading ? <Loader2 className="animate-spin h-3 w-3" /> : "Añadir Foto"}</Button>
                </>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {ot.evidenceUrls?.map((u, i) => (
                  <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border bg-muted">
                    <FirebaseImage url={u} className="w-full h-full object-cover" />
                    {canEditPhotos && <Button size="icon" variant="destructive" className="absolute inset-0 m-auto opacity-0 group-hover:opacity-100 h-8 w-8" onClick={() => updateDocumentNonBlocking(otRef!, { evidenceUrls: arrayRemove(u) })}><Trash2 className="h-4 w-4" /></Button>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Protocolo de Trabajo</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {ot.checklist?.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-white border rounded-xl">
                  <div className="flex items-center gap-4">
                    <Checkbox checked={item.completed} onCheckedChange={() => updateDocumentNonBlocking(otRef!, { checklist: ot.checklist?.map(i => i.id === item.id ? { ...i, completed: !i.completed, completedAt: !i.completed ? new Date().toISOString() : null } : i) })} disabled={ot.status === 'aprobada' || ot.status === 'pendiente cliente'} />
                    <span className={cn("text-sm", item.completed && "line-through text-muted-foreground")}>{item.task}</span>
                  </div>
                  {item.completedAt && <span className="text-[10px] text-slate-400 italic">{format(new Date(item.completedAt), "HH:mm")}</span>}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Firmas de Validación</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-8">
              <div className="text-center space-y-2">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Firma Técnico</p>
                {ot.technicianSignatureUrl ? <div className="h-32 border rounded-xl bg-slate-50 flex items-center justify-center p-2"><FirebaseImage url={ot.technicianSignatureUrl} className="max-h-full" /></div> : <Button variant="outline" className="w-full h-32 border-dashed" onClick={() => setSignatureType('technician')} disabled={ot.status === 'aprobada' || ot.status === 'pendiente cliente'}><SignatureIcon className="h-6 w-6 opacity-20" /></Button>}
              </div>
              <div className="text-center space-y-2">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Firma Cliente</p>
                {ot.clientSignatureUrl ? <div className="h-32 border rounded-xl bg-slate-50 flex items-center justify-center p-2"><FirebaseImage url={ot.clientSignatureUrl} className="max-h-full" /></div> : <div className="h-32 border border-dashed rounded-xl flex items-center justify-center bg-slate-50/50 italic text-[10px] text-slate-400">Pendiente</div>}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="bg-slate-900 text-white"><CardTitle className="text-sm font-bold flex items-center gap-2"><History className="h-4 w-4" /> Bitácora</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
            <div className="flex gap-2">
              <Textarea placeholder="Nuevo comentario..." className="min-h-[60px] text-xs" value={manualComment} onChange={e => setManualComment(e.target.value)} />
              <Button size="icon" onClick={() => { if (!manualComment.trim() || !profile) return; addDoc(collection(db!, "companies", profile.companyId, "workOrders", ot.id, "digitalLogbookEntries"), { workOrderId: ot.id, companyId: profile.companyId, timestamp: serverTimestamp(), eventType: 'comment', eventDetails: manualComment, actor: profile.id }); setManualComment(""); }}><MessageSquare className="h-4 w-4" /></Button>
            </div>
            {logbook?.map(e => (
              <div key={e.id} className="relative pl-4 border-l-2 border-primary/20 pb-4 last:pb-0">
                <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-primary" />
                <p className="text-[10px] font-bold text-primary uppercase">{e.eventType}</p>
                <p className="text-xs text-slate-600">{e.eventDetails}</p>
                <p className="text-[9px] text-slate-400">{formatDateLabel(e.timestamp)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {signatureType && (
        <Dialog open={true} onOpenChange={() => setSignatureType(null)}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader><DialogTitle>Firma: {signatureType === 'technician' ? 'Técnico' : 'Cliente'}</DialogTitle></DialogHeader>
            <SignaturePad isSaving={isUpdating} onCancel={() => setSignatureType(null)} onSave={async b => {
              if (!profile?.companyId || !storage) return;
              setIsUpdating(true);
              try {
                const sRef = ref(storage, `companies/${profile.companyId}/workOrders/${ot.id}/sig_${Date.now()}`);
                await uploadBytes(sRef, b);
                const url = await getDownloadURL(sRef);
                const data: any = signatureType === 'client' ? { clientSignatureUrl: url } : { technicianSignatureUrl: url };
                if (signatureType === 'technician' && (ot.status === 'creada' || ot.status === 'rechazada')) { data.status = 'en revision'; data.executedAt = serverTimestamp(); }
                updateDocumentNonBlocking(otRef!, { ...data, updatedAt: serverTimestamp() });
                setSignatureType(null);
                toast({ title: "Firma guardada" });
              } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); } finally { setIsUpdating(false); }
            }} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
