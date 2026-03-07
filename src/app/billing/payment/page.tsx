
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { doc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  Loader2, 
  ArrowLeft,
  CheckCircle2,
  Building2,
  Receipt
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Company } from "@/lib/types";

export default function PaymentGatewayPage() {
  const { profile, isLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const companyRef = useMemoFirebase(() => 
    db && profile?.companyId ? doc(db, "companies", profile.companyId) : null, 
    [db, profile?.companyId]
  );
  const { data: company } = useDoc<Company>(companyRef);

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyRef) return;

    setIsProcessing(true);
    // Simulación de procesamiento de pasarela (Stripe/Transbank)
    await new Promise(r => setTimeout(r, 2000));

    try {
      updateDocumentNonBlocking(companyRef, {
        currentPlan: 'business',
        subscriptionStatus: 'active',
        trialEndsAt: null, // Fin de trial al pagar
        updatedAt: serverTimestamp()
      });

      toast({
        title: "¡Suscripción Activada!",
        description: "Tu plan Business ya está operativo. Gracias por tu confianza.",
      });
      router.push("/dashboard");
    } catch (e) {
      toast({ title: "Error", description: "No se pudo procesar el pago.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isAuthLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Pasarela de Pago Segura</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden">
              <CardHeader className="bg-slate-900 text-white p-8">
                <CardTitle className="flex items-center gap-3 text-xl font-black uppercase italic">
                  <CreditCard className="h-6 w-6 text-blue-400" /> Datos de Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleProcessPayment} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Titular de la Tarjeta</Label>
                      <Input placeholder="Nombre como aparece en la tarjeta" required className="h-12 border-2 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Número de Tarjeta</Label>
                      <div className="relative">
                        <Input placeholder="0000 0000 0000 0000" required className="h-12 border-2 rounded-xl pl-12" />
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Vencimiento</Label>
                        <Input placeholder="MM/YY" required className="h-12 border-2 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400">CVC</Label>
                        <Input placeholder="123" required className="h-12 border-2 rounded-xl" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 space-y-4">
                    <div className="flex items-center gap-3 text-blue-700">
                      <ShieldCheck className="h-6 w-6" />
                      <p className="text-sm font-bold">Transacción Protegida por Encriptación de 256 bits.</p>
                    </div>
                    <p className="text-[10px] text-blue-600/70 font-medium">Al pulsar "Confirmar Pago", usted acepta los términos de servicio y la política de privacidad de PCGMANTENIMIENTO ERP.</p>
                  </div>

                  <Button type="submit" disabled={isProcessing} className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg uppercase tracking-widest shadow-xl">
                    {isProcessing ? <Loader2 className="animate-spin mr-2" /> : "Confirmar Pago y Activar Plan"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-[2.5rem] border-none shadow-lg bg-white overflow-hidden">
              <CardHeader className="bg-slate-50 p-6 border-b">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" /> Resumen del Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <p className="text-2xl font-black text-slate-900">Plan Business</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Suscripción Mensual</p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Subtotal</span>
                    <span className="font-bold">1.8 UF</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Impuestos</span>
                    <span className="font-bold">Incluidos</span>
                  </div>
                  <div className="h-px bg-slate-100" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-black uppercase text-slate-900">Total Hoy</span>
                    <span className="text-3xl font-black text-blue-600">1.8 UF</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-none shadow-sm bg-slate-900 text-white p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600/20 p-2 rounded-lg text-blue-400"><CheckCircle2 className="h-4 w-4" /></div>
                <p className="text-xs font-bold">Activación inmediata</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-blue-600/20 p-2 rounded-lg text-blue-400"><CheckCircle2 className="h-4 w-4" /></div>
                <p className="text-xs font-bold">Soporte prioritario</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-blue-600/20 p-2 rounded-lg text-blue-400"><CheckCircle2 className="h-4 w-4" /></div>
                <p className="text-xs font-bold">DTE Ilimitado</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
