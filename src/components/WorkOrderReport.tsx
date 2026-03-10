"use client";

import React from "react";
import { Company, WorkOrder, Client, Asset, DigitalLogbookEntry, PartUsage, StaffMember } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ShieldCheck, HardHat, MapPin, CheckCircle2, Users, Fingerprint, Camera, Check, Hash, Calendar, User, Building2, Globe, Layers } from "lucide-react";
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
    <div ref={forwardedRef} className="bg-white p-12 text-slate-900 w-[850px] mx-auto min-h-[1100px]" id="work-order-report" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-8">
        <div className="flex gap-6 items-center">
          <div className="bg-slate-900 p-4 rounded-2xl"><Building2 className="text-white h-10 w-10" /></div>
          <div><h1 className="text-2xl font-black uppercase text-slate-900">{company?.name || "PCGMANTENIMIENTO"}</h1><p className="text-xs font-bold text-slate-500">RUT: {company?.rut || "S/I"}</p></div>
        </div>
        <div className="text-right"><p className="text-sm font-black text-slate-400 mb-1 uppercase">ORDEN DE TRABAJO</p><p className="text-4xl font-black text-slate-900 tracking-tighter">{workOrder.id}</p></div>
      </div>

      <div className="mb-10 p-8 bg-slate-50 rounded-[2rem] border-2 border-slate-100 space-y-6">
        <div className="grid grid-cols-2 gap-10">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2"><Building2 className="h-4 w-4" /> Entidad Mandante</h3>
            <div className="space-y-1"><p className="text-base font-black text-slate-900">{client?.name || "S/I"}</p><p className="text-xs font-bold text-slate-500">RUT: {client?.rut || "S/I"}</p></div>
          </div>
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Globe className="h-4 w-4" /> Ubicación Estructurada</h3>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900">{workOrder.street} {workOrder.streetNumber}{workOrder.complement ? ', ' + workOrder.complement : ''}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{workOrder.commune}, {workOrder.region}</p>
            </div>
          </div>
        </div>
      </div>

      {workOrder.serviceItems && workOrder.serviceItems.length > 0 && (
        <div className="mb-10">
          <h3 className="text-[10px] font-black uppercase text-slate-400 border-b-2 pb-2 mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4" /> DESGLOSE DE MAGNITUDES Y CUBICACIONES
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {workOrder.serviceItems.map(item => (
              <div key={item.id} className="p-4 bg-white border-2 rounded-xl flex justify-between items-center">
                <span className="text-xs font-bold text-slate-600">{item.description}</span>
                <span className="text-sm font-black text-slate-900">{item.quantity} {item.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-10">
        <h3 className="text-[10px] font-black uppercase text-slate-400 border-b-2 pb-2 mb-4">DETALLE TÉCNICO GENERAL</h3>
        <div className="p-6 border-2 rounded-2xl min-h-[100px] italic text-sm leading-relaxed">"{workOrder.description}"</div>
      </div>

      <div className="mb-10">
        <h3 className="text-[10px] font-black uppercase text-slate-400 border-b-2 pb-2 mb-4">PROTOCOLOS Y EVIDENCIAS</h3>
        <div className="grid grid-cols-1 gap-6">
          {workOrder.checklist?.map(item => {
            const photos = item.evidenceUrls || (item.evidenceUrl ? [item.evidenceUrl] : []);
            return (
              <div key={item.id} className="flex flex-col gap-4 p-4 bg-white rounded-xl border-2">
                <div className="flex items-center gap-4">
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${item.completed ? 'bg-emerald-500 text-white' : 'border-slate-300'}`}>{item.completed && <Check className="h-3 w-3" />}</div>
                  <div className="flex flex-col"><span className={`text-sm font-bold ${item.completed ? 'text-slate-900' : 'text-slate-400'}`}>{item.task}</span>{item.completed && <span className="text-[8px] font-black text-slate-400">REALIZADO: {formatDateLabel(item.completedAt)}</span>}</div>
                </div>
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((url, i) => (
                      <div key={i} className="aspect-video rounded-lg overflow-hidden border bg-slate-50"><FirebaseImage url={url} className="w-full h-full object-cover" /></div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto pt-16 border-t-2 border-slate-100 grid grid-cols-2 gap-20">
        <div className="text-center space-y-4">
          <div className="h-32 border-2 border-slate-900 flex flex-col items-center justify-center bg-slate-50/30 p-4 rounded-xl">
            {workOrder.technicianApprovalCode ? (
              <><Check className="h-8 w-8 text-emerald-600 mb-2" /><p className="text-[10px] font-black uppercase">VALIDACIÓN TÉCNICA</p><p className="text-[8px] font-mono text-slate-400">CÓD: {workOrder.technicianApprovalCode}</p></>
            ) : <span className="text-[9px] text-slate-300 italic font-bold">Pendiente</span>}
          </div>
          <p className="text-[11px] font-black text-slate-900 uppercase">Firma Técnico Responsable</p>
        </div>
        <div className="text-center space-y-4">
          <div className="h-32 border-2 border-slate-900 flex flex-col items-center justify-center bg-slate-50/50 p-4 rounded-xl">
            {workOrder.clientApprovalCode ? (
              <><Fingerprint className="h-8 w-8 text-slate-900 mb-2" /><p className="text-[10px] font-black uppercase">APROBACIÓN DIGITAL</p><p className="text-[8px] font-mono text-slate-400">ID: {workOrder.clientApprovalCode}</p></>
            ) : <span className="text-[9px] text-slate-300 italic font-bold">Pendiente</span>}
          </div>
          <p className="text-[11px] font-black text-slate-900 uppercase">Validación Recepción Cliente</p>
        </div>
      </div>
    </div>
  );
};