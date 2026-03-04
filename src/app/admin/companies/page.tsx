
"use client";

import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Plus, 
  ExternalLink, 
  Settings2,
  AlertCircle,
  ArrowLeft,
  Building2,
  ShieldCheck
} from "lucide-react";
import { MOCK_COMPANIES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function AdminCompaniesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filtered = MOCK_COMPANIES.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.rut.includes(searchTerm)
  );

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Función de Administrador",
      description: "La creación de nuevos tenants está disponible en el plan Enterprise. Esta acción ha sido registrada.",
    });
    setIsCreateOpen(false);
  };

  const handleImpersonate = (companyName: string) => {
    toast({
      title: "Acceso como Administrador",
      description: `Entrando al entorno de ${companyName}...`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild title="Volver al escritorio">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gestión de Empresas</h2>
            <p className="text-muted-foreground">Administración de tenants y suscripciones de la plataforma.</p>
          </div>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nueva Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Tenant</DialogTitle>
              <DialogDescription>Cree un nuevo espacio de trabajo para un cliente corporativo.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCompany} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Nombre de la Empresa / Razón Social</Label>
                  <Input placeholder="Ej: Servicios Industriales S.A." required />
                </div>
                <div className="space-y-2">
                  <Label>RUT Empresa</Label>
                  <Input placeholder="76.000.000-0" required />
                </div>
                <div className="space-y-2">
                  <Label>Plan de Suscripción</Label>
                  <Select defaultValue="free">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Gratuito</SelectItem>
                      <SelectItem value="pro">Plan Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full">Confirmar Registro</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre o RUT..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre / RUT</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Usuarios</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold">{company.name}</span>
                      <span className="text-xs text-muted-foreground">{company.rut}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      company.subscriptionPlan === 'enterprise' && "bg-purple-50 text-purple-700 border-purple-200",
                      company.subscriptionPlan === 'pro' && "bg-blue-50 text-blue-700 border-blue-200"
                    )}>
                      {(company.subscriptionPlan || 'FREE').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      company.subscriptionStatus === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    )}>
                      {company.subscriptionStatus === 'active' ? 'ACTIVA' : 'BLOQUEADA'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2">
                      <span>12 / 50</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {mounted ? new Date(company.createdAt).toLocaleDateString() : '...'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" title="Configurar Límites" onClick={() => toast({ title: "Configuración", description: "Cargando parámetros de suscripción..." })}>
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Entrar como Admin de Empresa" onClick={() => handleImpersonate(company.name)}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
