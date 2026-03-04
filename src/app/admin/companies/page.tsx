
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
  Loader2,
  ShieldCheck
} from "lucide-react";
import { MOCK_COMPANIES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { Company } from "@/lib/types";

export default function AdminCompaniesPage() {
  const { toast } = useToast();
  const { isSuperAdmin, isLoading: isUserLoading } = useUser();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    rut: "",
    currentPlan: "free" as any,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const companiesQuery = useMemoFirebase(() => {
    if (!db || !isSuperAdmin) return null;
    return collection(db, "companies");
  }, [db, isSuperAdmin]);

  const { data: realCompanies, isLoading: isCompaniesLoading } = useCollection<Company>(companiesQuery);

  const companies = realCompanies && realCompanies.length > 0 ? realCompanies : MOCK_COMPANIES;
  const isDemo = !realCompanies || realCompanies.length === 0;

  const filtered = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.rut.includes(searchTerm)
  );

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    setIsSubmitting(true);
    try {
      const colRef = collection(db, "companies");
      const companyId = `comp-${Math.random().toString(36).substr(2, 9)}`;
      
      const newCompanyData = {
        id: companyId,
        name: formData.name,
        rut: formData.rut || "S/I",
        address: "Dirección por definir",
        currentPlan: formData.currentPlan,
        subscriptionStatus: "active",
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      await addDocumentNonBlocking(colRef, newCompanyData);

      toast({
        title: "Empresa Registrada",
        description: `Se ha creado el entorno para ${formData.name} exitosamente.`,
      });
      
      setIsCreateOpen(false);
      setFormData({ name: "", rut: "", currentPlan: "free" });
    } catch (error: any) {
      toast({
        title: "Error al crear",
        description: error.message || "No se pudo registrar la empresa.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImpersonate = (companyName: string) => {
    toast({
      title: "Acceso como Administrador",
      description: `Entrando al entorno de ${companyName}...`,
    });
  };

  if (isUserLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
              <DialogDescription>Cree un nuevo espacio de trabajo independiente. No hay restricciones para tu cuenta de Súper Admin.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCompany} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Nombre de la Empresa / Razón Social *</Label>
                  <Input 
                    placeholder="Ej: Servicios Industriales S.A." 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>RUT Empresa (Opcional)</Label>
                  <Input 
                    placeholder="76.000.000-0" 
                    value={formData.rut}
                    onChange={(e) => setFormData({...formData, rut: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Plan de Suscripción</Label>
                  <Select 
                    value={formData.currentPlan} 
                    onValueChange={(val) => setFormData({...formData, currentPlan: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Gratuito (Demo)</SelectItem>
                      <SelectItem value="pro">Plan Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirmar Registro Maestro"}
                </Button>
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
            {isDemo && <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">MODO VISTA MOCK</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          {isCompaniesLoading ? (
            <div className="py-10 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Cargando tenantes...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre / RUT</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Estado</TableHead>
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
                        <span className="text-xs text-muted-foreground">{company.rut || 'RUT Pendiente'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        company.currentPlan === 'enterprise' && "bg-purple-50 text-purple-700 border-purple-200",
                        company.currentPlan === 'pro' && "bg-blue-50 text-blue-700 border-blue-200"
                      )}>
                        {(company.currentPlan || 'FREE').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        company.subscriptionStatus === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      )}>
                        {company.subscriptionStatus === 'active' ? 'ACTIVA' : 'BLOQUEADA'}
                      </Badge>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
