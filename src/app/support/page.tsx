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

  // Referencia a la empresa para el contexto del ticket
  const companyRef = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return doc(db, "companies", profile.companyId);
  }, [db, profile?.companyId]);
  const { data: company } = useDoc<Company>(companyRef);

  // Consulta de tickets blindada contra errores de permisos prematuros
  const ticketsQuery = useMemoFirebase(() => {
    // CRÍTICO: No intentar la consulta hasta que Firebase y el perfil estén listos
    if (!db || !profile?.id) return null;
    
    try {
      const ticketsCol = collection(db, "supportTickets");

      // Caso 1: Superadministrador ve todo el sistema
      if (isSuperAdmin) {
        return query(ticketsCol, orderBy("createdAt", "desc"));
      }

      // Caso 2: Administrador/Supervisor ve los de su empresa
      if ((isCompanyAdmin || isSupervisor) && profile.companyId) {
        return query(
          ticketsCol,
          where("companyId", "==", profile.companyId),
          orderBy("createdAt", "desc")
        );
      }

      // Caso 3: Técnico ve solo sus propios tickets
      return query(
        ticketsCol,
        where("userId", "==", profile.id),
        orderBy("createdAt", "desc")
      );
    } catch (e) {
      console.error("Error construyendo consulta de soporte:", e);
      return null;
    }
  }, [db, profile?.id, profile?.companyId, isSuperAdmin, isCompanyAdmin, isSupervisor]);

  const { data: tickets, isLoading: isTicketsLoading } = useCollection<SupportTicket>(ticketsQuery);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !profile || !company) {
      toast({ title: "Error de sesión", description: "No se pudieron cargar los datos de usuario.", variant: "destructive" });
      return;
    }

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

      // Notificar al equipo central por email
      await sendSystemEmail({
        to: "control@pcgoperacion.com",
        subject: `[FEEDBACK] ${formData.subject} - ${company.name}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #1e3a8a;">Nuevo Requerimiento de Soporte</h2>
            <p><strong>Empresa:</strong> ${company.name}</p>
            <p><strong>Usuario:</strong> ${profile.name} (${profile.email})</p>
            <p><strong>Categoría:</strong> ${formData.category}</p>
            <p><strong>Prioridad:</strong> ${formData.priority.toUpperCase()}</p>
            <hr />
            <p><strong>Descripción:</strong></p>
            <p style="background: #f9fafb; padding: 15px; border-radius: 5px;">${formData.description}</p>
            <br />
            <a href="https://www.pcgmantenimiento.com/admin/support/${docRef.id}" style="background: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Responder Ticket
            </a>
          </div>
        `
      });

      toast({
        title: "Ticket Enviado",
        description: "Su feedback ha sido recibido por el equipo de ingeniería.",
      });
      setIsCreateOpen(false);
      setFormData({ subject: "", description: "", category: "technical", priority: "medium" });
    } catch (error: any) {
      toast({ title: "Falla en envío", description: "No se pudo conectar con el servidor de soporte.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex flex-col h-[400px] items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Verificando Credenciales...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full"><Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <h2 className="text-3xl font-black tracking-tight uppercase italic text-slate-900">Centro de Soporte</h2>
            <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">Canal Directo de Feedback y Mejoras</p>
          </div>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg h-12 px-6 font-black gap-2">
              <Plus className="h-5 w-5" /> Nuevo Requerimiento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-[2.5rem]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Enviar Feedback</DialogTitle>
              <DialogDescription className="font-bold text-slate-500">¿Tienes una idea de mejora o necesitas ayuda técnica?</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTicket} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Asunto *</Label>
                <Input 
                  placeholder="Ej: Sugerencia para el visor de fotos..." 
                  className="h-12 rounded-xl border-2 font-bold"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Categoría</Label>
                  <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                    <SelectTrigger className="h-12 rounded-xl border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Problema Técnico</SelectItem>
                      <SelectItem value="feature">Propuesta de Mejora</SelectItem>
                      <SelectItem value="billing">Suscripción / Plan</SelectItem>
                      <SelectItem value="other">Otros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Urgencia</Label>
                  <Select value={formData.priority} onValueChange={(val) => setFormData({...formData, priority: val})}>
                    <SelectTrigger className="h-12 rounded-xl border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Consulta General</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Crítica (Bloqueo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Descripción del Requerimiento *</Label>
                <Textarea 
                  placeholder="Por favor, sea lo más detallado posible..." 
                  className="min-h-[150px] rounded-2xl border-2 p-4 text-sm font-medium bg-slate-50/50"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full h-16 rounded-[2rem] bg-slate-900 text-white font-black uppercase tracking-widest shadow-xl" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Enviar a Soporte Central"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Historial de Comunicaciones</h3>
          
          {isTicketsLoading ? (
            <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/20" /></div>
          ) : !tickets || tickets.length === 0 ? (
            <Card className="border-2 border-dashed p-12 text-center rounded-[2.5rem] bg-slate-50/50">
              <LifeBuoy className="h-16 w-16 mx-auto mb-4 text-slate-200" />
              <p className="font-black uppercase italic text-slate-400 tracking-tighter text-lg">Sin tickets registrados</p>
              <p className="text-xs text-slate-400 mt-2 font-medium">Usa este canal para ayudarnos a construir el mejor ERP para tu equipo.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <Link key={ticket.id} href={`/support/${ticket.id}`} className="block group">
                  <Card className="border-none shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden bg-white group-active:scale-[0.98]">
                    <div className="flex items-center p-5 gap-4">
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
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
                          <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest h-4 px-1.5 border-slate-200">
                            {ticket.category}
                          </Badge>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                            ID: {ticket.id.slice(-6).toUpperCase()}
                          </span>
                        </div>
                        <h4 className="font-black text-slate-900 truncate text-sm uppercase italic leading-none">
                          {ticket.subject}
                        </h4>
                        <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">
                          {ticket.updatedAt ? format(ticket.updatedAt.toDate ? ticket.updatedAt.toDate() : new Date(ticket.updatedAt), "dd MMM, HH:mm", { locale: es }) : 'Procesando...'}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <Badge className={cn(
                          "text-[8px] font-black uppercase tracking-widest px-2 h-5",
                          ticket.priority === 'urgent' ? "bg-rose-600 text-white" :
                          ticket.priority === 'high' ? "bg-amber-500 text-white" : "bg-slate-500 text-white"
                        )}>
                          {ticket.priority}
                        </Badge>
                        <ChevronRight className="h-5 w-5 text-slate-200 group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-2xl bg-slate-900 text-white rounded-[2.5rem] overflow-hidden relative">
            <div className="absolute -top-10 -right-10 opacity-10"><LifeBuoy className="h-48 w-48 text-blue-400" /></div>
            <CardHeader className="p-8 border-b border-white/5">
              <CardTitle className="text-xl font-black italic uppercase tracking-tighter">Ingeniería PCG</CardTitle>
              <CardDescription className="text-blue-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Soporte Estratégico 24/7</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <p className="text-xs text-slate-400 leading-relaxed font-medium italic">
                "Este canal llega directamente a nuestros desarrolladores. Cada sugerencia de mejora es evaluada para la próxima actualización global."
              </p>
              <div className="space-y-3">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <p className="text-[9px] font-black uppercase text-blue-400 mb-1">Horario de Prioridad</p>
                  <p className="text-xs font-bold">Lunes a Viernes: 09:00 - 18:30</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <p className="text-[9px] font-black uppercase text-blue-400 mb-1">Emergencias</p>
                  <p className="text-xs font-bold">soporte@pcgoperacion.com</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}