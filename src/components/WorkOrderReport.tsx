"use client";

import React from "react";
import { Company, WorkOrder, Client, Asset, DigitalLogbookEntry, PartUsage, StaffMember } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ShieldCheck, HardHat, MapPin, CheckCircle2, Users, Fingerprint, Camera, Check, Hash, Calendar, User, Building2, Globe, Layers, History, ClipboardList } from "lucide-react";
import { FirebaseImage } from "@/components/FirebaseImage";

interface WorkOrderReportProps {
  company: Company | null;
  workOrder: WorkOrder;
  client: Client | null;
  asset: Asset | null;
  logbook: DigitalLogbookEntry[];
  assignedStaff: StaffMember[];
  partUsages: PartUsage[];
  qrCodeUrl?: string;
  forwardedRef?: React.Ref<HTMLDivElement>;
}

export const WorkOrderReport: React.FC<WorkOrderReportProps> = ({ 
  company, workOrder, client, asset, logbook, assignedStaff, partUsages, qrCodeUrl, forwardedRef
}) => {
    
  const formatDateLabel = (date: any) => {
    if (!date) return "...";
    try {
      const d = date.toDate ? date.toDate() : (typeof date === 'string' ? parseISO(date) : date);
      return format(d, "dd/MM/yyyy HH:mm", { locale: es });
    } catch (e) { return "N/A"; }
  };

  return (
    <div 
      ref={forwardedRef} 
      className="bg-white p-10 text-slate-900 w-[850px] mx-auto shadow-none flex flex-col" 
      id="work-order-report" 
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Header Corporativo */}
      <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6 mb-6 shrink-0">
        <div className="flex gap-4 items-center">
          <div className="bg-slate-900 p-3 rounded-xl">
            <Building2 className="text-white h-8 w-8" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase text-slate-900 leading-none mb-1">{company?.name || "PCGMANTENIMIENTO"}</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">RUT: {company?.rut || "S/I"}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Reporte Técnico Oficial</p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{workOrder.id}</p>
        </div>
      </div>

      {/* Contenido Principal con flujo dinámico */}
      <div className="flex-1 space-y-8">
        {/* Información Matriz */}
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-8">
          <div className="space-y-3">
            <h3 className="text-[9px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5" /> Entidad Mandante
            </h3>
            <div>
              <p className="text-sm font-black text-slate-900">{client?.name || "S/I"}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase">RUT: {client?.rut || "No registrado"}</p>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
              <Globe className="h-3.5 w-3.5" /> Ubicación del Servicio
            </h3>
            <div>
              <p className="text-xs font-bold text-slate-900">{workOrder.street} {workOrder.streetNumber}{workOrder.complement ? ', ' + workOrder.complement : ''}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{workOrder.commune}, {workOrder.region}</p>
            </div>
          </div>
        </div>

        {/* Alcance Técnico */}
        <div>
          <h3 className="text-[9px] font-black uppercase text-slate-400 border-b pb-2 mb-3 tracking-widest flex items-center gap-2">
            <ClipboardList className="h-3.5 w-3.5" /> Alcance del Requerimiento
          </h3>
          <div className="p-4 bg-slate-50/50 border rounded-xl italic text-xs leading-relaxed text-slate-700">
            "{workOrder.description}"
          </div>
        </div>

        {/* Magnitudes y Partidas */}
        {workOrder.serviceItems && workOrder.serviceItems.length > 0 && (
          <div className="page-break-inside-avoid">
            <h3 className="text-[9px] font-black uppercase text-slate-400 border-b pb-2 mb-3 tracking-widest flex items-center gap-2">
              <Layers className="h-3.5 w-3.5" /> Desglose de Partidas y Mediciones
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {workOrder.serviceItems.map(item => (
                <div key={item.id} className="p-3 bg-white border rounded-xl flex justify-between items-center shadow-sm">
                  <span className="text-[11px] font-bold text-slate-600">{item.description}</span>
                  <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-md">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Protocolos y Evidencias (Checklist) */}
        <div>
          <h3 className="text-[9px] font-black uppercase text-slate-400 border-b pb-2 mb-4 tracking-widest flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5" /> Protocolos de Verificación & Evidencias
          </h3>
          <div className="space-y-4">
            {workOrder.checklist?.map(item => {
              const photos = item.evidenceUrls || (item.evidenceUrl ? [item.evidenceUrl] : []);
              return (
                <div key={item.id} className="flex flex-col gap-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm page-break-inside-avoid">
                  <div className="flex items-center gap-3">
                    <div className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>
                      {item.completed && <Check className="h-3 w-3" />}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-xs font-bold ${item.completed ? 'text-slate-900' : 'text-slate-400'}`}>{item.task}</span>
                      {item.completed && <span className="text-[8px] font-black text-slate-400 uppercase">Ejecutado: {formatDateLabel(item.completedAt)}</span>}
                    </div>
                  </div>
                  {photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {photos.map((url, i) => (
                        <div key={i} className="aspect-video rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                          <FirebaseImage url={url} className="w-full h-full object-cover" forceCORS={true} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bitácora Técnica */}
        {logbook && logbook.length > 0 && (
          <div className="page-break-inside-avoid">
            <h3 className="text-[9px] font-black uppercase text-slate-400 border-b pb-2 mb-3 tracking-widest flex items-center gap-2">
              <History className="h-3.5 w-3.5" /> Trazabilidad de Eventos (Bitácora)
            </h3>
            <div className="bg-slate-50 p-4 rounded-xl border space-y-2">
              {logbook.slice(0, 20).map(entry => (
                <div key={entry.id} className="flex gap-3 text-[9px] border-b border-slate-200 pb-1.5 last:border-0 last:pb-0">
                  <span className="text-slate-400 w-24 shrink-0 font-bold">{formatDateLabel(entry.timestamp)}</span>
                  <div className="flex-1">
                    <span className="font-black text-slate-900 uppercase mr-2">{entry.eventType.replace('_', ' ')}:</span>
                    <span className="text-slate-600 leading-tight">{entry.eventDetails}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Firmas y Sellos Digitales */}
        <div className="pt-10 border-t-2 border-slate-100 grid grid-cols-2 gap-16 page-break-inside-avoid">
          <div className="text-center space-y-3">
            <div className="h-28 border-2 border-slate-900 flex flex-col items-center justify-center bg-slate-50/30 p-4 rounded-xl relative overflow-hidden">
              {workOrder.technicianApprovalCode ? (
                <>
                  <div className="absolute top-1 right-1 opacity-5"><ShieldCheck className="h-10 w-10" /></div>
                  <Check className="h-6 w-6 text-emerald-600 mb-1" />
                  <p className="text-[10px] font-black text-slate-900 leading-tight">{workOrder.technicianApprovalName}</p>
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Validación Técnica</p>
                  <p className="text-[8px] font-mono text-slate-400 mt-1 uppercase">Sello: {workOrder.technicianApprovalCode}</p>
                </>
              ) : <span className="text-[9px] text-slate-300 italic font-bold">Validación Pendiente</span>}
            </div>
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Firma Técnico Responsable</p>
          </div>

          <div className="text-center space-y-3">
            <div className="h-28 border-2 border-slate-900 flex flex-col items-center justify-center bg-slate-50/50 p-4 rounded-xl relative overflow-hidden">
              {workOrder.clientApprovalCode ? (
                <>
                  <div className="absolute top-1 right-1 opacity-5"><Fingerprint className="h-10 w-10" /></div>
                  <Fingerprint className="h-6 w-6 text-slate-900 mb-1" />
                  <p className="text-[10px] font-black text-slate-900 leading-tight">{workOrder.clientApprovalName}</p>
                  <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Aprobación Digital Mandante</p>
                  <p className="text-[8px] font-mono text-slate-400 mt-1 uppercase">ID: {workOrder.clientApprovalCode}</p>
                </>
              ) : <span className="text-[9px] text-slate-300 italic font-bold">Aprobación Pendiente</span>}
            </div>
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Recepción Conforme Cliente</p>
          </div>
        </div>
      </div>

      {/* Footer del PDF */}
      <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between items-center opacity-40 shrink-0">
        <p className="text-[8px] font-black uppercase tracking-[0.3em]">Respaldo generado vía PCGMANTENIMIENTO ERP</p>
        <p className="text-[8px] font-bold uppercase">{format(new Date(), "dd/MM/yyyy HH:mm")}</p>
      </div>
    </div>
  );
};
