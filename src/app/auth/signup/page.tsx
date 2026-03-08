
"use client";

import { useState } from 'react';
import { useAuth, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ShieldPlus, 
  Loader2, 
  Building2, 
  KeyRound, 
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addDays } from 'date-fns';

const SUPERADMIN_EMAIL = 'control@pcgoperacion.com';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [signupMode, setSignupMode] = useState<'new' | 'join'>('new');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      toast({ title: "Acción requerida", description: "Debe aceptar los términos y condiciones.", variant: "destructive" });
      return;
    }
    setLoading(true);
    
    const cleanEmail = email.toLowerCase().trim();
    const isSuperAdminAccount = cleanEmail === SUPERADMIN_EMAIL;

    try {
      let targetCompanyId = "";
      let role = "";

      // 1. Validaciones previas a Auth
      if (signupMode === 'new') {
        if (!companyName.trim()) throw new Error("Debe ingresar el nombre de su empresa.");
        targetCompanyId = `comp-${Math.random().toString(36).substr(2, 8)}`;
        role = 'companyAdmin';
      } else {
        if (!companyCode.trim()) throw new Error("Debe ingresar el código de vinculación.");
        targetCompanyId = companyCode.trim();
        const companySnap = await getDoc(doc(db!, 'companies', targetCompanyId));
        if (!companySnap.exists()) throw new Error("El código de acceso no es válido.");
        const companyData = companySnap.data();
        if (!companyData.isActive) throw new Error("Esta empresa se encuentra suspendida.");
        role = 'tecnico';
      }

      if (isSuperAdminAccount) {
        targetCompanyId = 'pcg-central';
        role = 'superadmin';
      }

      // 2. Crear usuario en Auth (esto nos da el UID y nos autentica)
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const uid = userCredential.user.uid;

      // 3. Crear empresa si es nueva (Non-blocking)
      if (signupMode === 'new' || isSuperAdminAccount) {
        const trialEndDate = addDays(new Date(), 14).toISOString();
        const companyData = {
          id: targetCompanyId,
          name: isSuperAdminAccount ? 'PCG Central' : companyName.trim(),
          rut: 'RUT por definir',
          isActive: true,
          currentPlan: 'simple',
          subscriptionStatus: 'active',
          createdAt: new Date().toISOString(),
          trialEndsAt: trialEndDate
        };
        setDocumentNonBlocking(doc(db!, 'companies', targetCompanyId), companyData, { merge: true });
      }

      // 4. Crear perfil de usuario (Non-blocking)
      const userData = {
        id: uid,
        email: cleanEmail,
        name: name,
        role: role,
        companyId: targetCompanyId,
        active: true,
        createdAt: new Date().toISOString(),
      };
      setDocumentNonBlocking(doc(db!, 'users', uid), userData, { merge: true });

      toast({ title: "Registro Completo", description: "Bienvenido a la plataforma." });
      
      // Proceder inmediatamente al dashboard (Firestore local cache manejará la consistencia)
      router.push('/dashboard');
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg space-y-4">
        <Button variant="ghost" asChild className="text-slate-500 hover:text-primary mb-2">
          <Link href="/"><ArrowLeft className="h-4 w-4 mr-2" /> Volver al Inicio</Link>
        </Button>
        <Card className="w-full border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="space-y-1 flex flex-col items-center p-10">
            <div className="bg-primary/10 p-4 rounded-3xl mb-4"><ShieldPlus className="h-10 w-10 text-primary" /></div>
            <CardTitle className="text-3xl font-black tracking-tighter uppercase italic">Empezar Ahora</CardTitle>
            <CardDescription className="text-base font-medium">Digitalice su operación técnica en minutos.</CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-6 px-10 pb-6">
              <Tabs defaultValue="new" onValueChange={(v) => setSignupMode(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-14 bg-slate-100 rounded-2xl p-1 mb-6">
                  <TabsTrigger value="new" className="rounded-xl font-black uppercase text-[10px] tracking-widest">Registrar Empresa</TabsTrigger>
                  <TabsTrigger value="join" className="rounded-xl font-black uppercase text-[10px] tracking-widest">Unirme a Empresa</TabsTrigger>
                </TabsList>
                <TabsContent value="new" className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre Empresa</Label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input placeholder="Ej: Mantenimiento S.A." className="h-14 pl-12 rounded-2xl border-2 font-bold" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="join" className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Código de Vinculación</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input placeholder="comp-xxxxxx" className="h-14 pl-12 rounded-2xl border-2 font-mono font-bold" value={companyCode} onChange={(e) => setCompanyCode(e.target.value)} />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre</Label><Input placeholder="Juan Soto" required className="h-12 rounded-xl border-2 font-bold" value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email</Label><Input type="email" placeholder="nombre@empresa.cl" required className="h-12 rounded-xl border-2 font-bold" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              </div>
              
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Contraseña</Label><Input type="password" placeholder="Mínimo 6 caracteres" required className="h-12 rounded-xl border-2 font-bold" value={password} onChange={(e) => setPassword(e.target.value)} /></div>

              <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100">
                <Checkbox id="terms" checked={acceptedTerms} onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)} className="mt-1 h-5 w-5" />
                <Label htmlFor="terms" className="text-xs font-bold text-slate-700 cursor-pointer leading-tight">Acepto los términos y condiciones de servicio industrial.</Label>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-6 p-10 pt-0">
              <Button className="w-full h-16 rounded-2xl font-black text-lg uppercase tracking-widest shadow-xl" type="submit" disabled={loading || !acceptedTerms}>
                {loading ? <Loader2 className="animate-spin h-6 w-6" /> : "Crear Acceso"} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm text-center text-muted-foreground">¿Ya tienes cuenta? <Link href="/auth/login" className="text-primary font-black uppercase text-xs">Iniciar Sesión</Link></p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
