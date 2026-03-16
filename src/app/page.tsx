
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
  Clock,
  CircleDollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const WHATSAPP_URL = "https://wa.me/56941245316?text=Hola,%20me%20interesa%20saber%20m%C3%A1s%20sobre%20PCGMANTENIMIENTO.";

export default function HomePage() {
  const { isAuthenticated } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Estados para el simulador de fuga de WC
  const [litersLost, setLitersLost] = useState(0);
  const [moneyLost, setMoneyLost] = useState(0);

  useEffect(() => {
    setMounted(true);
    
    // Simular pérdida de agua en tiempo real de un WC defectuoso (aprox 0.01 litros por segundo)
    const interval = setInterval(() => {
      setLitersLost(prev => prev + 0.01);
      // Costo aproximado en Chile: $1.800 por m3 ($1.8 por litro) incluyendo alcantarillado
      setMoneyLost(prev => prev + (0.01 * 1.8));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse">
          <img src="/logoweb.png" alt="Cargando..." className="h-12 w-auto object-contain" />
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
      {/* Botón Flotante WhatsApp */}
      <div className="fixed bottom-8 right-8 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
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

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <img src="/logoweb.png" alt="PCGMANTENIMIENTO" className="h-10 w-auto object-contain" />
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600 uppercase tracking-widest">
              <a href="#plataforma" className="hover:text-primary transition-colors">La Plataforma</a>
              <a href="#agua" className="hover:text-primary transition-colors">Gestión Agua</a>
              <a href="#solar" className="hover:text-primary transition-colors">Energía Solar</a>
              <a href="#iot" className="hover:text-primary transition-colors">Ecosistema IoT</a>
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
            <Button asChild size="lg" className="h-14 px-10 rounded-full text-lg font-black shadow-xl shadow-primary/20">
              <Link href="/auth/signup">Empieza ahora gratis <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-10 rounded-full text-lg font-bold border-2" asChild>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="gap-2">
                <MessageCircle className="h-5 w-5 text-emerald-500" /> WhatsApp Directo
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Áreas de Aplicación Section */}
      <section className="py-20 bg-slate-50/50 overflow-hidden border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] mb-4">Industrias Digitalizadas</p>
          <h3 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900">Sectores que potencian su valor con nuestra tecnología</h3>
        </div>
        <div className="relative flex overflow-x-hidden">
          <div className="animate-marquee hover:[animation-play-state:paused] whitespace-nowrap flex py-4">
            {[...applications, ...applications].map((app, i) => (
              <div key={i} className="mx-4 flex items-center gap-6 p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                <div className={cn("p-4 rounded-2xl", app.bg)}>
                  <app.icon className={cn("h-8 w-8", app.color)} />
                </div>
                <span className="text-lg font-black uppercase tracking-tighter text-slate-800 pr-4">{app.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Description Section */}
      <section id="plataforma" className="py-32 bg-white relative overflow-hidden border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 space-y-6">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 italic uppercase">
              El Sistema Nervioso Central de tu <br />
              <span className="text-primary">Ecosistema Industrial</span>
            </h2>
            <p className="text-xl text-slate-500 max-w-4xl mx-auto font-medium leading-relaxed">
              PCGMANTENIMIENTO no es solo una App de tareas. Es un ecosistema híbrido que une la **movilidad del terreno** con la **inteligencia administrativa**.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            <Card className="p-10 rounded-[3rem] bg-slate-900 text-white space-y-6 shadow-2xl">
              <div className="bg-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4"><Layers className="h-6 w-6 text-white" /></div>
              <h3 className="text-2xl font-black italic tracking-tight uppercase">Unidad de Gestión</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Integramos personal, activos, clientes e inventario en un solo flujo técnico-legal.
              </p>
            </Card>
            <Card className="p-10 rounded-[3rem] border-2 border-slate-100 bg-white space-y-6">
              <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4"><Database className="h-6 w-6 text-primary" /></div>
              <h3 className="text-2xl font-black italic tracking-tight uppercase">Base de Datos Viva</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Cada foto y cada firma alimenta un histórico inalterable por activo y cliente.
              </p>
            </Card>
            <Card className="p-10 rounded-[3rem] bg-blue-50 border-2 border-blue-100 space-y-6">
              <div className="bg-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4"><Sparkles className="h-6 w-6 text-white" /></div>
              <h3 className="text-2xl font-black italic tracking-tight uppercase text-blue-900">Inteligencia Terreno</h3>
              <p className="text-blue-800/70 text-sm leading-relaxed">
                IA para resúmenes de bitácora técnica y transformación de datos crudos en estrategia.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* TRANSITION IMPACT SECTION */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative border-y border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Badge className="bg-blue-600 text-white font-black px-4 py-1 uppercase tracking-widest rounded-full shadow-lg mb-8 animate-pulse">
            INTELIGENCIA OPERATIVA LIVE
          </Badge>
          <h2 className="text-6xl md:text-9xl font-black tracking-tighter uppercase italic leading-[0.8] mb-10">
            DOMINA CADA GOTA, <br />
            <span className="text-blue-400">CADA VOLTIO,</span> <br />
            CADA SEGUNDO.
            <span className="block text-2xl md:text-4xl mt-10 text-white/40 tracking-[0.3em] not-italic">
              ESTO ES MANTENCIÓN PREVENTIVA
            </span>
          </h2>
          <div className="flex justify-center mt-12">
            <div className="animate-bounce p-4 rounded-full bg-white/5 border border-white/10">
              <ChevronDown className="h-8 w-8 text-blue-400" />
            </div>
          </div>
        </div>
      </section>

      {/* WATER MONITORING SECTION - WC LEAK FOCUS */}
      <section id="agua" className="py-24 bg-gradient-to-b from-blue-100/40 via-white to-blue-50 relative overflow-hidden border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 space-y-4">
            <Badge className="bg-blue-600 text-white font-black px-4 py-1 uppercase tracking-widest rounded-full shadow-lg">Gestión de Activos Críticos</Badge>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 uppercase italic">
              El Silencio que <br />
              <span className="text-blue-600">Vacía tu Caja Común</span>
            </h2>
            <p className="text-slate-500 font-medium max-w-2xl mx-auto">
              Una fuga silenciosa en un WC puede perder hasta **30 litros por hora**. En un edificio, esto significa millones de pesos anuales en gastos comunes innecesarios.
            </p>
          </div>

          {/* SIMULADOR DE FUGA DE WC */}
          <Card className="max-w-5xl mx-auto rounded-[3.5rem] border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] bg-slate-900 text-white overflow-hidden mb-16 group">
            <div className="grid lg:grid-cols-5 h-full">
              {/* Lado Visual Animado */}
              <div className="lg:col-span-2 p-12 flex flex-col items-center justify-center bg-white/5 border-r border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />
                <div className="relative mb-12">
                  <div className="bg-slate-800 p-8 rounded-[2.5rem] border-4 border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.3)] relative z-10">
                    <Droplets className="h-20 w-20 text-blue-400" />
                  </div>
                  {/* Animación de goteo constante */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-drop opacity-0 mb-2" style={{ animationDelay: '0s' }} />
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-drop opacity-0 mb-2" style={{ animationDelay: '0.5s' }} />
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-drop opacity-0 mb-2" style={{ animationDelay: '1s' }} />
                  </div>
                </div>
                <div className="space-y-3 text-center">
                  <Badge className="bg-rose-600 text-white font-black px-4 py-1.5 uppercase tracking-widest animate-pulse border-none rounded-xl">
                    ALERTA: FUGA SILENCIOSA WC
                  </Badge>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Sensor Ultrasónico Depto 402</p>
                </div>
              </div>

              {/* Lado de Datos y Cálculo */}
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
                  <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-inner group-hover:border-blue-500/50 transition-colors">
                    <p className="text-[10px] font-black uppercase text-blue-400 mb-2 tracking-widest">Agua Perdida (Litros)</p>
                    <p className="text-5xl font-black italic tracking-tighter tabular-nums text-white">
                      {litersLost.toFixed(2)}
                    </p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase mt-4">Pérdida proyectada: ~21.600 L/mes</p>
                  </div>
                  <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-inner group-hover:border-rose-500/50 transition-colors">
                    <p className="text-[10px] font-black uppercase text-rose-400 mb-2 tracking-widest">Gasto Innecesario (CLP)</p>
                    <p className="text-5xl font-black italic tracking-tighter tabular-nums text-rose-100">
                      $ {moneyLost.toFixed(1)}
                    </p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase mt-4">Equivale a: $38.880 / mes por WC</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-600/20 p-3 rounded-2xl"><CircleDollarSign className="h-6 w-6 text-blue-400" /></div>
                    <div className="space-y-1">
                      <p className="text-sm font-black uppercase italic text-white">Escala Comunitaria (100 Deptos)</p>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        Si solo el 5% de tus unidades tiene una fuga leve, tu edificio está perdiendo <span className="text-white font-bold">$1.944.000 anuales</span> en agua que nadie usó.
                      </p>
                    </div>
                  </div>
                  <Button asChild className="w-full h-16 rounded-[1.5rem] bg-blue-600 hover:bg-blue-500 text-white font-black text-lg uppercase tracking-widest shadow-xl shadow-blue-900/40">
                    <Link href="/auth/signup">Detener pérdidas ahora</Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* TARJETAS DE VALOR BAJO SIMULACIÓN */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { icon: TrendingDown, title: "Ahorro Directo", desc: "Reduce hasta un 30% el gasto común mediante detección temprana.", color: "text-blue-600", bg: "bg-blue-50" },
              { icon: AlertTriangle, title: "Fugas Invisibles", desc: "El oído no detecta un goteo de WC, nuestro sensor ultrasónico sí.", color: "text-rose-600", bg: "bg-rose-50" },
              { icon: Users, title: "Justicia Hídrica", desc: "Identifica fugas por departamento para que cada unidad pague lo justo.", color: "text-emerald-600", bg: "bg-emerald-50" },
              { icon: Scale, title: "ROI Inmediato", desc: "El sistema se paga solo al eliminar las primeras 3 fugas mayores.", color: "text-slate-900", bg: "bg-slate-100" }
            ].map((item, i) => (
              <div key={i} className="p-8 rounded-[2.5rem] border-2 border-white bg-white/80 backdrop-blur-sm shadow-xl hover:border-blue-200 hover:scale-105 transition-all duration-300">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm", item.bg, item.color)}>
                  <item.icon className="h-6 w-6" />
                </div>
                <h4 className="font-black text-slate-900 uppercase italic tracking-tight mb-3">{item.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLAR SECTION */}
      <section id="solar" className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <Badge className="bg-amber-500 text-black font-black px-4 py-1 uppercase tracking-widest">Energía Solar Pro</Badge>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase leading-none">
                El ERP que tu cuadrilla <br />
                <span className="text-amber-400">solar realmente usará.</span>
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { icon: Sun, title: "Protocolos PV", desc: "Checklists específicos inversores." },
                  { icon: CheckCircle2, title: "Sello Digital", desc: "Firma en terreno vía QR." },
                  { icon: Activity, title: "Generación Live", desc: "Ahorro visible en tiempo real." },
                  { icon: AlertTriangle, title: "Alertas", desc: "Detección de caídas de tensión." }
                ].map((f, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="bg-white/5 p-2 rounded-lg border border-white/10"><f.icon className="h-5 w-5 text-amber-400" /></div>
                    <div><h4 className="font-bold text-white text-sm">{f.title}</h4><p className="text-slate-500 text-[11px] mt-1">{f.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <Card className="bg-white/5 border border-white/10 p-10 rounded-[3rem] backdrop-blur-sm relative group">
              <div className="absolute -top-6 -right-6 bg-amber-500 p-4 rounded-2xl shadow-xl animate-bounce text-black">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-black italic mb-6 uppercase tracking-tighter">Blindaje Operativo</h3>
              <div className="space-y-4">
                <div className="p-6 bg-blue-600/20 rounded-[2rem] border border-blue-500/30">
                  <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Eficiencia Real-Time</p>
                  <p className="text-4xl font-black italic tracking-tighter text-blue-100">98.4%</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-32 bg-white overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">
            ¿Listo para ordenar <br />tu gestión técnica?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button asChild size="lg" className="h-20 px-12 rounded-[2rem] text-xl font-black shadow-2xl group">
              <Link href="/auth/signup">
                Empezar gratis ahora <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-20 px-12 rounded-[2rem] text-xl font-bold border-2 gap-3" asChild>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-6 w-6 text-emerald-500" /> WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>

      <footer className="py-12 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <img src="/logoweb.png" alt="Logo" className="h-6 w-auto object-contain opacity-50" />
          <div className="flex items-center gap-4">
            <a href={WHATSAPP_URL} className="text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors flex items-center gap-1">
              <MessageCircle className="h-4 w-4" /> +56 9 4124 5316
            </a>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">© {new Date().getFullYear()} - Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
