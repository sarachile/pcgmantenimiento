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
  Circle
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { WorkOrder, Client } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FirebaseImage } from "@/components/FirebaseImage";

export default function FieldCapturePage() {
  const { profile, isLoading: isUserLoading, isTechnician } = useUser();
  const db = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOT, setSelectedOT] = useState<WorkOrder | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

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
    if (!isOrdersLoading && !selectedOT && filtered.length === 1 && searchTerm === "") {
      setSelectedOT(filtered[0]);
    }
  }, [filtered, isOrdersLoading, selectedOT, searchTerm]);

  // EL REQUISITO ES QUE TODOS ESTÉN COMPLETADOS (CHECK OK)
  const isChecklistComplete = useMemo(() => {
    if (!selectedOT || !selectedOT.checklist) return false;
    if (selectedOT.checklist.length === 0) return true;
    
    return selectedOT.checklist.every(item => item.completed === true);
  }, [selectedOT]);

  const handleTaskClick = (taskId: string) => {
    setActiveTaskId(taskId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // NUEVA FUNCIÓN PARA MARCAR CHECK SIN FOTO
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
        eventDetails: `Tarea marcada como completada: ${selectedOT.checklist?.find(i => i.id === taskId)?.task}`,
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
          ? `Evidencia capturada para tarea: ${selectedOT.checklist?.find(i => i.id === activeTaskId)?.task}` 
          : "Evidencia fotográfica general capturada.",
        actor: profile.id,
        actorName: profile.name,
        latitude: coords?.lat || null,
        longitude: coords?.lng || null
      });

      toast({ title: "Captura Registrada ✓" });
      setActiveTaskId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
    } catch (error: any) {
      toast({ title: "Error al subir", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFinalize = async () => {
    if (!selectedOT || !db || !profile?.companyId || !profile) return;
    
    if (!isChecklistComplete) {
      toast({ 
        title: "Protocolo Incompleto", 
        description: "Debe marcar todos los puntos del protocolo como realizados antes de finalizar.", 
        variant: "destructive" 
      });
      return;
    }

    setIsFinalizing(true);
    try {
      const otRef = doc(db, "companies", profile.companyId, "workOrders", selectedOT.id);
      updateDocumentNonBlocking(otRef, {
        status: 'en revision',
        executedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      await addDoc(collection(db, "companies", profile.companyId, "workOrders", selectedOT.id, "digitalLogbookEntries"), {
        workOrderId: selectedOT.id,
        companyId: profile.companyId,
        timestamp: serverTimestamp(),
        eventType: 'status_change',
        eventDetails: "Orden finalizada por el técnico y enviada a revisión técnica.",
        actor: profile.id,
        actorName: profile.name
      });

      toast({ title: "Trabajo Enviado", description: "La orden pasó a revisión administrativa." });
      router.push('/dashboard');
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleSaveProgress = () => {
    toast({ title: "Progreso Guardado" });
    router.push('/dashboard');
  };

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
                <p className="font-black uppercase italic tracking-tight">Instrucciones</p>
                <p className="text-xs font-medium text-blue-100 leading-tight">Marque los puntos realizados. Tocar una tarea abre la cámara para el respaldo recomendado.</p>
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
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Órdenes de Trabajo Asignadas</p>
              {filtered.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-[2rem] border-2 border-dashed">
                  <p className="text-slate-400 italic font-medium">No hay órdenes activas asignadas.</p>
                </div>
              ) : (
                filtered.map(ot => (
                  <button 
                    key={ot.id}
                    onClick={() => setSelectedOT(ot)}
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
                ))
              )}
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
                  <Button variant="outline" size="sm" className="border-white/20 text-white bg-white/5 rounded-xl h-8 text-[9px] font-black uppercase" onClick={() => setSelectedOT(null)}>Cambiar OT</Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                <div className="space-y-3 bg-indigo-50/50 p-6 rounded-[2rem] border-2 border-indigo-100 shadow-inner">
                  <Label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" /> Requerimiento del Cliente
                  </Label>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium italic">
                    "{selectedOT.description}"
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 px-2">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> {selectedOT.serviceLocation || 'Ubicación no especificada'}
                </div>
                
                <div className="space-y-4">
                  <Label className="text-[11px] font-black uppercase text-slate-900 tracking-widest flex items-center gap-2 border-b pb-2">
                    <ListChecks className="h-4 w-4 text-primary" /> Protocolos de Servicio
                  </Label>
                  
                  <div className="space-y-4">
                    {selectedOT.checklist?.map((item) => {
                      const photos = item.evidenceUrls || (item.evidenceUrl ? [item.evidenceUrl] : []);
                      return (
                        <div key={item.id} className="space-y-3">
                          <div className={cn(
                            "w-full p-5 rounded-2xl border-2 transition-all flex items-center gap-4 group relative overflow-hidden",
                            item.completed && photos.length > 0
                              ? "border-emerald-100 bg-emerald-50/20" 
                              : item.completed 
                              ? "border-amber-100 bg-amber-50/20"
                              : "border-slate-100 bg-white hover:border-primary/30 shadow-sm"
                          )}>
                            {/* CHECKBOX PARA MARCAR COMPLETADO SIN FOTO */}
                            <button 
                              onClick={() => handleToggleTask(item.id, item.completed)}
                              className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center border-2 shrink-0 transition-all",
                                item.completed ? "bg-primary border-primary text-white" : "border-slate-200 text-slate-200 bg-white"
                              )}
                            >
                              <Check className={cn("h-6 w-6", !item.completed && "opacity-0")} />
                            </button>

                            {/* BOTÓN PARA ABRIR CÁMARA */}
                            <button
                              onClick={() => handleTaskClick(item.id)}
                              disabled={isUploading}
                              className="flex-1 text-left flex flex-col min-w-0"
                            >
                              <span className={cn("text-sm font-black leading-none truncate", item.completed ? "text-slate-900" : "text-slate-400")}>
                                {item.task}
                              </span>
                              <span className="text-[9px] font-bold text-primary uppercase mt-1.5 flex items-center gap-1">
                                <Camera className="h-3 w-3" /> {photos.length > 0 ? "AÑADIR MÁS FOTOS" : "SUBIR EVIDENCIA (OPCIONAL)"}
                              </span>
                            </button>

                            {isUploading && activeTaskId === item.id && (
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            )}
                          </div>
                          
                          {photos.length > 0 && (
                            <div className="px-2 grid grid-cols-2 sm:grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-2">
                              {photos.map((url, i) => (
                                <div key={i} className="relative aspect-video rounded-xl overflow-hidden border-2 border-emerald-100 shadow-sm group">
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
                  <p className="text-[10px] font-black uppercase text-slate-400 text-center">Evidencias Generales de Apoyo</p>
                  <Button 
                    variant="outline" 
                    className="w-full h-14 rounded-2xl border-2 border-slate-100 bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-widest gap-2"
                    onClick={() => { setActiveTaskId(null); fileInputRef.current?.click(); }}
                    disabled={isUploading}
                  >
                    {isUploading && !activeTaskId ? <Loader2 className="animate-spin h-4 w-4" /> : <><Plus className="h-4 w-4" /> Añadir Foto General</>}
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

                <div className="pt-8 space-y-4">
                  {isChecklistComplete ? (
                    <div className="space-y-4 animate-in fade-in zoom-in-95">
                      <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 flex gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                        <p className="text-[11px] text-emerald-800 font-bold uppercase leading-tight">
                          Protocolo Completo: El checklist está 100% validado para el cierre oficial.
                        </p>
                      </div>
                      <Button 
                        className="w-full h-20 rounded-[2.5rem] bg-slate-900 hover:bg-slate-800 text-white font-black text-xl uppercase tracking-widest gap-3 shadow-2xl transition-all active:scale-95"
                        onClick={handleFinalize}
                        disabled={isFinalizing || isUploading}
                      >
                        {isFinalizing ? <Loader2 className="animate-spin h-8 w-8" /> : <><CheckCircle2 className="h-6 w-6" /> Finalizar y Enviar</>}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                        <p className="text-[11px] text-amber-800 font-bold uppercase leading-tight">
                          Checklist Incompleto: Debes marcar todos los puntos como realizados para poder finalizar el reporte oficial.
                        </p>
                      </div>
                      <Button 
                        variant="outline"
                        className="w-full h-16 rounded-2xl border-2 border-slate-200 font-black uppercase text-xs tracking-widest gap-2 hover:bg-white"
                        onClick={handleSaveProgress}
                      >
                        <Save className="h-4 w-4" /> Guardar Avance y Salir
                      </Button>
                    </div>
                  )}
                  <p className="text-[9px] text-center text-slate-400 font-bold uppercase mt-4 tracking-widest">
                    * El envío al supervisor requiere que todos los puntos del protocolo estén marcados.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

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
