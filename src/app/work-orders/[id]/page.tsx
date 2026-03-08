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
  Check,
  Send,
  Building2,
  HardHat,
  Camera,
  Trash2,
  Plus,
  Fingerprint,
  ClipboardList,
  Calendar as CalendarIcon,
  Award,
  MapPin,
  User,
  Hash,
  Zap,
  Sparkles,
  Copy,
  ImageOff,
  Edit2,
  SendHorizontal,
  CheckCircle2,
  AlertTriangle,
  Save
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
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useStorage, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp, query, orderBy, where, arrayUnion, arrayRemove } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { WorkOrder, DigitalLogbookEntry, Company, PartUsage, Client, Asset, StaffMember } from "@/lib/types";
import { WorkOrderReport } from "@/components/WorkOrderReport";
import { ExperienceCertificate } from "@/components/ExperienceCertificate";
import { FirebaseImage } from "@/components/FirebaseImage";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { sendSystemEmail } from "@/actions/email";
import { generateWorkOrderSummary } from "@/ai/flows/generate-work-order-summary";

export default function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const otId = resolvedParams.id;
  const { toast } = useToast();
  const { profile, isSupervisor, isCompanyAdmin } = useUser();
  const db = useFirestore();
  const storage = useStorage();
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);
  const certRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingCert, setIsGeneratingCert] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [manualComment, setManualComment] = useState("");
  const [isRequestCertDialogOpen, setIsRequestCertDialogOpen] = useState(false);
  
  const [tempClientEmail, setTempClientEmail] = useState("");
  const [tempClientName, setTempClientName] = useState("");
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

  const handleManualSave = () => {
    toast({
      title: "Progreso Guardado",
      description: "Toda la información actual ha sido sincronizada con el servidor.",
    });
    router.push('/work-orders');
  };

  const handleResendEmail = async (overrideEmail?: string) => {
    const targetEmail = overrideEmail || client?.contactEmail;
    if (!ot || !targetEmail || !companyId) return;
    
    setIsResendingEmail(true);
    try {
      const result = await sendSystemEmail({
        to: targetEmail,
        subject: `SOLICITUD DE APROBACIÓN TÉCNICA - OT ${ot.id}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px; color: #1e293b; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #1e3a8a; font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase;">${company?.name || 'PCGMANTENIMIENTO'}</h1>
              <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Servicios de Mantenimiento Industrial</p>
            </div>
            <h2 style="color: #1e3a8a; font-size: 20px; margin-bottom: 24px; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; font-weight: 800;">Solicitud de Aprobación de Servicio</h2>
            <p style="font-size: 15px; line-height: 1.6;">Estimados <strong>${client?.name}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.6;">Se ha completado la intervención técnica programada. A continuación, presentamos los detalles para su revisión y sello de aprobación digital:</p>
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #e2e8f0;">
              <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold; width: 140px;">ORDEN DE TRABAJO:</td><td style="padding: 6px 0; font-weight: 900; color: #1e3a8a;">${ot.id}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">EMPRESA MANDANTE:</td><td style="padding: 6px 0; font-weight: bold;">${client?.name || 'S/I'}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">EQUIPO / ACTIVO:</td><td style="padding: 6px 0; font-weight: bold;">${asset?.name || 'S/I'} [${asset?.code || '-'}]</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">DESCRIPCIÓN:</td><td style="padding: 6px 0; font-style: italic;">${ot.description}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">CÓDIGO DE ACCESO:</td><td style="padding: 6px 0;"><span style="background: #1e3a8a; color: #ffffff; padding: 4px 12px; border-radius: 6px; font-family: monospace; font-weight: 900; font-size: 18px; letter-spacing: 2px;">${ot.approvalPin || '------'}</span></td></tr>
              </table>
            </div>
            <div style="text-align: center; margin: 40px 0;">
              <a href="${currentUrl}" style="background-color: #1e3a8a; color: #ffffff; padding: 18px 36px; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 16px; display: inline-block;">
                REVISAR Y APROBAR DIGITALMENTE
              </a>
            </div>
            <p style="font-size: 12px; color: #94a3b8; text-align: center; font-style: italic;">PCGMANTENIMIENTO ERP</p>
          </div>
        `
      });
      if (result.success) toast({ title: "Correo Enviado" });
      else throw new Error(result.error);
    } catch (e: any) { toast({ title: "Error en envío", description: e.message, variant: "destructive" }); } finally { setIsResendingEmail(false); }
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current || !ot) return;
    setIsGeneratingPdf(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      const canv = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canv.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pw = pdf.internal.pageSize.getWidth();
      pdf.addImage(imgData, "PNG", 0, 0, pw, (canv.height * pw) / canv.width);
      pdf.save(`REPORTE_PCG_${ot.id}.pdf`);
    } catch (e) { toast({ title: "Error al generar PDF", variant: "destructive" }); } finally { setIsGeneratingPdf(false); }
  };

  const handleDownloadExperienceCert = async () => {
    if (!certRef.current || !ot || ot.status !== 'aprobada') return;
    setIsGeneratingCert(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      const canv = await html2canvas(certRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canv.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pw = pdf.internal.pageSize.getWidth();
      pdf.addImage(imgData, "PNG", 0, 0, pw, (canv.height * pw) / canv.width);
      pdf.save(`CERT_EXPERIENCIA_${ot.id}.pdf`);
    } catch (e) { toast({ title: "Error al generar certificado", variant: "destructive" }); } finally { setIsGeneratingCert(false); }
  };

  const handleGenerateAISummary = async () => {
    if (!ot || !logbook || !otRef) return;
    setIsGeneratingSummary(true);
    try {
      const result = await generateWorkOrderSummary({
        workOrder: { id: ot.id, description: ot.description, status: ot.status as any, createdAt: ot.createdAt?.toDate ? ot.createdAt.toDate().toISOString() : ot.createdAt, companyId: ot.companyId },
        digitalLogbookEntries: logbook.map(e => ({ id: e.id, timestamp: e.timestamp?.toDate ? e.timestamp.toDate().toISOString() : e.timestamp, eventType: e.eventType, eventDetails: e.eventDetails, actor: e.actor, workOrderId: ot.id }))
      });
      updateDocumentNonBlocking(otRef, { aiSummary: result.summary, updatedAt: serverTimestamp() });
      toast({ title: "Resumen IA Generado" });
    } catch (error: any) { toast({ title: "Error de IA", variant: "destructive" }); } finally { setIsGeneratingSummary(false); }
  };

  const handleRequestCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempClientEmail || !tempClientName || !ot || !clientRef) return;
    setIsUpdating(true);
    try {
      const updateData: any = { updatedAt: serverTimestamp() };
      if (tempClientEmail !== client?.contactEmail) updateData.contactEmail = tempClientEmail;
      if (tempClientName !== client?.contactName) updateData.contactName = tempClientName;
      if (Object.keys(updateData).length > 1) updateDocumentNonBlocking(clientRef, updateData);
      await handleResendEmail(tempClientEmail);
      setIsRequestCertDialogOpen(false);
    } catch (e: any) { toast({ title: "Error al procesar", variant: "destructive" }); } finally { setIsUpdating(false); }
  };

  const handleRequestClientApproval = async () => {
    if (!otRef) return;
    setIsUpdating(true);
    try {
      updateDocumentNonBlocking(otRef, { status: 'pendiente cliente', updatedAt: serverTimestamp(), rejectedReason: null });
      await handleResendEmail();
      toast({ title: "Enviado al cliente" });
    } catch (e: any) { toast({ title: "Error", variant: "destructive" }); } finally { setIsUpdating(false); }
  };

  const handleDirectApproval = async () => {
    if (!otRef || !profile) return;
    setIsUpdating(true);
    try {
      const verificationCode = `ADM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      updateDocumentNonBlocking(otRef, {
        status: 'aprobada',
        clientApprovalName: profile.name + " (Administración)",
        clientApprovalDate: serverTimestamp(),
        clientApprovalCode: verificationCode,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Orden Aprobada Internamente" });
    } catch (e: any) { toast({ title: "Error", variant: "destructive" }); } finally { setIsUpdating(false); }
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
      toast({ title: "Foto cargada y guardada" });
    } catch (e: any) { toast({ title: "Error al subir", variant: "destructive" }); } finally { setIsUploading(false); }
  };

  if (isDocLoading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!ot) return <div className="p-8 text-center border-2 border-dashed rounded-3xl opacity-50">Orden no encontrada.</div>;

  const isAdminOrSupervisor = isCompanyAdmin || isSupervisor;
  const checklistProgress = ot.checklist?.length ? (ot.checklist.filter(i => i.completed).length / ot.checklist.length) * 100 : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="fixed -left-[10000px] top-0 pointer-events-none opacity-0">
        <WorkOrderReport forwardedRef={reportRef} company={company || null} workOrder={ot} client={client || null} asset={asset || null} logbook={logbook || []} assignedStaff={assignedStaff || []} partUsages={partUsages || []} qrCodeUrl={qrUrl} />
        <ExperienceCertificate forwardedRef={certRef} company={company || null} workOrder={ot} client={client || null} asset={asset || null} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white p-6 rounded-[2rem] border shadow-sm sticky top-4 z-20 backdrop-blur-md bg-white/90">
        <Button variant="ghost" size="icon" asChild className="rounded-full"><Link href="/work-orders"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black italic tracking-tighter text-slate-900">{ot.id}</h2>
            <Badge className={cn(
              "px-3 py-1 font-black uppercase text-[10px] tracking-widest",
              ot.status === 'aprobada' && "bg-emerald-100 text-emerald-700", 
              ot.status === 'en revision' && "bg-amber-100 text-amber-700",
              ot.status === 'pendiente cliente' && "bg-indigo-100 text-indigo-700"
            )}>{ot.status.replace('_', ' ').toUpperCase()}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {ot.status !== 'aprobada' && (
            <Button onClick={handleManualSave} variant="outline" className="rounded-xl h-11 border-primary/20 text-primary font-black uppercase text-[10px] tracking-widest gap-2">
              <Save className="h-4 w-4" /> Guardar Avance
            </Button>
          )}

          {isAdminOrSupervisor && ot.status !== 'aprobada' && (
            <div className="flex gap-2 mr-4 border-r pr-4 border-slate-200">
              {ot.reviewerRequired ? (
                <Button onClick={handleRequestClientApproval} disabled={isUpdating} className="rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-indigo-200">
                  {isUpdating ? <Loader2 className="animate-spin h-4 w-4" /> : <><SendHorizontal className="h-4 w-4" /> Solicitar Validación Cliente</>}
                </Button>
              ) : (
                <Button onClick={handleDirectApproval} disabled={isUpdating} className="rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-emerald-200">
                  {isUpdating ? <Loader2 className="animate-spin h-4 w-4" /> : <><CheckCircle2 className="h-4 w-4" /> Visar y Finalizar</>}
                </Button>
              )}
            </div>
          )}
          {isAdminOrSupervisor && (
            <Button variant="outline" size="sm" asChild className="rounded-xl h-11 border-amber-200 text-amber-700 hover:bg-amber-50 font-bold" disabled={ot.status === 'aprobada'}>
              <Link href={`/work-orders/new?editId=${ot.id}`}><Edit2 className="h-4 w-4 mr-2" /> Editar OT</Link>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={isGeneratingPdf} className="rounded-xl h-11">
            {isGeneratingPdf ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <FileDown className="h-4 w-4 mr-2" />} Informe
          </Button>
          {ot.status === 'aprobada' && ot.clientApprovalCode && (
            <Button variant="outline" size="sm" onClick={handleDownloadExperienceCert} disabled={isGeneratingCert} className="rounded-xl h-11 border-blue-200 text-blue-700">
              <Award className="h-4 w-4 mr-2" /> Certificado
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {ot.status !== 'aprobada' && (
            <Card className="rounded-3xl border-none shadow-sm bg-blue-50/50 border-blue-100 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <HardHat className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-black text-blue-900 uppercase tracking-tighter">Progreso de Ejecución</span>
                  </div>
                  <span className="text-xs font-bold text-blue-600">{Math.round(checklistProgress)}%</span>
                </div>
                <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${checklistProgress}%` }} />
                </div>
                {ot.technicianApprovalCode && (
                  <div className="mt-4 flex items-center gap-2 bg-white/60 p-3 rounded-xl border border-blue-200 animate-in fade-in">
                    <Fingerprint className="h-4 w-4 text-emerald-600" />
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Trabajo Visado por Técnico: {ot.technicianApprovalName}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {ot.status === 'rechazada' && (
            <Card className="border-none shadow-lg bg-rose-50 border-rose-200 rounded-3xl overflow-hidden animate-in slide-in-from-top-4">
              <CardHeader className="bg-rose-100 flex flex-row items-center gap-3 p-6">
                <AlertTriangle className="h-6 w-6 text-rose-600" />
                <CardTitle className="text-lg font-black text-rose-900 uppercase italic">Orden Rechazada por Cliente</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm font-bold text-rose-800 mb-2">Observación: "{ot.rejectedReason}"</p>
                <p className="text-xs text-rose-600 font-medium">Por favor, corrija los hallazgos y vuelva a solicitar aprobación.</p>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-[2rem] border-none shadow-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Zap className="h-32 w-32" /></div>
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-black italic tracking-tighter flex items-center gap-3"><Sparkles className="h-6 w-6 text-amber-400" /> Resumen Ejecutivo IA</CardTitle>
                <Button onClick={handleGenerateAISummary} disabled={isGeneratingSummary || !logbook?.length} className="bg-white text-indigo-700 hover:bg-indigo-50 font-black rounded-xl h-12">
                  {isGeneratingSummary ? <Loader2 className="animate-spin h-5 w-5" /> : "Generar con IA"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              {ot.aiSummary ? (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 italic text-sm text-indigo-50">"{ot.aiSummary}"</div>
              ) : (
                <div className="bg-white/5 rounded-2xl p-8 border-2 border-dashed border-white/10 text-center text-xs font-bold uppercase tracking-widest text-indigo-200">Bitácora técnica pendiente de procesar</div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/5 p-6 border-b"><CardTitle className="text-lg font-black uppercase flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Información del Servicio</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mandante</p>
                  <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /><p className="text-sm font-bold text-slate-900">{client?.name || "Cargando..."}</p></div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Activo</p>
                  <div className="flex items-center gap-2"><HardHat className="h-4 w-4 text-slate-500" /><p className="text-sm font-bold text-slate-700">{asset?.name || "No especificado"}</p></div>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border text-sm text-slate-700 italic leading-relaxed">"{ot.description}"</div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/5 p-6 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-black uppercase flex items-center gap-2"><ListChecks className="h-5 w-5" /> Protocolos de Inspección</CardTitle>
                <Badge variant="outline" className="font-black text-[9px] uppercase">{Math.round(checklistProgress)}% Completado</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {ot.checklist && ot.checklist.length > 0 ? ot.checklist.map((item) => (
                <div key={item.id} className="flex flex-col p-4 bg-white border-2 rounded-2xl hover:border-primary/20 transition-colors gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Checkbox checked={item.completed} onCheckedChange={() => {
                        const nextStatus = !item.completed;
                        const newChecklist = ot.checklist?.map(i => i.id === item.id ? { ...i, completed: nextStatus, completedAt: nextStatus ? new Date().toISOString() : null } : i);
                        updateDocumentNonBlocking(otRef!, { checklist: newChecklist });
                        toast({ title: nextStatus ? "Punto Marcado" : "Punto Desmarcado", description: "Cambio guardado automáticamente." });
                      }} disabled={ot.status === 'aprobada'} className="h-6 w-6 rounded-lg" />
                      <div className="flex flex-col">
                        <span className={cn("text-sm font-bold", item.completed ? "text-slate-400" : "text-slate-700")}>{item.task}</span>
                        {item.completed && (
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">
                            REALIZADO: {item.completedAt ? format(new Date(item.completedAt), "dd/MM/yyyy HH:mm") : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {item.evidenceUrl && <div className="pl-10"><div className="w-32 aspect-video rounded-xl overflow-hidden border-2 border-slate-100 bg-slate-50"><FirebaseImage url={item.evidenceUrl} className="w-full h-full object-cover" /></div></div>}
                </div>
              )) : <p className="text-center py-6 text-xs text-slate-400 italic">Sin protocolos definidos.</p>}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between p-6">
              <CardTitle className="text-lg font-black flex items-center gap-2 uppercase tracking-tight"><Camera className="h-5 w-5 text-primary" /> Evidencias Adicionales</CardTitle>
              {ot.status !== 'aprobada' && (
                <>
                  <input type="file" className="hidden" ref={fileInputRef} onChange={handleUploadPhoto} accept="image/*" />
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    {isUploading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <><Camera className="h-4 w-4 mr-2" /> Añadir Foto</>}
                  </Button>
                </>
              )}
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {ot.evidenceUrls && ot.evidenceUrls.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {ot.evidenceUrls.map((u, i) => (
                    <div key={i} className="group relative aspect-video rounded-2xl overflow-hidden border bg-slate-50">
                      <FirebaseImage url={u} className="w-full h-full object-cover" />
                      {ot.status !== 'aprobada' && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button size="icon" variant="destructive" className="h-10 w-10 rounded-full" onClick={() => {
                            updateDocumentNonBlocking(otRef!, { evidenceUrls: arrayRemove(u) });
                            toast({ title: "Evidencia eliminada" });
                          }}>
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : <div className="text-center py-12 border-2 border-dashed rounded-3xl bg-slate-50 opacity-40"><ImageOff className="h-8 w-8 mx-auto mb-2 text-slate-400" /><p className="text-xs font-bold uppercase">Sin evidencias generales</p></div>}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white overflow-hidden flex flex-col h-[700px]">
            <CardHeader className="bg-white/5 p-6 border-b border-white/10"><CardTitle className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3"><History className="h-4 w-4 text-blue-400" /> Bitácora Técnica</CardTitle></CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
              <div className="p-6 bg-white/5 border-b border-white/10">
                <div className="flex gap-2">
                  <Textarea placeholder="Nuevo evento..." className="min-h-[80px] text-xs bg-white/10 border-white/20 text-white" value={manualComment} onChange={e => setManualComment(e.target.value)} />
                  <Button size="icon" className="shrink-0 h-auto bg-blue-600 hover:bg-blue-500 rounded-xl" onClick={() => {
                    if (!manualComment.trim() || !profile) return;
                    addDoc(collection(db!, "companies", companyId, "workOrders", ot.id, "digitalLogbookEntries"), {
                      workOrderId: ot.id, 
                      companyId: companyId, 
                      timestamp: serverTimestamp(), 
                      eventType: 'comment', 
                      eventDetails: manualComment, 
                      actor: profile.id,
                      actorName: profile.name 
                    });
                    setManualComment("");
                    toast({ title: "Bitácora actualizada" });
                  }}><MessageSquare className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {logbook && logbook.length > 0 ? logbook.map(e => (
                  <div key={e.id} className="relative pl-6 border-l-2 border-white/10 pb-2 last:pb-0">
                    <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{e.eventType.replace('_', ' ')}</p>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter bg-white/5 px-2 py-0.5 rounded">
                        {e.actorName || 'SISTEMA'}
                      </p>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium mb-1">{e.eventDetails}</p>
                    <p className="text-[9px] text-slate-500 italic font-bold">{formatDateLabel(e.timestamp)}</p>
                  </div>
                )) : <div className="h-full flex items-center justify-center opacity-20 italic text-xs py-20">Bitácora vacía</div>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
