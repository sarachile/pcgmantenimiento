
"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  useStorage, 
  updateDocumentNonBlocking 
} from "@/firebase";
import { collection, query, where, doc, arrayUnion, serverTimestamp, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Camera, 
  Search, 
  Loader2, 
  ArrowLeft, 
  CheckCircle2, 
  ChevronRight,
  ListChecks,
  MessageSquare,
  Fingerprint,
  Send,
  AlertTriangle,
  CloudUpload,
  Check,
  Save,
  MapPin,
  Compass,
  ExternalLink,
  QrCode,
  Lock,
  Smartphone
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { WorkOrder, Client } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function FieldCapturePage() {
  const { profile, isLoading: isUserLoading, isTechnician } = useUser();
  const db = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOT, setSelectedOT] = useState<WorkOrder | null>(null);
  const [selectedChecklistItemId, setSelectedChecklistItemId] = useState<string | null>(null);
  const [logComment, setLogComment] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isQrOpen, setIsQrOpen] = useState(false);

  // Captura de ubicación al montar o seleccionar OT
  const getPosition = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.warn("GPS no disponible:", err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    getPosition();
  }, [selectedOT]);

  // Consultar OTs activas (no aprobadas)
  const workOrdersQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return query(
      collection(db, "companies", profile.companyId, "workOrders"),
      where("status", "not-in", ["aprobada"])
    );
  }, [db, profile?.companyId]);

  const { data: workOrders, isLoading: isOrdersLoading } = useCollection<WorkOrder>(workOrdersQuery);

  // Consultar clientes
  const clientsQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return collection(db, "companies", profile.companyId, "clients");
  }, [db, profile?.companyId]);

  const { data: clients } = useCollection<Client>(clientsQuery);

  const filtered = useMemo(() => {
    let list = workOrders || [];
    if (isTechnician && profile) {
      list = list.filter(ot => 
        ot.assignedToStaffIds?.includes(profile.id) || 
        ot.assignedToStaffIds?.includes(profile.staffId || '')
      );
    }
    
    // Filtro final: solo mostrar órdenes que NO estén aprobadas
    const activeList = list.filter(ot => ot.status !== 'aprobada');

    return activeList.filter(ot => {
      const client = clients?.find(c => c.id === ot.clientId);
      return (
        ot.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [workOrders, clients, searchTerm, isTechnician, profile]);

  // AUTO-SELECCIÓN INTELIGENTE (SALTO DE LISTA)
  // Ahora solo considera las OTs que han pasado por el filtro de "no aprobadas"
  useEffect(() => {
    if (!isOrdersLoading && !selectedOT && filtered.length === 1 && searchTerm === "") {
      const timer = setTimeout(() => {
        setSelectedOT(filtered[0]);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [filtered, isOrdersLoading, selectedOT, searchTerm]);

  const openNavigation = (address: string) => {
    const encoded = encodeURIComponent(address);
    const url = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    window.open(url, "_blank");
  };

  const handleManualSave = async () => {
    if (!selectedOT || !db || !profile?.companyId || !profile) return;
    
    setIsSaving(true);
    getPosition();

    if (logComment.trim()) {
      await addDoc(collection(db, "companies", profile.companyId, "workOrders", selectedOT.id, "digitalLogbookEntries"), {
        workOrderId: selectedOT.id,
        companyId: profile.companyId,
        timestamp: serverTimestamp(),
        eventType: 'comment',
        eventDetails: logComment,
        actor: profile.id,
        actorName: profile.name,
        latitude: coords?.lat || null,
        longitude: coords?.lng || null
      });
      setLogComment("");
    }

    toast({
      title: "Avance Guardado",
      description: "Su progreso y ubicación han sido sincronizados.",
    });
    setIsSaving(false);
    router.push('/work-orders');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedOT || !profile?.companyId || !storage || !db || !profile) return;

    setIsUploading(true);
    getPosition();

    try {
      const path = `companies/${profile.companyId}/workOrders/${selectedOT.id}/field_evidence_${Date.now()}`;
      const sRef = ref(storage, path);
      
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);

      const otRef = doc(db, "companies", profile.companyId, "workOrders", selectedOT.id);
      
      if (selectedChecklistItemId) {
        const updatedChecklist = selectedOT.checklist?.map(item => 
          item.id === selectedChecklistItemId 
            ? { ...item, completed: true, completedAt: new Date().toISOString(), evidenceUrl: url, latitude: coords?.lat, longitude: coords?.lng } 
            : item
        );
        updateDocumentNonBlocking(otRef, {
          checklist: updatedChecklist,
          updatedAt: serverTimestamp(),
          status: 'ejecutada' 
        });
      } else {
        updateDocumentNonBlocking(otRef, {
          evidenceUrls: arrayUnion(url),
          updatedAt: serverTimestamp(),
          status: 'ejecutada'
        });
      }

      await addDoc(collection(db, "companies", profile.companyId, "workOrders", selectedOT.id, "digitalLogbookEntries"), {
        workOrderId: selectedOT.id,
        companyId: profile.companyId,
        timestamp: serverTimestamp(),
        eventType: 'action_taken',
        eventDetails: logComment || "Evidencia fotográfica capturada en terreno con GPS.",
        actor: profile.id,
        actorName: profile.name,
        latitude: coords?.lat || null,
        longitude: coords?.lng || null
      });

      toast({ title: "Evidencia Guardada" });
      setSelectedChecklistItemId(null);
      setLogComment("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      
    } catch (error: any) {
      toast({ title: "Error al registrar", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFinalizeWork = async () => {
    if (!selectedOT || !db || !profile?.companyId || !profile) return;
    
    setIsFinalizing(true);
    getPosition();

    try {
      const techCode = `TCH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const otRef = doc(db, "companies", profile.companyId, "workOrders", selectedOT.id);
      
      updateDocumentNonBlocking(otRef, {
        status: 'en revision',
        technicianApprovalName: profile.name,
        technicianApprovalDate: serverTimestamp(),
        technicianApprovalCode: techCode,
        executedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        latitude: coords?.lat || null,
        longitude: coords?.lng || null
      });

      await addDoc(collection(db, "companies", profile.companyId, "workOrders", selectedOT.id, "digitalLogbookEntries"), {
        workOrderId: selectedOT.id,
        companyId: profile.companyId,
        timestamp: serverTimestamp(),
        eventType: 'status_change',
        eventDetails: `Finalizado por ${profile.name} con trazabilidad GPS.`,
        actor: profile.id,
        actorName: profile.name,
        latitude: coords?.lat || null,
        longitude: coords?.lng || null
      });

      toast({ title: "Trabajo Finalizado", description: "Orden enviada a revisión." });
      setSelectedOT(null);
    } catch (error: any) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsFinalizing(false);
    }
  };

  const getApprovalUrl = () => {
    if (!selectedOT || !profile?.companyId) return "";
    return `https://www.pcgmantenimiento.com/portal/approve/${selectedOT.id}?c=${profile.companyId}`;
  };

  const qrImageUrl = useMemo(() => {
    const url = getApprovalUrl();
    if (!url) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
  }, [selectedOT, profile?.companyId]);

  if (isUserLoading || isOrdersLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-32">
      <div className="bg-slate-900 text-white p-6 sticky top-0 z-30 shadow-xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="text-white">
            <Link href="/dashboard"><ArrowLeft className="h-6 w-6" /></Link>
          </Button>
          <h1 className="text-xl font-black uppercase tracking-tighter italic">Captura de Terreno</h1>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-6">
        {!selectedOT ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                placeholder="Buscar OT o Cliente..." 
                className="h-14 pl-12 rounded-2xl border-none shadow-md bg-white text-lg font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">
                {isTechnician ? "Mis Órdenes Activas" : "Órdenes de Trabajo Disponibles"}
              </p>
              {filtered.length === 0 ? (
                <div className="p-10 text-center text-slate-400 italic bg-white rounded-3xl border-2 border-dashed">
                  No hay órdenes con actividades pendientes.
                </div>
              ) : (
                filtered.map(ot => {
                  const client = clients?.find(c => c.id === ot.clientId);
                  return (
                    <button 
                      key={ot.id}
                      onClick={() => setSelectedOT(ot)}
                      className="w-full text-left bg-white p-5 rounded-3xl shadow-sm border border-transparent active:border-primary active:scale-95 transition-all flex items-center justify-between group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-primary font-black text-lg italic tracking-tight">{ot.id}</span>
                          <Badge variant="outline" className="text-[8px] font-black uppercase px-1.5 h-4">{ot.status}</Badge>
                        </div>
                        <p className="text-slate-900 font-bold text-sm truncate">{client?.name || 'Cliente...'}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{ot.serviceLocation || client?.address}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-300" />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in zoom-in-95 duration-300 max-w-xl mx-auto">
            <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden">
              <CardHeader className="bg-slate-900 text-white p-8">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-3xl font-black italic tracking-tighter truncate">{selectedOT.id}</CardTitle>
                    <CardDescription className="text-slate-400 font-bold uppercase tracking-widest mt-1 truncate">
                      {clients?.find(c => c.id === selectedOT.clientId)?.name}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" className="text-white/50 hover:text-white" onClick={() => setSelectedOT(null)}>Cambiar</Button>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                
                <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Compass className="h-5 w-5 text-blue-600" />
                      <span className="text-[10px] font-black uppercase text-blue-900 tracking-widest">Navegación</span>
                    </div>
                    {coords && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[8px] font-black">GPS ACTIVO</Badge>}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest gap-2"
                    onClick={() => openNavigation(selectedOT.serviceLocation || clients?.find(c => c.id === selectedOT.clientId)?.address || "")}
                  >
                    Abrir en Google Maps
                  </Button>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-primary" /> Protocolos de Servicio
                  </Label>
                  <div className="space-y-2">
                    {selectedOT.checklist?.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedChecklistItemId(selectedChecklistItemId === item.id ? null : item.id)}
                        className={cn(
                          "w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between",
                          selectedChecklistItemId === item.id ? "border-primary bg-primary/5" : 
                          item.completed ? "border-emerald-100 bg-emerald-50/30" : "border-slate-100 bg-slate-50/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {item.completed && <div className="bg-emerald-500 rounded-full p-1"><Check className="h-3 w-3 text-white" /></div>}
                          <span className={cn("text-xs font-bold", item.completed ? "text-emerald-700" : "text-slate-700")}>{item.task}</span>
                        </div>
                        {selectedChecklistItemId === item.id ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <ChevronRight className="h-3 w-3 text-slate-300" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-500" /> Nota de Bitácora
                  </Label>
                  <Textarea 
                    placeholder={selectedChecklistItemId ? "Añade una nota para esta tarea..." : "Detalles del hallazgo..."} 
                    className="rounded-2xl min-h-[80px] border-2 bg-slate-50/50 text-sm"
                    value={logComment}
                    onChange={(e) => setLogComment(e.target.value)}
                  />
                  
                  <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                  <Button 
                    className={cn(
                      "w-full h-24 rounded-3xl shadow-xl flex flex-col gap-2 transition-all",
                      selectedChecklistItemId ? "bg-primary text-white" : "bg-slate-100 text-slate-600 border-2 border-dashed border-slate-300"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? <Loader2 className="animate-spin" /> : (
                      <>
                        <Camera className="h-8 w-8" />
                        <span className="text-sm font-black uppercase italic">
                          {selectedChecklistItemId ? "Subir Foto con GPS" : "Evidencia General con GPS"}
                        </span>
                      </>
                    )}
                  </Button>
                </div>

                <div className="pt-8 border-t-2 border-dashed space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline"
                      className="h-16 rounded-2xl border-2 border-slate-200 font-black uppercase text-[10px] tracking-widest gap-2 bg-white"
                      onClick={handleManualSave}
                      disabled={isSaving || isUploading || isFinalizing}
                    >
                      {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <><Save className="h-4 w-4" /> Guardar Avance</>}
                    </Button>

                    <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline"
                          className="h-16 rounded-2xl border-2 border-indigo-200 text-indigo-700 font-black uppercase text-[10px] tracking-widest gap-2 bg-indigo-50"
                        >
                          <QrCode className="h-4 w-4" /> Validación QR
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px] rounded-[3rem]">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-center">Aprobación Digital</DialogTitle>
                          <DialogDescription className="text-center font-bold">El cliente debe escanear para validar.</DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col items-center justify-center p-6 space-y-8">
                          <div className="bg-white p-4 rounded-3xl shadow-2xl border-2 border-slate-50 relative overflow-hidden">
                            <img src={qrImageUrl} alt="QR de Aprobación" className="w-64 h-64" />
                          </div>
                          <div className="w-full space-y-4">
                            <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-2 text-center relative overflow-hidden">
                              <p className="text-[10px] font-black uppercase text-blue-400 tracking-[0.3em]">PIN de Verificación</p>
                              <p className="text-4xl font-black italic tracking-[0.5em]">{selectedOT.approvalPin || '------'}</p>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Button 
                    className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest gap-2 shadow-2xl"
                    onClick={handleFinalizeWork}
                    disabled={isFinalizing || isUploading || isSaving}
                  >
                    {isFinalizing ? <Loader2 className="animate-spin h-4 w-4" /> : <><Send className="h-4 w-4" /> Finalizar y Enviar</>}
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
