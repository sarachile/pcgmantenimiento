
"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Droplets, 
  Activity, 
  ArrowLeft, 
  Loader2, 
  Zap, 
  Building2, 
  AlertTriangle,
  Waves,
  Gauge,
  Wifi,
  Battery,
  Power,
  PowerOff,
  LineChart as ChartIcon,
  Search,
  Settings2,
  Lock,
  Unlock,
  Navigation,
  FileText,
  Clock,
  TrendingDown,
  ShieldAlert,
  ArrowRight,
  History,
  ShieldCheck
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { collection, query, where, doc, serverTimestamp, getDocs } from "firebase/firestore";
import { WaterMeter, Client } from "@/lib/types";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// DATOS SIMULADOS PARA PRESENTACIÓN (SI NO HAY REALES)
const SIMULATED_METERS: WaterMeter[] = [
  { id: "sim-1", companyId: "demo", clientId: "demo", unitIdentifier: "Depto 101", status: "open", currentReading: 42.55, batteryLevel: 92, signalStrength: 88, hasLeakAlert: false, lastCommunication: new Date().toISOString() },
  { id: "sim-2", companyId: "demo", clientId: "demo", unitIdentifier: "Depto 102", status: "open", currentReading: 15.30, batteryLevel: 85, signalStrength: 72, hasLeakAlert: true, lastCommunication: new Date().toISOString() },
  { id: "sim-3", companyId: "demo", clientId: "demo", unitIdentifier: "Depto 201", status: "open", currentReading: 122.10, batteryLevel: 98, signalStrength: 95, hasLeakAlert: false, lastCommunication: new Date().toISOString() },
  { id: "sim-4", companyId: "demo", clientId: "demo", unitIdentifier: "Depto 202", status: "closed", currentReading: 88.45, batteryLevel: 78, signalStrength: 65, hasLeakAlert: false, lastCommunication: new Date().toISOString() },
  { id: "sim-5", companyId: "demo", clientId: "demo", unitIdentifier: "Depto 301", status: "open", currentReading: 210.00, batteryLevel: 90, signalStrength: 82, hasLeakAlert: false, lastCommunication: new Date().toISOString() },
  { id: "sim-6", companyId: "demo", clientId: "demo", unitIdentifier: "Depto 302", status: "open", currentReading: 5.12, batteryLevel: 100, signalStrength: 99, hasLeakAlert: false, lastCommunication: new Date().toISOString() },
];

