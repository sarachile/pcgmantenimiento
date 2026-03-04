
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldPlus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('companyAdmin');
  const [loading, setLoading] = useState(false);
  
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // 2. Create Company (Simplified for MVP)
      const companyId = `comp-${Math.random().toString(36).substr(2, 9)}`;
      await setDoc(doc(db, 'companies', companyId), {
        id: companyId,
        name: companyName,
        createdAt: serverTimestamp(),
        isActive: true,
      });

      // 3. Create User Profile (Global lookup for multi-tenant isolation)
      await setDoc(doc(db, 'users', userId), {
        id: userId,
        email,
        name,
        role,
        companyId,
        createdAt: serverTimestamp(),
        isActive: true,
      });

      // 4. Mirror in company subcollection for security rules efficiency
      await setDoc(doc(db, 'companies', companyId, 'users', userId), {
        id: userId,
        email,
        name,
        role,
        companyId,
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Cuenta creada",
        description: "Bienvenido a PCGMANTENIMIENTO. Redirigiendo...",
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error al registrarse",
        description: error.message,
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
          <CardTitle className="text-2xl font-bold tracking-tight">Nueva Empresa</CardTitle>
          <CardDescription>Cree su cuenta de administrador de plataforma</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Nombre de la Empresa</Label>
              <Input id="company" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
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
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Crear Empresa y Cuenta"}
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
