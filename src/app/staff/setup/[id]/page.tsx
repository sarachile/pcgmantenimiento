
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
  RefreshCw
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
  const [step, setStep] = useState(1); // 1: Verify Identity, 2: Set PIN, 3: Success
  
  const [rutInput, setRutInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const firestore = useFirestore();
  const auth = useAuth();

  useEffect(() => {
    async function loadData() {
      if (!companyId || !firestore) {
        setLoading(false);
        return;
      }
      try {
        const companyDoc = await getDoc(doc(firestore, "companies", companyId));
        if (companyDoc.exists()) {
          setCompany({ ...companyDoc.data() as Company, id: companyId });
          const staffDoc = await getDoc(doc(firestore, "companies", companyId, "staff", staffId));
          if (staffDoc.exists()) {
            setStaff({ ...staffDoc.data() as StaffMember, id: staffId });
          }
        }
      } catch (e) {
        console.error("Error loading setup data:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [firestore, staffId, companyId]);

  const handleVerifyIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff) return;

    const cleanInput = rutInput.replace(/\D/g, '').toUpperCase();
    const cleanStaffRut = staff.identification?.replace(/\D/g, '').toUpperCase();

    if (cleanInput === cleanStaffRut) {
      setStep(2);
      toast({ title: "Identidad Confirmada", description: "Ahora defina su clave de acceso." });
    } else {
      toast({ title: "RUT Incorrecto", description: "El RUT ingresado no coincide con nuestros registros.", variant: "destructive" });
    }
  };

  const handleCreateAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff || !company || !auth || !firestore || isSubmitting) return;

    if (pinInput.length < 6) {
      toast({ title: "Seguridad insuficiente", description: "El PIN debe tener exactamente 6 números.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Generar email sintético e inalterable
      const cleanRut = staff.identification?.replace(/\D/g, '').toLowerCase();
      const syntheticEmail = `${cleanRut}@${company.id}.staff.pcg`;
      
      let userId = "";
      try {
        // 2. Crear usuario en Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, syntheticEmail, pinInput);
        userId = userCredential.user.uid;
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          toast({ 
            title: "Cuenta ya activa", 
            description: "Ya tienes acceso configurado. Redirigiendo al inicio de sesión..." 
          });
          setTimeout(() => router.push('/staff/login'), 2500);
          return;
        }
        throw authError;
      }

      // 3. Crear documento de usuario (Perfil Firestore)
      const userRef = doc(firestore, "users", userId);
      const userData = {
        id: userId,
        email: syntheticEmail,
        name: staff.name,
        role: "tecnico",
        companyId: company.id,
        active: true,
        isStaffAccount: true,
        staffId: staff.id,
        createdAt: new Date().toISOString(),
      };

      await setDoc(userRef, userData);

      // 4. Vincular el staff con el usuario de auth
      const staffRef = doc(firestore, "companies", company.id, "staff", staff.id);
      await updateDoc(staffRef, {
        userId: userId,
        hasAccount: true,
        updatedAt: serverTimestamp()
      });

      setStep(3);
      toast({ title: "¡Acceso Activado!", description: "Bienvenido al equipo digital." });
    } catch (error: any) {
      console.error("Setup Error:", error);
      
      let friendlyMessage = "No se pudo crear el acceso en este momento.";
      if (error.code === 'auth/weak-password') {
        friendlyMessage = "El PIN es demasiado sencillo. Use otra combinación.";
      } else if (error.code === 'permission-denied') {
        friendlyMessage = "Error de permisos temporales. Por favor reintente en unos segundos.";
      }

      toast({ 
        title: "Fallo en registro", 
        description: friendlyMessage, 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  
  if (!staff || !company) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <Card className="max-w-md w-full rounded-[2.5rem] shadow-2xl border-none overflow-hidden animate-in zoom-in-95">
          <CardHeader className="bg-rose-50 p-10 space-y-4">
            <div className="bg-rose-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="h-10 w-10 text-rose-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black uppercase tracking-tighter italic text-rose-900">Enlace no Válido</CardTitle>
              <CardDescription className="text-rose-700 font-medium">Esta invitación ha expirado o los datos fueron reseteados.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-6">
            <p className="text-sm text-slate-500 leading-relaxed">
              Si la base de datos fue reiniciada recientemente, los enlaces antiguos ya no funcionan. Por favor, solicita a tu supervisor que te envíe un <strong>nuevo link de invitación</strong> desde el panel de control.
            </p>
            <Button className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest gap-2" asChild>
              <Link href="/staff/login"><RefreshCw className="h-4 w-4" /> Ir al Login Técnico</Link>
            </Button>
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
          <p className="text-slate-400 font-medium">{company.name}</p>
        </div>

        {step === 1 && (
          <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <CardHeader className="bg-white p-8 text-center border-b">
              <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-900">Paso 1: Identidad</CardTitle>
              <CardDescription>Para comenzar, ingresa tu RUT para validar que eres <strong>{staff.name}</strong>.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleVerifyIdentity} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tu RUT (solo números)</Label>
                  <Input 
                    placeholder="Ej: 123456789" 
                    className="h-14 rounded-2xl border-2 text-xl font-bold text-center"
                    value={rutInput}
                    onChange={(e) => setRutInput(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-lg uppercase tracking-widest gap-2">
                  Validar Datos <ArrowRight className="h-5 w-5" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden animate-in slide-in-from-right-4">
            <CardHeader className="bg-white p-8 text-center border-b">
              <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-900">Paso 2: Seguridad</CardTitle>
              <CardDescription>Crea un PIN numérico. Esta será tu clave personal para entrar a la aplicación.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleCreateAccess} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Define tu PIN (6 números)</Label>
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
                <Button disabled={isSubmitting} type="submit" className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg uppercase tracking-widest gap-2">
                  {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : <><ShieldCheck className="h-6 w-6" /> Activar mi Cuenta</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="rounded-[3rem] border-none shadow-2xl p-12 text-center bg-white animate-in zoom-in-95">
            <div className="bg-emerald-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-100">
              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter uppercase italic">¡Todo Listo!</h2>
            <p className="text-slate-500 font-bold mb-10 leading-relaxed">Tu acceso técnico ha sido activado. Ahora puedes entrar con tu RUT y el PIN que acabas de crear.</p>
            <Button className="w-full h-16 rounded-2xl bg-slate-900 font-black uppercase tracking-widest text-white shadow-xl" onClick={() => router.push('/staff/login')}>
              Entrar al Dashboard Técnico
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <StaffSetupContent params={resolvedParams} />
    </Suspense>
  );
}
