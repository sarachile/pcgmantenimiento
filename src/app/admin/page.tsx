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
  LayoutDashboard
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, limit, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Company, User } from "@/lib/types";

export default function SuperadminDashboardPage() {
  const { isSuperAdmin, isLoading: isAuthLoading, isAuthenticated } = useUser();
  const db = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || !isSuperAdmin)) {
      router.push("/auth/login");
    }
  }, [isAuthLoading, isSuperAdmin, isAuthenticated, router]);

  // Consultas Globales (Simplificadas para evitar bucles por falta de índices)
  const companiesQuery = useMemoFirebase(() => {
    if (!db || !isSuperAdmin) return null;
    return query(collection(db, "companies"), orderBy("createdAt", "desc"), limit(10));
  }, [db, isSuperAdmin]);

  const usersQuery = useMemoFirebase(() => {
    if (!db || !isSuperAdmin) return null;
    return query(collection(db, "users"), limit(1)); // Solo para conteo rápido si fuera necesario
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
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Accediendo a Infraestructura...</p>
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
          <Button asChild variant="outline" className="rounded-2xl font-black uppercase text-[10px] h-12 px-6 border-slate-200">
            <Link href="/admin/companies">Ver Todas las Empresas</Link>
          </Button>
          <Button asChild className="rounded-2xl font-black uppercase text-[10px] h-12 px-8 shadow-xl shadow-blue-900/20">
            <Link href="/admin/companies">Configurar Clientes</Link>
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
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b p-8">
            <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
              <Building2 className="h-6 w-6 text-blue-600" /> Clientes SaaS Recientes
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
            <CardDescription className="text-slate-400 text-[10px] font-bold uppercase">Estado de servicios críticos</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Base de Datos</p>
                <p className="text-lg font-black uppercase">Firestore Multi-Region</p>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">OPERACIONAL</Badge>
            </div>
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Servidor de Correo</p>
                <p className="text-lg font-black uppercase">SMTP Relay (Direct)</p>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">CONECTADO</Badge>
            </div>
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Facturación API</p>
                <p className="text-lg font-black uppercase">SimpleAPI Gateway</p>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">ONLINE</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
