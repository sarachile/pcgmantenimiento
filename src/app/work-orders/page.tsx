
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
  Search, 
  Filter, 
  Plus, 
  Eye, 
  MoreVertical 
} from "lucide-react";
import Link from "next/link";
import { MOCK_WORK_ORDERS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function WorkOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOTs = MOCK_WORK_ORDERS.filter(ot => 
    ot.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ot.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Órdenes de Trabajo</h2>
          <p className="text-muted-foreground">Administre y supervise todas las órdenes de trabajo de su empresa.</p>
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
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>ID</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead>Asignado A</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOTs.map((ot) => (
                <TableRow key={ot.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="font-bold text-primary">{ot.id}</TableCell>
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
                    {new Date(ot.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {ot.assignedTo ? 'Técnico Asignado' : 'Sin Asignar'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/work-orders/${ot.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
