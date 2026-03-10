
"use client";

import { useState } from "react";
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
  ShieldCheck,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useAuth } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { cleanRut } from "@/lib/utils-rut";
import Link from "next/link";

export default function StaffLoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const auth = useAuth();
  
  const [rutInput, setRutInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !firestore || !auth) return;

    const cleanRutStr = cleanRut(rutInput);
    
    if (!cleanRutStr || pinInput.length < 6) {
      toast({ 
        title: "Datos incompletos", 
        description: "Verifique su RUT y que el PIN tenga al menos 6 dígitos.", 
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Buscar el email asociado al RUT en la colección global de usuarios
      // El formato es [rut]@[id_empresa].staff.pcg
      const staffQuery = query(
        collection(firestore, "users"), 
        where("email", ">=", cleanRutStr), 
        where("email", "<=", cleanRutStr + "\uf8ff"),
        limit(1)
      );
      
      const staffSnap = await getDocs(staffQuery);
      
      if (staffSnap.empty) {
        throw new Error("No se encontró una cuenta activa para este RUT. ¿Ya activaste tu acceso mediante el link enviado a tu WhatsApp?");
      }

      const targetUser = staffSnap.docs[0].data();
      const email = targetUser.email;

      // 2. Iniciar sesión con Firebase Auth
      await signInWithEmailAndPassword(auth, email, pinInput);
      
      toast({ 
        title: "Acceso Concedido", 
        description: "Bienvenido al equipo de terreno." 
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Login Error:", error);
      
      let friendlyMessage = "RUT o PIN incorrectos. Verifique sus datos.";
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        friendlyMessage = "RUT o PIN incorrectos. Verifique sus datos.";
      } else if (error.code === 'auth/too-many-requests') {
        friendlyMessage = "Demasiados intentos fallidos por seguridad. Reintente en unos minutos.";
      } else {
        friendlyMessage = error.message || "Error inesperado al intentar ingresar.";
      }

      toast({ 
        title: "Fallo de Acceso", 
        description: friendlyMessage, 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2">
          <div className="bg-primary/20 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto border border-primary/30 mb-4">
            <HardHat className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Acceso Técnico</h1>
          <p className="text-slate-400 font-medium uppercase text-[10px] tracking-[0.2em]">PCGMANTENIMIENTO ERP</p>
        </div>

        <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <CardHeader className="bg-white p-8 border-b">
            <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-900">Identificación</CardTitle>
            <CardDescription>Ingresa tu RUT y PIN para ver tus trabajos asignados.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tu RUT</Label>
                <Input 
                  placeholder="12.345.678-9" 
                  className="h-14 rounded-2xl border-2 text-xl font-bold text-center"
                  value={rutInput}
                  onChange={(e) => setRutInput(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">PIN de Acceso (6 dígitos)</Label>
                <Input 
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="******" 
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
              <AlertCircle className="h-3 w-3" /> ¿No has activado tu cuenta?
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed text-left">
              Debes usar el link enviado a tu WhatsApp por tu supervisor para configurar tu PIN inicial.
            </p>
            <Link href="/auth/login" className="text-[10px] font-black text-primary uppercase underline tracking-widest mt-2">
              Acceso Administrativo
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
