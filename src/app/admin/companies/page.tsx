
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
  ShieldCheck,
  Save,
  Copy,
  Key
} from "lucide-react";
import { MOCK_COMPANIES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Company } from "@/lib/types";

export default function AdminCompaniesPage() {
  const { toast } = useToast();
  const { isSuperAdmin, isLoading: isUserLoading } = useUser();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  
  // Create Company State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    rut: "",
    currentPlan: "free" as any,
  });

  // Config Subscription State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [configData, setConfigData] = useState({
    currentPlan: "free" as any,
    subscriptionStatus: "active" as any,
    isActive: true
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const companiesQuery = useMemoFirebase(() => {
    if (!db || !isSuperAdmin) return null;
    return collection(db, "companies");
  }, [db, isSuperAdmin]);

  const { data: realCompanies, isLoading: isCompaniesLoading } = useCollection<Company>(companiesQuery);

  const companies = realCompanies && realCompanies.length > 0 ? realCompanies : (MOCK_COMPANIES as any);
  const isDemo = !realCompanies || realCompanies.length === 0;

  const filtered = companies.filter((c: any) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    setIsSubmitting(true);
    try {
      const companyId = `comp-${Math.random().toString(36).substr(2, 6)}`;
      
      // Usar setDoc para controlar el ID
      await setDoc(doc(db, "companies", companyId), {
        id: companyId,
        name: formData.name,
        rut: formData.rut || "Pendiente",
        address: "Dirección por definir",
        currentPlan: formData.currentPlan,
        subscriptionStatus: "active",
        isActive: true,
        createdAt: new Date().toISOString(),
      });

      toast({
        title: "Empresa Registrada",
        description: `Código de acceso: ${companyId}. Entréguelo al cliente para su registro.`,
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "Código de acceso copiado al portapapeles.",
    });
  };

  const handleOpenConfig = (company: Company) => {
    setSelectedCompany(company);
    setConfigData({
      currentPlan: company.currentPlan || "free",
      subscriptionStatus: company.subscriptionStatus || "active",
      isActive: company.isActive ?? true
    });
    setIsConfigOpen(true);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedCompany) return;

    if (isDemo && selectedCompany.id.startsWith('comp-1')) {
      toast({
        title: "Modo Demo",
        description: "No se pueden actualizar parámetros en modo de vista previa.",
        variant: "destructive",
      });
      setIsConfigOpen(false);
      return;
    }

    try {
      const companyRef = doc(db, "companies", selectedCompany.id);
      updateDocumentNonBlocking(companyRef, {
        currentPlan: configData.currentPlan,
        subscriptionStatus: configData.subscriptionStatus,
        isActive: configData.isActive,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Suscripción Actualizada",
        description: `Parámetros guardados para ${selectedCompany.name}.`,
      });
      setIsConfigOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios.",
        variant: "destructive",
      });
    }
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
            <p className="text-muted-foreground">Administración de tenants y códigos de acceso.</p>
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
              <DialogTitle>Registrar Nuevo Cliente</DialogTitle>
              <DialogDescription>Cree el entorno para que el cliente pueda registrar sus usuarios.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCompany} className="space-y-4 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre de la Empresa / Razón Social *</Label>
                  <Input 
                    placeholder="Ej: Servicios Industriales S.A." 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>RUT Empresa (Opcional)</Label>
                    <Input 
                      placeholder="76.000.000-0" 
                      value={formData.rut}
                      onChange={(e) => setFormData({...formData, rut: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Plan Asignado</Label>
                    <Select 
                      value={formData.currentPlan} 
                      onValueChange={(val) => setFormData({...formData, currentPlan: val})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Demo (1/1)</SelectItem>
                        <SelectItem value="pro">Pro (5/3)</SelectItem>
                        <SelectItem value="enterprise">Enterprise (15/5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generar Empresa y Código"}
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
                placeholder="Buscar por nombre o código ID..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {isDemo && <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">VISTA PREVIA</Badge>}
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
                  <TableHead>Código de Acceso</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((company: Company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold">{company.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{company.rut || 'RUT Pendiente'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-xs font-mono font-bold text-primary">
                          {company.id}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => copyToClipboard(company.id)}
                          title="Copiar Código"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[10px] font-bold uppercase",
                        company.currentPlan === 'enterprise' && "bg-purple-50 text-purple-700 border-purple-200",
                        company.currentPlan === 'pro' && "bg-blue-50 text-blue-700 border-blue-200"
                      )}>
                        {company.currentPlan || 'FREE'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "text-[10px] font-bold",
                        !company.isActive ? "bg-rose-100 text-rose-700" :
                        company.subscriptionStatus === 'active' ? "bg-emerald-100 text-emerald-700" : 
                        "bg-amber-100 text-amber-700"
                      )}>
                        {!company.isActive ? 'INACTIVA' : 
                         company.subscriptionStatus === 'active' ? 'AL DÍA' : 'VENCIDA'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleOpenConfig(company)}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Simular Entrada">
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

      {/* Dialog para Configurar Parámetros de Suscripción */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Parámetros de Empresa</DialogTitle>
            <DialogDescription>
              Ajuste el estado y plan para {selectedCompany?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveConfig} className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nivel de Servicio</Label>
                <Select 
                  value={configData.currentPlan} 
                  onValueChange={(val) => setConfigData({...configData, currentPlan: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Plan Inicio (Demo)</SelectItem>
                    <SelectItem value="pro">Plan Pro (1.5 UF)</SelectItem>
                    <SelectItem value="enterprise">Plan Enterprise (2.5 UF)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado de Operación</Label>
                <Select 
                  value={configData.isActive ? "true" : "false"} 
                  onValueChange={(val) => setConfigData({...configData, isActive: val === "true"})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activa / Operativa</SelectItem>
                    <SelectItem value="false">Suspendida / Bloqueada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado de Facturación</Label>
                <Select 
                  value={configData.subscriptionStatus} 
                  onValueChange={(val) => setConfigData({...configData, subscriptionStatus: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Pagos al Día</SelectItem>
                    <SelectItem value="past_due">Pendiente de Pago</SelectItem>
                    <SelectItem value="canceled">Suscripción Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Actualizar Configuración
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
