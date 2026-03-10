"use client";

import React from "react";
import { Company, WorkOrder, Client, Asset } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ShieldCheck, Award, Calendar, Hash, CheckCircle2, Fingerprint, Layers } from "lucide-react";

interface ExperienceCertificateProps {
  company: Company | null;
  workOrder: WorkOrder;
  client: Client | null;
  asset: Asset | null;
  forwardedRef?: React.Ref<HTMLDivElement>;
}

export const ExperienceCertificate: React.FC<ExperienceCertificateProps> = ({ 
  company, 
  workOrder, 
  client, 
  asset, 
  forwardedRef
}) => {
    
  const formatDateLabel = (date: any) => {
    if (!date) return "...";
    try {
      const d = date.toDate ? date.toDate() : (typeof date === 'string' ? parseISO(date) : date);
      return format(d, "dd 'de' MMMM, yyyy", { locale: es });
    } catch (e) { return "N/A"; }
  };

  const today = format(new Date(), "dd 'de' MMMM, yyyy", { locale: es });

  return (
    <div 
      ref={forwardedRef} 
      className="bg-white p-16 text-slate-900 w-[850px] mx-auto min-h-[1100px] shadow-none border-0 relative overflow-hidden"
      id="experience-certificate"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Decorative Border */}
      <div className="absolute inset-0 border-[20px] border-slate-50 pointer-events-none -z-10" />
      
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-16">
        <div className="bg-slate-900 p-4 rounded-2xl mb-6">
          <ShieldCheck className="text-white h-12 w-12" />
        </div>
        <h1 className="text-sm font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Certificado de Experiencia Técnica</h1>
        <div className="h-1 w-24 bg-slate-900 mb-8" />
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Acreditación de Servicios Realizados</h2>
      </div>

      {/* Main Content */}
      <div className="space-y-10">
        <p className="text-lg leading-relaxed text-slate-700">
          Por intermedio del presente documento, <strong>{company?.name || 'PCGMANTENIMIENTO'}</strong>, 
          RUT <strong>{company?.rut || 'S/I'}</strong>, con domicilio en {company?.address || 'domicilio registrado'}, 
          certifica la ejecución conforme de los servicios técnicos detallados a continuación:
        </p>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-slate-50 p-8 rounded-3xl border-2 border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <Award className="h-4 w-4 text-slate-900" /> Información de la Contratación
            </h3>
            
            <table className="w-full">
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-4 text-xs font-black text-slate-400 uppercase tracking-wider w-1/3">Entidad Mandante</td>
                  <td className="py-4 text-sm font-bold text-slate-900">{client?.name || 'S/I'}</td>
                </tr>
                <tr>
                  <td className="py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Identificación OT</td>
                  <td className="py-4 text-sm font-bold text-slate-900">{workOrder.id}</td>
                </tr>
                <tr>
                  <td className="py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Objeto del Servicio</td>
                  <td className="py-4 text-sm font-medium text-slate-700 italic leading-relaxed">"{workOrder.description}"</td>
                </tr>
                {asset && (
                  <tr>
                    <td className="py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Activo Intervenido</td>
                    <td className="py-4 text-sm font-bold text-slate-900">{asset.name} (Cód: {asset.code})</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Magnitudes y Partidas en Certificado */}
          {workOrder.serviceItems && workOrder.serviceItems.length > 0 && (
            <div className="bg-white border-2 border-slate-100 rounded-3xl p-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-600" /> Desglose de Magnitudes y Cubicaciones
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {workOrder.serviceItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0 border-slate-50">
                    <span className="text-xs font-bold text-slate-600">{item.description}</span>
                    <span className="text-sm font-black text-slate-900">{item.quantity} {item.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white border-2 border-slate-100 p-6 rounded-2xl text-center space-y-2">
              <Calendar className="h-5 w-5 mx-auto text-slate-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha Operativa</p>
              <p className="text-sm font-black text-slate-900">{formatDateLabel(workOrder.scheduledDate)}</p>
            </div>
            <div className="bg-white border-2 border-slate-100 p-6 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="h-5 w-5 mx-auto text-emerald-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado Final</p>
              <p className="text-sm font-black text-emerald-600">APROBADO</p>
            </div>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-slate-500">
          Se deja constancia que los trabajos fueron realizados cumpliendo con los estándares de calidad y seguridad requeridos, 
          contando con la aprobación digital conforme de la entidad mandante bajo el código de verificación única 
          <strong> {workOrder.clientApprovalCode || 'N/A'}</strong>.
        </p>
      </div>

      {/* Footer / Signatures */}
      <div className="mt-20 pt-16 border-t-2 border-slate-100 flex justify-between items-end">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-lg"><Fingerprint className="text-white h-6 w-6" /></div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Documento Validado Digitalmente</p>
              <p className="text-[8px] font-mono text-slate-400">ID VERIFICACIÓN: {workOrder.clientApprovalCode || workOrder.id.toUpperCase()}</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-400">Emitido en plataforma PCGMANTENIMIENTO, a {today}.</p>
        </div>
        
        <div className="text-right">
          <p className="text-xs font-black text-slate-900 uppercase">{company?.name}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Departamento de Operaciones</p>
        </div>
      </div>

      <div className="absolute bottom-8 left-0 w-full text-center">
        <p className="text-[8px] text-slate-300 font-black uppercase tracking-[0.5em]">PCGMANTENIMIENTO ERP - SISTEMA DE GESTIÓN INDUSTRIAL</p>
      </div>
    </div>
  );
};