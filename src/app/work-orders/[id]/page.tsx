
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
  Send,
  ExternalLink,
  Mail,
  Building2,
  HardHat,
  Camera,
  Image as ImageIcon,
  Trash2,
  XCircle,
  AlertTriangle,
  Plus,
  Fingerprint,
  ClipboardList,
  Calendar as CalendarIcon,
  Clock,
  KeyRound,
  ShieldAlert,
  Award,
  Ruler,
  MapPin,
  User,
  Hash,
  Package,
  Search,
  ShoppingCart,
  Zap,
  Sparkles,
  FileText
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
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useStorage, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp, query, orderBy, where, arrayUnion, arrayRemove, increment } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { WorkOrder, DigitalLogbookEntry, Company, PartUsage, Client, Asset, StaffMember, SparePart } from "@/lib/types";
import { WorkOrderReport } from "@/components/WorkOrderReport";
import { ExperienceCertificate } from "@/components/ExperienceCertificate";
import { FirebaseImage } from "@/components/FirebaseImage";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { sendSystemEmail } from "@/actions/email";
import { generateWorkOrderSummary } from "@/ai/flows/generate-work-order-summary";

export default function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const otId = resolvedParams.id;
  const { toast } = useToast();
  const { profile, isSupervisor, isCompanyAdmin, isTechnician } = useUser();
  const db = useFirestore();
  const storage = useStorage();
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
  const [isSealDialogOpen, setIsSealDialogOpen] = useState(false);
  const [isRequestCertDialogOpen, setIsRequestCertDialogOpen] = useState(false);
  const [isPartsDialogOpen, setIsPartsDialogOpen] = useState(false);
  const [partsSearch, setPartsSearch] = useState("");
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [partQuantity, setPartQuantity] = useState("1");
  
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

  const inventoryQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "spareParts") : null, [db, companyId]);
  const { data: inventory } = useCollection<SparePart>(inventoryQuery);

  const filteredInventory = useMemo(() => {
    return (inventory || []).filter(p => 
      p.name.toLowerCase().includes(partsSearch.toLowerCase()) || 
      p.sku.toLowerCase().includes(partsSearch.toLowerCase())
    );
  }, [inventory, partsSearch]);

  const formatDateLabel = (date: any) => {
    if (!date) return "...";
    try {
      const d = date.toDate ? date.toDate() : (typeof date === 'string' ? parseISO(date) : date);
      return format(d, "dd MMM yyyy HH:mm", { locale: es });
    } catch (e) { return "N/A"; }
  };

  const qrUrl = useMemo(() => currentUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}` : "", [currentUrl]);

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
            <p style="font-size: 15px; line-height: 1.6;">Se ha completado la intervención técnica programada. A continuación, presentamos los detalles para su revisión y sello de aprobación digital necesario para la emisión del certificado de experiencia:</p>
            
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #e2e8f0;">
              <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold; width: 140px;">ORDEN DE TRABAJO:</td><td style="padding: 6px 0; font-weight: 900; color: #1e3a8a;">${ot.id}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">EQUIPO / ACTIVO:</td><td style="padding: 6px 0; font-weight: bold;">${asset?.name || 'S/I'} [${asset?.code || '-'}]</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">MAGNITUD:</td><td style="padding: 6px 0; font-weight: bold;">${ot.serviceQuantity || '0'} ${ot.serviceUnit || ''}</td></tr>
                <tr><td style="padding: 6px 0; color: #64748b; font-weight: bold;">CÓDIGO DE ACCESO:</td><td style="padding: 6px 0;"><span style="background: #1e3a8a; color: #ffffff; padding: 4px 12px; border-radius: 6px; font-family: monospace; font-weight: 900; font-size: 18px; letter-spacing: 2px;">${ot.approvalPin || '------'}</span></td></tr>
              </table>
            </div>

            <div style="margin-bottom: 32px;">
              <p style="font-size: 13px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Trabajos Realizados:</p>
              <p style="font-size: 14px; color: #334155; font-style: italic; background: #fffbeb; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b;">"${ot.description}"</p>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${currentUrl}" style="background-color: #1e3a8a; color: #ffffff; padding: 18px 36px; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 16px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(30, 58, 138, 0.3);">
                REVISAR Y APROBAR DIGITALMENTE
              </a>
              <p style="color: #94a3b8; font-size: 11px; margin-top: 16px;">Para su seguridad, el sistema le solicitará el código de acceso indicado arriba.</p>
            </div>

            <div style="border-top: 1px solid #f1f5f9; padding-top: 24px; text-align: center;">
              <p style="font-size: 11px; color: #94a3b8;">Mensaje automático enviado vía <strong>PCGMANTENIMIENTO ERP</strong>.</p>
            </div>
          </div>
        `
      });
      if (result.success) toast({ title: "Correo Enviado", description: `Se envió la invitación a ${targetEmail}` });
      else throw new Error(result.error);
    } catch (e: any) { 
      toast({ title: "Error en envío", description: e.message, variant: "destructive" }); 
    } finally { 
      setIsResendingEmail(false); 
    }
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current || !ot) return;
    setIsGeneratingPdf(true);
    toast({ title: "Generando reporte técnico...", description: "Procesando certificados y evidencias." });
    try {
      await new Promise(r => setTimeout(r, 1000));
      const canv = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff", imageTimeout: 30000 });
      const imgData = canv.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pw = pdf.internal.pageSize.getWidth();
      pdf.addImage(imgData, "PNG", 0, 0, pw, (canv.height * pw) / canv.width);
      pdf.save(`REPORTE_PCG_${ot.id}.pdf`);
      toast({ title: "PDF Generado Exitosamente" });
    } catch (e) { toast({ title: "Error al generar PDF", variant: "destructive" }); } finally { setIsGeneratingPdf(false); }
  };

  const handleDownloadExperienceCert = async () => {
    if (!certRef.current || !ot || ot.status !== 'aprobada') {
      toast({ title: "Acceso Denegado", description: "El certificado solo puede emitirse para órdenes aprobadas por el cliente.", variant: "destructive" });
      return;
    }
    setIsGeneratingCert(true);
    toast({ title: "Generando certificado de experiencia...", description: "Acreditando magnitud y ejecución conforme." });
    try {
      await new Promise(r => setTimeout(r, 1000));
      const canv = await html2canvas(certRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff", imageTimeout: 30000 });
      const imgData = canv.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pw = pdf.internal.pageSize.getWidth();
      pdf.addImage(imgData, "PNG", 0, 0, pw, (canv.height * pw) / canv.width);
      pdf.save(`CERTIFICADO_EXPERIENCIA_PCG_${ot.id}.pdf`);
      toast({ title: "Certificado generado correctamente" });
    } catch (e) { toast({ title: "Error al generar certificado", variant: "destructive" }); } finally { setIsGeneratingCert(false); }
  };

  const handleGenerateAISummary = async () => {
    if (!ot || !logbook || !otRef) return;
    setIsGeneratingSummary(true);
    toast({ title: "Generando Resumen IA", description: "Analizando bitácora técnica..." });
    
    try {
      const summaryInput = {
        workOrder: {
          id: ot.id,
          description: ot.description,
          status: ot.status as any,
          createdAt: ot.createdAt?.toDate ? ot.createdAt.toDate().toISOString() : ot.createdAt,
          companyId: ot.companyId
        },
        digitalLogbookEntries: logbook.map(e => ({
          id: e.id,
          timestamp: e.timestamp?.toDate ? e.timestamp.toDate().toISOString() : e.timestamp,
          eventType: e.eventType,
          eventDetails: e.eventDetails,
          actor: e.actor,
          workOrderId: ot.id
        }))
      };

      const result = await generateWorkOrderSummary(summaryInput);
      
      updateDocumentNonBlocking(otRef, {
        aiSummary: result.summary,
        updatedAt: serverTimestamp()
      });

      toast({ title: "Resumen IA Generado", description: "El informe ha sido actualizado." });
    } catch (error: any) {
      toast({ title: "Error de IA", description: "No se pudo generar el resumen inteligente.", variant: "destructive" });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleRequestCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempClientEmail || !tempClientName || !ot || !clientRef) return;

    setIsUpdating(true);
    try {
      const updateData: any = {
        updatedAt: serverTimestamp()
      };
      if (tempClientEmail !== client?.contactEmail) updateData.contactEmail = tempClientEmail;
      if (tempClientName !== client?.contactName) updateData.contactName = tempClientName;

      if (Object.keys(updateData).length > 1) {
        updateDocumentNonBlocking(clientRef, updateData);
      }

      await handleResendEmail(tempClientEmail);
      setIsRequestCertDialogOpen(false);
      toast({ 
        title: "Solicitud de Validación Enviada", 
        description: "Se ha notificado al revisor para que autorice el cierre de la orden y la emisión del certificado." 
      });
    } catch (e: any) {
      toast({ title: "Error al procesar", description: e.message, variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTechnicianDigitalSeal = async () => {
    if (!otRef || !profile || !ot) return;
    setIsUpdating(true);
    try {
      const techCode = `TECH-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      const nextStatus = ot.reviewerRequired ? 'pendiente cliente' : 'aprobada';
      const data: any = { 
        technicianApprovalName: profile.name,
        technicianApprovalDate: serverTimestamp(),
        technicianApprovalCode: techCode,
        status: nextStatus,
        executedAt: ot.executedAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
        rejectedReason: null 
      };
      updateDocumentNonBlocking(otRef, data);
      
      const contactEmail = tempClientEmail || client?.contactEmail;
      if (nextStatus === 'pendiente cliente' && contactEmail) {
        handleResendEmail(contactEmail);
      }
      
      setIsSealDialogOpen(false);
      toast({ title: "Sello Emitido y Estado Actualizado" });
    } catch (e: any) { 
      toast({ title: "Error al generar sello", variant: "destructive" }); 
    } finally { 
      setIsUpdating(false); 
    }
  };

  const handleRequestClientApproval = async () => {
    if (!otRef) return;
    setIsUpdating(true);
    try {
      updateDocumentNonBlocking(otRef, { 
        status: 'pendiente cliente', 
        updatedAt: serverTimestamp(),
        rejectedReason: null 
      });
      await handleResendEmail();
      toast({ title: "Solicitud enviada al cliente" });
    } catch (e: any) {
      toast({ title: "Error al procesar", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
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

  const handleAddPartUsage = async () => {
    if (!db || !selectedPart || !ot || !companyId || !profile) return;
    const qty = Number(partQuantity);
    if (qty <= 0) return;

    setIsUpdating(true);
    try {
      const usageCol = collection(db, "companies", companyId, "workOrders", ot.id, "partUsages");
      await addDoc(usageCol, {
        workOrderId: ot.id,
        partId: selectedPart.id,
        partName: selectedPart.name,
        quantity: qty,
        unitPrice: selectedPart.unitPrice,
        usedAt: serverTimestamp(),
        actorId: profile.id
      });

      // Descontar del inventario maestro
      const partRef = doc(db, "companies", companyId, "spareParts", selectedPart.id);
      updateDocumentNonBlocking(partRef, {
        stockActual: increment(-qty)
      });

      // Bitácora
      const logCol = collection(db, "companies", companyId, "workOrders", ot.id, "digitalLogbookEntries");
      await addDoc(logCol, {
        workOrderId: ot.id,
        companyId,
        timestamp: serverTimestamp(),
        eventType: 'action_taken',
        eventDetails: `Consumo de material: ${qty} x ${selectedPart.name}`,
        actor: profile.id
      });

      toast({ title: "Insumo registrado", description: "El stock ha sido descontado del inventario." });
      setIsPartsDialogOpen(false);
      setSelectedPart(null);
      setPartQuantity("1");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemovePartUsage = async (usage: PartUsage) => {
    if (!db || !ot || !companyId) return;
    
    try {
      const usageRef = doc(db, "companies", companyId, "workOrders", ot.id, "partUsages", usage.id);
      deleteDocumentNonBlocking(usageRef);

      // Devolver al stock
      const partRef = doc(db, "companies", companyId, "spareParts", usage.partId);
      updateDocumentNonBlocking(partRef, {
        stockActual: increment(usage.quantity)
      });

      toast({ title: "Registro eliminado", description: "El stock ha sido devuelto al inventario." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  if (isDocLoading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!ot) return <div className="p-8 text-center border-2 border-dashed rounded-3xl opacity-50">La orden solicitada no existe.</div>;

  const canEditPhotos = ot.status !== 'aprobada' && ot.status !== 'pendiente cliente';
  const canEditMaterials = ot.status !== 'aprobada' && ot.status !== 'pendiente cliente';

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
              ot.status === 'rechazada' && "bg-rose-100 text-rose-700", 
              ot.status === 'pendiente cliente' && "bg-indigo-100 text-indigo-700", 
              ot.status === 'en revision' && "bg-amber-100 text-amber-700"
            )}>{ot.status.replace(' ', '_').toUpperCase()}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleDownloadPdf} disabled={isGeneratingPdf} className="rounded-xl h-11">
            {isGeneratingPdf ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <FileDown className="h-4 w-4 mr-2" />} Informe Técnico
          </Button>
          
          {ot.status === 'aprobada' && (
            ot.clientApprovalCode ? (
              <Button variant="outline" onClick={handleDownloadExperienceCert} disabled={isGeneratingCert} className="rounded-xl h-11 border-blue-200 text-blue-700 hover:bg-blue-50">
                {isGeneratingCert ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Award className="h-4 w-4 mr-2" />} Descargar Certificado
              </Button>
            ) : (
              <Dialog open={isRequestCertDialogOpen} onOpenChange={setIsRequestCertDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="rounded-xl h-11 border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => {
                    setTempClientEmail(client?.contactEmail || "");
                    setTempClientName(client?.contactName || "");
                  }}>
                    <Award className="h-4 w-4 mr-2" /> Solicitar Certificación
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[450px] rounded-[2.5rem]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black italic">Acreditación de Experiencia</DialogTitle>
                    <DialogDescription>
                      Para emitir un Certificado de Experiencia válido, la OT debe estar cerrada y aprobada digitalmente por el cliente. 
                      Se enviará una notificación formal al revisor para capturar su firma.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleRequestCertification} className="space-y-4 py-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase text-slate-500">Nombre del Revisor</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input 
                            required
                            placeholder="Nombre completo"
                            className="pl-10 h-12 rounded-xl"
                            value={tempClientName}
                            onChange={(e) => setTempClientName(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase text-slate-500">Email del Revisor</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input 
                            type="email" 
                            required
                            placeholder="ejemplo@cliente.cl"
                            className="pl-10 h-12 rounded-xl"
                            value={tempClientEmail}
                            onChange={(e) => setTempClientEmail(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed space-y-2">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Procedimiento Seguro</p>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        El cliente recibirá un link de validación único y deberá ingresar el PIN de seguridad <span className="font-black text-primary">{ot.approvalPin}</span> para firmar la orden.
                      </p>
                    </div>
                    <DialogFooter className="pt-2">
                      <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={isUpdating || !tempClientName || !tempClientEmail}>
                        {isUpdating ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Send className="h-4 w-4 mr-2" />} Notificar al Cliente
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )
          )}

          {(isSupervisor || isCompanyAdmin) && ot.status === 'rechazada' && (
            <Button onClick={handleRequestClientApproval} disabled={isUpdating} className="rounded-xl h-11 px-6 font-bold shadow-lg bg-rose-600 text-white">
              {isUpdating ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Reiniciar Ciclo Cliente"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Tarjeta de Resumen IA (Genkit) */}
          <Card className="rounded-[2rem] border-none shadow-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Zap className="h-32 w-32" />
            </div>
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-black italic tracking-tighter flex items-center gap-3">
                    <Sparkles className="h-6 w-6 text-amber-400 animate-pulse" /> Resumen Ejecutivo IA
                  </CardTitle>
                  <CardDescription className="text-indigo-100 font-medium mt-1">Sintetiza la intervención técnica para el reporte final.</CardDescription>
                </div>
                <Button 
                  onClick={handleGenerateAISummary} 
                  disabled={isGeneratingSummary || !logbook?.length}
                  className="bg-white text-indigo-700 hover:bg-indigo-50 font-black rounded-xl h-12 px-6 shadow-lg shadow-indigo-900/20"
                >
                  {isGeneratingSummary ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                  {ot.aiSummary ? "Actualizar con IA" : "Generar con IA"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              {ot.aiSummary ? (
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 italic text-sm leading-relaxed text-indigo-50 font-medium">
                  "{ot.aiSummary}"
                </div>
              ) : (
                <div className="bg-white/5 rounded-2xl p-8 border-2 border-dashed border-white/10 text-center space-y-3">
                  <FileText className="h-8 w-8 mx-auto opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">Presiona el botón para procesar la bitácora</p>
                </div>
              )}
            </CardContent>
          </Card>

          {ot.status === 'pendiente cliente' && (
            <Card className="border-4 border-indigo-500 border-dashed bg-indigo-50/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-indigo-600 text-white px-4 py-1 rounded-bl-xl font-black text-[10px] uppercase tracking-widest">Seguridad Activa</div>
              <div className="bg-white p-4 rounded-3xl shadow-inner border-2 border-indigo-100 shrink-0">
                <img src={qrUrl} className="w-32 h-32" alt="QR de Aprobación" />
              </div>
              <div className="text-center md:text-left space-y-4 flex-1">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-indigo-900 uppercase tracking-tighter">Validación Externa Protegida</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <KeyRound className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm font-black text-indigo-700">PIN DE ACCESO: <span className="bg-white px-3 py-1 rounded-lg border border-indigo-200 font-mono tracking-[0.3em] text-lg">{ot.approvalPin}</span></span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">Solo el cliente con este PIN podrá autorizar. El código ha sido incluido en la notificación oficial.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {!client?.contactEmail || !client?.contactName ? (
                    <Dialog open={isRequestCertDialogOpen} onOpenChange={setIsRequestCertDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="rounded-xl bg-indigo-600 text-white font-bold h-12 px-6 gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200" onClick={() => {
                          setTempClientEmail(client?.contactEmail || "");
                          setTempClientName(client?.contactName || "");
                        }}>
                          <Mail className="h-4 w-4" /> Configurar Contacto y Enviar PIN
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[450px] rounded-[2.5rem]">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-black italic">Configurar Envío</DialogTitle>
                          <DialogDescription>Para proceder con la validación externa, se requiere el nombre y correo del revisor responsable.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleRequestCertification} className="space-y-4 py-4">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="font-bold text-xs uppercase text-slate-500">Nombre del Revisor</Label>
                              <Input 
                                required
                                placeholder="Nombre completo"
                                className="h-12 rounded-xl"
                                value={tempClientName}
                                onChange={(e) => setTempClientName(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="font-bold text-xs uppercase text-slate-500">Email del Revisor</Label>
                              <Input 
                                type="email" 
                                required
                                placeholder="ejemplo@cliente.cl"
                                className="h-12 rounded-xl"
                                value={tempClientEmail}
                                onChange={(e) => setTempClientEmail(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit" className="w-full h-12 rounded-xl" disabled={isUpdating || !tempClientName || !tempClientEmail}>Activar Validación</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button variant="outline" className="rounded-xl bg-white gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50" onClick={() => handleResendEmail()} disabled={isResendingEmail}>
                      {isResendingEmail ? <Loader2 className="animate-spin h-4 w-4" /> : <Mail className="h-4 w-4" />} 
                      Re-enviar PIN y Enlace
                    </Button>
                  )}
                  <Button variant="ghost" className="rounded-xl h-10 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600" onClick={() => {
                    navigator.clipboard.writeText(currentUrl);
                    toast({ title: "Link Copiado" });
                  }}><ExternalLink className="h-3.5 w-3.5 mr-2" /> Link Directo</Button>
                </div>
              </div>
            </Card>
          )}

          <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/5 p-6 border-b">
              <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" /> Información de la Orden
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cliente / Entidad</p>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <p className="text-sm font-bold text-slate-900">{client?.name || "Cargando..."}</p>
                  </div>
                  {client && (
                    <div className="mt-1 pl-6 space-y-0.5">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">RUT: {client.rut}</p>
                      <p className="text-[9px] font-medium text-slate-400 uppercase flex items-center gap-1">
                        <MapPin className="h-2 w-2" /> {client.address}
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Equipo / Activo</p>
                  <div className="flex items-center gap-2">
                    <HardHat className="h-4 w-4 text-slate-500" />
                    <p className="text-sm font-bold text-slate-700">{asset?.name || "Sin activo específico"}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Fecha de Inicio</p>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-slate-500" />
                    <p className="text-sm font-bold text-slate-700">{formatDateLabel(ot.scheduledDate)}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Plazo de Ejecución</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <p className="text-sm font-bold text-slate-700">
                      {ot.durationDays || 1} días 
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Magnitud del Servicio</p>
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-blue-500" />
                    <p className="text-sm font-black text-blue-700">{ot.serviceQuantity || '0'} {ot.serviceUnit || ''}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Detalle de los Trabajos</p>
                <div className="bg-slate-50 p-4 rounded-2xl border text-sm text-slate-700 leading-relaxed italic">
                  "{ot.description}"
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gestión de Insumos y Repuestos */}
          <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-6 border-b bg-amber-50/30">
              <div>
                <CardTitle className="text-lg font-black flex items-center gap-2 uppercase tracking-tight text-amber-900">
                  <Package className="h-5 w-5 text-amber-600" /> Insumos y Repuestos
                </CardTitle>
                <CardDescription className="text-amber-700/60 font-medium">Materiales utilizados en la intervención.</CardDescription>
              </div>
              {canEditMaterials && (
                <Dialog open={isPartsDialogOpen} onOpenChange={setIsPartsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50 bg-white">
                      <Plus className="h-4 w-4 mr-2" /> Añadir Material
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] rounded-[2.5rem]">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black italic text-amber-900">Consumo de Materiales</DialogTitle>
                      <DialogDescription>Seleccione un ítem del inventario para registrar su uso.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                          placeholder="Buscar por nombre o SKU..." 
                          className="pl-10 h-12 rounded-xl"
                          value={partsSearch}
                          onChange={(e) => setPartsSearch(e.target.value)}
                        />
                      </div>

                      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                        {filteredInventory.length === 0 ? (
                          <p className="text-center py-10 text-sm text-muted-foreground italic">No se encontraron ítems.</p>
                        ) : (
                          filteredInventory.map(part => (
                            <button
                              key={part.id}
                              onClick={() => setSelectedPart(part)}
                              className={cn(
                                "w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between",
                                selectedPart?.id === part.id ? "border-amber-500 bg-amber-50" : "border-slate-100 hover:border-slate-200"
                              )}
                            >
                              <div>
                                <p className="font-bold text-slate-900">{part.name}</p>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{part.sku}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase">Stock Actual</p>
                                <p className={cn("text-xs font-bold", part.stockActual <= part.stockMinimo ? "text-rose-600" : "text-emerald-600")}>
                                  {part.stockActual} Unid.
                                </p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>

                      {selectedPart && (
                        <div className="bg-amber-50 p-6 rounded-3xl border-2 border-amber-100 space-y-4 animate-in zoom-in-95">
                          <div className="flex justify-between items-center">
                            <Label className="font-black text-xs uppercase text-amber-900">Cantidad a utilizar</Label>
                            <div className="flex items-center gap-3">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-10 w-10 rounded-xl bg-white"
                                onClick={() => setPartQuantity(q => Math.max(1, Number(q) - 1).toString())}
                              >
                                -
                              </Button>
                              <Input 
                                type="number" 
                                className="w-20 text-center h-10 rounded-xl font-bold bg-white"
                                value={partQuantity}
                                onChange={(e) => setPartQuantity(e.target.value)}
                              />
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-10 w-10 rounded-xl bg-white"
                                onClick={() => setPartQuantity(q => (Number(q) + 1).toString())}
                              >
                                +
                              </Button>
                            </div>
                          </div>
                          <p className="text-[10px] text-amber-700 italic text-center font-medium">
                            * Al confirmar, se descontarán {partQuantity} unidades del inventario maestro.
                          </p>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button 
                        className="w-full h-14 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-widest shadow-xl shadow-amber-900/20"
                        disabled={!selectedPart || isUpdating}
                        onClick={handleAddPartUsage}
                      >
                        {isUpdating ? <Loader2 className="animate-spin h-5 w-5" /> : "Confirmar Consumo"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {partUsages && partUsages.length > 0 ? (
                  partUsages.map((usage) => (
                    <div key={usage.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                          <Package className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{usage.partName}</p>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                            Cantidad: <span className="text-amber-600">{usage.quantity}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase">Costo Unit.</p>
                          <p className="text-xs font-bold text-slate-700">${usage.unitPrice.toLocaleString()}</p>
                        </div>
                        {canEditMaterials && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-xl text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemovePartUsage(usage)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center space-y-2 opacity-40">
                    <Package className="h-10 w-10 mx-auto text-slate-300" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sin materiales registrados</p>
                  </div>
                )}
              </div>
              {partUsages && partUsages.length > 0 && (
                <div className="p-4 bg-amber-50/20 border-t flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-amber-700 tracking-widest">Costo Total Materiales</span>
                  <span className="text-sm font-black text-amber-900">
                    ${partUsages.reduce((acc, u) => acc + (u.quantity * u.unitPrice), 0).toLocaleString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {ot.status === 'aprobada' && ot.clientApprovalCode && (
            <Card className="bg-emerald-50 border-2 border-emerald-200 p-6 rounded-3xl flex items-center gap-6 shadow-sm">
              <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-lg"><Fingerprint className="h-8 w-8" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] mb-1">Certificado de Aprobación Digital</p>
                <p className="text-sm font-bold text-emerald-900 mb-1">Aprobado por: {ot.clientApprovalName}</p>
                <p className="text-[10px] font-mono font-black text-emerald-600 bg-white/50 px-2 py-1 rounded inline-block">CÓD: {ot.clientApprovalCode}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-emerald-700 uppercase">Fecha/Hora</p>
                <p className="text-xs font-bold text-emerald-900">{formatDateLabel(ot.clientApprovalDate)}</p>
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
                  <p className="text-xs font-bold uppercase tracking-widest">Sin evidencias capturadas</p>
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
                        const isNowCompleted = !item.completed;
                        const newChecklist = ot.checklist?.map(i => 
                          i.id === item.id 
                            ? { ...i, completed: isNowCompleted, completedAt: isNowCompleted ? new Date().toISOString() : null } 
                            : i
                        );
                        updateDocumentNonBlocking(otRef!, { checklist: newChecklist });
                      }} 
                      disabled={ot.status === 'aprobada' || ot.status === 'pendiente cliente'} 
                      className="h-6 w-6 rounded-lg"
                    />
                    <div className="flex flex-col">
                      <span className={cn("text-sm font-bold", item.completed ? "text-slate-400" : "text-slate-700")}>{item.task}</span>
                      {item.completed ? (
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">
                          REALIZADO {item.completedAt && `- ${format(new Date(item.completedAt), "HH:mm 'hrs'", { locale: es })}`}
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">PENDIENTE</span>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-center py-6 text-xs font-bold text-slate-400 uppercase tracking-widest italic">No se definieron ítems de control.</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
            <CardHeader className="p-6"><CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2"><SignatureIcon className="h-5 w-5" /> Firmas y Validaciones Digitales</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-8 p-6 bg-slate-50/50 border-t">
              <div className="text-center space-y-3">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Validación Técnico Responsable</p>
                {ot.technicianApprovalCode ? (
                  <div className="h-40 border-2 rounded-[2rem] bg-white flex flex-col items-center justify-center p-6 shadow-inner gap-2">
                    <Check className="h-8 w-8 text-emerald-600" />
                    <p className="text-[10px] font-black text-emerald-900 uppercase">Sello Técnico Digital</p>
                    <p className="text-[9px] font-bold text-slate-400">{ot.technicianApprovalName}</p>
                    <p className="text-[8px] font-mono text-slate-300 mt-1">{ot.technicianApprovalCode}</p>
                    <p className="text-[8px] font-bold text-slate-400">{formatDateLabel(ot.technicianApprovalDate)}</p>
                  </div>
                ) : (
                  <Dialog open={isSealDialogOpen} onOpenChange={setIsSealDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full h-40 border-4 border-dashed rounded-[2rem] flex-col gap-3 group" disabled={ot.status === 'aprobada' || ot.status === 'pendiente cliente'}>
                        <Fingerprint className="h-8 w-8 text-slate-300 group-hover:text-primary group-hover:scale-110 transition-all" />
                        <span className="text-[10px] font-black text-slate-400 uppercase">Emitir Sello Técnico Digital</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[400px] rounded-[2.5rem]">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-black italic">Validación Técnica Digital</DialogTitle>
                        <DialogDescription>
                          ¿Confirma la ejecución conforme de los trabajos? 
                          Al confirmar, la OT cambiará de estado automáticamente y se notificará al cliente.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="pt-4 flex flex-col gap-3">
                        <Button className="h-12 rounded-xl font-bold" onClick={handleTechnicianDigitalSeal} disabled={isUpdating}>
                          {isUpdating ? <Loader2 className="animate-spin h-4 w-4" /> : "Confirmar y Notificar al Cliente"}
                        </Button>
                        <Button variant="ghost" onClick={() => setIsSealDialogOpen(false)} disabled={isUpdating}>Cancelar</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <div className="text-center space-y-3">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Sello de Recepción Cliente</p>
                {ot.clientApprovalCode ? (
                  <div className="h-40 border-2 rounded-[2rem] bg-white flex flex-col items-center justify-center p-6 shadow-inner gap-2">
                    <Fingerprint className="h-8 w-8 text-indigo-600" />
                    <p className="text-[10px] font-black text-indigo-900 uppercase">Aprobación Digital Conforme</p>
                    <p className="text-[9px] font-bold text-slate-400">{ot.clientApprovalCode}</p>
                    <p className="text-[8px] font-bold text-slate-400">{formatDateLabel(ot.clientApprovalDate)}</p>
                  </div>
                ) : (
                  <div className="h-40 border-4 border-dashed rounded-[2rem] flex flex-col items-center justify-center bg-slate-100/50 italic text-[10px] text-slate-400 uppercase font-black tracking-widest">
                    Pendiente Validación
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
                  <Button size="icon" className="shrink-0 h-auto bg-blue-600 hover:bg-blue-500 rounded-xl text-white" onClick={() => {
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
    </div>
  );
}
