
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
  ShieldCheck, 
  Eye, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { MOCK_WORK_ORDERS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function ReviewsPage() {
  const { profile, isLoading: isAuthLoading, isReviewer, isSupervisor, isCompanyAdmin } = useUser();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const reviewsQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return query(
      collection(db, "companies", profile.companyId, "workOrders"),
      where("status", "==", "en revision")
    );
  }, [db, profile?.companyId]);

  const { data: realReviews, isLoading: isReviewsLoading } = useCollection(reviewsQuery);

  const reviews = realReviews && realReviews.length > 0 
    ? realReviews 
    : MOCK_WORK_ORDERS.filter(ot => ot.status === 'en revision');
  
  const isDemo = !realReviews || realReviews.length === 0;

  const filtered = reviews.filter(ot => 
    ot.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ot.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: any) => {
    if (!mounted || !date) return '...';
    try {
      if (typeof date === 'string') return new Date(date).toLocaleDateString();
      if (date?.toDate) return date.toDate().toLocaleDateString();
      return new Date(date).toLocaleDateString();
    } catch (e) {
      return 'N/A';
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
            <h2 className="text-3xl font-bold tracking-tight">Centro de Revisiones</h2>
            <p className="text-muted-foreground">Órdenes de trabajo esperando validación técnica o administrativa.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-700">
              <AlertCircle className="h-4 w-4" />
              Pendientes de Revisión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">{reviews.length}</div>
          </CardContent>
        </Card>
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
            {isDemo && <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">MODO DEMO</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          {isReviewsLoading ? (
            <div className="py-10 text-center text-muted-foreground font-medium">
               <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
               Cargando revisiones...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <ShieldCheck className="h-12 w-12 text-emerald-500 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium text-muted-foreground">No hay órdenes pendientes de revisión.</p>
              <p className="text-sm text-muted-foreground">¡Todo al día!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>OT / Fecha Ejecución</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado Actual</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((ot) => (
                  <TableRow key={ot.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-primary">{ot.id}</span>
                        <span className="text-xs text-muted-foreground">Ejecutada: {formatDate(ot.executedAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[400px]">
                      <p className="text-sm line-clamp-2">{ot.description}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        {ot.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/work-orders/${ot.id}`}>
                          <Eye className="mr-2 h-4 w-4" /> Revisar Detalle
                        </Link>
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
