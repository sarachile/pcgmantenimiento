
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  useUser, 
  useFirestore, 
  useDoc,
  useCollection, 
  useMemoFirebase, 
  addDocumentNonBlocking,
  updateDocumentNonBlocking
} from "@/firebase";
import { collection, serverTimestamp, query, where, doc, addDoc, getDocs } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Receipt, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Loader2, 
  Building2, 
  ClipboardList,
  CheckCircle2,
  Calculator,
  ShieldCheck,
  Hash,
  SendHorizontal,
  FileText,
  Package,
  AlertTriangle,
  Beaker,
  Settings,
  Lock,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Client, WorkOrder, BillingItem, BillingDocumentType, Company } from "@/lib/types";
import { cn } from "@/lib/utils";
import { processElectronicEmission } from "@/actions/billing";
import { usePlanLimits } from "@/hooks/use-plan-limits";

export default function NewBillingDocumentPage() {
  const { profile, isLoading: isUserLoading } = useUser();
  const { canBill, planName } = usePlanLimits();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [clientId, setClientId] = useState("");
  const [workOrderId, setWorkOrderId] = useState("");
  const [type, setType] = useState<BillingDocumentType>("factura");
  const [items, setItems] = useState<BillingItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmitting, setIsEmitting] = useState(false);
  const [isFetchingParts, setIsFetchingParts] = useState(false);
  const [isSandbox, setIsSandbox] = useState(true);

  // Consultas
  const companyRef = useMemoFirebase(() => 
    db && profile?.companyId ? doc(db, "companies", profile.companyId) : null, 
    [db, profile?.companyId]
  );
  const { data: company } = useDoc<Company>(companyRef);

  const clientsQuery = useMemoFirebase(() => 
    db && profile?.companyId ? collection(db, "companies", profile.companyId, "clients") : null, 
    [db, profile?.companyId]
  );
  
  const ordersQuery = useMemoFirebase(() => 
    db && profile?.companyId ? query(
      collection(db, "companies", profile.companyId, "workOrders"), 
      where("status", "==", "aprobada")
    ) : null, 
    [db, profile?.companyId]
  );

  const { data: clients } = useCollection<Client>(clientsQuery);
  const { data: approvedOrders } = useCollection<WorkOrder>(ordersQuery);

  const selectedClient = useMemo(() => clients?.find(c => c.id === clientId), [clients, clientId]);
  const selectedOrder = useMemo(() => approvedOrders?.find(o => o.id === workOrderId), [approvedOrders, workOrderId]);

  // Validar si la empresa tiene sus datos configurados
  const isCompanyConfigured = useMemo(() => {
    return company?.rut && company?.rut !== "RUT por definir" && company?.name;
  }, [company]);

  // Al seleccionar una OT, autocompletar ítems incluyendo materiales
  useEffect(() => {
    if (selectedOrder && db && profile?.companyId) {
      setClientId(selectedOrder.clientId);
      
      const fetchOrderParts = async () => {
        setIsFetchingParts(true);
        try {
          const partsCol = collection(db, "companies", profile.companyId, "workOrders", selectedOrder.id, "partUsages");
          const partsSnap = await getDocs(partsCol);
          
          const materials: BillingItem[] = partsSnap.docs.map(d => {
            const data = d.data();
            return {
              description: `Repuesto: ${data.partName}`,
              quantity: data.quantity,
              unitPrice: data.unitPrice,
              total: data.quantity * data.unitPrice
            };
          });

          const mainService: BillingItem = {
            description: `Servicio técnico OT: ${selectedOrder.id} - ${selectedOrder.description.substring(0, 50)}`,
            quantity: selectedOrder.serviceQuantity || 1,
            unitPrice: 0,
            total: 0
          };

          setItems([mainService, ...materials]);
          
          if (materials.length > 0) {
            toast({
              title: "Materiales Importados",
              description: `Se han añadido ${materials.length} repuestos desde la OT ${selectedOrder.id}.`,
            });
          }
        } catch (e) {
          console.error("Error fetching parts for billing:", e);
        } finally {
          setIsFetchingParts(false);
        }
      };

      fetchOrderParts();
    }
  }, [selectedOrder, db, profile?.companyId, toast]);

  const totals = useMemo(() => {
    const net = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const tax = Math.round(net * 0.19);
    const total = net + tax;
    return { net, tax, total };
  }, [items]);

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof BillingItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      item.total = item.quantity * item.unitPrice;
    }
    newItems[index] = item;
    setItems(newItems);
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || items.length === 0 || !profile?.companyId) return;

    setIsSubmitting(true);
    try {
      const docData = {
        companyId: profile.companyId,
        clientId,
        clientName: selectedClient?.name || "Desconocido",
        clientRut: selectedClient?.rut || "Desconocido",
        workOrderId: workOrderId || null,
        type,
        status: "pendiente",
        items,
        netAmount: totals.net,
        taxAmount: totals.tax,
        totalAmount: totals.total,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const colRef = collection(db!, "companies", profile.companyId, "billingDocuments");
      await addDocumentNonBlocking(colRef, docData);

      toast({ title: "Borrador Guardado", description: "El documento ha sido guardado exitosamente." });
      router.push("/billing");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmitRealDTE = async () => {
    if (!isCompanyConfigured) {
      toast({ 
        title: "Perfil Incompleto", 
        description: "Debe configurar el RUT de su empresa en la sección 'Mi Empresa' antes de emitir documentos.", 
        variant: "destructive" 
      });
      return;
    }

    if (!clientId || items.length === 0 || !profile?.companyId || !company) {
      toast({ title: "Faltan Datos", description: "Asegúrese de seleccionar un cliente y tener ítems en el documento.", variant: "destructive" });
      return;
    }

    setIsEmitting(true);
    try {
      const docData = {
        companyId: profile.companyId,
        clientId,
        clientName: selectedClient?.name || "Desconocido",
        clientRut: selectedClient?.rut || "Desconocido",
        clientAddress: selectedClient?.address || "S/I",
        workOrderId: (workOrderId && workOrderId !== 'none') ? workOrderId : null,
        type,
        status: "pendiente",
        items,
        netAmount: totals.net,
        taxAmount: totals.tax,
        totalAmount: totals.total,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      toast({ title: isSandbox ? "Conectando con Sandbox SII..." : "Emitiendo documento REAL...", description: "Construyendo DTE y validando Token..." });
      
      const apiResult = await processElectronicEmission(docData, {
        rut: company.rut,
        name: company.name,
        address: company.address
      }, isSandbox);

      if (apiResult.success) {
        const colRef = collection(db!, "companies", profile.companyId, "billingDocuments");
        await addDoc(colRef, {
          ...docData,
          folio: apiResult.folio,
          status: 'aceptado_sii',
          pdfUrl: apiResult.pdfUrl,
          xmlUrl: apiResult.xmlUrl,
          isSandbox: isSandbox,
          updatedAt: serverTimestamp()
        });

        toast({ 
          title: isSandbox ? "Prueba Exitosa" : "DTE Emitido con Éxito", 
          description: `Folio #${apiResult.folio} generado correctamente.`,
          variant: "default"
        });
        router.push("/billing");
      } else {
        throw new Error(apiResult.error);
      }

    } catch (e: any) {
      toast({ title: "Falla en Emisión", description: e.message, variant: "destructive" });
    } finally {
      setIsEmitting(false);
    }
  };

  if (isUserLoading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  // Bloqueo por plan
  if (!canBill) {
    return (
      <div className="h-[80vh] flex items-center justify-center p-6">
        <Card className="max-w-md w-full rounded-[2.5rem] border-none shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
          <div className="bg-slate-900 p-10 text-center space-y-6">
            <div className="bg-blue-600/20 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto border border-blue-500/30">
              <Lock className="h-10 w-10 text-blue-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Acceso Denegado</h2>
              <p className="text-slate-400 text-sm font-medium">La emisión de DTEs no está disponible en el <strong>{planName}</strong>.</p>
            </div>
            <Button asChild className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 font-black uppercase tracking-widest gap-2">
              <Link href="/subscription">Ver Planes de Facturación <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/billing"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <h2 className="text-3xl font-black tracking-tight italic">Emisión de Documento</h2>
          <p className="text-sm text-muted-foreground uppercase font-bold tracking-widest">Facturación Electrónica DTE</p>
        </div>
      </div>

      {!isCompanyConfigured && (
        <Alert variant="destructive" className="border-2 rounded-2xl bg-rose-50 border-rose-200">
          <AlertTriangle className="h-5 w-5 text-rose-600" />
          <AlertTitle className="font-black uppercase text-xs">Acción Requerida: Configuración de Empresa</AlertTitle>
          <AlertDescription className="text-sm font-medium">
            Tu empresa aún no tiene un RUT válido registrado. El SII rechazará cualquier documento sin estos datos.
            <Button variant="link" className="text-rose-700 font-bold p-0 h-auto underline ml-2" asChild>
              <Link href="/company">Ir a Configurar Mi Empresa <Settings className="ml-1 h-3 w-3" /></Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b p-8">
              <CardTitle className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter">
                <Receipt className="h-6 w-6 text-primary" /> Encabezado del Documento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase text-slate-400 tracking-[0.2em]">Tipo de Documento *</Label>
                  <Select value={type} onValueChange={(v: any) => setType(v)}>
                    <SelectTrigger className="h-12 rounded-xl border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="factura">Factura Electrónica</SelectItem>
                      <SelectItem value="boleta">Boleta Electrónica</SelectItem>
                      <SelectItem value="guia_despacho">Guía de Despacho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase text-slate-400 tracking-[0.2em]">Vincular OT Aprobada</Label>
                  <Select value={workOrderId} onValueChange={setWorkOrderId}>
                    <SelectTrigger className={cn(
                      "h-12 rounded-xl border-2 border-blue-100 bg-blue-50/30",
                      isFetchingParts && "opacity-50 pointer-events-none"
                    )}>
                      <SelectValue placeholder={isFetchingParts ? "Importando materiales..." : "Seleccione OT..."} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin OT vinculada</SelectItem>
                      {approvedOrders?.map(ot => (
                        <SelectItem key={ot.id} value={ot.id}>{ot.id} - {ot.description.slice(0, 30)}...</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase text-slate-400 tracking-[0.2em]">Selección de Cliente *</Label>
                <Select value={clientId} onValueChange={setClientId} disabled={!!workOrderId && workOrderId !== 'none'}>
                  <SelectTrigger className="h-12 rounded-xl border-2">
                    <SelectValue placeholder="Buscar cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name} ({c.rut})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-black text-[10px] uppercase text-slate-400 tracking-[0.2em]">Detalle de Ítems</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="rounded-xl h-8 text-[10px] font-black uppercase">
                    <Plus className="h-3 w-3 mr-1" /> Añadir Línea
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-3 px-1 opacity-60">
                    <div className="col-span-6"><Label className="text-[9px] font-black uppercase">Descripción</Label></div>
                    <div className="col-span-2"><Label className="text-[9px] font-black uppercase">Cant.</Label></div>
                    <div className="col-span-3"><Label className="text-[9px] font-black uppercase">Unitario ($)</Label></div>
                    <div className="col-span-1"></div>
                  </div>
                  
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-3 items-start">
                      <div className="col-span-6">
                        <Input 
                          placeholder="Descripción del servicio" 
                          value={item.description}
                          onChange={(e) => updateItem(idx, 'description', e.target.value)}
                          className="h-11 rounded-xl border-2"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input 
                          type="number" 
                          placeholder="0" 
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                          className="h-11 rounded-xl border-2 text-center"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input 
                          type="number" 
                          placeholder="Neto" 
                          value={item.unitPrice}
                          onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                          className="h-11 rounded-xl border-2"
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(idx)} className="h-11 w-11 rounded-xl text-rose-500 hover:bg-rose-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-[2rem] border-none shadow-xl bg-slate-900 text-white overflow-hidden sticky top-6">
            <CardHeader className="bg-white/5 border-b border-white/10 p-6">
              <CardTitle className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3">
                <Calculator className="h-4 w-4 text-blue-400" /> Resumen de Cobro
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Monto Neto</span>
                  <span className="font-black text-lg">${totals.net.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">IVA (19%)</span>
                  <span className="font-black text-lg">${totals.tax.toLocaleString()}</span>
                </div>
                <div className="h-px bg-white/10 my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-blue-400 font-black uppercase tracking-widest text-xs">Total a Pagar</span>
                  <span className="text-3xl font-black text-white">${totals.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Beaker className="h-4 w-4 text-amber-400" />
                    <Label className="text-[10px] font-black uppercase tracking-widest">Ambiente Pruebas</Label>
                  </div>
                  <Switch checked={isSandbox} onCheckedChange={setIsSandbox} />
                </div>
                <p className="text-[9px] text-slate-400 leading-relaxed italic">
                  {isSandbox 
                    ? "Activado: El documento se enviará al servidor de certificación del SII (sin valor legal)." 
                    : "⚠️ ADVERTENCIA: Se emitirá un documento tributario REAL ante el SII."}
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleEmitRealDTE}
                  disabled={isSubmitting || isEmitting || !clientId || items.length === 0 || !isCompanyConfigured}
                  className={cn(
                    "w-full h-16 rounded-2xl font-black text-lg shadow-xl uppercase tracking-widest gap-2",
                    isSandbox ? "bg-amber-600 hover:bg-amber-500" : "bg-blue-600 hover:bg-blue-500"
                  )}
                >
                  {isEmitting ? <Loader2 className="animate-spin h-6 w-6" /> : <><SendHorizontal className="h-5 w-5" /> {isSandbox ? "Emitir Test (Sandbox)" : "Emitir SII Real"}</>}
                </Button>

                <Button 
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting || isEmitting || !clientId || items.length === 0}
                  className="w-full h-12 rounded-xl bg-transparent border-white/20 text-white hover:bg-white/10 font-bold uppercase text-[10px] tracking-widest"
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Guardar Borrador Interno"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
