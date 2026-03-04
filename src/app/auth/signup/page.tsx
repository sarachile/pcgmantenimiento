
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
import { ShieldPlus, Loader2, Building2, AlertCircle } from 'lucide-react';
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
      let role = isSuperAdminAccount ? 'superadmin' : 'companyAdmin'; // Por defecto el primero que se registra en una empresa es admin

      // 1. SI NO ES SUPERADMIN, VALIDAR EMPRESA
      if (!isSuperAdminAccount) {
        if (!targetCompanyId) {
          throw new Error("Debe ingresar un código de acceso de empresa.");
        }

        const companySnap = await getDoc(doc(db, 'companies', targetCompanyId));
        
        if (!companySnap.exists()) {
          throw new Error("El código de empresa no es válido o no existe.");
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
          throw new Error(`La empresa ha alcanzado el límite de ${maxUsers} usuarios para el plan ${currentPlan.toUpperCase()}. El administrador debe mejorar el plan.`);
        }

        // Si ya hay usuarios, los nuevos se registran como 'tecnico' por defecto
        if (usersSnap.size > 0) {
          role = 'tecnico';
        }
      } else {
        // Lógica especial para crear la empresa central si no existe
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

      // 4. Registro en colección de Súper Administradores si corresponde
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
          <CardDescription>Vincule su cuenta a una empresa registrada</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Corporativo</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            
            {!isSuperAdminEmail && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="companyCode" className="flex items-center gap-2">
                  <Building2 className="h-3 w-3" /> Código de Acceso Empresa
                </Label>
                <Input 
                  id="companyCode" 
                  required 
                  placeholder="Ej: comp-xxxxx"
                  value={companyCode} 
                  onChange={(e) => setCompanyCode(e.target.value)} 
                />
                <p className="text-[10px] text-muted-foreground italic">
                  * Solicite este código a su Súper Administrador.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Su Nombre Completo</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña de Acceso</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            {isSuperAdminEmail && (
              <Alert className="bg-primary/5 border-primary/20">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-xs font-medium text-primary">
                  Detectado: Registro de Súper Administrador Maestro.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Finalizar y Entrar"}
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
