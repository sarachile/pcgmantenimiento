
"use client";

import { useMemo, useEffect, useState } from "react";
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
  Wifi,
  Database,
  LayoutGrid,
  List,
  MoreHorizontal,
  UserCog,
  Home
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Company, User, Community } from "@/lib/types";

// Componente auxiliar para obtener el conteo de comunidades de un administrador
function CommunityCount({ adminId }: { adminId: string }) {
  const db = useFirestore();
  const communitiesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, "companies", adminId, "communities");
  }, [db, adminId]);

  const { data: communities, isLoading } = useCollection<Community>(communitiesQuery);

  if (isLoading) return <Loader2 className="h-3 w-3 animate-spin text-slate-300" />;
  
  return (
    <span className="font-black text-slate-900">{communities?.length || 0}</span>
  );
}

export default function SuperadminDashboardPage() {
  const { isSuperAdmin, isLoading: isAuthLoading, isAuthenticated } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || !isSuperAdmin)) {
      router.push("/auth/login");
    }
  }, [isAuthLoading, isSuperAdmin, isAuthenticated, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/auth/login");
  };

  const administratorsQuery = useMemoFirebase(() => {
    if (!db || !isSuperAdmin) return null;
    return query(collection(db, "companies"), orderBy("createdAt", "desc"));
  }, [db, isSuperAdmin]);

  const { data: administrators, isLoading: isAdminsLoading } = useCollection<Company>(administratorsQuery);

  const stats = useMemo(() => {
    const totalAdmins = administrators?.length || 0;
    const activeAdmins = (administrators || []).filter(c => c.isActive).length;
    return { totalAdmins, activeAdmins };
  }, [administrators]);

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
    { label: "Administradores Registrados", value: stats.totalAdmins, icon: UserCog, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Administradores Activos", value: stats.activeAdmins, icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50" },
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
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest pl-1">Gestión de Ecosistema SaaS GENKO</p>
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

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Cartera de Administradores</h3>
            <p className="text-[10px] font-bold uppercase text-slate-400">Control de gestión y comunidades asociadas</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border">
            <Button 
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
              size="sm" 
              className={cn("h-9 px-3 rounded-lg font-black uppercase text-[9px] gap-2", viewMode === 'grid' && "bg-white shadow-sm")}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Tarjetas
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
              size="sm" 
              className={cn("h-9 px-3 rounded-lg font-black uppercase text-[9px] gap-2", viewMode === 'list' && "bg-white shadow-sm")}
              onClick={() => setViewMode('list')}
            >
              <List className="h-3.5 w-3.5" /> Listado
            </Button>
          </div>
        </div>

        {isAdminsLoading ? (
          <div className="py-20 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-600/20" /></div>
        ) : administrators && administrators.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {administrators.map((admin) => (
                <Card key={admin.id} className="rounded-[2.5rem] border-none shadow-sm hover:shadow-xl transition-all bg-white overflow-hidden group">
                  <CardHeader className="p-8 pb-4">
                    <div className="flex justify-between items-start">
                      <div className={cn(
                        "p-4 rounded-3xl transition-transform group-hover:scale-110",
                        admin.isActive ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"
                      )}>
                        <UserCog className="h-8 w-8" />
                      </div>
                      <Badge variant="outline" className={cn(
                        "text-[9px] font-black uppercase border-none px-3 py-1",
                        admin.currentPlan === 'enterprise' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                      )}>
                        Plan {admin.currentPlan}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 pt-0 space-y-6">
                    <div>
                      <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter truncate">Admin: {admin.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {admin.id}</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Home className="h-3.5 w-3.5 text-blue-600" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comunidades</span>
                      </div>
                      <div className="text-sm">
                        <CommunityCount adminId={admin.id} />
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full", admin.isActive ? "bg-emerald-500" : "bg-rose-500")} />
                        <span className="text-[10px] font-black uppercase text-slate-500">{admin.isActive ? 'Operativo' : 'Suspendido'}</span>
                      </div>
                      <Button variant="ghost" size="icon" asChild className="rounded-xl h-10 w-10">
                        <Link href="/admin/companies"><ArrowUpRight className="h-5 w-5 text-blue-600" /></Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardContent className="p-0">
                <div className="divide-y">
                  {administrators.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-50 p-3 rounded-2xl group-hover:bg-blue-100 transition-colors">
                          <UserCog className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 uppercase">Administrador: {admin.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">ID: {admin.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Comunidades</p>
                            <div className="text-xs">
                              <CommunityCount adminId={admin.id} />
                            </div>
                          </div>
                          <Badge variant="outline" className={cn(
                            "text-[9px] font-black uppercase",
                            admin.currentPlan === 'enterprise' ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"
                          )}>
                            {admin.currentPlan}
                          </Badge>
                          <Button variant="ghost" size="icon" asChild className="rounded-xl"><Link href="/admin/companies"><ChevronRight className="h-4 w-4" /></Link></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          <div className="py-20 text-center text-slate-400 italic text-sm">No hay administradores registrados aún.</div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="rounded-[3rem] border-none shadow-xl bg-slate-900 text-white overflow-hidden group hover:shadow-2xl transition-all">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-5 h-full">
              <div className="md:col-span-2 bg-slate-800 p-8 flex flex-col justify-center items-center text-center space-y-4">
                <div className="bg-white/10 p-4 rounded-3xl"><UserCog className="h-10 w-10 text-white" /></div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Gestión de Administradores</h3>
              </div>
              <div className="md:col-span-3 p-8 flex flex-col justify-center space-y-4">
                <p className="text-sm text-slate-400 font-medium">Control total de Administradores, gestión de sus comunidades asignadas y monitoreo de suscripciones.</p>
                <Button asChild className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 font-black uppercase tracking-widest text-[10px] gap-2">
                  <Link href="/admin/companies">Configurar Clientes SaaS <ArrowUpRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[3rem] border-none shadow-xl bg-blue-600 text-white overflow-hidden group hover:shadow-2xl transition-all">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-5 h-full">
              <div className="md:col-span-2 bg-blue-700 p-8 flex flex-col justify-center items-center text-center space-y-4">
                <div className="bg-white/20 p-4 rounded-3xl"><Droplets className="h-10 w-10 text-white" /></div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Gestión Agua IoT</h3>
              </div>
              <div className="md:col-span-3 p-8 flex flex-col justify-center space-y-4">
                <p className="text-sm text-blue-100 font-medium">Monitoreo granular de telemetría por comunidad y control de medidores inteligentes.</p>
                <Button asChild className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 font-black uppercase tracking-widest text-[10px] gap-2">
                  <Link href="/admin/water">Monitor Hídrico Maestro <ArrowUpRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
