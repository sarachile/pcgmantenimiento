
"use client";

import { use, useState, useEffect, Suspense } from "react";
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
  Building2,
  HardHat,
  Camera,
  XCircle,
  AlertTriangle,
  Fingerprint,
  Lock,
  ArrowRight,
  Layers,
  ListChecks,
  MapPin,
  Users,
  ClipboardList
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, updateDocumentNonBlocking } from "@/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { WorkOrder, Client, Company, Asset, StaffMember } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FirebaseImage } from "@/components/FirebaseImage";
import { useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

function ExternalApprovalContent({ params }: { params: { id: string } }) {
  const otId = params.id;
  const searchParams = useSearchParams();
  const companyId = searchParams.get('c');
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const [ot, setOt] = useState<WorkOrder | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados de flujo
  const [isAccessGranted, setIsAccessLocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [step, setStep] = useState(1); // 1: Review, 2: Evaluation, 3: Confirmation, 4: Success, 5: Rejection, 6: Confirm Reject
  
  const [rejectionReason, setRejectionReason] = useState("");
  const [ratings, setRatings] = useState({ quality: 0, timing: 0, safety: 0, documentation: 0 });
  const [comment, setComment] = useState("");

  useEffect(() => {
    async function loadData() {
      if (!companyId || !firestore) {
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

            // Cargar Personal Asignado
            if (otData.assignedToStaffIds && otData.assignedToStaffIds.length > 0) {
              const staffPromises = otData.assignedToStaffIds.map(id => 
                getDoc(doc(firestore, "companies", companyId, "staff", id))
              );
              const staffSnaps = await Promise.all(staffPromises);
              const staffList = staffSnaps
                .filter(s => s.exists())
                .map(s => ({ ...s.data(), id: s.id } as StaffMember));
              setStaff(staffList);
            }
          }
        }
      } catch (e) {
        console.error("Error cargando portal:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [firestore, otId, companyId]);

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === ot?.approvalPin) {
      setIsAccessLocked(true);
      toast({ title: "Acceso Concedido", description: "Identidad verificada exitosamente." });
    } else {
      toast({ title: "Código Incorrecto", description: "El PIN ingresado no es válido.", variant: "destructive" });
      setPinInput("");
    }
  };

  const handleFinalDigitalApproval = async () => {
    if (!ot || !company || !firestore) return;
    setIsSubmitting(true);
    try {
      const verificationCode = `PCG-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      const clientName = client?.contactName || "Responsable Mandante";
      
      let evaluationId = null;
      if (ot.evaluationRequired) {
        const evalCol = collection(firestore, "companies", company.id, "evaluations");
        const evalDoc = await addDoc(evalCol, {
          workOrderId: ot.id,
          clientId: ot.clientId,
          companyId: company.id,
          reviewerId: "external_client",
          reviewerName: clientName,
          ratings,
          comment,
          createdAt: serverTimestamp()
        });
        evaluationId = evalDoc.id;
      }

      // 1. Actualizar Orden de Trabajo
      const otRef = doc(firestore, "companies", company.id, "workOrders", ot.id);
      updateDocumentNonBlocking(otRef, {
        clientApprovalName: clientName,
        clientApprovalDate: serverTimestamp(),
        clientApprovalCode: verificationCode,
        evaluationId: evaluationId,
        status: 'aprobada',
        updatedAt: serverTimestamp()
      });

      // 2. Registrar en Bitácora Técnica
      const logCol = collection(firestore, "companies", company.id, "workOrders", ot.id, "digitalLogbookEntries");
      await addDoc(logCol, {
        workOrderId: ot.id,
        companyId: company.id,
        timestamp: serverTimestamp(),
        eventType: 'status_change',
        eventDetails: `Servicio aprobado digitalmente por el cliente: ${clientName}. Sello: ${verificationCode}.`,
        actor: "EXTERNAL_PORTAL"
      });

      setStep(4);
      toast({ title: "¡Gracias!", description: "Su aprobación digital ha sido registrada con éxito." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextFromReview = () => {
    if (ot?.evaluationRequired) {
      setStep(2);
    } else {
      setStep(3);
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

      // Registrar rechazo en bitácora
      const logCol = collection(firestore, "companies", company.id, "workOrders", ot.id, "digitalLogbookEntries");
      await addDoc(logCol, {
        workOrderId: ot.id,
        companyId: company.id,
        timestamp: serverTimestamp(),
        eventType: 'status_change',
        eventDetails: `El cliente rechazó el servicio mediante el portal. Motivo: ${rejectionReason.trim()}`,
        actor: "EXTERNAL_PORTAL"
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

  if (ot.status === 'aprobada') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 md:p-10 text-center rounded-[2.5rem] shadow-2xl border-none">
          <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter italic">Servicio Finalizado</h2>
          <p className="text-slate-500 font-medium leading-relaxed">Esta orden de trabajo ya cuenta con aprobación digital conforme.</p>
          <Button className="mt-8 w-full h-12 rounded-2xl bg-indigo-600 font-black shadow-lg text-white" asChild><a href="/">Cerrar Portal</a></Button>
        </Card>
      </div>
    );
  }

  // PANTALLA DE BLOQUEO POR PIN
  if (!isAccessGranted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 md:p-6">
        <Card className="max-w-md w-full rounded-[2.5rem] shadow-2xl border-none overflow-hidden animate-in zoom-in-95 duration-500">
          <CardHeader className="bg-white p-8 md:p-10 text-center space-y-4">
            <div className="bg-indigo-100 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Lock className="h-8 w-8 md:h-10 md:w-10 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-xl md:text-2xl font-black uppercase tracking-tighter italic text-slate-900">Acceso Protegido</CardTitle>
              <CardDescription className="text-slate-500 font-medium text-sm">Ingrese el código único asignado para validar su servicio.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="bg-slate-50 p-8 md:p-10">
            <form onSubmit={handleVerifyPin} className="space-y-6">
              <div className="space-y-2 text-center">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">PIN de 6 Dígitos</Label>
                <Input 
                  type="text" 
                  maxLength={6} 
                  inputMode="numeric"
                  placeholder="000000"
                  className="h-16 md:h-20 text-center text-3xl md:text-4xl font-black tracking-[0.5em] rounded-2xl border-2 focus:border-indigo-500 border-slate-200 shadow-inner bg-white"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
              <Button type="submit" className="w-full h-14 md:h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base md:text-lg shadow-xl shadow-indigo-200 uppercase tracking-widest gap-3">
                Verificar <ArrowRight className="h-5 w-5" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDateLabel = (date: any) => {
    if (!date) return "...";
    try {
      const d = date.toDate ? date.toDate() : (typeof date === 'string' ? parseISO(date) : date);
      return format(d, "dd 'de' MMMM", { locale: es });
    } catch (e) { return "N/A"; }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-slate-900 text-white p-6 md:p-8 pt-10 md:pt-12 rounded-b-[2.5rem] md:rounded-b-[3.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10"><ShieldCheck className="h-32 w-32 md:h-40 md:w-40" /></div>
        <div className="max-w-3xl mx-auto relative z-10">
          <Badge className="bg-white/10 text-white mb-3 backdrop-blur-md border-white/20 uppercase tracking-[0.2em] font-black text-[8px]">Aprobación Digital</Badge>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2 uppercase leading-none italic">{company?.name}</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-400 font-bold text-xs md:text-sm">
            <span className="text-blue-400">OT: {ot.id}</span>
            <span className="opacity-20 hidden sm:inline">|</span>
            <span className="flex items-center gap-1.5 truncate max-w-[150px] md:max-w-none"><Building2 className="h-3 w-3" /> {client?.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 -mt-8 md:-mt-10">
        {step < 4 && (
          <div className="bg-white rounded-full shadow-xl p-1 mb-6 md:mb-8 flex gap-1 border">
            {[1, 2, 3].map(s => (
              <div key={s} className={cn(
                "h-1.5 md:h-2 flex-1 rounded-full transition-all duration-500",
                step >= s ? "bg-indigo-600" : "bg-slate-100"
              )} />
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="rounded-[2rem] md:rounded-[2.5rem] border-none shadow-xl overflow-hidden">
              <CardHeader className="bg-slate-50 border-b p-6 md:p-8">
                <CardTitle className="text-lg md:text-xl font-black flex items-center gap-3 uppercase tracking-tighter"><HardHat className="h-5 w-5 md:h-6 md:w-6 text-indigo-600" /> Resumen de Trabajo</CardTitle>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-8">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-2 border-slate-100 shadow-inner space-y-3">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                      <Layers className="h-3 w-3 text-indigo-600" /> Activo
                    </p>
                    <p className="text-base md:text-lg font-black text-slate-900 truncate">{asset?.name || "Servicio General"}</p>
                  </div>
                  <div className="bg-slate-50 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-2 border-slate-100 shadow-inner space-y-3">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-indigo-600" /> Ubicación
                    </p>
                    <p className="text-xs font-bold text-slate-700 truncate">{ot.street} {ot.streetNumber}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 pl-1">
                    <ClipboardList className="h-3.5 w-3.5" /> Trabajo Realizado
                  </Label>
                  <div className="text-sm text-slate-700 leading-relaxed bg-indigo-50/20 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-2 border-indigo-100 italic font-medium shadow-inner">
                    "{ot.description}"
                  </div>
                </div>

                {ot.checklist && ot.checklist.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 pl-1">
                      <ListChecks className="h-3.5 w-3.5" /> Protocolos Conformes
                    </Label>
                    <div className="space-y-2">
                      {ot.checklist.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-emerald-50/30 border-2 border-emerald-100 rounded-xl">
                          <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                            <Check className="h-3 w-3" />
                          </div>
                          <span className="text-xs font-bold text-slate-700">{item.task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ot.evidenceUrls && ot.evidenceUrls.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 pl-1">
                      <Camera className="h-3.5 w-3.5" /> Registro Fotográfico
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      {ot.evidenceUrls.slice(0, 4).map((url, i) => (
                        <div key={i} className="aspect-video rounded-xl overflow-hidden border-2 border-slate-100 bg-muted">
                          <FirebaseImage url={url} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="flex flex-col gap-3">
              <Button className="w-full h-16 md:h-20 rounded-[1.5rem] md:rounded-[2rem] bg-indigo-600 text-white text-base md:text-lg font-black shadow-xl shadow-indigo-200 uppercase tracking-widest gap-3" onClick={handleNextFromReview}>
                Aprobar Servicio <ArrowRight className="h-5 w-5" />
              </Button>
              <Button variant="ghost" className="text-rose-500 font-black h-12 uppercase text-[10px] tracking-widest" onClick={() => setStep(6)}>
                Reportar Problema
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <Card className="rounded-[2rem] md:rounded-[2.5rem] border-none shadow-xl">
              <CardHeader className="p-8 md:p-10 pb-4 text-center">
                <div className="bg-amber-100 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <Star className="h-8 w-8 md:h-10 md:w-10 text-amber-600 fill-amber-600" />
                </div>
                <CardTitle className="text-xl md:text-2xl font-black italic tracking-tighter">Evaluación</CardTitle>
                <CardDescription className="text-sm font-medium">Califique la calidad de la intervención.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-10 pt-4 space-y-4 md:space-y-6">
                {[
                  { key: 'quality', label: 'Calidad Ejecución' },
                  { key: 'timing', label: 'Cumplimiento Plazos' },
                  { key: 'safety', label: 'Orden y Seguridad' }
                ].map(c => (
                  <div key={c.key} className="flex flex-col gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                    <div className="flex justify-between items-center">
                      <p className="font-black text-slate-900 text-sm tracking-tight">{c.label}</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button key={s} onClick={() => setRatings({...ratings, [c.key]: s})} className="p-1 transition-transform active:scale-125">
                            <Star className={cn("h-6 w-6 md:h-7 md:w-7 transition-all", (ratings as any)[c.key] >= s ? "fill-amber-500 text-amber-500" : "text-slate-200")} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="space-y-2 pt-2">
                  <Label className="text-[9px] font-black uppercase text-slate-400 pl-2">Comentarios</Label>
                  <Textarea placeholder="Opcional..." className="rounded-2xl min-h-[100px] border-2 border-slate-100 p-4" value={comment} onChange={e => setComment(e.target.value)} />
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-14 md:h-16 rounded-2xl font-black text-slate-400 uppercase text-[10px]" onClick={() => setStep(1)}>Atrás</Button>
              <Button className="flex-[2] h-14 md:h-16 rounded-2xl bg-indigo-600 text-white font-black shadow-xl uppercase text-[10px] tracking-widest" disabled={!Object.values(ratings).every(r => r > 0)} onClick={() => setStep(3)}>Confirmar</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden">
              <CardHeader className="p-8 md:p-10 text-center bg-indigo-50/50 border-b">
                <div className="bg-indigo-600 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
                  <Fingerprint className="h-8 w-8 md:h-10 md:w-10 text-white" />
                </div>
                <CardTitle className="text-xl md:text-2xl font-black uppercase tracking-tighter italic">Firma Digital</CardTitle>
                <CardDescription className="text-sm font-medium">Validación final de conformidad técnica.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 md:p-10 space-y-8">
                <div className="bg-slate-50 p-5 rounded-2xl border-2 border-dashed space-y-3">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-black text-slate-400 uppercase">Responsable</span>
                    <span className="font-bold text-slate-900">{client?.contactName || "Mandante"}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-black text-slate-400 uppercase">Fecha</span>
                    <span className="font-bold text-slate-900">{format(new Date(), "dd/MM/yyyy")}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    className="w-full h-16 rounded-2xl bg-indigo-600 text-white text-base font-black shadow-xl uppercase tracking-widest" 
                    onClick={handleFinalDigitalApproval}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : "Firmar y Finalizar"}
                  </Button>
                  <Button variant="ghost" className="w-full text-slate-400 font-black uppercase text-[9px]" onClick={() => ot?.evaluationRequired ? setStep(2) : setStep(1)}>
                    Volver Atrás
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in zoom-in-95 duration-700">
            <Card className="rounded-[2.5rem] md:rounded-[3.5rem] border-none shadow-2xl p-10 md:p-16 text-center bg-white">
              <div className="bg-emerald-100 w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-100 animate-bounce">
                <Check className="h-10 w-10 md:h-14 md:w-12 text-emerald-600" />
              </div>
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-4 md:mb-6 tracking-tighter uppercase italic">¡Aprobado!</h2>
              <p className="text-slate-500 font-bold mb-10 leading-relaxed text-sm md:text-base">
                Su sello de validación digital ha sido generado. La Orden de Trabajo ha sido cerrada exitosamente.
              </p>
              <Button className="w-full h-14 rounded-2xl bg-indigo-600 text-white font-black shadow-xl uppercase text-[10px] tracking-widest" asChild>
                <a href="/">Cerrar Portal</a>
              </Button>
            </Card>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="rounded-[2.5rem] border-none shadow-xl">
              <CardHeader className="p-8 md:p-10 text-center">
                <div className="bg-rose-100 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-8 w-8 md:h-10 md:w-10 text-rose-600" />
                </div>
                <CardTitle className="text-xl md:text-2xl font-black text-rose-700 uppercase italic">Rechazar</CardTitle>
                <CardDescription className="text-sm font-medium">Indique los motivos de su disconformidad.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 md:p-10 pt-0 space-y-6">
                <Textarea 
                  placeholder="Detalle el problema..." 
                  className="rounded-2xl min-h-[150px] border-2 border-rose-100 p-4 text-sm" 
                  value={rejectionReason} 
                  onChange={e => setRejectionReason(e.target.value)} 
                />
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px]" onClick={() => setStep(1)}>Cancelar</Button>
                  <Button 
                    className="flex-[2] h-14 rounded-2xl bg-rose-600 text-white font-black shadow-xl uppercase text-[10px] tracking-widest" 
                    disabled={!rejectionReason.trim() || isSubmitting} 
                    onClick={handleReject}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Rechazo"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExternalApprovalPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <ExternalApprovalContent params={resolvedParams} />
    </Suspense>
  );
}
