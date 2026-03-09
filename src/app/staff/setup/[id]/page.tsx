
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
  Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useAuth, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { StaffMember, Company } from "@/lib/types";
import { cn } from "@/lib/utils";

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

  // Usar hooks en lugar de inicialización directa para mayor estabilidad
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
      toast({ title: "PIN muy corto", description: "Use al menos 6 números (requerido por seguridad).", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Generar email sintético e inalterable
      const cleanRut = staff.identification?.replace(/\D/g, '').toLowerCase();
      const syntheticEmail = `${cleanRut}@${company.id}.staff.pcg`;
      
      // 2. Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, syntheticEmail, pinInput);
      const userId = userCredential.user.uid;

      // 3. Crear documento de usuario
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

      await setDoc(userRef, userData).catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'create',
          requestResourceData: userData
        }));
      });

      // 4. Vincular el staff con el usuario de auth
      const staffRef = doc(firestore, "companies", company.id, "staff", staff.id);
      const staffUpdate = {
        userId: userId,
        hasAccount: true,
        updatedAt: serverTimestamp()
      };

      await updateDoc(staffRef, staffUpdate).catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: staffRef.path,
          operation: 'update',
          requestResourceData: staffUpdate
        }));
      });

      setStep(3);
      toast({ title: "¡Acceso Activado!", description: "Ya puede usar la plataforma." });
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({ title: "Ya activado", description: "Este usuario ya tiene acceso configurado. Inicie sesión directamente.", variant: "destructive" });
        router.push('/staff/login');
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!staff || !company) return <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center"><Card className="p-10 rounded-[2.5rem] border-dashed border-2">Invitación no válida o expirada.</Card></div>;

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
