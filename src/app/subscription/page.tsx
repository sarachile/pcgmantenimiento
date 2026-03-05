
"use client";

import { useState, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { doc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  CreditCard, 
  Building2, 
  Users, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  Loader2,
  Lock,
  MessageSquare,
  ArrowLeft,
  Smartphone,
  Sparkles,
  Signature,
  Receipt
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Company } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { PLAN_CONFIGS } from "@/lib/plan-configs";

export default function SubscriptionPage() {
  const { profile, isLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [rut, setRut] = useState("");

  const companyRef = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return doc(db, "companies", profile.companyId);
  }, [db, profile?.companyId]);

  const { data: company, isLoading: isCompanyLoading } = useDoc<Company>(companyRef);

  const plans = [
    {
      id: "simple",
      config: PLAN_CONFIGS.simple,
      price: "0.8 UF",
      period: "/ mes",
      description: "Digitalización básica para pequeñas cuadrillas.",
      features: [
        `Hasta ${PLAN_CONFIGS.simple.maxTechnicians} Técnicos`,
        `Hasta ${PLAN_CONFIGS.simple.maxClients} Clientes`,
        "Reportes PDF estándar",
        "Checklists personalizados"
      ],
      current: company?.currentPlan === 'simple'
    },
    {
      id: "business",
      config: PLAN_CONFIGS.business,
      price: "1.8 UF",
      period: "/ mes",
      description: "Operación avanzada con respaldo legal y offline.",
      features: [
        `Hasta ${PLAN_CONFIGS.business.maxTechnicians} Técnicos`,
        `Hasta ${PLAN_CONFIGS.business.maxClients} Clientes`,
        "Facturación Electrónica DTE",
        "Firma Digital Advanced",
        "Modo Offline Inteligente",
        "Resúmenes IA (Genkit)"
      ],
      popular: true,
      current: company?.currentPlan === 'business'
    },
    {
      id: "enterprise",
      config: PLAN_CONFIGS.enterprise,
      price: "3.5 UF",
      period: "/ mes",
      description: "Control total para empresas multi-sucursal.",
      features: [
        `Hasta ${PLAN_CONFIGS.enterprise.maxTechnicians} Técnicos`,
        "DTE Ilimitado & Automatización",
        "Gestión de Sucursales",
        "API de integración",
        "Soporte Prioritario 24/7",
        "Reportes BI Avanzados"
      ],
      current: company?.currentPlan === 'enterprise'
    }
  ];

  const handleRequestUpgrade = (plan: any) => {
    setSelectedPlan(plan);
    setIsUpgrading(true);
  };

  const confirmUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyRef || !rut.trim()) {
      toast({
        title: "Dato Requerido",
        description: "El RUT es obligatorio para formalizar la contratación.",
        variant: "destructive"
      });
      return;
    }

    try {
      updateDocumentNonBlocking(companyRef, {
        rut: rut.trim(),
        requestedPlan: selectedPlan.id,
        subscriptionStatus: 'active',
        currentPlan: selectedPlan.id,
        updatedAt: serverTimestamp()
      });

      toast({
        title: "Solicitud Procesada",
        description: `Tu ${selectedPlan.config.name} ha sido activado exitosamente.`,
      });
      setIsUpgrading(false);
      setSelectedPlan(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar la suscripción.",
        variant: "destructive"
      });
    }
  };

  if (isAuthLoading || isCompanyLoading) {
    return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-slate-900 italic">Escalabilidad Industrial</h2>
          <p className="text-muted-foreground text-sm font-medium">Seleccione el nivel de potencia que su operación requiere hoy.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={cn(
              "relative border-2 transition-all hover:shadow-xl flex flex-col rounded-[2rem] overflow-hidden",
              plan.popular ? "border-primary scale-105 z-10 shadow-2xl" : "border-border",
              plan.current && "bg-slate-50"
            )}
          >
            {plan.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black uppercase px-6 py-1.5 rounded-b-xl tracking-widest">
                Recomendado
              </div>
            )}
            <CardHeader className="p-8 pb-4">
              <div className="flex justify-between items-start mb-2">
                <CardTitle className="text-2xl font-black italic tracking-tighter">{plan.config.name}</CardTitle>
                {plan.current && <Badge variant="default" className="bg-emerald-500 font-black">ACTUAL</Badge>}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black tracking-tighter">{plan.price}</span>
                <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">{plan.period}</span>
              </div>
              <CardDescription className="pt-4 font-medium text-slate-500 leading-relaxed">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-8 pt-4">
              <ul className="space-y-4">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                    <div className="bg-emerald-100 p-1 rounded-full"><Check className="h-3 w-3 text-emerald-600" /></div>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <div className="mt-8 pt-6 border-t border-dashed space-y-3">
                {plan.id === 'business' && (
                  <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    <Receipt className="h-3 w-3" /> Incluye Emisión DTE
                  </div>
                )}
                {plan.id === 'enterprise' && (
                  <div className="flex items-center gap-2 text-[10px] font-black text-purple-600 uppercase tracking-widest">
                    <Sparkles className="h-3 w-3" /> Reportes GenAI + Multi-sucursal
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="p-8 pt-0">
              {plan.current ? (
                <Button className="w-full h-14 rounded-2xl" variant="outline" disabled>
                  <ShieldCheck className="h-5 w-5 mr-2" />
                  Gestionar Plan
                </Button>
              ) : (
                <Button 
                  className={cn("w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg", plan.popular ? "bg-primary hover:bg-primary/90" : "bg-slate-900")} 
                  onClick={() => handleRequestUpgrade(plan)}
                >
                  Activar {plan.config.name}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="rounded-[2rem] border-none shadow-sm bg-indigo-600 text-white p-8 overflow-hidden relative group">
        <div className="absolute right-0 top-0 p-10 opacity-10 group-hover:scale-110 transition-transform"><Building2 className="h-40 w-40" /></div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="space-y-2">
            <h3 className="text-3xl font-black italic tracking-tighter uppercase">¿Flotas de más de 100 técnicos?</h3>
            <p className="text-indigo-100 font-medium max-w-xl">
              Diseñamos infraestructuras dedicadas con SLA garantizado y soporte técnico en sitio para grandes operaciones de mantenimiento.
            </p>
          </div>
          <Button variant="outline" className="h-14 px-8 rounded-2xl bg-white/10 border-white/20 text-white hover:bg-white/20 font-black uppercase text-xs tracking-widest">
            Contactar Corporativo
          </Button>
        </div>
      </Card>

      {isUpgrading && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <Card className="w-full max-w-md animate-in zoom-in-95 rounded-[2.5rem] border-none shadow-2xl overflow-hidden">
            <CardHeader className="p-10 pb-4 text-center">
              <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-amber-600" />
              </div>
              <CardTitle className="text-2xl font-black italic tracking-tighter">Suscripción Legal</CardTitle>
              <CardDescription className="font-medium">
                Contratando <strong>{selectedPlan.config.name}</strong> por {selectedPlan.price} al mes.
              </CardDescription>
            </CardHeader>
            <form onSubmit={confirmUpgrade}>
              <CardContent className="p-10 pt-0 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">RUT Empresa (Obligatorio)</Label>
                  <Input 
                    placeholder="76.000.000-0" 
                    required 
                    className="h-12 rounded-xl border-2 font-bold"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                  />
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl space-y-3 border-2 border-dashed">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400 uppercase">Plan:</span>
                    <span className="text-slate-900 uppercase">{selectedPlan.id}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400 uppercase">Valor:</span>
                    <span className="text-primary text-lg">{selectedPlan.price}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-10 pt-0 flex gap-3">
                <Button type="button" variant="ghost" className="flex-1 font-bold h-12 rounded-xl" onClick={() => setIsUpgrading(false)}>
                  Atrás
                </Button>
                <Button type="submit" className="flex-[2] font-black uppercase tracking-widest h-12 rounded-xl">
                  Confirmar
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
