"use client";

import { use, useState, useEffect, useMemo, Suspense } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardPlus, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Mail, 
  Building2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  MapPin,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { initializeFirebase } from "@/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Client, Company } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

function PublicRequestContent({ params }: { params: { id: string } }) {
  const clientId = params.id;
  const searchParams = useSearchParams();
  const companyId = searchParams.get('c');
  const { toast } = useToast();
  
  const [client, setClient] = useState<Client | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setStep] = useState(false);

  // Form State
  const [emailInput, setEmailInput] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [description, setDescription] = useState("");
  const [serviceLocation, setServiceLocation] = useState("");
  const [requestedByName, setRequestedByName] = useState("");
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');

  const { firestore } = useMemo(() => initializeFirebase(), []);

  useEffect(() => {
    async function loadData() {
      if (!companyId) {
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
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [firestore, clientId, companyId]);

  const handleVerifyEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.toLowerCase().trim() === client?.contactEmail?.toLowerCase().trim()) {
      setIsVerified(true);
      toast({ title: "Identidad Confirmada", description: "Acceso al portal de requerimientos habilitado." });
    } else {
      toast({ title: "Email no coincide", description: "Ingrese el correo corporativo registrado en su ficha de cliente.", variant: "destructive" });
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !clientId || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const colRef = collection(firestore, "companies", companyId, "workOrders");
      await addDoc(colRef, {
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setStep(true);
      toast({ title: "Solicitud Recibida", description: "Su requerimiento ha sido ingresado al sistema de triage técnico." });
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
        <Card className="max-w-md w-full p-10 text-center rounded-[2.5rem] shadow-2xl border-none animate-in zoom-in-95">
          <div className="bg-emerald-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter uppercase italic">¡Recibido!</h2>
          <p className="text-slate-500 font-bold mb-8 leading-relaxed">Su solicitud ha sido ingresada. La central de operaciones revisará su pedido y le asignará un técnico a la brevedad.</p>
          <Button className="w-full h-14 rounded-2xl bg-slate-900 font-black uppercase tracking-widest" onClick={() => window.close()}>Cerrar Portal</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-slate-900 text-white p-8 pt-12 rounded-b-[3.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10"><Building2 className="h-40 w-40" /></div>
        <div className="max-w-2xl mx-auto relative z-10">
          <Badge className="bg-white/10 text-white mb-4 backdrop-blur-md border-white/20 uppercase tracking-[0.2em] font-black text-[9px]">Portal de Autogestión de Servicios</Badge>
          <h1 className="text-3xl font-black tracking-tight mb-2 uppercase leading-none italic">{company.name}</h1>
          <p className="text-slate-400 font-bold text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-400" /> Cliente: {client.name}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-10">
        {!isVerified ? (
          <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
            <CardHeader className="p-10 text-center">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Mail className="h-10 w-10 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-black uppercase tracking-tighter italic">Verificación de Identidad</CardTitle>
              <CardDescription className="text-slate-500 font-medium">Ingrese el correo de contacto registrado para desbloquear el portal.</CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-0">
              <form onSubmit={handleVerifyEmail} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Corporativo</Label>
                  <Input 
                    type="email" 
                    placeholder="ejemplo@empresa.cl" 
                    className="h-14 rounded-2xl border-2 focus:border-blue-500 text-lg font-bold"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg uppercase tracking-widest gap-2">
                  Acceder al Portal <ArrowRight className="h-5 w-5" />
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden animate-in fade-in">
            <CardHeader className="bg-slate-50 border-b p-10">
              <CardTitle className="text-2xl font-black flex items-center gap-3 uppercase tracking-tighter italic">
                <ClipboardPlus className="h-8 w-8 text-primary" /> Nuevo Requerimiento
              </CardTitle>
              <CardDescription className="text-base font-medium">Describa el servicio o falla que requiere atención técnica.</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <form onSubmit={handleCreateRequest} className="space-y-8">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                      <MapPin className="h-3 w-3" /> Lugar del Servicio
                    </Label>
                    <Input 
                      placeholder="Dirección de la falla" 
                      className="h-12 rounded-xl border-2 font-medium bg-white"
                      value={serviceLocation}
                      onChange={(e) => setServiceLocation(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                      <User className="h-3 w-3" /> Solicitante (Nombre)
                    </Label>
                    <Input 
                      placeholder="Persona de contacto" 
                      className="h-12 rounded-xl border-2 font-medium bg-white"
                      value={requestedByName}
                      onChange={(e) => setRequestedByName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Descripción del Problema / Servicio</Label>
                  <Textarea 
                    placeholder="Ej: Falla en bomba de agua sala técnica 2, requiere revisión urgente por ruido anómalo..." 
                    className="min-h-[180px] rounded-[2rem] border-2 p-6 text-lg font-medium italic bg-slate-50/50 shadow-inner"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nivel de Prioridad Sugerido</Label>
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

                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex gap-4">
                  <Smartphone className="h-6 w-6 text-amber-600 shrink-0" />
                  <p className="text-xs font-bold text-amber-800 leading-relaxed italic">
                    Nota: Al enviar, recibirá un número de seguimiento. Podrá adjuntar evidencias fotográficas una vez que el técnico sea asignado.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting || !description.trim()} 
                  className="w-full h-20 rounded-[2rem] bg-primary text-white font-black text-xl uppercase tracking-widest shadow-xl shadow-primary/20 gap-3 active:scale-95 transition-all"
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-8 w-8" /> : "Enviar Solicitud Técnica"}
                </Button>
              </form>
            </CardContent>
          </Card>
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