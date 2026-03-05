"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Building2, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  FileCheck,
  Zap,
  ArrowLeft
} from "lucide-react";
import { useUser } from "@/firebase/auth/use-user";
import { redirect } from "next/navigation";
import { MOCK_COMPANIES, MOCK_WORK_ORDERS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function SuperadminDashboardPage() {
  const { isSuperAdmin, isLoading } = useUser();

  if (!isLoading && !isSuperAdmin) {
    redirect("/dashboard");
  }

  const platformStats = [
    { label: "Empresas Totales", value: MOCK_COMPANIES.length, icon: Building2, color: "text-blue-600" },
    { label: "Usuarios Activos", value: "142", icon: Users, color: "text-emerald-600" },
    { label: "OTs Globales (Mes)", value: MOCK_WORK_ORDERS.length, icon: TrendingUp, color: "text-purple-600" },
    { label: "Límites Alcanzados", value: "3", icon: AlertTriangle, color: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild title="Volver al dashboard operativo">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-bold tracking-tight">Control Maestro Plataforma</h2>
            <p className="text-muted-foreground text-sm">Monitoreo global de PCGMANTENIMIENTO ERP.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {platformStats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className={cn("h-4 w-4", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Empresas con Mayor Actividad</CardTitle>
            <CardDescription>Consumo de recursos en los últimos 30 días.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_COMPANIES.map((company) => (
                <div key={company.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/10">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{company.name}</p>
                      <p className="text-xs text-muted-foreground">Plan: {company.currentPlan?.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">85% Límite</p>
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full w-[85%]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Estado Facturación Global</CardTitle>
            <CardDescription>Resumen de DTEs emitidos vía SimpleAPI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-lg text-emerald-700">
              <FileCheck className="h-8 w-8" />
              <div>
                <p className="text-2xl font-bold">1,245</p>
                <p className="text-xs">Exitosos (Aceptados SII)</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-rose-50 rounded-lg text-rose-700">
              <AlertTriangle className="h-8 w-8" />
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs">Errores de Emisión</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}