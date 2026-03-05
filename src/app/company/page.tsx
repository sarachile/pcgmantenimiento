
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
import { Building2, Upload, Loader2, Save, Trash2, ArrowLeft, Briefcase, MapPin } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Company } from "@/lib/types";
import { FirebaseImage } from "@/components/FirebaseImage";

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
    address: "",
    giro: "",
    comuna: ""
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
        address: company.address || "",
        giro: company.giro || "",
        comuna: company.comuna || ""
      });
    }
  }, [company]);

  const handleUpdateCompany = async () => {
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
          <h2 className="text-3xl font-black tracking-tight italic">Mi Empresa</h2>
          <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">Configuración de Identidad y Facturación</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle className="text-lg font-black uppercase tracking-tighter">Marca Corporativa</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <div className="relative h-40 w-40 rounded-[2rem] border-2 border-dashed bg-muted/20 flex items-center justify-center overflow-hidden group shadow-inner">
              {company?.logoUrl ? (
                <>
                  <FirebaseImage 
                    url={company.logoUrl} 
                    alt="Logo Empresa" 
                    className="h-full w-full p-4"
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
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Sin Logo</p>
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
              className="w-full rounded-xl h-11 font-bold" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {company?.logoUrl ? "Cambiar Marca" : "Subir Logotipo"}
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-none shadow-sm rounded-3xl overflow-hidden">
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateCompany(); }}>
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-lg font-black uppercase tracking-tighter">Datos Legales y DTE</CardTitle>
              <CardDescription className="font-medium">Información requerida para la emisión de facturas ante el SII.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Razón Social *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    className="pl-10 h-12 rounded-xl border-2 font-bold"
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">RUT Empresa *</Label>
                  <Input 
                    className="h-12 rounded-xl border-2 font-bold"
                    placeholder="76.000.000-0"
                    value={formData.rut} 
                    onChange={(e) => setFormData({...formData, rut: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Giro / Actividad *</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      className="pl-10 h-12 rounded-xl border-2 font-bold"
                      placeholder="Ej: Mantenimiento Industrial"
                      value={formData.giro} 
                      onChange={(e) => setFormData({...formData, giro: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Dirección Comercial *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      className="pl-10 h-12 rounded-xl border-2 font-bold"
                      value={formData.address} 
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Comuna *</Label>
                  <Input 
                    className="h-12 rounded-xl border-2 font-bold"
                    placeholder="Ej: Santiago"
                    value={formData.comuna} 
                    onChange={(e) => setFormData({...formData, comuna: e.target.value})}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t p-6 flex justify-between items-center">
              <Badge variant="outline" className="bg-white border-primary/20 text-primary font-black px-3 py-1">
                PLAN: {company?.currentPlan?.toUpperCase() || "S/I"}
              </Badge>
              <Button type="submit" disabled={isSaving} className="rounded-xl h-12 px-8 font-black shadow-lg">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar Configuración
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
