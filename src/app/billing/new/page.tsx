
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  useUser, 
  useFirestore, 
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
  Package
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Client, WorkOrder, BillingItem, BillingDocumentType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { processElectronicEmission } from "@/actions/billing";

export default function NewBillingDocumentPage() {
  const { profile, isLoading: isUserLoading } = useUser();
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

  // Consultas
  const clientsQuery = useMemoFirebase(() => 
    db && profile?.companyId ? collection(db, "companies", profile.companyId, "clients") : null, 
    [db, profile?.companyId]
  );
  
  // Solo OTs aprobadas para facturar
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
            description: `Servicio técnico OT: ${selectedOrder.id} - ${selectedOrder.description}`,
            quantity: selectedOrder.serviceQuantity || 1,
            unitPrice: 0, // El usuario debe definir el precio de mano de obra
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

  /**
   * Solo guarda el borrador en Firestore
   */
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

  /**
   * Ejecuta la emisión real vía SimpleAPI
   */
  const handleEmitRealDTE = async () => {
    if (!clientId || items.length === 0 || !profile?.companyId) return;

    setIsEmitting(true);
    try {
      // 1. Guardar primero en Firestore para tener registro
      const docData = {
        companyId: profile.companyId,
        clientId,
        clientName: selectedClient?.name || "Desconocido",
        clientRut: selectedClient?.rut || "Desconocido",
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

      const colRef = collection(db!, "companies", profile.companyId, "billingDocuments");
      const savedDoc = await addDoc(colRef, docData);

      // 2. Llamar al Server Action para emitir en el SII (vía SimpleAPI)
      toast({ title: "Conectando con SimpleAPI...", description: "Emitiendo documento legal ante el SII." });
      
      const apiResult = await processElectronicEmission({
        ...docData,
        clientAddress: selectedClient?.address
      });

      if (apiResult.success) {
        // 3. Actualizar el documento con Folio y Links reales
        const docRef = doc(db!, "companies", profile.companyId, "billingDocuments", savedDoc.id);
        updateDocumentNonBlocking(docRef, {
          folio: apiResult.folio,
          status: 'aceptado_sii',
          pdfUrl: apiResult.pdfUrl,
          xmlUrl: apiResult.xmlUrl,
          updatedAt: serverTimestamp()
        });

        toast({ 
          title: "DTE Emitido con Éxito", 
          description: `Folio #${apiResult.folio} generado y aceptado por el SII.`,
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild><Link href="/billing"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <h2 className="text-3xl font-black tracking-tight italic">Emisión de Documento</h2>
          <p className="text-sm text-muted-foreground uppercase font-bold tracking-widest">Facturación Electrónica DTE</p>
        </div>
      </div>

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
                  <Label className="font-black text-[10px] uppercase text-slate-400 tracking-[0.2em]">Vincular OT Aprobada (Opcional)</Label>
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
                  {isFetchingParts && <p className="text-[10px] text-blue-600 font-bold animate-pulse">Sincronizando repuestos usados...</p>}
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

                {/* Encabezado de Columnas */}
                {items.length > 0 && (
                  <div className="flex gap-3 px-1 mb-[-12px] opacity-60">
                    <div className="flex-[4]"><Label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Descripción del Producto o Servicio</Label></div>
                    <div className="flex-[1] min-w-[80px] text-center"><Label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Cant.</Label></div>
                    <div className="flex-[2] min-w-[120px]"><Label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Precio Unit. ($)</Label></div>
                    <div className="w-11"></div>
                  </div>
                )}
                
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-start animate-in fade-in slide-in-from-top-1">
                      <div className="flex-[4] space-y-1">
                        <div className="relative">
                          {item.description.startsWith("Repuesto:") && <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-500" />}
                          <Input 
                            placeholder="Ej: Mantención de Climatización Central" 
                            value={item.description}
                            onChange={(e) => updateItem(idx, 'description', e.target.value)}
                            className={cn(
                              "h-11 rounded-xl border-2 focus:border-primary",
                              item.description.startsWith("Repuesto:") && "pl-9 bg-amber-50/20"
                            )}
                          />
                        </div>
                      </div>
                      <div className="flex-[1] min-w-[80px]">
                        <Input 
                          type="number" 
                          placeholder="0" 
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                          className="h-11 rounded-xl border-2 text-center"
                        />
                      </div>
                      <div className="flex-[2] min-w-[120px]">
                        <Input 
                          type="number" 
                          placeholder="Monto neto" 
                          value={item.unitPrice}
                          onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                          className="h-11 rounded-xl border-2"
                        />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(idx)} className="h-11 w-11 rounded-xl text-rose-500 hover:bg-rose-50 shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {items.length === 0 && (
                    <div className="py-10 text-center border-2 border-dashed rounded-2xl bg-slate-50/50">
                      <p className="text-sm font-medium text-slate-400">Presione "Añadir Línea" para ingresar ítems a la factura.</p>
                    </div>
                  )}
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

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 mt-0.5" />
                  <p className="text-[10px] text-slate-300 leading-relaxed italic">
                    La emisión oficial consumirá un folio de su certificado digital y enviará los datos al SII.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleEmitRealDTE}
                  disabled={isSubmitting || isEmitting || !clientId || items.length === 0}
                  className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-lg shadow-xl shadow-blue-900/20 uppercase tracking-widest gap-2"
                >
                  {isEmitting ? <Loader2 className="animate-spin h-6 w-6" /> : <><SendHorizontal className="h-5 w-5" /> Emitir SII</>}
                </Button>

                <Button 
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting || isEmitting || !clientId || items.length === 0}
                  className="w-full h-12 rounded-xl bg-transparent border-white/20 text-white hover:bg-white/10 font-bold uppercase text-[10px] tracking-widest"
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Guardar Borrador"}
                </Button>
              </div>
              
              <p className="text-[9px] text-center text-slate-500 font-black uppercase tracking-widest">
                PCGMANTENIMIENTO ERP - Módulo Billing
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
