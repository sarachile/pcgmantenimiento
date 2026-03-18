"use client";

import { useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Building2, 
  Users, 
  ArrowLeft,
  Loader2,
  ChevronRight,
  Globe,
  Activity,
  Zap,
  ShieldCheck,
  LayoutDashboard,
  LogOut,
  Droplets,
  Waves,
  ArrowUpRight,
  Server,
  KeyRound,
  Wifi
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth } from "@/firebase";
import { collection, query, limit, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Company, User } from "@/lib/types";

export default function SuperadminDashboardPage() {
  const { isSuperAdmin, isLoading: isAuthLoading, isAuthenticated } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || !isSuperAdmin)) {
      router.push("/auth/login");
    }
  }, [isAuthLoading, isSuperAdmin, isAuthenticated, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/auth/login");
  };

  const companiesQuery = useMemoFirebase(() => {
    if (!db || !isSuperAdmin) return null;
    return query(collection(db, "companies"), orderBy("createdAt", "desc"), limit(10));
  }, [db, isSuperAdmin]);

  const { data: companies, isLoading: isCompaniesLoading } = useCollection<Company>(companiesQuery);

  const stats = useMemo(() => {
    const totalCompanies = companies?.length || 0;
    const activeTenants = (companies || []).filter(c => c.isActive).length;
    return { totalCompanies, activeTenants };
  }, [companies]);

  if (isAuthLoading || !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Accediendo a Control Maestro...</p>
        </div>
      </div>
    );
  }

  const platformStats = [
    { label: "Empresas Registradas", value: stats.totalCompanies, icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Tenants Activos", value: stats.activeTenants, icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Nivel de Servicio", value: "SLA 99.9%", icon: ShieldCheck, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Estado Infra", value: "Online", icon: Globe, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-900/20"><Globe className="text-white h-6 w-6" /></div>
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 italic uppercase">Control Maestro</h2>
          </div>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest pl-1">Gestión de Ecosistema SaaS</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleLogout} variant="ghost" className="rounded-2xl font-black uppercase text-[10px] h-12 px-6 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
            <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {platformStats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm rounded-[2rem] overflow-hidden group hover:shadow-md transition-all bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</CardTitle>
              <div className={cn("p-2.5 rounded-2xl transition-transform group-hover:rotate-12", stat.bg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden group hover:shadow-2xl transition-all">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-5">
              <div className="md:col-span-2 bg-slate-900 p-8 flex flex-col justify-center items-center text-center space-y-4">
                <div className="bg-white/10 p-4 rounded-3xl"><Building2 className="h-10 w-10 text-white" /></div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Gestión de Empresas</h3>
              </div>
              <div className="md:col-span-3 p-8 flex flex-col justify-center space-y-4">
                <p className="text-sm text-slate-500 font-medium">Control de Tenants, asignación de planes Business/Enterprise y monitoreo de suscripciones.</p>
                <Button asChild className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 font-black uppercase tracking-widest text-[10px] gap-2">
                  <Link href="/admin/companies">Configurar Clientes SaaS <ArrowUpRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden group hover:shadow-2xl transition-all">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-5">
              <div className="md:col-span-2 bg-blue-600 p-8 flex flex-col justify-center items-center text-center space-y-4">
                <div className="bg-white/20 p-4 rounded-3xl"><Droplets className="h-10 w-10 text-white" /></div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Gestión Agua IoT</h3>
              </div>
              <div className="md:col-span-3 p-8 flex flex-col justify-center space-y-4">
                <p className="text-sm text-slate-500 font-medium">Alta de Administradores de Edificio, envío de PINs y telemetría de medidores inteligentes.</p>
                <Button asChild className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest text-[10px] gap-2">
                  <Link href="/admin/water">Monitor Hídrico Maestro <ArrowUpRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b p-8">
            <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
              <Building2 className="h-6 w-6 text-blue-600" /> Tenants SaaS Recientes
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase text-slate-400">Últimas empresas incorporadas al ecosistema</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isCompaniesLoading ? (
              <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600/20" /></div>
            ) : (
              <div className="divide-y">
                {(companies || []).map((company) => {
                  return (
                    <div key={company.id} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-50 p-3 rounded-2xl group-hover:bg-blue-100 transition-colors">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 uppercase">{company.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">ID: {company.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={cn(
                            "text-[9px] font-black uppercase",
                            company.currentPlan === 'enterprise' ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"
                          )}>
                            {company.currentPlan}
                          </Badge>
                          <Button variant="ghost" size="icon" asChild className="rounded-xl"><Link href="/admin/companies"><ChevronRight className="h-4 w-4" /></Link></Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(!companies || companies.length === 0) && (
                  <div className="py-20 text-center text-slate-400 italic text-sm">No hay empresas registradas aún.</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute -right-10 -bottom-10 opacity-10"><Zap className="h-48 w-48 text-blue-400" /></div>
          <CardHeader className="border-b border-white/5 p-8">
            <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
              <Activity className="h-6 w-6 text-blue-400" /> Monitor de Infraestructura
            </CardTitle>
            <CardDescription className="text-slate-400 text-[10px] font-bold uppercase">Estado de servicios críticos en tiempo real</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-4">
            <div className="bg-white/5 p-5 rounded-[1.5rem] border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-colors">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase text-blue-400 tracking-widest flex items-center gap-2">
                  <Server className="h-3 w-3" /> Core Backend
                </p>
                <p className="text-sm font-black uppercase">Firestore Multi-Region</p>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-black text-[8px]">OPERACIONAL</Badge>
            </div>

            <div className="bg-white/5 p-5 rounded-[1.5rem] border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-colors">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2">
                  <Globe className="h-3 w-3" /> Public API Gateway
                </p>
                <p className="text-sm font-black uppercase">Ingesta IoT & Telemetría</p>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-black text-[8px]">ONLINE (V1)</Badge>
            </div>

            <div className="bg-white/5 p-5 rounded-[1.5rem] border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-colors">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase text-amber-400 tracking-widest flex items-center gap-2">
                  <Zap className="h-3 w-3" /> External Integrations
                </p>
                <p className="text-sm font-black uppercase">SimpleAPI & SMTP Relay</p>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-black text-[8px]">CONECTADO</Badge>
            </div>

            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-500">
                  <KeyRound className="h-3 w-3" /> Auth: Bearer / API-Key
                </div>
                <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-500">
                  <Wifi className="h-3 w-3" /> Latency: 42ms
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
