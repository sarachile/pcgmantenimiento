
"use client";

import React from "react";
import { Company, WorkOrder, Client, Asset, DigitalLogbookEntry, PartUsage, StaffMember } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ShieldCheck, HardHat, MapPin, CheckCircle2, Users, Fingerprint, Camera, Check, Hash, Calendar, User } from "lucide-react";
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
  company, 
  workOrder, 
  client, 
  asset, 
  logbook, 
  assignedStaff, 
  partUsages, 
  qrCodeUrl,
  forwardedRef
}) => {
    
  const formatDateLabel = (date: any) => {
    if (!date) return "...";
    try {
      const d = date.toDate ? date.toDate() : (typeof date === 'string' ? parseISO(date) : date);
      return format(d, "dd/MM/yyyy HH:mm", { locale: es });
    } catch (e) { return "N/A"; }
  };

  const showQrInPdf = workOrder.reviewerRequired && !workOrder.clientApprovalCode && qrCodeUrl;

  return (
    <div 
      ref={forwardedRef} 
      className="bg-white p-12 text-slate-900 w-[850px] mx-auto min-h-[1100px] shadow-none border-0"
      id="work-order-report"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-8">
        <div className="flex gap-6 items-center">
          <div className="relative h-24 w-24 border-2 border-slate-100 rounded-xl overflow-hidden bg-white">
            <FirebaseImage 
              url={company?.logoUrl} 
              className="w-full h-full"
            />
          </div>
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
            ESTADO: {workOrder.status.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Client & Asset Info */}
      <div className="grid grid-cols-2 gap-10 mb-6">
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

      {/* Lugar y Solicitante del Servicio */}
      <div className="grid grid-cols-2 gap-10 mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-200">
        <div className="space-y-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">LUGAR DE INTERVENCIÓN</p>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <p className="text-sm font-bold text-slate-800">{workOrder.serviceLocation || client?.address || "No especificado"}</p>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SOLICITADO POR</p>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-bold text-slate-800">{workOrder.requestedByName || "No especificado"}</p>
          </div>
        </div>
      </div>

      {/* Magnitud del Servicio */}
      <div className="mb-10 grid grid-cols-3 gap-6">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Magnitud de Servicio</p>
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-primary" />
            <p className="text-sm font-black">{workOrder.serviceQuantity || '0'} {workOrder.serviceUnit || ''}</p>
          </div>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha Operativa</p>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-bold">{formatDateLabel(workOrder.scheduledDate)}</p>
          </div>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Duración Técnica</p>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <p className="text-sm font-bold">{workOrder.durationDays || 1} días hábiles</p>
          </div>
        </div>
      </div>

      {/* Staff Info */}
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
            <p className="text-xs text-slate-400 italic col-span-2">Sin personal registrado.</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="mb-10">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b-2 border-slate-100 pb-2 mb-4">DETALLE DE LOS TRABAJOS</h3>
        <div className="p-6 bg-white border-2 border-slate-100 rounded-2xl min-h-[100px]">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{workOrder.description}</p>
        </div>
      </div>

      {/* Checklist with Embedded Evidence */}
      <div className="mb-10">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b-2 border-slate-100 pb-2 mb-4">PROTOCOLOS DE VERIFICACIÓN Y EVIDENCIA CONTEXTUAL</h3>
        <div className="grid grid-cols-1 gap-4">
          {workOrder.checklist && workOrder.checklist.length > 0 ? (
            workOrder.checklist.map((item) => (
              <div key={item.id} className="flex gap-6 p-4 bg-white rounded-xl border-2 border-slate-100">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-4">
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>
                      {item.completed && <Check className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm ${item.completed ? 'font-black text-slate-900' : 'text-slate-400'}`}>{item.task}</span>
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">
                        {item.completed ? `REALIZADO: ${item.completedAt ? format(new Date(item.completedAt), "dd/MM/yyyy HH:mm") : ''}` : 'PENDIENTE'}
                      </span>
                    </div>
                  </div>
                </div>
                {item.evidenceUrl && (
                  <div className="w-32 aspect-video rounded-lg overflow-hidden border bg-slate-50">
                    <FirebaseImage url={item.evidenceUrl} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">No se definieron protocolos.</p>
          )}
        </div>
      </div>

      {/* General Evidence Photos */}
      {workOrder.evidenceUrls && workOrder.evidenceUrls.length > 0 && (
        <div className="mb-10">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b-2 border-slate-100 pb-2 mb-4 flex items-center gap-2">
            <Camera className="h-4 w-4" /> OTRAS EVIDENCIAS FOTOGRÁFICAS
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {workOrder.evidenceUrls.map((url, i) => (
              <div key={i} className="aspect-video rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50">
                <FirebaseImage url={url} className="w-full h-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signatures Area */}
      <div className="mt-auto pt-16 border-t-2 border-slate-100">
        <div className="grid grid-cols-2 gap-20">
          <div className="text-center space-y-4">
            <div className="h-32 border-2 border-slate-900 flex flex-col items-center justify-center bg-slate-50/30 p-4 rounded-xl relative">
              {workOrder.technicianApprovalCode ? (
                <>
                  <Check className="h-8 w-8 text-emerald-600 mb-2" />
                  <p className="text-[10px] font-black uppercase text-slate-900 leading-tight">VALIDACIÓN TÉCNICA DIGITAL</p>
                  <p className="text-[9px] font-bold text-slate-600 mt-1">{workOrder.technicianApprovalName}</p>
                  <p className="text-[8px] font-mono text-slate-400 mt-2">CÓD: {workOrder.technicianApprovalCode}</p>
                  <p className="text-[8px] font-bold text-slate-400">{formatDateLabel(workOrder.technicianApprovalDate)}</p>
                </>
              ) : (
                <span className="text-[9px] text-slate-300 italic font-bold uppercase">Pendiente Sello Técnico</span>
              )}
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Firma Técnico Responsable</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Sello Operativo PCG</p>
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="h-32 border-2 border-slate-900 flex flex-col items-center justify-center bg-slate-50/50 p-4 relative rounded-xl">
              {workOrder.clientApprovalCode ? (
                <>
                  <Fingerprint className="h-8 w-8 text-slate-900 mb-2" />
                  <p className="text-[10px] font-black uppercase text-slate-900 leading-tight">APROBACIÓN DIGITAL CONFORME</p>
                  <p className="text-[9px] font-bold text-slate-600 mt-1">{workOrder.clientApprovalName}</p>
                  <p className="text-[8px] font-mono text-slate-400 mt-2">ID: {workOrder.clientApprovalCode}</p>
                  <p className="text-[8px] font-bold text-slate-400">{formatDateLabel(workOrder.clientApprovalDate)}</p>
                </>
              ) : showQrInPdf ? (
                <div className="flex flex-col items-center gap-1">
                  <img src={qrCodeUrl} alt="QR Validacion" className="h-20 w-20" />
                  <span className="text-[7px] font-black text-primary uppercase tracking-widest">Escanee para Validar Digitalmente</span>
                </div>
              ) : (
                <span className="text-[9px] text-slate-300 italic font-bold uppercase">Pendiente Validación Cliente</span>
              )}
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Validación Recepción Cliente</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Entidad: {client?.name || "Cliente"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
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
};
