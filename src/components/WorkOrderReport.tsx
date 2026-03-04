"use client";

import React from "react";
import { Company, WorkOrder, Client, Asset, DigitalLogbookEntry, PartUsage, StaffMember } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ShieldCheck, HardHat, MapPin, CheckCircle2, Users, ClipboardList } from "lucide-react";

interface WorkOrderReportProps {
  company: Company | null;
  workOrder: WorkOrder;
  client: Client | null;
  asset: Asset | null;
  logbook: DigitalLogbookEntry[];
  assignedStaff: StaffMember[];
  partUsages: PartUsage[];
}

/**
 * Reporte optimizado para exportación a PDF.
 * Usa 'forwardedRef' para evitar colisiones con la función ref de Firebase Storage.
 */
export const WorkOrderReport = React.forwardRef<HTMLDivElement, WorkOrderReportProps>(
  ({ company, workOrder, client, asset, logbook, assignedStaff, partUsages }, forwardedRef) => {
    
    const formatDate = (date: any) => {
      if (!date) return "...";
      try {
        const d = date.toDate ? date.toDate() : (typeof date === 'string' ? parseISO(date) : date);
        return format(d, "dd/MM/yyyy HH:mm", { locale: es });
      } catch (e) { return "N/A"; }
    };

    return (
      <div 
        ref={forwardedRef} 
        className="bg-white p-12 text-slate-900 w-[850px] mx-auto min-h-[1100px] shadow-none border-0"
        id="work-order-report"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {/* ENCABEZADO CORPORATIVO */}
        <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-8">
          <div className="flex gap-6 items-center">
            {company?.logoUrl ? (
              <div className="relative h-24 w-24 border-2 border-slate-100 rounded-xl overflow-hidden bg-white">
                <img 
                  src={company.logoUrl} 
                  alt="Logo Empresa" 
                  className="w-full h-full object-contain p-2" 
                  crossOrigin="anonymous" 
                />
              </div>
            ) : (
              <div className="bg-slate-900 p-5 rounded-2xl">
                <ShieldCheck className="text-white h-12 w-12" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                {company?.name || "PCGMANTENIMIENTO ERP"}
              </h1>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">RUT: {company?.rut || "S/I"}</p>
              <p className="text-[10px] text-slate-400 max-w-[250px] mt-1 leading-tight">{company?.address}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-slate-400 mb-1 uppercase tracking-widest">ORDEN DE TRABAJO</p>
            <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{workOrder.id}</p>
            <div className="inline-block px-4 py-1 bg-slate-900 text-white text-[10px] font-black rounded-full mt-4 uppercase tracking-widest">
              ESTADO: {workOrder.status}
            </div>
          </div>
        </div>

        {/* INFORMACIÓN DE CAMPO */}
        <div className="grid grid-cols-2 gap-10 mb-10">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b-2 border-slate-100 pb-2">ENTIDAD CLIENTE</h3>
            <div className="space-y-1">
              <p className="text-base font-black text-slate-900">{client?.name || "S/I"}</p>
              <p className="text-xs font-bold text-slate-500">RUT: {client?.rut || "S/I"}</p>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" /> 
                <span className="leading-tight">{client?.address || "S/I"}</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b-2 border-slate-100 pb-2">EQUIPO / ACTIVO</h3>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-base font-black text-slate-900">
                <HardHat className="h-5 w-5 text-slate-900" />
                {asset?.name || "S/I"}
              </div>
              <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">CÓDIGO: {asset?.code || "S/I"}</p>
              <p className="text-xs text-slate-400 italic">Ubicación: {asset?.location || "S/I"}</p>
            </div>
          </div>
        </div>

        {/* EQUIPO DE TRABAJO */}
        <div className="mb-10 p-6 bg-slate-50 rounded-2xl border-2 border-slate-100">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 mb-4 flex items-center gap-2">
            <Users className="h-4 w-4" /> PERSONAL TÉCNICO RESPONSABLE
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {assignedStaff && assignedStaff.length > 0 ? (
              assignedStaff.map(s => (
                <div key={s.id} className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <span className="text-sm font-black text-slate-800">{s.name}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.role}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic col-span-2">No se ha registrado información de personal para esta orden.</p>
            )}
          </div>
        </div>

        {/* DESCRIPCIÓN TÉCNICA */}
        <div className="mb-10">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b-2 border-slate-100 pb-2 mb-4">DETALLE DE LOS TRABAJOS</h3>
          <div className="p-6 bg-white border-2 border-slate-100 rounded-2xl">
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{workOrder.description}</p>
          </div>
        </div>

        {/* PROTOCOLO Y CHECKLIST */}
        <div className="mb-10">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b-2 border-slate-100 pb-2 mb-4">PROTOCOLOS DE VERIFICACIÓN</h3>
          <div className="grid grid-cols-1 gap-2">
            {workOrder.checklist && workOrder.checklist.length > 0 ? (
              workOrder.checklist.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>
                      {item.completed && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                    <span className={`text-sm ${item.completed ? 'font-black text-slate-900' : 'text-slate-400'}`}>{item.task}</span>
                  </div>
                  {item.completedAt && (
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                      {format(new Date(item.completedAt), "HH:mm 'hrs'")}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No se definieron ítems de control para esta tarea.</p>
            )}
          </div>
        </div>

        {/* SECCIÓN DE FIRMAS DIGITALES */}
        <div className="mt-auto pt-16 border-t-2 border-slate-100">
          <div className="grid grid-cols-2 gap-20">
            <div className="text-center space-y-4">
              <div className="h-32 border-b-2 border-slate-200 flex items-center justify-center bg-slate-50/50 rounded-t-2xl overflow-hidden">
                {workOrder.technicianSignatureUrl ? (
                  <img 
                    src={workOrder.technicianSignatureUrl} 
                    alt="Firma Técnico" 
                    className="max-h-full max-w-full object-contain mix-blend-multiply" 
                    crossOrigin="anonymous" 
                  />
                ) : (
                  <span className="text-[10px] text-slate-300 italic font-bold uppercase tracking-widest">Pendiente Firma Técnico</span>
                )}
              </div>
              <div>
                <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Firma Técnico Responsable</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Validado vía PCGMANTENIMIENTO</p>
              </div>
            </div>
            <div className="text-center space-y-4">
              <div className="h-32 border-b-2 border-slate-200 flex items-center justify-center bg-slate-50/50 rounded-t-2xl overflow-hidden">
                {workOrder.clientSignatureUrl ? (
                  <img 
                    src={workOrder.clientSignatureUrl} 
                    alt="Firma Cliente" 
                    className="max-h-full max-w-full object-contain mix-blend-multiply" 
                    crossOrigin="anonymous" 
                  />
                ) : (
                  <span className="text-[10px] text-slate-300 italic font-bold uppercase tracking-widest">Pendiente Recepción Cliente</span>
                )}
              </div>
              <div>
                <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Firma Recepción Conforme</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Entidad: {client?.name || "Cliente"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* PIE DE PÁGINA AUDITABLE */}
        <div className="mt-16 text-center border-t border-slate-100 pt-6">
          <p className="text-[8px] text-slate-300 font-black uppercase tracking-[0.4em] mb-1">
            PCGMANTENIMIENTO ERP - SISTEMA DE GESTIÓN INDUSTRIAL AVANZADA
          </p>
          <p className="text-[7px] text-slate-300 uppercase">
            ID Documento: {workOrder.id} | Fecha Emisión: {new Date().toLocaleString()} | www.pcgmantenimiento.com
          </p>
        </div>
      </div>
    );
  }
);

WorkOrderReport.displayName = "WorkOrderReport";
