
'use client';

import { useState } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
  AlertCircle, 
  KeyRound, 
  User,
  Zap,
  CheckCircle2,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
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
      toast({ title: "Acción requerida", description: "Debe aceptar los términos y condiciones para continuar.", variant: "destructive" });
      return;
    }
    setLoading(true);
    
    const cleanEmail = email.toLowerCase().trim();
    const isSuperAdminAccount = cleanEmail === SUPERADMIN_EMAIL;

    try {
      let targetCompanyId = "";
      let role = "";

      // 1. LÓGICA DE SUPERADMIN (INFRAESTRUCTURA)
      if (isSuperAdminAccount) {
        targetCompanyId = 'pcg-central';
        role = 'superadmin';
      } 
      // 2. CREAR NUEVA EMPRESA (FREEMIUM / TRIAL)
      else if (signupMode === 'new') {
        if (!companyName.trim()) throw new Error("Debe ingresar el nombre de su empresa.");
        targetCompanyId = `comp-${Math.random().toString(36).substr(2, 8)}`;
        role = 'companyAdmin';

        const trialEndDate = addDays(new Date(), 14).toISOString();

        // Crear documento de la empresa en Plan Simple con Trial de 14 días
        await setDoc(doc(db, 'companies', targetCompanyId), {
          id: targetCompanyId,
          name: companyName.trim(),
          rut: 'RUT por definir',
          address: 'Dirección por definir',
          isActive: true,
          currentPlan: 'simple',
          subscriptionStatus: 'active',
          createdAt: new Date().toISOString(),
          trialEndsAt: trialEndDate
        });
      } 
      // 3. UNIRSE A EMPRESA EXISTENTE
      else {
        if (!companyCode.trim()) throw new Error("Debe ingresar el código de vinculación.");
        targetCompanyId = companyCode.trim();

        const companySnap = await getDoc(doc(db, 'companies', targetCompanyId));
        if (!companySnap.exists()) throw new Error("El código de acceso no es válido.");
        
        const companyData = companySnap.data();
        if (!companyData.isActive) throw new Error("Esta empresa se encuentra suspendida.");

        // Validar límites
        const usersQuery = query(collection(db, "users"), where("companyId", "==", targetCompanyId));
        const usersSnap = await getDocs(usersQuery);
        
        const planLimits: Record<string, number> = { simple: 2, business: 10, enterprise: 100 };
        const currentPlan = companyData.currentPlan || 'simple';
        const maxUsers = planLimits[currentPlan] || 2;

        if (usersSnap.size >= maxUsers) {
          throw new Error(`Límite alcanzado para el plan ${currentPlan.toUpperCase()}.`);
        }

        role = usersSnap.size === 0 ? 'companyAdmin' : 'tecnico';
      }

      // 2. Crear usuario en Auth
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const userId = userCredential.user.uid;

      // 3. Crear Perfil de Usuario
      await setDoc(doc(db, 'users', userId), {
        id: userId,
        email: cleanEmail,
        name: name,
        role: role,
        companyId: targetCompanyId,
        active: true,
        createdAt: new Date().toISOString(),
      });

      // 4. Registro adicional si es Super Admin
      if (isSuperAdminAccount) {
        await setDoc(doc(db, 'platform_admins', userId), {
          id: userId,
          email: cleanEmail,
          name: name,
          grantedAt: new Date().toISOString(),
        });
      }

      toast({
        title: signupMode === 'new' ? "¡Empresa Creada!" : "Cuenta vinculada",
        description: signupMode === 'new' 
          ? "Bienvenido a su nuevo entorno. Su prueba de 14 días ha comenzado." 
          : "Bienvenido al sistema. Redirigiendo...",
      });
      
      router.push('/dashboard');

    } catch (error: any) {
      toast({
        title: "Error de registro",
        description: error.message || "No se pudo completar el registro.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdminEmail = email.toLowerCase().trim() === SUPERADMIN_EMAIL;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg space-y-4">
        <Button variant="ghost" asChild className="text-slate-500 hover:text-primary mb-2">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Volver al Inicio
          </Link>
        </Button>
        <Card className="w-full border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="space-y-1 flex flex-col items-center p-10 bg-white">
            <div className="bg-primary/10 p-4 rounded-3xl mb-4">
              <ShieldPlus className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-black tracking-tighter uppercase italic">Empezar Ahora</CardTitle>
            <CardDescription className="text-base font-medium">Digitalice su operación técnica en minutos.</CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-6 px-10 pb-6">
              {!isSuperAdminEmail && (
                <Tabs defaultValue="new" onValueChange={(v) => setSignupMode(v as any)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-14 bg-slate-100 rounded-2xl p-1 mb-6">
                    <TabsTrigger value="new" className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary">Registrar Empresa</TabsTrigger>
                    <TabsTrigger value="join" className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary">Unirme a Empresa</TabsTrigger>
                  </TabsList>

                  <TabsContent value="new" className="space-y-4 animate-in fade-in slide-in-from-left-2">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nombre de su Empresa / Negocio</Label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                          placeholder="Ej: Mantenimiento Industrial SPA" 
                          required={signupMode === 'new'} 
                          className="h-14 pl-12 rounded-2xl border-2 focus:border-primary font-bold"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
                      <Zap className="h-5 w-5 text-blue-600 shrink-0" />
                      <p className="text-[10px] font-bold text-blue-700 uppercase leading-relaxed">
                        Acceso instantáneo: 14 días de prueba completa incluidos.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="join" className="space-y-4 animate-in fade-in slide-in-from-right-2">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Código de Vinculación Maestro</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                          placeholder="comp-xxxxxx" 
                          required={signupMode === 'join'}
                          className="h-14 pl-12 rounded-2xl border-2 border-primary/20 focus:border-primary font-mono font-bold"
                          value={companyCode}
                          onChange={(e) => setCompanyCode(e.target.value)}
                        />
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter px-1">Solicite este código al administrador de su organización.</p>
                    </div>
                  </TabsContent>
                </Tabs>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nombre Completo</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Juan Soto" 
                      required 
                      className="h-12 pl-12 rounded-xl border-2 font-bold"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Corporativo</Label>
                  <Input 
                    type="email" 
                    placeholder="nombre@empresa.cl" 
                    required 
                    className="h-12 rounded-xl border-2 font-bold"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Contraseña de Acceso</Label>
                <Input 
                  type="password" 
                  placeholder="Mínimo 6 caracteres" 
                  required 
                  className="h-12 rounded-xl border-2 font-bold"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {isSuperAdminEmail && (
                <Alert className="bg-primary/5 border-primary/20 rounded-2xl">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-xs font-bold text-primary uppercase tracking-widest">
                    Acceso Maestro: Configurando cuenta de Administrador de Infraestructura.
                  </AlertDescription>
                </Alert>
              )}

              {/* ACEPCIÓN DE TÉRMINOS LEGALES */}
              <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 mt-4">
                <Checkbox 
                  id="terms" 
                  checked={acceptedTerms} 
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                  className="mt-1 h-5 w-5 rounded-md"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="terms" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Acepto los términos y condiciones
                  </Label>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Al registrarse, usted confirma que ha leído y acepta nuestra <Link href="/terms" target="_blank" className="text-primary font-black underline hover:text-blue-700">política de servicio y privacidad</Link> según la legislación chilena.
                  </p>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-6 p-10 pt-0 bg-white">
              <Button 
                className={cn(
                  "w-full h-16 rounded-2xl font-black text-lg uppercase tracking-widest shadow-xl gap-2 transition-all active:scale-95",
                  acceptedTerms ? "bg-primary text-white shadow-primary/20 hover:scale-[1.02]" : "bg-slate-200 text-slate-400 cursor-not-allowed"
                )} 
                type="submit" 
                disabled={loading || !acceptedTerms}
              >
                {loading ? <Loader2 className="animate-spin h-6 w-6" /> : <>{signupMode === 'new' ? "Crear Empresa y Entrar" : "Vincular Cuenta"} <ArrowRight className="h-5 w-5" /></>}
              </Button>
              
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>¿Ya tiene una cuenta?</span>
                <Link href="/auth/login" className="text-primary font-black uppercase text-xs hover:underline underline-offset-4">Iniciar Sesión</Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
