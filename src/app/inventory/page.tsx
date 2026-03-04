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
  Search, 
  Plus, 
  Package, 
  AlertCircle,
  TrendingDown,
  MoreVertical,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { MOCK_SPARE_PARTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function InventoryPage() {
  const { profile, isLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [open, setOpen] = useState(false);

  // Form states
  const [newItem, setNewItem] = useState({
    name: "",
    sku: "",
    stockActual: "",
    stockMinimo: "",
    unitPrice: ""
  });

  const inventoryQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return collection(db, "companies", profile.companyId, "spareParts");
  }, [db, profile?.companyId]);

  const { data: realParts, isLoading: isPartsLoading } = useCollection(inventoryQuery);

  const parts = realParts && realParts.length > 0 ? realParts : MOCK_SPARE_PARTS;
  const isDemo = !realParts || realParts.length === 0;

  const filtered = parts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.companyId || !db) return;

    if (!newItem.name || !newItem.sku || !newItem.stockActual) {
      toast({
        title: "Campos incompletos",
        description: "Por favor complete los campos obligatorios.",
        variant: "destructive"
      });
      return;
    }

    setIsAdding(true);
    try {
      const colRef = collection(db, "companies", profile.companyId, "spareParts");
      await addDocumentNonBlocking(colRef, {
        companyId: profile.companyId,
        name: newItem.name,
        sku: newItem.sku,
        stockActual: Number(newItem.stockActual),
        stockMinimo: Number(newItem.stockMinimo) || 0,
        unitPrice: Number(newItem.unitPrice) || 0,
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Ítem registrado",
        description: `${newItem.name} ha sido añadido al catálogo.`,
      });
      
      setNewItem({ name: "", sku: "", stockActual: "", stockMinimo: "", unitPrice: "" });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo registrar el ítem.",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  if (isAuthLoading) {
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
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Inventario de Insumos</h2>
            <p className="text-muted-foreground">Gestión de materiales, repuestos y recursos para mantenimiento.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
             <TrendingDown className="mr-2 h-4 w-4" /> Ajuste de Stock
          </Button>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nuevo Ítem
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Ítem</DialogTitle>
                <DialogDescription>
                  Añada un nuevo material o insumo al catálogo maestro de su empresa.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateItem} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Ítem *</Label>
                  <Input 
                    id="name" 
                    placeholder="Ej: Filtro de Aire, Aceite 10W40..." 
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">Referencia / SKU *</Label>
                  <Input 
                    id="sku" 
                    placeholder="Código interno o de fabricante" 
                    value={newItem.sku}
                    onChange={(e) => setNewItem({...newItem, sku: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Inicial *</Label>
                    <Input 
                      id="stock" 
                      type="number" 
                      value={newItem.stockActual}
                      onChange={(e) => setNewItem({...newItem, stockActual: e.target.value})}
                      required
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
                <DialogFooter>
                  <Button type="submit" disabled={isAdding}>
                    {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    Guardar en Catálogo
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
            {isDemo && <Badge variant="outline" className="text-amber-600 border-amber-200">DEMO</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          {isPartsLoading ? (
            <div className="py-10 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Cargando catálogo...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ítem / Referencia (SKU)</TableHead>
                  <TableHead>Precio Unitario</TableHead>
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
                    <TableCell className="text-sm font-medium">
                      ${Number(part.unitPrice || 0).toLocaleString()}
                    </TableCell>
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
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
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