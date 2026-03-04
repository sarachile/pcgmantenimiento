
"use client";

import React from "react";
import { Company, WorkOrder, Client, Asset, DigitalLogbookEntry, User } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";
import { ShieldCheck, HardHat, Calendar, Clock, MapPin, CheckCircle2, User as UserIcon } from "lucide-react";

interface WorkOrderReportProps {
  company: Company | null;
  workOrder: WorkOrder;
  client: Client | null;
  asset: Asset | null;
  logbook: DigitalLogbookEntry[];
  technician: User | null;
}

export const WorkOrderReport = React.forwardRef<HTMLDivElement, WorkOrderReportProps>(
  ({ company, workOrder, client, asset, logbook, technician }, ref) => {
    const formatDate = (date: any) => {
      if (!date) return "N/A";
      try {
        const d = date.toDate ? date.toDate() : (typeof date === 'string' ? parseISO(date) : date);
        return format(d, "PPP 'a las' p", { locale: es });
      } catch (e) {
        return "N/A";
      }
    };

    return (
      <div 
        ref={ref} 
        className="bg-white p-12 text-slate-900 w-[800px] mx-auto min-h-[1100px] shadow-2xl"
        id="work-order-report"
      >
        {/* Header Section */}
        <div className="flex justify-between items-start border-b-2 border-slate-200 pb-8 mb-8">
          <div className="flex gap-4 items-center">
            {company?.logoUrl ? (
              <div className="relative h-20 w-20 border rounded-lg overflow-hidden bg-white">
                <Image src={company.logoUrl} alt="Logo" fill className="object-contain p-2" />
              </div>
            ) : (
              <div className="bg-slate-900 p-4 rounded-xl">
                <ShieldCheck className="text-white h-10 w-10" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900">
                {company?.name || "PCGMANTENIMIENTO"}
              </h1>
              <p className="text-xs font-bold text-slate-500 uppercase">RUT: {company?.rut || "S/I"}</p>
              <p className="text-xs text-slate-400 max-w-[200px]">{company?.address}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-black text-primary/20 absolute right-12 top-12 opacity-10">REPORTE</h2>
            <p className="text-sm font-black text-slate-900 mb-1">ORDEN DE TRABAJO</p>
            <p className="text-3xl font-black text-primary tracking-tighter">{workOrder.id}</p>
            <div className="inline-block px-3 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-full mt-2 uppercase">
              Estado: {workOrder.status}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-1">Información del Cliente</h3>
            <div className="space-y-1">
              <p className="text-sm font-bold">{client?.name}</p>
              <p className="text-xs text-slate-500">RUT: {client?.rut}</p>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3 w-3" /> {client?.address}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-1">Equipo / Activo</h3>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm font-bold">
                <HardHat className="h-4 w-4 text-primary" />
                {asset?.name}
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Código: {asset?.code}</p>
              <p className="text-xs text-slate-500 italic">{asset?.location}</p>
            </div>
          </div>
        </div>

        {/* Dates Section */}
        <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border mb-8">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Inicio</p>
            <p className="text-xs font-bold">{formatDate(workOrder.scheduledDate)}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Ejecución</p>
            <p className="text-xs font-bold">{formatDate(workOrder.executedAt)}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Término Real</p>
            <p className="text-xs font-bold">{formatDate(workOrder.reviewedAt || workOrder.updatedAt)}</p>
          </div>
        </div>

        {/* AI Summary */}
        {workOrder.aiSummary && (
          <div className="mb-8 p-6 bg-primary/5 rounded-2xl border-l-4 border-primary">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-2">Resumen Ejecutivo (IA)</h3>
            <p className="text-sm leading-relaxed text-slate-700 italic">"{workOrder.aiSummary}"</p>
          </div>
        )}

        {/* Checklist */}
        <div className="mb-8">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-1 mb-4">Protocolo de Trabajo Realizado</h3>
          <div className="grid grid-cols-1 gap-2">
            {workOrder.checklist?.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>
                    {item.completed && <CheckCircle2 className="h-3 w-3" />}
                  </div>
                  <span className={`text-sm ${item.completed ? 'font-bold' : 'text-slate-400'}`}>{item.task}</span>
                </div>
                {item.completed && (
                  <span className="text-[10px] font-bold text-emerald-600">COMPLETADO</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Evidence Photos */}
        {workOrder.evidenceUrls && workOrder.evidenceUrls.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-1 mb-4">Evidencia Fotográfica</h3>
            <div className="grid grid-cols-3 gap-2">
              {workOrder.evidenceUrls.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border bg-slate-100">
                  <Image src={url} alt="Evidencia" fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="mt-auto pt-12">
          <div className="grid grid-cols-2 gap-12">
            <div className="text-center">
              <div className="h-24 relative border-b border-slate-300 mb-2 flex items-center justify-center">
                {workOrder.technicianSignatureUrl && (
                  <Image src={workOrder.technicianSignatureUrl} alt="Firma Técnico" fill className="object-contain" />
                )}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase">Firma Técnico Responsable</p>
              <p className="text-xs font-bold">{technician?.name || "Diego Morales"}</p>
            </div>
            <div className="text-center">
              <div className="h-24 relative border-b border-slate-300 mb-2 flex items-center justify-center">
                {workOrder.clientSignatureUrl && (
                  <Image src={workOrder.clientSignatureUrl} alt="Firma Cliente" fill className="object-contain" />
                )}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase">Firma Cliente (Recepción)</p>
              <p className="text-xs font-bold">{client?.contactName || "Firma conforme"}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center border-t pt-4">
          <p className="text-[8px] text-slate-300 font-bold uppercase tracking-[0.2em]">
            Documento generado por PCGMANTENIMIENTO ERP - Propiedad de {company?.name}
          </p>
        </div>
      </div>
    );
  }
);

WorkOrderReport.displayName = "WorkOrderReport";
