"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Star, 
  MessageSquare, 
  ArrowLeft, 
  Loader2, 
  User, 
  Clock, 
  CheckCircle2,
  Quote,
  Reply,
  Send
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { ServiceEvaluation } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export default function FeedbackPage() {
  const { profile, isLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const evaluationsQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return query(
      collection(db, "companies", profile.companyId, "evaluations"),
      orderBy("createdAt", "desc")
    );
  }, [db, profile?.companyId]);

  const { data: evaluations, isLoading: isEvalLoading } = useCollection<ServiceEvaluation>(evaluationsQuery);

  const handleSendReply = (evaluationId: string) => {
    if (!db || !profile?.companyId || !replyText[evaluationId]) return;

    const evalRef = doc(db, "companies", profile.companyId, "evaluations", evaluationId);
    updateDocumentNonBlocking(evalRef, {
      adminResponse: replyText[evaluationId],
      adminResponseAt: serverTimestamp()
    });

    toast({ title: "Respuesta enviada", description: "El cliente podrá ver su feedback." });
    setReplyText(prev => {
      const next = { ...prev };
      delete next[evaluationId];
      return next;
    });
  };

  const calculateAverage = (evals: ServiceEvaluation[]) => {
    if (!evals.length) return 0;
    const total = evals.reduce((acc, e) => {
      const subTotal = (e.ratings.quality + e.ratings.timing + e.ratings.safety + (e.ratings.documentation || 5)) / 4;
      return acc + subTotal;
    }, 0);
    return (total / evals.length).toFixed(1);
  };

  if (isAuthLoading || !mounted) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full shrink-0">
            <Link href="/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase italic">Voz del Cliente</h2>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Satisfacción técnica</p>
          </div>
        </div>
        <div className="bg-white px-6 py-4 rounded-[2rem] border-2 border-primary/10 shadow-sm flex items-center justify-center md:justify-start gap-6 self-stretch md:self-auto">
          <div className="text-center md:text-left">
            <p className="text-[9px] font-black uppercase text-primary tracking-widest mb-1">Nota Promedio</p>
            <p className="text-4xl font-black text-primary tracking-tighter leading-none">{calculateAverage(evaluations || [])}</p>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={cn("h-4 w-4 fill-primary text-primary", s > Number(calculateAverage(evaluations || [])) && "fill-transparent opacity-20")} />
              ))}
            </div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{evaluations?.length || 0} Evaluaciones</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {isEvalLoading ? (
          <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" /> Cargando feedback...</div>
        ) : !evaluations || evaluations.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed rounded-[3rem] bg-slate-50/50">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="font-black uppercase italic text-slate-400 tracking-tighter text-lg">Sin evaluaciones registradas</p>
            <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto mt-2">Los resultados aparecerán cuando sus clientes cierren las órdenes en el portal.</p>
          </div>
        ) : (
          evaluations.map((evalItem) => (
            <Card key={evalItem.id} className="border-none shadow-lg rounded-[2.5rem] overflow-hidden bg-white group hover:shadow-xl transition-all">
              <div className="flex flex-col md:flex-row">
                <CardHeader className="bg-slate-50/50 p-6 md:p-8 md:w-1/3 md:border-r border-slate-100 shrink-0">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-lg shadow-lg">
                        {evalItem.reviewerName?.[0] || 'C'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate uppercase">{evalItem.reviewerName}</p>
                        <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 mt-0.5">
                          <Clock className="h-3 w-3" /> {evalItem.createdAt ? format(evalItem.createdAt.toDate ? evalItem.createdAt.toDate() : new Date(evalItem.createdAt), "dd MMM yyyy", { locale: es }) : '...'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">
                          <span>Calidad</span>
                          <span className="text-primary">{evalItem.ratings.quality}/5</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${(evalItem.ratings.quality / 5) * 100}%` }} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">
                          <span>Plazos</span>
                          <span className="text-primary">{evalItem.ratings.timing}/5</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${(evalItem.ratings.timing / 5) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <Badge variant="outline" className="w-full justify-center bg-white border-slate-200 text-[10px] font-black uppercase py-1.5 rounded-xl text-primary tracking-widest">
                        OT: {evalItem.workOrderId}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 p-6 md:p-8 space-y-8">
                  <div className="relative">
                    <Quote className="absolute -top-4 -left-4 h-12 w-12 text-slate-100 -z-0" />
                    <p className="text-base md:text-lg font-medium text-slate-700 leading-relaxed relative z-10 pl-2 italic">
                      "{evalItem.comment}"
                    </p>
                  </div>

                  {evalItem.adminResponse ? (
                    <div className="bg-emerald-50/50 p-6 rounded-[2rem] border-2 border-emerald-100/50 space-y-3 relative overflow-hidden animate-in fade-in slide-in-from-top-2">
                      <div className="absolute top-0 right-0 p-4 opacity-5"><CheckCircle2 className="h-12 w-12 text-emerald-600" /></div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Reply className="h-3.5 w-3.5" /> Nuestra Respuesta
                        </p>
                        <p className="text-[9px] font-bold text-emerald-600/60 uppercase">
                          {evalItem.adminResponseAt ? format(evalItem.adminResponseAt.toDate ? evalItem.adminResponseAt.toDate() : new Date(evalItem.adminResponseAt), "dd/MM/yyyy HH:mm") : ''}
                        </p>
                      </div>
                      <p className="text-sm text-emerald-900 font-bold leading-relaxed">{evalItem.adminResponse}</p>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-6 border-t border-dashed border-slate-200">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5" /> Responder al cliente
                      </Label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Textarea 
                          placeholder="Agradezca el feedback o responda a sus dudas..." 
                          className="min-h-[80px] text-sm rounded-2xl bg-slate-50/50 border-2 border-slate-100 focus:border-primary/30 p-4 font-medium"
                          value={replyText[evalItem.id] || ""}
                          onChange={(e) => setReplyText({ ...replyText, [evalItem.id]: e.target.value })}
                        />
                        <Button 
                          className="sm:w-14 h-14 sm:h-auto rounded-2xl shadow-lg shrink-0 gap-2 font-black uppercase text-[10px]"
                          onClick={() => handleSendReply(evalItem.id)}
                          disabled={!replyText[evalItem.id]}
                        >
                          <Send className="h-4 w-4" /> <span className="sm:hidden">Enviar Respuesta</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}