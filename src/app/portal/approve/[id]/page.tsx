
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
  ShieldCheck, 
  Star, 
  Check, 
  Loader2, 
  ArrowLeft,
  Signature as SignatureIcon,
  Send,
  Building2,
  HardHat,
  ListChecks,
  Camera,
  Image as ImageIcon,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { initializeFirebase, updateDocumentNonBlocking } from "@/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { WorkOrder, Client, Company, Asset } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FirebaseImage } from "@/components/FirebaseImage";
import { useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

function SignaturePad({ onSave, isSaving }: { onSave: (blob: Blob) => void, isSaving: boolean }) {
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
      <div className="border-4 border-indigo-100 rounded-3xl bg-white overflow-hidden touch-none shadow-inner">
        <canvas 
          ref={canvasRef} width={400} height={250} className="w-full cursor-crosshair h-[250px]" 
          onMouseDown={startDrawing} onMouseUp={stopDrawing} onMouseMove={draw} 
          onTouchStart={(e) => { e.preventDefault(); startDrawing(e); }} 
          onTouchEnd={stopDrawing} onTouchMove={(e) => { e.preventDefault(); draw(e); }} 
        />
      </div>
      <div className="flex justify-between gap-4">
        <Button variant="outline" className="flex-1 h-12 rounded-2xl" onClick={() => canvasRef.current?.getContext('2d')?.clearRect(0, 0, 400, 250)} disabled={isSaving}>Limpiar</Button>
        <Button className="flex-1 h-12 rounded-2xl bg-indigo-600 font-black shadow-lg" onClick={() => canvasRef.current?.toBlob(b => b && onSave(b), 'image/png')} disabled={isSaving}>
          {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <><Check className="mr-2 h-4 w-4" /> Confirmar Firma</>}
        </Button>
      </div>
    </div>
  );
}

