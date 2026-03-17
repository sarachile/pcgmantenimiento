"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { 
  Globe, 
  Building2, 
  TrendingUp, 
  ArrowLeft,
  Zap,
  ShieldAlert,
  Loader2,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUser, useAuth } from "@/firebase";
import { redirect } from "next/navigation";
import { signOut } from "firebase/auth";

export default function GlobalStatsPage() {
  const { isSuperAdmin, isLoading } = useUser();
  const auth = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isLoading && !isSuperAdmin) {
    redirect("/dashboard");
  }

  const handleLogout = async () => {
    await signOut(auth);
    redirect("/auth/login");
  };

  const platformGrowth = [
    { month: "Ene", companies: 4, ots: 120 },
    { month: "Feb", companies: 6, ots: 180 },
    { month: "Mar", companies: 8, ots: 250 },
    { month: "Abr", companies: 12, ots: 410 },
  ];

  if (!mounted) return null;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/admin">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-black tracking-tighter uppercase italic">Estadísticas Globales</h2>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Salud de la infraestructura SaaS</p>
          </div>
        </div>
        <Button onClick={handleLogout} variant="ghost" className="text-rose-600 hover:bg-rose-50 font-bold uppercase text-[10px]">
          <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-primary/5 rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Consumo de API Global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black italic">125.4k</div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase">Llamadas SimpleAPI este mes</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-500" />
              Nuevos Tenantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black italic">+4</div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase">Últimos 30 días</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-rose-50 border-rose-100 rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-rose-700 tracking-widest flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Alertas de Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black italic text-rose-700">2</div>
            <p className="text-[9px] font-bold text-rose-600/80 uppercase">Requieren atención inmediata</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-sm font-black uppercase tracking-tighter">Crecimiento de Plataforma</CardTitle>
            <CardDescription className="text-[9px] font-bold uppercase">Evolución de empresas activas</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={platformGrowth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" fontSize={10} tickLine={false} axisLine={false} fontWeight="bold" />
                <YAxis fontSize={10} tickLine={false} axisLine={false} fontWeight="bold" />
                <Tooltip />
                <Line type="monotone" dataKey="companies" stroke="hsl(var(--primary))" strokeWidth={4} dot={{ r: 6, fill: 'white', strokeWidth: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-sm font-black uppercase tracking-tighter">Volumen Transaccional</CardTitle>
            <CardDescription className="text-[9px] font-bold uppercase">Órdenes de trabajo procesadas</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformGrowth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" fontSize={10} tickLine={false} axisLine={false} fontWeight="bold" />
                <YAxis fontSize={10} tickLine={false} axisLine={false} fontWeight="bold" />
                <Tooltip />
                <Bar dataKey="ots" fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}