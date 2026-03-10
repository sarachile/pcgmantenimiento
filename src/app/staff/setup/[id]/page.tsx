
"use client";

import { use, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Loader2, 
  ShieldCheck, 
  KeyRound, 
  ArrowRight,
  HardHat,
  CheckCircle2,
  Lock,
  AlertTriangle,
  RefreshCw,
  Building2,
  UserX,
  UserCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useAuth } from "@/firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { StaffMember, Company } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

function StaffSetupContent({ params }: { params: { id: string } }) {
  const staffId = params.id;
  const searchParams = useSearchParams();
  const companyId = searchParams.get('c');
  const { toast } = useToast();
  const router = useRouter();
  
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState<"none" | "no_company" | "no_staff" | "generic">("none");
  const [step, setStep] = useState(1); // 1: Verify Identity, 2: Set PIN, 3: Success
  
  const [rutInput, setRutInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const firestore = useFirestore();
  const auth = useAuth();

  useEffect(() => {
    async function loadData() {
      // Esperar a que los parámetros estén disponibles antes de marcar error
      if (!companyId || !firestore || !staffId) {
        return;
      }

      try {
        setErrorType("none");
        setLoading(true);
        
        // 1. Verificar Empresa
        const companyDoc = await getDoc(doc(firestore, "companies", companyId));
        if (!companyDoc.exists()) {
          setErrorType("no_company");
          setLoading(false);
          return;
        }
        const companyData = { ...companyDoc.data() as Company, id: companyId };
        setCompany(companyData);

        // 2. Verificar Registro del Técnico
        const staffDoc = await getDoc(doc(firestore, "companies", companyId, "staff", staffId));
        if (!staffDoc.exists()) {
          setErrorType("no_staff");
          setLoading(false);
          return;
        }
        
        const staffData = { ...staffDoc.data() as StaffMember, id: staffId };
        setStaff(staffData);

        // 3. VALIDACIÓN CRÍTICA: ¿Ya tiene cuenta?
        if (staffData.hasAccount || staffData.userId) {
          toast({
            title: "Cuenta ya activa",
            description: "Ya configuraste tu acceso anteriormente. Redirigiendo al login...",
          });
          // Esperamos un momento para que el usuario lea el toast y luego redirigimos
          setTimeout(() => router.push('/staff/login'), 2000);
          return;
        }

        setErrorType("none");

      } catch (e: any) {
        console.error("Error loading setup data:", e);
        // Si es un error de permisos, es probable que los datos existan pero haya un bloqueo
        if (e.message?.includes("permission")) {
          setErrorType("generic");
        } else {
          setErrorType("generic");
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [firestore, staffId, companyId, router, toast]);

  const handleVerifyIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff) return;

    // Limpieza agresiva de RUT
    const cleanInput = rutInput.replace(/\D/g, '').toUpperCase();
    const cleanStaffRut = staff.identification?.replace(/\D/g, '').toUpperCase();

    if (cleanInput === cleanStaffRut) {
      setStep(2);
      toast({ title: "Identidad Confirmada", description: "Define tu PIN de 6 números ahora." });
    } else {
      toast({ 
        title: "RUT Incorrecto", 
        description: "El RUT no coincide con la invitación enviada.", 
        variant: "destructive" 
      });
    }
  };

  const handleCreateAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff || !company || !auth || !firestore || isSubmitting) return;

    if (pinInput.length < 6) {
      toast({ title: "PIN inválido", description: "Debes ingresar exactamente 6 números.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanRut = staff.identification?.replace(/\D/g, '').toLowerCase();
      const syntheticEmail = `${cleanRut}@${company.id}.staff.pcg`;
      
      let userId = "";
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, syntheticEmail, pinInput);
        userId = userCredential.user.uid;
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          // El usuario ya existe en Auth, posiblemente por un intento previo fallido
          // Intentamos recuperar o simplemente informamos que ya está listo
          setStep(3);
          return;
        }
        throw authError;
      }

      // Crear Perfil Global Atómico
      const userRef = doc(firestore, "users", userId);
      await setDoc(userRef, {
        id: userId,
        email: syntheticEmail,
        name: staff.name,
        role: "tecnico",
        companyId: company.id,
        active: true,
        isStaffAccount: true,
        staffId: staff.id,
        createdAt: new Date().toISOString(),
      });

      // Vincular Registro Staff Atómico
      const staffRef = doc(firestore, "companies", company.id, "staff", staff.id);
      await updateDoc(staffRef, {
        userId: userId,
        hasAccount: true,
        updatedAt: serverTimestamp()
      });

      setStep(3);
      toast({ title: "Acceso Creado", description: "¡Bienvenido a PCGMANTENIMIENTO!" });
    } catch (error: any) {
      console.error("Setup Error:", error);
      toast({ 
        title: "Fallo en Registro", 
        description: "No pudimos crear tu acceso. Contacta a tu supervisor.", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xs font-black uppercase tracking-[0.3em] animate-pulse">Autenticando Invitación...</p>
      </div>
    );
  }
  
  if (errorType !== "none" || !staff || !company) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <Card className="max-w-md w-full rounded-[2.5rem] shadow-2xl border-none overflow-hidden animate-in zoom-in-95">
          <CardHeader className="bg-rose-50 p-10 space-y-4">
            <div className="bg-rose-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="h-10 w-10 text-rose-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black uppercase tracking-tighter italic text-rose-900">
                Invitación Pendiente
              </CardTitle>
              <CardDescription className="text-rose-700 font-medium">
                No pudimos validar tu enlace de registro en este momento.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-6">
            <p className="text-sm text-slate-500 leading-relaxed">
              Esto puede ocurrir si el administrador borró tu registro o si el link tiene un error de copia.
            </p>
            <div className="flex flex-col gap-3">
              <Button className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest gap-2" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4" /> Reintentar Carga
              </Button>
              <Button variant="outline" className="w-full h-12 rounded-xl font-bold" asChild>
                <Link href="/staff/login">Ir al Inicio de Sesión</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="bg-primary/20 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto border border-primary/30 mb-4">
            <HardHat className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Activa tu Acceso</h1>
          <p className="text-slate-400 font-medium uppercase text-[10px] tracking-widest">{company.name}</p>
        </div>

        {step === 1 && (
          <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <CardHeader className="bg-white p-8 text-center border-b">
              <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-900">Paso 1: Identidad</CardTitle>
              <CardDescription>Hola <strong>{staff.name}</strong>, ingresa tu RUT para confirmar que eres tú.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleVerifyIdentity} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tu RUT (solo números)</Label>
                  <Input 
                    placeholder="Ej: 123456789" 
                    className="h-14 rounded-2xl border-2 text-xl font-bold text-center"
                    value={rutInput}
                    onChange={(e) => setRutInput(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-lg uppercase tracking-widest gap-2 shadow-xl shadow-slate-900/20">
                  Validar Identidad <ArrowRight className="h-5 w-5" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden animate-in slide-in-from-right-4">
            <CardHeader className="bg-white p-8 text-center border-b">
              <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-900">Paso 2: Seguridad</CardTitle>
              <CardDescription>Crea un PIN de 6 dígitos. No lo olvides, lo usarás para entrar siempre.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleCreateAccess} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nuevo PIN de Acceso</Label>
                  <Input 
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="******" 
                    className="h-16 rounded-2xl border-2 text-3xl font-black text-center tracking-[0.5em]"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
                <Button disabled={isSubmitting} type="submit" className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg uppercase tracking-widest gap-2 shadow-xl shadow-primary/20">
                  {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : <><ShieldCheck className="h-6 w-6" /> Terminar Registro</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="rounded-[3rem] border-none shadow-2xl p-12 text-center bg-white animate-in zoom-in-95">
            <div className="bg-emerald-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-100">
              <UserCheck className="h-12 w-12 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter uppercase italic">¡Acceso Activo!</h2>
            <p className="text-slate-500 font-bold mb-10 leading-relaxed">Tu cuenta ha sido vinculada correctamente. Ya puedes entrar con tu RUT y el PIN que definiste.</p>
            <Button className="w-full h-16 rounded-2xl bg-slate-900 font-black uppercase tracking-widest text-white shadow-xl" onClick={() => router.push('/staff/login')}>
              Entrar al ERP Técnico
            </Button>
          </Card>
        )}

        <p className="text-center text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">PCGMANTENIMIENTO ERP - © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}

export default function StaffSetupPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <StaffSetupContent params={resolvedParams} />
    </Suspense>
  );
}
