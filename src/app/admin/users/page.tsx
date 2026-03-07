
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
  UserPlus, 
  Shield, 
  Ban,
  MoreVertical,
  Building2,
  ArrowLeft,
  Loader2,
  Mail,
  UserCheck
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc, query, orderBy } from "firebase/firestore";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { User, Company } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function AdminUsersPage() {
  const { isSuperAdmin, isLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const usersQuery = useMemoFirebase(() => {
    if (!db || !isSuperAdmin) return null;
    return query(collection(db, "users"), orderBy("createdAt", "desc"));
  }, [db, isSuperAdmin]);

  const companiesQuery = useMemoFirebase(() => {
    if (!db || !isSuperAdmin) return null;
    return collection(db, "companies");
  }, [db, isSuperAdmin]);

  const { data: users, isLoading: isUsersLoading } = useCollection<User>(usersQuery);
  const { data: companies } = useCollection<Company>(companiesQuery);

  const filtered = (users || []).filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleUserStatus = (user: User) => {
    if (!db) return;
    const userRef = doc(db, "users", user.id);
    updateDocumentNonBlocking(userRef, { active: !user.active });
    toast({
      title: user.active ? "Usuario Suspendido" : "Usuario Activado",
      description: `El estado de ${user.name} ha sido actualizado.`
    });
  };

  if (isAuthLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild title="Volver al escritorio" className="rounded-full">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-black tracking-tight italic uppercase">Usuarios Globales</h2>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Base de datos central de operadores</p>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-white border-b p-8">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Buscar por nombre, email o empresa..." 
                className="pl-12 h-12 rounded-2xl bg-slate-50 border-none shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isUsersLoading ? (
            <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest pl-8 py-4">Usuario / Email</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Empresa Vinculada</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Rol</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Estado</TableHead>
                  <TableHead className="text-right font-black uppercase text-[10px] tracking-widest pr-8">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => {
                  const company = companies?.find(c => c.id === user.companyId);
                  return (
                    <TableRow key={user.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="pl-8 py-5">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900">{user.name}</span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Mail className="h-3 w-3" /> {user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="bg-slate-100 p-1.5 rounded-lg"><Building2 className="h-3.5 w-3.5 text-slate-500" /></div>
                          <span className="text-xs font-bold text-slate-700">
                            {company?.name || 'PCG Central / Infra'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Shield className={cn(
                            "h-3.5 w-3.5",
                            user.role === 'companyAdmin' ? "text-primary" : "text-slate-400"
                          )} />
                          <span className="text-[10px] font-black uppercase text-slate-600">{user.role}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "text-[9px] font-black uppercase",
                          user.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                        )}>
                          {user.active ? "ACTIVO" : "SUSPENDIDO"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn("h-9 w-9 rounded-xl", user.active ? "text-rose-500 hover:bg-rose-50" : "text-emerald-500 hover:bg-emerald-50")}
                            title={user.active ? "Suspender Usuario" : "Activar Usuario"}
                            onClick={() => toggleUserStatus(user)}
                          >
                            {user.active ? <Ban className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
