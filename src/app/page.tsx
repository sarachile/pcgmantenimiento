'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/firebase";
import { 
  ShieldCheck, 
  ArrowRight,
  LayoutDashboard,
  Menu,
  X,
  Zap,
  CheckCircle2,
  HardHat,
  Smartphone,
  Sun,
  Waves,
  Database,
  Layers,
  Sparkles,
  Activity,
  Wind,
  Wrench,
  Construction,
  Stethoscope,
  Building2,
  Truck,
  Bug,
  Droplets,
  AlertTriangle,
  TrendingDown,
  Scale,
  Users,
  ChevronDown,
  MessageCircle,
  MessageSquare,
  Clock,
  CircleDollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const WHATSAPP_URL = "https://wa.me/56941245316?text=Hola,%20me%20interesa%20saber%20m%C3%A1s%20sobre%20pcgmantenimiento.";

export default function HomePage() {
  const { isAuthenticated } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Estados para el simulador de impacto hídrico
  const [litersLost, setLitersLost] = useState(0);
  const [moneyLost, setMoneyLost] = useState(0);

  useEffect(() => {
    setMounted(true);
    
    const interval = setInterval(() => {
      setLitersLost(prev => prev + 0.01);
      // Costo aproximado en Chile: $1.8 por litro (Agua + Alcantarillado)
      setMoneyLost(prev => prev + (0.01 * 1.8));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse">
          <p className="text-sm font-black uppercase tracking-widest text-slate-400">PCGMANTENIMIENTO</p>
        </div>
      </div>
    );
  }

  const applications = [
    { title: "Mantención Industrial", icon: Wrench, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Energía Solar / PV", icon: Sun, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "Ascensores y Elevación", icon: Layers, color: "text-slate-600", bg: "bg-slate-50" },
    { title: "Climatización (HVAC)", icon: Wind, color: "text-cyan-600", bg: "bg-cyan-50" },
    { title: "Construcción y Obras", icon: Construction, color: "text-orange-600", bg: "bg-orange-50" },
    { title: "Servicios Post-Venta", icon: MessageSquare, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Equipos Médicos", icon: Stethoscope, color: "text-rose-600", bg: "bg-rose-50" },
    { title: "Facility Management", icon: Building2, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Mantención de Flota", icon: Truck, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Control de Plagas", icon: Bug, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans scroll-smooth">
      {/* WhatsApp Floating Button */}
      <div className="fixed bottom-8 right-8 z-[60]">
        <a 
          href={WHATSAPP_URL}
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
        >
          <MessageCircle className="h-8 w-8 fill-white" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-3 transition-all duration-500 font-black uppercase text-xs tracking-widest whitespace-nowrap">
            Consultar Ahora
          </span>
        </a>
      </div>

      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <span className="font-black text-xl tracking-tighter text-slate-900 uppercase italic">PCGMANTENIMIENTO</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600 uppercase tracking-widest">
              <a href="#plataforma" className="hover:text-primary transition-colors">La Plataforma</a>
              <a href="#agua" className="hover:text-primary transition-colors">Gestión Agua</a>
              <a href="#solar" className="hover:text-primary transition-colors">Energía Solar</a>
              {isAuthenticated ? (
                <Button asChild className="rounded-full">
                  <Link href="/dashboard" className="gap-2">
                    Panel Control <LayoutDashboard className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <div className="flex items-center gap-4">
                  <Link href="/auth/login" className="hover:text-primary transition-colors">Ingresar</Link>
                  <Button asChild className="rounded-full px-6 shadow-lg shadow-primary/20">
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
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden relative border-b">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="outline" className="mb-6 py-1 px-4 border-primary/20 text-primary bg-primary/5 rounded-full font-bold uppercase tracking-widest">
            Trazabilidad Inalterable e Integración IoT
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 mb-6 leading-[0.9]">
            Toda tu operación técnica <br />
            <span className="text-primary italic font-serif">con trazabilidad inalterable</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            Certifica la calidad de tu equipo en terreno. Reemplaza la incertidumbre por evidencia real, firmas digitales y <span className="text-primary font-bold">monitoreo inteligente de activos</span>.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button asChild size="lg" className="h-14 px-10 rounded-full text-lg font-black shadow-xl">
              <Link href="/auth/signup">Empieza ahora gratis <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Áreas de Aplicación */}
      <section className="py-20 bg-slate-50/50 overflow-hidden border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] mb-4">Sectores Digitalizados</p>
          <h3 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900">Industrias que potencian su valor con nuestra tecnología</h3>
        </div>
        <div className="relative flex overflow-x-hidden">
          <div className="animate-marquee hover:[animation-play-state:paused] whitespace-nowrap flex py-4">
            {[...applications, ...applications].map((app, i) => (
              <div key={i} className="mx-4 flex items-center gap-6 p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm">
                <div className={cn("p-4 rounded-2xl", app.bg)}>
                  <app.icon className={cn("h-8 w-8", app.color)} />
                </div>
                <span className="text-lg font-black uppercase tracking-tighter text-slate-800 pr-4">{app.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simulador de Fuga de WC */}
      <section id="agua" className="py-24 bg-gradient-to-b from-blue-100/40 via-white to-blue-50 relative overflow-hidden border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 space-y-4">
            <Badge className="bg-blue-600 text-white font-black px-4 py-1 uppercase tracking-widest rounded-full shadow-lg border-none">Gestión de Activos Críticos</Badge>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 uppercase italic">
              El Silencio que <br />
              <span className="text-blue-600">Vacía tu Caja Común</span>
            </h2>
            <p className="text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
              Una fuga silenciosa en un WC puede perder hasta **30 litros por hora**. Detenemos las pérdidas antes de que llegue la cuenta.
            </p>
          </div>

          <div className="max-w-5xl mx-auto rounded-[3.5rem] border-none shadow-2xl bg-slate-900 text-white overflow-hidden mb-16">
            <div className="grid lg:grid-cols-5 h-full">
              <div className="lg:col-span-2 p-12 flex flex-col items-center justify-center bg-white/5 border-r border-white/10 relative overflow-hidden">
                <div className="relative mb-12">
                  <div className="bg-slate-800 p-8 rounded-[2.5rem] border-4 border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.3)]">
                    <Droplets className="h-20 w-20 text-blue-400" />
                  </div>
                </div>
                <div className="space-y-3 text-center">
                  <Badge className="bg-rose-600 text-white font-black px-4 py-1.5 uppercase tracking-widest animate-pulse border-none rounded-xl">
                    ALERTA: FUGA SILENCIOSA WC
                  </Badge>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Sensor Ultrasónico Depto 402</p>
                </div>
              </div>

              <div className="lg:col-span-3 p-12 space-y-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black italic uppercase text-blue-400 flex items-center gap-3">
                    <Scale className="h-7 w-7" /> Impacto Financiero Live
                  </h3>
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-tighter">
                    <Clock className="h-4 w-4" /> Contador en tiempo real
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-inner">
                    <p className="text-[10px] font-black uppercase text-blue-400 mb-2 tracking-widest">Agua Perdida (Litros)</p>
                    <p className="text-5xl font-black italic tracking-tighter tabular-nums text-white">
                      {litersLost.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-inner">
                    <p className="text-[10px] font-black uppercase text-rose-400 mb-2 tracking-widest">Gasto Innecesario (CLP)</p>
                    <p className="text-5xl font-black italic tracking-tighter tabular-nums text-rose-100">
                      $ {moneyLost.toFixed(1)}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <Button asChild className="w-full h-16 rounded-[1.5rem] bg-blue-600 hover:bg-blue-500 text-white font-black text-lg uppercase tracking-widest shadow-xl">
                    <Link href="/auth/signup">Detener pérdidas ahora</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 bg-slate-50 border-t border-slate-100 text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
          © {new Date().getFullYear()} - PCGMANTENIMIENTO.COM
        </p>
      </footer>
    </div>
  );
}
