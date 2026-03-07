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
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

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

  const heroImage = PlaceHolderImages?.find(img => img.id === 'hero-industrial');
  const dashImage = PlaceHolderImages?.find(img => img.id === 'dashboard-preview');

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
              <span className="font-black text-xl tracking-tighter text-primary uppercase">
                PCGMANTENIMIENTO
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600 uppercase tracking-widest">
              <a href="#solucion" className="hover:text-primary transition-colors">Solución</a>
              <a href="#como-funciona" className="hover:text-primary transition-colors">Cómo Funciona</a>
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
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="outline" className="mb-6 py-1 px-4 border-primary/20 text-primary bg-primary/5 rounded-full font-bold uppercase tracking-widest">
            Gestión Industrial Avanzada
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 mb-6 leading-[0.9]">
            Toda tu operación <br />
            <span className="text-primary italic font-serif">con trazabilidad total</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            Elimina el papel y certifica tu experiencia técnica en terreno con evidencias reales y sellos digitales.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="h-14 px-10 rounded-full text-lg font-black shadow-xl shadow-primary/20">
              <Link href="/auth/signup">Empieza ahora <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
          
          <div className="mt-20 relative max-w-5xl mx-auto px-4">
            <div className="bg-slate-900 rounded-3xl p-3 shadow-2xl overflow-hidden border border-slate-800">
              <div className="bg-white rounded-2xl overflow-hidden relative aspect-video shadow-inner">
                {dashImage && (
                  <Image 
                    src={dashImage.imageUrl} 
                    alt={dashImage.description} 
                    fill
                    priority
                    className="object-cover"
                    data-ai-hint={dashImage.imageHint}
                  />
                )}
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
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                Menos planillas,<br />
                <span className="text-primary">más control operativo.</span>
              </h2>
              <div className="space-y-6">
                {[
                  { icon: XCircle, title: "Fin del Caos", desc: "Dile adiós a los reportes en papel que se pierden o nunca se actualizan." },
                  { icon: History, title: "Trazabilidad Real", desc: "Mantén un historial inalterable de cada intervención realizada por tu equipo." },
                  { icon: Zap, title: "Rapidez", desc: "Genera informes técnicos y certificados de experiencia en segundos." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="bg-white p-2 rounded-lg h-fit shadow-sm border"><item.icon className="text-primary h-5 w-5" /></div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                      <p className="text-slate-600 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
              <h3 className="text-2xl font-black italic mb-4">"Lo que no se registra, no existe"</h3>
              <p className="text-slate-600 mb-8">Centraliza toda tu operación en una herramienta diseñada para el campo.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border">
                  <p className="text-3xl font-black text-primary mb-1">100%</p>
                  <p className="text-xs font-bold text-slate-500 uppercase">Trazabilidad</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border">
                  <p className="text-3xl font-black text-primary mb-1">0</p>
                  <p className="text-xs font-bold text-slate-500 uppercase">Pérdida Datos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 bg-white border-t border-slate-100 text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
          PCGMANTENIMIENTO ERP - © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}