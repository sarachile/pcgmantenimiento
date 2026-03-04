
"use client";

import { useState, useRef, useEffect } from "react";
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, useStorage } from "@/firebase";
import { doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, Upload, Loader2, Save, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Company } from "@/lib/types";

export default function CompanyProfilePage() {
  const { profile, isLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for form fields
  const [formData, setFormData] = useState({
    name: "",
    rut: "",
    address: ""
  });

  const companyRef = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return doc(db, "companies", profile.companyId);
  }, [db, profile?.companyId]);

  const { data: company, isLoading: isCompanyLoading } = useDoc<Company>(companyRef);

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        rut: company.rut || "",
        address: company.address || ""
      });
    }
  }, [company]);

  const handleUpdateCompany = async (e: React.FormEvent) => {
    if (!companyRef) return;

    setIsSaving(true);
    try {
      updateDocumentNonBlocking(companyRef, {
        ...formData,
        updatedAt: serverTimestamp()
      });
      toast({
        title: "Perfil Actualizado",
        description: "Los datos de la empresa han sido guardados.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.companyId || !companyRef) return;

    setIsUploading(true);
    try {
      const storagePath = `companies/${profile.companyId}/branding/logo_${Date.now()}`;
      const logoRef = ref(storage, storagePath);
      
      await uploadBytes(logoRef, file);
      const downloadUrl = await getDownloadURL(logoRef);

      updateDocumentNonBlocking(companyRef, {
        logoUrl: downloadUrl,
        updatedAt: serverTimestamp()
      });

      toast({
        title: "Logotipo Actualizado",
        description: "La marca de la empresa ha sido cargada exitosamente.",
      });
    } catch (error: any) {
      toast({
        title: "Error al subir",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveLogo = () => {
    if (!companyRef) return;
    updateDocumentNonBlocking(companyRef, {
      logoUrl: null,
      updatedAt: serverTimestamp()
    });
    toast({
      title: "Logotipo Eliminado",
      description: "Se ha restaurado el icono por defecto.",
    });
  };

  if (isAuthLoading || isCompanyLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mi Empresa</h2>
          <p className="text-muted-foreground">Personalice su espacio de trabajo y datos corporativos.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Imagen de Marca</CardTitle>
            <CardDescription>Este logotipo aparecerá en reportes y la barra lateral.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="relative h-40 w-40 rounded-xl border-2 border-dashed bg-muted/20 flex items-center justify-center overflow-hidden group">
              {company?.logoUrl ? (
                <>
                  <Image 
                    src={company.logoUrl} 
                    alt="Logo Empresa" 
                    fill 
                    className="object-contain p-4"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="icon" variant="ghost" className="text-white hover:text-rose-500" onClick={handleRemoveLogo}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <Building2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-[10px] text-muted-foreground font-medium uppercase">Sin Logo</p>
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleLogoUpload}
            />
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {company?.logoUrl ? "Cambiar Logo" : "Subir Logotipo"}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground italic">Recomendado: PNG fondo transparente, 400x400px.</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-none shadow-sm">
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateCompany(); }}>
            <CardHeader>
              <CardTitle className="text-lg">Datos Corporativos</CardTitle>
              <CardDescription>Información legal y operativa de la organización.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="comp-name">Nombre Comercial / Razón Social</Label>
                <Input 
                  id="comp-name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="comp-rut">RUT de la Empresa</Label>
                  <Input 
                    id="comp-rut" 
                    placeholder="76.000.000-0"
                    value={formData.rut} 
                    onChange={(e) => setFormData({...formData, rut: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Plan Actual</Label>
                  <div className="h-10 px-3 flex items-center rounded-md border bg-muted/30">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {company?.currentPlan?.toUpperCase() || "S/I"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="comp-address">Dirección Casa Matriz</Label>
                <Input 
                  id="comp-address" 
                  value={formData.address} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
            </CardContent>
            <CardFooter className="bg-muted/10 border-t pt-6 flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar Cambios
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
