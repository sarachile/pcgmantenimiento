
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
  BellRing
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Image from "next/image";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const { isAuthenticated } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
                  <app.icon className={cn("h-8 w-8", app.icon.name === 'Water' ? 'text-blue-500' : app.color)} />
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

      {/* Trazabilidad Section */}
      <section id="solucion" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-square md:aspect-video lg:aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 bg-white p-2">
              <div className="relative w-full h-full rounded-[2rem] overflow-hidden">
                <Image 
                  src="/imagen3.png" 
                  alt="Gestión Operativa PCGMANTENIMIENTO" 
                  fill 
                  className="object-cover"
                  data-ai-hint="industrial maintenance"
                />
              </div>
            </div>

            <div className="space-y-10">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                  Trazabilidad blindada:<br />
                  <span className="text-primary">Evidencia real que respalda tu marca.</span>
                </h2>
              </div>

              <div className="space-y-6">
                {[
                  { icon: XCircle, title: "Fin del Caos", desc: "Dile adiós a los reportes en papel que se pierden, se mojan o nunca se actualizan." },
                  { icon: History, title: "Certificación Inalterable", desc: "Marcas de tiempo y GPS de cada intervención para auditorías técnicas sin dudas." },
                  { icon: Zap, title: "Informes al Instante", desc: "Genera el informe técnico PDF y el certificado de experiencia en un clic." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="bg-white p-3 rounded-xl h-fit border group-hover:border-primary/30 shadow-sm transition-colors">
                      <item.icon className="text-primary h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl mb-1 text-slate-900">{item.title}</h3>
                      <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <img src="/logoweb.png" alt="PCG" className="h-24 w-auto object-contain grayscale" />
                </div>
                <h3 className="text-2xl font-black italic mb-2 text-slate-900">"Lo que no se registra, no existe"</h3>
                <p className="text-slate-500 font-medium mb-8">Centraliza toda tu operación en una herramienta diseñada para el rigor del terreno y la confianza del cliente.</p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-4xl font-black text-primary tracking-tighter">100%</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trazabilidad de Activos</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-4xl font-black text-primary tracking-tighter">0</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fugas de Información</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW WATER MONITORING SECTION */}
      <section id="agua" className="py-24 bg-white relative overflow-hidden border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <Badge className="bg-blue-600 text-white font-black px-4 py-1 uppercase tracking-widest rounded-full">Solución Inteligente para Condominios y Edificios</Badge>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 uppercase italic">
              Sistema de Monitoreo de Agua <br />
              <span className="text-blue-600">en Tiempo Real</span>
            </h2>
            <p className="text-slate-500 text-lg font-medium max-w-3xl mx-auto">
              Control total y ahorro garantizado con tecnología ultrasónica avanzada. Disponible en todo el territorio nacional.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* ZONA DE CASA */}
            <Card className="rounded-[2.5rem] border-2 border-slate-100 shadow-xl overflow-hidden bg-white group hover:border-blue-200 transition-all">
              <CardHeader className="bg-blue-50 p-8 border-b">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-200">
                    <Droplets className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="border-blue-200 text-blue-600 font-black uppercase text-[10px]">Zona de Casa</Badge>
                </div>
                <CardTitle className="text-xl font-black italic uppercase text-slate-900">Kit de Instalación PCG</CardTitle>
                <CardDescription className="font-bold text-blue-600/70">Medidor Ultrasónico Inteligente</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                <ul className="space-y-3">
                  {[
                    { icon: Zap, text: "Sin piezas móviles (no se gasta con sarro)" },
                    { icon: Droplets, text: "Detección de goteos mínimos" },
                    { icon: Infinity, text: "Batería de larga duración (16 años)" },
                    { icon: ShieldCheck, text: "Sello de seguridad antifraude" },
                    { icon: Signal, text: "Independiente de Wi-Fi del vecino" }
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                      <item.icon className="h-4 w-4 text-blue-500 shrink-0" />
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* ZONA COMÚN */}
            <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-slate-900 text-white group scale-105 z-10">
              <CardHeader className="bg-white/5 p-8 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-500 p-3 rounded-2xl text-white shadow-lg shadow-blue-900">
                    <Radio className="h-6 w-6" />
                  </div>
                  <Badge className="bg-blue-600 text-white font-black uppercase text-[10px] border-none">Zona Común</Badge>
                </div>
                <CardTitle className="text-xl font-black italic uppercase">Red de Radio Centralizada</CardTitle>
                <CardDescription className="font-bold text-blue-400">Infraestructura LoRaWAN/Sigfox</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                <ul className="space-y-3">
                  {[
                    { icon: Signal, text: "Antena Receptora Maestra PCG" },
                    { icon: CloudLightning, text: "Señal de radio privada y segura" },
                    { icon: Router, text: "Gateway Central (Conserjería)" },
                    { icon: Globe, text: "Conexión 4G o Fibra dedicada" },
                    { icon: Layers, text: "Sistema escalable para múltiples unidades" }
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-300">
                      <item.icon className="h-4 w-4 text-blue-400 shrink-0" />
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* ADMINISTRACIÓN Y CRM */}
            <Card className="rounded-[2.5rem] border-2 border-slate-100 shadow-xl overflow-hidden bg-white group hover:border-blue-200 transition-all">
              <CardHeader className="bg-blue-50 p-8 border-b">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-lg">
                    <LayoutDashboard className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="border-slate-200 text-slate-900 font-black uppercase text-[10px]">Gestión Digital</Badge>
                </div>
                <CardTitle className="text-xl font-black italic uppercase text-slate-900">Administración y CRM</CardTitle>
                <CardDescription className="font-bold text-slate-500">Inteligencia PCGoperacion</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                <ul className="space-y-3">
                  {[
                    { icon: ShieldAlert, text: "Alertas de manipulación y fraude" },
                    { icon: BellRing, text: "Alerta de fugas (consumo nocturno)" },
                    { icon: BarChart3, text: "Reporte detallado de picos de consumo" },
                    { icon: Battery, text: "Monitoreo de estado del nodo y batería" },
                    { icon: Zap, text: "Optimización de riego y gestión del agua" }
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                      <item.icon className="h-4 w-4 text-blue-500 shrink-0" />
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-16 bg-blue-50 rounded-[3rem] p-10 border-2 border-blue-100 text-center relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 opacity-10"><Waves className="h-48 w-48 text-blue-600" /></div>
            <h3 className="text-2xl font-black italic uppercase text-slate-900 mb-2">Balance de Agua Instantáneo</h3>
            <p className="text-slate-600 font-medium max-w-2xl mx-auto mb-8">
              Nuestra plataforma realiza un balance automático entre el medidor matriz y los remarcadores de cada unidad, detectando pérdidas en la red matriz de forma inmediata.
            </p>
            <div className="flex justify-center gap-12 flex-wrap">
              <div className="text-center">
                <p className="text-4xl font-black text-blue-600 italic leading-none">99.9%</p>
                <p className="text-[10px] font-black uppercase text-slate-400 mt-2 tracking-widest">Precisión Ultrasónica</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-black text-blue-600 italic leading-none">24/7</p>
                <p className="text-[10px] font-black uppercase text-slate-400 mt-2 tracking-widest">Monitoreo Live</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-black text-blue-600 italic leading-none">0%</p>
                <p className="text-[10px] font-black uppercase text-slate-400 mt-2 tracking-widest">Wi-Fi Dependencia</p>
              </div>
            </div>
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
                Sabemos que en la energía solar, la continuidad operativa es dinero. Nuestra plataforma utiliza sensores inteligentes para monitorear cada panel e inversor, detectando remotamente fallas, suciedad o caídas de tensión antes de que afecten el ahorro del cliente.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { icon: Sun, title: "Protocolos Fotovoltaicos", desc: "Checklists específicos para inversores, cableado y anclajes." },
                  { icon: Fingerprint, title: "Sello de Recepción", desc: "El cliente firma en terreno vía QR para evitar disputas de pago." },
                  { icon: Activity, title: "Tu Ahorro en Vivo", desc: "Tu cliente ve en vivo cómo sus paneles generan dinero, asegurando su inversión segundo a segundo." },
                  { icon: Bell, title: "Alertas Preventivas", desc: "Detección automática de caídas de tensión o suciedad extrema." }
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
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Monitor Live</span>
                </div>
              </div>
              
              <div className="mb-8 p-6 bg-blue-600/20 rounded-[2rem] border border-blue-500/30 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-20"><Waves className="h-24 w-24 text-blue-400" /></div>
                <div className="flex justify-between items-end relative z-10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Eficiencia Real-Time</p>
                    <p className="text-4xl font-black italic tracking-tighter text-blue-100">98.4%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black uppercase text-slate-500">Última lectura</p>
                    <p className="text-[10px] font-bold text-emerald-400">Hace 2 segundos</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Generación Hoy", value: "Lectura Real-Time", highlight: true },
                  { label: "Ahorro Mensual", value: "$ USD en vivo", highlight: true },
                  { label: "Diagnóstico Remoto", value: "Vía Sensores IoT", highlight: true },
                  { label: "Necesidad Mantención", value: "Alerta Automática", highlight: true },
                  { label: "Evidencia de Inversores", value: "Fotos Obligatorias" },
                  { label: "Sincronización API", value: "Listo para tu CRM" }
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
            <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
              No esperes a que el cliente te llame. Deja que tus activos hablen por ti.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 rounded-[2.5rem] border-none shadow-xl bg-white space-y-6">
              <div className="bg-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                <Waves className="text-white h-8 w-8" />
              </div>
              <h3 className="text-2xl font-black italic uppercase tracking-tight">Monitoreo 24/7</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Integramos sensores de corriente, presión y temperatura. Si un parámetro sale de rango, el ERP crea una **Orden de Trabajo automática**.
              </p>
            </Card>

            <Card className="p-8 rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white space-y-6">
              <div className="bg-blue-500 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900">
                <Database className="text-white h-8 w-8" />
              </div>
              <h3 className="text-2xl font-black italic uppercase tracking-tight">API Gateway</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                ¿Usas SAP o Softland? Nuestra API abierta sincroniza clientes, facturas y personal, eliminando la doble digitación.
              </p>
            </Card>

            <Card className="p-8 rounded-[2.5rem] border-none shadow-xl bg-white space-y-6">
              <div className="bg-emerald-500 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
                <Check className="text-white h-8 w-8" />
              </div>
              <h3 className="text-2xl font-black italic uppercase tracking-tight">Mantenimiento Predictivo</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Anticípate a las fallas. Recibe alertas en tu panel de control antes de que el equipo del cliente se detenga.
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
            <p className="text-slate-500 text-xl font-medium">Únete a las empresas que ya digitalizaron su confianza operativa.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button asChild size="lg" className="h-20 px-12 rounded-[2rem] text-xl font-black shadow-2xl shadow-primary/20 group">
              <Link href="/auth/signup">
                Empezar gratis ahora <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
              </Link>
            </Button>
            <div className="text-left">
              <p className="text-sm font-black text-slate-900 uppercase">Sin tarjetas de crédito</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Activa tu cuadrilla en 5 minutos</p>
            </div>
          </div>

          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40 grayscale">
            <div className="flex flex-col items-center gap-2">
              <img src="/logoweb.png" alt="Seguridad" className="h-10 w-auto object-contain" />
              <span className="text-[10px] font-black uppercase">Seguridad SSL</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <CloudLightning className="h-8 w-8" />
              <span className="text-[10px] font-black uppercase">Cloud Native</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Search className="h-8 w-8" />
              <span className="text-[10px] font-black uppercase">Auditable 100%</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <MessageSquare className="h-8 w-8" />
              <span className="text-[10px] font-black uppercase">Feedback Directo</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 bg-slate-50 border-t border-slate-100 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 opacity-50">
            <img src="/logoweb.png" alt="Logo" className="h-6 w-auto object-contain" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} - Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">
            <Link href="/terms" className="hover:text-primary transition-colors">Términos</Link>
            <a href="#" className="hover:text-primary transition-colors">Privacidad</a>
            <Link href="/support" className="hover:text-primary transition-colors">Soporte</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
