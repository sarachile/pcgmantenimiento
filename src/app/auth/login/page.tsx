
'use client';

import { useState } from 'react';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, HardHat, ArrowRight, ArrowLeft } from 'lucide-react';
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
      const userCredential = await signInWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
      
      // Si el login es exitoso, redirigir. El DashboardLayout se encargará de verificar el perfil.
      if (email.toLowerCase().trim() === 'control@pcgoperacion.com') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
      
      toast({
        title: "Acceso exitoso",
        description: "Cargando su entorno de trabajo...",
      });
    } catch (error: any) {
      console.error("Login Error:", error);
      let message = "Credenciales inválidas. Por favor intente nuevamente.";
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = "El correo o la contraseña no coinciden.";
      } else if (error.code === 'auth/too-many-requests') {
        message = "Demasiados intentos fallidos. Reintente en unos minutos.";
      }

      toast({
        title: "Error de acceso",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-4">
        <Button variant="ghost" asChild className="text-slate-500 hover:text-primary mb-2">
          <Link href="/"><ArrowLeft className="h-4 w-4 mr-2" /> Volver al Inicio</Link>
        </Button>
        
        <Card className="w-full border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="space-y-1 flex flex-col items-center p-10 bg-slate-900 text-white">
            <img 
              src="/logogenko.png" 
              alt="GENKO" 
              className="h-16 w-auto object-contain mb-4" 
              onError={(e) => (e.currentTarget.src = "https://placehold.co/100x100?text=GENKO")} 
            />
            <CardTitle className="text-3xl font-black tracking-tighter uppercase italic leading-none">GENKO ERP</CardTitle>
            <CardDescription className="text-slate-400 font-bold uppercase tracking-widest pt-2">Gestión Hídrica Industrial</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-6 p-10">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Correo Corporativo</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="nombre@empresa.cl" 
                  required 
                  className="h-12 rounded-xl border-2 font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" title="Contraseña" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contraseña</Label>
                  <Link href="#" className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter">¿Olvidó su clave?</Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  className="h-12 rounded-xl border-2 font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-6 p-10 pt-0">
              <Button className="w-full h-14 rounded-2xl font-black text-lg uppercase tracking-widest shadow-xl" type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Iniciar Sesión"}
              </Button>
              
              <div className="w-full pt-6 border-t border-dashed border-slate-200">
                <Button asChild variant="outline" className="w-full h-16 rounded-2xl border-2 border-slate-100 hover:bg-slate-50 group">
                  <Link href="/staff/login" className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2.5 rounded-xl text-primary"><HardHat className="h-6 w-6" /></div>
                      <div className="text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Personal en Terreno</p>
                        <p className="text-sm font-bold text-slate-900 uppercase tracking-tighter">Acceso con RUT y PIN</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground font-medium">
                ¿No tiene una cuenta? <Link href="/auth/signup" className="text-primary font-black uppercase tracking-tighter hover:underline">Regístrese aquí</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
