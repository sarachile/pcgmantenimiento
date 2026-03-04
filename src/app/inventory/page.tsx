
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
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { MOCK_SPARE_PARTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function InventoryPage() {
  const { profile, isLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");

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
            <h2 className="text-3xl font-bold tracking-tight">Inventario</h2>
            <p className="text-muted-foreground">Gestión de insumos y materiales para mantenimiento.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
             <TrendingDown className="mr-2 h-4 w-4" /> Bajar Stock
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Repuesto
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Items en Inventario</CardTitle>
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
              {parts.filter(p => p.stockActual <= p.stockMinimo).length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Estimado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              ${parts.reduce((acc, p) => acc + (p.stockActual * p.unitPrice), 0).toLocaleString()}
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
              Cargando inventario...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repuesto / SKU</TableHead>
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
                      ${part.unitPrice.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "font-bold",
                        part.stockActual <= part.stockMinimo ? "text-rose-600" : "text-foreground"
                      )}>
                        {part.stockActual}
                      </span>
                    </TableCell>
                    <TableCell>
                      {part.stockActual <= part.stockMinimo ? (
                        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                          <AlertCircle className="mr-1 h-3 w-3" /> CRÍTICO
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          ÓPTIMO
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