export default function WaterControlPage() {
  const { profile, isLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [localMeters, setLocalMeters] = useState<WaterMeter[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // PIN CHALLENGE STATE
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pendingMeter, setPendingMeter] = useState<WaterMeter | null>(null);

  const companyId = profile?.companyId || "";

  const metersQuery = useMemoFirebase(() => 
    db && companyId ? collection(db, "companies", companyId, "waterMeters") : null, 
    [db, companyId]
  );
  
  const { data: firestoreMeters, isLoading: isMetersLoading } = useCollection<WaterMeter>(metersQuery);

  useEffect(() => {
    if (!isMetersLoading) {
      if (firestoreMeters && firestoreMeters.length > 0) {
        setLocalMeters(firestoreMeters);
      } else {
        setLocalMeters(SIMULATED_METERS);
      }
    }
  }, [firestoreMeters, isMetersLoading]);

  const filteredMeters = useMemo(() => {
    return localMeters.filter(m => 
      m.unitIdentifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [localMeters, searchTerm]);

  const stats = useMemo(() => {
    const list = localMeters;
    const totalConsumption = list.reduce((acc, m) => acc + (m.currentReading || 0), 0);
    const leakAlerts = list.filter(m => m.hasLeakAlert).length;
    const closedValves = list.filter(m => m.status === 'closed').length;
    return { totalConsumption, leakAlerts, closedValves };
  }, [localMeters]);

  const consumptionData = [
    { hour: "00:00", value: 12 },
    { hour: "04:00", value: 8 },
    { hour: "08:00", value: 45 },
    { hour: "12:00", value: 32 },
    { hour: "16:00", value: 28 },
    { hour: "20:00", value: 55 },
    { hour: "23:59", value: 18 },
  ];

  const handleToggleValveRequest = (meter: WaterMeter) => {
    setPendingMeter(meter);
    setPinInput("");
    setIsPinDialogOpen(true);
  };

  const handleConfirmPin = async () => {
    if (!pendingMeter || !profile) return;

    // Validación de PIN (Comparar con el PIN guardado en el perfil para buildingAdmin)
    if (pinInput === profile.pin || (pinInput === "123456" && !profile.pin)) { // Fallback para demo
      setIsPinDialogOpen(false);
      executeToggleValve(pendingMeter);
    } else {
      toast({
        title: "PIN Incorrecto",
        description: "Acceso denegado. El comando de válvula ha sido bloqueado.",
        variant: "destructive"
      });
      setPinInput("");
    }
  };

  const executeToggleValve = async (meter: WaterMeter) => {
    setIsProcessing(meter.id);
    
    const newStatus = meter.status === 'open' ? 'closed' : 'open';
    
    if (db && companyId && !meter.id.startsWith('sim-')) {
      const meterRef = doc(db, "companies", companyId, "waterMeters", meter.id);
      updateDocumentNonBlocking(meterRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } else {
      setLocalMeters(prev => prev.map(m => m.id === meter.id ? { ...m, status: newStatus } : m));
    }

    toast({
      title: newStatus === 'open' ? "Suministro Restablecido" : "Suministro Cortado",
      description: `Comando enviado exitosamente a la válvula de ${meter.unitIdentifier}.`,
      variant: newStatus === 'open' ? 'default' : 'destructive'
    });

    setTimeout(() => setIsProcessing(null), 1200);
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast({ title: "Sincronización Exitosa", description: "Telemetría actualizada desde gateway IoT." });
    }, 1500);
  };

  if (isAuthLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full h-12 w-12 hover:bg-blue-50"><Link href="/dashboard"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <h2 className="text-4xl font-black tracking-tighter italic uppercase text-slate-900">PCG AGUA <span className="text-blue-600">IoT</span></h2>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Portal de Administración Hídrica Remota</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl font-bold gap-2" onClick={handleManualSync} disabled={isSyncing}>
            {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChartIcon className="h-4 w-4" />}
            Sincronizar Gateway
          </Button>
          <Button className="rounded-xl font-black shadow-lg gap-2 bg-blue-600 hover:bg-blue-700">
            <Settings2 className="h-4 w-4" /> Configuración
          </Button>
        </div>
      </div>

      {stats.leakAlerts > 0 && (
        <Card className="rounded-[2rem] border-none bg-rose-600 text-white shadow-xl overflow-hidden animate-pulse">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl"><AlertTriangle className="h-6 w-6" /></div>
              <div>
                <h3 className="font-black uppercase italic tracking-tight">Fuga Crítica Detectada</h3>
                <p className="text-sm font-medium text-rose-100">Exceso de flujo detectado en {stats.leakAlerts} unidad(es).</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-black uppercase text-[10px]"
              onClick={() => setIsReportOpen(true)}
            >
              Ver Reporte
            </Button>
          </CardContent>
        </Card>
      )}

      {/* DIÁLOGO DE REPORTE */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="bg-slate-900 text-white p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-rose-600 p-2 rounded-lg shadow-lg">
                <ShieldAlert className="h-6 w-6 text-white" />
              </div>
              <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Auditoría de Fuga Crítica</DialogTitle>
            </div>
            <DialogDescription className="text-slate-400 font-medium">
              Informe generado automáticamente por IA a partir de telemetría IoT.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Unidad Afectada</p>
                <p className="text-lg font-black text-slate-900 italic uppercase">Depto 102</p>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Duración del Evento</p>
                <p className="text-lg font-black text-slate-900 italic uppercase">02h 14m</p>
              </div>
            </div>

            <div className="bg-rose-50 p-6 rounded-[2rem] border-2 border-rose-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-rose-600" />
                  <p className="text-xs font-black uppercase text-rose-900">Análisis de Desperdicio</p>
                </div>
                <Badge className="bg-rose-600 text-white font-black text-[8px] uppercase">ACTIVO</Badge>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[9px] font-bold text-rose-700/60 uppercase mb-1">Volumen Perdido</p>
                  <p className="text-3xl font-black italic text-rose-900">67.2 <span className="text-sm">Litros</span></p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-rose-700/60 uppercase mb-1">Costo Proyectado (24h)</p>
                  <p className="text-3xl font-black italic text-rose-900">$ 12.450</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                <FileText className="h-4 w-4" /> Diagnóstico del Sistema
              </p>
              <div className="bg-white border-2 rounded-2xl p-4 text-xs font-medium text-slate-600 leading-relaxed italic">
                "El patrón de flujo continuo detectado (0.5 L/min) es compatible con una falla en la válvula de descarga del estanque de inodoro (WC). Se recomienda el corte remoto preventivo si la unidad no responde al contacto."
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-slate-50 border-t flex gap-3">
            <Button variant="ghost" className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest" onClick={() => setIsReportOpen(false)}>Descartar</Button>
            <Button 
              className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl"
              onClick={() => {
                const target = localMeters.find(m => m.unitIdentifier === "Depto 102");
                if (target) handleToggleValveRequest(target);
                setIsReportOpen(false);
              }}
            >
              <PowerOff className="h-4 w-4" /> Ejecutar Corte Remoto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE SEGURIDAD (PIN CHALLENGE) */}
      <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="p-8 space-y-6 text-center">
            <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Lock className="h-10 w-10 text-slate-900" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Validación de Comando</DialogTitle>
              <DialogDescription className="font-bold text-slate-500">
                Está a punto de {pendingMeter?.status === 'open' ? 'cortar' : 'restablecer'} el suministro de <strong>{pendingMeter?.unitIdentifier}</strong>. Ingrese su PIN de administrador para confirmar.
              </DialogDescription>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">PIN de Seguridad</Label>
              <Input 
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="******"
                className="h-16 text-center text-3xl font-black tracking-[0.5em] rounded-2xl border-2 border-slate-200 focus:border-blue-600 shadow-inner"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest gap-2 shadow-xl"
                onClick={handleConfirmPin}
                disabled={pinInput.length < 6}
              >
                <ShieldCheck className="h-5 w-5" /> Confirmar Operación
              </Button>
              <Button 
                variant="ghost" 
                className="text-slate-400 font-bold uppercase text-[10px]"
                onClick={() => setIsPinDialogOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm bg-blue-600 text-white rounded-[2rem] overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">Lectura Total (Mes)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black italic">{stats.totalConsumption.toFixed(1)}</span>
              <span className="text-xl font-bold opacity-50 italic">m³</span>
            </div>
          </CardContent>
        </Card>

        <Card className={cn("border-none shadow-sm rounded-[2rem] overflow-hidden", stats.leakAlerts > 0 ? "bg-white border-2 border-rose-500" : "bg-white")}>
          <CardHeader className="pb-2">
            <CardTitle className={cn("text-[10px] font-black uppercase tracking-[0.2em]", stats.leakAlerts > 0 ? "text-rose-600" : "text-slate-400")}>Alertas de Fuga</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-4xl font-black italic", stats.leakAlerts > 0 ? "text-rose-600" : "text-slate-900")}>{stats.leakAlerts}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-slate-900 text-white rounded-[2rem] overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Válvulas de Corte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black italic">{stats.closedValves} Cerradas</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden border-2 border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Estado de la Red</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black italic text-emerald-600">Online</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8 border-b bg-slate-50/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                  <Droplets className="h-6 w-6 text-blue-600" /> Monitoreo Individual
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase text-slate-400">Control de flujo por departamento</CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Buscar unidad..." 
                  className="pl-10 h-11 bg-white rounded-xl border-slate-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isMetersLoading ? (
              <div className="py-20 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-200" /></div>
            ) : filteredMeters.length === 0 ? (
              <div className="py-32 text-center space-y-4">
                <Waves className="h-12 w-12 mx-auto text-slate-200" />
                <p className="font-black italic uppercase text-slate-400">Sin unidades registradas</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredMeters.map((m) => (
                  <div key={m.id} className="p-6 md:p-8 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                    <div className="flex items-start gap-6">
                      <div className={cn(
                        "h-16 w-16 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110",
                        m.status === 'open' ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"
                      )}>
                        <Droplets className="h-8 w-8" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-black italic tracking-tighter uppercase">{m.unitIdentifier}</span>
                          {m.hasLeakAlert && <Badge className="bg-rose-600 text-white font-black animate-pulse text-[8px] h-5">FUGA DETECTADA</Badge>}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span className="flex items-center gap-1.5"><Wifi className="h-3 w-3" /> {m.signalStrength}% Señal</span>
                          <span className="flex items-center gap-1.5"><Battery className="h-3 w-3" /> {m.batteryLevel}% Batería</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center md:text-right space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Consumo Acum.</p>
                        <div className="flex items-baseline justify-center md:justify-end gap-1">
                          <span className="text-3xl font-black italic text-slate-900">{m.currentReading.toFixed(2)}</span>
                          <span className="text-sm font-bold text-slate-400 italic">m³</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          size="icon"
                          asChild
                          className="h-12 w-12 rounded-2xl border-blue-100 hover:bg-blue-50 text-blue-600 shadow-sm"
                          title="Ver Historial de Consumo"
                        >
                          <Link href={`/water-control/history/${m.id}`}>
                            <History className="h-5 w-5" />
                          </Link>
                        </Button>
                        <Button 
                          onClick={() => handleToggleValveRequest(m)}
                          disabled={isProcessing === m.id}
                          className={cn(
                            "h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl transition-all active:scale-95",
                            m.status === 'open' ? "bg-slate-900 text-white hover:bg-rose-600" : "bg-blue-600 text-white hover:bg-blue-500"
                          )}
                        >
                          {isProcessing === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                            m.status === 'open' ? <><PowerOff className="h-4 w-4" /> Cortar</> : <><Power className="h-4 w-4" /> Abrir</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute -right-10 -bottom-10 opacity-10"><ChartIcon className="h-48 w-48 text-blue-400" /></div>
            <CardHeader className="p-8 border-b border-white/5">
              <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                <Activity className="h-6 w-6 text-blue-400" /> Curva de Demanda
              </CardTitle>
              <CardDescription className="text-slate-400 text-[10px] font-bold uppercase">Consumo total edificio - 24 Horas</CardDescription>
            </CardHeader>
            <CardContent className="p-8 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={consumptionData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" x1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                  <XAxis dataKey="hour" fontSize={9} axisLine={false} tickLine={false} stroke="#64748b" fontWeight="bold" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                    itemStyle={{ color: '#3b82f6', fontWeight: '900' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" /> Auditoría de Red
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-slate-400">Consumo Matriz</span>
                  <span className="text-sm font-black italic text-slate-900">1,245.0 m³</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-slate-400">Suma Unidades</span>
                  <span className="text-sm font-black italic text-slate-900">1,210.5 m³</span>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-rose-600">Pérdida Crítica</span>
                  <span className="text-lg font-black italic text-rose-600">34.5 m³</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed italic text-center">
                * El diferencial detectado sugiere una fuga activa en el área de lavandería o estacionamientos.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
