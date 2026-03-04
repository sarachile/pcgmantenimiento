
"use client";

import { use, useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Send, 
  Loader2, 
  LifeBuoy, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  User,
  Settings,
  ShieldCheck
} from "lucide-react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { SupportTicket, TicketMessage, Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const ticketId = resolvedParams.id;
  const { profile, isSuperAdmin } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ticketRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "supportTickets", ticketId);
  }, [db, ticketId]);

  const { data: ticket, isLoading: isTicketLoading } = useDoc<SupportTicket>(ticketRef);

  const messagesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, "supportTickets", ticketId, "messages"),
      orderBy("timestamp", "asc")
    );
  }, [db, ticketId]);

  const { data: messages } = useCollection<TicketMessage>(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !profile || !newMessage.trim() || !ticket) return;

    setIsSending(true);
    try {
      const msgData = {
        senderId: profile.id,
        senderName: profile.name,
        senderRole: isSuperAdmin ? "admin" : "user",
        text: newMessage.trim(),
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, "supportTickets", ticketId, "messages"), msgData);
      
      // Actualizar timestamp y estado si es admin
      const updateData: any = { updatedAt: serverTimestamp() };
      if (isSuperAdmin && ticket.status === 'open') {
        updateData.status = 'in_progress';
      }
      await updateDoc(doc(db, "supportTickets", ticketId), updateData);

      setNewMessage("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!db || !ticket) return;
    await updateDoc(doc(db, "supportTickets", ticketId), { 
      status: 'resolved',
      updatedAt: serverTimestamp() 
    });
    toast({ title: "Ticket Resuelto", description: "El caso ha sido marcado como finalizado." });
  };

  if (isTicketLoading) {
    return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!ticket) {
    return (
      <div className="p-12 text-center space-y-4">
        <AlertCircle className="h-12 w-12 mx-auto text-rose-500" />
        <h3 className="text-xl font-bold">Ticket No Encontrado</h3>
        <Button asChild variant="outline"><Link href={isSuperAdmin ? "/admin/support" : "/support"}>Volver al listado</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={isSuperAdmin ? "/admin/support" : "/support"}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-black tracking-tight">{ticket.subject}</h2>
              <Badge className="text-[9px] font-black uppercase">{ticket.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-2">
              <LifeBuoy className="h-3 w-3" /> Ticket #{ticket.id.slice(-6).toUpperCase()} 
              <span className="opacity-20">|</span> 
              Empresa: {ticket.companyName}
            </p>
          </div>
        </div>
        
        {isSuperAdmin && ticket.status !== 'resolved' && (
          <Button variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={handleCloseTicket}>
            <CheckCircle2 className="h-4 w-4 mr-2" /> Marcar como Resuelto
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3 h-[calc(100vh-250px)]">
        <div className="md:col-span-2 flex flex-col gap-4 h-full">
          <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-sm rounded-3xl">
            <CardHeader className="bg-muted/30 border-b py-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" /> Historial de Mensajes
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth" ref={scrollRef}>
              <div className="bg-muted/20 p-4 rounded-2xl border border-dashed text-sm text-muted-foreground italic mb-8">
                <strong>Descripción Inicial:</strong> {ticket.description}
              </div>

              {messages?.map((msg) => {
                const isMe = msg.senderId === profile?.id;
                const isAdmin = msg.senderRole === 'admin';
                
                return (
                  <div key={msg.id} className={cn(
                    "flex flex-col max-w-[80%]",
                    isMe ? "ml-auto items-end" : "items-start"
                  )}>
                    <div className="flex items-center gap-2 mb-1 px-2">
                      {!isMe && (
                        <div className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-black", isAdmin ? "bg-primary text-white" : "bg-slate-200")}>
                          {isAdmin ? <ShieldCheck className="h-3 w-3" /> : <User className="h-3 w-3" />}
                        </div>
                      )}
                      <span className="text-[10px] font-black uppercase text-slate-400">
                        {isMe ? "Usted" : msg.senderName} {isAdmin && "(Soporte Central)"}
                      </span>
                    </div>
                    <div className={cn(
                      "px-4 py-3 rounded-2xl shadow-sm text-sm font-medium leading-relaxed",
                      isMe ? "bg-primary text-white rounded-tr-none" : "bg-white border rounded-tl-none text-slate-700"
                    )}>
                      {msg.text}
                    </div>
                    <span className="text-[8px] text-muted-foreground mt-1 px-2">
                      {msg.timestamp ? format(msg.timestamp.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp), "HH:mm", { locale: es }) : ''}
                    </span>
                  </div>
                );
              })}
            </CardContent>
            <CardFooter className="p-4 bg-muted/30 border-t">
              <form onSubmit={handleSendMessage} className="flex w-full gap-2">
                <Input 
                  placeholder="Escriba su respuesta..." 
                  className="rounded-xl bg-white border-2 border-primary/10 h-12"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={ticket.status === 'resolved' || ticket.status === 'closed'}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="h-12 w-12 rounded-xl shrink-0"
                  disabled={isSending || !newMessage.trim() || ticket.status === 'resolved'}
                >
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6 h-full">
          <Card className="border-none shadow-sm rounded-3xl">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-sm font-black uppercase tracking-widest">Información del Caso</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Estado Actual</p>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    ticket.status === 'open' ? "bg-blue-500" :
                    ticket.status === 'in_progress' ? "bg-amber-500" : "bg-emerald-500"
                  )} />
                  <p className="text-sm font-bold uppercase">{ticket.status}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Prioridad</p>
                <Badge className={cn(
                  "font-black uppercase text-[10px]",
                  ticket.priority === 'urgent' ? "bg-rose-500" :
                  ticket.priority === 'high' ? "bg-amber-500" : "bg-slate-500"
                )}>{ticket.priority}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Fecha Apertura</p>
                <p className="text-sm font-bold">{format(ticket.createdAt.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}</p>
              </div>
              <div className="pt-4 border-t space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Empresa Solicitante</p>
                <p className="text-sm font-black text-primary">{ticket.companyName}</p>
                <p className="text-[10px] text-muted-foreground">{ticket.userName}</p>
              </div>
            </CardContent>
          </Card>

          {isSuperAdmin && (
            <Card className="border-none shadow-sm bg-amber-50 border-amber-100 rounded-3xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase text-amber-700">Herramientas Admin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start text-xs font-bold gap-2" size="sm">
                  <Settings className="h-3 w-3" /> Escalar Requerimiento
                </Button>
                <Button variant="outline" className="w-full justify-start text-xs font-bold gap-2" size="sm">
                  <LifeBuoy className="h-3 w-3" /> Ver Logs de Empresa
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
