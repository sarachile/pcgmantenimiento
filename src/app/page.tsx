
'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/firebase";
import { 
  CheckCircle2, 
  ShieldCheck, 
  ClipboardList, 
  HardHat, 
  Smartphone, 
  History, 
  BarChart3,
  ArrowRight,
  Zap,
  LayoutDashboard,
  Shield,
  FileCheck,
  Search,
  Package,
  Clock,
  Menu,
  X,
  XCircle,
  Smartphone as CameraIcon,
  FileCheck as SignatureIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function HomePage() {
  const { isAuthenticated, isLoading } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-industrial');
  const dashImage = PlaceHolderImages.find(img => img.id === 'dashboard-preview');

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-2 rounded-lg">
                <ShieldCheck className="text-white h-6 w-6" />
              </div>
              <span className="font-black text-xl tracking-tighter text-primary">
                PCGMANTENIMIENTO
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600 uppercase tracking-widest">
              <a href="#solucion" className="hover:text-primary transition-colors">Solución</a>
              <a href="#como-funciona" className="hover:text-primary transition-colors">Cómo Funciona</a>
              <a href="#beneficios" className="hover:text-primary transition-colors">Beneficios</a>
              {isAuthenticated ? (
                <Button asChild>
                  <Link href="/dashboard" className="gap-2">
                    Panel de Control <LayoutDashboard className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <div className="flex items-center gap-4">
                  <Link href="/auth/login" className="hover:text-primary transition-colors">Ingresar</Link>
                  <Button asChild className="rounded-full px-6">
                    <Link href="/auth/signup">Probar Gratis</Link>
                  </Button>
                </div>
              )}
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-100 p-4 space-y-4 animate-in slide-in-from-top-2">
            <Link href="/auth/login" className="block text-center font-bold text-slate-600 p-2">INGRESAR</Link>
            <Button asChild className="w-full rounded-full">
              <Link href="/auth/signup">PROBAR GRATIS</Link>
            </Button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="outline" className="mb-6 py-1 px-4 border-primary/20 text-primary bg-primary/5 rounded-full font-bold uppercase tracking-widest animate-pulse">
            Plataforma de Gestión Industrial
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 mb-6 leading-[0.9]">
            Controla toda tu operación <br />
            <span className="text-primary italic font-serif">con trazabilidad y evidencia</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            La herramienta táctica que acredita tu experiencia técnica en terreno. <br className="hidden md:block" />
            Certifica m², servicios realizados y conformidad de clientes con sellos digitales.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="h-14 px-10 rounded-full text-lg font-black shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
              <Link href="/auth/signup">Empieza hoy mismo <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <p className="text-sm font-bold text-slate-400">Digitalización de procesos industriales.</p>
          </div>
          
          {/* Dashboard Preview Mockup */}
          <div className="mt-20 relative max-w-5xl mx-auto">
            <div className="bg-slate-900 rounded-2xl p-2 shadow-2xl overflow-hidden">
              <div className="bg-white rounded-xl overflow-hidden border border-slate-800 relative aspect-video">
                {dashImage && (
                  <Image 
                    src={dashImage.imageUrl} 
                    alt={dashImage.description} 
                    fill
                    className="object-cover opacity-90 hover:opacity-100 transition-opacity"
                    data-ai-hint={dashImage.imageHint}
                  />
                )}
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 hidden lg:block animate-bounce duration-[3000ms]">
              <div className="bg-white p-4 rounded-2xl shadow-2xl border border-emerald-100 flex items-center gap-4">
                <div className="bg-emerald-500 p-2 rounded-full"><CheckCircle2 className="text-white h-6 w-6" /></div>
                <div className="text-left">
                  <p className="text-xs font-black text-slate-400 uppercase">OT FINALIZADA</p>
                  <p className="font-bold text-slate-900 italic">"Validada con evidencia real"</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="solucion" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                Menos planillas,<br />
                <span className="text-primary">más control operativo.</span>
              </h2>
              <div className="space-y-6">
                {[
                  { icon: XCircle, title: "El caos del papel y Excel", desc: "Planillas infinitas que nadie actualiza y terminan guardadas en cajones." },
                  { icon: History, title: "Falta de trazabilidad", desc: "¿Sabes qué se hizo realmente en terreno? Sin registros, no hay historia." },
                  { icon: Zap, title: "Mantenimiento reactivo", desc: "Corres tras las fallas porque no tienes visibilidad de lo preventivo." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="bg-rose-100 p-2 rounded-lg h-fit"><item.icon className="text-rose-600 h-5 w-5" /></div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                      <p className="text-slate-600 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary/10 px-4 py-1 rounded-bl-xl font-bold text-xs text-primary uppercase">La Solución Digital</div>
              <h3 className="text-2xl font-black italic">"Lo que no se registra, no existe"</h3>
              <p className="text-slate-600">PCGMANTENIMIENTO centraliza toda la operación en una herramienta diseñada para ser usada en el campo, no solo en la oficina.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-3xl font-black text-primary mb-1">100%</p>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Trazabilidad Real</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-3xl font-black text-primary mb-1">0</p>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pérdida de Datos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero-like visual support section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[3rem] overflow-hidden relative h-[400px] shadow-2xl">
            {heroImage && (
              <Image 
                src={heroImage.imageUrl} 
                alt={heroImage.description} 
                fill
                className="object-cover brightness-50"
                data-ai-hint={heroImage.imageHint}
              />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
              <h2 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter mb-4">Acredita tu experiencia en terreno</h2>
              <p className="text-white/80 max-w-2xl text-lg font-medium">Cada trabajo terminado es un respaldo sólido para tus próximas licitaciones y contratos comerciales.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section id="como-funciona" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-black mb-16 tracking-tight">Mantenimiento claro en 4 pasos</h2>
          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10 hidden md:block" />
            {[
              { icon: Package, title: "1. Registra Activos", desc: "Toda tu maquinaria y equipos organizados por código." },
              { icon: ClipboardList, title: "2. Asigna OTs", desc: "Define tareas preventivas o correctivas en segundos." },
              { icon: Smartphone, title: "3. Ejecuta en Terreno", desc: "Tus técnicos completan checklists y suben fotos." },
              { icon: FileCheck, title: "4. Valida y Firma", desc: "Aprueba el trabajo con evidencias y firmas digitales." }
            ].map((step, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl group hover:shadow-xl transition-all border border-transparent hover:border-slate-100">
                <div className="bg-primary/5 text-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <step.icon className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-xl mb-3">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-24 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6 text-center md:text-left">
            <div>
              <Badge className="bg-primary text-white mb-4">Diferenciación Real</Badge>
              <h2 className="text-4xl md:text-5xl font-black leading-tight italic">No es un ERP complejo,<br /> es una herramienta táctica.</h2>
            </div>
            <p className="text-slate-400 max-w-sm">Mientras otros se pierden en burocracia, nosotros nos enfocamos en que el trabajo se haga y se registre bien.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: CameraIcon, title: "Evidencia Fotográfica", desc: "Valida el trabajo realizado con fotos antes y después directamente en la OT." },
              { icon: SignatureIcon, title: "Firma Digital en Terreno", desc: "Captura la conformidad del cliente y del técnico al instante." },
              { icon: BarChart3, title: "Reportes en un Clic", desc: "Genera documentos PDF profesionales para auditorías o cobros sin esfuerzo." }
            ].map((benefit, i) => (
              <div key={i} className="space-y-4">
                <div className="bg-white/10 p-3 rounded-xl w-fit"><benefit.icon className="h-6 w-6 text-primary" /></div>
                <h3 className="text-xl font-bold">{benefit.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial / Social Proof Simulation */}
      <section className="py-24 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <p className="text-3xl font-black italic text-slate-800 leading-snug">
            "Pasamos de tener un desorden total en carpetas a tener la trazabilidad de cada equipo en la palma de nuestra mano. La validación con fotos cambió nuestra relación con los clientes."
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="h-12 w-12 rounded-full bg-slate-200" />
            <div className="text-left">
              <p className="font-bold text-slate-900">Gerencia Técnica</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Servicios Industriales Chile</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 relative">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-8 italic text-primary">
            Todo tu mantenimiento,<br /> claro y trazable.
          </h2>
          <p className="text-xl text-slate-600 mb-12">¿Listo para dejar atrás las planillas y tomar el control?</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button asChild size="lg" className="h-16 px-12 rounded-full text-xl font-black shadow-2xl">
              <Link href="/auth/signup">Probar Gratis Ahora</Link>
            </Button>
            <Link href="/auth/login" className="text-sm font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest underline underline-offset-8">O inicia sesión si ya eres cliente</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-50 border-t border-slate-100 text-center">
        <div className="flex justify-center gap-4 mb-6">
          <ShieldCheck className="text-slate-300 h-8 w-8" />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">
          PCGMANTENIMIENTO ERP - Gestión Industrial Avanzada
        </p>
        <p className="text-xs text-slate-400 mb-8">
          © {new Date().getFullYear()} Todos los derechos reservados. www.pcgmantenimiento.com
        </p>
        <div className="flex justify-center gap-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <Link href="#" className="hover:text-primary">Términos</Link>
          <Link href="#" className="hover:text-primary">Privacidad</Link>
          <Link href="#" className="hover:text-primary">Soporte</Link>
        </div>
      </footer>
    </div>
  );
}
