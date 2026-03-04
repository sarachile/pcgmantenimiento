
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  LifeBuoy, 
  Eye, 
  ArrowLeft,
  Loader2,
  Clock,
  AlertCircle,
  Building2,
  Filter
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { SupportTicket } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function AdminSupportPage() {
  const { isSuperAdmin, isLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");

  const ticketsQuery = useMemoFirebase(() => {
    if (!db || !isSuperAdmin) return null;
    return query(collection(db, "supportTickets"), orderBy("createdAt", "desc"));
  }, [db, isSuperAdmin]);

  const { data: tickets, isLoading: isTicketsLoading } = useCollection<SupportTicket>(ticketsQuery);

  const filtered = (tickets || []).filter(t => 
    t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isAuthLoading) {
    return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link href="/admin"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <h2 className="text-3xl font-black tracking-tight">Gestión de Tickets Global</h2>
            <p className="text-muted-foreground">Monitoreo y respuesta a requerimientos de todas las empresas SaaS.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase text-slate-400">Tickets Abiertos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-600">{tickets?.filter(t => t.status === 'open').length || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase text-slate-400">En Proceso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-600">{tickets?.filter(t => t.status === 'in_progress').length || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase text-slate-400">Urgentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-rose-600">{tickets?.filter(t => t.priority === 'urgent').length || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase text-slate-400">Resueltos (Mes)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600">{tickets?.filter(t => t.status === 'resolved').length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-3xl">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por asunto, empresa o usuario..." 
                className="pl-10 h-11 border-none bg-muted/20 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="rounded-xl h-11 w-11"><Filter className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isTicketsLoading ? (
            <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" /> Cargando requerimientos...</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground border-2 border-dashed m-6 rounded-3xl">
              No hay tickets que coincidan con la búsqueda.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-black uppercase text-[10px]">Empresa / Usuario</TableHead>
                  <TableHead className="font-black uppercase text-[10px]">Asunto / ID</TableHead>
                  <TableHead className="font-black uppercase text-[10px]">Prioridad</TableHead>
                  <TableHead className="font-black uppercase text-[10px]">Estado</TableHead>
                  <TableHead className="font-black uppercase text-[10px]">Fecha</TableHead>
                  <TableHead className="text-right font-black uppercase text-[10px]">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((ticket) => (
                  <TableRow key={ticket.id} className="hover:bg-muted/10">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 text-primary" /> {ticket.companyName}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{ticket.userName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[250px]">
                      <div className="flex flex-col">
                        <span className="font-bold truncate">{ticket.subject}</span>
                        <span className="text-[9px] font-mono text-muted-foreground">ID: {ticket.id.toUpperCase()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "text-[9px] font-black uppercase",
                        ticket.priority === 'urgent' ? "bg-rose-500" :
                        ticket.priority === 'high' ? "bg-amber-500" : "bg-slate-500"
                      )}>{ticket.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          ticket.status === 'open' ? "bg-blue-500" :
                          ticket.status === 'in_progress' ? "bg-amber-500" : "bg-emerald-500"
                        )} />
                        <span className="text-[10px] font-black uppercase">{ticket.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[10px] font-bold text-muted-foreground">
                      {format(ticket.createdAt.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild className="rounded-xl font-bold">
                        <Link href={`/support/${ticket.id}`}><Eye className="h-4 w-4 mr-2" /> Responder</Link>
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
