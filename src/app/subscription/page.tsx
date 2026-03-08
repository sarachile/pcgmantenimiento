
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
  Building2, 
  ShieldCheck, 
  ArrowRight,
  Loader2,
  Lock,
  ArrowLeft,
  Sparkles,
  Receipt,
  Users,
  HardHat,
  Code2,
  Cpu,
  Zap,
  MessageSquare,
  Send
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

  const handleRequestKit = async () => {
    if (!db || !profile || !company) return;
    
    setIsRequestingKit(true);
    try {
      const subject = `SOLICITUD DE KIT SENSORES - ${company.name}`;
      const description = `El usuario ${profile.name} ha solicitado información y presupuesto para el Kit de Sensores IoT Pre-configurados.`;

      // 1. Crear Ticket de Soporte
      await addDoc(collection(db, "supportTickets"), {
        userId: profile.id,
        userName: profile.name,
        companyId: profile.companyId,
        companyName: company.name,
        subject: "Interés en Kit de Sensores IoT",
        description: description,
        status: "open",
        category: "technical",
        priority: "high",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 2. Enviar Email a Super Admin
      await sendSystemEmail({
        to: "control@pcgoperacion.com",
        subject: subject,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #1e3a8a;">Nueva Solicitud de Hardware IoT</h2>
            <p><strong>Empresa:</strong> ${company.name}</p>
            <p><strong>Contacto:</strong> ${profile.name} (${profile.email})</p>
            <p><strong>Requerimiento:</strong> Kit de Sensores Solar Pro</p>
            <hr />
            <p>Por favor, contactar a la brevedad para coordinar envío y facturación del hardware.</p>
          </div>
        `
      });

      toast({
        title: "Solicitud Enviada",
        description: "Un ejecutivo comercial te contactará para coordinar el envío de tu Kit.",
      });
    } catch (error) {
      toast({ title: "Error al procesar", variant: "destructive" });
    } finally {
      setIsRequestingKit(false);
    }
  };

  const confirmUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyRef || !rut.trim() || !profile || !company) return;

    try {
      // 1. Actualizar Documento de Empresa
      updateDocumentNonBlocking(companyRef, {
        rut: rut.trim(),
        requestedPlan: selectedPlan.id,
        subscriptionStatus: 'active',
        currentPlan: selectedPlan.id,
        updatedAt: serverTimestamp()
      });

      // 2. Crear Ticket de Soporte Comercial
      const upgradeMsg = `El usuario ${profile.name} ha realizado un aumento de plan a ${selectedPlan.config.name}. RUT Facturación: ${rut.trim()}.`;
      await addDoc(collection(db!, "supportTickets"), {
        userId: profile.id,
        userName: profile.name,
        companyId: profile.companyId,
        companyName: company.name,
        subject: `Actualización de Plan: ${selectedPlan.config.name}`,
        description: upgradeMsg,
        status: "open",
        category: "billing",
        priority: "high",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 3. Notificar a Administración
      await sendSystemEmail({
        to: "control@pcgoperacion.com",
        subject: `NUEVA SUSCRIPCIÓN ACTIVADA - ${company.name}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #1e3a8a;">Aumento de Plan Detectado</h2>
            <p><strong>Empresa:</strong> ${company.name}</p>
            <p><strong>RUT:</strong> ${rut.trim()}</p>
            <p><strong>Nuevo Plan:</strong> ${selectedPlan.config.name}</p>
            <p><strong>Usuario:</strong> ${profile.name}</p>
            <hr />
            <p>Se ha generado un ticket automático en el panel de control para seguimiento de facturación.</p>
          </div>
        `
      });

      toast({
        title: "Plan Activado",
        description: `Bienvenido al ${selectedPlan.config.name}.`,
      });
      setIsUpgrading(false);
      setSelectedPlan(null);
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  if (isAuthLoading || isCompanyLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 pt-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full"><Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-slate-900 italic uppercase">Escala tu Operación</h2>
          <p className="text-muted-foreground text-sm font-medium">Precios diseñados para capturar valor en la oficina y en el terreno.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={cn(
              "relative border-2 transition-all hover:shadow-2xl flex flex-col rounded-[2.5rem] overflow-hidden group",
              plan.popular ? "border-primary scale-105 z-10 shadow-2xl shadow-primary/10" : "border-slate-100",
              plan.current && "bg-slate-50 ring-4 ring-emerald-500/10"
            )}
          >
            {plan.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black uppercase px-6 py-2 rounded-b-2xl tracking-[0.2em]">
                Recomendado
              </div>
            )}
            <CardHeader className="p-8 pb-4">
              <div className="flex justify-between items-start mb-4">
                <CardTitle className="text-2xl font-black italic tracking-tighter uppercase">{plan.config.name}</CardTitle>
                {plan.current && <Badge variant="default" className="bg-emerald-500 font-black text-[10px] px-3">ACTUAL</Badge>}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black tracking-tighter text-slate-900">{plan.price}</span>
                <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">{plan.period}</span>
              </div>
              <CardDescription className="pt-6 font-medium text-slate-500 leading-relaxed text-sm">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-8 pt-4">
              <ul className="space-y-4">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm font-bold text-slate-700">
                    <div className="bg-emerald-100 p-1 rounded-lg mt-0.5"><Check className="h-3 w-3 text-emerald-600" /></div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-8 pt-6 border-t border-dashed space-y-3">
                {(plan.id === 'enterprise' || plan.id === 'business') && (
                  <div className="bg-slate-900 p-3 rounded-xl border border-white/10 flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-blue-400" />
                    <p className="text-[10px] font-black text-blue-100 uppercase">
                      {plan.id === 'enterprise' ? 'Gateway para Sensores IoT' : 'Canal de Datos IoT PYME'}
                    </p>
                  </div>
                )}
                {plan.id !== 'simple' && (
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-blue-600" />
                    <p className="text-[10px] font-black text-blue-700 uppercase">Facturación Electrónica Incluida</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="p-8 pt-0">
              {plan.current ? (
                <Button className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]" variant="outline" disabled>
                  <ShieldCheck className="h-4 w-4 mr-2" /> Plan Activo
                </Button>
              ) : (
                <Button 
                  className={cn(
                    "w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all active:scale-95", 
                    plan.popular ? "bg-primary hover:bg-primary/90 shadow-primary/20" : "bg-slate-900 shadow-slate-900/20"
                  )} 
                  onClick={() => handleRequestUpgrade(plan)}
                >
                  Cambiar a {plan.config.name}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-[3rem] border-none shadow-xl bg-slate-900 text-white p-10 overflow-hidden relative group">
          <div className="absolute right-0 top-0 p-12 opacity-10 group-hover:scale-110 transition-transform"><Zap className="h-48 w-48 text-blue-400" /></div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
            <div className="space-y-4">
              <Badge className="bg-blue-600 text-white font-black uppercase px-4 py-1 tracking-widest">Oferta PYME Energy</Badge>
              <h3 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Monitoreo Solar Pro</h3>
              <p className="text-slate-400 font-medium max-w-xl text-lg">
                ¿Instalas paneles? Obtén nuestro kit de sensores pre-configurados. Convierte tu servicio técnico en un centro de monitoreo 24/7 para tus clientes.
              </p>
            </div>
            <Button 
              variant="outline" 
              className="h-16 px-10 rounded-2xl bg-white/10 border-white/20 text-white hover:bg-white/20 font-black uppercase text-xs tracking-[0.2em] shadow-2xl gap-2"
              onClick={handleRequestKit}
              disabled={isRequestingKit}
            >
              {isRequestingKit ? <Loader2 className="animate-spin h-4 w-4" /> : <><Send className="h-4 w-4" /> Pedir Kit de Sensores</>}
            </Button>
          </div>
        </Card>

        <Card className="rounded-[3rem] border-2 border-dashed border-slate-200 p-10 flex flex-col justify-center items-center text-center space-y-6">
          <div className="bg-primary/10 p-4 rounded-3xl">
            <MessageSquare className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black italic uppercase tracking-tighter">¿Necesitas Mayor Escala?</h3>
            <p className="text-slate-500 text-sm font-medium max-w-xs mx-auto">
              Para flotas masivas, despliegues multi-regionales o más de 50 activos IoT, contacta directamente con nuestro equipo comercial.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-xl font-bold px-8">
            <Link href="/support">Hablar con un Ejecutivo</Link>
          </Button>
        </Card>
      </div>

      {isUpgrading && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <Card className="w-full max-w-md animate-in zoom-in-95 duration-300 rounded-[2.5rem] border-none shadow-2xl overflow-hidden">
            <CardHeader className="p-10 pb-4 text-center">
              <div className="bg-amber-100 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Lock className="h-10 w-10 text-amber-600" />
              </div>
              <CardTitle className="text-2xl font-black italic tracking-tighter uppercase">Actualización de Plan</CardTitle>
              <CardDescription className="font-bold text-slate-500">
                Está contratando el <strong>{selectedPlan.config.name}</strong>.
              </CardDescription>
            </CardHeader>
            <form onSubmit={confirmUpgrade}>
              <CardContent className="p-10 pt-0 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">RUT Empresa para Facturación</Label>
                  <Input 
                    placeholder="76.000.000-0" 
                    required 
                    className="h-14 rounded-xl border-2 font-black text-center text-lg"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                  />
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200 space-y-4">
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="text-slate-400 uppercase tracking-widest">Inversión Mensual:</span>
                    <span className="text-primary text-2xl tracking-tighter italic">{selectedPlan.price}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span>Vencimiento:</span>
                    <span>Hoy + 30 días</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-10 pt-0 flex gap-4">
                <Button type="button" variant="ghost" className="flex-1 font-black uppercase text-[10px] h-14 rounded-xl" onClick={() => setIsUpgrading(false)}>
                  Atrás
                </Button>
                <Button type="submit" className="flex-[2] font-black uppercase tracking-widest text-[10px] h-14 rounded-xl shadow-xl shadow-primary/20">
                  Confirmar y Activar
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
