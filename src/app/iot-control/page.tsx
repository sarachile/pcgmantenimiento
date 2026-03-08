
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Cpu, 
  Sun, 
  Thermometer, 
  Activity, 
  ArrowLeft, 
  Loader2, 
  Zap, 
  Building2, 
  HardHat, 
  AlertTriangle,
  Waves,
  Gauge,
  History,
  ExternalLink
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Asset, Client } from "@/lib/types";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function IotControlPanelPage() {
  const { profile, isLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const [activeTab, setActiveTab] = useState("all");

  const companyId = profile?.companyId || "";

  // Consultas Reales
  const assetsQuery = useMemoFirebase(() => 
    db && companyId ? query(collection(db, "companies", companyId, "assets"), where("isIoT", "==", true)) : null, 
    [db, companyId]
  );
  
  const clientsQuery = useMemoFirebase(() => 
    db && companyId ? collection(db, "companies", companyId, "clients") : null, 
    [db, companyId]
  );

  const { data: iotAssets, isLoading: isAssetsLoading } = useCollection<Asset>(assetsQuery);
  const { data: clients } = useCollection<Client>(clientsQuery);

  const filteredAssets = useMemo(() => {
    if (!iotAssets) return [];
    if (activeTab === "all") return iotAssets;
    return iotAssets.filter(a => a.iotType === activeTab);
  }, [iotAssets, activeTab]);

  const categories = [
    { id: "all", label: "Vista Global", icon: Gauge, color: "text-blue-600" },
    { id: "solar", label: "Energía Solar", icon: Sun, color: "text-amber-500" },
    { id: "temperatura", label: "Temperatura", icon: Thermometer, color: "text-rose-500" },
    { id: "vibracion", label: "Vibración / Motores", icon: Activity, color: "text-indigo-500" },
    { id: "presion", label: "Presión / Fluidos", icon: Waves, color: "text-cyan-500" },
  ];

  if (isAuthLoading || isAssetsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Escaneando Red IoT...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full h-12 w-12">
            <Link href="/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 italic uppercase">Monitor Estratégico IoT</h2>
            <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">Panel de Rendimiento y Alertas Preventivas</p>
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 px-6 py-3 rounded-2xl flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-xs font-black text-emerald-700 uppercase tracking-widest">Gateway Operativo</p>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-white p-1.5 h-16 rounded-[1.5rem] border shadow-sm w-full sm:w-auto flex overflow-x-auto gap-1">
          {categories.map((cat) => (
            <TabsTrigger 
              key={cat.id} 
              value={cat.id} 
              className="rounded-xl px-6 font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
            >
              <cat.icon className={cn("h-4 w-4", activeTab === cat.id ? "text-white" : cat.color)} />
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="animate-in fade-in duration-500">
          {filteredAssets.length === 0 ? (
            <Card className="rounded-[3rem] border-2 border-dashed border-slate-200 p-20 text-center space-y-6 bg-slate-50/50">
              <Cpu className="h-16 w-16 mx-auto text-slate-300" />
              <div className="space-y-2">
                <h3 className="text-xl font-black italic uppercase">Sin activos detectados</h3>
                <p className="text-slate-400 text-sm font-medium max-w-xs mx-auto">
                  No hay equipos con sensores configurados en la categoría <strong>{activeTab.toUpperCase()}</strong>.
                </p>
              </div>
              <Button asChild variant="outline" className="rounded-xl font-bold border-primary/20 text-primary">
                <Link href="/company">Ver Guía de Integración API</Link>
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAssets.map((asset) => {
                const client = clients?.find(c => c.id === asset.companyId); // Note: Should match client associated with asset
                return (
                  <Card key={asset.id} className={cn(
                    "rounded-[2.5rem] border-none shadow-xl overflow-hidden group transition-all hover:shadow-2xl",
                    asset.maintenanceRequired ? "ring-2 ring-amber-500 bg-amber-50/10" : "bg-white"
                  )}>
                    <CardHeader className={cn(
                      "p-8 pb-4 border-b",
                      asset.maintenanceRequired ? "bg-amber-100/50" : "bg-slate-50/50"
                    )}>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className={cn(
                              "text-[8px] font-black uppercase tracking-widest",
                              asset.iotType === 'solar' ? "bg-amber-500" :
                              asset.iotType === 'temperatura' ? "bg-rose-500" :
                              asset.iotType === 'vibracion' ? "bg-indigo-500" : "bg-blue-500"
                            )}>
                              {asset.iotType}
                            </Badge>
                            {asset.maintenanceRequired && (
                              <Badge className="bg-amber-600 text-white animate-pulse">ALERTA MANTENCIÓN</Badge>
                            )}
                          </div>
                          <CardTitle className="text-xl font-black italic tracking-tighter uppercase truncate">{asset.name}</CardTitle>
                          <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                            <Building2 className="h-3 w-3" /> CLIENTE: {asset.location}
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform">
                          {asset.iotType === 'solar' && <Sun className="h-6 w-6 text-amber-500" />}
                          {asset.iotType === 'temperatura' && <Thermometer className="h-6 w-6 text-rose-500" />}
                          {asset.iotType === 'vibracion' && <Activity className="h-6 w-6 text-indigo-500" />}
                          {!['solar', 'temperatura', 'vibracion'].includes(asset.iotType || '') && <Cpu className="h-6 w-6 text-slate-400" />}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                      <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Zap className="h-16 w-16" /></div>
                        <div className="relative z-10">
                          <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-1">Lectura en Tiempo Real</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black italic tracking-tighter">{asset.lastValue || '0.0'}</span>
                            <span className="text-xl font-bold opacity-50">{asset.unit || ''}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs font-bold uppercase">
                          <span className="text-slate-400 tracking-widest">Eficiencia Operativa</span>
                          <span className={cn(asset.maintenanceRequired ? "text-amber-600" : "text-emerald-600")}>
                            {asset.maintenanceRequired ? '82%' : '98.4%'}
                          </span>
                        </div>
                        <Progress value={asset.maintenanceRequired ? 82 : 98} className="h-1.5 bg-slate-100" />
                      </div>

                      {asset.maintenanceRequired && (
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3">
                          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-amber-900 uppercase">Diagnóstico Remoto</p>
                            <p className="text-[11px] text-amber-800 leading-relaxed font-medium">"{asset.maintenanceReason || 'Parámetro fuera de rango detectado.'}"</p>
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase">
                          <History className="h-3 w-3" /> Última lectura: Hace 2 min
                        </div>
                        <Button variant="ghost" size="sm" asChild className="h-8 rounded-lg text-[9px] font-black uppercase gap-1.5 hover:bg-slate-100">
                          <Link href={`/assets`}>Ver Histórico <ExternalLink className="h-2.5 w-2.5" /></Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
