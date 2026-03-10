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
    if (!db || !profile?.id) return null;
    
    // Si es superadmin, ve todos los tickets del sistema
    if (isSuperAdmin) {
      return query(
        collection(db, "supportTickets"),
        orderBy("createdAt", "desc")
      );
    }

    // Si es admin de empresa o supervisor, ve los tickets vinculados a su empresa
    if ((isCompanyAdmin || isSupervisor) && profile.companyId) {
      return query(
        collection(db, "supportTickets"),
        where("companyId", "==", profile.companyId),
        orderBy("createdAt", "desc")
      );
    }

    // Los técnicos ven solo sus propios requerimientos
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
            <h2>Nuevo Requerimiento de Soporte / Feedback</h2>
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
        description: "Su requerimiento ha sido recibido. Lo contactaremos a la brevedad.",
      });
      setIsCreateOpen(false);
      setFormData({ subject: "", description: "", category: "technical", priority: "medium" });
    } catch (error: any) {
      toast({ title: "Error de permisos", description: "No se pudo crear el ticket. Verifique su conexión.", variant: "destructive" });
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
            <h2 className="text-3xl font-black tracking-tight uppercase italic">Centro de Soporte</h2>
            <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">Feedback y Requerimientos</p>
          </div>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg h-12 px-6 font-black gap-2">
              <Plus className="h-5 w-5" /> Nuevo Requerimiento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Crear Ticket</DialogTitle>
              <DialogDescription className="font-bold text-slate-500">¿En qué podemos ayudarte a mejorar tu operación?</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTicket} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Asunto del Ticket *</Label>
                <Input 
                  placeholder="Ej: Propuesta de mejora en reportes..." 
                  className="h-12 rounded-xl border-2 font-bold"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Categoría</Label>
                  <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                    <SelectTrigger className="h-12 rounded-xl border-2">
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
                  <Label className="text-[10px] font-black uppercase text-slate-400">Prioridad</Label>
                  <Select value={formData.priority} onValueChange={(val) => setFormData({...formData, priority: val})}>
                    <SelectTrigger className="h-12 rounded-xl border-2">
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
                <Label className="text-[10px] font-black uppercase text-slate-400">Descripción Detallada *</Label>
                <Textarea 
                  placeholder="Explique qué necesita o qué mejora propone..." 
                  className="min-h-[120px] rounded-xl border-2 p-4 text-sm font-medium"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enviar a Soporte Central"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 ml-2">
            Mis Requerimientos Activos
          </h3>
          
          {isTicketsLoading ? (
            <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" /></div>
          ) : !tickets || tickets.length === 0 ? (
            <Card className="border-2 border-dashed p-12 text-center rounded-[2.5rem] bg-slate-50/50">
              <LifeBuoy className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="font-black uppercase italic text-slate-400 tracking-tighter">Sin tickets registrados</p>
              <p className="text-xs text-slate-400 mt-2 font-medium">Si tienes dudas o propuestas de mejora, estamos para escucharte.</p>
            </Card>
          ) : (
            tickets.map((ticket) => (
              <Link key={ticket.id} href={`/support/${ticket.id}`}>
                <Card className="group border-none shadow-sm hover:shadow-md transition-all rounded-[1.5rem] overflow-hidden mb-3 bg-white">
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
                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter h-4">
                          {ticket.category}
                        </Badge>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                          #{ticket.id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      <h4 className="font-black text-slate-900 truncate group-hover:text-primary transition-colors text-sm uppercase italic">
                        {ticket.subject}
                      </h4>
                      <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase">
                        Actualizado: {ticket.updatedAt ? format(ticket.updatedAt.toDate ? ticket.updatedAt.toDate() : new Date(ticket.updatedAt), "dd MMM HH:mm", { locale: es }) : ''}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <Badge className={cn(
                        "text-[8px] font-black uppercase tracking-widest px-2 h-5",
                        ticket.priority === 'urgent' ? "bg-rose-500 text-white" :
                        ticket.priority === 'high' ? "bg-amber-500 text-white" : "bg-slate-500 text-white"
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
          <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[2rem] overflow-hidden relative">
            <div className="absolute -top-10 -right-10 opacity-10"><LifeBuoy className="h-40 w-40" /></div>
            <CardHeader className="p-8">
              <CardTitle className="text-xl font-black italic uppercase tracking-tighter">Ayuda Directa</CardTitle>
              <CardDescription className="text-blue-400 font-bold uppercase text-[10px] tracking-widest mt-1">Soporte centralizado PCGMANTENIMIENTO</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0 p-8">
              <div className="bg-white/5 p-5 rounded-2xl space-y-2 backdrop-blur-sm border border-white/10">
                <p className="text-[9px] font-black uppercase tracking-widest text-blue-400">Horario de Atención</p>
                <p className="text-sm font-bold">Lun - Vie: 09:00 a 18:30 hrs</p>
              </div>
              <div className="bg-white/5 p-5 rounded-2xl space-y-2 backdrop-blur-sm border border-white/10">
                <p className="text-[9px] font-black uppercase tracking-widest text-blue-400">Correo Directo</p>
                <p className="text-sm font-bold">soporte@pcgoperacion.com</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[2rem] bg-white">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Preguntas Frecuentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-6 pt-2">
              {[
                "¿Cómo cambiar mi plan?",
                "¿Configuración de firmas QR?",
                "¿Límites de técnicos?"
              ].map((q, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors group">
                  <span className="text-[10px] font-bold text-slate-600 uppercase">{q}</span>
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