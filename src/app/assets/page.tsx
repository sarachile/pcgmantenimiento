
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
  Construction, 
  MapPin, 
  History,
  MoreVertical,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { MOCK_ASSETS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AssetsPage() {
  const { profile, isLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const assetsQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return collection(db, "companies", profile.companyId, "assets");
  }, [db, profile?.companyId]);

  const { data: realAssets, isLoading: isAssetsLoading } = useCollection(assetsQuery);

  const assets = realAssets && realAssets.length > 0 ? realAssets : MOCK_ASSETS;
  const isDemo = !realAssets || realAssets.length === 0;

  const filtered = assets.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.code.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h2 className="text-3xl font-bold tracking-tight">Activos y Equipos</h2>
            <p className="text-muted-foreground">Catálogo maestro de maquinaria sujeta a mantenimiento.</p>
          </div>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Activo
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre o código..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {isDemo && <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">MODO DEMO</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          {isAssetsLoading ? (
            <div className="py-10 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Cargando activos...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipo / Código</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Última Mantención</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Construction className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold">{asset.name}</span>
                          <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">{asset.code}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {asset.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        asset.status === 'activo' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                        asset.status === 'inactivo' && "bg-rose-50 text-rose-700 border-rose-200",
                        asset.status === 'en mantenimiento' && "bg-amber-50 text-amber-700 border-amber-200"
                      )}>
                        {asset.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <History className="h-3 w-3" />
                        {formatDate(asset.lastMaintenanceAt)}
                      </div>
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
