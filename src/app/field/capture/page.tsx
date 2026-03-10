"use client";

import { useState, useRef, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { 
  Camera, 
  Search, 
  Loader2, 
  ArrowLeft, 
  CheckCircle2, 
  ChevronRight,
  ListChecks,
  MapPin,
  Check,
  Send,
  Plus,
  Zap,
  Info,
  Smartphone,
  ArrowRight,
  PlusCircle,
  AlertTriangle,
  Save,
  ClipboardList,
  Circle,
  Images,
  QrCode,
  UserCheck,
  Navigation,
  ShieldCheck
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { WorkOrder, Client } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FirebaseImage } from "@/components/FirebaseImage";

function FieldCaptureContent() {
  const { profile, isLoading: isUserLoading, isTechnician } = useUser();
  const db = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOTId, setSelectedOTId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  
  // UI States para Cierre
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Cargar OT desde URL si existe
  useEffect(() => {
    const otFromUrl = searchParams.get('otId');
    if (otFromUrl) {
      setSelectedOTId(otFromUrl);
    }
  }, [searchParams]);

  const getPosition = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.warn("GPS no disponible:", err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const workOrdersQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return query(
      collection(db, "companies", profile.companyId, "workOrders"),
      where("status", "not-in", ["aprobada"])
    );
  }, [db, profile?.companyId]);

  const { data: workOrders, isLoading: isOrdersLoading } = useCollection<WorkOrder>(workOrdersQuery);

  const clientsQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return collection(db, "companies", profile.companyId, "clients");
  }, [db, profile?.companyId]);

  const { data: clients } = useCollection<Client>(clientsQuery);

  const selectedOT = useMemo(() => {
    if (!selectedOTId || !workOrders) return null;
    return workOrders.find(ot => ot.id === selectedOTId) || null;
  }, [workOrders, selectedOTId]);

  const filtered = useMemo(() => {
    let list = (workOrders || []).filter(ot => ot.status !== 'aprobada' && !ot.isDeleted);
    if (isTechnician && profile) {
      list = list.filter(ot => 
        ot.assignedToStaffIds?.includes(profile.id) || 
        ot.assignedToStaffIds?.includes(profile.staffId || '')
      );
    }
    
    return list.filter(ot => {
      const client = clients?.find(c => c.id === ot.clientId);
      return (
        ot.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [workOrders, clients, searchTerm, isTechnician, profile]);

  useEffect(() => {
    getPosition();
  }, [selectedOTId]);

  const isChecklistComplete = useMemo(() => {
    if (!selectedOT || !selectedOT.checklist) return false;
    if (selectedOT.checklist.length === 0) return true;
    return selectedOT.checklist.every(item => item.completed === true);
  }, [selectedOT]);

  const hasPhotos = useMemo(() => {
    if (!selectedOT) return false;
    const itemPhotos = selectedOT.checklist?.some(i => (i.evidenceUrls?.length || 0) > 0) || false;
    const generalPhotos = (selectedOT.evidenceUrls?.length || 0) > 0;
    return itemPhotos || generalPhotos;
  }, [selectedOT]);

  const handleTaskClick = (taskId: string) => {
    setActiveTaskId(taskId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleToggleTask = async (taskId: string, currentState: boolean) => {
    if (!selectedOT || !db || !profile?.companyId || !profile) return;

    const otRef = doc(db, "companies", profile.companyId, "workOrders", selectedOT.id);
    const updatedChecklist = selectedOT.checklist?.map(item => {
      if (item.id === taskId) {
        return { 
          ...item, 
          completed: !currentState,
          completedAt: !currentState ? new Date().toISOString() : null 
        };
      }
      return item;
    });

    updateDocumentNonBlocking(otRef, {
      checklist: updatedChecklist,
      updatedAt: serverTimestamp(),
      status: 'en proceso'
    });

    if (!currentState) {
      await addDoc(collection(db, "companies", profile.companyId, "workOrders", selectedOT.id, "digitalLogbookEntries"), {
        workOrderId: selectedOT.id,
        companyId: profile.companyId,
        timestamp: serverTimestamp(),
        eventType: 'action_taken',
        eventDetails: `Tarea marcada como OK: ${selectedOT.checklist?.find(i => i.id === taskId)?.task}`,
        actor: profile.id,
        actorName: profile.name
      });
    }
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
      
      const updateData: any = {
        updatedAt: serverTimestamp(),
        status: 'en proceso'
      };

      if (activeTaskId) {
        updateData.checklist = selectedOT.checklist?.map(item => {
          if (item.id === activeTaskId) {
            const currentUrls = item.evidenceUrls || (item.evidenceUrl ? [item.evidenceUrl] : []);
            return { 
              ...item, 
              completed: true, 
              completedAt: new Date().toISOString(), 
              evidenceUrls: [...currentUrls, url],
              latitude: coords?.lat || null, 
              longitude: coords?.lng || null 
            };
          }
          return item;
        });
      } else {
        updateData.evidenceUrls = arrayUnion(url);
      }

      updateDocumentNonBlocking(otRef, updateData);

      await addDoc(collection(db, "companies", profile.companyId, "workOrders", selectedOT.id, "digitalLogbookEntries"), {
        workOrderId: selectedOT.id,
        companyId: profile.companyId,
        timestamp: serverTimestamp(),
        eventType: 'action_taken',
        eventDetails: activeTaskId 
          ? `Foto adjunta a protocolo: ${selectedOT.checklist?.find(i => i.id === activeTaskId)?.task}` 
          : "Evidencia fotográfica general capturada.",
        actor: profile.id,
        actorName: profile.name,
        latitude: coords?.lat || null,
        longitude: coords?.lng || null
      });

      toast({ title: "Evidencia Guardada ✓" });
      setActiveTaskId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
    } catch (error: any) {
      toast({ title: "Error al subir", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  // FLUJO 1: CIERRE CON SELLO TÉCNICO (CLIENTE NO PRESENTE)
  const handleInternalClose = async () => {
    if (!selectedOT || !db || !profile?.companyId || !profile) return;
    
    if (!hasPhotos) {
      toast({ 
        title: "Evidencia Requerida", 
        description: "Para cerrar sin firma del cliente, debe registrar al menos una fotografía de respaldo.", 
        variant: "destructive" 
      });
      return;
    }

    setIsSubmittingAction(true);
    getPosition();

    try {
      const techCode = `TEC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const otRef = doc(db, "companies", profile.companyId, "workOrders", selectedOT.id);
      
      updateDocumentNonBlocking(otRef, {
        status: 'aprobada',
        executedAt: serverTimestamp(),
        technicianApprovalName: profile.name,
        technicianApprovalDate: serverTimestamp(),
        technicianApprovalCode: techCode,
        latitude: coords?.lat || null,
        longitude: coords?.lng || null,
        updatedAt: serverTimestamp()
      });
      
      await addDoc(collection(db, "companies", profile.companyId, "workOrders", selectedOT.id, "digitalLogbookEntries"), {
        workOrderId: selectedOT.id,
        companyId: profile.companyId,
        timestamp: serverTimestamp(),
        eventType: 'status_change',
        eventDetails: `Orden cerrada mediante Sello Técnico (Cliente Ausente). Georreferencia registrada en cierre técnico.`,
        actor: profile.id,
        actorName: profile.name,
        latitude: coords?.lat || null,
        longitude: coords?.lng || null
      });

      toast({ title: "Servicio Finalizado", description: "La orden ha sido cerrada con éxito." });
      setIsFinishDialogOpen(false);
      router.push('/dashboard');
    } catch (e) {
      toast({ title: "Error al cerrar", variant: "destructive" });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // FLUJO 2: SOLICITAR FIRMA QR (CLIENTE PRESENTE)
  const handleRequestQR = async () => {
    if (!selectedOT || !db || !profile?.companyId || !profile) return;
    
    setIsSubmittingAction(true);
    getPosition();

    try {
      const otRef = doc(db, "companies", profile.companyId, "workOrders", selectedOT.id);
      
      updateDocumentNonBlocking(otRef, {
        status: 'en revision', // Pasa a revisión mientras espera la firma del cliente
        updatedAt: serverTimestamp()
      });

      await addDoc(collection(db, "companies", profile.companyId, "workOrders", selectedOT.id, "digitalLogbookEntries"), {
        workOrderId: selectedOT.id,
        companyId: profile.companyId,
        timestamp: serverTimestamp(),
        eventType: 'action_taken',
        eventDetails: `Solicitud de firma en terreno mediante QR. Georreferencia de visita registrada.`,
        actor: profile.id,
        actorName: profile.name,
        latitude: coords?.lat || null,
        longitude: coords?.lng || null
      });

      setShowQR(true);
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const portalUrl = useMemo(() => {
    if (!selectedOT || !profile?.companyId) return "";
    const baseUrl = window.location.origin;
    return `${baseUrl}/portal/approve/${selectedOT.id}?c=${profile.companyId}`;
  }, [selectedOT, profile?.companyId]);

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(portalUrl)}`;

  if (isUserLoading || isOrdersLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-32">
      <div className="bg-slate-900 text-white p-6 sticky top-0 z-30 shadow-xl flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="text-white">
          <Link href="/dashboard"><ArrowLeft className="h-6 w-6" /></Link>
        </Button>
        <h1 className="text-xl font-black uppercase tracking-tighter italic">Reporte de Terreno</h1>
      </div>

      <div className="flex-1 p-4 space-y-6 max-w-xl mx-auto w-full">
        {!selectedOT ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-blue-600 text-white p-6 rounded-[2rem] shadow-lg flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl"><Info className="h-6 w-6" /></div>
              <div>
                <p className="font-black uppercase italic tracking-tight text-sm">Panel Técnico</p>
                <div className="space-y-1 mt-1">
                  <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3" /> Completa el checklist
                  </p>
                  <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest flex items-center gap-2">
                    <Navigation className="h-3 w-3" /> Registra el GPS
                  </p>
                  <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest flex items-center gap-2">
                    <QrCode className="h-3 w-3" /> Cierra con QR o Sello Técnico
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                placeholder="Buscar por ID o Mandante..." 
                className="h-14 pl-12 rounded-2xl border-none shadow-md bg-white text-lg font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              {filtered.map(ot => (
                <button 
                  key={ot.id}
                  onClick={() => setSelectedOTId(ot.id)}
                  className="w-full text-left bg-white p-6 rounded-[2rem] shadow-sm border-2 border-transparent active:scale-95 active:border-primary transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-primary font-black text-xl italic">{ot.id}</span>
                      <Badge variant="outline" className={cn(
                        "text-[8px] font-black uppercase h-4 px-1.5",
                        ot.status === 'en proceso' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-50"
                      )}>{ot.status}</Badge>
                    </div>
                    <p className="text-slate-900 font-bold text-sm truncate">{clients?.find(c => c.id === ot.clientId)?.name || 'Cargando...'}</p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-slate-300" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in zoom-in-95 duration-300">
            <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
              <CardHeader className="bg-slate-900 text-white p-6">
                <div className="flex justify-between items-center">
                  <div className="min-w-0">
                    <CardTitle className="text-2xl font-black italic tracking-tighter truncate">{selectedOT.id}</CardTitle>
                    <CardDescription className="text-blue-400 font-bold uppercase text-[10px] tracking-widest truncate">
                      {clients?.find(c => c.id === selectedOT.clientId)?.name}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="border-white/20 text-white bg-white/5 rounded-xl h-8 text-[9px] font-black uppercase" onClick={() => setSelectedOTId(null)}>Cambiar OT</Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                <div className="space-y-3 bg-indigo-50/50 p-6 rounded-[2rem] border-2 border-indigo-100 shadow-inner">
                  <Label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" /> Misión del Servicio
                  </Label>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium italic">
                    "{selectedOT.description}"
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 px-2">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> {selectedOT.serviceLocation || 'Ubicación no especificada'}
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <Label className="text-[11px] font-black uppercase text-slate-900 tracking-widest flex items-center gap-2">
                      <ListChecks className="h-4 w-4 text-primary" /> Protocolos Técnicos
                    </Label>
                    <span className="text-[9px] font-black text-slate-400 uppercase">Requerido: 100% OK</span>
                  </div>
                  
                  <div className="space-y-4">
                    {selectedOT.checklist?.map((item) => {
                      const photos = item.evidenceUrls || (item.evidenceUrl ? [item.evidenceUrl] : []);
                      return (
                        <div key={item.id} className="space-y-3">
                          <div className={cn(
                            "w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 group relative overflow-hidden",
                            item.completed 
                              ? "border-emerald-100 bg-emerald-50/20" 
                              : "border-slate-100 bg-white hover:border-primary/30 shadow-sm"
                          )}>
                            <button 
                              onClick={() => handleToggleTask(item.id, item.completed)}
                              className={cn(
                                "h-12 w-12 rounded-full flex items-center justify-center border-4 shrink-0 transition-all active:scale-90",
                                item.completed 
                                  ? "bg-emerald-500 border-emerald-200 text-white" 
                                  : "border-slate-100 text-slate-200 bg-slate-50"
                              )}
                            >
                              <Check className={cn("h-7 w-7 transition-opacity", !item.completed && "opacity-0")} />
                            </button>

                            <button
                              onClick={() => handleTaskClick(item.id)}
                              disabled={isUploading}
                              className="flex-1 text-left flex flex-col min-w-0 py-1"
                            >
                              <span className={cn(
                                "text-sm font-black leading-tight",
                                item.completed ? "text-slate-900" : "text-slate-400"
                              )}>
                                {item.task}
                              </span>
                              <span className={cn(
                                "text-[9px] font-black uppercase mt-1.5 flex items-center gap-1.5",
                                photos.length > 0 ? "text-emerald-600" : "text-primary animate-pulse"
                              )}>
                                <Camera className="h-3 w-3" /> 
                                {photos.length > 0 
                                  ? `EVIDENCIA: ${photos.length} FOTOS` 
                                  : "AÑADIR FOTO (OPCIONAL)"}
                              </span>
                            </button>

                            {isUploading && activeTaskId === item.id && (
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            )}
                          </div>
                          
                          {photos.length > 0 && (
                            <div className="px-2 grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-2">
                              {photos.map((url, i) => (
                                <div key={i} className="relative aspect-video rounded-xl overflow-hidden border-2 border-emerald-100 shadow-sm">
                                  <FirebaseImage url={url} className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-6 border-t-2 border-dashed border-slate-100 space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 ml-2">
                    <Images className="h-4 w-4" /> Evidencias Generales
                  </Label>
                  
                  <Button 
                    variant="outline" 
                    className="w-full h-16 rounded-2xl border-2 border-slate-100 bg-slate-50 text-primary font-black uppercase text-[10px] tracking-widest gap-3 shadow-sm hover:bg-white"
                    onClick={() => { setActiveTaskId(null); fileInputRef.current?.click(); }}
                    disabled={isUploading}
                  >
                    {isUploading && !activeTaskId ? <Loader2 className="animate-spin h-5 w-5" /> : <><PlusCircle className="h-5 w-5" /> Subir Foto de Respaldo</>}
                  </Button>
                  
                  {selectedOT.evidenceUrls && selectedOT.evidenceUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {selectedOT.evidenceUrls.map((url, i) => (
                        <div key={i} className="aspect-square rounded-xl overflow-hidden border shadow-inner">
                          <FirebaseImage url={url} className="w-full h-full" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-8">
                  {isChecklistComplete ? (
                    <Button 
                      className="w-full h-24 rounded-[3rem] bg-slate-900 hover:bg-slate-800 text-white font-black text-2xl uppercase tracking-widest gap-4 shadow-2xl transition-all active:scale-95"
                      onClick={() => setIsFinishDialogOpen(true)}
                    >
                      Finalizar Gestión <ArrowRight className="h-8 w-8" />
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-amber-50 p-5 rounded-[2rem] border-2 border-amber-200 flex gap-4 items-center">
                        <AlertTriangle className="h-8 w-8 text-amber-600 shrink-0" />
                        <p className="text-xs text-amber-800 font-bold uppercase leading-tight">
                          Protocolo Incompleto: Debe marcar todos los puntos como realizados para poder cerrar la orden.
                        </p>
                      </div>
                      <Button 
                        variant="outline"
                        className="w-full h-16 rounded-2xl border-2 border-slate-200 font-black uppercase text-xs tracking-widest gap-2"
                        onClick={() => router.push('/dashboard')}
                      >
                        <Save className="h-4 w-4" /> Guardar Avance y Salir
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* DIÁLOGO DE OPCIONES DE CIERRE */}
      <Dialog open={isFinishDialogOpen} onOpenChange={setIsFinishDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
          {!showQR ? (
            <div className="p-8 space-y-8">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-center">Cierre de Servicio</DialogTitle>
                <DialogDescription className="text-center font-bold text-slate-500">¿Cómo desea certificar la finalización de los trabajos?</DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={handleInternalClose}
                  disabled={isSubmittingAction || !hasPhotos}
                  className={cn(
                    "flex flex-col items-center gap-4 p-8 rounded-[2.5rem] border-4 transition-all active:scale-95 text-center",
                    hasPhotos 
                      ? "bg-slate-900 border-slate-800 text-white shadow-xl" 
                      : "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed opacity-60"
                  )}
                >
                  <div className={cn("p-4 rounded-3xl", hasPhotos ? "bg-white/10" : "bg-slate-200")}>
                    <UserCheck className="h-10 w-10" />
                  </div>
                  <div>
                    <p className="text-xl font-black uppercase italic tracking-tight">Sello Técnico</p>
                    <p className="text-[10px] font-bold uppercase opacity-60 tracking-widest mt-1">Cliente Ausente (Requiere Foto)</p>
                  </div>
                  {!hasPhotos && (
                    <div className="flex items-center gap-2 text-[9px] font-black text-rose-500 uppercase mt-2">
                      <AlertTriangle className="h-3 w-3" /> Debe registrar al menos 1 foto
                    </div>
                  )}
                </button>

                <button 
                  onClick={handleRequestQR}
                  disabled={isSubmittingAction}
                  className="flex flex-col items-center gap-4 p-8 rounded-[2.5rem] border-4 border-indigo-100 bg-indigo-50 text-indigo-900 transition-all active:scale-95 text-center"
                >
                  <div className="bg-indigo-600 p-4 rounded-3xl text-white shadow-lg shadow-indigo-200">
                    <QrCode className="h-10 w-10" />
                  </div>
                  <div>
                    <p className="text-xl font-black uppercase italic tracking-tight">Validación QR</p>
                    <p className="text-[10px] font-bold uppercase text-indigo-600/60 tracking-widest mt-1">Cliente Presente (Firma en Terreno)</p>
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <Navigation className="h-3 w-3 text-blue-500" /> GPS Obligatorio en Cierre
              </div>
            </div>
          ) : (
            <div className="p-10 space-y-8 text-center animate-in zoom-in-95 duration-500">
              <div className="space-y-2">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-indigo-600">Validación Mandante</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Solicite al cliente escanear el código</p>
              </div>

              <div className="bg-white p-6 rounded-[2.5rem] shadow-inner border-2 border-indigo-50 inline-block mx-auto relative">
                <div className="absolute -top-4 -right-4 bg-indigo-600 text-white p-2 rounded-xl shadow-lg">
                  <Zap className="h-6 w-6" />
                </div>
                <img src={qrImageUrl} alt="QR Approval" className="h-48 w-48" />
              </div>

              <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl space-y-2 relative overflow-hidden">
                <div className="absolute right-4 top-4 opacity-10"><ShieldCheck className="h-12 w-12" /></div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">PIN de Aprobación</p>
                <p className="text-5xl font-black italic tracking-[0.2em]">{selectedOT.approvalPin}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase pt-2">Válido únicamente para esta operación técnica</p>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase leading-relaxed max-w-[250px] mx-auto">
                  Al completar la aprobación, el sistema registrará la georreferencia y cerrará la orden automáticamente.
                </p>
                <Button variant="ghost" className="text-slate-400 font-bold uppercase text-[10px] tracking-widest" onClick={() => setShowQR(false)}>
                  Volver a opciones de cierre
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />
    </div>
  );
}

export default function FieldCapturePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <FieldCaptureContent />
    </Suspense>
  );
}
