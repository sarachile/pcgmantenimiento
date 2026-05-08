"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Activity, 
  Building2, 
  Droplets, 
  Waves, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Zap,
  School,
  Sprout,
  Loader2,
  FileText,
  AlertTriangle
} from "lucide-react";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function PublicSelfAuditPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Identidad
    entityName: "",
    entityType: "colegio",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    
    // Step 2: Infraestructura
    buildingsCount: "",
    toiletsCount: "",
    showersCount: "",
    hasPool: "no",
    detectedLeaks: "no",
    leaksDescription: "",

    // Step 3: Riego (Critical for Schools)
    irrigationAreaM2: "",
    irrigationType: "automatico",
    irrigationDaysPerWeek: "3",
    irrigationSchedule: "", // Mañana, Noche, Madrugada
    irrigationObservation: "",

    // Step 4: Consumo
    avgMonthlyConsumptionM3: "",
    lastMonthlyBillCLP: "",
    mainPainPoint: "ahorro_costos" // ahorro, fugas, automatizacion
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "auditSubmissions"), {
        ...formData,
        source: "web_self_audit",
        status: "pending_review",
        createdAt: serverTimestamp()
      });

      setIsSuccess(true);
      toast({ title: "Diagnóstico Enviado", description: "Hemos recibido tu información. Prepararemos tu plan hídrico." });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo procesar el envío. Reintente en un momento.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-lg w-full p-10 text-center rounded-[3rem] shadow-2xl border-none animate-in zoom-in-95">
          <div className="bg-blue-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <CheckCircle2 className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter uppercase italic leading-none">Diagnóstico Recibido</h2>
          <p className="text-slate-500 font-medium text-lg leading-relaxed mb-10">
            Gracias por completar el levantamiento técnico. Un ejecutivo de <strong>GENKO</strong> procesará estos datos para entregarte un plan de administración hídrica optimizado.
          </p>
          <Button asChild className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-sm tracking-widest shadow-xl">
            <Link href="/">Volver al Inicio</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg"><Waves className="h-5 w-5 text-white" /></div>
            <span className="font-black text-lg tracking-tighter uppercase italic">GENKO</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Auditoría en Curso</span>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">
            Diagnóstico de Eficiencia <span className="text-blue-600">Hídrica</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto leading-relaxed">
            Completa este levantamiento técnico para que nuestro equipo pueda diseñar un plan de control NB-IoT a medida para tu institución.
          </p>
        </div>

        <div className="flex justify-between items-center bg-white p-2 rounded-full shadow-sm border max-w-sm mx-auto">
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s} 
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center font-black text-xs transition-all",
                step === s ? "bg-blue-600 text-white shadow-lg" : (step > s ? "bg-emerald-50 text-emerald-600" : "text-slate-300")
              )}
            >
              {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              <CardHeader className="p-10 bg-slate-900 text-white">
                <CardTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-blue-400" /> 1. Identificación de la Entidad
                </CardTitle>
                <CardDescription className="text-slate-400 font-medium">Información básica de contacto y tipo de recinto.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre Colegio / Empresa *</Label>
                    <Input placeholder="Ej: Complejo Educacional Maipú" value={formData.entityName} onChange={e => updateField('entityName', e.target.value)} className="h-12 border-2 rounded-xl font-bold" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tipo de Sector</Label>
                    <Select value={formData.entityType} onValueChange={v => updateField('entityType', v)}>
                      <SelectTrigger className="h-12 border-2 rounded-xl font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="colegio">Colegio / Universidad</SelectItem>
                        <SelectItem value="edificio">Edificio Residencial</SelectItem>
                        <SelectItem value="condominio">Condominio de Casas</SelectItem>
                        <SelectItem value="industria">Planta Industrial</SelectItem>
                        <SelectItem value="apr">Agua Potable Rural (APR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre del Responsable *</Label>
                  <Input placeholder="Juan Pérez" value={formData.contactName} onChange={e => updateField('contactName', e.target.value)} className="h-12 border-2 rounded-xl" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email Corporativo *</Label>
                    <Input type="email" placeholder="jperez@entidad.cl" value={formData.contactEmail} onChange={e => updateField('contactEmail', e.target.value)} className="h-12 border-2 rounded-xl" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Teléfono de Contacto</Label>
                    <Input placeholder="+56 9..." value={formData.contactPhone} onChange={e => updateField('contactPhone', e.target.value)} className="h-12 border-2 rounded-xl" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-10 pt-0">
                <Button type="button" onClick={nextStep} disabled={!formData.entityName || !formData.contactEmail} className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest text-[10px] gap-2">Siguiente Paso <ArrowRight className="h-4 w-4" /></Button>
              </CardFooter>
            </Card>
          )}

          {step === 2 && (
            <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden animate-in slide-in-from-right-4">
              <CardHeader className="p-10 bg-slate-900 text-white">
                <CardTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                  <Activity className="h-6 w-6 text-blue-400" /> 2. Inventario de Instalaciones
                </CardTitle>
                <CardDescription className="text-slate-400 font-medium">Cuantificación de puntos de consumo y estado de red.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">N° de Pabellones / Torres</Label>
                    <Input type="number" placeholder="1" value={formData.buildingsCount} onChange={e => updateField('buildingsCount', e.target.value)} className="h-12 border-2 rounded-xl font-bold text-center" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Total Sanitarios (WC)</Label>
                    <Input type="number" placeholder="20" value={formData.toiletsCount} onChange={e => updateField('toiletsCount', e.target.value)} className="h-12 border-2 rounded-xl font-bold text-center" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Duchas / Camarines</Label>
                    <Input type="number" placeholder="10" value={formData.showersCount} onChange={e => updateField('showersCount', e.target.value)} className="h-12 border-2 rounded-xl font-bold text-center" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl border-2 space-y-3 bg-slate-50">
                    <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><AlertTriangle className="h-3 w-3 text-rose-500" /> ¿Tiene fugas detectadas?</Label>
                    <Select value={formData.detectedLeaks} onValueChange={v => updateField('detectedLeaks', v)}>
                      <SelectTrigger className="h-11 bg-white border-2 rounded-xl font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No, red estable</SelectItem>
                        <SelectItem value="si">Sí, hay fugas visibles</SelectItem>
                        <SelectItem value="desconocido">No lo sabemos con certeza</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-6 rounded-2xl border-2 space-y-3 bg-slate-50">
                    <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Waves className="h-3 w-3 text-blue-500" /> ¿Posee piscina o estanque?</Label>
                    <Select value={formData.hasPool} onValueChange={v => updateField('hasPool', v)}>
                      <SelectTrigger className="h-11 bg-white border-2 rounded-xl font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="si_piscina">Sí, Piscina Olímpica/Semi</SelectItem>
                        <SelectItem value="si_estanque">Sí, Estanque de Acumulación</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.detectedLeaks === 'si' && (
                  <div className="space-y-2 animate-in slide-in-from-top-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Describa las anomalías</Label>
                    <Textarea placeholder="Ej: Filtración en pabellón norte, llaves que gotean en patio..." value={formData.leaksDescription} onChange={e => updateField('leaksDescription', e.target.value)} className="min-h-[100px] border-2 rounded-xl" />
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-10 pt-0 flex gap-4">
                <Button type="button" variant="outline" onClick={prevStep} className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px]">Atrás</Button>
                <Button type="button" onClick={nextStep} className="flex-[2] h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest text-[10px] gap-2">Siguiente Paso <ArrowRight className="h-4 w-4" /></Button>
              </CardFooter>
            </Card>
          )}

          {step === 3 && (
            <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden animate-in slide-in-from-right-4">
              <CardHeader className="p-10 bg-slate-900 text-white">
                <CardTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                  <Sprout className="h-6 w-6 text-emerald-400" /> 3. Gestión de Riego y Áreas Verdes
                </CardTitle>
                <CardDescription className="text-slate-400 font-medium">Factor clave en el desperdicio hídrico institucional.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Superficie de Riego Est. (m²)</Label>
                    <Input type="number" placeholder="Ej: 2000" value={formData.irrigationAreaM2} onChange={e => updateField('irrigationAreaM2', e.target.value)} className="h-12 border-2 rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tipo de Sistema</Label>
                    <Select value={formData.irrigationType} onValueChange={v => updateField('irrigationType', v)}>
                      <SelectTrigger className="h-12 border-2 rounded-xl font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automatico">Automático (Programador)</SelectItem>
                        <SelectItem value="manual">Manual (Personal con manguera)</SelectItem>
                        <SelectItem value="goteo">Dripping / Goteo Tecnificado</SelectItem>
                        <SelectItem value="mixto">Mixto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Frecuencia Semanal</Label>
                    <Select value={formData.irrigationDaysPerWeek} onValueChange={v => updateField('irrigationDaysPerWeek', v)}>
                      <SelectTrigger className="h-12 border-2 rounded-xl font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 día a la semana</SelectItem>
                        <SelectItem value="2">2 días a la semana</SelectItem>
                        <SelectItem value="3">3 días a la semana (Estándar)</SelectItem>
                        <SelectItem value="5">5 días a la semana</SelectItem>
                        <SelectItem value="7">Riego Diario</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Horario Habitual</Label>
                    <Input placeholder="Ej: 05:00 AM a 07:30 AM" value={formData.irrigationSchedule} onChange={e => updateField('irrigationSchedule', e.target.value)} className="h-12 border-2 rounded-xl font-bold" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Observaciones de Riego</Label>
                  <Textarea placeholder="Indique si hay zonas secas, aspersores rotos o si desea automatizar el proceso..." value={formData.irrigationObservation} onChange={e => updateField('irrigationObservation', e.target.value)} className="min-h-[100px] border-2 rounded-xl" />
                </div>
              </CardContent>
              <CardFooter className="p-10 pt-0 flex gap-4">
                <Button type="button" variant="outline" onClick={prevStep} className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px]">Atrás</Button>
                <Button type="button" onClick={nextStep} className="flex-[2] h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest text-[10px] gap-2">Siguiente Paso <ArrowRight className="h-4 w-4" /></Button>
              </CardFooter>
            </Card>
          )}

          {step === 4 && (
            <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden animate-in slide-in-from-right-4">
              <CardHeader className="p-10 bg-slate-900 text-white">
                <CardTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                  <Zap className="h-6 w-6 text-blue-400" /> 4. Análisis de Consumo y Dolor
                </CardTitle>
                <CardDescription className="text-slate-400 font-medium">Finalice indicándonos su objetivo principal.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Consumo Mensual Est. (m³)</Label>
                    <Input type="number" placeholder="Ej: 450" value={formData.avgMonthlyConsumptionM3} onChange={e => updateField('avgMonthlyConsumptionM3', e.target.value)} className="h-12 border-2 rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Monto Última Boleta ($)</Label>
                    <Input type="number" placeholder="Ej: 1500000" value={formData.lastMonthlyBillCLP} onChange={e => updateField('lastMonthlyBillCLP', e.target.value)} className="h-12 border-2 rounded-xl font-bold" />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">¿Cuál es su prioridad número 1?</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { id: "ahorro_costos", label: "Ahorro Económico", desc: "Reducir la cuenta mensual." },
                      { id: "deteccion_fugas", label: "Control de Fugas", desc: "Evitar mermas ocultas." },
                      { id: "sustentabilidad", label: "Sustentabilidad", desc: "Certificación ambiental." }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updateField('mainPainPoint', opt.id)}
                        className={cn(
                          "p-6 rounded-2xl border-2 text-left transition-all active:scale-95",
                          formData.mainPainPoint === opt.id ? "border-blue-600 bg-blue-50 shadow-inner" : "border-slate-100 hover:border-blue-200"
                        )}
                      >
                        <p className="font-black text-xs uppercase text-slate-900 mb-1">{opt.label}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 p-8 rounded-[2rem] border-2 border-blue-100 flex items-start gap-4">
                  <ShieldCheck className="h-6 w-6 text-blue-600 shrink-0" />
                  <p className="text-xs text-blue-900 font-medium leading-relaxed">
                    Al enviar este diagnóstico, autorizas a <strong>GENKO</strong> para utilizar estos datos en la creación de una propuesta técnica y económica personalizada para tu institución.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="p-10 pt-0 flex gap-4">
                <Button type="button" variant="outline" onClick={prevStep} className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px]">Atrás</Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="flex-[2] h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-xl"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Finalizar y Enviar Diagnóstico"}
                </Button>
              </CardFooter>
            </Card>
          )}
        </form>

        <div className="text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">GENKO • Industrial Water Intelligence • Chile 2024</p>
        </div>
      </div>
    </div>
  );
}
