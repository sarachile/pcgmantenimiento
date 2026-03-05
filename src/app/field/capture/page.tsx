
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
  ClipboardList,
  Building2,
  ChevronRight,
  ListChecks,
  MessageSquare,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { WorkOrder, Client, ChecklistItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function FieldCapturePage() {
  const { profile, isLoading: isUserLoading } = useUser();
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

  // Consultar OTs activas
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
    return (workOrders || []).filter(ot => {
      const client = clients?.find(c => c.id === ot.clientId);
      return (
        ot.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [workOrders, clients, searchTerm]);

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
      
      // 1. Si hay un item del protocolo seleccionado, actualizarlo
      if (selectedChecklistItemId) {
        const updatedChecklist = selectedOT.checklist?.map(item => 
          item.id === selectedChecklistItemId 
            ? { ...item, completed: true, completedAt: new Date().toISOString(), evidenceUrl: url } 
            : item
        );
        updateDocumentNonBlocking(otRef, {
          checklist: updatedChecklist,
          updatedAt: serverTimestamp()
        });
      } else {
        // Si no, añadir a evidencias generales
        updateDocumentNonBlocking(otRef, {
          evidenceUrls: arrayUnion(url),
          updatedAt: serverTimestamp()
        });
      }

      // 2. Registrar en la bitácora digital
      const logDetails = selectedChecklistItemId 
        ? `Protocolo ejecutado: ${selectedOT.checklist?.find(i => i.id === selectedChecklistItemId)?.task}. ${logComment}`
        : `Evidencia fotográfica cargada. ${logComment}`;

      await addDoc(collection(db, "companies", profile.companyId, "workOrders", selectedOT.id, "digitalLogbookEntries"), {
        workOrderId: selectedOT.id,
        companyId: profile.companyId,
        timestamp: serverTimestamp(),
        eventType: 'action_taken',
        eventDetails: logDetails,
        actor: profile.id
      });

      toast({
        title: "¡Registro Completado!",
        description: `Evidencia y bitácora guardadas para ${selectedOT.id}.`,
      });
      
      // Resetear estado
      setSelectedOT(null);
      setSelectedChecklistItemId(null);
      setLogComment("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      
    } catch (error: any) {
      toast({
        title: "Error al registrar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
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
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Órdenes Activas</p>
              {filtered.length === 0 ? (
                <div className="p-10 text-center text-slate-400 italic bg-white rounded-3xl border-2 border-dashed">
                  No hay órdenes disponibles.
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
                        <p className="text-slate-400 text-xs truncate italic">"{ot.description}"</p>
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
                  <div>
                    <CardTitle className="text-3xl font-black italic tracking-tighter">{selectedOT.id}</CardTitle>
                    <CardDescription className="text-slate-400 font-bold uppercase tracking-widest mt-1">
                      {clients?.find(c => c.id === selectedOT.clientId)?.name}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" className="text-white/50 hover:text-white" onClick={() => setSelectedOT(null)}>Cambiar</Button>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {/* Selector de Protocolo (Opcional) */}
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-primary" /> Vincular a Protocolo (Opcional)
                  </Label>
                  <div className="space-y-2">
                    {selectedOT.checklist && selectedOT.checklist.length > 0 ? (
                      selectedOT.checklist.filter(i => !i.completed).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedChecklistItemId(selectedChecklistItemId === item.id ? null : item.id)}
                          className={cn(
                            "w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between",
                            selectedChecklistItemId === item.id ? "border-primary bg-primary/5" : "border-slate-100 bg-slate-50/50"
                          )}
                        >
                          <span className="text-xs font-bold text-slate-700">{item.task}</span>
                          {selectedChecklistItemId === item.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic text-center py-4">Sin puntos de inspección definidos.</p>
                    )}
                  </div>
                </div>

                {/* Comentario de Bitácora */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-500" /> Nota de Bitácora
                  </Label>
                  <Textarea 
                    placeholder="¿Qué encontraste? ¿Qué acción realizaste?..." 
                    className="rounded-2xl min-h-[100px] border-2 bg-slate-50/50 text-sm font-medium"
                    value={logComment}
                    onChange={(e) => setLogComment(e.target.value)}
                  />
                </div>

                <div className="space-y-4 pt-4">
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  
                  <Button 
                    className="w-full h-32 rounded-[2rem] bg-primary text-white shadow-xl shadow-primary/20 flex flex-col gap-3 active:scale-95 transition-transform"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-10 w-10 animate-spin" />
                    ) : (
                      <>
                        <Camera className="h-10 w-10" />
                        <span className="text-xl font-black uppercase tracking-tighter italic">Tomar Evidencia</span>
                      </>
                    )}
                  </Button>
                  
                  <p className="text-[9px] font-black text-center text-slate-400 uppercase tracking-widest leading-relaxed">
                    {isUploading ? "Procesando archivos..." : "Al capturar, se cerrará el protocolo seleccionado y se actualizará la bitácora."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button variant="ghost" className="w-full text-slate-400 font-bold uppercase tracking-widest" onClick={() => setSelectedOT(null)} disabled={isUploading}>
              Volver al listado
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
