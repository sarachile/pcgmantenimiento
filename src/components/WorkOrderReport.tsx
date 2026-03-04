
"use client";

import React, { useState, useEffect } from "react";
import { Company, WorkOrder, Client, Asset, DigitalLogbookEntry, User, PartUsage, StaffMember } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ShieldCheck, HardHat, MapPin, CheckCircle2, Package, Users } from "lucide-react";

interface WorkOrderReportProps {
  company: Company | null;
  workOrder: WorkOrder;
  client: Client | null;
  asset: Asset | null;
  logbook: DigitalLogbookEntry[];
  assignedStaff: StaffMember[];
  partUsages: PartUsage[];
}

export const WorkOrderReport = React.forwardRef<HTMLDivElement, WorkOrderReportProps>(
  ({ company, workOrder, client, asset, logbook, assignedStaff, partUsages }, ref) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
      setIsMounted(true);
    }, []);

    const formatDate = (date: any) => {
      if (!isMounted || !date) return "...";
      try {
        const d = date.toDate ? date.toDate() : (typeof date === 'string' ? parseISO(date) : date);
        return format(d, "PPP 'a las' p", { locale: es });
      } catch (e) {
        return "N/A";
      }
    };

    if (!isMounted) return null;

    return (
      <div 
        ref={ref} 
        className="bg-white p-12 text-slate-900 w-[800px] mx-auto min-h-[1100px]"
        id="work-order-report"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {/* Header Section */}
        <div className="flex justify-between items-start border-b-2 border-slate-200 pb-8 mb-8">
          <div className="flex gap-4 items-center">
            {company?.logoUrl ? (
              <div className="relative h-20 w-20 border rounded-lg overflow-hidden bg-white">
                <img 
                  src={company.logoUrl} 
                  alt="Logo" 
                  className="w-full h-full object-contain p-2" 
                  crossOrigin="anonymous"
                />
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
            <p className="text-sm font-black text-slate-900 mb-1 uppercase">Orden de Trabajo</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{workOrder.id}</p>
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
              <p className="text-sm font-bold">{client?.name || "Cliente S/I"}</p>
              <p className="text-xs text-slate-500">RUT: {client?.rut || "S/I"}</p>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3 w-3" /> {client?.address || "Dirección S/I"}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-1">Equipo / Activo</h3>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm font-bold">
                <HardHat className="h-4 w-4" />
                {asset?.name || "Equipo S/I"}
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Código: {asset?.code || "S/I"}</p>
              <p className="text-xs text-slate-500 italic">{asset?.location || "Ubicación S/I"}</p>
            </div>
          </div>
        </div>

        {/* Personnel Section */}
        <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2 flex items-center gap-2">
            <Users className="h-3 w-3" /> Equipo Responsable Asignado
          </h3>
          <div className="flex flex-wrap gap-2">
            {assignedStaff && assignedStaff.length > 0 ? (
              assignedStaff.map(s => (
                <div key={s.id} className="bg-white px-3 py-1.5 rounded-lg border shadow-sm flex flex-col">
                  <span className="text-sm font-bold">{s.name}</span>
                  <span className="text-[9px] text-muted-foreground uppercase">{s.role}</span>
                </div>
              ))
            ) : (
              <p className="text-xs italic text-blue-400">Sin personal asignado específicamente.</p>
            )}
          </div>
        </div>

        {/* AI Summary */}
        {workOrder.aiSummary && (
          <div className="mb-8 p-6 bg-slate-50 rounded-2xl border-l-4 border-slate-900">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-2">Resumen Ejecutivo (IA)</h3>
            <p className="text-sm leading-relaxed text-slate-700 italic">"{workOrder.aiSummary}"</p>
          </div>
        )}

        {/* Materials Table */}
        {partUsages && partUsages.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-1 mb-4">Materiales e Insumos Utilizados</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600">
                  <th className="p-2 text-left">Descripción del Material</th>
                  <th className="p-2 text-center">Cant.</th>
                  <th className="p-2 text-right">Unitario</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {partUsages.map((usage, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2 font-medium">{usage.partName}</td>
                    <td className="p-2 text-center">{usage.quantity}</td>
                    <td className="p-2 text-right">${usage.unitPrice.toLocaleString()}</td>
                    <td className="p-2 text-right font-bold">${(usage.quantity * usage.unitPrice).toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50">
                  <td colSpan={3} className="p-2 text-right font-black uppercase">Total Neto Materiales</td>
                  <td className="p-2 text-right font-black text-slate-900">
                    ${partUsages.reduce((acc, p) => acc + (p.quantity * p.unitPrice), 0).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Checklist */}
        <div className="mb-8">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b pb-1 mb-4">Protocolo de Trabajo Realizado</h3>
          <div className="grid grid-cols-1 gap-2">
            {workOrder.checklist && workOrder.checklist.length > 0 ? (
              workOrder.checklist.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>
                      {item.completed && <CheckCircle2 className="h-3 w-3" />}
                    </div>
                    <span className={`text-sm ${item.completed ? 'font-bold' : 'text-slate-400'}`}>{item.task}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 italic">No se registraron tareas en el protocolo.</p>
            )}
          </div>
        </div>

        {/* Signatures */}
        <div className="mt-auto pt-12">
          <div className="grid grid-cols-2 gap-12">
            <div className="text-center">
              <div className="h-24 relative border-b border-slate-300 mb-2 flex items-center justify-center">
                {workOrder.technicianSignatureUrl && (
                  <img 
                    src={workOrder.technicianSignatureUrl} 
                    alt="Firma Técnico" 
                    className="max-h-full object-contain" 
                    crossOrigin="anonymous"
                  />
                )}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase">Firma Personal Responsable</p>
              <p className="text-[9px] font-bold text-slate-600">
                {assignedStaff.map(s => s.name).join(' / ') || "Técnicos Asignados"}
              </p>
            </div>
            <div className="text-center">
              <div className="h-24 relative border-b border-slate-300 mb-2 flex items-center justify-center">
                {workOrder.clientSignatureUrl && (
                  <img 
                    src={workOrder.clientSignatureUrl} 
                    alt="Firma Cliente" 
                    className="max-h-full object-contain" 
                    crossOrigin="anonymous"
                  />
                )}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase">Firma Cliente (Recepción)</p>
              <p className="text-xs font-bold">{client?.contactName || "Recepción Conforme"}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center border-t pt-4">
          <p className="text-[8px] text-slate-300 font-bold uppercase tracking-[0.2em]">
            Documento generado por PCGMANTENIMIENTO ERP - Propiedad de {company?.name || "Plataforma Central"}
          </p>
        </div>
      </div>
    );
  }
);

WorkOrderReport.displayName = "WorkOrderReport";
