
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Plus, 
  Package, 
  AlertCircle, 
  MoreVertical,
  Loader2,
  ArrowLeft,
  Settings2,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp, addDoc, doc, increment } from "firebase/firestore";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function InventoryPage() {
  const { profile, isLoading: isAuthLoading, isTechnician, isSupervisor, isCompanyAdmin } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form states for new item
  const [newItem, setNewItem] = useState({
    name: "",
    sku: "",
    stockActual: "",
    stockMinimo: "",
    unitPrice: ""
  });

  // Form states for adjustment
  const [adjustment, setAdjustment] = useState({
    type: "entrada", // entrada o salida
    quantity: "",
    reason: ""
  });

  const inventoryQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return collection(db, "companies", profile.companyId, "spareParts");
  }, [db, profile?.companyId]);

  const { data: realParts, isLoading: isPartsLoading } = useCollection(inventoryQuery);

  const parts = realParts || [];

  const filtered = parts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !profile?.companyId) return;

    const colRef = collection(db, "companies", profile.companyId, "spareParts");
    const itemData = {
      companyId: profile.companyId,
      name: newItem.name || "Nombre por definir",
      sku: newItem.sku || "SKU por definir",
      stockActual: Number(newItem.stockActual) || 0,
      stockMinimo: Number(newItem.stockMinimo) || 0,
      unitPrice: Number(newItem.unitPrice) || 0,
      createdAt: serverTimestamp(),
    };

    addDoc(colRef, itemData);
    
    toast({
      title: "Ítem registrado",
      description: `${itemData.name} ha sido añadido al catálogo.`,
    });
    
    setNewItem({ name: "", sku: "", stockActual: "", stockMinimo: "", unitPrice: "" });
    setIsCreateOpen(false);
  };

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    
    const qty = Number(adjustment.quantity);
    if (isNaN(qty) || qty <= 0) {
      toast({
        title: "Cantidad inválida",
        description: "Por favor ingrese una cantidad mayor a 0.",
        variant: "destructive"
      });
      return;
    }

    if (!db || !profile?.companyId || !selectedItem) return;

    const finalQty = adjustment.type === "entrada" ? qty : -qty;
    const partRef = doc(db, "companies", profile.companyId, "spareParts", selectedItem.id);

    updateDocumentNonBlocking(partRef, {
      stockActual: increment(finalQty)
    });

    toast({
      title: "Stock Ajustado",
      description: `Se ha registrado una ${adjustment.type} de ${qty} unidades para ${selectedItem.name}.`,
    });

    setIsAdjustOpen(false);
    setSelectedItem(null);
    setAdjustment({ type: "entrada", quantity: "", reason: "" });
  };

  const openAdjustDialog = (item: any, type: "entrada" | "salida") => {
    setSelectedItem(item);
    setAdjustment({ ...adjustment, type });
    setIsAdjustOpen(true);
  };

  const handleDeleteItem = (item: any) => {
    if (!db || !profile?.companyId) return;

    const partRef = doc(db, "companies", profile.companyId, "spareParts", item.id);
    deleteDocumentNonBlocking(partRef);
    toast({ title: "Ítem eliminado", description: `${item.name} ha sido removido del catálogo.` });
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const showPrices = isCompanyAdmin || isSupervisor;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild title="Volver al escritorio">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Inventario de Insumos</h2>
            <p className="text-muted-foreground">Gestión de materiales y repuestos para mantenimiento.</p>
          </div>
        </div>
        
        {showPrices && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nuevo Ítem
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Ítem</DialogTitle>
                <DialogDescription>
                  Añada un nuevo material o insumo al catálogo maestro.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateItem} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Ítem</Label>
                  <Input 
                    id="name" 
                    placeholder="Ej: Filtro de Aire, Aceite 10W40..." 
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">Referencia / SKU</Label>
                  <Input 
                    id="sku" 
                    placeholder="Código interno" 
                    value={newItem.sku}
                    onChange={(e) => setNewItem({...newItem, sku: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Inicial</Label>
                    <Input 
                      id="stock" 
                      type="number" 
                      value={newItem.stockActual}
                      onChange={(e) => setNewItem({...newItem, stockActual: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-stock">Stock Mínimo</Label>
                    <Input 
                      id="min-stock" 
                      type="number" 
                      value={newItem.stockMinimo}
                      onChange={(e) => setNewItem({...newItem, stockMinimo: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Precio Unitario ($)</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({...newItem, unitPrice: e.target.value})}
                  />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Guardar en Catálogo
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ajustar Stock: {selectedItem?.name}</DialogTitle>
            <DialogDescription>
              {adjustment.type === 'entrada' ? 'Registre el ingreso de material al inventario.' : 'Registre la salida o merma de material.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdjustStock} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Ajuste</Label>
                <Select 
                  value={adjustment.type} 
                  onValueChange={(val) => setAdjustment({...adjustment, type: val as "entrada" | "salida"})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada (+)</SelectItem>
                    <SelectItem value="salida">Salida (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input 
                  type="number" 
                  placeholder="0"
                  value={adjustment.quantity}
                  onChange={(e) => setAdjustment({...adjustment, quantity: e.target.value})}
                  required
                  min="1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Motivo (Opcional)</Label>
              <Input 
                placeholder="Ej: Cuadratura inventario físico..." 
                value={adjustment.reason}
                onChange={(e) => setAdjustment({...adjustment, reason: e.target.value})}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full">
                <Settings2 className="h-4 w-4 mr-2" />
                Aplicar Ajuste
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ítems Registrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parts.length}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stock Crítico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {parts.filter(p => Number(p.stockActual) <= Number(p.stockMinimo)).length}
            </div>
          </CardContent>
        </Card>
        {showPrices && (
          <Card className="border-none shadow-sm bg-emerald-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Valor Estimado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                ${parts.reduce((acc, p) => acc + (Number(p.stockActual) * Number(p.unitPrice || 0)), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre o SKU..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isPartsLoading ? (
            <div className="py-10 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Cargando catálogo...
            </div>
          ) : parts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border rounded-lg border-dashed">
              No hay materiales registrados en el inventario.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ítem / Referencia (SKU)</TableHead>
                  {showPrices && <TableHead>Precio Unitario</TableHead>}
                  <TableHead>Stock Actual</TableHead>
                  <TableHead>Estado Stock</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((part) => (
                  <TableRow key={part.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/5 p-2 rounded-lg">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold">{part.name}</span>
                          <span className="text-xs text-muted-foreground font-mono">{part.sku}</span>
                        </div>
                      </div>
                    </TableCell>
                    {showPrices && (
                      <TableCell className="text-sm font-medium">
                        ${Number(part.unitPrice || 0).toLocaleString()}
                      </TableCell>
                    )}
                    <TableCell>
                      <span className={cn(
                        "font-bold",
                        Number(part.stockActual) <= Number(part.stockMinimo) ? "text-rose-600" : "text-foreground"
                      )}>
                        {part.stockActual}
                      </span>
                    </TableCell>
                    <TableCell>
                      {Number(part.stockActual) <= Number(part.stockMinimo) ? (
                        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                          <AlertCircle className="mr-1 h-3 w-3" /> BAJO STOCK
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          DISPONIBLE
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>Gestión de Stock</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openAdjustDialog(part, "entrada")}>
                            <TrendingUp className="mr-2 h-4 w-4 text-emerald-500" /> Registrar Ingreso
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openAdjustDialog(part, "salida")}>
                            <TrendingDown className="mr-2 h-4 w-4 text-rose-500" /> Registrar Salida
                          </DropdownMenuItem>
                          {showPrices && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Opciones Ítem</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" /> Editar Datos
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-rose-600"
                                onClick={() => handleDeleteItem(part)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar del Catálogo
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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