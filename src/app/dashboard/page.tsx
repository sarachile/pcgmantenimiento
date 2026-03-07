"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ClipboardList, 
  Plus, 
  Loader2, 
  AlertTriangle, 
  Activity,
  Zap,
  ChevronRight,
  Trophy,
  Check
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { isBefore, parseISO, startOfDay } from "date-fns";
import { WorkOrder, Client, Company, StaffMember } from "@/lib/types";

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { profile, isLoading: isUserLoading, isTechnician } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => { 
    setMounted(true); 
    setToday(startOfDay(new Date()));
  }, []);

  const companyId = profile?.companyId || "";

  const workOrdersQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "workOrders") : null, [db, companyId]);
  const clientsQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "clients") : null, [db, companyId]);
  const staffQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "staff") : null, [db, companyId]);
  const companyRef = useMemoFirebase(() => db && companyId ? doc(db, "companies", companyId) : null, [db, companyId]);

  const { data: workOrders, isLoading: isOrdersLoading } = useCollection<WorkOrder>(workOrdersQuery);
  const { data: clients } = useCollection<Client>(clientsQuery);
  const { data: staff } = useCollection<StaffMember>(staffQuery);
  const { data: company } = useDoc<Company>(companyRef);

  const realWorkOrders = useMemo(() => {
    if (!workOrders) return [];
    if (isTechnician && profile?.id) {
      return workOrders.filter(ot => ot.assignedToStaffIds?.includes(profile.id));
    }
    return workOrders;
  }, [workOrders, isTechnician, profile?.id]);

  const onboardingSteps = useMemo(() => {
    if (!company || isTechnician) return [];
    return [
      { id: 'profile', label: 'Datos Empresa', desc: 'RUT y dirección', completed: !!company.rut && company.rut !== "RUT por definir", href: '/company' },
      { id: 'team', label: 'Cargar Equipo', desc: 'Registra técnicos', completed: (staff?.length || 0) > 0, href: '/team' },
      { id: 'clients', label: 'Clientes', desc: 'Añade mandantes', completed: (clients?.length || 0) > 0, href: '/clients' },
      { id: 'ots', label: 'Primera OT', desc: 'Inicia flujo', completed: realWorkOrders.length > 0, href: '/work-orders/new' }
    ];
  }, [company, staff, clients, realWorkOrders, isTechnician]);

  const allStepsCompleted = onboardingSteps.length === 0 || onboardingSteps.every(s => s.completed);

  const overdueOrders = useMemo(() => {
    if (!today || !realWorkOrders) return [];
    return realWorkOrders.filter(ot => {
      if (ot.status === 'aprobada') return false;
      const dateToUse = ot.scheduledDate || ot.createdAt;
      if (!dateToUse) return false;
      const endDate = dateToUse?.toDate ? dateToUse.toDate() : (typeof dateToUse === 'string' ? parseISO(dateToUse) : null);
      return endDate && isBefore(endDate, today);
    });
  }, [realWorkOrders, today]);

  if (!mounted || isUserLoading || isOrdersLoading || !today) {
    return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tighter text-slate-900 italic">
            {isTechnician ? "Mi Hoja de Ruta" : "Central de Comando"}
          </h2>
          <p className="text-muted-foreground font-medium">Bienvenido, {profile?.name}.</p>
        </div>
        {!isTechnician && (
          <Button asChild className="h-12 px-6 rounded-xl shadow-xl shadow-primary/20 font-black gap-2">
            <Link href="/work-orders/new"><Plus className="h-5 w-5" /> Nueva OT</Link>
          </Button>
        )}
      </div>

      {!isTechnician && !allStepsCompleted && (
        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-slate-900 text-white overflow-hidden">
          <div className="grid md:grid-cols-3">
            <div className="p-8 md:p-12 space-y-6 bg-blue-600/10 border-r border-white/5">
              <div className="bg-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center">
                <Zap className="h-8 w-8 text-white fill-white" />
              </div>
              <h3 className="text-3xl font-black tracking-tighter italic uppercase leading-none">Guía de <br />Activación</h3>
              <Progress value={(onboardingSteps.filter(s => s.completed).length / 4) * 100} className="h-2 bg-white/10" />
            </div>
            <div className="md:col-span-2 p-8 md:p-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {onboardingSteps.map((step) => (
                <Link key={step.id} href={step.href}>
                  <div className={cn(
                    "group p-5 rounded-[1.5rem] border-2 transition-all flex items-center justify-between h-full",
                    step.completed ? "border-emerald-500/20 bg-emerald-500/5 opacity-60" : "border-white/10 bg-white/5 hover:border-blue-500/50"
                  )}>
                    <div className="space-y-1">
                      <p className={cn("text-xs font-black uppercase tracking-widest", step.completed ? "text-emerald-400" : "text-blue-400")}>{step.label}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{step.desc}</p>
                    </div>
                    {step.completed ? <Check className="h-4 w-4 text-emerald-400" /> : <ChevronRight className="h-4 w-4 text-white/20" />}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Órdenes", value: realWorkOrders.length, icon: ClipboardList, color: "bg-blue-600" },
          { label: "En Ejecución", value: realWorkOrders.filter(ot => ot.status !== 'aprobada').length, icon: Activity, color: "bg-indigo-600" },
          { label: "Finalizadas", value: realWorkOrders.filter(ot => ot.status === 'aprobada').length, icon: Trophy, color: "bg-emerald-600" },
          { label: "Alerta Plazos", value: overdueOrders.length, icon: AlertTriangle, color: "bg-rose-600" }
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">{stat.label}</CardTitle>
              <div className={cn("p-2 rounded-xl", stat.color)}><stat.icon className="h-4 w-4 text-white" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}