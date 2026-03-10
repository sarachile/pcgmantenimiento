
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
  UserPlus, 
  MessageCircle, 
  Smartphone, 
  Users2, 
  ShieldCheck,
  CheckCircle2,
  KeyRound
} from "lucide-react";
import { cn } from "@/lib/utils";

export function TeamHelp() {
  const steps = [
    {
      title: "1. Registro Base",
      desc: "Ingresa los datos del técnico (Nombre, RUT y Teléfono). El sistema creará una ficha interna pendiente de activación.",
      icon: UserPlus,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "2. Invitación WhatsApp",
      desc: "Usa el botón 'Invitar por WA' para enviar un enlace único al móvil del técnico. No requiere que el técnico use correo electrónico.",
      icon: MessageCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      title: "3. Activación (Técnico)",
      desc: "El técnico abre el link en su móvil, confirma su identidad con su RUT y define su propio PIN de acceso de 6 dígitos.",
      icon: Smartphone,
      color: "text-indigo-600",
      bg: "bg-indigo-50"
    },
    {
      title: "4. Organización",
      desc: "Agrupa a tus técnicos en 'Cuadrillas' (ej: Equipo Solar, Mantenimiento HVAC) para asignar órdenes de trabajo de forma masiva.",
      icon: Users2,
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
    {
      title: "5. Control Total",
      desc: "Si un técnico olvida su PIN, usa la opción 'Resetear Acceso'. Esto invalidará el PIN anterior y permitirá crear uno nuevo.",
      icon: ShieldCheck,
      color: "text-slate-900",
      bg: "bg-slate-100"
    }
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-xl border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 gap-2 h-9 px-4 font-bold text-[10px] uppercase">
          <HelpCircle className="h-3.5 w-3.5" /> Guía de Gestión
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="bg-slate-900 text-white p-8">
          <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" /> Flujo de Alta Técnica
          </DialogTitle>
          <DialogDescription className="text-slate-400 font-medium">
            Cómo configurar tu flota de terreno en 5 pasos simples.
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
              <KeyRound className="h-4 w-4" /> Seguridad de Acceso Técnico
            </p>
            <p className="text-[9px] text-slate-500 leading-relaxed">
              Tus técnicos acceden exclusivamente con <strong>RUT y PIN</strong>. No necesitan recordar contraseñas complejas ni correos corporativos, lo que reduce el soporte interno y acelera el inicio de la operación.
            </p>
          </div>
          <Button className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px]" asChild>
            <DialogTrigger>Entendido, configurar equipo</DialogTrigger>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
