"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp, query, where, doc, getDoc, setDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
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
  ArrowLeft, 
  Loader2, 
  ClipboardPlus, 
  Plus, 
  Users, 
  Edit2, 
  Trash2,
  Camera,
  ShieldCheck,
  Globe,
  QrCode,
  Star,
  Layers,
  LayoutList,
  UserPlus,
  Building2,
  MapPin,
  Smartphone,
  Mail
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Client, Asset, StaffMember, Team, ServiceItem, ChecklistItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CHILE_REGIONS } from "@/lib/chile-data";

export const dynamic = 'force-dynamic';

const PREDEFINED_UNITS = [
  "Unidades (un)", 
  "Metros (m)", 
  "Metros Cuadrados (m2)", 
  "Metros Cúbicos (m3)", 
  "Kilogramos (kg)", 
  "Litros (lt)", 
  "Horas (hr)", 
  "Jornadas", 
  "Visitas", 
  "Puntos", 
  "Global (gl)",
  "Pulgadas (in)",
  "Milímetros (mm)"
];

function NewWorkOrderContent() {
  const { profile, isLoading: isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const editId = searchParams.get('editId');
  const duplicateFrom = searchParams.get('duplicateFrom');
  const isEditing = !!editId;

  // OT State
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [requestedByName, setRequestedByName] = useState("");
  const [assignedToStaffIds, setAssignedToStaffIds] = useState<string[]>([]);
  const [status, setStatus] = useState<any>("creada");
  
  // Location State
  const [region, setRegion] = useState("");
  const [city, setCity] = useState(""); 
  const [commune, setCommune] = useState("");
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [locationComment, setLocationComment] = useState("");

  const [reviewerRequired, setReviewerRequired] = useState(false);
  const [evaluationRequired, setEvaluationRequired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [durationDays, setDurationDays] = useState(1);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  // New Client Dialog State
  const [isClientDialogOpen, setIsClientOpen] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: "", rut: "", region: "", city: "", commune: "", 
    street: "", streetNumber: "", complement: "", 
    contactName: "", contactEmail: "" 
  });

  const selectedRegion = useMemo(() => CHILE_REGIONS.find(r => r.name === region), [region]);
  const newClientSelectedRegion = useMemo(() => CHILE_REGIONS.find(r => r.name === newClientData.region), [newClientData.region]);

  useEffect(() => {
    if (!isEditing) setScheduledDate(format(new Date(), 'yyyy-MM-dd'));
  }, [isEditing]);

  const companyId = profile?.companyId || "";

  const clientsQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "clients") : null, [db, companyId]);
  const assetsQuery = useMemoFirebase(() => db && companyId ? collection(db, "companies", companyId, "assets") : null, [db, companyId]);
  const staffQuery = useMemoFirebase(() => db && companyId ? query(collection(db, "companies", companyId, "staff"), where("active", "==", true)) : null, [db, companyId]);
  
  const { data: rawClients } = useCollection<Client>(clientsQuery);
  const { data: rawAssets } = useCollection<Asset>(assetsQuery);
  const { data: staffMembers } = useCollection<StaffMember>(staffQuery);

  const clients = useMemo(() => (rawClients || []).filter(c => !c.isDeleted), [rawClients]);
  const assets = useMemo(() => (rawAssets || []).filter(a => !a.isDeleted), [rawAssets]);

  useEffect(() => {
    if (!isEditing && !duplicateFrom && clientId && clients) {
      const selectedClient = clients.find(c => c.id === clientId);
      if (selectedClient) {
        setRegion(selectedClient.region || "");
        setCity(selectedClient.city || "");
        setCommune(selectedClient.commune || "");
        setStreet(selectedClient.street || "");
        setStreetNumber(selectedClient.streetNumber || "");
        setComplement(selectedClient.complement || "");
        setRequestedByName(selectedClient.contactName || "");
      }
    }
  }, [clientId, clients, isEditing, duplicateFrom]);

  useEffect(() => {
    const sourceId = editId || duplicateFrom;
    if (sourceId && db && companyId) {
      const fetchData = async () => {
        setIsLoadingData(true);
        try {
          const docRef = doc(db, "companies", companyId, "workOrders", sourceId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            setDescription(data.description || "");
            setClientId(data.clientId || "");
            setAssetId(data.assetId === 'none' ? "" : (data.assetId || ""));
            setRegion(data.region || "");
            setCity(data.city || "");
            setCommune(data.commune || "");
            setStreet(data.street || "");
            setStreetNumber(data.streetNumber || "");
            setComplement(data.complement || "");
            setLocationComment(data.locationComment || "");
            setRequestedByName(data.requestedByName || "");
            setAssignedToStaffIds(data.assignedToStaffIds || []);
            setReviewerRequired(data.reviewerRequired ?? false);
            setEvaluationRequired(data.evaluationRequired ?? false);
            setServiceItems(data.serviceItems || []);
            setStatus(data.status || "creada");
            if (data.scheduledDate) {
              const d = data.scheduledDate.toDate ? data.scheduledDate.toDate() : new Date(data.scheduledDate);
              setScheduledDate(format(d, 'yyyy-MM-dd'));
            }
            setDurationDays(data.durationDays || 1);
            if (data.checklist) setChecklist(data.checklist);
          }
        } catch (e) { console.error(e); } finally { setIsLoadingData(false); }
      };
      fetchData();
    }
  }, [editId, duplicateFrom, db, companyId]);

  const handleAddServiceItem = () => {
    const newItem: ServiceItem = {
      id: `item-${Date.now()}`,
      description: "",
      quantity: 1,
      unit: "Unidades (un)"
    };
    setServiceItems([...serviceItems, newItem]);
  };

  const handleUpdateServiceItem = (id: string, field: keyof ServiceItem, value: any) => {
    setServiceItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleRemoveServiceItem = (id: string) => {
    setServiceItems(prev => prev.filter(item => item.id !== id));
  };

  const handleCreateQuickClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !companyId || !newClientData.name || !newClientData.contactEmail) {
      toast({ title: "Faltan datos", description: "Razón Social e Email son obligatorios.", variant: "destructive" });
      return;
    }

    const fullAddress = `${newClientData.street} ${newClientData.streetNumber}${newClientData.complement ? ', ' + newClientData.complement : ''}, ${newClientData.commune}, ${newClientData.city}, ${newClientData.region}`;

    const dataToSave = {
      ...newClientData,
      address: fullAddress,
      companyId: companyId,
      evaluationEnabled: true,
      createdAt: new Date().toISOString()
    };

    try {
      const colRef = collection(db, "companies", companyId, "clients");
      const clientRef = await addDocumentNonBlocking(colRef, dataToSave);
      
      if (clientRef) {
        toast({ title: "Cliente Registrado", description: "El cliente ha sido guardado y seleccionado automáticamente." });
        setClientId(clientRef.id);
        setIsClientOpen(false);
        setNewClientData({ 
          name: "", rut: "", region: "", city: "", commune: "", 
          street: "", streetNumber: "", complement: "", 
          contactName: "", contactEmail: "" 
        });
      }
    } catch (e: any) {
      toast({ title: "Error al crear cliente", description: e.message, variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const missingFields = [];
    if (!description.trim()) missingFields.push("Descripción técnica");
    if (!clientId) missingFields.push("Cliente");
    if (!region) missingFields.push("Región");
    if (!city) missingFields.push("Ciudad");
    if (!commune) missingFields.push("Comuna");
    if (!street) missingFields.push("Calle");
    if (!streetNumber) missingFields.push("Número");
    if (assignedToStaffIds.length === 0) missingFields.push("Técnico asignado");

    if (missingFields.length > 0) {
      toast({ 
        title: "Faltan campos obligatorios", 
        description: `Por favor complete: ${missingFields.join(", ")}.`,
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const fullAddress = `${street} ${streetNumber}${complement ? ', ' + complement : ''}, ${commune}, ${city}, ${region}`;
      const commonData = {
        clientId,
        assetId: assetId === 'none' ? null : (assetId || null),
        description: description.trim(),
        serviceLocation: fullAddress,
        region, city, commune, street, streetNumber, complement, locationComment,
        requestedByName: requestedByName.trim(),
        assignedToStaffIds,
        reviewerRequired,
        evaluationRequired,
        scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null,
        durationDays: Number(durationDays),
        serviceItems,
        checklist: checklist.map((item, idx) => ({ 
          ...item,
          id: item.id || `task-${idx}-${Date.now()}`, 
          task: item.task, 
          completed: item.completed || false 
        })),
        status: status || 'creada',
        updatedAt: serverTimestamp(),
      };

      if (isEditing) {
        const docRef = doc(db!, "companies", companyId, "workOrders", editId);
        updateDocumentNonBlocking(docRef, commonData);
        toast({ title: "Orden Actualizada" });
        router.push(`/work-orders/${editId}`);
      } else {
        const shortId = `OT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const docRef = doc(db!, "companies", companyId, "workOrders", shortId);
        await setDoc(docRef, { ...commonData, id: shortId, companyId, status: status || "creada", createdByUserId: profile!.id, approvalPin: Math.floor(100000 + Math.random() * 900000).toString(), createdAt: serverTimestamp() });
        toast({ title: "Orden Generada" });
        router.push(`/work-orders/${shortId}`);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  if (isUserLoading || isLoadingData) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-8 pb-32">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href={isEditing ? `/work-orders/${editId}` : "/work-orders"}><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 italic leading-none">{isEditing ? "Editar Orden" : "Generar Orden"}</h2>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] mt-2">Gestión de Partidas y Trazabilidad Geográfica</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* 1. DATOS DEL SERVICIO */}
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className={cn("text-white p-8", isEditing ? "bg-amber-600" : "bg-slate-900")}>
            <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tighter italic">
              {isEditing ? <Edit2 className="h-6 w-6" /> : <ClipboardPlus className="h-6 w-6 text-blue-400" />} 1. Datos del Servicio
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cliente / Entidad *</Label>
                  <Dialog open={isClientDialogOpen} onOpenChange={setIsClientOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="link" className="h-auto p-0 text-[10px] font-black uppercase text-primary flex items-center gap-1">
                        <UserPlus className="h-3 w-3" /> Nuevo Cliente
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-[2.5rem]">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-black italic uppercase">Creación Rápida de Cliente</DialogTitle>
                        <DialogDescription>El nuevo mandante quedará guardado automáticamente en su base de datos.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400">Razón Social *</Label>
                            <Input placeholder="Nombre Empresa / Particular" value={newClientData.name} onChange={(e) => setNewClientData({...newClientData, name: e.target.value})} className="h-12 border-2 rounded-xl font-bold" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400">RUT</Label>
                            <Input placeholder="76.000.000-0" value={newClientData.rut} onChange={(e) => setNewClientData({...newClientData, rut: e.target.value})} className="h-12 border-2 rounded-xl font-bold" />
                          </div>
                        </div>

                        <div className="space-y-4 border-t pt-6">
                          <p className="text-[10px] font-black uppercase text-primary flex items-center gap-2"><Globe className="h-4 w-4" /> Ubicación Matriz</p>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[9px] font-black uppercase text-slate-400">Región</Label>
                              <Select value={newClientData.region} onValueChange={(v) => setNewClientData({...newClientData, region: v, city: "", commune: ""})}>
                                <SelectTrigger className="h-11 border-2 rounded-xl"><SelectValue placeholder="Región" /></SelectTrigger>
                                <SelectContent>{CHILE_REGIONS.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[9px] font-black uppercase text-slate-400">Ciudad</Label>
                              <Select value={newClientData.city} onValueChange={(v) => setNewClientData({...newClientData, city: v})} disabled={!newClientData.region}>
                                <SelectTrigger className="h-11 border-2 rounded-xl"><SelectValue placeholder="Ciudad" /></SelectTrigger>
                                <SelectContent>{newClientSelectedRegion?.cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[9px] font-black uppercase text-slate-400">Comuna</Label>
                              <Select value={newClientData.commune} onValueChange={(v) => setNewClientData({...newClientData, commune: v})} disabled={!newClientData.region}>
                                <SelectTrigger className="h-11 border-2 rounded-xl"><SelectValue placeholder="Comuna" /></SelectTrigger>
                                <SelectContent>{newClientSelectedRegion?.communes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2 space-y-2">
                              <Label className="text-[9px] font-black uppercase text-slate-400">Calle</Label>
                              <Input placeholder="Ej: Av. Providencia" value={newClientData.street} onChange={(e) => setNewClientData({...newClientData, street: e.target.value})} className="h-11 border-2 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[9px] font-black uppercase text-slate-400">N°</Label>
                              <Input placeholder="1234" value={newClientData.streetNumber} onChange={(e) => setNewClientData({...newClientData, streetNumber: e.target.value})} className="h-11 border-2 rounded-xl" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4 border-t pt-6">
                          <p className="text-[10px] font-black uppercase text-primary flex items-center gap-2"><Smartphone className="h-4 w-4" /> Responsable Portal Autogestión</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[9px] font-black uppercase text-slate-400">Nombre Responsable</Label>
                              <Input placeholder="Nombre Apellido" value={newClientData.contactName} onChange={(e) => setNewClientData({...newClientData, contactName: e.target.value})} className="h-11 border-2 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[9px] font-black uppercase text-slate-400">Email Corporativo *</Label>
                              <Input placeholder="email@empresa.cl" type="email" value={newClientData.contactEmail} onChange={(e) => setNewClientData({...newClientData, contactEmail: e.target.value})} className="h-11 border-2 rounded-xl" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl" onClick={handleCreateQuickClient}>Registrar y Seleccionar</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="h-12 rounded-xl border-2"><SelectValue placeholder="Seleccione cliente..." /></SelectTrigger>
                  <SelectContent>{clients?.map(c => <SelectItem key={c.id} value={c.id} className="font-bold">{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Equipo / Activo</Label>
                <Select value={assetId} onValueChange={setAssetId}>
                  <SelectTrigger className="h-12 rounded-xl border-2"><SelectValue placeholder="Seleccione equipo..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin activo específico</SelectItem>
                    {assets?.map(a => <SelectItem key={a.id} value={a.id} className="font-bold">{a.name} [{a.code}]</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border-2 border-slate-100">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <p className="text-[10px] font-black uppercase text-primary tracking-widest">Ubicación del Servicio Técnico</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Región *</Label>
                  <Select value={region} onValueChange={(v) => { setRegion(v); setCity(""); setCommune(""); }}>
                    <SelectTrigger className="h-12 rounded-xl border-2 bg-white"><SelectValue placeholder="Región" /></SelectTrigger>
                    <SelectContent>{CHILE_REGIONS.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Ciudad *</Label>
                  <Select key={`city-${region}`} value={city} onValueChange={(v) => setCity(v)} disabled={!region}>
                    <SelectTrigger className="h-12 rounded-xl border-2 bg-white"><SelectValue placeholder="Ciudad" /></SelectTrigger>
                    <SelectContent>{selectedRegion?.cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Comuna *</Label>
                  <Select key={`commune-${region}`} value={commune} onValueChange={setCommune} disabled={!region}>
                    <SelectTrigger className="h-12 rounded-xl border-2 bg-white"><SelectValue placeholder="Comuna" /></SelectTrigger>
                    <SelectContent>{selectedRegion?.communes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Calle / Avenida *</Label>
                  <Input value={street} onChange={e => setStreet(e.target.value)} className="h-12 rounded-xl border-2 bg-white" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">N° *</Label>
                  <Input value={streetNumber} onChange={e => setStreetNumber(e.target.value)} className="h-12 rounded-xl border-2 bg-white" required />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Descripción General del Problema *</Label>
              <Textarea placeholder="Describa el requerimiento o falla detectada..." className="min-h-[100px] rounded-2xl border-2 p-4 text-sm bg-slate-50/50" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* 2. MAGNITUDES Y PARTIDAS */}
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-indigo-600 text-white p-8">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tighter italic">
                <Layers className="h-6 w-6" /> 2. Magnitudes y Partidas
              </CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={handleAddServiceItem} className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-black text-[10px] uppercase h-10 rounded-xl px-4 gap-2">
                <Plus className="h-4 w-4" /> Añadir Partida
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-4">
            {serviceItems.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed rounded-3xl opacity-40 italic text-sm">
                No hay magnitudes registradas. Use el botón superior para añadir ítems de medición (m2, m3, visitas, etc).
              </div>
            ) : (
              <div className="space-y-3">
                {serviceItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-slate-50 rounded-2xl border-2 animate-in fade-in slide-in-from-top-2">
                    <div className="md:col-span-5 space-y-1">
                      <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Descripción Partida</Label>
                      <Input 
                        placeholder="Ej: Pintura de muros, Instalación puntos..." 
                        value={item.description} 
                        onChange={(e) => handleUpdateServiceItem(item.id, 'description', e.target.value)}
                        className="h-10 border-2 rounded-xl bg-white text-xs font-bold"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Cant.</Label>
                      <Input 
                        type="number" 
                        value={item.quantity} 
                        onChange={(e) => handleUpdateServiceItem(item.id, 'quantity', Number(e.target.value))}
                        className="h-10 border-2 rounded-xl bg-white text-xs font-bold text-center"
                      />
                    </div>
                    <div className="md:col-span-4 space-y-1">
                      <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Unidad</Label>
                      <Select value={item.unit} onValueChange={(v) => handleUpdateServiceItem(item.id, 'unit', v)}>
                        <SelectTrigger className="h-10 border-2 rounded-xl bg-white text-xs font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PREDEFINED_UNITS.map(u => <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-1 flex items-end justify-end pb-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveServiceItem(item.id)} className="h-10 w-10 text-rose-500 hover:bg-rose-50 rounded-xl">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. PERSONAL TÉCNICO */}
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-primary p-8">
            <CardTitle className="flex items-center gap-3 text-xl font-black text-white uppercase tracking-tighter italic">
              <Users className="h-6 w-6" /> 3. Personal Técnico *
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto">
              {staffMembers?.map(s => (
                <label key={s.id} className={cn("flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all", assignedToStaffIds.includes(s.id) ? "border-primary bg-primary/5" : "border-slate-100 bg-white")}>
                  <Checkbox checked={assignedToStaffIds.includes(s.id)} onCheckedChange={() => setAssignedToStaffIds(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])} />
                  <div className="flex-1 min-w-0"><p className="text-xs font-black text-slate-900 truncate">{s.name}</p><p className="text-[9px] font-black uppercase text-slate-400">{s.role}</p></div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 4. PROTOCOLOS */}
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-8">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tighter italic">
                <LayoutList className="h-6 w-6 text-amber-400" /> 4. Protocolos Técnicos
              </CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => setChecklist([...checklist, { task: "", completed: false, id: `task-new-${Date.now()}` }])} className="h-10 rounded-xl font-black text-[10px] uppercase gap-2 border-white/20 text-white bg-white/10"><Plus className="h-4 w-4" /> Añadir Punto</Button>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-4">
            {checklist.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed rounded-3xl opacity-40 italic text-sm">
                No hay puntos de control registrados.
              </div>
            ) : (
              checklist.map((item, idx) => (
                <div key={idx} className="flex gap-2 animate-in fade-in slide-in-from-left-2">
                  <Input 
                    value={item.task} 
                    onChange={e => { const n = [...checklist]; n[idx].task = e.target.value; setChecklist(n); }} 
                    className="h-12 rounded-xl border-2 font-bold" 
                    placeholder="Describa la tarea o punto de control técnico..." 
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setChecklist(checklist.filter((_, i) => i !== idx))} className="h-12 w-12 text-rose-500 rounded-xl">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 5. CIERRE Y VALIDACIÓN */}
        <Card className={cn("border-none shadow-xl rounded-[2.5rem] overflow-hidden transition-all", (reviewerRequired || evaluationRequired) ? "bg-indigo-50/50" : "bg-slate-50")}>
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-3 text-slate-900">
              <ShieldCheck className="h-6 w-6 text-emerald-600" /> 5. Cierre y Validación
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl border-2 flex items-center justify-between bg-white shadow-sm"><div className="space-y-1"><Label className="font-black text-xs uppercase tracking-tighter flex items-center gap-2"><QrCode className="h-4 w-4 text-indigo-600" /> Validación QR Externa</Label><p className="text-[9px] text-slate-400 font-bold uppercase">Sello digital del cliente</p></div><Switch checked={reviewerRequired} onCheckedChange={setReviewerRequired} /></div>
              <div className="p-6 rounded-3xl border-2 flex items-center justify-between bg-white shadow-sm"><div className="space-y-1"><Label className="font-black text-xs uppercase tracking-tighter flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" /> Encuesta Satisfacción</Label><p className="text-[9px] text-slate-400 font-bold uppercase">Feedback nota 1 a 5</p></div><Switch checked={evaluationRequired} onCheckedChange={setEvaluationRequired} /></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Estado de la Orden</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-12 border-2 rounded-xl font-bold uppercase text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solicitada">Solicitada</SelectItem>
                    <SelectItem value="creada">Creada</SelectItem>
                    <SelectItem value="asignada">Asignada</SelectItem>
                    <SelectItem value="en proceso">En Proceso</SelectItem>
                    <SelectItem value="ejecutada">Ejecutada</SelectItem>
                    <SelectItem value="en revision">En Revisión</SelectItem>
                    <SelectItem value="aprobada">Aprobada</SelectItem>
                    <SelectItem value="rechazada">Rechazada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Inicio Programado</Label>
                <Input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="h-12 border-2 rounded-xl font-bold" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Plazo Estimado (Días)</Label><Input type="number" min="1" value={durationDays} onChange={e => setDurationDays(Number(e.target.value) || 1)} className="h-12 border-2 rounded-xl font-bold" /></div>
            </div>
          </CardContent>
          <CardFooter className="p-8 pt-0">
            <Button type="submit" disabled={isSubmitting} className={cn("w-full h-20 rounded-[2rem] text-white font-black text-xl uppercase tracking-widest shadow-2xl transition-all", isEditing ? "bg-amber-600 shadow-amber-900/20" : "bg-primary shadow-primary/20 hover:scale-[1.02]")}>
              {isSubmitting ? <Loader2 className="animate-spin h-8 w-8" /> : (isEditing ? <Edit2 className="h-8 w-8 mr-2" /> : <Plus className="h-8 w-8 mr-2" />) + (isEditing ? "Actualizar Orden" : "Activar Orden")}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

export default function NewWorkOrderPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <NewWorkOrderContent />
    </Suspense>
  );
}
