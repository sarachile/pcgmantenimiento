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
  CircleDollarSign,
  Fingerprint,
  FileText,
  Cpu,
  Monitor,
  BarChart3,
  Globe,
  Receipt,
  History
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

  const workflow = [
    { title: "Generación de OT", desc: "Define el alcance y asigna técnicos desde la oficina o móvil.", icon: FileText },
    { title: "Ejecución Terreno", desc: "Checklists con fotos GPS obligatorias para trazabilidad total.", icon: HardHat },
    { title: "Firma Digital", desc: "El cliente aprueba el servicio mediante QR en el acto.", icon: Fingerprint },
    { title: "Cierre y Factura", desc: "Generación automática de reporte PDF y emisión de DTE.", icon: Receipt },
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
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b p-4 space-y-4 animate-in slide-in-from-top-2">
            <a href="#plataforma" className="block text-sm font-bold uppercase" onClick={() => setIsMenuOpen(false)}>La Plataforma</a>
            <a href="#agua" className="block text-sm font-bold uppercase" onClick={() => setIsMenuOpen(false)}>Gestión Agua</a>
            <a href="#solar" className="block text-sm font-bold uppercase" onClick={() => setIsMenuOpen(false)}>Energía Solar</a>
            <hr />
            {isAuthenticated ? (
              <Button asChild className="w-full rounded-xl"><Link href="/dashboard">Panel de Control</Link></Button>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Button asChild variant="outline" className="rounded-xl"><Link href="/auth/login">Ingresar</Link></Button>
                <Button asChild className="rounded-xl"><Link href="/auth/signup">Empezar</Link></Button>
              </div>
            )}
          </div>
        )}
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
            <Button asChild variant="outline" size="lg" className="h-14 px-10 rounded-full text-lg font-bold border-2">
              <Link href="#agua">Ver soluciones por rubro</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Áreas de Aplicación Marquee */}
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

      {/* Como funciona Workflow */}
      <section id="plataforma" className="py-24 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">El Ciclo de la <span className="text-primary">Excelencia Técnica</span></h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto font-medium">Una plataforma fluida que conecta la oficina con el terreno y el cliente final.</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {workflow.map((item, i) => (
              <div key={i} className="relative group p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                <div className="bg-primary text-white w-12 h-12 rounded-xl flex items-center justify-center font-black mb-6 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                  {i + 1}
                </div>
                <item.icon className="h-10 w-10 text-primary/40 mb-4" />
                <h4 className="text-xl font-black uppercase tracking-tight mb-2">{item.title}</h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                {i < workflow.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 translate-y-[-50%] text-slate-200">
                    <ArrowRight className="h-8 w-8" />
                  </div>
                )}
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
                  {/* Gotas animadas cayendo */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-full h-40 pointer-events-none z-0">
                    <div className="absolute left-[20%] animate-drop" style={{ animationDelay: '0s' }}>
                      <Droplets className="h-4 w-4 text-blue-400/40 fill-blue-400/20" />
                    </div>
                    <div className="absolute left-[50%] animate-drop" style={{ animationDelay: '0.5s' }}>
                      <Droplets className="h-3 w-3 text-blue-400/30 fill-blue-400/10" />
                    </div>
                    <div className="absolute left-[80%] animate-drop" style={{ animationDelay: '1s' }}>
                      <Droplets className="h-5 w-5 text-blue-400/20 fill-blue-400/5" />
                    </div>
                  </div>

                  <div className="bg-slate-800 p-8 rounded-[2.5rem] border-4 border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.3)] relative z-10">
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

      {/* Energía Solar Section */}
      <section id="solar" className="py-24 bg-slate-900 text-white border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <Badge className="bg-amber-500 text-slate-900 font-black uppercase px-4 py-1">Energía del Futuro</Badge>
              <h2 className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic leading-[0.9]">
                Monitoreo Solar <br />
                <span className="text-amber-500">Sin Puntos Ciegos</span>
              </h2>
              <p className="text-xl text-slate-400 leading-relaxed font-medium">
                Sincroniza tus plantas fotovoltaicas. Recibe alertas de bajo rendimiento (kW) y programa mantenciones preventivas antes de que afecten la rentabilidad de tus clientes.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { label: "Lectura Live", desc: "Integración API con inversores", icon: Zap },
                  { label: "Alarmas", desc: "Notificaciones por caída de red", icon: AlertTriangle },
                  { label: "KPIs", desc: "Eficiencia de generación diaria", icon: BarChart3 },
                  { label: "Histórico", desc: "Reportes de rendimiento mensual", icon: History },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="p-3 bg-amber-500/20 text-amber-500 rounded-xl h-fit">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-black text-sm uppercase tracking-tight">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/20 blur-[120px] rounded-full" />
              <div className="relative bg-slate-800 border-4 border-slate-700 rounded-[3rem] p-10 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Planta El Quisco - Online</span>
                  </div>
                  <Cpu className="text-amber-500 h-6 w-6" />
                </div>
                <div className="space-y-6">
                  <div className="bg-slate-900 p-8 rounded-[2rem] border border-white/10">
                    <p className="text-[10px] font-black uppercase text-amber-500 mb-2">Potencia Instantánea</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-black italic tracking-tighter">125.4</span>
                      <span className="text-2xl font-bold text-slate-500 uppercase">kW</span>
                    </div>
                  </div>
                  <div className="h-32 flex items-end gap-2 px-2">
                    {[40, 60, 45, 90, 100, 85, 70, 95, 110, 125].map((h, i) => (
                      <div key={i} className="flex-1 bg-amber-500/20 rounded-t-lg relative group">
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-amber-500 rounded-t-lg transition-all duration-1000" 
                          style={{ height: `${h}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Características Finales */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="bg-blue-100 text-blue-600 p-4 rounded-3xl w-fit">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Trazabilidad Inalterable</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Cada registro tiene una marca digital única. Cumplimos con los más altos estándares de auditoría para empresas que trabajan con el Estado y grandes corporaciones.
              </p>
            </div>
            <div className="space-y-4">
              <div className="bg-indigo-100 text-indigo-600 p-4 rounded-3xl w-fit">
                <Smartphone className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Sello Digital QR</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Tus clientes no necesitan cuentas. Escanean el móvil de tu técnico, revisan el reporte y firman digitalmente. Generación automática de certificados de experiencia.
              </p>
            </div>
            <div className="space-y-4">
              <div className="bg-purple-100 text-purple-600 p-4 rounded-3xl w-fit">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">Inteligencia GenAI</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Nuestra IA procesa meses de bitácoras técnicas para entregarte resúmenes ejecutivos listos para presentar en tus reuniones de gerencia o licitaciones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
          <div className="flex flex-col items-center gap-4">
            <span className="font-black text-2xl tracking-tighter text-slate-900 uppercase italic">PCGMANTENIMIENTO</span>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em]">Soluciones para el Terreno Industrial</p>
          </div>
          
          <div className="flex justify-center gap-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">
            <Link href="/terms" className="hover:text-primary transition-colors">Términos Legales</Link>
            <Link href="/auth/signup" className="hover:text-primary transition-colors">Empezar Gratis</Link>
            <a href={WHATSAPP_URL} className="hover:text-primary transition-colors">Soporte</a>
          </div>

          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] pt-10">
            © {new Date().getFullYear()} - PCGMANTENIMIENTO.COM - MADE IN CHILE
          </p>
        </div>
      </footer>
    </div>
  );
}