export default function ExternalApprovalPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const otId = resolvedParams.id;
  const searchParams = useSearchParams();
  const companyId = searchParams.get('c');
  const { toast } = useToast();
  
  const [ot, setOt] = useState<WorkOrder | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: Review, 2: Evaluation, 3: Signature, 4: Success, 5: Rejection, 6: Confirm Reject
  const [rejectionReason, setRejectionReason] = useState("");

  const [ratings, setRatings] = useState({ quality: 0, timing: 0, safety: 0, documentation: 0 });
  const [comment, setComment] = useState("");

  const { firestore, storage } = useMemo(() => initializeFirebase(), []);

  useEffect(() => {
    async function loadData() {
      if (!companyId) {
        setLoading(false);
        return;
      }
      try {
        const companyDoc = await getDoc(doc(firestore, "companies", companyId));
        if (companyDoc.exists()) {
          setCompany({ ...companyDoc.data() as Company, id: companyId });
          
          const otDoc = await getDoc(doc(firestore, "companies", companyId, "workOrders", otId));
          if (otDoc.exists()) {
            const otData = otDoc.data() as WorkOrder;
            setOt({ ...otData, id: otId });
            
            const clientDoc = await getDoc(doc(firestore, "companies", companyId, "clients", otData.clientId));
            if (clientDoc.exists()) setClient(clientDoc.data() as Client);
            
            if (otData.assetId) {
              const assetDoc = await getDoc(doc(firestore, "companies", companyId, "assets", otData.assetId));
              if (assetDoc.exists()) setAsset(assetDoc.data() as Asset);
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [firestore, otId, companyId]);

  const handleFinalApprove = async (signatureBlob: Blob) => {
    if (!ot || !company || !firestore || !storage) return;
    setIsSubmitting(true);
    try {
      const path = `companies/${company.id}/workOrders/${ot.id}/client_sig_${Date.now()}.png`;
      const sRef = ref(storage, path);
      await uploadBytes(sRef, signatureBlob);
      const signatureUrl = await getDownloadURL(sRef);

      const evalCol = collection(firestore, "companies", company.id, "evaluations");
      const evalDoc = await addDoc(evalCol, {
        workOrderId: ot.id,
        clientId: ot.clientId,
        companyId: company.id,
        reviewerId: "external_client",
        reviewerName: client?.contactName || "Cliente Externo",
        ratings,
        comment,
        createdAt: serverTimestamp()
      });

      const otRef = doc(firestore, "companies", company.id, "workOrders", ot.id);
      updateDocumentNonBlocking(otRef, {
        clientSignatureUrl: signatureUrl,
        evaluationId: evalDoc.id,
        status: 'aprobada',
        updatedAt: serverTimestamp()
      });

      setStep(4);
      toast({ title: "¡Gracias!", description: "Su aprobación ha sido registrada con éxito." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!ot || !company || !firestore || !rejectionReason.trim()) return;
    setIsSubmitting(true);
    try {
      const otRef = doc(firestore, "companies", company.id, "workOrders", ot.id);
      updateDocumentNonBlocking(otRef, {
        status: 'rechazada',
        rejectedReason: rejectionReason.trim(),
        updatedAt: serverTimestamp()
      });

      setStep(5);
      toast({ title: "Orden Rechazada", description: "Se ha notificado a la empresa técnica." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-10 w-10 animate-spin text-indigo-600" /></div>;
  if (!ot || !companyId) return <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center"><Card className="p-10 rounded-[2.5rem] border-dashed border-2">Acceso no válido o caducado.</Card></div>;

  const formatDateLabel = (date: any) => {
    if (!date) return "...";
    try {
      const d = date.toDate ? date.toDate() : (typeof date === 'string' ? parseISO(date) : date);
      return format(d, "dd 'de' MMMM, yyyy", { locale: es });
    } catch (e) { return "N/A"; }
  };

  if (ot.status === 'aprobada') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-10 text-center rounded-[2.5rem] shadow-2xl border-none">
          <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter italic">Servicio Finalizado</h2>
          <p className="text-slate-500 font-medium leading-relaxed">Esta orden de trabajo ya ha sido validada y cerrada por su organización.</p>
          <Button className="mt-8 w-full h-12 rounded-2xl bg-indigo-600 font-black shadow-lg" asChild><Link href="/">Volver al Inicio</Link></Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-slate-900 text-white p-8 pt-12 rounded-b-[3.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10"><ShieldCheck className="h-40 w-40" /></div>
        <div className="max-w-2xl mx-auto relative z-10">
          <Badge className="bg-white/10 text-white mb-4 backdrop-blur-md border-white/20 uppercase tracking-[0.2em] font-black text-[9px]">Portal de Aprobación Externo</Badge>
          <h1 className="text-3xl font-black tracking-tight mb-2 uppercase leading-none italic">{company?.name}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 font-bold text-sm">
            <span className="text-blue-400">OT: {ot.id}</span>
            <span className="opacity-20">|</span>
            <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {client?.name}</span>
            <span className="opacity-20">|</span>
            <span>EJECUCIÓN: {formatDateLabel(ot.executedAt)}</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-10">
        {step < 4 && (
          <div className="bg-white rounded-[2rem] shadow-xl p-1.5 mb-8 flex gap-1 border">
            {[1, 2, 3].map(s => (
              <div key={s} className={cn(
                "h-2.5 flex-1 rounded-full transition-all duration-500",
                step >= s ? "bg-indigo-600" : "bg-slate-100"
              )} />
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden">
              <CardHeader className="bg-slate-50 border-b p-8">
                <CardTitle className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter"><HardHat className="h-6 w-6 text-indigo-600" /> Resumen de Intervención</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Activo / Equipo</p>
                    <p className="text-base font-black text-slate-900">{asset?.name || "S/I"}</p>
                    <p className="text-[10px] font-bold text-indigo-600 mt-1 uppercase">Código: {asset?.code || "S/I"}</p>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Ubicación</p>
                    <p className="text-sm font-bold text-slate-700">{asset?.location || "Planta Central"}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Trabajos Realizados</Label>
                  <div className="text-sm text-slate-700 leading-relaxed bg-indigo-50/30 p-6 rounded-[2rem] border-2 border-indigo-100 italic font-medium shadow-inner">
                    "{ot.description}"
                  </div>
                </div>

                {ot.evidenceUrls && ot.evidenceUrls.length > 0 && (
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 pl-1"><Camera className="h-4 w-4" /> Evidencia Fotográfica</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {ot.evidenceUrls.map((url, i) => (
                        <div key={i} className="aspect-video rounded-2xl overflow-hidden border-2 border-slate-100 bg-muted shadow-sm group">
                          <FirebaseImage url={url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ot.technicianSignatureUrl && (
                  <div className="space-y-3 pt-6 border-t border-dashed">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Firma Responsable Técnico</Label>
                    <div className="h-32 border-4 border-dashed rounded-3xl flex items-center justify-center p-4 bg-slate-50 shadow-inner">
                      <FirebaseImage url={ot.technicianSignatureUrl} className="max-h-full" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="flex flex-col gap-4">
              <Button className="w-full h-16 rounded-2xl bg-indigo-600 text-lg font-black shadow-xl shadow-indigo-200 uppercase tracking-widest" onClick={() => setStep(2)}>Siguiente: Evaluar Servicio <ArrowLeft className="ml-2 h-5 w-5 rotate-180" /></Button>
              <Button variant="ghost" className="text-rose-500 font-black h-12 uppercase tracking-widest hover:bg-rose-50" onClick={() => setStep(6)}>
                <AlertTriangle className="h-4 w-4 mr-2" /> Reportar Disconformidad
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <Card className="rounded-[2.5rem] border-none shadow-xl">
              <CardHeader className="p-10 pb-4 text-center">
                <div className="bg-amber-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Star className="h-10 w-10 text-amber-600 fill-amber-600" />
                </div>
                <CardTitle className="text-2xl font-black italic tracking-tighter">Calificación de Servicio</CardTitle>
                <CardDescription className="text-base font-medium">Su feedback nos ayuda a mantener el estándar de calidad.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 pt-4 space-y-6">
                {[
                  { key: 'quality', label: 'Calidad Ejecución', desc: 'Cumplimiento técnico de la tarea.' },
                  { key: 'timing', label: 'Cumplimiento Plazos', desc: 'Respeto a horarios y fechas.' },
                  { key: 'safety', label: 'Seguridad y Limpieza', desc: 'Orden del entorno de trabajo.' },
                  { key: 'documentation', label: 'Claridad Reporte', desc: 'Calidad de evidencia y detalle.' }
                ].map(c => (
                  <div key={c.key} className="flex flex-col gap-3 p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                    <div className="flex justify-between items-center">
                      <p className="font-black text-slate-900 tracking-tight">{c.label}</p>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button key={s} onClick={() => setRatings({...ratings, [c.key]: s})} className="p-1 transition-transform hover:scale-125">
                            <Star className={cn("h-7 w-7 transition-all duration-300", (ratings as any)[c.key] >= s ? "fill-amber-500 text-amber-500" : "text-slate-200")} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">{c.desc}</p>
                  </div>
                ))}
                <div className="space-y-2 pt-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400 pl-2">Observaciones Adicionales</Label>
                  <Textarea placeholder="Cuéntenos más sobre su experiencia (opcional)..." className="rounded-2xl min-h-[120px] border-2 border-slate-100 focus:border-indigo-500 p-4" value={comment} onChange={e => setComment(e.target.value)} />
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1 h-16 rounded-2xl font-black text-slate-400 uppercase tracking-widest" onClick={() => setStep(1)}>Atrás</Button>
              <Button className="flex-[2] h-16 rounded-2xl bg-indigo-600 font-black shadow-xl shadow-indigo-200 uppercase tracking-widest" disabled={!Object.values(ratings).every(r => r > 0)} onClick={() => setStep(3)}>Continuar a la Firma</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <Card className="rounded-[2.5rem] border-none shadow-xl">
              <CardHeader className="p-10 text-center">
                <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <SignatureIcon className="h-10 w-10 text-indigo-600" />
                </div>
                <CardTitle className="text-2xl font-black uppercase tracking-tighter italic">Firma de Conformidad</CardTitle>
                <CardDescription className="font-medium text-base">Al firmar acepta la recepción conforme de los trabajos descritos.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 pt-0">
                <SignaturePad isSaving={isSubmitting} onSave={handleFinalApprove} />
              </CardContent>
              <div className="px-10 pb-8">
                <Button variant="ghost" className="w-full text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]" onClick={() => setStep(2)}>Volver a evaluación</Button>
              </div>
            </Card>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in zoom-in-95 duration-700">
            <Card className="rounded-[3.5rem] border-none shadow-2xl p-16 text-center bg-white overflow-hidden">
              <div className="bg-emerald-100 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-10 shadow-lg shadow-emerald-100 animate-bounce">
                <Check className="h-14 w-12 text-emerald-600" />
              </div>
              <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tighter uppercase italic">¡Servicio Aprobado!</h2>
              <p className="text-slate-500 font-bold text-lg mb-12 leading-relaxed">
                Su validación ha sido registrada. La Orden de Trabajo ha sido cerrada y el reporte técnico final está disponible para su descarga.
              </p>
              <div className="space-y-6">
                <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.5em]">PCGMANTENIMIENTO ERP</p>
                <div className="h-1.5 w-32 bg-indigo-600 mx-auto rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]" />
              </div>
            </Card>
          </div>
        )}

        {step === 5 && (
          <div className="animate-in zoom-in-95 duration-700">
            <Card className="rounded-[3.5rem] border-none shadow-2xl p-16 text-center border-t-8 border-rose-500">
              <div className="bg-rose-100 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-10">
                <XCircle className="h-14 w-14 text-rose-600" />
              </div>
              <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tighter uppercase italic">Orden Rechazada</h2>
              <p className="text-slate-500 font-bold text-lg mb-12 leading-relaxed">
                Hemos registrado su disconformidad. El equipo técnico ha sido notificado para tomar acciones correctivas inmediatas.
              </p>
              <div className="space-y-6">
                <p className="text-[11px] font-black text-rose-400 uppercase tracking-[0.5em]">Gestión de Reclamos Activa</p>
                <div className="h-1.5 w-32 bg-rose-600 mx-auto rounded-full shadow-[0_0_15px_rgba(225,29,72,0.5)]" />
              </div>
            </Card>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="rounded-[2.5rem] border-none shadow-xl">
              <CardHeader className="p-10 text-center">
                <div className="bg-rose-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="h-10 w-10 text-rose-600" />
                </div>
                <CardTitle className="text-2xl font-black text-rose-700 uppercase italic tracking-tighter">Reportar Incidencia</CardTitle>
                <CardDescription className="text-base font-medium">Por favor detalle los motivos por los cuales no aprueba este servicio técnico.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 pt-0 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 pl-2">Detalle de Disconformidad</Label>
                  <Textarea 
                    placeholder="Ej: Trabajo incompleto, falta limpieza, evidencia no corresponde..." 
                    className="rounded-[2rem] min-h-[180px] border-2 border-rose-100 focus:border-rose-500 p-6 text-sm italic" 
                    value={rejectionReason} 
                    onChange={e => setRejectionReason(e.target.value)} 
                  />
                </div>
                <div className="bg-rose-50 p-5 rounded-2xl text-[11px] text-rose-700 font-black uppercase tracking-wider leading-relaxed border border-rose-100 shadow-inner">
                  Nota: El rechazo devolverá la orden al estado técnico para su revisión y corrección obligatoria.
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1 h-16 rounded-2xl font-black text-slate-400 uppercase tracking-widest" onClick={() => setStep(1)}>Cancelar</Button>
              <Button 
                className="flex-2 h-16 rounded-2xl bg-rose-600 font-black shadow-xl shadow-rose-200 uppercase tracking-widest" 
                disabled={!rejectionReason.trim() || isSubmitting} 
                onClick={handleReject}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Rechazo"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
