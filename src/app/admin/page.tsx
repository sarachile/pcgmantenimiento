
"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Building2, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  FileCheck,
  Zap,
  ArrowLeft,
  Loader2,
  Clock,
  ChevronRight
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, limit, orderBy, collectionGroup } from "firebase/firestore";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Company, User, WorkOrder } from "@/lib/types";
import { differenceInDays, parseISO } from "date-fns";

export default function SuperadminDashboardPage() {
  const { isSuperAdmin, isLoading: isAuthLoading } = useUser();
  const db = useFirestore();

  // Redirigir si no es superadmin
  if (!isAuthLoading && !isSuperAdmin) {
    redirect("/dashboard");
  }

  // Consultas Reales
  const companiesQuery = useMemoFirebase(() => db ? collection(db, "companies") : null, [db]);
  const usersQuery = useMemoFirebase(() => db ? collection(db, "users") : null, [db]);
  const globalOrdersQuery = useMemoFirebase(() => db ? query(collectionGroup(db, "workOrders"), limit(100)) : null, [db]);

  const { data: companies, isLoading: isCompaniesLoading } = useCollection<Company>(companiesQuery);
  const { data: users, isLoading: isUsersLoading } = useCollection<User>(usersQuery);
  const { data: globalOrders, isLoading: isOrdersLoading } = useCollection<WorkOrder>(globalOrdersQuery);

  const stats = useMemo(() => {
    const totalCompanies = companies?.length || 0;
    const totalUsers = users?.length || 0;
    const totalOrders = globalOrders?.length || 0;
    
    const expiringSoon = (companies || []).filter(c => {
      if (!c.trialEndsAt) return false;
      const end = c.trialEndsAt.toDate ? c.trialEndsAt.toDate() : parseISO(c.trialEndsAt);
      const diff = differenceInDays(end, new Date());
      return diff >= 0 && diff <= 5;
    }).length;

    return { totalCompanies, totalUsers, totalOrders, expiringSoon };
  }, [companies, users, globalOrders]);

  const isLoading = isAuthLoading || isCompaniesLoading || isUsersLoading || isOrdersLoading;

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const platformStats = [
    { label: "Empresas Totales", value: stats.totalCompanies, icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Usuarios Globales", value: stats.totalUsers, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "OTs Procesadas", value: stats.totalOrders, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Trials por Vencer", value: stats.expiringSoon, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild title="Volver al dashboard operativo" className="rounded-full">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex flex-col gap-1">
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 italic uppercase">Control Maestro</h2>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Infraestructura SaaS PCGMANTENIMIENTO</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="rounded-xl font-bold">
            <Link href="/admin/companies">Gestionar Empresas</Link>
          </Button>
          <Button asChild className="rounded-xl font-black shadow-lg">
            <Link href="/admin/support">Centro de Soporte</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {platformStats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm rounded-3xl overflow-hidden group hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</CardTitle>
              <div className={cn("p-2 rounded-xl transition-transform group-hover:scale-110", stat.bg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-none shadow-sm rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-lg font-black uppercase italic tracking-tight">Actividad de Clientes Reciente</CardTitle>
            <CardDescription className="text-xs font-bold uppercase">Empresas con mayor carga operativa hoy.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {(companies || []).slice(0, 6).map((company) => {
                const companyOrders = (globalOrders || []).filter(o => o.companyId === company.id).length;
                return (
                  <div key={company.id} className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-2.5 rounded-2xl">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{company.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Plan: {company.currentPlan?.toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">{companyOrders} OTs</p>
                      <Link href="/admin/companies" className="text-[9px] font-black text-primary uppercase hover:underline">Ver Ficha</Link>
                    </div>
                  </div>
                );
              })}
              {(!companies || companies.length === 0) && (
                <div className="p-10 text-center text-slate-400 italic">No hay empresas registradas aún.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-none shadow-sm rounded-[2rem] bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute -right-10 -bottom-10 opacity-10"><Zap className="h-48 w-48 text-blue-400" /></div>
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-lg font-black uppercase italic tracking-tight flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-400" /> Monitoreo Trial
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs font-bold uppercase">Cuentas próximas a expirar.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {(companies || []).filter(c => c.trialEndsAt).slice(0, 4).map(c => {
              const end = c.trialEndsAt.toDate ? c.trialEndsAt.toDate() : parseISO(c.trialEndsAt);
              const diff = differenceInDays(end, new Date());
              return (
                <div key={c.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase truncate max-w-[150px]">{c.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">ID: {c.id}</p>
                  </div>
                  <Badge className={cn(
                    "text-[9px] font-black uppercase",
                    diff <= 3 ? "bg-rose-500" : "bg-blue-600"
                  )}>
                    {diff < 0 ? "Expirado" : `${diff} Días`}
                  </Badge>
                </div>
              );
            })}
            {(!companies || companies.length === 0) && (
              <div className="py-10 text-center text-white/20 italic text-sm">Sin periodos de prueba activos.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
