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
  AlertTriangle,
  Waves,
  Gauge,
  History,
  ExternalLink
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
    { id: "vibracion", label: "Vibración", icon: Activity, color: "text-indigo-500" },
    { id: "presion", label: "Presión", icon: Waves, color: "text-cyan-500" },
  ];

  if (isAuthLoading || isAssetsLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full h-12 w-12"><Link href="/dashboard"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <h2 className="text-4xl font-black tracking-tighter italic uppercase">Monitor Estratégico IoT</h2>
            <p className="text-muted-foreground text-sm font-bold uppercase">Control de Rendimiento Preventivo</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-white p-1.5 h-16 rounded-[1.5rem] border shadow-sm flex overflow-x-auto gap-1">
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} className="rounded-xl px-6 font-black uppercase text-[10px] data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <cat.icon className={cn("h-4 w-4 mr-2", activeTab === cat.id ? "text-white" : cat.color)} />
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab}>
          {filteredAssets.length === 0 ? (
            <div className="p-20 text-center border-2 border-dashed rounded-[3rem] bg-slate-50 opacity-40 italic">Sin activos en esta categoría.</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAssets.map((asset) => (
                <Card key={asset.id} className={cn("rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white", asset.maintenanceRequired && "ring-2 ring-amber-500")}>
                  <CardHeader className="p-8 pb-4 border-b bg-slate-50/50">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <Badge className="text-[8px] font-black uppercase">{asset.iotType}</Badge>
                        <CardTitle className="text-xl font-black uppercase italic truncate">{asset.name}</CardTitle>
                        <p className="text-[10px] text-slate-400 font-bold uppercase"><Building2 className="h-3 w-3 inline mr-1" /> {asset.location}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative">
                      <div className="absolute right-4 top-4 opacity-10"><Zap className="h-12 w-12" /></div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-1">Lectura Live</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black italic">{asset.lastValue || '0.0'}</span>
                        <span className="text-xl font-bold opacity-50">{asset.unit}</span>
                      </div>
                    </div>
                    {asset.maintenanceRequired && (
                      <div className="bg-amber-50 p-4 rounded-2xl flex gap-3 border border-amber-100">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                        <p className="text-[11px] text-amber-800 font-medium">"{asset.maintenanceReason}"</p>
                      </div>
                    )}
                    <Button variant="ghost" className="w-full h-10 rounded-xl font-bold text-[10px] uppercase" asChild><Link href="/assets">Ver Detalle Técnico <ExternalLink className="h-3 w-3 ml-2" /></Link></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
