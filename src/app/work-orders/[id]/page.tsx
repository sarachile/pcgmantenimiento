
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
  Globe
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
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    if (profile?.companyId) {
      const baseUrl = "https://www.pcgmantenimiento.com";
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

  const handleDirectApproval = async () => {
    if (!otRef || !profile) return;
    setIsUpdating(true);
    try {
      const verificationCode = `ADM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      updateDocumentNonBlocking(otRef, { status: 'aprobada', clientApprovalName: profile.name + " (Adm)", clientApprovalDate: serverTimestamp(), clientApprovalCode: verificationCode, updatedAt: serverTimestamp() });
      toast({ title: "Orden Aprobada Internamente" });
    } catch (e: any) { toast({ title: "Error", variant: "destructive" }); } finally { setIsUpdating(false); }
  };

  if (isDocLoading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!ot) return <div className="p-8 text-center">Orden no encontrada.</div>;

  const isAdminOrSupervisor = isCompanyAdmin || isSupervisor;

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
            <Badge className={cn("px-3 py-1 font-black uppercase text-[10px] tracking-widest", ot.status === 'aprobada' ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700")}>{ot.status.replace('_', ' ').toUpperCase()}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdminOrSupervisor && ot.status !== 'aprobada' && <Button onClick={handleDirectApproval} disabled={isUpdating} className="rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] gap-2 shadow-lg">{isUpdating ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />} Visar</Button>}
          {isAdminOrSupervisor && <Button variant="outline" size="sm" asChild className="rounded-xl h-11 border-amber-200 text-amber-700 font-bold" disabled={ot.status === 'aprobada'}><Link href={`/work-orders/new?editId=${ot.id}`}><Edit2 className="h-4 w-4 mr-2" /> Editar</Link></Button>}
          <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={isGeneratingPdf} className="rounded-xl h-11"><FileDown className="h-4 w-4 mr-2" /> Informe</Button>
          {ot.status === 'aprobada' && <Button variant="outline" size="sm" onClick={handleDownloadExperienceCert} disabled={isGeneratingCert} className="rounded-xl h-11 border-blue-200 text-blue-700"><Award className="h-4 w-4 mr-2" /> Certificado</Button>}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/5 p-6 border-b"><CardTitle className="text-lg font-black uppercase flex items-center gap-2"><MapIcon className="h-5 w-5 text-primary" /> Ubicación del Servicio</CardTitle></CardHeader>
            <CardContent className="p-6">
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700">{ot.street} {ot.streetNumber}{ot.complement ? ', ' + ot.complement : ''}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ot.commune}, {ot.city}, {ot.region}</p>
                {ot.locationComment && <Badge variant="outline" className="mt-2 bg-blue-50 text-blue-700 border-blue-100 text-[9px] font-black uppercase italic">{ot.locationComment}</Badge>}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/5 p-6 border-b"><CardTitle className="text-lg font-black uppercase flex items-center gap-2"><ListChecks className="h-5 w-5" /> Protocolos & Evidencias</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {ot.checklist?.map(item => (
                  <div key={item.id} className="flex flex-col sm:flex-row gap-4 p-4 bg-white border-2 rounded-2xl">
                    <div className="flex-1 flex items-center gap-4">
                      <div className={cn("h-6 w-6 rounded-full flex items-center justify-center border-2 shrink-0", item.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-200 text-slate-200")}><Check className="h-4 w-4" /></div>
                      <div className="flex flex-col"><span className={cn("text-sm font-bold", item.completed ? "text-slate-900" : "text-slate-400")}>{item.task}</span>{item.completed && <span className="text-[9px] font-black text-slate-400">REALIZADO: {format(new Date(item.completedAt), "dd/MM HH:mm")}</span>}</div>
                    </div>
                    {item.evidenceUrl && <div className="w-full sm:w-40 aspect-video rounded-xl overflow-hidden shadow-sm"><FirebaseImage url={item.evidenceUrl} className="w-full h-full" /></div>}
                  </div>
                ))}
              </div>

              {ot.evidenceUrls && ot.evidenceUrls.length > 0 && (
                <div className="space-y-4 pt-4 border-t-2 border-dashed">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Camera className="h-4 w-4" /> Galería General de Terreno</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {ot.evidenceUrls.map((url, i) => (
                      <div key={i} className="aspect-video rounded-xl overflow-hidden border-2 shadow-sm group bg-slate-50"><FirebaseImage url={url} className="w-full h-full transition-transform group-hover:scale-110" /></div>
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
    </div>
  );
}
