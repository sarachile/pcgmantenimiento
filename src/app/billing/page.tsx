
"use client";

import { useState, useMemo } from "react";
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
  FileText, 
  Receipt, 
  TrendingUp, 
  ArrowLeft,
  Loader2,
  Download,
  Filter,
  MoreVertical,
  Calendar,
  ExternalLink
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { BillingDocument } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function BillingPage() {
  const { profile, isLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");

  const billingQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return query(
      collection(db, "companies", profile.companyId, "billingDocuments"),
      orderBy("createdAt", "desc")
    );
  }, [db, profile?.companyId]);

  const { data: documents, isLoading: isDocsLoading } = useCollection<BillingDocument>(billingQuery);

  const filtered = (documents || []).filter(doc => 
    doc.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.folio?.toString().includes(searchTerm)
  );

  const stats = useMemo(() => {
    const docs = documents || [];
    const totalVentas = docs.reduce((acc, d) => d.status === 'emitido' || d.status === 'aceptado_sii' ? acc + d.totalAmount : acc, 0);
    const pendingCount = docs.filter(d => d.status === 'pendiente').length;
    const emitidosMes = docs.filter(d => {
      const date = d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt);
      return date.getMonth() === new Date().getMonth();
    }).length;

    return { totalVentas, pendingCount, emitidosMes };
  }, [documents]);

  if (isAuthLoading) {
    return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 italic">Facturación Electrónica</h2>
            <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">Gestión de DTEs y Cobranzas</p>
          </div>
        </div>
        <Button asChild className="rounded-xl shadow-lg h-12 px-6 font-black gap-2">
          <Link href="/billing/new">
            <Plus className="h-5 w-5" /> Emitir Documento
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-blue-600 text-white overflow-hidden relative group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp className="h-32 w-32" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">Facturación Total (Mes)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">${stats.totalVentas.toLocaleString()}</div>
            <p className="text-[10px] font-bold text-blue-200 mt-1 uppercase">Monto Neto + IVA</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-emerald-600 text-white overflow-hidden relative group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <FileText className="h-32 w-32" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100">Documentos Emitidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.emitidosMes}</div>
            <p className="text-[10px] font-bold text-emerald-200 mt-1 uppercase">Folios Consumidos</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-amber-500 text-white overflow-hidden relative group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <Receipt className="h-32 w-32" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100">Por Facturar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.pendingCount}</div>
            <p className="text-[10px] font-bold text-amber-100 mt-1 uppercase">Borradores Pendientes</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="pb-3 bg-white">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por cliente, folio o ID..." 
                className="pl-10 h-11 border-none bg-muted/20 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="rounded-xl h-11 w-11"><Filter className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isDocsLoading ? (
            <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed m-6 rounded-3xl bg-slate-50/50">
              <Receipt className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <p className="font-bold text-slate-500">No hay documentos registrados</p>
              <Button asChild className="mt-4 rounded-xl font-bold" variant="outline">
                <Link href="/billing/new">Emitir mi primera factura</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest pl-6">Tipo / Folio</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Cliente / RUT</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Fecha</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Total</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Estado</TableHead>
                  <TableHead className="text-right font-black uppercase text-[10px] tracking-widest pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((doc) => (
                  <TableRow key={doc.id} className="hover:bg-muted/5 transition-colors">
                    <TableCell className="pl-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 uppercase text-xs">{doc.type.replace('_', ' ')}</span>
                        <span className="text-[10px] font-bold text-primary font-mono">#{doc.folio || 'BORRADOR'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-slate-700">{doc.clientName}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{doc.clientRut}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                        <Calendar className="h-3 w-3" />
                        {doc.createdAt ? format(doc.createdAt.toDate ? doc.createdAt.toDate() : new Date(doc.createdAt), "dd MMM yyyy", { locale: es }) : '...'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-black text-slate-900">${doc.totalAmount.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "text-[9px] font-black uppercase tracking-tighter",
                        doc.status === 'pendiente' && "bg-amber-100 text-amber-700",
                        doc.status === 'emitido' && "bg-blue-100 text-blue-700",
                        doc.status === 'aceptado_sii' && "bg-emerald-100 text-emerald-700",
                        doc.status === 'anulado' && "bg-rose-100 text-rose-700"
                      )}>
                        {doc.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-xl"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-none shadow-xl w-48">
                          <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400">Documento</DropdownMenuLabel>
                          {doc.pdfUrl && (
                            <DropdownMenuItem className="font-bold gap-2" asChild>
                              <a href={doc.pdfUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" /> Descargar PDF
                              </a>
                            </DropdownMenuItem>
                          )}
                          {doc.xmlUrl && (
                            <DropdownMenuItem className="font-bold gap-2" asChild>
                              <a href={doc.xmlUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" /> Ver XML (SII)
                              </a>
                            </DropdownMenuItem>
                          )}
                          {!doc.pdfUrl && <DropdownMenuItem className="font-bold gap-2 italic text-slate-400">Sin archivo disponible</DropdownMenuItem>}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-rose-600 font-bold gap-2"><ArrowLeft className="h-4 w-4" /> Anular Documento</DropdownMenuItem>
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
