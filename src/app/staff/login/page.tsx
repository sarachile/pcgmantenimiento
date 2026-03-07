
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { 
  Loader2, 
  HardHat, 
  ArrowRight,
  ShieldCheck,
  Building2,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { initializeFirebase } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";

export default function StaffLoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  
  const [rutInput, setRutInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { firestore, auth } = useMemo(() => initializeFirebase(), []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanRut = rutInput.replace(/\D/g, '').toLowerCase();
    if (!cleanRut || pinInput.length < 4) {
      toast({ title: "Datos incompletos", description: "Verifique su RUT y PIN.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Encontrar la empresa del técnico (necesitamos el companyId para construir el email sintético)
      // Buscamos en todas las colecciones de staff (proceso costoso pero necesario si no tenemos el link de WhatsApp)
      // MEJORA: Para mayor eficiencia, el link de WhatsApp debería incluir el companyId siempre.
      
      const staffQuery = query(collection(firestore, "users"), where("email", ">=", cleanRut), where("email", "<=", cleanRut + "\uf8ff"));
      const staffSnap = await getDocs(staffQuery);
      
      if (staffSnap.empty) {
        throw new Error("No se encontró una cuenta activa para este RUT. ¿Ya activaste tu acceso?");
      }

      // Encontramos el usuario que coincide exactamente con el formato [rut]@[id].staff.pcg
      const targetUser = staffSnap.docs.find(d => d.data().email.startsWith(`${cleanRut}@`));
      
      if (!targetUser) {
        throw new Error("RUT no registrado.");
      }

      const email = targetUser.data().email;

      // 2. Iniciar sesión
      await signInWithEmailAndPassword(auth, email, pinInput);
      
      toast({ title: "Acceso Concedido", description: "Cargando tu hoja de ruta..." });
      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      toast({ 
        title: "Fallo de Acceso", 
        description: error.message || "Credenciales incorrectas.", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="bg-primary/20 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto border border-primary/30 mb-4">
            <HardHat className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Acceso Técnico</h1>
          <p className="text-slate-400 font-medium uppercase text-[10px] tracking-[0.2em]">PCGMANTENIMIENTO ERP</p>
        </div>

        <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <CardHeader className="bg-white p-8 text-center border-b">
            <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-900">Identificación</CardTitle>
            <CardDescription>Ingresa tu RUT y PIN para ver tus trabajos asignados.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tu RUT</Label>
                <Input 
                  placeholder="12.345.678-9" 
                  className="h-14 rounded-2xl border-2 text-xl font-bold text-center"
                  value={rutInput}
                  onChange={(e) => setRutInput(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">PIN de Acceso</Label>
                <Input 
                  type="password"
                  inputMode="numeric"
                  placeholder="****" 
                  className="h-14 rounded-2xl border-2 text-2xl font-black text-center tracking-[0.5em]"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
              <Button disabled={isSubmitting} type="submit" className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-lg uppercase tracking-widest gap-2">
                {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : <><ShieldCheck className="h-6 w-6" /> Entrar</>}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="bg-slate-50 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
              <AlertCircle className="h-3 w-3" /> ¿Problemas con tu PIN? Contacta a tu supervisor.
            </div>
            <Link href="/auth/login" className="text-[10px] font-black text-primary uppercase underline tracking-widest">
              Acceso Administrativo
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
