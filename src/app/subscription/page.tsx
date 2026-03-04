
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
  MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Company } from "@/lib/types";
import { cn } from "@/lib/utils";

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
      id: "free",
      name: "Plan Inicio (Demo)",
      price: "0 UF",
      description: "Prueba las capacidades del sistema sin costo.",
      features: [
        "Hasta 1 Empresa cliente",
        "1 Usuario administrador",
        "Reportes básicos",
        "Acceso a Calendario"
      ],
      current: company?.currentPlan === 'free' || !company?.currentPlan
    },
    {
      id: "pro",
      name: "Plan Pro",
      price: "1,5 UF",
      period: "/ mes",
      description: "Ideal para empresas en crecimiento que buscan estandarizar su operación.",
      features: [
        "Hasta 5 Empresas clientes",
        "Hasta 3 Usuarios operativos",
        "Firma digital avanzada",
        "Soporte vía Ticket"
      ],
      popular: true,
      current: company?.currentPlan === 'pro'
    },
    {
      id: "enterprise",
      name: "Plan Enterprise",
      price: "2,5 UF",
      period: "/ mes",
      description: "Potencia tu operación industrial con límites extendidos y control total.",
      features: [
        "Hasta 15 Empresas clientes",
        "Hasta 5 Usuarios operativos",
        "Reportes IA ilimitados",
        "Soporte prioritario 24/7"
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
        description: `Tu ${selectedPlan.name} ha sido activado exitosamente.`,
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
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black tracking-tight text-primary">Planes y Escalabilidad</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Gestiona el crecimiento de tu operación de mantenimiento con planes diseñados para la industria.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={cn(
              "relative border-2 transition-all hover:shadow-md flex flex-col",
              plan.popular ? "border-primary scale-105 z-10" : "border-border",
              plan.current && "bg-muted/10"
            )}
          >
            {plan.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] font-black uppercase px-3 py-1 rounded-full">
                Más Popular
              </div>
            )}
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                {plan.current && <Badge variant="default" className="bg-emerald-500">ACTIVO</Badge>}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className="text-muted-foreground text-sm font-medium">{plan.period}</span>
              </div>
              <CardDescription className="pt-2">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-6">
              {plan.current ? (
                <Button className="w-full" variant="outline" disabled>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Plan Actual
                </Button>
              ) : (
                <Button 
                  className={cn("w-full", plan.popular ? "bg-primary" : "")} 
                  onClick={() => handleRequestUpgrade(plan)}
                >
                  {plan.id === 'free' ? "Volver al Inicio" : "Solicitar Activación"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm bg-primary/5 p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              ¿Necesitas más capacidad?
            </h3>
            <p className="text-sm text-muted-foreground">
              Para empresas con más de 15 clientes o flotas grandes, diseñamos soluciones a medida caso a caso.
            </p>
          </div>
          <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
            Contactar Ejecutivo Comercial
          </Button>
        </div>
      </Card>

      {/* Modal de Upgrade */}
      {isUpgrading && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md animate-in zoom-in-95">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-amber-500" />
                Formalizar Suscripción
              </CardTitle>
              <CardDescription>
                Estás solicitando el <strong>{selectedPlan.name}</strong> por {selectedPlan.price} mensual.
              </CardDescription>
            </CardHeader>
            <form onSubmit={confirmUpgrade}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rut-legal">RUT de la Empresa (Facturación)</Label>
                  <Input 
                    id="rut-legal" 
                    placeholder="76.000.000-0" 
                    required 
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground italic">
                    * El RUT es obligatorio para la emisión de facturas y activación del plan.
                  </p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Plan seleccionado:</span>
                    <span className="font-bold">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Valor mensual:</span>
                    <span className="font-bold text-primary">{selectedPlan.price}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-3">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsUpgrading(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  Confirmar y Contratar
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
