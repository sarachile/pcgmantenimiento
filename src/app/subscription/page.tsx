"use client";

import { useState } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { doc, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  ShieldCheck, 
  ArrowRight,
  Loader2,
  Lock,
  ArrowLeft,
  Sparkles,
  Receipt,
  Cpu,
  Zap,
  MessageSquare,
  Send,
  Droplets
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Company } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { PLAN_CONFIGS } from "@/lib/plan-configs";
import { sendSystemEmail } from "@/actions/email";

export default function SubscriptionPage() {
  const { profile, isLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isRequestingKit, setIsRequestingKit] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [rut, setRut] = useState("");

  const companyRef = useMemoFirebase(() => 
    db && profile?.companyId ? doc(db, "companies", profile.companyId) : null, 
    [db, profile?.companyId]
  );
  const { data: company, isLoading: isCompanyLoading } = useDoc<Company>(companyRef);

  const plans = [
    {
      id: "simple",
      config: PLAN_CONFIGS.simple,
      price: "0.8 UF",
      period: "/ mes",
      description: "Digitalización básica para pequeñas cuadrillas autónomas.",
      features: [
        `${PLAN_CONFIGS.simple.maxAdmins} Administrador (Oficina)`,
        `${PLAN_CONFIGS.simple.maxTechnicians} Técnicos (Terreno)`,
        `Hasta ${PLAN_CONFIGS.simple.maxClients} Clientes`,
        "Checklists personalizados",
        "Reportes PDF estándar"
      ],
      current: company?.currentPlan === 'simple'
    },
    {
      id: "business",
      config: PLAN_CONFIGS.business,
      price: "1.8 UF",
      period: "/ mes",
      description: "Ideal para PYMES de Energía y Servicios Especializados.",
      features: [
        `${PLAN_CONFIGS.business.maxAdmins} Administradores`,
        `${PLAN_CONFIGS.business.maxTechnicians} Técnicos Incluidos`,
        `Hasta ${PLAN_CONFIGS.business.maxClients} Clientes`,
        "Facturación Electrónica DTE",
        "Firmas Digitales & Sello QR",
        "IA para Resúmenes de Bitácora",
        `Conexión API (${PLAN_CONFIGS.business.maxIoTAssets} Canales IoT)`
      ],
      popular: true,
      current: company?.currentPlan === 'business'
    },
    {
      id: "enterprise",
      config: PLAN_CONFIGS.enterprise,
      price: "3.5 UF",
      period: "/ mes",
      description: "Control total para flotas de alto rendimiento.",
      features: [
        `${PLAN_CONFIGS.enterprise.maxAdmins} Admins / Supervisores`,
        `${PLAN_CONFIGS.enterprise.maxTechnicians} Técnicos Incluidos`,
        `${PLAN_CONFIGS.enterprise.maxClients} Clientes / Activos`,
        "DTE Ilimitado & Automático",
        "Gestión Multi-sucursal",
        `API Ilimitada & ${PLAN_CONFIGS.enterprise.maxIoTAssets} Sensores IoT`
      ],
      current: company?.currentPlan === 'enterprise'
    }
  ];

  const handleRequestUpgrade = (plan: any) => {
    setSelectedPlan(plan);
    setIsUpgrading(true);
  };

  const handleRequestKit = async (type: 'solar' | 'agua') => {
    if (!db || !profile || !company) return;
    setIsRequestingKit(true);
    const subject = type === 'solar' ? "Interés en Kit de Sensores IoT Solar" : "Interés en Monitoreo Hídrico Comunidades";
    try {
      await addDoc(collection(db, "supportTickets"), {
        userId: profile.id, userName: profile.name, companyId: profile.companyId, companyName: company.name,
        subject: subject, description: `El usuario ha solicitado presupuesto para Kit IoT de tipo: ${type}.`,
        status: "open", category: "technical", priority: "high", createdAt: serverTimestamp(), updatedAt: serverTimestamp()
      });
      await sendSystemEmail({
        to: "control@pcgmantenimiento.com", subject: `SOLICITUD KIT IOT [${type.toUpperCase()}] - ${company.name}`,
        html: `<p>Nueva solicitud de Kit Sensores de tipo <strong>${type}</strong> de <strong>${company.name}</strong> por parte de ${profile.name}.</p>`
      });
      toast({ title: "Solicitud Enviada", description: "Un ejecutivo técnico te contactará en breve." });
    } catch (e) { toast({ title: "Error", variant: "destructive" }); } finally { setIsRequestingKit(false); }
  };

  const confirmUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyRef || !rut.trim()) return;
    try {
      updateDocumentNonBlocking(companyRef, { rut: rut.trim(), currentPlan: selectedPlan.id, subscriptionStatus: 'active', updatedAt: serverTimestamp() });
      await addDoc(collection(db!, "supportTickets"), {
        userId: profile?.id, userName: profile?.name, companyId: profile?.companyId, companyName: company?.name,
        subject: `Upgrade a ${selectedPlan.config.name}`, description: `Aumento de plan confirmado vía pasarela. RUT: ${rut.trim()}`,
        status: "open", category: "billing", priority: "high", createdAt: serverTimestamp(), updatedAt: serverTimestamp()
      });
      toast({ title: "Plan Activado", description: `Bienvenido al ${selectedPlan.config.name}.` });
      setIsUpgrading(false);
    } catch (e) { toast({ title: "Error", variant: "destructive" }); }
  };

  if (isAuthLoading || isCompanyLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 pt-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight italic uppercase">Escala tu Operación</h2>
          <p className="text-muted-foreground text-sm font-medium">Digitalización inteligente para el terreno industrial.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className={cn("relative border-2 flex flex-col rounded-[2.5rem] overflow-hidden", plan.popular ? "border-primary scale-105 z-10 shadow-2xl" : "border-slate-100", plan.current && "bg-slate-50")}>
            <CardHeader className="p-8">
              <CardTitle className="text-2xl font-black italic uppercase">{plan.config.name}</CardTitle>
              <div className="text-5xl font-black tracking-tighter mt-2">{plan.price}</div>
              <CardDescription className="pt-4 text-sm font-medium">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-8 pt-0">
              <ul className="space-y-4">
                {plan.features.map((f, i) => <li key={i} className="flex items-start gap-3 text-sm font-bold text-slate-700"><Check className="h-4 w-4 text-emerald-600 mt-0.5" />{f}</li>)}
              </ul>
            </CardContent>
            <CardFooter className="p-8">
              {plan.current ? <Button className="w-full h-14 rounded-2xl font-black uppercase" variant="outline" disabled><ShieldCheck className="mr-2 h-4 w-4" /> Plan Activo</Button> : <Button className="w-full h-14 rounded-2xl font-black uppercase bg-slate-900 text-white" onClick={() => handleRequestUpgrade(plan)}>Mejorar Plan <ArrowRight className="ml-2 h-4 w-4" /></Button>}
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-[3rem] border-none shadow-xl bg-slate-900 text-white p-8 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-10 opacity-10 group-hover:scale-110 transition-transform"><Zap className="h-40 w-40 text-blue-400" /></div>
          <div className="relative z-10 space-y-4">
            <Badge className="bg-blue-600 text-white font-black uppercase text-[9px] px-3 py-1">Oferta PYME Energy</Badge>
            <h3 className="text-2xl font-black italic uppercase leading-none">Monitoreo Solar Pro</h3>
            <p className="text-slate-400 text-sm">¿Instalas paneles? Obtén nuestro kit de sensores pre-configurados para control 24/7.</p>
            <Button variant="outline" className="w-full h-12 rounded-xl bg-white/10 text-white border-white/20 font-black uppercase text-[10px] tracking-widest" onClick={() => handleRequestKit('solar')} disabled={isRequestingKit}>{isRequestingKit ? <Loader2 className="animate-spin h-4 w-4" /> : <><Send className="h-4 w-4 mr-2" /> Pedir Kit IoT</>}</Button>
          </div>
        </Card>

        <Card className="rounded-[3rem] border-none shadow-xl bg-blue-600 text-white p-8 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-10 opacity-10 group-hover:scale-110 transition-transform"><Droplets className="h-40 w-40 text-white" /></div>
          <div className="relative z-10 space-y-4">
            <Badge className="bg-slate-900 text-white font-black uppercase text-[9px] px-3 py-1">Especial Comunidades</Badge>
            <h3 className="text-2xl font-black italic uppercase leading-none">Monitoreo Hídrico</h3>
            <p className="text-blue-100 text-sm">Control de fugas en edificios y condominios. Sensores sin corte de suministro para WC y Matrices.</p>
            <Button variant="outline" className="w-full h-12 rounded-xl bg-white/10 text-white border-white/20 font-black uppercase text-[10px] tracking-widest" onClick={() => handleRequestKit('agua')} disabled={isRequestingKit}>
              {isRequestingKit ? <Loader2 className="animate-spin h-4 w-4" /> : <><Send className="h-4 w-4 mr-2" /> Pedir Evaluación</>}
            </Button>
          </div>
        </Card>

        <Card className="rounded-[3rem] border-2 border-dashed p-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="bg-primary/10 p-4 rounded-3xl"><MessageSquare className="h-10 w-10 text-primary" /></div>
          <div className="space-y-1">
            <h3 className="text-xl font-black italic uppercase">¿Necesitas Escala?</h3>
            <p className="text-slate-500 text-xs">Para flotas masivas o proyectos industriales ad-hoc, contacta a ventas.</p>
          </div>
          <Button asChild variant="outline" className="w-full rounded-xl px-8 font-bold text-[10px] uppercase h-12 border-slate-200"><Link href="/support">Hablar con un Ejecutivo</Link></Button>
        </Card>
      </div>

      {isUpgrading && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <Card className="w-full max-w-md rounded-[2.5rem] bg-white shadow-2xl">
            <CardHeader className="p-10 text-center"><Lock className="h-10 w-10 text-amber-600 mx-auto mb-4" /><CardTitle className="text-2xl font-black italic uppercase">Aumento de Plan</CardTitle></CardHeader>
            <form onSubmit={confirmUpgrade}>
              <CardContent className="px-10 pb-10 space-y-6">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">RUT Facturación</Label><Input placeholder="76.000.000-0" required className="h-14 rounded-xl border-2 font-black text-center" value={rut} onChange={(e) => setRut(e.target.value)} /></div>
                <div className="bg-slate-50 p-6 rounded-2xl text-center border-2 border-dashed"><p className="text-xs font-black uppercase text-slate-400">Total Mensual</p><p className="text-3xl font-black text-primary">{selectedPlan.price}</p></div>
              </CardContent>
              <CardFooter className="px-10 pb-10 flex gap-4"><Button type="button" variant="ghost" className="flex-1 font-black" onClick={() => setIsUpgrading(false)}>Atrás</Button><Button type="submit" className="flex-[2] h-14 rounded-xl bg-primary text-white font-black uppercase shadow-xl">Activar Ahora</Button></form>
            </Card>
        </div>
      )}
    </div>
  );
}
