
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
  XCircle,
  History,
  Zap,
  CheckCircle2,
  HardHat,
  Cpu,
  Fingerprint,
  FileBadge,
  CloudLightning,
  Smartphone,
  BarChart3,
  Search,
  MessageSquare,
  Sun,
  Waves,
  Database,
  Check,
  Layers,
  Sparkles,
  Activity,
  Bell,
  Thermometer,
  Wind,
  Wrench,
  Construction,
  Stethoscope,
  Building2,
  Briefcase,
  Truck,
  Bug,
  Droplets,
  Radio,
  Signal,
  Battery,
  ShieldAlert,
  Infinity,
  Router,
  BellRing,
  Globe,
  AlertTriangle,
  TrendingDown,
  Scale,
  Users,
  Timer,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { isAuthenticated } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Estados para el simulador de fuga
  const [litersLost, setLitersLost] = useState(0);
  const [moneyLost, setMoneyLost] = useState(0);

  useEffect(() => {
    setMounted(true);
    
    // Simular pérdida de agua en tiempo real (Riego defectuoso ~1500L/hora = ~0.41L/segundo)
    const interval = setInterval(() => {
      setLitersLost(prev => prev + 0.41);
      // Costo aproximado en Chile: $1.800 por m3 ($1.8 por litro)
      setMoneyLost(prev => prev + (0.41 * 1.8));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse">
          <img src="/logoweb.png" alt="Cargando..." className="h-12 w-auto object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
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
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-transparent p-1.5">
                <img src="/logoweb.png" alt="PCGMANTENIMIENTO" className="h-10 w-auto object-contain" />
              </div>
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
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b p-4 space-y-4 flex flex-col animate-in slide-in-from-top-2">
            <a href="#plataforma" className="font-bold text-slate-600 px-4" onClick={() => setIsMenuOpen(false)}>La Plataforma</a>
            <a href="#agua" className="font-bold text-slate-600 px-4" onClick={() => setIsMenuOpen(false)}>Gestión Agua</a>
            <a href="#solar" className="font-bold text-slate-600 px-4" onClick={() => setIsMenuOpen(false)}>Energía Solar</a>
            <a href="#iot" className="font-bold text-slate-600 px-4" onClick={() => setIsMenuOpen(false)}>Ecosistema IoT</a>
            <hr />
            <Link href="/auth/login" className="font-bold text-primary px-4">Ingresar</Link>
            <Button asChild className="w-full rounded-xl">
              <Link href="/auth/signup">Empezar Ahora</Link>
            </Button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden relative border-b">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="outline" className="mb-6 py-1 px-4 border-primary/20 text-primary bg-primary/5 rounded-full font-bold uppercase tracking-widest">
            Trazabilidad Inalterable e Integración IoT para Servicios Técnicos
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
            <Button variant="outline" size="lg" className="h-14 px-10 rounded-full text-lg font-bold border-2">
              <a href="#agua">Solución de Agua</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Áreas de Aplicación Section - ANIMATED MARQUEE */}
      <section className="py-20 bg-slate-50/50 overflow-hidden border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] mb-4">Industrias Digitalizadas</p>
          <h3 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900">Sectores que potencian su valor con nuestra tecnología</h3>
        </div>
        
        <div className="relative flex overflow-x-hidden">
          <div className="animate-marquee hover:[animation-play-state:paused] whitespace-nowrap flex py-4">
            {[...applications, ...applications].map((app, i) => (
              <div key={i} className="mx-4 flex items-center gap-6 p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/20 hover:-translate-y-1 transition-all cursor-default">
                <div className={cn("p-4 rounded-2xl", app.bg)}>
                  <app.icon className={cn("h-8 w-8", app.color)} />
                </div>
                <span className="text-lg font-black uppercase tracking-tighter text-slate-800 pr-4">{app.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Description Section - EL SISTEMA NERVIOSO CENTRAL */}
      <section id="plataforma" className="py-32 bg-white relative overflow-hidden border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 space-y-6">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 italic uppercase">
              El Sistema Nervioso Central de tu <br />
              <span className="text-primary">Ecosistema Industrial</span>
            </h2>
            <p className="text-xl text-slate-500 max-w-4xl mx-auto font-medium leading-relaxed">
              PCGMANTENIMIENTO no es solo una App de tareas. Es un ecosistema híbrido que une la **movilidad del terreno** con la **inteligencia administrativa**, permitiendo que tu empresa escale sin perder el control de la calidad.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            <Card className="p-10 rounded-[3rem] bg-slate-900 text-white space-y-6 shadow-2xl relative group">
              <div className="bg-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4"><Layers className="h-6 w-6 text-white" /></div>
              <h3 className="text-2xl font-black italic tracking-tight uppercase">Unidad de Gestión</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Integramos personal, activos, clientes e inventario en un solo flujo. Desde que una falla es detectada hasta que se emite la factura legal, todo viaja de forma fluida.
              </p>
            </Card>

            <Card className="p-10 rounded-[3rem] border-2 border-slate-100 bg-white space-y-6 hover:border-primary/20 transition-all">
              <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4"><Database className="h-6 w-6 text-primary" /></div>
              <h3 className="text-2xl font-black italic tracking-tight uppercase">Base de Datos Viva</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Cada foto, cada firma y cada nota técnica alimenta un histórico inalterable por activo. Cumple con normativas de auditoría y genera reportes instantáneos.
              </p>
            </Card>

            <Card className="p-10 rounded-[3rem] bg-blue-50 border-2 border-blue-100 space-y-6">
              <div className="bg-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4"><Sparkles className="h-6 w-6 text-white" /></div>
              <h3 className="text-2xl font-black italic tracking-tight uppercase text-blue-900">Inteligencia Terreno</h3>
              <p className="text-blue-800/70 text-sm leading-relaxed">
                Utilizamos IA para resumir bitácoras técnicas extensas y convertir datos crudos en información estratégica para tus clientes, ahorrando horas de redacción.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* IMPACTFUL TRANSITION SECTION */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative border-y border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="space-y-6">
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
            <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed mb-12">
              Hemos diseñado soluciones específicas que conectan tus activos críticos directamente a tu pantalla. La visibilidad total ya no es una opción, es una ventaja competitiva basada en la prevención activa.
            </p>
            <div className="flex justify-center">
              <div className="animate-bounce p-4 rounded-full bg-white/5 border border-white/10">
                <ChevronDown className="h-8 w-8 text-blue-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WATER MONITORING SECTION */}
      <section id="agua" className="py-24 bg-gradient-to-b from-blue-100/40 via-white to-blue-50 relative overflow-hidden border-b">
        <div className="absolute top-0 right-0 p-20 opacity-[0.03] pointer-events-none select-none">
          <Waves className="h-96 w-96 text-blue-600 rotate-12" />
        </div>
        <div className="absolute bottom-0 left-0 p-20 opacity-[0.03] pointer-events-none select-none">
          <Droplets className="h-80 w-80 text-blue-600 -rotate-12" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 space-y-4">
            <Badge className="bg-blue-600 text-white font-black px-4 py-1 uppercase tracking-widest rounded-full shadow-lg">Solución Inteligente para Condominios</Badge>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 uppercase italic">
              Sistema de Monitoreo de Agua <br />
              <span className="text-blue-600">en Tiempo Real</span>
            </h2>
            <p className="text-slate-500 text-lg font-medium max-w-3xl mx-auto">
              Control total y ahorro garantizado con tecnología ultrasónica avanzada.
            </p>
          </div>

          {/* SIMULADOR DE FUGA */}
          <div className="mb-20">
            <Card className="rounded-[3rem] border-none shadow-2xl bg-slate-900 text-white overflow-hidden relative">
              <div className="grid lg:grid-cols-2 gap-0 relative z-10">
                <div className="p-10 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-white/10 bg-white/5">
                  <div className="relative mb-12">
                    <div className="bg-slate-800 p-6 rounded-[2rem] border-2 border-blue-500/30 relative z-20 shadow-2xl">
                      <Wind className="h-16 w-16 text-blue-400 rotate-180" />
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 space-y-4 pt-4">
                      <Droplets className="h-8 w-8 text-blue-500 animate-drop opacity-0" />
                      <Droplets className="h-6 w-6 text-blue-400 animate-drop delay-300 opacity-0" />
                      <Droplets className="h-10 w-10 text-blue-600 animate-drop delay-700 opacity-0" />
                    </div>
                  </div>
                  <div className="text-center space-y-2 mt-12">
                    <Badge className="bg-rose-600 text-white font-black px-3 py-1 uppercase tracking-widest animate-pulse">Alerta: Fuga Detectada</Badge>
                    <p className="text-slate-400 text-sm font-medium">Simulando desperdicio por riego defectuoso</p>
                  </div>
                </div>

                <div className="p-10 space-y-8 flex flex-col justify-center">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-blue-400 flex items-center gap-3">
                      <Scale className="h-6 w-6" /> Impacto de la Ineficiencia
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Mira cuánto dinero se pierde por una fuga no detectada en tiempo real:
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 shadow-inner">
                      <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-2">Agua Perdida (Lts)</p>
                      <p className="text-4xl font-black italic tracking-tighter tabular-nums">{litersLost.toFixed(1)}</p>
                    </div>
                    <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 shadow-inner">
                      <p className="text-[10px] font-black uppercase text-rose-400 tracking-widest mb-2">Gasto Estimado (CLP)</p>
                      <p className="text-4xl font-black italic tracking-tighter tabular-nums text-rose-100">$ {moneyLost.toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* TARJETAS DE VALOR */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { icon: TrendingDown, title: "Ahorro Directo", desc: "Reduce hasta un 30% el gasto común mediante la facturación exacta.", color: "text-blue-600", bg: "bg-blue-50" },
              { icon: AlertTriangle, title: "Fugas Invisibles", desc: "Detecta goteos en WC y filtraciones internas en tiempo real.", color: "text-rose-600", bg: "bg-rose-50" },
              { icon: Users, title: "Paz Vecinal", desc: "Elimina los conflictos vecinales gracias a la transparencia total de datos.", color: "text-emerald-600", bg: "bg-emerald-50" },
              { icon: Scale, title: "Justicia Hídrica", desc: "Asegura que cada unidad pague exactamente lo que consume.", color: "text-slate-900", bg: "bg-slate-100" }
            ].map((item, i) => (
              <div key={i} className="p-8 rounded-[2rem] border-2 border-white/50 hover:border-blue-200 transition-all group bg-white/80 backdrop-blur-sm shadow-xl">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm", item.bg, item.color)}>
                  <item.icon className="h-6 w-6" />
                </div>
                <h4 className="font-black text-slate-900 uppercase italic tracking-tight mb-2">{item.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="rounded-[2.5rem] border-2 border-blue-100/50 shadow-2xl overflow-hidden bg-white/90 group hover:border-blue-300 transition-all">
              <CardHeader className="bg-blue-50/50 p-8 border-b">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg">
                    <Droplets className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="border-blue-200 text-blue-600 font-black uppercase text-[10px]">Zona de Casa</Badge>
                </div>
                <CardTitle className="text-xl font-black italic uppercase text-slate-900">Kit Medidor Ultrasónico</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                <ul className="space-y-3">
                  {["Sin piezas móviles", "Detección de goteos mínimos", "Batería 16 años", "Independiente de Wi-Fi"].map((text, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                      <CheckCircle2 className="h-4 w-4 text-blue-500" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-slate-900 text-white group scale-105 z-10">
              <CardHeader className="bg-white/5 p-8 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-500 p-3 rounded-2xl text-white shadow-lg">
                    <Radio className="h-6 w-6" />
                  </div>
                  <Badge className="bg-blue-600 text-white font-black uppercase text-[10px]">Zona Común</Badge>
                </div>
                <CardTitle className="text-xl font-black italic uppercase">Red LoRaWAN Central</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                <ul className="space-y-3">
                  {[
                    { icon: Radio, text: "Antena Maestra PCG" },
                    { icon: CloudLightning, text: "Señal de radio privada y segura" },
                    { icon: Router, text: "Gateway Central (Conserjería)" },
                    { icon: Globe, text: "Conexión 4G o Fibra dedicada" },
                    { icon: Layers, text: "Sistema escalable para múltiples unidades" }
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-300">
                      <item.icon className="h-4 w-4 text-blue-400" />
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-2 border-blue-100/50 shadow-2xl overflow-hidden bg-white/90 group hover:border-blue-300 transition-all">
              <CardHeader className="bg-blue-50/50 p-8 border-b">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-lg">
                    <LayoutDashboard className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="border-slate-200 text-slate-900 font-black uppercase text-[10px]">Gestión Digital</Badge>
                </div>
                <CardTitle className="text-xl font-black italic uppercase text-slate-900">CRM & Dashboard</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                <ul className="space-y-3">
                  {["Alertas de fraude", "Alerta de fugas nocturnas", "Reporte de picos", "Balance instantáneo"].map((text, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Special Solar Section */}
      <section id="solar" className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 p-20 opacity-10"><Sun className="h-64 w-64 text-amber-400 animate-pulse" /></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <Badge className="bg-amber-500 text-black font-black px-4 py-1 uppercase tracking-widest">Especialización: Energía Solar</Badge>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase leading-none">
                El ERP que tu cuadrilla <br />
                <span className="text-amber-400">solar realmente usará.</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                Sabemos que en la energía solar, la continuidad operativa es dinero. Nuestra plataforma utiliza sensores inteligentes para monitorear cada panel e inversor.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { icon: Sun, title: "Protocolos Fotovoltaicos", desc: "Checklists específicos para inversores y anclajes." },
                  { icon: Fingerprint, title: "Sello de Recepción", desc: "El cliente firma en terreno vía QR." },
                  { icon: Activity, title: "Tu Ahorro en Vivo", desc: "Visualización de generación en tiempo real." },
                  { icon: Bell, title: "Alertas Preventivas", desc: "Detección de caídas de tensión." }
                ].map((f, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="bg-white/5 p-2 rounded-lg h-fit border border-white/10">
                      <f.icon className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{f.title}</h4>
                      <p className="text-slate-500 text-[11px] mt-1">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Card className="bg-white/5 border border-white/10 p-10 rounded-[3rem] backdrop-blur-sm relative group">
              <div className="absolute -top-6 -right-6 bg-amber-500 p-4 rounded-2xl shadow-xl animate-bounce">
                <Zap className="h-6 w-6 text-black" />
              </div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black italic">Blindaje de Operación</h3>
                <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Monitor Live</span>
                </div>
              </div>
              
              <div className="mb-8 p-6 bg-blue-600/20 rounded-[2rem] border border-blue-500/30 relative overflow-hidden">
                <div className="flex justify-between items-end relative z-10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Eficiencia Real-Time</p>
                    <p className="text-4xl font-black italic tracking-tighter text-blue-100">98.4%</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Generación Hoy", value: "Lectura Real-Time", highlight: true },
                  { label: "Ahorro Mensual", value: "$ USD en vivo", highlight: true },
                  { label: "Diagnóstico Remoto", value: "Vía Sensores IoT", highlight: true }
                ].map((row, i) => (
                  <div key={i} className={cn(
                    "flex justify-between items-center py-3 border-b border-white/5 text-xs",
                    row.highlight && "bg-white/5 rounded-lg px-2 border-none"
                  )}>
                    <span className={cn("text-slate-400 font-bold uppercase tracking-widest", row.highlight && "text-amber-100")}>{row.label}</span>
                    <span className={cn("font-black flex items-center gap-2", row.highlight ? "text-amber-400" : "text-white opacity-60")}>
                      <CheckCircle2 className="h-3 w-3" /> {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* IoT Integration Section */}
      <section id="iot" className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 space-y-4">
            <Badge variant="outline" className="py-1 px-4 border-blue-200 text-blue-600 bg-blue-50 font-black uppercase tracking-widest">
              Conectividad Industrial
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase italic">Tu Servicio en la Nube IoT</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 rounded-[2.5rem] border-none shadow-xl bg-white space-y-6">
              <div className="bg-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg">
                <Waves className="text-white h-8 w-8" />
              </div>
              <h3 className="text-2xl font-black italic uppercase tracking-tight">Monitoreo 24/7</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Integramos sensores de corriente y presión. Si un parámetro sale de rango, el ERP crea una **Orden de Trabajo automática**.
              </p>
            </Card>

            <Card className="p-8 rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white space-y-6">
              <div className="bg-blue-500 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg">
                <Database className="text-white h-8 w-8" />
              </div>
              <h3 className="text-2xl font-black italic uppercase tracking-tight">API Gateway</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                ¿Usas SAP o Softland? Nuestra API abierta sincroniza clientes y facturas eliminando la doble digitación.
              </p>
            </Card>

            <Card className="p-8 rounded-[2.5rem] border-none shadow-xl bg-white space-y-6">
              <div className="bg-emerald-500 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg">
                <Check className="text-white h-8 w-8" />
              </div>
              <h3 className="text-2xl font-black italic uppercase tracking-tight">Predictivo</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Anticípate a las fallas. Recibe alertas antes de que el equipo del cliente se detenga por completo.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-32 bg-white overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
          <div className="space-y-4">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">
              ¿Listo para ordenar <br />tu gestión técnica?
            </h2>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button asChild size="lg" className="h-20 px-12 rounded-[2rem] text-xl font-black shadow-2xl group">
              <Link href="/auth/signup">
                Empezar gratis ahora <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="py-12 bg-slate-50 border-t border-slate-100 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <img src="/logoweb.png" alt="Logo" className="h-6 w-auto object-contain opacity-50" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} - Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
