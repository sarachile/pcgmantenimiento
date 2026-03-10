
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
  Save,
  Compass,
  Map as MapIcon,
  Globe,
  Layers,
  Images,
  Quote,
  ExternalLink,
  Mail,
  QrCode,
  ShieldCheck,
  Navigation,
  Download,
  Maximize2,
  Map as MapLucide
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
import { WorkOrder, DigitalLogbookEntry, Company, PartUsage, Client, Asset, StaffMember, ServiceItem } from "@/lib/types";
import { WorkOrderReport } from "@/components/WorkOrderReport";
import { ExperienceCertificate } from "@/components/ExperienceCertificate";
import { FirebaseImage } from "@/components/FirebaseImage";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { sendSystemEmail } from "@/actions/email";

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
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // ImageViewer State
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    task?: string;
    lat?: number;
    lng?: number;
  } | null>(null);

  useEffect(() => {
    if (profile?.companyId) {
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
      return format(d, "dd/MM/yyyy HH:mm", { locale: es });
    } catch (e) { return "N/A"; }
  };

  const qrUrl = useMemo(() => currentUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}` : "", [currentUrl]);

  const handleDownloadPdf = async () => {
    if (!reportRef.current || !ot) return;
    setIsGeneratingPdf(true);
    try {
      await new Promise(r => setTimeout(r, 2500));
      
      const element = reportRef.current;
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: "#ffffff",
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: 1000
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`INFORME_TECNICO_${ot.id}.pdf`);
      toast({ title: "Reporte Generado", description: "El informe multicanal se ha descargado." });
    } catch (e) { 
      console.error("Error PDF:", e);
      toast({ title: "Error al generar PDF", variant: "destructive" }); 
    } finally { 
      setIsGeneratingPdf(false); 
    }
  };

  const handleDownloadExperienceCert = async () => {
    if (!certRef.current || !ot || ot.status !== 'aprobada') return;
    setIsGeneratingCert(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      const canv = await html2canvas(certRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canv.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pw = pdf.internal.pageSize.getWidth();
      pdf.addImage(imgData, "PNG", 0, 0, pw, (canv.height * pw) / canv.width);
      pdf.save(`CERT_EXPERIENCIA_${ot.id}.pdf`);
    } catch (e) { toast({ title: "Error al generar certificado", variant: "destructive" }); } finally { setIsGeneratingCert(false); }
  };

  const handleVisaOrder = async () => {
    if (!otRef || !profile || !ot) return;

    const isChecklistComplete = !ot.checklist || ot.checklist.length === 0 || ot.checklist.every(item => item.completed);
    
    if (!isChecklistComplete) {
      toast({
        title: "Protocolo Incompleto",
        description: "No se puede visar la orden hasta que todos los puntos del protocolo técnico estén marcados como completados.",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    try {
      if (ot.reviewerRequired) {
        updateDocumentNonBlocking(otRef, { 
          status: 'pendiente cliente', 
          updatedAt: serverTimestamp() 
        });
        
        await addDoc(collection(db!, "companies", companyId, "workOrders", otId, "digitalLogbookEntries"), {
          workOrderId: otId,
          companyId,
          timestamp: serverTimestamp(),
          eventType: 'status_change',
          eventDetails: "Orden visada técnicamente por administración. Protocolo validado al 100%. Se habilita portal de aprobación para el cliente.",
          actor: profile.id,
          actorName: profile.name
        });

        toast({ title: "Orden Visada", description: "Estado: Pendiente Cliente. Link de aprobación habilitado." });
      } else {
        const verificationCode = `ADM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        updateDocumentNonBlocking(otRef, { 
          status: 'aprobada', 
          clientApprovalName: profile.name + " (Adm)", 
          clientApprovalDate: serverTimestamp(), 
          clientApprovalCode: verificationCode, 
          updatedAt: serverTimestamp() 
        });

        await addDoc(collection(db!, "companies", companyId, "workOrders", otId, "digitalLogbookEntries"), {
          workOrderId: otId,
          companyId,
          timestamp: serverTimestamp(),
          eventType: 'status_change',
          eventDetails: "Orden aprobada internamente por administración (Cierre Directo). Protocolo validado al 100%.",
          actor: profile.id,
          actorName: profile.name
        });

        toast({ title: "Orden Aprobada Internamente" });
      }
    } catch (e: any) { toast({ title: "Error", variant: "destructive" }); } finally { setIsUpdating(false); }
  };

  const handleToggleTask = (taskId: string, currentCompleted: boolean) => {
    if (!otRef || !ot.checklist) return;
    const updatedChecklist = ot.checklist.map(item => {
      if (item.id === taskId) {
        return { 
          ...item, 
          completed: !currentCompleted, 
          completedAt: !currentCompleted ? new Date().toISOString() : null 
        };
      }
      return item;
    });
    updateDocumentNonBlocking(otRef, { checklist: updatedChecklist, updatedAt: serverTimestamp() });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!!file && ot && activeTaskId && storage && otRef) {
      setIsUploading(true);
      try {
        const path = `companies/${companyId}/workOrders/${otId}/admin_evidence_${Date.now()}`;
        const sRef = ref(storage, path);
        await uploadBytes(sRef, file);
        const url = await getDownloadURL(sRef);

        const updatedChecklist = ot.checklist?.map(item => {
          if (item.id === activeTaskId) {
            const currentUrls = item.evidenceUrls || (item.evidenceUrl ? [item.evidenceUrl] : []);
            return { 
              ...item, 
              completed: true, 
              completedAt: new Date().toISOString(), 
              evidenceUrls: [...currentUrls, url] 
            };
          }
          return item;
        });

        updateDocumentNonBlocking(otRef, { checklist: updatedChecklist, updatedAt: serverTimestamp() });
        toast({ title: "Evidencia adjunta con éxito" });
      } catch (error) {
        toast({ title: "Error al subir", variant: "destructive" });
      } finally {
        setIsUploading(false);
        setActiveTaskId(null);
      }
    }
  };

  const handleSendEmailPortal = async () => {
    if (!client?.contactEmail || !ot) {
      toast({ title: "Sin Correo", description: "El cliente no tiene un email de contacto registrado.", variant: "destructive" });
      return;
    }

    setIsSendingEmail(true);
    try {
      const protocolsHtml = ot.checklist && ot.checklist.length > 0 
        ? `<div style="margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
            <p style="font-weight: 900; color: #1e3a8a; font-size: 12px; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px;">Protocolos Técnicos Verificados:</p>
            <table style="width: 100%; border-collapse: collapse;">
              ${ot.checklist.map(item => `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f8fafc; vertical-align: top; width: 24px;">
                    <span style="color: #10b981; font-size: 16px;">✓</span>
                  </td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f8fafc; font-size: 13px; color: #475569;">
                    ${item.task}
                  </td>
                </tr>
              `).join('')}
            </table>
           </div>`
        : '';

      const itemsHtml = ot.serviceItems && ot.serviceItems.length > 0
        ? `<div style="margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
            <p style="font-weight: 900; color: #1e3a8a; font-size: 12px; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px;">Desglose de Partidas:</p>
            <table style="width: 100%; font-size: 12px; border-collapse: collapse; background-color: #f8fafc; border-radius: 12px;">
              ${ot.serviceItems.map(item => `
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #ffffff; color: #475569;">${item.description}</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #ffffff; text-align: right; font-weight: 900; color: #1e293b;">${item.quantity} ${item.unit}</td>
                </tr>
              `).join('')}
            </table>
           </div>`
        : '';

      const result = await sendSystemEmail({
        to: client.contactEmail,
        subject: `APROBACIÓN DE SERVICIO - ${company?.name || 'PCGMANTENIMIENTO'}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff; color: #1e293b;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #1e3a8a; margin: 0; text-transform: uppercase; letter-spacing: -1px; font-size: 24px; font-weight: 900;">${company?.name || 'PCGMANTENIMIENTO'}</h1>
              <p style="color: #64748b; font-size: 14px; margin-top: 4px; font-weight: 600;">Servicios Industriales Avanzados</p>
            </div>
            
            <h2 style="color: #1e3a8a; font-size: 20px; margin-bottom: 24px; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; font-weight: 800; italic: true;">Solicitud de Aprobación Digital</h2>
            
            <p style="font-size: 15px; line-height: 1.6;">Estimados <strong>${client.name}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.6;">Le informamos que los servicios técnicos correspondientes a la <strong>Orden de Trabajo ${ot.id}</strong> han sido completados según el protocolo establecido. A continuación se detalla la ejecución para su validación conforme:</p>
            
            <div style="background-color: #f8fafc; border-radius: 20px; padding: 24px; margin: 24px 0; border: 1px solid #e2e8f0;">
              <p style="margin-top: 0; font-weight: 900; color: #1e3a8a; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Misión del Servicio:</p>
              <p style="font-size: 14px; color: #475569; font-style: italic; margin-bottom: 0; line-height: 1.6;">"${ot.description}"</p>
              
              <div style="margin-top: 16px;">
                <p style="margin-bottom: 4px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Ubicación:</p>
                <p style="font-size: 13px; color: #64748b; margin: 0;">${ot.street} ${ot.streetNumber}, ${ot.commune}</p>
              </div>

              ${protocolsHtml}
              ${itemsHtml}
            </div>

            <p style="font-size: 15px; line-height: 1.6; font-weight: 600;">Para generar su certificado de recepción técnica conforme, por favor ingrese al siguiente portal seguro:</p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${currentUrl}" style="background-color: #1e3a8a; color: #ffffff; padding: 20px 48px; text-decoration: none; border-radius: 16px; font-weight: 900; font-size: 16px; display: inline-block; box-shadow: 0 10px 25px -3px rgba(30, 58, 138, 0.3); text-transform: uppercase;">
                REVISAR Y FIRMAR DIGITALMENTE
              </a>
            </div>

            <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; padding: 32px; border-radius: 20px; margin-bottom: 24px; text-align: center;">
              <p style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 2px;">PIN Único de Verificación</p>
              <div style="font-size: 42px; font-family: 'Courier New', monospace; font-weight: 900; color: #1e3a8a; letter-spacing: 10px; background: #ffffff; border: 1px solid #e2e8f0; padding: 16px; display: inline-block; border-radius: 12px; box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.06);">
                ${ot.approvalPin}
              </div>
              <p style="color: #64748b; font-size: 11px; margin-top: 16px; font-weight: 700; line-height: 1.4;">
                * Este código es obligatorio para validar su identidad en el portal.<br/>Garantiza la trazabilidad legal de su aprobación.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
            <p style="font-size: 11px; color: #94a3b8; font-style: italic; text-align: center;">Este es un mensaje automatizado de auditoría técnica enviado vía PCGMANTENIMIENTO ERP.</p>
          </div>
        `
      });

      if (result.success) {
        toast({ title: "Email Enviado", description: `Se ha notificado a ${client.contactEmail}` });
        await addDoc(collection(db!, "companies", companyId, "workOrders", otId, "digitalLogbookEntries"), {
          workOrderId: otId,
          companyId,
          timestamp: serverTimestamp(),
          eventType: 'system_alert',
          eventDetails: `Se envió reporte detallado y link de aprobación al cliente (${client.contactEmail}) vía email. Incluye protocolos y partidas.`,
          actor: profile?.id || 'system'
        });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Error en envío", description: e.message, variant: "destructive" });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDownloadImage = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `evidencia_${otId}_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      toast({ title: "Error al descargar", variant: "destructive" });
    }
  };

  if (isDocLoading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!ot) return <div className="p-8 text-center">Orden no encontrada.</div>;

  const isAdminOrSupervisor = isCompanyAdmin || isSupervisor;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprobada':
        return <Badge className="bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest px-3 py-1 rounded-full border-none">Aprobada</Badge>;
      case 'en proceso':
        return <Badge className="bg-blue-100 text-blue-700 px-3 py-1 font-black uppercase text-[10px] tracking-widest">En Proceso</Badge>;
      case 'en revision':
        return <Badge className="bg-amber-100 text-amber-700 px-3 py-1 font-black uppercase text-[10px] tracking-widest">En Revisión</Badge>;
      case 'pendiente cliente':
        return <Badge className="bg-indigo-600 text-white px-3 py-1 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-900/20">Pendiente Cliente</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-600 px-3 py-1 font-black uppercase text-[10px] tracking-widest">{status.replace('_', ' ').toUpperCase()}</Badge>;
    }
  };

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
            {getStatusBadge(ot.status)}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Building2 className="h-3 w-3" /> {client?.name}
            </span>
            {client?.contactEmail && (
              <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                <Mail className="h-2.5 w-2.5" /> {client.contactEmail}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdminOrSupervisor && ot.status !== 'aprobada' && ot.status !== 'pendiente cliente' && (
            <Button onClick={handleVisaOrder} disabled={isUpdating} className="rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] gap-2 shadow-lg">
              {isUpdating ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />} 
              {ot.reviewerRequired ? "Visar y Habilitar Cliente" : "Visar y Aprobar"}
            </Button>
          )}
          {isAdminOrSupervisor && ot.status !== 'aprobada' && (
            <Button 
              variant="outline" 
              onClick={() => { toast({ title: "Avance Guardado" }); router.push("/work-orders"); }} 
              className="rounded-xl h-11 border-slate-200 font-bold"
            >
              <Save className="h-4 w-4 mr-2" /> Guardar Avance
            </Button>
          )}
          {isAdminOrSupervisor && (
            <Button 
              variant="outline" 
              size="sm" 
              asChild 
              className="rounded-xl h-11 border-amber-200 text-amber-700 font-bold" 
              disabled={ot.status === 'aprobada'}
            >
              {ot.status === 'aprobada' ? (
                <div className="flex items-center opacity-50 cursor-not-allowed">
                  <Edit2 className="h-4 w-4 mr-2" /> Editar
                </div>
              ) : (
                <Link href={`/work-orders/new?editId=${ot.id}`}>
                  <Edit2 className="h-4 w-4 mr-2" /> Editar
                </Link>
              )}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={isGeneratingPdf} className="rounded-xl h-11">
            {isGeneratingPdf ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <FileDown className="h-4 w-4 mr-2" />} 
            Informe
          </Button>
          {ot.status === 'aprobada' && <Button variant="outline" size="sm" onClick={handleDownloadExperienceCert} disabled={isGeneratingCert} className="rounded-xl h-11 border-blue-200 text-blue-700"><Award className="h-4 w-4 mr-2" /> Certificado</Button>}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {(ot.technicianApprovalCode || ot.clientApprovalCode) && (
            <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden animate-in fade-in duration-700">
              <CardHeader className="bg-emerald-50 border-b border-emerald-100 p-8">
                <CardTitle className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-3 text-emerald-900">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" /> Sello de Certificación Digital
                </CardTitle>
                <CardDescription className="text-emerald-700 font-medium">Validación inalterable de los servicios realizados.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {ot.technicianApprovalCode && (
                  <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 relative overflow-hidden">
                    <div className="absolute right-4 top-4 opacity-5"><HardHat className="h-12 w-12" /></div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Validación Técnica</p>
                    <p className="text-sm font-black text-slate-900 mb-1">{ot.technicianApprovalName}</p>
                    <div className="bg-white px-3 py-1.5 rounded-lg border-2 border-dashed inline-block mb-3">
                      <code className="text-xs font-mono font-black text-emerald-600">{ot.technicianApprovalCode}</code>
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{formatDateLabel(ot.technicianApprovalDate || ot.executedAt)}</p>
                  </div>
                )}
                {ot.clientApprovalCode && (
                  <div className="bg-indigo-50/30 p-6 rounded-[2rem] border-2 border-indigo-100 relative overflow-hidden">
                    <div className="absolute right-4 top-4 opacity-5"><Fingerprint className="h-12 w-12" /></div>
                    <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-4">Aprobación Mandante</p>
                    <p className="text-sm font-black text-slate-900 mb-1">{ot.clientApprovalName}</p>
                    <div className="bg-white px-3 py-1.5 rounded-lg border-2 border-dashed inline-block mb-3">
                      <code className="text-xs font-mono font-black text-indigo-600">{ot.clientApprovalCode}</code>
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{formatDateLabel(ot.clientApprovalDate)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {ot.reviewerRequired && ot.status === 'pendiente cliente' && (
            <Card className="rounded-[2.5rem] border-none shadow-xl bg-indigo-600 text-white overflow-hidden animate-in zoom-in-95 duration-500">
              <CardHeader className="bg-white/10 p-8 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-3">
                    <Fingerprint className="h-6 w-6 text-indigo-300" /> Solicitud de Aprobación
                  </CardTitle>
                  <Badge className="bg-white text-indigo-600 font-black text-[10px] uppercase">Portal Digital Activo</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-10 items-center">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-indigo-200 tracking-widest">Link de Acceso para Cliente</p>
                      <div className="flex gap-2">
                        <Input value={currentUrl} readOnly className="bg-white/10 border-white/20 text-white h-11 rounded-xl text-xs font-mono" />
                        <Button size="icon" variant="ghost" className="h-11 w-11 rounded-xl bg-white/10 hover:bg-white/20" onClick={() => { navigator.clipboard.writeText(currentUrl); toast({ title: "Link Copiado" }); }}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button className="flex-1 h-12 rounded-xl bg-white text-indigo-600 font-black uppercase text-[10px] gap-2 shadow-xl hover:bg-slate-100" onClick={handleSendEmailPortal} disabled={isSendingEmail}>
                        {isSendingEmail ? <Loader2 className="animate-spin h-4 w-4" /> : <Mail className="h-4 w-4" />} Enviar por Email
                      </Button>
                      <Button variant="outline" className="flex-1 h-12 rounded-xl border-white/20 text-white hover:bg-white/10 font-black uppercase text-[10px] gap-2" asChild>
                        <a href={currentUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Probar Portal</a>
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-4 bg-white p-6 rounded-[2rem] shadow-inner">
                    <div className="bg-white p-2 rounded-xl border-2 border-slate-100">
                      <img src={qrUrl} alt="QR Approval" className="h-32 w-32" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase text-center tracking-widest leading-tight">Escaneo directo para<br/> firma en terreno</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white overflow-hidden">
            <CardHeader className="bg-white/5 p-8 border-b border-white/10">
              <CardTitle className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-3">
                <Quote className="h-6 w-6 text-blue-400" /> Alcance del Requerimiento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <p className="text-lg font-medium leading-relaxed italic text-blue-50">"{ot.description}"</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/5 p-6 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-black uppercase flex items-center gap-2">
                  <MapLucide className="h-5 w-5 text-primary" /> Ubicación del Servicio
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-bold text-slate-700">{ot.street} {ot.streetNumber}{ot.complement ? ', ' + ot.complement : ''}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ot.commune}, {ot.city}, {ot.region}</p>
                  {ot.locationComment && <Badge variant="outline" className="mt-2 bg-blue-50 text-blue-700 border-blue-100 text-[9px] font-black uppercase italic">{ot.locationComment}</Badge>}
                </div>
                
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" asChild className="rounded-xl border-blue-200 text-blue-700 font-black text-[10px] uppercase gap-2 h-10 px-4">
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ot.street} ${ot.streetNumber}, ${ot.commune}, ${ot.city}`)}`} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-3.5 w-3.5" /> Google Maps
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="rounded-xl border-blue-400 text-blue-600 bg-blue-50 hover:bg-blue-100 font-black text-[10px] uppercase gap-2 h-10 px-4">
                    <a href={`https://waze.com/ul?q=${encodeURIComponent(`${ot.street} ${ot.streetNumber}, ${ot.commune}, ${ot.city}`)}&navigate=yes`} target="_blank" rel="noopener noreferrer">
                      <Navigation className="h-3.5 w-3.5 fill-blue-600" /> Waze
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/5 p-6 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-black uppercase flex items-center gap-2">
                  <ListChecks className="h-5 w-5" /> Protocolos & Evidencias
                </CardTitle>
                {isAdminOrSupervisor && <span className="text-[9px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded-lg">Panel Interactivo Admin</span>}
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {ot.checklist?.map(item => {
                  const photos = item.evidenceUrls || (item.evidenceUrl ? [item.evidenceUrl] : []);
                  return (
                    <div key={item.id} className="flex flex-col gap-4 p-5 bg-white border-2 rounded-2xl group transition-all hover:border-primary/20">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => isAdminOrSupervisor && handleToggleTask(item.id, item.completed)}
                          disabled={!isAdminOrSupervisor || ot.status === 'aprobada'}
                          className={cn(
                            "h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                            item.completed ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-900/20" : "border-slate-200 text-slate-200 bg-slate-50"
                          )}
                        >
                          <Check className={cn("h-5 w-5", !item.completed && "opacity-0")} />
                        </button>
                        <div className="flex-1 flex flex-col">
                          <span className={cn("text-sm font-bold", item.completed ? "text-slate-900" : "text-slate-400")}>{item.task}</span>
                          {item.completed && <span className="text-[9px] font-black text-slate-400">FINALIZADO: {format(new Date(item.completedAt), "dd/MM HH:mm")}</span>}
                        </div>
                        {isAdminOrSupervisor && ot.status !== 'aprobada' && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-9 w-9 rounded-xl border-dashed opacity-0 group-hover:opacity-100 transition-opacity" 
                            onClick={() => { setActiveTaskId(item.id); fileInputRef.current?.click(); }}
                            disabled={isUploading}
                          >
                            {isUploading && activeTaskId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4 text-primary" />}
                          </Button>
                        )}
                      </div>
                      {photos.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {photos.map((url, i) => (
                            <div 
                              key={i} 
                              className="aspect-video rounded-xl overflow-hidden shadow-sm border bg-slate-50 relative group/img cursor-pointer"
                              onClick={() => setSelectedImage({ url, task: item.task, lat: item.latitude, lng: item.longitude })}
                            >
                              <FirebaseImage url={url} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                <Maximize2 className="text-white h-6 w-6" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {ot.evidenceUrls && ot.evidenceUrls.length > 0 && (
                <div className="space-y-4 pt-4 border-t-2 border-dashed">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Images className="h-4 w-4" /> Galería General de Terreno</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {ot.evidenceUrls.map((url, i) => (
                      <div 
                        key={i} 
                        className="aspect-video rounded-xl overflow-hidden border-2 shadow-sm group bg-slate-50 cursor-pointer relative"
                        onClick={() => setSelectedImage({ url, task: "Evidencia General" })}
                      >
                        <FirebaseImage url={url} className="w-full h-full transition-transform group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize2 className="text-white h-6 w-6" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white overflow-hidden flex flex-col h-[600px]">
            <CardHeader className="bg-white/5 p-6 border-b border-white/10"><CardTitle className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3"><History className="h-4 w-4 text-blue-400" /> Bitácora Técnica</CardTitle></CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {logbook?.map(e => (
                  <div key={e.id} className="relative pl-6 border-l-2 border-white/10 pb-4 last:pb-0">
                    <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    <p className="text-[10px] font-black text-blue-400 uppercase mb-1">{e.eventType.replace('_', ' ')}</p>
                    <p className="text-xs text-slate-300 font-medium mb-1 leading-relaxed">{e.eventDetails}</p>
                    <p className="text-[9px] text-slate-500 italic">{formatDateLabel(e.timestamp)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODAL VISOR DE IMAGEN AVANZADO */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[800px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-black/95">
          {selectedImage && (
            <div className="relative flex flex-col">
              <div className="p-6 flex items-center justify-between text-white border-b border-white/10">
                <div className="space-y-1">
                  <DialogTitle className="text-lg font-black uppercase italic tracking-tighter text-blue-400">
                    Inspección de Evidencia
                  </DialogTitle>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {selectedImage.task}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    className="text-white hover:bg-white/10 rounded-xl font-black text-[10px] uppercase gap-2"
                    onClick={() => handleDownloadImage(selectedImage.url)}
                  >
                    <Download className="h-4 w-4" /> Descargar Original
                  </Button>
                </div>
              </div>

              <div className="relative aspect-video w-full bg-slate-900 flex items-center justify-center">
                <img 
                  src={selectedImage.url} 
                  alt="Evidencia Full" 
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <div className="p-8 bg-slate-900 text-white space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedImage.lat && selectedImage.lng ? (
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg"><Navigation className="h-4 w-4" /></div>
                        <div>
                          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Georreferencia GPS</p>
                          <p className="text-xs font-mono font-bold">{selectedImage.lat.toFixed(6)}, {selectedImage.lng.toFixed(6)}</p>
                        </div>
                      </div>
                      <Button asChild variant="outline" className="w-full h-9 border-white/20 text-white hover:bg-white/10 text-[9px] font-black uppercase">
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${selectedImage.lat},${selectedImage.lng}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Globe className="h-3 w-3 mr-2" /> Abrir en Google Maps
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex items-center gap-3 opacity-50">
                      <MapPin className="h-5 w-5 text-slate-500" />
                      <p className="text-[10px] font-black uppercase text-slate-500">Sin datos GPS registrados</p>
                    </div>
                  )}

                  <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Orden de Trabajo</p>
                    <p className="text-lg font-black italic text-white">{otId}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">{client?.name}</p>
                  </div>
                </div>
                
                <p className="text-[9px] text-slate-500 text-center uppercase font-bold tracking-[0.2em]">
                  Certificación de Evidencia Técnica - PCGMANTENIMIENTO ERP
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />
    </div>
  );
}
