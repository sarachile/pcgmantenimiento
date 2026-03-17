
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
  Droplets, 
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Building2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useAuth } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { cleanRut } from "@/lib/utils-rut";
import Link from "next/link";

export default function WaterAdminLoginPage() {
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
      // Buscar el usuario por su RUT en la colección global de usuarios
      // Los administradores de edificio tienen emails virtuales: [rut]@building.pcg
      const adminQuery = query(
        collection(firestore, "users"), 
        where("email", ">=", cleanRutStr), 
        where("email", "<=", cleanRutStr + "\uf8ff"),
        where("role", "==", "buildingAdmin"),
        limit(1)
      );
      
      const adminSnap = await getDocs(adminQuery);
      
      if (adminSnap.empty) {
        throw new Error("No se encontró una cuenta de Administrador de Edificio activa para este RUT.");
      }

      const targetUser = adminSnap.docs[0].data();
      const email = targetUser.email;

      // Iniciar sesión con Firebase Auth
      await signInWithEmailAndPassword(auth, email, pinInput);
      
      toast({ 
        title: "Acceso Concedido", 
        description: "Bienvenido al Panel de Control de Agua IoT." 
      });
      
      router.push('/water-control');
    } catch (error: any) {
      console.error("Login Error:", error);
      
      let friendlyMessage = "RUT o PIN incorrectos. Verifique sus datos.";
      if (error.code === 'auth/too-many-requests') {
        friendlyMessage = "Demasiados intentos fallidos. Reintente en unos minutos.";
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
    <div className="min-h-screen bg-blue-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2">
          <div className="bg-white/20 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto border border-white/30 mb-4 backdrop-blur-md">
            <Droplets className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">PCG AGUA <span className="text-blue-300">IoT</span></h1>
          <p className="text-blue-200 font-medium uppercase text-[10px] tracking-[0.2em]">Acceso Administradores de Edificio</p>
        </div>

        <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <CardHeader className="bg-white p-8 border-b">
            <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-900">Identificación</CardTitle>
            <CardDescription>Ingrese sus credenciales de acceso remoto.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">RUT Administrador</Label>
                <Input 
                  placeholder="12.345.678-9" 
                  className="h-14 rounded-2xl border-2 text-xl font-bold text-center"
                  value={rutInput}
                  onChange={(e) => setRutInput(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 text-left">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">PIN de Seguridad (6 dígitos)</Label>
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
              <Button disabled={isSubmitting} type="submit" className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg uppercase tracking-widest gap-2 shadow-xl shadow-blue-900/20">
                {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : <><ShieldCheck className="h-6 w-6" /> Entrar al Monitor</>}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="bg-slate-50 p-6 flex flex-col gap-4">
            <p className="text-[10px] text-slate-500 leading-relaxed text-left">
              * El PIN de acceso es enviado a su correo corporativo al momento de la instalación de los sensores IoT. Si no lo tiene, contacte a su proveedor de PCGMANTENIMIENTO.
            </p>
            <Link href="/" className="text-[10px] font-black text-blue-600 uppercase underline tracking-widest mt-2">
              Volver al Inicio
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
