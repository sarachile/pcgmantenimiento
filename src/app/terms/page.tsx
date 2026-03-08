
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowLeft, Scale, Lock, FileText, Gavel } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="rounded-full">
              <Link href="/auth/signup"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-primary p-2 rounded-lg">
                <ShieldCheck className="text-white h-5 w-5" />
              </div>
              <span className="font-black text-xl tracking-tighter text-primary uppercase">
                PCGMANTENIMIENTO
              </span>
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Versión 1.2 - Actualizado Marzo 2024</p>
        </div>

        <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-900 text-white p-10 text-center space-y-4">
            <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-white/10">
              <Scale className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">Términos y Condiciones de Uso</CardTitle>
              <CardDescription className="text-slate-400 font-bold uppercase tracking-widest mt-2">Marco Legal y Privacidad - PCG OPERACIONES SPA</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-10 prose prose-slate max-w-none space-y-8 text-slate-600">
            
            <section className="space-y-4">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight italic">
                <FileText className="h-5 w-5 text-primary" /> 1. Aceptación del Servicio
              </h3>
              <p className="text-sm leading-relaxed">
                El acceso y uso de la plataforma <strong>PCGMANTENIMIENTO</strong> (en adelante, "la Plataforma"), de propiedad de PCG OPERACIONES SPA, se rige por los presentes términos y condiciones. Al registrarse, usted acepta íntegramente estas disposiciones, las cuales constituyen un contrato vinculante según la legislación vigente en la República de Chile.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight italic">
                <Lock className="h-5 w-5 text-primary" /> 2. Protección de Datos (Ley 19.628)
              </h3>
              <p className="text-sm leading-relaxed">
                De conformidad con la <strong>Ley N° 19.628</strong> sobre Protección de la Vida Privada, PCGMANTENIMIENTO se compromete al tratamiento confidencial de los datos personales. Los datos recolectados (nombres, correos, RUT, geolocalización y registros técnicos) tienen como única finalidad la prestación del servicio ERP y la generación de trazabilidad técnica para el Cliente.
              </p>
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 italic text-xs font-medium text-blue-800">
                "PCGMANTENIMIENTO no comercializa, cede ni transfiere bases de datos a terceros ajenos a la operación técnica del Cliente."
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight italic">
                <ShieldCheck className="h-5 w-5 text-primary" /> 3. Propiedad Intelectual
              </h3>
              <p className="text-sm leading-relaxed">
                Todo el software, algoritmos de IA, diseño de interfaces, marcas y logotipos asociados a PCGMANTENIMIENTO son propiedad exclusiva de PCG OPERACIONES SPA. El Cliente adquiere una licencia de uso no exclusiva, temporal y limitada según el plan contratado. Queda estrictamente prohibida la ingeniería inversa o reproducción total/parcial del sistema.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight italic">
                <Gavel className="h-5 w-5 text-primary" /> 4. Responsabilidad por Contenidos
              </h3>
              <p className="text-sm leading-relaxed">
                El Cliente es el único responsable de la veracidad de la información cargada en la Plataforma (Checklists, evidencias fotográficas y firmas). PCGMANTENIMIENTO actúa como un facilitador tecnológico y no se hace responsable por negligencias técnicas, accidentes laborales o fallas de activos derivados del uso de la herramienta. El sello digital de aprobación es responsabilidad del personal autorizado por el Cliente.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">5. Jurisdicción</h3>
              <p className="text-sm leading-relaxed">
                Cualquier controversia derivada de este contrato será sometida a la jurisdicción de los Tribunales Ordinarios de Justicia de Santiago de Chile.
              </p>
            </section>

            <div className="pt-10 border-t flex flex-col items-center gap-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                Para consultas legales dirigirse a: legal@pcgoperacion.com
              </p>
              <Button asChild className="rounded-xl h-12 px-8 font-black uppercase tracking-widest">
                <Link href="/auth/signup">Volver al Registro</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
