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
  Building2, 
  Smartphone, 
  MapPin, 
  ShieldCheck,
  CheckCircle2,
  PlusCircle,
  Zap,
  ClipboardPlus
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ClientsHelp() {
  const steps = [
    {
      title: "1. Registro Flexible",
      desc: "Puedes crear clientes en este módulo o directamente al generar una nueva OT para mayor agilidad operativa.",
      icon: PlusCircle,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "2. Ubicación Matriz",
      desc: "Configura la dirección comercial. Esta servirá de base para el direccionamiento geográfico de tus servicios técnicos.",
      icon: MapPin,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      title: "3. Portal de Autogestión",
      desc: "Envía el enlace único por Email o WhatsApp. El cliente podrá solicitar servicios y ver su historial sin loguearse.",
      icon: Smartphone,
      color: "text-indigo-600",
      bg: "bg-indigo-50"
    },
    {
      title: "4. Trazabilidad Total",
      desc: "Tus clientes pueden firmar reportes digitales en terreno y descargar sus certificados de experiencia 24/7.",
      icon: ShieldCheck,
      color: "text-slate-900",
      bg: "bg-slate-100"
    }
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-xl border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 gap-2 h-9 px-4 font-bold text-[10px] uppercase">
          <HelpCircle className="h-3.5 w-3.5" /> Guía de Clientes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="bg-slate-900 text-white p-8">
          <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-blue-400" /> Ecosistema de Clientes
          </DialogTitle>
          <DialogDescription className="text-slate-400 font-medium">
            Cómo gestionar y digitalizar la relación con tus mandantes.
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
              <Zap className="h-4 w-4" /> Tip Pro de Productividad
            </p>
            <p className="text-[9px] text-slate-500 leading-relaxed">
              ¿Tienes un cliente nuevo en terreno? No vuelvas a la oficina. Crea el cliente **directamente desde el formulario de Nueva OT** y el sistema lo guardará en tu cartera automáticamente.
            </p>
          </div>
          <Button className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px]" asChild>
            <DialogTrigger>Entendido, gestionar cartera</DialogTrigger>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
