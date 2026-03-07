
'use client';

import { useState } from 'react';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Loader2, HardHat, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error de acceso",
        description: "Credenciales inválidas. Por favor intente nuevamente.",
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
          <div className="bg-primary p-3 rounded-2xl mb-4">
            <ShieldCheck className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">PCGMANTENIMIENTO</CardTitle>
          <CardDescription>Ingrese sus credenciales para acceder al ERP</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nombre@empresa.cl" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link href="#" className="text-xs text-primary hover:underline">¿Olvidó su contraseña?</Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Iniciar Sesión"}
            </Button>
            
            <div className="w-full pt-4 border-t border-dashed">
              <Button asChild variant="outline" className="w-full h-14 rounded-xl border-2 border-slate-100 hover:bg-slate-50 group">
                <Link href="/staff/login" className="flex items-center justify-between px-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary"><HardHat className="h-5 w-5" /></div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Personal en Terreno</p>
                      <p className="text-xs font-bold text-slate-900 uppercase">Acceso con RUT y PIN</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            <p className="text-sm text-center text-muted-foreground mt-4">
              ¿No tiene una cuenta? <Link href="/auth/signup" className="text-primary hover:underline">Regístrese aquí</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
