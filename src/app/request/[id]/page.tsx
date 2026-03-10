"use client";

import { use, useState, useEffect, Suspense, useRef, useMemo } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ClipboardPlus, 
  Loader2, 
  CheckCircle2, 
  Mail, 
  Building2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  MapPin,
  User,
  Camera,
  Trash2,
  Hash,
  History,
  ChevronRight,
  Share,
  PlusSquare,
  Zap,
  Check,
  Monitor,
  Download,
  Globe
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useStorage } from "@/firebase";
import { doc, getDoc, setDoc, serverTimestamp, query, where, getDocs, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Client, Company, WorkOrder } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { FirebaseImage } from "@/components/FirebaseImage";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CHILE_REGIONS } from "@/lib/chile-data";

function PublicRequestContent({ params }: { params: { id: string } }) {
  const clientId = params.id;
  const searchParams = useSearchParams();
  const companyId = searchParams.get('c');
  const { toast } = useToast();
  const storage = useStorage();
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [client, setClient] = useState<Client | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [history, setHistory] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState("");

  // Form State
  const [emailInput, setEmailInput] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [description, setDescription] = useState("");
  const [requestedByName, setRequestedByName] = useState("");
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Address State
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [commune, setCommune] = useState("");
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [locationComment, setLocationComment] = useState("");

  const selectedRegion = useMemo(() => CHILE_REGIONS.find(r => r.name === region), [region]);

  useEffect(() => {
    async function loadData() {
      if (!companyId || !firestore) { setLoading(false); return; }
      try {
        const companyDoc = await getDoc(doc(firestore, "companies", companyId));
        if (companyDoc.exists()) {
          setCompany({ ...companyDoc.data() as Company, id: companyId });
          const clientDoc = await getDoc(doc(firestore, "companies", companyId, "clients", clientId));
          if (clientDoc.exists()) {
            const d = clientDoc.data() as Client;
            setClient(d);
            setRequestedByName(d.contactName || "");
            setRegion(d.region || "");
            setCity(d.city || "");
            setCommune(d.commune || "");
            setStreet(d.street || "");
            setStreetNumber(d.streetNumber || "");
            setComplement(d.complement || "");
          }
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    loadData();
  }, [firestore, clientId, companyId]);

  const loadHistory = async () => {
    if (!companyId || !clientId || !firestore) return;
    setIsHistoryLoading(true);
    try {
      const q = query(collection(firestore, "companies", companyId, "workOrders"), where("clientId", "==", clientId), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setHistory(snap.docs.map(d => ({ ...d.data(), id: d.id } as WorkOrder)));
    } catch (e) { console.error(e); } finally { setIsHistoryLoading(false); }
  };

  const handleVerifyEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.toLowerCase().trim() === client?.contactEmail?.toLowerCase().trim()) {
      setIsVerified(true);
      toast({ title: "Identidad Confirmada" });
      loadHistory();
    } else {
      toast({ title: "Email no coincide", description: "Use el correo registrado.", variant: "destructive" });
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !clientId || !description.trim() || !region || !city || !commune || !streetNumber || !firestore) return;

    setIsSubmitting(true);
    try {
      const shortId = `OT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const fullAddress = `${street} ${streetNumber}${complement ? ', ' + complement : ''}, ${commune}, ${city}, ${region}`;
      const pin = Math.floor(100000 + Math.random() * 900000).toString();

      await setDoc(doc(firestore, "companies", companyId, "workOrders", shortId), {
        id: shortId, companyId, clientId, description: description.trim(),
        serviceLocation: fullAddress, region, city, commune, street, streetNumber, complement, locationComment,
        requestedByName: requestedByName.trim(), status: "solicitada", source: "external",
        requestedByEmail: emailInput, urgency, checklist: [], evidenceUrls, approvalPin: pin,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });

      setGeneratedTicket(shortId);
      setSuccess(true);
      toast({ title: "Solicitud Recibida" });
      loadHistory();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId || !storage) return;
    setIsUploading(true);
    try {
      const sRef = ref(storage, `companies/${companyId}/public_requests/temp_${Date.now()}`);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      setEvidenceUrls(prev => [...prev, url]);
    } catch (e: any) { toast({ title: "Error al subir foto", variant: "destructive" }); } finally { setIsUploading(false); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!client || !company) return <div className="p-10 text-center">Acceso no válido.</div>;

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-10 text-center rounded-[3rem] shadow-2xl border-none">
          <div className="bg-emerald-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8"><CheckCircle2 className="h-12 w-12 text-emerald-600" /></div>
          <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter uppercase italic">¡Solicitud Exitosa!</h2>
          <div className="bg-slate-900 text-white p-8 rounded-[2rem] mb-10"><p className="text-[10px] font-black uppercase text-blue-400 mb-2">Número de Ticket</p><p className="text-4xl font-black italic tracking-widest">{generatedTicket}</p></div>
          <Button className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black uppercase" onClick={() => setSuccess(false)}>Volver al Dashboard</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <div className="bg-slate-900 text-white p-8 pt-12 rounded-b-[3.5rem] shadow-2xl relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <Badge className="bg-white/10 text-white border-white/20 uppercase font-black text-[9px]">Portal de Autogestión</Badge>
            <h1 className="text-3xl font-black uppercase italic">{company.name}</h1>
            <p className="text-slate-400 font-bold text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-blue-400" /> Cliente: {client.name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-10">
        {!isVerified ? (
          <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden">
            <CardHeader className="p-10 text-center"><Mail className="h-10 w-10 text-blue-600 mx-auto mb-4" /><CardTitle className="text-2xl font-black uppercase italic">Verificación Corporativa</CardTitle></CardHeader>
            <CardContent className="p-10 pt-0">
              <form onSubmit={handleVerifyEmail} className="space-y-6">
                <Input type="email" placeholder="Email registrado..." className="h-14 rounded-2xl border-2 font-bold" value={emailInput} onChange={e => setEmailInput(e.target.value)} required />
                <Button type="submit" className="w-full h-16 rounded-2xl bg-blue-600 text-white font-black uppercase shadow-xl shadow-blue-200">Entrar al Portal <ArrowRight className="h-5 w-5 ml-2" /></Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="request" className="space-y-8">
            <TabsList className="bg-white p-1 rounded-2xl h-14 border shadow-sm w-full grid grid-cols-2">
              <TabsTrigger value="request" className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2"><ClipboardPlus className="h-4 w-4" /> Solicitar Servicio</TabsTrigger>
              <TabsTrigger value="history" className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2"><History className="h-4 w-4" /> Mi Dashboard</TabsTrigger>
            </TabsList>

            <TabsContent value="request">
              <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 border-b p-10"><CardTitle className="text-2xl font-black uppercase italic">Reportar Incidencia</CardTitle></CardHeader>
                <CardContent className="p-10 space-y-8">
                  <form onSubmit={handleCreateRequest} className="space-y-8">
                    <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border-2 border-slate-100">
                      <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2"><Globe className="h-4 w-4" /> Confirmar Ubicación del Servicio</p>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2"><Label className="text-[9px] font-black uppercase text-slate-400">Región *</Label><Select value={region} onValueChange={v => { setRegion(v); setCity(""); setCommune(""); }}><SelectTrigger className="h-12 border-2 rounded-xl bg-white"><SelectValue placeholder="Región" /></SelectTrigger><SelectContent>{CHILE_REGIONS.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-2"><Label className="text-[9px] font-black uppercase text-slate-400">Ciudad *</Label><Select key={`city-${region}`} value={city} onValueChange={v => { setCity(v); setCommune(""); }} disabled={!region}><SelectTrigger className="h-12 border-2 rounded-xl bg-white"><SelectValue placeholder="Ciudad" /></SelectTrigger><SelectContent>{selectedRegion?.cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-2"><Label className="text-[9px] font-black uppercase text-slate-400">Comuna *</Label><Select key={`commune-${city}`} value={commune} onValueChange={setCommune} disabled={!city}><SelectTrigger className="h-12 border-2 rounded-xl bg-white"><SelectValue placeholder="Comuna" /></SelectTrigger><SelectContent>{selectedRegion?.communes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-2"><Label className="text-[9px] font-black uppercase text-slate-400">Calle *</Label><Input value={street} onChange={e => setStreet(e.target.value)} className="h-12 border-2 rounded-xl bg-white" required /></div>
                        <div className="space-y-2"><Label className="text-[9px] font-black uppercase text-slate-400">N° *</Label><Input value={streetNumber} onChange={e => setStreetNumber(e.target.value)} className="h-12 border-2 rounded-xl bg-white" required /></div>
                      </div>
                      <div className="space-y-2"><Label className="text-[9px] font-black uppercase text-slate-400">¿Dónde exactamente? (Recepción, Piso...)</Label><Input value={locationComment} onChange={e => setLocationComment(e.target.value)} placeholder="Ej: Sala de reuniones piso 4" className="h-12 border-2 rounded-xl bg-white" /></div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Descripción del Problema *</Label>
                      <Textarea placeholder="Detalle qué sucede..." className="min-h-[150px] rounded-2xl border-2 p-4 text-sm bg-slate-50/50 shadow-inner" value={description} onChange={e => setDescription(e.target.value)} required />
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Urgencia Operativa</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {['low', 'medium', 'high'].map((p) => (
                          <button key={p} type="button" onClick={() => setUrgency(p as any)} className={cn("h-12 rounded-xl border-2 font-black text-[10px] uppercase transition-all", urgency === p ? "bg-slate-900 text-white" : "bg-white text-slate-400")}>{p === 'low' ? 'Baja' : p === 'medium' ? 'Media' : 'Urgente'}</button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2"><Camera className="h-4 w-4" /> Evidencia Fotográfica (Max 3)</Label>
                      <div className="grid grid-cols-3 gap-4">
                        {evidenceUrls.map((url, i) => (
                          <div key={i} className="group relative aspect-video rounded-2xl overflow-hidden border-2"><FirebaseImage url={url} className="w-full h-full object-cover" /><button type="button" className="absolute top-2 right-2 bg-rose-600 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100" onClick={() => setEvidenceUrls(prev => prev.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></button></div>
                        ))}
                        {evidenceUrls.length < 3 && (
                          <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 text-slate-400 bg-white"><Camera className="h-6 w-6" /><span className="text-[8px] font-black uppercase">Subir Foto</span></button>
                        )}
                        <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleUploadPhoto} />
                      </div>
                    </div>

                    <Button type="submit" disabled={isSubmitting || !description.trim()} className="w-full h-20 rounded-[2rem] bg-slate-900 text-white font-black text-xl uppercase tracking-widest shadow-2xl">
                      {isSubmitting ? <Loader2 className="animate-spin h-8 w-8" /> : "Enviar Solicitud"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
                <CardHeader className="bg-slate-50 border-b p-8 flex flex-row items-center justify-between">
                  <div><CardTitle className="text-xl font-black uppercase italic">Historial de Servicios</CardTitle></div>
                  <Button variant="ghost" size="icon" onClick={loadHistory} disabled={isHistoryLoading} className="rounded-xl h-12 w-12 bg-white border shadow-sm">{isHistoryLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <History className="h-5 w-5" />}</Button>
                </CardHeader>
                <CardContent className="p-0">
                  {history.length === 0 ? <div className="py-20 text-center opacity-40 italic">Sin historial.</div> : (
                    <div className="divide-y">
                      {history.map((ot) => (
                        <div key={ot.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between">
                          <div className="flex-1 min-w-0 mr-4">
                            <div className="flex items-center gap-3 mb-2"><span className="text-sm font-black text-primary italic">{ot.id}</span><Badge className={cn("text-[8px] font-black uppercase", ot.status === 'aprobada' ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700")}>{ot.status}</Badge></div>
                            <p className="text-sm font-bold text-slate-900 truncate mb-1">{ot.description}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{ot.street} {ot.streetNumber} - {ot.commune}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

export default function PublicRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <PublicRequestContent params={resolvedParams} />
    </Suspense>
  );
}
