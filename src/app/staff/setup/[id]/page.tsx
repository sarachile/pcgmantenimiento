
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
  ArrowRight,
  HardHat,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useAuth } from "@/firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { StaffMember, Company } from "@/lib/types";
import { cleanRut } from "@/lib/utils-rut";
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
  const [errorType, setErrorType] = useState<"none" | "invalid" | "company_missing" | "staff_missing">("none");
  const [step, setStep] = useState(1); // 1: Identidad, 2: PIN, 3: Éxito
  
  const [rutInput, setRutInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const firestore = useFirestore();
  const auth = useAuth();

  useEffect(() => {
    async function loadData() {
      if (!companyId || !firestore || !staffId) return;

      try {
        setLoading(true);
        setErrorType("none");

        // 1. Cargar Empresa
        const companyRef = doc(firestore, "companies", companyId);
        const companySnap = await getDoc(companyRef);
        
        if (!companySnap.exists()) {
          setErrorType("company_missing");
          setLoading(false);
          return;
        }
        setCompany({ ...companySnap.data() as Company, id: companyId });

        // 2. Cargar Técnico
        const staffRef = doc(firestore, "companies", companyId, "staff", staffId);
        const staffSnap = await getDoc(staffRef);

        if (!staffSnap.exists()) {
          setErrorType("staff_missing");
          setLoading(false);
          return;
        }

        const staffData = { ...staffSnap.data() as StaffMember, id: staffId };
        setStaff(staffData);

        // 3. Si ya tiene cuenta, redirigir al login
        if (staffData.hasAccount || staffData.userId) {
          toast({ title: "Cuenta ya activa", description: "Inicia sesión con tus credenciales." });
          router.push('/staff/login');
          return;
        }

      } catch (e: any) {
        console.error("Error en Onboarding:", e);
        setErrorType("invalid");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [firestore, staffId, companyId, router, toast]);

  const handleVerifyIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff) return;

    const cleanInput = cleanRut(rutInput);
    const cleanStaffRut = cleanRut(staff.identification || "");

    if (cleanInput === cleanStaffRut) {
      setStep(2);
    } else {
      toast({ title: "RUT no coincide", description: "Verifique que el RUT sea el mismo que el registrado en su empresa.", variant: "destructive" });
    }
  };

  const handleCreateAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff || !company || !auth || !firestore || isSubmitting) return;

    if (pinInput.length < 6) {
      toast({ title: "PIN muy corto", description: "Ingrese exactamente 6 números.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanRutStr = cleanRut(staff.identification || "");
      const email = `${cleanRutStr}@${company.id}.staff.pcg`;
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, pinInput);
      const uid = userCredential.user.uid;

      // Crear Perfil de Usuario
      await setDoc(doc(firestore, "users", uid), {
        id: uid,
        email,
        name: staff.name,
        role: "tecnico",
        companyId: company.id,
        active: true,
        isStaffAccount: true,
        staffId: staff.id,
        createdAt: new Date().toISOString(),
      });

      // Marcar registro de staff como activado
      await updateDoc(doc(firestore, "companies", company.id, "staff", staff.id), {
        userId: uid,
        hasAccount: true,
        updatedAt: serverTimestamp()
      });

      setStep(3);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        router.push('/staff/login');
      } else {
        toast({ title: "Error en registro", description: error.message || "No se pudo crear la cuenta.", variant: "destructive" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xs font-black uppercase tracking-[0.3em]">Validando Invitación Técnica...</p>
      </div>
    );
  }

  if (errorType !== "none") {
    let msg = "Este enlace ya no es válido o los datos fueron reseteados.";
    if (errorType === "company_missing") msg = "La empresa vinculada a este link no existe.";
    if (errorType === "staff_missing") msg = "El registro de técnico asociado a este link fue eliminado.";

    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <Card className="max-w-md w-full rounded-[2.5rem] shadow-2xl border-none overflow-hidden text-center bg-white">
          <CardHeader className="bg-rose-50 p-10 space-y-4">
            <AlertTriangle className="h-12 w-12 text-rose-600 mx-auto" />
            <CardTitle className="text-xl font-black uppercase italic text-rose-900">Invitación Caducada</CardTitle>
            <CardDescription className="font-bold text-rose-700">{msg}</CardDescription>
          </CardHeader>
          <CardContent className="p-10 space-y-4">
            <p className="text-sm text-slate-500 italic">Pida a su supervisor que genere un nuevo link de invitación desde el panel de personal.</p>
            <Button className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase" asChild><Link href="/staff/login">Ir al Inicio de Sesión</Link></Button>
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
          <p className="text-slate-400 font-medium uppercase text-[10px] tracking-widest">{company?.name}</p>
        </div>

        {step === 1 && (
          <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 bg-white">
            <CardHeader className="p-8 text-center border-b">
              <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-900">Paso 1: Identidad</CardTitle>
              <CardDescription>Hola <strong>{staff?.name}</strong>, ingresa tu RUT para confirmar.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleVerifyIdentity} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tu RUT</Label>
                  <Input placeholder="Ej: 12345678-9" className="h-14 rounded-2xl border-2 text-xl font-bold text-center" value={rutInput} onChange={(e) => setRutInput(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-lg uppercase tracking-widest gap-2 shadow-xl">
                  Validar Identidad <ArrowRight className="h-5 w-5" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden animate-in slide-in-from-right-4 bg-white">
            <CardHeader className="p-8 text-center border-b">
              <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-900">Paso 2: Seguridad</CardTitle>
              <CardDescription>Crea un PIN de 6 dígitos para entrar.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleCreateAccess} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nuevo PIN de Acceso</Label>
                  <Input type="password" inputMode="numeric" maxLength={6} placeholder="******" className="h-16 rounded-2xl border-2 text-3xl font-black text-center tracking-[0.5em]" value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))} required />
                </div>
                <Button disabled={isSubmitting} type="submit" className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg uppercase tracking-widest gap-2 shadow-xl">
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
            <p className="text-slate-500 font-bold mb-10 leading-relaxed">Tu cuenta ha sido vinculada correctamente. Ya puedes entrar con tu RUT y PIN.</p>
            <Button className="w-full h-16 rounded-2xl bg-slate-900 font-black uppercase tracking-widest text-white shadow-xl" onClick={() => router.push('/staff/login')}>Entrar al ERP Técnico</Button>
          </Card>
        )}
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
