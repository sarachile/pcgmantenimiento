
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Estadísticas Globales</h2>
            <p className="text-muted-foreground">Métricas de crecimiento y salud de la infraestructura SaaS.</p>
          </div>
        </div>
        <Button onClick={handleLogout} variant="ghost" className="text-rose-600 hover:bg-rose-50 font-bold uppercase text-[10px]">
          <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Consumo de API Global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">125.4k</div>
            <p className="text-xs text-muted-foreground">Llamadas SimpleAPI este mes</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-500" />
              Nuevos Tenantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+4</div>
            <p className="text-xs text-muted-foreground">Últimos 30 días</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-rose-50 border-rose-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-rose-700">
              <ShieldAlert className="h-4 w-4" />
              Alertas de Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700">2</div>
            <p className="text-xs text-rose-600/80">Requeren atención inmediata</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Crecimiento de Plataforma</CardTitle>
            <CardDescription>Evolución de empresas activas en el sistema.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={platformGrowth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="companies" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Volumen Transaccional Global</CardTitle>
            <CardDescription>Órdenes de trabajo procesadas mensualmente.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformGrowth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="ots" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
