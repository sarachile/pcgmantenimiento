
"use client";

import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Building2, Receipt, Droplets, Globe, ShieldCheck, Scale } from "lucide-react";

interface BillingRow {
  id: string;
  unit: string;
  previous: number;
  current: number;
  consumption: number;
  cost: number;
  isInfrastructure: boolean;
}

interface MonthlyBillingReportProps {
  communityName: string;
  data: BillingRow[];
  period: string;
  forwardedRef?: React.Ref<HTMLDivElement>;
}

export const MonthlyBillingReport: React.FC<MonthlyBillingReportProps> = ({ 
  communityName, 
  data, 
  period,
  forwardedRef
}) => {
  const today = format(new Date(), "dd 'de' MMMM, yyyy", { locale: es });
  const residentialData = data.filter(d => !d.isInfrastructure);
  const infrastructureData = data.filter(d => d.isInfrastructure);
  
  const totalConsumption = residentialData.reduce((acc, d) => acc + d.consumption, 0);
  const totalCost = residentialData.reduce((acc, d) => acc + d.cost, 0);

  return (
    <div 
      ref={forwardedRef} 
      className="bg-white p-12 text-slate-900 w-[850px] mx-auto shadow-none flex flex-col" 
      id="monthly-billing-report" 
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Header Corporativo */}
      <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-8">
        <div className="flex gap-4 items-center">
          <div className="bg-slate-900 p-4 rounded-2xl">
            <Building2 className="text-white h-10 w-10" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase text-slate-900 leading-none mb-1">GENKO Hídrica</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Gestión Inteligente de Recursos</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Liquidación de Consumo</p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">{period}</p>
        </div>
      </div>

      <div className="space-y-10">
        {/* Información General */}
        <div className="grid grid-cols-2 gap-10">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-slate-400 border-b pb-2 tracking-widest flex items-center gap-2">
              <Globe className="h-4 w-4" /> Datos del Recinto
            </h3>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <p className="text-lg font-black text-slate-900 uppercase italic">{communityName}</p>
              <p className="text-xs font-bold text-slate-500 uppercase mt-1 tracking-tight">Auditoría de Lecturas NB-IoT</p>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-slate-400 border-b pb-2 tracking-widest flex items-center gap-2">
              <Scale className="h-4 w-4" /> Resumen del Período
            </h3>
            <div className="bg-blue-600 text-white p-6 rounded-2xl flex justify-between items-center shadow-lg">
              <div>
                <p className="text-[9px] font-black uppercase text-blue-100">Consumo Total</p>
                <p className="text-2xl font-black italic">{totalConsumption.toFixed(2)} m³</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black uppercase text-blue-100">Monto Liquidado</p>
                <p className="text-2xl font-black italic">$ {totalCost.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de Lecturas Residenciales */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase text-slate-400 border-b pb-2 tracking-widest flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-600" /> Detalle de Unidades Habitacionales
          </h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-3 text-[9px] font-black uppercase text-slate-600 rounded-tl-xl">Unidad</th>
                <th className="p-3 text-[9px] font-black uppercase text-slate-600">Lect. Anterior</th>
                <th className="p-3 text-[9px] font-black uppercase text-slate-600">Lect. Actual</th>
                <th className="p-3 text-[9px] font-black uppercase text-slate-600">Consumo (m³)</th>
                <th className="p-3 text-[9px] font-black uppercase text-slate-600 text-right rounded-tr-xl">Total ($)</th>
              </tr>
            </thead>
            <tbody className="text-[11px]">
              {residentialData.map((row, i) => (
                <tr key={row.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="p-3 font-black text-slate-900 border-b border-slate-100">{row.unit}</td>
                  <td className="p-3 font-mono text-slate-400 border-b border-slate-100">{row.previous.toFixed(3)}</td>
                  <td className="p-3 font-mono text-slate-900 font-bold border-b border-slate-100">{row.current.toFixed(3)}</td>
                  <td className="p-3 border-b border-slate-100">
                    <span className="font-black text-blue-600">{row.consumption.toFixed(3)}</span>
                  </td>
                  <td className="p-3 text-right font-black text-slate-900 border-b border-slate-100">
                    $ {row.cost.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Firma y Sello */}
        <div className="mt-auto pt-12 border-t-2 border-slate-100 flex justify-between items-end">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 p-2 rounded-lg"><ShieldCheck className="text-white h-6 w-6" /></div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Certificación de Lectura Digital</p>
                <p className="text-[8px] font-mono text-slate-400 uppercase">Respaldo Inalterable vía NB-IoT GENKO</p>
              </div>
            </div>
            <p className="text-[9px] text-slate-400 italic">Generado el {today}, a las {format(new Date(), "HH:mm")} hrs.</p>
          </div>
          
          <div className="text-center w-48 border-t-2 border-slate-900 pt-2">
            <p className="text-[10px] font-black text-slate-900 uppercase">Firma Administración</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase">{communityName}</p>
          </div>
        </div>
      </div>

      <div className="mt-10 text-center opacity-30">
        <p className="text-[8px] font-black uppercase tracking-[0.5em]">PCGMANTENIMIENTO ERP - SISTEMA DE AUDITORÍA HÍDRICA</p>
      </div>
    </div>
  );
};
