
"use client";

import { use, useState, useEffect, useRef } from "react";
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
  ListChecks,
  Zap,
  MessageSquare,
  HardHat,
  Signature as SignatureIcon,
  Eraser,
  Check,
  Package,
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
import { useUser, useFirestore, useStorage, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { doc, collection, addDoc, serverTimestamp, arrayUnion, query, orderBy, increment } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from "next/image";
import { ChecklistItem, WorkOrder, DigitalLogbookEntry, Company, PartUsage, SparePart, Client, User, Asset, StaffMember } from "@/lib/types";
import { generateWorkOrderSummary } from "@/ai/flows/generate-work-order-summary";
import { format, parseISO } from "date-fns";
import { WorkOrderReport } from "@/components/WorkOrderReport";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function SignaturePad({ onSave, onCancel, isSaving }: { onSave: (blob: Blob) => void, onCancel: () => void, isSaving: boolean, title: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#000';
  }, []);

  const startDrawing = (e: any) => { setIsDrawing(true); draw(e); };
  const stopDrawing = () => { setIsDrawing(false); canvasRef.current?.getContext('2d')?.beginPath(); };
  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y);
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-lg bg-white overflow-hidden touch-none">
        <canvas ref={canvasRef} width={400} height={200} className="w-full cursor-crosshair" onMouseDown={startDrawing} onMouseUp={stopDrawing} onMouseMove={draw} onTouchStart={startDrawing} onTouchEnd={stopDrawing} onTouchMove={draw} />
      </div>
      <div className="flex justify-between gap-2">
        <Button variant="outline" size="sm" onClick={() => canvasRef.current?.getContext('2d')?.clearRect(0, 0, 400, 200)} disabled={isSaving}>Limpiar</Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
          <Button size="sm" onClick={() => canvasRef.current?.toBlob(b => b && onSave(b), 'image/png')} disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />} Guardar Firma</Button>
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
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [manualComment, setManualComment] = useState("");
  const [signatureType, setSignatureType] = useState<'client' | 'technician' | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const otRef = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return doc(db, "companies", profile.companyId, "workOrders", otId);
  }, [db, profile?.companyId, otId]);

  const { data: ot, isLoading: isDocLoading } = useDoc<WorkOrder>(otRef);
  const { data: company } = useDoc<Company>(useMemoFirebase(() => db && profile?.companyId ? doc(db, "companies", profile.companyId) : null, [db, profile?.companyId]));

  const staffRef = useMemoFirebase(() => {
    if (!db || !profile?.companyId || !ot?.assignedToStaffId) return null;
    return doc(db, "companies", profile.companyId, "staff", ot.assignedToStaffId);
  }, [db, profile?.companyId, ot?.assignedToStaffId]);
  const { data: staffMember } = useDoc<StaffMember>(staffRef);

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

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`PCG_${ot?.id}.pdf`);
      toast({ title: "Reporte generado" });
    } catch (e: any) { toast({ title: "Error al generar PDF", variant: "destructive" }); }
    finally { setIsGeneratingPdf(false); }
  };

  if (isDocLoading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!ot) return <div className="p-8 text-center">Orden no encontrada.</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 px-4">
      {/* Hidden report for PDF generation */}
      <div className="absolute -left-[9999px] top-0 pointer-events-none opacity-0">
        <WorkOrderReport ref={reportRef} company={company || null} workOrder={ot} client={client || null} asset={asset || null} logbook={logbook || []} technician={staffMember ? { name: staffMember.name } as any : null} partUsages={partUsages || []} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <Button variant="ghost" size="icon" asChild><Link href="/work-orders"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{ot.id}</h2>
            <Badge variant={ot.status === 'aprobada' ? 'default' : 'outline'}>{ot.status.toUpperCase()}</Badge>
          </div>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <HardHat className="h-3 w-3" /> Responsable: {staffMember?.name || 'Por asignar'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleDownloadPdf} disabled={isGeneratingPdf}>{isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileDown className="h-4 w-4 mr-2" />} Reporte PDF</Button>
          {ot.status !== 'aprobada' && (
            <Button className="bg-emerald-600" onClick={() => updateDocumentNonBlocking(otRef!, { status: 'aprobada', reviewedAt: serverTimestamp() })}>Aprobar Trabajo</Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle className="text-lg">Detalles de Ejecución</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 p-3 rounded-lg"><p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Cliente</p><p className="text-sm font-bold">{client?.name || 'S/I'}</p></div>
                <div className="bg-muted/30 p-3 rounded-lg"><p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Equipo</p><p className="text-sm font-bold">{asset?.name || 'S/I'}</p></div>
              </div>
              <p className="text-sm">{ot.description}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" /> Protocolo Realizado</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {ot.checklist?.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                  <Checkbox checked={item.completed} onCheckedChange={() => {
                    const newChecklist = ot.checklist?.map(i => i.id === item.id ? { ...i, completed: !i.completed, completedAt: !i.completed ? new Date().toISOString() : null } : i);
                    updateDocumentNonBlocking(otRef!, { checklist: newChecklist, updatedAt: serverTimestamp() });
                  }} disabled={ot.status === 'aprobada'} />
                  <span className={cn("text-sm", item.completed && "line-through text-muted-foreground")}>{item.task}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><SignatureIcon className="h-5 w-5 text-primary" /> Firmas de Conformidad</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div className="space-y-2 text-center">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Personal Responsable</p>
                {ot.technicianSignatureUrl ? <div className="border rounded-lg p-2 aspect-video relative"><img src={ot.technicianSignatureUrl} className="w-full h-full object-contain" /></div> : <Button variant="outline" className="w-full" onClick={() => setSignatureType('technician')}>Firmar</Button>}
              </div>
              <div className="space-y-2 text-center">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Recepción Cliente</p>
                {ot.clientSignatureUrl ? <div className="border rounded-lg p-2 aspect-video relative"><img src={ot.clientSignatureUrl} className="w-full h-full object-contain" /></div> : <Button variant="outline" className="w-full" onClick={() => setSignatureType('client')}>Firmar</Button>}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Bitácora Operativa</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Textarea placeholder="Reportar novedad..." className="min-h-[60px]" value={manualComment} onChange={e => setManualComment(e.target.value)} />
                <Button size="icon" onClick={() => {
                  if (!manualComment.trim() || !profile) return;
                  addDoc(collection(db!, "companies", profile.companyId, "workOrders", ot.id, "digitalLogbookEntries"), {
                    workOrderId: ot.id, companyId: profile.companyId, timestamp: serverTimestamp(), eventType: 'comment', eventDetails: manualComment, actor: profile.id
                  });
                  setManualComment("");
                }}><MessageSquare className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-4 border-l pl-4">
                {logbook?.map(entry => (
                  <div key={entry.id} className="text-xs">
                    <p className="font-bold text-primary uppercase">{entry.eventType}</p>
                    <p className="text-muted-foreground">{entry.eventDetails}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {signatureType && (
        <Dialog open={true} onOpenChange={() => setSignatureType(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Capturar Firma: {signatureType === 'client' ? 'Cliente' : 'Personal'}</DialogTitle></DialogHeader>
            <SignaturePad title={signatureType} isSaving={false} onCancel={() => setSignatureType(null)} onSave={async blob => {
              const path = `companies/${profile?.companyId}/workOrders/${ot.id}/sig_${Date.now()}.png`;
              const sRef = ref(storage!, path);
              await uploadBytes(sRef, blob);
              const url = await getDownloadURL(sRef);
              updateDocumentNonBlocking(otRef!, signatureType === 'client' ? { clientSignatureUrl: url } : { technicianSignatureUrl: url });
              setSignatureType(null);
              toast({ title: "Firma guardada" });
            }} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
