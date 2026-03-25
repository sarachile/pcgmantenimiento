
'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  History,
  HelpCircle,
  Radio,
  Gauge,
  Eye,
  Filter
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const WHATSAPP_URL = "https://wa.me/56941245316?text=Hola,%20me%20interesa%20saber%20m%C3%A1s%20sobre%20pcgmantenimiento.";

export default function HomePage() {
  const { isAuthenticated } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Estados para el simulador de impacto hídrico
  const [litersLost, setLitersLost] = useState(0);
  const [moneyLost, setMoneyLost] = useState(0);

  // Datos simulados para el gráfico de monitoreo live
  const monitorData = [
    { time: "02:00", value: 0.1 },
    { time: "02:15", value: 0.12 },
    { time: "02:30", value: 0.08 },
    { time: "02:45", value: 0.15 },
    { time: "03:00", value: 0.85 }, // Spike (Fuga)
    { time: "03:15", value: 0.92 },
    { time: "03:30", value: 0.88 },
    { time: "03:45", value: 0.95 },
    { time: "04:00", value: 0.91 },
  ];

  useEffect(() => {
    setMounted(true);
    
    const interval = setInterval(() => {
      setLitersLost(prev => prev + 0.0125);
      // Costo aproximado en Chile: $1.8 por litro (Agua + Alcantarillado)
      setMoneyLost(prev => prev + (0.0125 * 1.8));
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

  const faqs = [
    {
      q: "¿Cómo funcionan los medidores inteligentes y por qué son mejores que los tradicionales?",
      a: "Usamos Medidores Ultrasónicos Inteligentes PCG, que no tienen piezas móviles en su interior. Esto es clave: al no tener engranajes, no se desgastan ni se traban con el sarro, lo que garantiza mediciones exactas por 16 años de vida útil de batería. Detectan flujos mínimos y goteos que los medidores antiguos ignoran.",
      icon: Gauge
    },
    {
      q: "¿Es necesario que cada departamento/casa tenga Wi-Fi para que el sistema funcione?",
      a: "No, para nada. Nuestros medidores son totalmente independientes del Wi-Fi de los vecinos. Usan una Red de Radio Privada PCG (LoRaWAN/Sigfox) de largo alcance y bajo consumo. Todos los datos se envían de forma segura a una Antena Receptora Maestra centralizada en la conserjería o administración.",
      icon: Radio
    },
    {
      q: "¿Qué tipo de alertas y reportes recibe la administración y los copropietarios?",
      a: "Our platform generates automatic alerts in real time for: \n\n💧 Continuous Leak Alert: Detection of night-time consumption or constant flows indicating an internal leak.\n\n🚫 Tamper Alert: Immediate notification if someone attempts to interfere with or open the meter (fraud).\n\n⚠️ Battery/Signal Status: Preventive warning for technical maintenance of the equipment.\n\n📊 Peak Reports: Analysis of consumption peaks to optimize irrigation and use of common areas.",
      icon: Activity
    },
    {
      q: "¿Cómo funciona el Corte de Paso Remoto en caso de emergencia?",
      a: "Ante una matriz rota, un flexible reventado en un departamento vacío (ej. vacaciones) o por solicitud del usuario para mantenimiento interno, la administración (o el usuario vía CRM) puede accionar una válvula integrada en el medidor para cortar el suministro de esa unidad de forma remota en segundos, evitando inundaciones y daños estructurales sin afectar a los demás vecinos.",
      icon: Zap
    },
    {
      q: "¿Este sistema es solo para edificios o sirve para parcelaciones y condominios extendidos?",
      a: "Gracias a nuestra tecnología de radio de largo alcance, el sistema es escalable y perfecto para condominios de casas y parcelaciones. Podemos cubrir grandes distancias desde las unidades hasta el Gateway central, asegurando la trazabilidad completa del agua desde la matriz hasta cada hogar.",
      icon: Globe
    },
    {
      q: "¿Qué es el sensor de turbidez y cómo previene problemas?",
      a: "Instalamos sensores ópticos que monitorean la claridad del agua en tiempo real. Si el agua se vuelve turbia (por roturas de matriz externa o sedimentos), el sistema genera una alerta inmediata. Esto permite limpiar filtros o cerrar el paso preventivamente antes de que el agua dañe calefonts, lavadoras o grifería de los departamentos.",
      icon: Waves
    }
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
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-16 leading-relaxed">
            Certifica la calidad de tu equipo en terreno. Reemplaza la incertidumbre por evidencia real, firmas digitales y <span className="text-primary font-bold">monitoreo inteligente de activos</span>.
          </p>

          {/* Rejilla de Imágenes Operativas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="group relative overflow-hidden rounded-[2.5rem] border-4 border-white shadow-2xl transition-all hover:scale-[1.02] bg-slate-100 aspect-[4/3]">
              <Image 
                src="/imagen1.png" 
                alt="Instalador operando con PCG" 
                fill 
                className="object-cover" 
                data-ai-hint="technician working"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8 text-left">
                <p className="text-white text-xs font-black uppercase tracking-widest italic mb-1">Simplicidad</p>
                <p className="text-white/80 text-[10px] font-bold uppercase">Gestión ágil desde cualquier dispositivo móvil.</p>
              </div>
            </div>
            
            <div className="group relative overflow-hidden rounded-[2.5rem] border-4 border-white shadow-2xl transition-all hover:scale-[1.02] bg-slate-100 aspect-[4/3] md:mt-12">
              <Image 
                src="/imagen2.png" 
                alt="Firma digital en terreno" 
                fill 
                className="object-cover" 
                data-ai-hint="digital signature"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8 text-left">
                <p className="text-white text-xs font-black uppercase tracking-widest italic mb-1">Versatilidad</p>
                <p className="text-white/80 text-[10px] font-bold uppercase">Aprobaciones instantáneas con sello QR inalterable.</p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-[2.5rem] border-4 border-white shadow-2xl transition-all hover:scale-[1.02] bg-slate-100 aspect-[4/3]">
              <Image 
                src="/imagen3.png" 
                alt="Entrega conforme de servicios" 
                fill 
                className="object-cover" 
                data-ai-hint="professional service"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8 text-left">
                <p className="text-white text-xs font-black uppercase tracking-widest italic mb-1">Profesionalismo</p>
                <p className="text-white/80 text-[10px] font-bold uppercase">Reportes automáticos que generan confianza en el cliente.</p>
              </div>
            </div>
          </div>

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

      {/* Gestión de Activos Críticos - Agua (PROFESSIONAL VERSION) */}
      <section id="agua" className="py-32 bg-slate-50 relative overflow-hidden border-b">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/30 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-24 space-y-6">
            <Badge className="bg-blue-600 text-white font-black px-6 py-2 uppercase tracking-[0.3em] rounded-full shadow-2xl shadow-blue-900/20 border-none text-[10px]">
              Infraestructura Hídrica Inteligente
            </Badge>
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-slate-900 uppercase italic leading-[0.85]">
              Control Total <br />
              <span className="text-blue-600">Gota a Gota</span>
            </h2>
            <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
              Tecnología ultrasónica avanzada y red de radio privada para una trazabilidad inalterable del consumo de agua en comunidades y parcelaciones.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-stretch">
            {/* LADO IZQUIERDO: MONITOR TÉCNICO (SIMULADOR) */}
            <div className="lg:col-span-8 group">
              <Card className="rounded-[3.5rem] border-none shadow-2xl bg-slate-950 text-white overflow-hidden h-full flex flex-col relative border-t border-white/10">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
                
                <div className="p-8 md:p-12 relative z-10 flex-1 flex flex-col">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(59,130,246,1)]" />
                        <h3 className="text-sm font-black uppercase tracking-[0.4em] text-blue-400 italic">Telemetría Live v2.1</h3>
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gateway: Conectado vía LoRaWAN • Frecuencia: 15 min</p>
                    </div>
                    <Badge variant="outline" className="border-rose-500/50 text-rose-500 bg-rose-500/5 px-4 py-2 font-black uppercase text-[10px] tracking-widest animate-pulse">
                      Evento de Fuga Detectado
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-12 items-center flex-1">
                    <div className="relative h-[280px] w-full bg-slate-900 rounded-[2.5rem] border-2 border-white/10 p-6 shadow-inner">
                      <div className="absolute top-4 left-6 flex items-center gap-2 z-20">
                        <Activity className="h-3 w-3 text-blue-400 animate-pulse" />
                        <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Monitoreo de Flujo (m³/h)</span>
                      </div>
                      
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monitorData}>
                          <defs>
                            <linearGradient id="monitorGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                          <XAxis 
                            dataKey="time" 
                            fontSize={8} 
                            axisLine={false} 
                            tickLine={false} 
                            stroke="#475569" 
                            fontWeight="bold"
                          />
                          <YAxis hide domain={[0, 1.2]} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '10px' }}
                            itemStyle={{ color: '#3b82f6', fontWeight: '900' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#3b82f6" 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#monitorGradient)" 
                            animationDuration={2000}
                          />
                          <ReferenceLine y={0.8} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'ALERTA', fill: '#ef4444', fontSize: 8, fontWeight: '900' }} />
                        </AreaChart>
                      </ResponsiveContainer>

                      <div className="absolute bottom-4 right-6 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-[8px] font-black text-slate-500 uppercase">Streaming Activo</span>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="space-y-6">
                        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-sm group-hover:bg-white/10 transition-colors">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Volumen Desperdiciado</p>
                            <TrendingDown className="h-4 w-4 text-rose-500" />
                          </div>
                          <div className="flex items-baseline gap-2">
                            <p className="text-6xl font-black italic tracking-tighter tabular-nums text-white">
                              {litersLost.toFixed(2)}
                            </p>
                            <span className="text-xl font-bold text-slate-500 uppercase italic">Litros</span>
                          </div>
                        </div>

                        <div className="bg-rose-500/5 p-8 rounded-[2.5rem] border border-rose-500/20 backdrop-blur-sm group-hover:bg-rose-500/10 transition-colors">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-[10px] font-black uppercase text-rose-400 tracking-widest">Pérdida Financiera (CLP)</p>
                            <CircleDollarSign className="h-4 w-4 text-rose-400" />
                          </div>
                          <div className="flex items-baseline gap-2">
                            <p className="text-6xl font-black italic tracking-tighter tabular-nums text-rose-100">
                              $ {moneyLost.toFixed(1)}
                            </p>
                            <span className="text-xl font-bold text-rose-500/50 uppercase italic">Hoy</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button asChild size="lg" className="h-16 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/40 text-xs transition-all hover:scale-[1.02]">
                      <Link href="/auth/signup">Detener pérdidas ahora <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-16 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 font-black uppercase tracking-[0.2em] text-xs">
                      <Link href="/water-control/login" className="flex items-center justify-center gap-3">
                        <Monitor className="h-4 w-4 text-blue-400" /> Acceso Administradores
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* LADO DERECHO: SERVICIOS TÉCNICOS */}
            <div className="lg:col-span-4 flex flex-col gap-8">
              {/* Tarjeta Turbidez */}
              <Card className="rounded-[3rem] border-none shadow-xl bg-white overflow-hidden flex-1 group hover:shadow-2xl transition-all border-b-8 border-indigo-600">
                <div className="p-10 bg-indigo-50 border-b border-indigo-100 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="bg-indigo-600 p-5 rounded-3xl shadow-xl shadow-indigo-900/20 group-hover:rotate-6 transition-transform">
                    <Waves className="h-10 w-10 text-white" />
                  </div>
                  <Badge className="bg-indigo-100 text-indigo-700 font-black px-4 py-1.5 uppercase tracking-widest rounded-full border-none text-[9px]">Protección de Red</Badge>
                </div>
                <CardContent className="p-10 space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-indigo-950">Sensor de Turbidez</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                      Monitoreo óptico de pureza. Recibe alertas preventivas antes de que sedimentos dañen calefonts, lavadoras o grifería tras roturas de matriz externa.
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-indigo-900 font-bold uppercase tracking-tight">Preserva la vida útil de los activos del hogar.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Tarjeta Tecnología */}
              <Card className="rounded-[3rem] border-none shadow-xl bg-blue-600 text-white p-10 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700"><Radio className="h-48 w-48" /></div>
                <div className="relative z-10 space-y-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-200">Especificaciones</p>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Red Privada <br/>PCG Wireless</h3>
                  </div>
                  <ul className="space-y-3">
                    {[
                      "Independiente del Wi-Fi de vecinos",
                      "Alcance de hasta 5km (Line-of-Sight)",
                      "Batería industrial (16 años vida útil)",
                      "Cifrado militar AES-128"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-xs font-bold text-blue-50">
                        <Zap className="h-3.5 w-3.5 text-white fill-white" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
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

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-slate-50 border-t">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto text-primary">
              <HelpCircle className="h-6 w-6" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic">Todo lo que necesita saber sobre nuestra <span className="text-primary">tecnología de Agua</span></h2>
            <p className="text-slate-500 font-medium">Resolvemos las dudas más frecuentes de comités y administraciones.</p>
          </div>

          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden p-8 md:p-12">
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-b border-slate-100 last:border-0 pb-2">
                  <AccordionTrigger className="hover:no-underline hover:text-primary text-left py-4">
                    <div className="flex items-center gap-4 pr-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                        <faq.icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-black text-slate-900 uppercase italic tracking-tight text-sm md:text-base leading-snug">
                        {faq.q}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 pl-14">
                    <p className="text-slate-600 text-sm md:text-base leading-relaxed font-medium whitespace-pre-line">
                      {faq.a}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
          <div className="flex flex-col items-center gap-4">
            <span className="font-black text-2xl tracking-tighter text-slate-900 uppercase italic">PCGMANTENIMIENTO</span>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em]">Soluciones para el Terreno Industrial</p>
          </div>
          
          <div className="flex justify-center gap-8 text-[10px] font-black uppercase text-slate-400 tracking-widest flex-wrap px-4">
            <Link href="/terms" className="hover:text-primary transition-colors">Términos Legales</Link>
            <Link href="/auth/signup" className="hover:text-primary transition-colors">Empezar Gratis</Link>
            <Link href="/water-control/login" className="text-blue-600 hover:text-blue-700 font-black flex items-center gap-1.5 transition-colors">
              <Droplets className="h-3 w-3" /> Portal Administradores de Edificio (IoT)
            </Link>
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
