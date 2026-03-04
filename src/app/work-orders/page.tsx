
"use client";

import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Filter, 
  Plus, 
  Eye, 
  MoreVertical,
  Trash2,
  Loader2,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function WorkOrdersPage() {
  const { profile, isLoading: isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  // Query memoizada para obtener las OTs de la empresa actual
  const workOrdersQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return collection(db, "companies", profile.companyId, "workOrders");
  }, [db, profile?.companyId]);

  const { data: workOrders, isLoading: isOrdersLoading } = useCollection(workOrdersQuery);

  const handleDelete = (id: string) => {
    if (!profile?.companyId) return;
    const docRef = doc(db, "companies", profile.companyId, "workOrders", id);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: "Orden eliminada",
      description: "La orden de trabajo ha sido eliminada del sistema.",
    });
  };

  const filteredOTs = (workOrders || []).filter(ot => 
    ot.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ot.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Órdenes de Trabajo</h2>
            <p className="text-muted-foreground">Administre y supervise todas las órdenes de trabajo de su empresa.</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/work-orders/new">
            <Plus className="mr-2 h-4 w-4" /> Crear Orden
          </Link>
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por ID o descripción..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isOrdersLoading ? (
            <div className="py-10 text-center text-muted-foreground">
              <Loader2 className="mx-auto h-8 w-8 animate-spin mb-2" />
              Cargando órdenes...
            </div>
          ) : filteredOTs.length === 0 ? (
            <div className="py-10 text-center border rounded-lg border-dashed">
              <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-lg font-medium">No se encontraron órdenes</p>
              <p className="text-sm text-muted-foreground mb-4">Comience creando una nueva orden de trabajo.</p>
              <Button variant="outline" asChild>
                <Link href="/work-orders/new">Nueva OT</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>ID</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOTs.map((ot) => (
                  <TableRow key={ot.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-bold text-primary truncate max-w-[100px]">{ot.id}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{ot.description}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        ot.status === 'creada' && "bg-blue-100 text-blue-700",
                        ot.status === 'asignada' && "bg-indigo-100 text-indigo-700",
                        ot.status === 'ejecutada' && "bg-purple-100 text-purple-700",
                        ot.status === 'en revision' && "bg-amber-100 text-amber-700",
                        ot.status === 'aprobada' && "bg-emerald-100 text-emerald-700",
                        ot.status === 'rechazada' && "bg-rose-100 text-rose-700"
                      )}>
                        {ot.status.charAt(0).toUpperCase() + ot.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {ot.createdAt ? (ot.createdAt.toDate ? ot.createdAt.toDate().toLocaleDateString() : new Date(ot.createdAt).toLocaleDateString()) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild title="Ver Detalle">
                          <Link href={`/work-orders/${ot.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/work-orders/${ot.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> Ver Detalles
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-rose-600" onClick={() => handleDelete(ot.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
