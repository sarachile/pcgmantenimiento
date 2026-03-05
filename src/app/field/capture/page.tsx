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
import { collection, query, where, doc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Camera, 
  Search, 
  Loader2, 
  ArrowLeft, 
  CheckCircle2, 
  ClipboardList,
  Building2,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { WorkOrder, Client } from "@/lib/types";
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
  const [isUploading, setIsUploading] = useState(false);

  // Consultar OTs activas (que no estén aprobadas)
  const workOrdersQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return query(
      collection(db, "companies", profile.companyId, "workOrders"),
      where("status", "!=", "aprobada")
    );
  }, [db, profile?.companyId]);

  const { data: workOrders, isLoading: isOrdersLoading } = useCollection<WorkOrder>(workOrdersQuery);

  // Consultar clientes para mostrar nombres
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
    if (!file || !selectedOT || !profile?.companyId || !storage) return;

    setIsUploading(true);
    try {
      const path = `companies/${profile.companyId}/workOrders/${selectedOT.id}/field_evidence_${Date.now()}`;
      const sRef = ref(storage, path);
      
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);

      const otRef = doc(db!, "companies", profile.companyId, "workOrders", selectedOT.id);
      updateDocumentNonBlocking(otRef, {
        evidenceUrls: arrayUnion(url),
        updatedAt: serverTimestamp()
      });

      toast({
        title: "¡Evidencia Guardada!",
        description: `Se añadió la foto a la OT ${selectedOT.id}.`,
      });
      
      // Limpiar selección después de subir
      setSelectedOT(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
      toast({
        title: "Error al subir",
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header Fijo */}
      <div className="bg-slate-900 text-white p-6 sticky top-0 z-30 shadow-xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="text-white">
            <Link href="/dashboard"><ArrowLeft className="h-6 w-6" /></Link>
          </Button>
          <h1 className="text-xl font-black uppercase tracking-tighter italic">Captura Rápida</h1>
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
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Órdenes Activas en Terreno</p>
              {filtered.length === 0 ? (
                <div className="p-10 text-center text-slate-400 italic bg-white rounded-3xl border-2 border-dashed">
                  No hay órdenes disponibles para captura.
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
                      <div className="bg-slate-50 p-2 rounded-xl group-active:bg-primary group-active:text-white transition-colors">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in zoom-in-95 duration-300">
            <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden">
              <CardHeader className="bg-slate-900 text-white p-8">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-3xl font-black italic tracking-tighter">{selectedOT.id}</CardTitle>
                    <CardDescription className="text-slate-400 font-bold uppercase tracking-widest mt-1">
                      {clients?.find(c => c.id === selectedOT.clientId)?.name}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" className="text-white/50 hover:text-white" onClick={() => setSelectedOT(null)}>Cambiar OT</Button>
                </div>
              </CardHeader>
              <CardContent className="p-10 text-center space-y-8">
                <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed space-y-2">
                  <ClipboardList className="h-8 w-8 mx-auto text-slate-300" />
                  <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                    "{selectedOT.description}"
                  </p>
                </div>

                <div className="space-y-4">
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  
                  <Button 
                    className="w-full h-40 rounded-[2.5rem] bg-primary text-white shadow-xl shadow-primary/30 flex flex-col gap-4 active:scale-95 transition-transform"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-12 w-12 animate-spin" />
                    ) : (
                      <>
                        <Camera className="h-16 w-16" />
                        <span className="text-2xl font-black uppercase tracking-tighter italic">Tomar Fotografía</span>
                      </>
                    )}
                  </Button>
                  
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                    {isUploading ? "Subiendo archivo al servidor..." : "La foto se asociará automáticamente a esta OT"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button variant="ghost" className="w-full h-12 rounded-2xl text-slate-400 font-bold uppercase tracking-widest" onClick={() => setSelectedOT(null)} disabled={isUploading}>
              Cancelar y volver al listado
            </Button>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="p-8 text-center opacity-20 mt-auto">
        <p className="text-[8px] font-black uppercase tracking-[0.5em]">PCGMANTENIMIENTO ERP FIELD CAPTURE</p>
      </div>
    </div>
  );
}
