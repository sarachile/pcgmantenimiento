
'use client';

import { useState } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ShieldPlus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const SUPERADMIN_EMAIL = 'control@pcgoperacion.com';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
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
      // 1. Crear usuario en Auth
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const userId = userCredential.user.uid;

      const role = isSuperAdminAccount ? 'superadmin' : 'companyAdmin';
      const companyId = isSuperAdminAccount ? 'pcg-central' : `comp-${Math.random().toString(36).substr(2, 9)}`;

      // 2. Registrar empresa (Tenant)
      // Usamos los campos exactos del backend.json
      await setDoc(doc(db, 'companies', companyId), {
        id: companyId,
        name: isSuperAdminAccount ? 'PCG OPERACIONES CENTRAL' : (companyName || 'Mi Empresa'),
        rut: '76.000.000-0',
        address: 'Dirección por definir',
        isActive: true,
        currentPlan: isSuperAdminAccount ? 'enterprise' : 'free',
        subscriptionStatus: 'active',
        createdAt: serverTimestamp(),
      });

      // 3. Crear Perfil de Usuario
      await setDoc(doc(db, 'users', userId), {
        id: userId,
        email: cleanEmail,
        name: name,
        role: role,
        companyId: companyId,
        active: true,
        createdAt: serverTimestamp(),
      });

      // 4. Registro en colección de Súper Administradores si corresponde
      if (isSuperAdminAccount) {
        await setDoc(doc(db, 'superAdmins', userId), {
          id: userId,
          email: cleanEmail,
          name: name,
          grantedAt: serverTimestamp(),
        });
      }

      toast({
        title: isSuperAdminAccount ? "Acceso Maestro Activado" : "Cuenta creada",
        description: "Bienvenido a PCGMANTENIMIENTO. Redirigiendo...",
      });
      
      // Forzamos una pequeña espera para asegurar propagación
      setTimeout(() => {
        router.push(isSuperAdminAccount ? '/admin' : '/dashboard');
      }, 500);

    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Error al registrarse",
        description: error.message || "No se pudo completar el registro técnico.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="bg-primary/10 p-3 rounded-2xl mb-4">
            <ShieldPlus className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Registro PCG</CardTitle>
          <CardDescription>Cree su cuenta corporativa para el ERP</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            {email.toLowerCase().trim() !== SUPERADMIN_EMAIL && (
              <div className="space-y-2">
                <Label htmlFor="company">Nombre de la Empresa</Label>
                <Input id="company" required={email.toLowerCase().trim() !== SUPERADMIN_EMAIL} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email Corporativo</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Registrarse e Iniciar"}
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
