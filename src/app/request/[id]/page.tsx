
"use client";

import { use, useState, useEffect, Suspense, useRef } from "react";
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
  Download
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

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast({
        title: "Instalación manual requerida",
        description: "Usa el icono en la barra de direcciones de tu navegador.",
      });
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Form State
  const [emailInput, setEmailInput] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [description, setDescription] = useState("");
  const [serviceLocation, setServiceLocation] = useState("");
  const [requestedByName, setRequestedByName] = useState("");
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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
          const clientDoc = await getDoc(doc(firestore, "companies", companyId, "clients", clientId));
          if (clientDoc.exists()) {
            const clientData = { ...clientDoc.data() as Client, id: clientId };
            setClient(clientData);
            setServiceLocation(clientData.address || "");
            setRequestedByName(clientData.contactName || "");
          }
        }
      } catch (e) {
        console.error("Error cargando portal:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [firestore, clientId, companyId]);

  const loadHistory = async () => {
    if (!companyId || !clientId || !firestore) return;
    setIsHistoryLoading(true);
    try {
      const q = query(
        collection(firestore, "companies", companyId, "workOrders"),
        where("clientId", "==", clientId),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ ...d.data(), id: d.id } as WorkOrder));
      setHistory(docs);
    } catch (e) {
      console.error("Error cargando historial:", e);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleVerifyEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.toLowerCase().trim() === client?.contactEmail?.toLowerCase().trim()) {
      setIsVerified(true);
      toast({ title: "Identidad Confirmada", description: "Acceso al portal de autogestión habilitado." });
      loadHistory();
    } else {
      toast({ title: "Email no coincide", description: "Ingrese el correo corporativo registrado en su ficha de cliente.", variant: "destructive" });
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId || !storage) return;

    setIsUploading(true);
    try {
      const path = `companies/${companyId}/public_requests/temp_${Date.now()}_${file.name}`;
      const sRef = ref(storage, path);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      setEvidenceUrls(prev => [...prev, url]);
      toast({ title: "Foto adjuntada" });
    } catch (e: any) {
      toast({ title: "Error al subir foto", description: e.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !clientId || !description.trim() || !firestore) return;

    setIsSubmitting(true);
    try {
      const shortId = `OT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const docRef = doc(firestore, "companies", companyId, "workOrders", shortId);
      const pin = Math.floor(100000 + Math.random() * 900000).toString();

      await setDoc(docRef, {
        id: shortId,
        companyId,
        clientId,
        description: description.trim(),
        serviceLocation: serviceLocation.trim(),
        requestedByName: requestedByName.trim(),
        status: "solicitada",
        source: "external",
        requestedByEmail: emailInput,
        urgency,
        checklist: [],
        evidenceUrls: evidenceUrls,
        approvalPin: pin,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setGeneratedTicket(shortId);
      setSuccess(true);
      toast({ title: "Solicitud Recibida", description: `Ticket #${shortId} generado.` });
      loadHistory();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!client || !company) return <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center"><Card className="p-10 rounded-3xl border-dashed">Portal no válido o empresa inactiva.</Card></div>;

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-10 text-center rounded-[3rem] shadow-2xl border-none animate-in zoom-in-95 duration-500">
          <div className="bg-emerald-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter uppercase italic">¡Solicitud Exitosa!</h2>
          <p className="text-slate-500 font-bold mb-8">Su requerimiento ha sido ingresado al sistema.</p>
          
          <div className="bg-slate-900 text-white p-8 rounded-[2rem] mb-10 space-y-2 relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-10"><Hash className="h-20 w-20" /></div>
            <p className="text-[10px] font-black uppercase text-blue-400 tracking-[0.3em]">Número de Ticket</p>
            <p className="text-4xl font-black italic tracking-widest">{generatedTicket}</p>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-10 px-4">
            Utilice este número para consultas telefónicas. Un técnico será asignado a la brevedad según la prioridad indicada.
          </p>

          <Button 
            className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest shadow-xl" 
            onClick={() => { setSuccess(false); setEvidenceUrls([]); setDescription(""); }}
          >
            Volver al Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* HEADER INSTITUCIONAL */}
      <div className="bg-slate-900 text-white p-8 pt-12 rounded-b-[3.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10"><Building2 className="h-40 w-40" /></div>
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <Badge className="bg-white/10 text-white mb-2 backdrop-blur-md border-white/20 uppercase tracking-[0.2em] font-black text-[9px]">Portal de Autogestión Estratégica</Badge>
            <h1 className="text-3xl font-black tracking-tight mb-1 uppercase leading-none italic">{company.name}</h1>
            <p className="text-slate-400 font-bold text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-400" /> Cliente: {client.name}
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-white/5 border-white/10 text-white rounded-2xl h-14 px-6 gap-3 hover:bg-white/10">
                <Monitor className="h-6 w-6 text-blue-400" />
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none">Instalar Acceso</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase">PC o Celular</p>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase text-primary">Portal en tu Escritorio</DialogTitle>
                <DialogDescription className="font-bold text-slate-500">Agrega un acceso directo para reportar fallas en segundos.</DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="pc" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 h-12 bg-slate-100 p-1 rounded-xl">
                  <TabsTrigger value="pc" className="rounded-lg font-black uppercase text-[10px] tracking-widest gap-2">
                    <Monitor className="h-3 w-3" /> Computador
                  </TabsTrigger>
                  <TabsTrigger value="mobile" className="rounded-lg font-black uppercase text-[10px] tracking-widest gap-2">
                    <Smartphone className="h-3 w-3" /> Celular
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="pc" className="space-y-6 animate-in fade-in slide-in-from-left-2">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg text-blue-600 font-bold text-xs uppercase">CHROME / EDGE</div>
                      <p className="text-sm font-bold text-slate-700">En tu navegador:</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed space-y-4">
                      <div className="flex items-start gap-4 text-xs">
                        <div className="h-8 w-8 bg-white border rounded-lg flex items-center justify-center shadow-sm shrink-0"><Download className="h-4 w-4 text-blue-600" /></div>
                        <div className="space-y-1 flex-1">
                          <p className="font-black text-slate-900 uppercase tracking-tight">1. Inicia la instalación asistida</p>
                          <p className="text-slate-500 mb-3">Pulsa el botón de abajo para que el navegador te pida permiso de instalación.</p>
                          <Button 
                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl"
                            onClick={handleInstallClick}
                          >
                            Instalar en este equipo
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 text-xs pt-4 border-t border-slate-200">
                        <div className="h-8 w-8 bg-white border rounded-lg flex items-center justify-center shadow-sm shrink-0"><Check className="h-4 w-4 text-emerald-600" /></div>
                        <div className="space-y-1">
                          <p className="font-black text-slate-900 uppercase tracking-tight">2. Confirma la ventana emergente</p>
                          <p className="text-slate-500">Pulsa "Instalar" en el aviso de tu navegador y la App se creará en tu escritorio automáticamente.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="mobile" className="space-y-6 animate-in fade-in slide-in-from-right-2">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3"><div className="bg-blue-100 p-2 rounded-lg text-blue-600 font-bold text-xs uppercase">iPhone</div><p className="text-sm font-bold text-slate-700">En Safari:</p></div>
                    <div className="bg-slate-50 p-4 rounded-2xl border space-y-3">
                      <div className="flex items-center gap-3 text-xs"><div className="h-6 w-6 bg-white border rounded-md flex items-center justify-center shadow-sm"><Share className="h-3 w-3 text-slate-400" /></div><span>1. Pulsa el botón <strong>"Compartir"</strong>.</span></div>
                      <div className="flex items-center gap-3 text-xs"><div className="h-6 w-6 bg-white border rounded-md flex items-center justify-center shadow-sm"><PlusSquare className="h-3 w-3 text-slate-400" /></div><span>2. Selecciona <strong>"Agregar a Inicio"</strong>.</span></div>
                    </div>
                  </div>
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-3"><div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 font-bold text-xs uppercase">Android</div><p className="text-sm font-bold text-slate-700">En Chrome:</p></div>
                    <div className="bg-slate-50 p-4 rounded-2xl border space-y-3">
                      <div className="flex items-center gap-3 text-xs"><div className="h-6 w-6 bg-white border rounded-md flex items-center justify-center shadow-sm font-black text-slate-400">⋮</div><span>1. Pulsa los <strong>tres puntos</strong> arriba a la derecha.</span></div>
                      <div className="flex items-center gap-3 text-xs"><div className="h-6 w-6 bg-white border rounded-md flex items-center justify-center shadow-sm"><Smartphone className="h-3 w-3 text-slate-400" /></div><span>2. Selecciona <strong>"Instalar aplicación"</strong>.</span></div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-10">
        {!isVerified ? (
          <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
            <CardHeader className="p-10 text-center">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Mail className="h-10 w-10 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-black uppercase tracking-tighter italic">Verificación Corporativa</CardTitle>
              <CardDescription className="text-slate-500 font-medium">Ingrese el correo registrado por su proveedor para acceder a su Dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-0">
              <form onSubmit={handleVerifyEmail} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Registrado</Label>
                  <Input 
                    type="email" 
                    placeholder="nombre@empresa.cl" 
                    className="h-14 rounded-2xl border-2 focus:border-blue-500 text-lg font-bold"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg uppercase tracking-widest gap-2 shadow-xl shadow-blue-200">
                  Entrar al Portal <ArrowRight className="h-5 w-5" />
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="request" className="space-y-8">
            <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-[2rem] border shadow-sm flex sticky top-4 z-20 overflow-x-auto">
              <TabsList className="bg-transparent h-14 w-full grid grid-cols-2">
                <TabsTrigger value="request" className="rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white gap-2">
                  <ClipboardPlus className="h-4 w-4" /> Solicitar Servicio
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-2xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white gap-2">
                  <History className="h-4 w-4" /> Mi Dashboard
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="request" className="animate-in fade-in duration-500">
              <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 border-b p-10">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-2xl text-primary"><ClipboardPlus className="h-8 w-8" /></div>
                    <div>
                      <CardTitle className="text-2xl font-black uppercase tracking-tighter italic">Reportar Incidencia</CardTitle>
                      <CardDescription className="text-base font-medium">Digitalice su requerimiento para una respuesta inmediata.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-10 space-y-8">
                  <form onSubmit={handleCreateRequest} className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2"><MapPin className="h-3 w-3" /> Punto de Falla</Label>
                        <Input placeholder="Dirección o Sala Técnica" className="h-12 rounded-xl border-2 font-medium bg-white" value={serviceLocation} onChange={(e) => setServiceLocation(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2"><User className="h-3 w-3" /> Responsable en Sitio</Label>
                        <Input placeholder="Nombre de contacto" className="h-12 rounded-xl border-2 font-medium bg-white" value={requestedByName} onChange={(e) => setRequestedByName(e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Descripción del Problema</Label>
                      <Textarea 
                        placeholder="Detalle el síntoma o equipo afectado para agilizar el diagnóstico..." 
                        className="min-h-[180px] rounded-[2rem] border-2 p-6 text-lg font-medium italic bg-slate-50/50 shadow-inner"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Prioridad Operativa</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'low', label: 'BAJA', color: 'bg-slate-100 text-slate-600 border-slate-200' },
                          { id: 'medium', label: 'NORMAL', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                          { id: 'high', label: 'URGENTE', color: 'bg-rose-100 text-rose-700 border-rose-200' },
                        ].map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setUrgency(p.id as any)}
                            className={cn(
                              "h-14 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all",
                              urgency === p.id ? p.color : "bg-white border-slate-100 text-slate-400 opacity-50 grayscale"
                            )}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2"><Camera className="h-4 w-4" /> Evidencia Fotográfica (Max 3)</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {evidenceUrls.map((url, i) => (
                          <div key={i} className="group relative aspect-video rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50 shadow-sm">
                            <FirebaseImage url={url} className="w-full h-full object-cover" />
                            <button type="button" className="absolute top-2 right-2 bg-rose-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setEvidenceUrls(prev => prev.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></button>
                          </div>
                        ))}
                        {evidenceUrls.length < 3 && (
                          <>
                            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 text-slate-400 hover:bg-slate-50 transition-colors bg-white">
                              {isUploading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <><Camera className="h-6 w-6" /><span className="text-[9px] font-black uppercase tracking-widest">Añadir Foto</span></>}
                            </button>
                            <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleUploadPhoto} />
                          </>
                        )}
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isSubmitting || !description.trim()} 
                      className="w-full h-20 rounded-[2rem] bg-slate-900 text-white font-black text-xl uppercase tracking-widest shadow-2xl gap-3 active:scale-95 transition-all"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin h-8 w-8" /> : "Enviar Solicitud de Servicio"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="animate-in slide-in-from-right-4 duration-500">
              <div className="grid gap-6">
                {/* RESUMEN DE ESTADOS */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="rounded-[2rem] border-none shadow-sm bg-blue-600 text-white p-6 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-10"><Zap className="h-16 w-16" /></div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Activas</p>
                    <p className="text-3xl font-black italic">{history.filter(ot => ot.status !== 'aprobada' && ot.status !== 'rechazada').length}</p>
                  </Card>
                  <Card className="rounded-[2rem] border-none shadow-sm bg-emerald-600 text-white p-6 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-10"><CheckCircle2 className="h-16 w-16" /></div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Finalizadas</p>
                    <p className="text-3xl font-black italic">{history.filter(ot => ot.status === 'aprobada').length}</p>
                  </Card>
                  <Card className="rounded-[2rem] border-none shadow-sm bg-slate-900 text-white p-6 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-10"><Smartphone className="h-16 w-16" /></div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Total</p>
                    <p className="text-3xl font-black italic">{history.length}</p>
                  </Card>
                </div>

                <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
                  <CardHeader className="bg-slate-50 border-b p-8 flex flex-row items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-black uppercase tracking-tighter italic">Seguimiento de Servicios</CardTitle>
                      <CardDescription className="text-xs font-bold uppercase">Estado actual de sus requerimientos técnicos</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={loadHistory} disabled={isHistoryLoading} className="rounded-xl h-12 w-12 bg-white border shadow-sm">
                      {isHistoryLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <History className="h-5 w-5" />}
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    {history.length === 0 ? (
                      <div className="py-20 text-center opacity-40">
                        <History className="h-12 w-12 mx-auto mb-4" />
                        <p className="font-bold uppercase text-[10px] tracking-[0.3em]">Sin historial registrado</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {history.map((ot) => {
                          const date = ot.createdAt?.toDate ? ot.createdAt.toDate() : (typeof ot.createdAt === 'string' ? parseISO(ot.createdAt) : new Date());
                          return (
                            <div key={ot.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                              <div className="flex-1 min-w-0 mr-4">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-sm font-black text-primary italic tracking-tight">{ot.id}</span>
                                  <Badge className={cn(
                                    "text-[8px] font-black uppercase tracking-widest h-5",
                                    ot.status === 'aprobada' ? "bg-emerald-100 text-emerald-700" :
                                    ot.status === 'solicitada' ? "bg-blue-100 text-blue-700" :
                                    ot.status === 'pendiente cliente' ? "bg-indigo-600 text-white animate-pulse" :
                                    "bg-slate-100 text-slate-600"
                                  )}>
                                    {ot.status.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <p className="text-sm font-bold text-slate-900 truncate leading-none mb-2">{ot.description}</p>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                  <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {format(date, "dd/MM/yyyy")}</span>
                                  {ot.serviceLocation && <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {ot.serviceLocation}</span>}
                                </div>
                              </div>
                              <div className="shrink-0 flex items-center gap-3">
                                {ot.status === 'pendiente cliente' && (
                                  <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 rounded-xl h-10 px-4 font-black text-[9px] uppercase tracking-widest gap-2 shadow-lg shadow-indigo-200">
                                    <Link href={`/portal/approve/${ot.id}?c=${companyId}`}>Validar Ahora <ArrowRight className="h-3 w-3" /></Link>
                                  </Button>
                                )}
                                <div className="bg-slate-100 p-2 rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
                                  <ChevronRight className="h-4 w-4" />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* BANNER DE VALOR ESTRATÉGICO */}
                <Card className="rounded-[2rem] border-none shadow-xl bg-blue-50 p-8 flex items-start gap-6 border-2 border-blue-100">
                  <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-200 shrink-0"><CheckCircle2 className="h-8 w-8" /></div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-black italic uppercase tracking-tighter text-blue-900">Historial Inalterable</h4>
                    <p className="text-xs text-blue-800/70 leading-relaxed font-medium">
                      Este dashboard garantiza la trazabilidad total de su servicio. Cada orden cuenta con un historial de bitácora, evidencias fotográficas y firmas digitales, cumpliendo con los más altos estándares de auditoría industrial.
                    </p>
                  </div>
                </Card>
              </div>
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
