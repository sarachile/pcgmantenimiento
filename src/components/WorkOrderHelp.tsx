"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  HelpCircle, 
  PlusCircle, 
  HardHat, 
  ShieldCheck, 
  QrCode, 
  Trophy,
  ArrowRight,
  CheckCircle2,
  Smartphone,
  Building2,
  Fingerprint
} from "lucide-react";
import { cn } from "@/lib/utils";

export function WorkOrderHelp() {
  const steps = [
    {
      title: "1. Generación",
      desc: "Define el alcance, ubicación y asigna al personal. Aquí decides si requieres 'Visado Administrativo' (revisión de oficina) antes de que el cliente pueda firmar.",
      icon: PlusCircle,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "2. Ejecución (Terreno)",
      desc: "El técnico recibe la OT en su móvil, completa los protocolos técnicos (checklist) y captura las evidencias fotográficas obligatorias.",
      icon: HardHat,
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
    {
      title: "3. Validación Técnica",
      desc: "Al terminar, el técnico tiene dos opciones: 'Firma QR' (si el cliente está presente) o 'Sello Técnico' (si no hay nadie, requiere foto de respaldo).",
      icon: Smartphone,
      color: "text-indigo-600",
      bg: "bg-indigo-50"
    },
    {
      title: "4. Visado Admin (Oficina)",
      desc: "Un supervisor revisa que las fotos y protocolos estén conformes. Al 'Visar', la orden queda lista para el cierre legal o se envía al cliente por email.",
      icon: ShieldCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      title: "5. Aprobación Final",
      desc: "El cliente genera su sello de validación digital inalterable. El sistema emite el Certificado de Experiencia y habilita la facturación DTE.",
      icon: Fingerprint,
      color: "text-slate-900",
      bg: "bg-slate-100"
    }
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-xl border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 gap-2 h-9 px-4 font-bold text-[10px] uppercase">
          <HelpCircle className="h-3.5 w-3.5" /> Guía de Flujo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="bg-slate-900 text-white p-8">
          <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-blue-400" /> Ciclo de Vida de la OT
          </DialogTitle>
          <DialogDescription className="text-slate-400 font-medium">
            Entiende cómo funciona la trazabilidad desde el terreno hasta la oficina.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          {steps.map((step, idx) => (
            <div key={idx} className="flex gap-6 group">
              <div className="flex flex-col items-center">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110", step.bg, step.color)}>
                  <step.icon className="h-6 w-6" />
                </div>
                {idx !== steps.length - 1 && <div className="w-0.5 h-full bg-slate-100 my-2" />}
              </div>
              <div className="space-y-1 pb-6">
                <h4 className="font-black text-slate-900 uppercase italic tracking-tight">{step.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 bg-slate-50 border-t flex flex-col gap-4">
          <div className="bg-white p-4 rounded-2xl border-2 border-dashed space-y-3">
            <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
              <QrCode className="h-4 w-4" /> Tipos de Aprobación en Terreno
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-900 uppercase">Validación QR</p>
                <p className="text-[9px] text-slate-500 leading-tight">El cliente escanea un código desde el móvil del técnico y firma en el acto. Cierre inmediato.</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-900 uppercase">Sello Técnico</p>
                <p className="text-[9px] text-slate-500 leading-tight">Si el cliente no está, el técnico certifica el cierre con fotos. Requiere revisión posterior en oficina.</p>
              </div>
            </div>
          </div>
          <Button className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px]" asChild>
            <DialogTrigger>Entendido, continuar</DialogTrigger>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
