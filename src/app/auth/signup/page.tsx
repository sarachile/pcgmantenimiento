
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
import { ShieldPlus, Loader2, Building2, AlertCircle, KeyRound, User } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SUPERADMIN_EMAIL = 'control@pcgoperacion.com';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const cleanEmail = email.toLowerCase().trim();
    const isSuperAdminAccount = cleanEmail === SUPERADMIN_EMAIL;

    try {
      let targetCompanyId = isSuperAdminAccount ? 'pcg-central' : companyCode.trim();
      let role = isSuperAdminAccount ? 'superadmin' : 'companyAdmin'; 

      // 1. VALIDACIÓN PRE-REGISTRO (Solo para usuarios normales)
      if (!isSuperAdminAccount) {
        if (!targetCompanyId) {
          throw new Error("Debe ingresar el código de vinculación de su empresa.");
        }

        const companySnap = await getDoc(doc(db, 'companies', targetCompanyId));
        
        if (!companySnap.exists()) {
          throw new Error("El código de acceso no es válido. Verifíquelo con su administrador.");
        }

        const companyData = companySnap.data();
        if (!companyData.isActive) {
          throw new Error("Esta empresa se encuentra suspendida. Contacte a soporte.");
        }

        // Validar límites de usuarios del plan
        const usersQuery = query(collection(db, "users"), where("companyId", "==", targetCompanyId));
        const usersSnap = await getDocs(usersQuery);
        
        const planLimits: Record<string, number> = { free: 1, pro: 3, enterprise: 5 };
        const currentPlan = companyData.currentPlan || 'free';
        const maxUsers = planLimits[currentPlan] || 1;

        if (usersSnap.size >= maxUsers) {
          throw new Error(`La empresa ha alcanzado el límite de ${maxUsers} usuarios para el plan ${currentPlan.toUpperCase()}.`);
        }

        // Si ya hay un administrador, el siguiente es técnico por defecto
        if (usersSnap.size > 0) {
          role = 'tecnico';
        }
      }

      // 2. Crear usuario en Auth (A partir de aquí estamos autenticados)
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const userId = userCredential.user.uid;

      // 3. Si es Super Admin, asegurar que la empresa central exista (ahora tenemos auth)
      if (isSuperAdminAccount) {
        const centralSnap = await getDoc(doc(db, 'companies', 'pcg-central'));
        if (!centralSnap.exists()) {
          await setDoc(doc(db, 'companies', 'pcg-central'), {
            id: 'pcg-central',
            name: 'PCG OPERACIONES CENTRAL',
            rut: '76.000.000-0',
            address: 'PCG HQ',
            isActive: true,
            currentPlan: 'enterprise',
            subscriptionStatus: 'active',
            createdAt: new Date().toISOString(),
          });
        }
      }

      // 4. Crear Perfil de Usuario
      await setDoc(doc(db, 'users', userId), {
        id: userId,
        email: cleanEmail,
        name: name,
        role: role,
        companyId: targetCompanyId,
        active: true,
        createdAt: new Date().toISOString(),
      });

      // 5. Registro en colección de Súper Administradores si corresponde
      if (isSuperAdminAccount) {
        await setDoc(doc(db, 'superAdmins', userId), {
          id: userId,
          email: cleanEmail,
          name: name,
          grantedAt: new Date().toISOString(),
        });
      }

      toast({
        title: isSuperAdminAccount ? "Acceso Maestro Activado" : "Cuenta vinculada",
        description: `Bienvenido a ${isSuperAdminAccount ? 'PCG' : 'su entorno de trabajo'}. Redirigiendo...`,
      });
      
      router.push(isSuperAdminAccount ? '/admin' : '/dashboard');

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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="bg-primary/10 p-3 rounded-2xl mb-4">
            <ShieldPlus className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Registro de Usuario</CardTitle>
          <CardDescription>Cree su perfil personal y vincúlelo a su empresa</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Corporativo</Label>
              <Input id="email" type="email" placeholder="nombre@empresa.cl" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            
            {!isSuperAdminEmail && (
              <div className="space-y-2 p-4 bg-primary/5 rounded-xl border border-primary/10 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="companyCode" className="flex items-center gap-2 text-primary font-bold">
                  <Building2 className="h-4 w-4" /> Código de Acceso Empresa
                </Label>
                <Input 
                  id="companyCode" 
                  required 
                  placeholder="Ej: comp-xxxxx"
                  className="bg-white border-primary/20"
                  value={companyCode} 
                  onChange={(e) => setCompanyCode(e.target.value)} 
                />
                <p className="text-[10px] text-primary/70 italic leading-tight">
                  * Este código vincula su cuenta a su organización. Solicítelo a su jefe de área o administrador.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" /> Nombre Completo
              </Label>
              <Input id="name" placeholder="Ej: Juan Soto" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <KeyRound className="h-3.5 w-3.5 text-muted-foreground" /> Contraseña Personal
              </Label>
              <Input id="password" type="password" placeholder="Mínimo 6 caracteres" required value={password} onChange={(e) => setPassword(e.target.value)} />
              <p className="text-[10px] text-muted-foreground italic">
                * Esta es su clave privada para entrar al sistema. No es el código de empresa.
              </p>
            </div>

            {isSuperAdminEmail && (
              <Alert className="bg-primary/5 border-primary/20">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-xs font-medium text-primary">
                  Identidad Confirmada: Registro de Administrador de Infraestructura.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full h-12 text-sm font-bold" type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Finalizar y Acceder al ERP"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              ¿Ya tiene una cuenta? <Link href="/auth/login" className="text-primary hover:underline">Inicie sesión</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
