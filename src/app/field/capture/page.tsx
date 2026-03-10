
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
  Image as ImageIcon
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

  // Captura de ubicación
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

  // Auto-selección inteligente corregida
  useEffect(() => {
    if (!isOrdersLoading && !selectedOT && filtered.length === 1 && searchTerm === "") {
      setSelectedOT(filtered[0]);
    }
  }, [filtered, isOrdersLoading, selectedOT, searchTerm]);

  // DISPARADOR DE CÁMARA: Al elegir una tarea, abre la cámara directamente
  const handleTaskClick = (taskId: string) => {
    setActiveTaskId(taskId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
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
      
      // Actualizar el item específico del checklist o añadir a galería general
      const updateData: any = {
        updatedAt: serverTimestamp(),
        status: 'en proceso'
      };

      if (activeTaskId) {
        updateData.checklist = selectedOT.checklist?.map(item => 
          item.id === activeTaskId 
            ? { 
                ...item, 
                completed: true, 
                completedAt: new Date().toISOString(), 
                evidenceUrl: url, 
                latitude: coords?.lat || null, 
                longitude: coords?.lng || null 
              } 
            : item
        );
      } else {
        updateData.evidenceUrls = arrayUnion(url);
      }

      updateDocumentNonBlocking(otRef, updateData);

      // Registrar en bitácora
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

      toast({ title: "Evidencia Registrada" });
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
    setIsFinalizing(true);
    try {
      const otRef = doc(db, "companies", profile.companyId, "workOrders", selectedOT.id);
      updateDocumentNonBlocking(otRef, {
        status: 'en revision',
        executedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast({ title: "Trabajo Enviado", description: "La orden pasó a revisión." });
      setSelectedOT(null);
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsFinalizing(false);
    }
  };

  if (isUserLoading || isOrdersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-32">
      {/* NAVBAR CAPTURA */}
      <div className="bg-slate-900 text-white p-6 sticky top-0 z-30 shadow-xl flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="text-white">
          <Link href="/dashboard"><ArrowLeft className="h-6 w-6" /></Link>
        </Button>
        <h1 className="text-xl font-black uppercase tracking-tighter italic">Cámara de Terreno</h1>
      </div>

      <div className="flex-1 p-4 space-y-6 max-w-xl mx-auto w-full">
        {!selectedOT ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                placeholder="Buscar trabajo pendiente..." 
                className="h-14 pl-12 rounded-2xl border-none shadow-md bg-white text-lg font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Seleccione Orden de Trabajo</p>
              {filtered.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-[2rem] border-2 border-dashed">
                  <p className="text-slate-400 italic">No hay órdenes activas asignadas.</p>
                </div>
              ) : (
                filtered.map(ot => (
                  <button 
                    key={ot.id}
                    onClick={() => setSelectedOT(ot)}
                    className="w-full text-left bg-white p-6 rounded-[2rem] shadow-sm border border-transparent active:scale-95 transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-primary font-black text-xl italic">{ot.id}</span>
                        <Badge variant="outline" className="text-[8px] font-black uppercase h-4 px-1.5">{ot.status}</Badge>
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
            {/* ENCABEZADO MINIMALISTA SOLICITADO */}
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
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> {selectedOT.serviceLocation || 'Ubicación no especificada'}
                </div>
                
                {/* PROTOCOLOS DE SERVICIO (TRIGGER CÁMARA) */}
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-primary" /> Protocolos de Servicio (Pulsa para capturar)
                  </Label>
                  <div className="space-y-3">
                    {selectedOT.checklist?.map((item) => (
                      <div key={item.id} className="space-y-2">
                        <button
                          onClick={() => handleTaskClick(item.id)}
                          disabled={isUploading}
                          className={cn(
                            "w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between group",
                            item.completed ? "border-emerald-100 bg-emerald-50/20" : "border-slate-100 bg-white hover:border-primary/30"
                          )}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className={cn(
                              "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                              item.completed ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                            )}>
                              {item.completed ? <Check className="h-6 w-6" /> : <Camera className="h-5 w-5" />}
                            </div>
                            <span className={cn("text-sm font-bold leading-tight", item.completed ? "text-emerald-900" : "text-slate-700")}>
                              {item.task}
                            </span>
                          </div>
                          {isUploading && activeTaskId === item.id ? (
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
                          )}
                        </button>
                        
                        {/* IMAGEN INCRUSTADA EN EL ITEM (SOLICITADO) */}
                        {item.evidenceUrl && (
                          <div className="px-2">
                            <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-emerald-50 shadow-inner group">
                              <FirebaseImage url={item.evidenceUrl} className="w-full h-full object-cover" />
                              <div className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase shadow-lg">
                                Realizado ✓
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* EVIDENCIA GENERAL ADICIONAL */}
                <div className="pt-4 border-t border-dashed">
                  <Button 
                    variant="outline" 
                    className="w-full h-14 rounded-2xl border-2 border-slate-100 bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-widest gap-2"
                    onClick={() => { setActiveTaskId(null); fileInputRef.current?.click(); }}
                    disabled={isUploading}
                  >
                    {isUploading && !activeTaskId ? <Loader2 className="animate-spin h-4 w-4" /> : <><Plus className="h-4 w-4" /> Añadir Evidencia General</>}
                  </Button>
                  
                  {selectedOT.evidenceUrls && selectedOT.evidenceUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {selectedOT.evidenceUrls.map((url, i) => (
                        <div key={i} className="aspect-square rounded-xl overflow-hidden border">
                          <FirebaseImage url={url} className="w-full h-full" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-6">
                  <Button 
                    className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest gap-2 shadow-2xl"
                    onClick={handleFinalize}
                    disabled={isFinalizing || isUploading}
                  >
                    {isFinalizing ? <Loader2 className="animate-spin h-5 w-5" /> : <><Send className="h-5 w-5" /> Terminar Reporte</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* INPUT CÁMARA OCULTO */}
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
