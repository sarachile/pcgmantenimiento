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
  MessageSquareShare,
  Sun,
  Waves,
  Database,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
        <ShieldCheck className="text-slate-100 h-12 w-12 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans scroll-smooth">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-2 rounded-lg">
                <ShieldCheck className="text-white h-6 w-6" />
              </div>
              <span className="font-black text-xl tracking-tighter text-primary uppercase">
                PCGMANTENIMIENTO
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600 uppercase tracking-widest">
              <a href="#solucion" className="hover:text-primary transition-colors">Solución</a>
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
            <a href="#solucion" className="font-bold text-slate-600 px-4" onClick={() => setIsMenuOpen(false)}>Solución</a>
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
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="outline" className="mb-6 py-1 px-4 border-primary/20 text-primary bg-primary/5 rounded-full font-bold uppercase tracking-widest">
            ¿Instalas Paneles Solares? Eleva tu estándar tecnológico
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 mb-6 leading-[0.9]">
            Toda tu operación técnica <br />
            <span className="text-primary italic font-serif">con trazabilidad inalterable</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            Certifica la experiencia de tu equipo en terreno. Reemplaza los grupos de WhatsApp por evidencia real, firmas digitales y <span className="text-primary font-bold">monitoreo IoT en tiempo real</span>.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button asChild size="lg" className="h-14 px-10 rounded-full text-lg font-black shadow-xl shadow-primary/20">
              <Link href="/auth/signup">Empieza ahora gratis <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-10 rounded-full text-lg font-bold border-2">
              <a href="#solar">Ver Solución Solar</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Special Solar Section */}
      <section id="solar" className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 p-20 opacity-10"><Sun className="h-64 w-64 text-amber-400 animate-pulse" /></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <Badge className="bg-amber-500 text-black font-black px-4 py-1 uppercase tracking-widest">Exclusivo: Energía Solar</Badge>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase leading-none">
                El ERP que tu cuadrilla <br />
                <span className="text-amber-400">solar realmente usará.</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                Sabemos que en la instalación de paneles, la foto del inversor y la placa es ley. Nuestra plataforma obliga al cumplimiento de protocolos para que cada visita sea facturable y sin reclamos.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { icon: Sun, title: "Protocolos Fotovoltaicos", desc: "Checklists específicos para inversores, cableado y anclajes." },
                  { icon: Fingerprint, title: "Sello de Recepción", desc: "El cliente firma en terreno vía QR para evitar disputas de pago." },
                  { icon: Cpu, title: "Resumen IA", desc: "Genera informes ejecutivos automáticos de visitas largas." },
                  { icon: MessageSquareShare, title: "Feedback Directo", desc: "Mide la satisfacción del cliente tras cada instalación." }
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

            <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] backdrop-blur-sm relative group">
              <div className="absolute -top-6 -right-6 bg-amber-500 p-4 rounded-2xl shadow-xl animate-bounce">
                <Zap className="h-6 w-6 text-black" />
              </div>
              <h3 className="text-2xl font-black italic mb-6">Blindaje de Operación</h3>
              <div className="space-y-4">
                {[
                  { label: "Evidencia de Inversores", value: "Fotos Obligatorias" },
                  { label: "Ubicación GPS", value: "Validación por Mapa" },
                  { label: "Certificado de Exp.", value: "Generación Instantánea" },
                  { label: "Sincronización API", value: "Listo para tu CRM" }
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center py-3 border-b border-white/5 text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-widest">{row.label}</span>
                    <span className="text-amber-400 font-black flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3" /> {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
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

      {/* Differentiation Section */}
      <section id="diferenciadores" className="py-24 bg-white border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column: Image */}
            <div className="relative aspect-square md:aspect-video lg:aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 bg-white p-2">
              <div className="relative w-full h-full rounded-[2rem] overflow-hidden">
                <Image 
                  src="/imagen1.png" 
                  alt="Gestión Operativa PCGMANTENIMIENTO" 
                  fill 
                  className="object-cover"
                />
              </div>
            </div>

            {/* Right Column: Content */}
            <div className="space-y-10">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                  Menos planillas,<br />
                  <span className="text-primary">más control real de campo.</span>
                </h2>
              </div>

              <div className="space-y-6">
                {[
                  { icon: XCircle, title: "Fin del Caos", desc: "Dile adiós a los reportes en papel que se pierden, se mojan o nunca se actualizan." },
                  { icon: History, title: "Trazabilidad Inalterable", desc: "Marcas de tiempo y GPS de cada intervención para certificaciones sin dudas." },
                  { icon: Zap, title: "Informes al Instante", desc: "Genera el informe técnico PDF y el certificado de experiencia en un clic." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="bg-slate-50 p-3 rounded-xl h-fit border group-hover:border-primary/30 transition-colors">
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
                  <ShieldCheck className="h-24 w-24" />
                </div>
                <h3 className="text-2xl font-black italic mb-2 text-slate-900">"Lo que no se registra, no existe"</h3>
                <p className="text-slate-500 font-medium mb-8">Centraliza toda tu operación en una herramienta diseñada para el rigor del terreno.</p>
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
            <Button asChild size="lg" className="h-20 px-12 rounded-[2rem] text-xl font-black shadow-2xl shadow-primary/30 group">
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
              <ShieldCheck className="h-8 w-8" />
              <span className="text-[10px] font-black uppercase">Seguridad SSL</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <CloudLightning className="h-8 w-8" />
              <span className="text-[10px] font-black uppercase">Cloud Native</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Search className="text-[10px] h-8 w-8" />
              <span className="text-[10px] font-black uppercase">Auditable 100%</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <MessageSquareShare className="h-8 w-8" />
              <span className="text-[10px] font-black uppercase">Feedback Directo</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 bg-slate-50 border-t border-slate-100 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <ShieldCheck className="h-5 w-5" />
            <span className="font-black text-sm uppercase tracking-tighter">PCGMANTENIMIENTO ERP</span>
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
