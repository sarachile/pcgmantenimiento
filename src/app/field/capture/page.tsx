
"use client";

import { useState, useRef, useMemo } from "react";
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
  Save
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
    return list.filter(ot => {
      const client = clients?.find(c => c.id === ot.clientId);
      return (
        ot.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [workOrders, clients, searchTerm, isTechnician, profile]);

  const handleManualSave = async () => {
    if (!selectedOT || !db || !profile?.companyId) return;
    
    setIsSaving(true);
    // Si hay un comentario, lo guardamos en la bitácora
    if (logComment.trim()) {
      await addDoc(collection(db, "companies", profile.companyId, "workOrders", selectedOT.id, "digitalLogbookEntries"), {
        workOrderId: selectedOT.id,
        companyId: profile.companyId,
        timestamp: serverTimestamp(),
        eventType: 'comment',
        eventDetails: logComment,
        actor: profile.id
      });
      setLogComment("");
    }

    toast({
      title: "Avance Guardado",
      description: "Su progreso ha sido sincronizado correctamente.",
    });
    setIsSaving(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedOT || !profile?.companyId || !storage || !db) return;

    setIsUploading(true);
    try {
      const path = `companies/${profile.companyId}/workOrders/${selectedOT.id}/field_evidence_${Date.now()}`;
      const sRef = ref(storage, path);
      
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);

      const otRef = doc(db, "companies", profile.companyId, "workOrders", selectedOT.id);
      
      if (selectedChecklistItemId) {
        const updatedChecklist = selectedOT.checklist?.map(item => 
          item.id === selectedChecklistItemId 
            ? { ...item, completed: true, completedAt: new Date().toISOString(), evidenceUrl: url } 
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
        eventDetails: logComment || "Evidencia fotográfica cargada desde terreno.",
        actor: profile.id
      });

      toast({ title: "Evidencia Guardada", description: "El avance se ha registrado con éxito." });
      setSelectedChecklistItemId(null);
      setLogComment("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      
    } catch (error: any) {
      toast({ title: "Error al registrar", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFinalizeWork = async () => {
    if (!selectedOT || !db || !profile?.companyId) return;
    
    setIsFinalizing(true);
    try {
      const techCode = `TCH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const otRef = doc(db, "companies", profile.companyId, "workOrders", selectedOT.id);
      
      updateDocumentNonBlocking(otRef, {
        status: 'en revision',
        technicianApprovalName: profile.name,
        technicianApprovalDate: serverTimestamp(),
        technicianApprovalCode: techCode,
        executedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await addDoc(collection(db, "companies", profile.companyId, "workOrders", selectedOT.id, "digitalLogbookEntries"), {
        workOrderId: selectedOT.id,
        companyId: profile.companyId,
        timestamp: serverTimestamp(),
        eventType: 'status_change',
        eventDetails: `El técnico ${profile.name} ha finalizado los trabajos y enviado la orden a revisión técnica.`,
        actor: profile.id
      });

      toast({ title: "Trabajo Finalizado", description: "La orden ha pasado a revisión técnica." });
      setSelectedOT(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsFinalizing(false);
    }
  };

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
                {isTechnician ? "Mis Órdenes Asignadas" : "Órdenes de Trabajo Activas"}
              </p>
              {filtered.length === 0 ? (
                <div className="p-10 text-center text-slate-400 italic bg-white rounded-3xl border-2 border-dashed">
                  No hay órdenes disponibles para captura.
                </div>
              ) : (
                filtered.map(ot => {
                  const client = clients?.find(c => c.id === ot.clientId);
                  const completedCount = ot.checklist?.filter(i => i.completed).length || 0;
                  const totalCount = ot.checklist?.length || 0;
                  
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
                        {totalCount > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(completedCount / totalCount) * 100}%` }} />
                            </div>
                            <span className="text-[9px] font-black text-slate-400">{completedCount}/{totalCount}</span>
                          </div>
                        )}
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
                {/* Protocolos */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                      <ListChecks className="h-4 w-4 text-primary" /> Protocolos de Servicio
                    </Label>
                    <Badge variant="outline" className="text-[8px] font-black border-emerald-200 text-emerald-600 bg-emerald-50">AUTO-GUARDADO</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {selectedOT.checklist && selectedOT.checklist.length > 0 ? (
                      selectedOT.checklist.map((item) => (
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
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic text-center py-4">Sin puntos de inspección definidos.</p>
                    )}
                  </div>
                </div>

                {/* Comentario y Foto */}
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-500" /> Nota de Bitácora
                  </Label>
                  <Textarea 
                    placeholder={selectedChecklistItemId ? "Añade una nota para esta tarea específica..." : "Detalles generales del hallazgo o acción..."} 
                    className="rounded-2xl min-h-[80px] border-2 bg-slate-50/50 text-sm"
                    value={logComment}
                    onChange={(e) => setLogComment(e.target.value)}
                  />
                  
                  <div className="flex flex-col gap-3">
                    <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                    <Button 
                      className={cn(
                        "w-full h-24 rounded-3xl shadow-xl flex flex-col gap-2 transition-all",
                        selectedChecklistItemId ? "bg-primary text-white" : "bg-slate-100 text-slate-600 border-2 border-dashed border-slate-300 hover:bg-slate-200"
                      )}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 className="animate-spin" /> : (
                        <>
                          <Camera className="h-8 w-8" />
                          <span className="text-sm font-black uppercase italic">
                            {selectedChecklistItemId ? "Subir Evidencia para Tarea" : "Subir Evidencia General"}
                          </span>
                        </>
                      )}
                    </Button>
                    <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <CloudUpload className="h-3 w-3" /> Los cambios se guardan al subir la foto
                    </div>
                  </div>
                </div>

                {/* ACCIONES DE GUARDADO PARCIAL Y CIERRE */}
                <div className="pt-8 border-t-2 border-dashed space-y-4">
                  <div className="flex gap-3">
                    <Button 
                      variant="outline"
                      className="flex-1 h-16 rounded-2xl border-2 border-slate-200 font-black uppercase text-xs tracking-widest gap-2 bg-white"
                      onClick={handleManualSave}
                      disabled={isSaving || isUploading || isFinalizing}
                    >
                      {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <><Save className="h-4 w-4" /> Guardar Avance</>}
                    </Button>
                  </div>

                  <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex gap-3">
                    <Fingerprint className="h-6 w-6 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-blue-900 uppercase">Finalización Técnica</p>
                      <p className="text-[10px] text-blue-700/70 font-medium leading-relaxed">
                        Al pulsar el botón inferior, declaras que has completado tu labor. Se generará un sello digital con tu nombre y la orden pasará a revisión administrativa.
                      </p>
                    </div>
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

            <Button variant="ghost" className="w-full text-slate-400 font-bold uppercase tracking-widest" onClick={() => setSelectedOT(null)} disabled={isUploading || isFinalizing}>
              Volver al listado
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
