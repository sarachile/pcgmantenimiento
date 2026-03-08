
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
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
  LifeBuoy, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare,
  ChevronRight,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, where, orderBy, doc } from "firebase/firestore";
import { SupportTicket, Company } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { sendSystemEmail } from "@/actions/email";

export default function SupportPage() {
  const { profile, isSuperAdmin, isSupervisor, isCompanyAdmin, isLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    category: "technical" as any,
    priority: "medium" as any
  });

  const companyRef = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return doc(db, "companies", profile.companyId);
  }, [db, profile?.companyId]);
  const { data: company } = useDoc<Company>(companyRef);

  const ticketsQuery = useMemoFirebase(() => {
    if (!db || !profile?.id || !profile?.companyId) return null;
    
    // Si es superadmin, ve todo
    if (isSuperAdmin) {
      return query(
        collection(db, "supportTickets"),
        orderBy("createdAt", "desc")
      );
    }

    // Si es admin de empresa o supervisor, ve todos los tickets de su empresa
    if (isCompanyAdmin || isSupervisor) {
      return query(
        collection(db, "supportTickets"),
        where("companyId", "==", profile.companyId),
        orderBy("createdAt", "desc")
      );
    }

    // Los técnicos solo ven sus propios tickets
    return query(
      collection(db, "supportTickets"),
      where("userId", "==", profile.id),
      orderBy("createdAt", "desc")
    );
  }, [db, profile?.id, profile?.companyId, isSuperAdmin, isCompanyAdmin, isSupervisor]);

  const { data: tickets, isLoading: isTicketsLoading } = useCollection<SupportTicket>(ticketsQuery);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !profile || !company) return;

    setIsSubmitting(true);
    try {
      const ticketData = {
        userId: profile.id,
        userName: profile.name,
        companyId: profile.companyId,
        companyName: company.name,
        subject: formData.subject,
        description: formData.description,
        status: "open",
        category: formData.category,
        priority: formData.priority,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "supportTickets"), ticketData);

      // Notificar al Super Administrador por Email
      await sendSystemEmail({
        to: "control@pcgoperacion.com",
        subject: `NUEVO TICKET DE SOPORTE - ${company.name}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Nuevo Requerimiento de Soporte</h2>
            <p><strong>Empresa:</strong> ${company.name}</p>
            <p><strong>Usuario:</strong> ${profile.name} (${profile.email})</p>
            <p><strong>Asunto:</strong> ${formData.subject}</p>
            <p><strong>Prioridad:</strong> ${formData.priority.toUpperCase()}</p>
            <hr />
            <p><strong>Descripción:</strong></p>
            <p>${formData.description}</p>
            <br />
            <a href="https://www.pcgmantenimiento.com/admin/support/${docRef.id}" style="background: #1e3a8a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Ver Ticket y Responder
            </a>
          </div>
        `
      });

      toast({
        title: "Ticket Creado",
        description: "Un ejecutivo revisará su requerimiento a la brevedad.",
      });
      setIsCreateOpen(false);
      setFormData({ subject: "", description: "", category: "technical", priority: "medium" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <h2 className="text-3xl font-black tracking-tight">Centro de Soporte</h2>
            <p className="text-muted-foreground">Gestione sus requerimientos técnicos y consultas.</p>
          </div>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Requerimiento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic">Crear Ticket de Soporte</DialogTitle>
              <DialogDescription>Describa su problema o consulta detalladamente.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTicket} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Asunto del Ticket</Label>
                <Input 
                  placeholder="Ej: Problema con reporte PDF..." 
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Problema Técnico</SelectItem>
                      <SelectItem value="billing">Facturación</SelectItem>
                      <SelectItem value="feature">Sugerencia / Mejora</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Select value={formData.priority} onValueChange={(val) => setFormData({...formData, priority: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descripción Detallada</Label>
                <Textarea 
                  placeholder="Explique qué sucede..." 
                  className="min-h-[120px]"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full h-12 font-black" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enviar a Soporte Central"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
            {isCompanyAdmin || isSupervisor ? "Tickets de la Empresa" : "Mis Tickets Activos"}
          </h3>
          
          {isTicketsLoading ? (
            <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" /></div>
          ) : !tickets || tickets.length === 0 ? (
            <Card className="border-2 border-dashed p-12 text-center rounded-[2rem] bg-muted/10">
              <LifeBuoy className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="font-bold text-slate-500">No tiene tickets registrados aún.</p>
              <p className="text-xs text-slate-400 mt-1">Si necesita ayuda, cree un nuevo requerimiento arriba.</p>
            </Card>
          ) : (
            tickets.map((ticket) => (
              <Link key={ticket.id} href={`/support/${ticket.id}`}>
                <Card className="group border-none shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden mb-3">
                  <div className="flex items-center p-5 gap-4">
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
                      ticket.status === 'open' ? "bg-blue-50 text-blue-600" :
                      ticket.status === 'in_progress' ? "bg-amber-50 text-amber-600" :
                      "bg-emerald-50 text-emerald-600"
                    )}>
                      {ticket.status === 'open' ? <Clock className="h-6 w-6" /> : 
                       ticket.status === 'in_progress' ? <AlertCircle className="h-6 w-6" /> : 
                       <CheckCircle2 className="h-6 w-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter">
                          {ticket.category}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-bold">
                          #{ticket.id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      <h4 className="font-black text-slate-900 truncate group-hover:text-primary transition-colors">
                        {ticket.subject}
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Actualizado: {ticket.updatedAt ? format(ticket.updatedAt.toDate ? ticket.updatedAt.toDate() : new Date(ticket.updatedAt), "dd MMM HH:mm", { locale: es }) : ''}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <Badge className={cn(
                        "text-[9px] font-black uppercase",
                        ticket.priority === 'urgent' ? "bg-rose-500" :
                        ticket.priority === 'high' ? "bg-amber-500" : "bg-slate-500"
                      )}>
                        {ticket.priority}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-primary text-white rounded-3xl overflow-hidden relative">
            <div className="absolute -top-10 -right-10 opacity-10"><LifeBuoy className="h-40 w-40" /></div>
            <CardHeader>
              <CardTitle className="text-xl font-black italic">Ayuda Directa</CardTitle>
              <CardDescription className="text-primary-foreground/70">¿Tienes una duda urgente? Nuestro equipo está listo para asistirte.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="bg-white/10 p-4 rounded-2xl space-y-2 backdrop-blur-sm border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Horario de Atención</p>
                <p className="text-sm font-bold">Lun - Vie: 09:00 a 18:30 hrs</p>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl space-y-2 backdrop-blur-sm border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Correo Directo</p>
                <p className="text-sm font-bold">soporte@pcgoperacion.com</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest">Preguntas Frecuentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                "¿Cómo cambio mi plan?",
                "¿Olvidé mi contraseña?",
                "¿Límites de almacenamiento?"
              ].map((q, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border hover:bg-slate-50 cursor-pointer transition-colors group">
                  <span className="text-xs font-bold text-slate-600">{q}</span>
                  <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-primary" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}