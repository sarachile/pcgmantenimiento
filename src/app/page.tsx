'use client';

import { useEffect, useState, useRef } from "react";
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
  Activity,
  Waves,
  Globe,
  Droplets,
  AlertTriangle,
  TrendingDown,
  Scale,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  Radio,
  Gauge,
  Check,
  Coins,
  ShieldAlert,
  SearchCode,
  GraduationCap,
  School,
  HandCoins,
  Microscope,
  Leaf,
  Navigation,
  Monitor,
  History,
  HelpCircle,
  Building2,
  Smartphone,
  PlusSquare,
  Share,
  Download,
  Sparkles
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

const WHATSAPP_URL = "https://wa.me/56941245316?text=Hola,%20me%20interesa%20saber%20m%C3%A1s%20sobre%20GENKO.";

export default function HomePage() {
  const { isAuthenticated } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [litersLost, setLitersLost] = useState(0);
  const [moneyLost, setMoneyLost] = useState(0);

  const monitorData = [
    { time: "02:00", value: 0.1 },
    { time: "02:15", value: 0.12 },
    { time: "02:30", value: 0.08 },
    { time: "02:45", value: 0.15 },
    { time: "03:00", value: 0.85 },
    { time: "03:15", value: 0.92 },
    { time: "03:30", value: 0.88 },
    { time: "03:45", value: 0.95 },
    { time: "04:00", value: 0.91 },
  ];

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setLitersLost(prev => prev + 0.0125);
      setMoneyLost(prev => prev + (0.0125 * 1.8));
    }, 1000);

    const playVideo = async () => {
      if (videoRef.current) {
        try {
          videoRef.current.muted = true; 
          videoRef.current.defaultMuted = true;
          await videoRef.current.play();
        } catch (error) {
          console.warn("Autoplay bloqueado:", error);
        }
      }
    };
    const timer = setTimeout(playVideo, 150);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  const applications = [
    { title: "Comunidades", icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Educación", icon: School, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Condominios", icon: LayoutDashboard, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Parcelaciones", icon: Globe, color: "text-cyan-600", bg: "bg-cyan-50" },
    { title: "Industria", icon: Building2, color: "text-slate-600", bg: "bg-slate-50" },
    { title: "Hotelería", icon: Waves, color: "text-blue-400", bg: "bg-blue-50" },
  ];

  const genkoFeatures = [
    {
      title: "Asignación de Gastos",
      desc: "Tecnología de alta precisión para reducir brechas de facturación por errores de medición mecánica.",
      icon: Scale,
      color: "text-blue-500"
    },
    {
      title: "Telemetría NB-IoT",
      desc: "Transmisión automática vía red celular. Elimina la lectura manual y la dependencia de redes Wi-Fi locales.",
      icon: Radio,
      color: "text-emerald-500"
    },
    {
      title: "Control de Sobreconsumo",
      desc: "Alertas predictivas ante incrementos de flujo que afectan la tarifa por tramos de consumo.",
      icon: ShieldAlert,
      color: "text-amber-500"
    },
    {
      title: "Detección de Fugas",
      desc: "Medición ultrasónica con umbrales desde 1 L/h para identificación temprana de anomalías estructurales.",
      icon: SearchCode,
      color: "text-cyan-500"
    },
    {
      title: "Gestión de Suministro",
      desc: "Accionamiento remoto de válvulas para control de morosidad o emergencias sin intervención física.",
      icon: Zap,
      color: "text-indigo-500"
    },
    {
      title: "Medición Inmune",
      desc: "Arquitectura sin piezas móviles: eliminación de bloqueos por sarro o sedimentos minerales.",
      icon: Sparkles,
      color: "text-slate-400"
    }
  ];

  const faqs = [
    {
      q: "¿Cuál es la ventaja de la tecnología ultrasónica sobre la mecánica?",
      a: "Los medidores GENKO carecen de piezas móviles, lo que anula el desgaste por fricción y el bloqueo por sarro. Mantienen una precisión nominal por 16 años, detectando flujos mínimos que los sistemas tradicionales no registran.",
      icon: Gauge
    },
    {
      q: "¿Cómo se gestiona la conectividad en grandes condominios?",
      a: "Utilizamos protocolos NB-IoT y Radio de largo alcance. Los dispositivos son autónomos y no requieren la infraestructura Wi-Fi de las unidades para reportar datos al servidor central.",
      icon: Radio
    },
    {
      q: "¿Qué parámetros de auditoría entrega la plataforma?",
      a: "Entrega curvas de consumo en tiempo real, logs de eventos por unidad, alertas de flujo continuo nocturno y reportes de estado de hardware (batería y señal).",
      icon: Activity
    }
  ];

  const menuItems = [
    { label: "SOLUCIONES", href: "#soluciones" },
    { label: "COMUNIDADES", href: "#agua-comunidades" },
    { label: "EDUCACIÓN", href: "#agua-colegios" },
    { label: "PREGUNTAS", href: "#faq" },
    { label: "CONTACTO", href: WHATSAPP_URL, external: true },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans scroll-smooth">
      <div className="fixed bottom-8 right-8 z-[60]">
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group">
          <MessageCircle className="h-8 w-8 fill-white" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-3 transition-all duration-500 font-black uppercase text-xs tracking-widest whitespace-nowrap">Consultar Factibilidad</span>
        </a>
      </div>

      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3"><span className="font-black text-xl tracking-tighter text-slate-900 uppercase italic">GENKO</span></div>
            <div className="flex items-center gap-6">
              {!isMenuOpen && <button onClick={() => setIsMenuOpen(true)} className="text-emerald-400 font-black uppercase tracking-[0.2em] text-sm hover:text-emerald-500 transition-colors">MENÚ</button>}
              {isAuthenticated && !isMenuOpen && <Button asChild className="rounded-full h-10 px-6"><Link href="/dashboard">Dashboard</Link></Button>}
            </div>
          </div>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="absolute top-0 right-0 w-full sm:w-[450px] h-full bg-[#ec2d7b] shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col p-10">
            <div className="flex justify-end mb-12"><button onClick={() => setIsMenuOpen(false)} className="text-white hover:rotate-90 transition-transform p-2"><X className="h-10 w-10" /></button></div>
            <div className="flex flex-col gap-8 flex-1 justify-center">
              {menuItems.map((item) => (
                item.external ? (
                  <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className="text-white text-4xl sm:text-5xl font-black italic tracking-tighter hover:translate-x-4 transition-transform leading-none" onClick={() => setIsMenuOpen(false)}>{item.label}</a>
                ) : (
                  <Link key={item.label} href={item.href} className="text-white text-4xl sm:text-5xl font-black italic tracking-tighter hover:translate-x-4 transition-transform leading-none" onClick={() => setIsMenuOpen(false)}>{item.label}</Link>
                )
              ))}
            </div>
            <div className="mt-auto pt-10 border-t border-white/20">
              <div className="flex flex-col gap-4">
                {isAuthenticated ? (
                  <Button asChild variant="outline" className="w-full h-14 rounded-2xl border-white text-white bg-transparent hover:bg-white hover:text-[#ec2d7b] font-black uppercase"><Link href="/dashboard">Ir al Dashboard</Link></Button>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <Button asChild variant="outline" className="h-14 rounded-2xl border-white text-white bg-transparent hover:bg-white hover:text-[#ec2d7b] font-black uppercase"><Link href="/auth/login">Entrar</Link></Button>
                    <Button asChild className="h-14 rounded-2xl bg-white text-[#ec2d7b] hover:bg-slate-100 font-black uppercase"><Link href="/auth/signup">Registro</Link></Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="relative h-[100vh] min-h-[700px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-slate-900/60 z-10" />
          {mounted && (
            <video ref={videoRef} key="hero-video-client" autoPlay muted loop playsInline preload="auto" disablePictureInPicture poster="/imagen3.png" className="w-full h-full object-cover">
              <source src="/hero-video.mp4" type="video/mp4" />
            </video>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 text-center space-y-10">
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <Badge variant="outline" className="py-2 px-6 border-blue-400/30 text-blue-300 bg-white/5 backdrop-blur-md rounded-full font-black uppercase tracking-[0.3em] text-[10px]">
              GENKO • Gestión y Telemetría Hídrica
            </Badge>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white uppercase italic leading-[0.85]">
              Precisión Ultrasónica para <br />
              <span className="text-blue-400">el Control del Recurso</span>
            </h1>
            <p className="text-lg md:text-2xl text-slate-200 max-w-3xl mx-auto leading-relaxed font-medium">
              Plataforma profesional de monitoreo y auditoría hídrica. Integramos telemetría NB-IoT con hardware de alta precisión para la optimización operativa de activos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-20 duration-1000 delay-300">
            {[
              { title: "Precisión", desc: "Medición exacta sin piezas móviles.", icon: Scale },
              { title: "Telemetría", desc: "Monitoreo en tiempo real vía NB-IoT.", icon: Radio },
              { title: "Detección", desc: "Alertas de anomalías automáticas.", icon: SearchCode }
            ].map((item, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] text-left group hover:bg-white/20 transition-all cursor-default">
                <div className="bg-blue-500/20 p-3 rounded-2xl w-fit mb-4 text-blue-400 group-hover:scale-110 transition-transform"><item.icon className="h-6 w-6" /></div>
                {item.title && <h3 className="text-white font-black uppercase italic tracking-tight text-lg mb-1">{item.title}</h3>}
                <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-20 duration-1000 delay-500">
            <Button asChild size="lg" className="h-16 px-12 rounded-full text-lg font-black shadow-2xl bg-blue-600 hover:bg-blue-500 border-none">
              <Link href="/auth/signup">Iniciar Auditoría Digital <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-10 rounded-full text-sm font-bold border-2 border-white/20 text-white hover:bg-white/10 backdrop-blur-md">
              <Link href="/water-control/login" className="flex items-center gap-2"><Monitor className="h-4 w-4 text-blue-400" /> Acceso de Gestión</Link>
            </Button>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50"><ChevronDown className="h-8 w-8 text-white" /></div>
      </section>

      <section className="py-20 bg-slate-50/50 overflow-hidden border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] mb-4">Sectores Digitalizados</p>
          <h3 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900">Infraestructura conectada a la red GENKO</h3>
        </div>
        <div className="relative flex overflow-x-hidden">
          <div className="animate-marquee hover:[animation-play-state:paused] whitespace-nowrap flex py-4">
            {[...applications, ...applications].map((app, i) => (
              <div key={i} className="mx-4 flex items-center gap-6 p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm">
                <div className={cn("p-4 rounded-2xl", app.bg)}><app.icon className={cn("h-8 w-8", app.color)} /></div>
                <span className="text-lg font-black uppercase tracking-tighter text-slate-800 pr-4">{app.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="agua-comunidades" className="py-32 bg-slate-50 relative overflow-hidden border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-24 space-y-6">
            <Badge className="bg-blue-600 text-white font-black px-6 py-2 uppercase tracking-[0.3em] rounded-full border-none text-[10px]">SOLUCIONES PARA COMUNIDADES</Badge>
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-slate-900 uppercase italic leading-[0.85]">Gestión Hídrica <br /><span className="text-blue-600">para Edificios</span></h2>
            <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">Automatización de lecturas y control de mermas financieras mediante telemetría IoT.</p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-stretch mb-20">
            <div className="lg:col-span-8 group">
              <Card className="rounded-[3.5rem] border-none shadow-2xl bg-slate-950 text-white overflow-hidden h-full flex flex-col relative border-t border-white/10">
                <div className="p-8 md:p-12 relative z-10 flex-1 flex flex-col">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3"><div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(59,130,246,1)]" /><h3 className="text-sm font-black uppercase tracking-[0.4em] text-blue-400 italic">Telemetría NB-IoT v3.0</h3></div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Infraestructura Celular de Bajo Consumo</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-12 items-center flex-1">
                    <div className="relative h-[280px] w-full bg-slate-900 rounded-[2.5rem] border-2 border-white/10 p-6 shadow-inner">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monitorData}>
                          <defs><linearGradient id="monitorGradient" x1="0" x1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" /><XAxis dataKey="time" fontSize={8} axisLine={false} tickLine={false} stroke="#475569" fontWeight="bold" /><YAxis hide domain={[0, 1.2]} /><Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '10px' }} itemStyle={{ color: '#3b82f6', fontWeight: '900' }} /><Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#monitorGradient)" /><ReferenceLine y={0.8} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'ANOMALÍA', fill: '#ef4444', fontSize: 8, fontWeight: '900' }} /></AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-6">
                      <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-sm group-hover:bg-white/10 transition-colors"><p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-2">Lectura de Flujo</p><div className="flex items-baseline gap-2"><p className="text-6xl font-black italic tracking-tighter tabular-nums text-white">{litersLost.toFixed(2)}</p><span className="text-xl font-bold text-slate-500 uppercase italic">L/min</span></div></div>
                      <div className="bg-rose-500/5 p-8 rounded-[2.5rem] border border-rose-500/20 backdrop-blur-sm group-hover:bg-rose-500/10 transition-colors"><p className="text-[10px] font-black uppercase text-rose-400 tracking-widest mb-2">Impacto en Facturación</p><div className="flex items-baseline gap-2"><p className="text-6xl font-black italic tracking-tighter tabular-nums text-rose-100">$ {moneyLost.toFixed(1)}</p><span className="text-xl font-bold text-rose-500/50 uppercase italic">CLP</span></div></div>
                    </div>
                  </div>
                  <div className="mt-12 flex flex-col items-center gap-4">
                    <Button asChild size="lg" className="h-16 w-full rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/40 text-xs"><Link href="/auth/signup">Activar Auditoría Operativa <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                  </div>
                </div>
              </Card>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-8">
              <Card className="rounded-[3rem] border-none shadow-xl bg-white overflow-hidden flex-1 group hover:shadow-2xl transition-all border-b-8 border-indigo-600">
                <div className="p-10 bg-indigo-50 border-b border-indigo-100 flex flex-col items-center justify-center text-center space-y-4"><div className="bg-indigo-600 p-5 rounded-3xl shadow-xl shadow-indigo-900/20 group-hover:rotate-6 transition-transform"><Waves className="h-10 w-10 text-white" /></div><Badge className="bg-indigo-100 text-indigo-700 font-black px-4 py-1.5 uppercase tracking-widest rounded-full border-none text-[9px]">Protección de Red</Badge></div>
                <CardContent className="p-10 space-y-6"><h3 className="text-2xl font-black italic uppercase tracking-tighter text-indigo-950">Sensor de Turbidez</h3><p className="text-sm text-slate-500 font-medium leading-relaxed">Análisis óptico de pureza. Alertas preventivas para evitar daños en calefonts o grifería por sedimentos tras roturas de matriz.</p></CardContent>
              </Card>
              <Card className="rounded-[3rem] border-none shadow-2xl bg-slate-900 text-white p-10 flex flex-col justify-center relative overflow-hidden group"><div className="absolute right-0 bottom-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><Coins className="h-32 w-32 text-amber-400" /></div><div className="relative z-10 space-y-4"><Badge className="bg-amber-500 text-slate-900 font-black uppercase text-[10px] tracking-widest px-4 py-1">Optimización Financiera</Badge><h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Ahorro Escalar</h3><p className="text-slate-400 text-sm leading-relaxed">Reducción del diferencial entre el medidor matriz y la sumatoria de unidades.</p></div></Card>
            </div>
          </div>

          <div className="mt-20">
            <div className="text-center mb-12"><h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">Pilares Tecnológicos</h3></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {genkoFeatures.map((feature, idx) => (
                <Card key={idx} className="rounded-[2.5rem] border-none shadow-lg bg-white p-8 hover:shadow-2xl transition-all group border-t-2 border-transparent hover:border-blue-500"><div className={cn("mb-6 transition-transform group-hover:scale-110 duration-500", feature.color)}><feature.icon className="h-10 w-10" /></div><h4 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 mb-3">{idx + 1}. {feature.title}</h4><p className="text-sm text-slate-500 leading-relaxed font-medium">{feature.desc}</p></Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="agua-colegios" className="py-32 bg-slate-950 text-white relative overflow-hidden border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
              <div className="space-y-6">
                <Badge className="bg-emerald-500 text-white font-black px-6 py-2 uppercase tracking-[0.3em] rounded-full border-none text-[10px]">GESTIÓN EDUCACIONAL</Badge>
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-[0.9]">Eficiencia Hídrica <br /><span className="text-emerald-400">Sin Inversión Inicial</span></h2>
                <p className="text-xl text-slate-400 font-medium leading-relaxed">Sustentabilidad basada en rendimiento. Implementación de control automático bajo modelo de ahorro compartido.</p>
              </div>
              <Card className="rounded-[2.5rem] border-none bg-emerald-500/10 border-2 border-emerald-500/20 p-8 shadow-2xl">
                <div className="flex items-start gap-6"><div className="bg-emerald-500 p-4 rounded-3xl shadow-xl shadow-emerald-900/40"><HandCoins className="h-10 w-10 text-white" /></div><div className="space-y-2"><h3 className="text-2xl font-black italic uppercase tracking-tighter text-emerald-400">Modelo de Ahorro Real</h3><p className="text-slate-300 text-sm leading-relaxed">Nuestra retribución es un porcentaje del ahorro generado en la facturación. El sistema se amortiza con el capital recuperado por eliminación de fugas.</p></div></div>
              </Card>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { title: "Control Operativo", desc: "Monitoreo nocturno para detección de fugas en tiempo real.", icon: Zap, color: "text-blue-400" },
                  { title: "Reportes Directivos", desc: "Informes de cumplimiento ESG listos para consejos directivos.", icon: GraduationCap, color: "text-amber-400" },
                  { title: "Gestión de Costos", desc: "Liberación de flujo de caja desperdiciado en ineficiencias hídricas.", icon: HandCoins, color: "text-emerald-400" },
                  { title: "Certificación Ambiental", icon: Leaf, desc: "Data histórica auditable para acreditaciones de excelencia.", color: "text-emerald-500" }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"><item.icon className={cn("h-6 w-6 shrink-0", item.color)} /><div><p className="font-black uppercase italic tracking-tighter text-xs text-white">{item.title}</p><p className="text-[10px] text-slate-400 font-medium leading-tight mt-1">{item.desc}</p></div></div>
                ))}
              </div>
            </div>
            <div className="relative">
              <Card className="rounded-[3.5rem] border-none shadow-2xl bg-white text-slate-900 overflow-hidden relative border-t-8 border-emerald-500">
                <CardHeader className="p-10 border-b bg-slate-50"><div className="flex items-center justify-between"><div><CardTitle className="text-xl font-black uppercase italic tracking-tighter">Panel de Infraestructura</CardTitle><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocolos de Telemetría Escolar</p></div><School className="h-8 w-8 text-emerald-600" /></div></CardHeader>
                <CardContent className="p-10 space-y-8">
                  <div className="space-y-4">
                    {[
                      { label: "Pabellón A", status: "Nominal", value: "0.0 L/min" },
                      { label: "Área Deportiva", status: "Flujo Anómalo", value: "4.2 L/min", alert: true },
                      { label: "Riego Perimetral", status: "Activo Programado", value: "12.5 L/min" }
                    ].map((row, i) => (
                      <div key={i} className={cn("p-5 rounded-[1.5rem] border-2 flex items-center justify-between", row.alert ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-100")}><div className="space-y-1"><p className="text-[10px] font-black uppercase text-slate-400">{row.label}</p><p className={cn("text-xs font-bold", row.alert ? "text-rose-600" : "text-slate-700")}>{row.status}</p></div><p className="text-xl font-black italic">{row.value}</p></div>
                    ))}
                  </div>
                  <div className="bg-slate-900 rounded-3xl p-8 text-white space-y-4 relative overflow-hidden"><div className="absolute right-0 top-0 p-4 opacity-10"><Zap className="h-20 w-20 text-emerald-400" /></div><p className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.3em]">IA: Diagnóstico de Infraestructura</p><p className="text-sm font-medium italic leading-relaxed text-slate-300">"Anomalía en pabellón deportivo. Patrón compatible con falla en válvula de descarga. Acción sugerida: Cierre preventivo NB-IoT."</p><Button className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-black uppercase text-[10px] gap-2">Acción Remota <ChevronRight className="h-4 w-4" /></Button></div>
                  <Button asChild className="h-16 w-full rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-widest shadow-xl"><a href={WHATSAPP_URL} target="_blank">Agendar Auditoría Técnica <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4"><div className="bg-blue-100 text-blue-600 p-4 rounded-3xl w-fit"><ShieldCheck className="h-8 w-8" /></div><h3 className="text-2xl font-black uppercase italic tracking-tighter">Auditoría de Datos</h3><p className="text-slate-500 font-medium leading-relaxed">Registros inalterables con marca digital. Estándares de seguridad para auditorías corporativas y financieras.</p></div>
            <div className="space-y-4"><div className="bg-indigo-100 text-indigo-600 p-4 rounded-3xl w-fit"><Smartphone className="h-8 w-8" /></div><h3 className="text-2xl font-black uppercase italic tracking-tighter">Certificación QR</h3><p className="text-slate-500 font-medium leading-relaxed">Firma digital en terreno sin necesidad de apps externas. Generación automática de certificados de recepción técnica.</p></div>
            <div className="space-y-4"><div className="bg-purple-100 text-purple-600 p-4 rounded-3xl w-fit"><Zap className="h-8 w-8" /></div><h3 className="text-2xl font-black uppercase italic tracking-tighter">Análisis Predictivo</h3><p className="text-slate-500 font-medium leading-relaxed">Procesamiento de bitácoras mediante GenAI para la detección de patrones de falla y generación de informes ejecutivos.</p></div>
          </div>
        </div>
      </section>

      <section id="faq" className="py-24 bg-slate-50 border-t">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4"><div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto text-primary"><HelpCircle className="h-6 w-6" /></div><h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic">Soporte Técnico <span className="text-primary">y FAQ</span></h2></div>
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden p-8 md:p-12">
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-b border-slate-100 last:border-0 pb-2"><AccordionTrigger className="hover:no-underline hover:text-primary text-left py-4"><div className="flex items-center gap-4 pr-4"><div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0"><faq.icon className="h-5 w-5 text-primary" /></div><span className="font-black text-slate-900 uppercase italic tracking-tight text-sm md:text-base leading-snug">{faq.q}</span></div></AccordionTrigger><AccordionContent className="pt-2 pb-6 pl-14"><p className="text-slate-600 text-sm md:text-base leading-relaxed font-medium whitespace-pre-line">{faq.a}</p></AccordionContent></AccordionItem>
              ))}
            </Accordion>
          </Card>
        </div>
      </section>

      <footer className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
          <div className="flex flex-col items-center gap-4"><img src="/logogenko.png" alt="GENKO" className="h-12 w-auto object-contain mix-blend-multiply" /><span className="font-black text-2xl tracking-tighter text-slate-900 uppercase italic">GENKO</span><p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em]">Infraestructura Hídrica Digital</p></div>
          <div className="flex justify-center gap-8 text-[10px] font-black uppercase text-slate-400 tracking-widest flex-wrap px-4"><Link href="/terms" className="hover:text-primary transition-colors">Términos Legales</Link><Link href="/auth/signup" className="hover:text-primary transition-colors">Solicitar Acceso</Link><Link href="/water-control/login" className="text-blue-600 hover:text-blue-700 font-black flex items-center gap-1.5 transition-colors"><Droplets className="h-3 w-3" /> Login Administradores</Link><a href={WHATSAPP_URL} className="hover:text-primary transition-colors">Soporte</a></div>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] pt-10">© {new Date().getFullYear()} - GENKO.CL - INDUSTRIAL WATER INTELLIGENCE</p>
        </div>
      </footer>
    </div>
  );
}
