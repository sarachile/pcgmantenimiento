
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
  UserPlus, 
  Mail, 
  Shield, 
  MoreVertical,
  Loader2,
  UserCheck,
  UserMinus,
  ArrowLeft,
  Lock
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc, updateDoc, query, where } from "firebase/firestore";
import { MOCK_USERS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Company } from "@/lib/types";

export default function TeamPage() {
  const { profile, isLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const companyRef = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return doc(db, "companies", profile.companyId);
  }, [db, profile?.companyId]);

  const { data: company } = useDoc<Company>(companyRef);

  const usersQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return query(collection(db, "users"), where("companyId", "==", profile.companyId));
  }, [db, profile?.companyId]);

  const { data: realUsers, isLoading: isUsersLoading } = useCollection(usersQuery);

  const companyUsers = realUsers && realUsers.length > 0 
    ? realUsers 
    : MOCK_USERS.filter(u => u.companyId === profile?.companyId);
    
  const isDemo = !realUsers || realUsers.length === 0;

  // Lógica de límites
  const planLimits = {
    free: 1,
    pro: 3,
    enterprise: 5
  };
  
  const currentPlan = company?.currentPlan || 'free';
  const maxUsers = planLimits[currentPlan as keyof typeof planLimits] || 1;
  const isAtLimit = companyUsers.length >= maxUsers;

  const filtered = companyUsers.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    if (isDemo) {
      toast({
        title: "Modo Demo",
        description: "No se pueden modificar usuarios de ejemplo.",
      });
      return;
    }

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { active: !currentStatus });
      toast({
        title: "Estado actualizado",
        description: `El usuario ha sido ${!currentStatus ? 'activado' : 'desactivado'}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del usuario.",
        variant: "destructive"
      });
    }
  };

  const handleInvite = () => {
    if (isAtLimit) {
      toast({
        title: "Límite de Usuarios",
        description: `Has alcanzado el máximo de ${maxUsers} usuarios para tu plan ${currentPlan.toUpperCase()}.`,
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Función de Invitación",
      description: "Próximamente: Envío de correos electrónicos para unirse al equipo.",
    });
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
            <h2 className="text-3xl font-bold tracking-tight">Mi Equipo</h2>
            <p className="text-muted-foreground">Gestione los técnicos, supervisores y revisores de su empresa.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAtLimit && (
            <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200 gap-1 px-3 py-1">
              <Lock className="h-3 w-3" /> Máximo de Usuarios alcanzado
            </Badge>
          )}
          <Button onClick={handleInvite} disabled={isAtLimit}>
            <UserPlus className="mr-2 h-4 w-4" /> Invitar Miembro
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre o email..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-muted-foreground uppercase">Usuarios Activos</p>
              <p className="text-sm font-black">{companyUsers.length} / {maxUsers}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isUsersLoading ? (
            <div className="py-10 text-center text-muted-foreground font-medium">
               <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
               Cargando equipo...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre / Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Ingreso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold">{user.name}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {user.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className={cn(
                          "h-3 w-3",
                          user.role === 'companyAdmin' ? "text-primary" : "text-muted-foreground"
                        )} />
                        <span className="text-xs font-medium uppercase tracking-wider">{user.role}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.active ? "default" : "secondary"} className={cn(
                        user.active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-muted text-muted-foreground"
                      )}>
                        {user.active ? "ACTIVO" : "INACTIVO"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {mounted ? new Date(user.createdAt).toLocaleDateString() : '...'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title={user.active ? "Desactivar" : "Activar"}
                          onClick={() => toggleUserStatus(user.id, user.active)}
                        >
                          {user.active ? <UserMinus className="h-4 w-4 text-rose-500" /> : <UserCheck className="h-4 w-4 text-emerald-500" />}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
