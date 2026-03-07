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
  MessageSquareShare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
              <a href="#como-funciona" className="hover:text-primary transition-colors">Cómo Funciona</a>
              <a href="#diferenciadores" className="hover:text-primary transition-colors">Diferenciales</a>
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
            <a href="#como-funciona" className="font-bold text-slate-600 px-4" onClick={() => setIsMenuOpen(false)}>Cómo Funciona</a>
            <a href="#diferenciadores" className="font-bold text-slate-600 px-4" onClick={() => setIsMenuOpen(false)}>Diferenciales</a>
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
            Gestión Industrial de Próxima Generación
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 mb-6 leading-[0.9]">
            Toda tu operación técnica <br />
            <span className="text-primary italic font-serif">con trazabilidad inalterable</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            Elimina la incertidumbre del papel. Certifica la experiencia de tu equipo en terreno con evidencia fotográfica real y sellos digitales de aprobación.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button asChild size="lg" className="h-14 px-10 rounded-full text-lg font-black shadow-xl shadow-primary/20">
              <Link href="/auth/signup">Empieza ahora gratis <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-10 rounded-full text-lg font-bold border-2">
              <a href="#como-funciona">Ver demo visual</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solucion" className="py-24 bg-slate-50 border-y">
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
                  { icon: History, title: "Trazabilidad Inalterable", desc: "Mantén un historial con marcas de tiempo y GPS de cada intervención realizada." },
                  { icon: Zap, title: "Informes al Instante", desc: "Genera el informe técnico PDF y el certificado de experiencia en un clic tras el cierre." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="bg-white p-3 rounded-xl h-fit shadow-sm border border-slate-100 group-hover:border-primary/30 transition-colors">
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

      {/* How it Works Section */}
      <section id="como-funciona" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase italic">El Círculo de Confianza Técnica</h2>
            <p className="text-slate-500 mt-4 text-lg max-w-2xl mx-auto font-medium">Un flujo optimizado para que tu empresa nunca pierda una certificación por falta de pruebas.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10" />
            
            {[
              { 
                step: "01", 
                title: "Asignación Inteligente", 
                desc: "Crea OTs masivas o individuales. Define protocolos de inspección obligatorios para que nada quede al azar.",
                icon: HardHat,
                color: "text-blue-600 bg-blue-50"
              },
              { 
                step: "02", 
                title: "Captura de Evidencia", 
                desc: "Tus técnicos reportan desde el móvil. Fotos, notas y checklists con sello digital técnico inmediato.",
                icon: Smartphone,
                color: "text-amber-600 bg-amber-50"
              },
              { 
                step: "03", 
                title: "Certificación Final", 
                desc: "El cliente aprueba vía PIN o QR. Se genera automáticamente el Certificado de Experiencia legal.",
                icon: FileBadge,
                color: "text-emerald-600 bg-emerald-50"
              }
            ].map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 hover:border-primary/20 transition-all group shadow-sm hover:shadow-xl">
                <div className="flex justify-between items-start mb-6">
                  <div className={cn("p-4 rounded-2xl", item.color)}>
                    <item.icon className="h-8 w-8" />
                  </div>
                  <span className="text-5xl font-black text-slate-100 group-hover:text-primary/10 transition-colors">{item.step}</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Differentiation Section (The Tech Edge) */}
      <section id="diferenciadores" className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -z-0" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <Badge className="bg-blue-600 text-white font-black px-4 py-1 uppercase tracking-widest">Diferencial Tecnológico</Badge>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase leading-none">
                No somos solo un ERP. <br />
                <span className="text-blue-400">Somos tu blindaje operativo.</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                Mientras otros se enfocan en la contabilidad, nosotros nos enfocamos en que cada hora hombre de tu equipo sea certificable y pagable.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { icon: Cpu, title: "IA Operativa", desc: "Resúmenes ejecutivos automáticos de bitácoras técnicas extensas." },
                  { icon: Fingerprint, title: "Sello Digital", desc: "Validación por PIN único que evita suplantaciones de firma." },
                  { icon: CloudLightning, title: "Modo Offline", desc: "Sigue reportando en minas o sótanos sin señal de internet." },
                  { icon: BarChart3, title: "BI Industrial", desc: "Métricas de cumplimiento y desgaste de activos en tiempo real." }
                ].map((f, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="bg-white/5 p-2 rounded-lg h-fit border border-white/10">
                      <f.icon className="h-5 w-5 text-blue-400" />
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
              <div className="absolute -top-6 -left-6 bg-blue-600 p-4 rounded-2xl shadow-xl shadow-blue-900/40 animate-bounce">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-black italic mb-6">Comparativa de Valor</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500 pb-2 border-b border-white/10">
                  <span>Proceso Tradicional</span>
                  <span className="text-blue-400">PCGMANTENIMIENTO</span>
                </div>
                {[
                  { old: "Firma en papel que se borra", new: "Sello Digital con código único" },
                  { old: "Fotos perdidas en WhatsApp", new: "Evidencia indexada a la OT" },
                  { old: "Informe manual (2 días)", new: "Informe automático (1 segundo)" },
                  { old: "Sin respaldo de experiencia", new: "Certificado validado por cliente" },
                  { old: "Discusiones por cobros", new: "Trazabilidad total aceptada" }
                ].map((row, i) => (
                  <div key={i} className="grid grid-cols-2 gap-4 py-3 border-b border-white/5 text-xs font-medium">
                    <div className="flex items-center gap-2 text-slate-500"><XCircle className="h-3 w-3 shrink-0" /> {row.old}</div>
                    <div className="flex items-center gap-2 text-white font-bold"><CheckCircle2 className="h-3 w-3 text-blue-400 shrink-0" /> {row.new}</div>
                  </div>
                ))}
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
              <Search className="h-8 w-8" />
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
            <a href="#" className="hover:text-primary transition-colors">Términos</a>
            <a href="#" className="hover:text-primary transition-colors">Privacidad</a>
            <a href="#" className="hover:text-primary transition-colors">Soporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
