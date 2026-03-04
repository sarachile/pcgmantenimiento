
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
      const subTotal = (e.ratings.quality + e.ratings.timing + e.ratings.safety + e.ratings.documentation) / 4;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Voz del Cliente</h2>
            <p className="text-muted-foreground">Monitoreo de satisfacción y retroalimentación técnica.</p>
          </div>
        </div>
        <div className="bg-primary/10 px-6 py-3 rounded-2xl border border-primary/20 flex items-center gap-4">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase text-primary tracking-widest">Nota Promedio</p>
            <p className="text-3xl font-black text-primary">{calculateAverage(evaluations || [])}</p>
          </div>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={cn("h-4 w-4 fill-primary text-primary", s > Number(calculateAverage(evaluations || [])) && "fill-transparent opacity-30")} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {isEvalLoading ? (
          <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" /> Cargando feedback...</div>
        ) : !evaluations || evaluations.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed rounded-3xl opacity-50">
            <MessageSquare className="h-12 w-12 mx-auto mb-4" />
            <p className="font-bold">Aún no hay evaluaciones registradas.</p>
            <p className="text-sm">Asegúrese de habilitar las encuestas en la ficha del cliente.</p>
          </div>
        ) : (
          evaluations.map((evalItem) => (
            <Card key={evalItem.id} className="border-none shadow-md overflow-hidden">
              <div className="grid md:grid-cols-4">
                <CardHeader className="bg-muted/30 border-r md:col-span-1">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black truncate">{evalItem.reviewerName}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-2 w-2" /> {evalItem.createdAt ? format(evalItem.createdAt.toDate(), "dd MMM yyyy", { locale: es }) : '...'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase">
                        <span className="text-muted-foreground">Calidad</span>
                        <span className="text-primary">{evalItem.ratings.quality}/5</span>
                      </div>
                      <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: `${(evalItem.ratings.quality / 5) * 100}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] font-bold uppercase">
                        <span className="text-muted-foreground">Plazos</span>
                        <span className="text-primary">{evalItem.ratings.timing}/5</span>
                      </div>
                      <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: `${(evalItem.ratings.timing / 5) * 100}%` }} />
                      </div>
                    </div>
                    
                    <Badge variant="outline" className="w-full justify-center bg-white">
                      OT: {evalItem.workOrderId}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="md:col-span-3 p-6 space-y-6">
                  <div className="relative">
                    <Quote className="absolute -top-2 -left-2 h-8 w-8 text-muted/20 -z-0" />
                    <p className="text-sm italic text-slate-700 leading-relaxed relative z-10 pl-4">
                      "{evalItem.comment}"
                    </p>
                  </div>

                  {evalItem.adminResponse ? (
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1">
                          <Reply className="h-3 w-3" /> Nuestra Respuesta
                        </p>
                        <p className="text-[10px] text-emerald-600/60 italic">
                          {evalItem.adminResponseAt ? format(evalItem.adminResponseAt.toDate(), "dd/MM/yyyy HH:mm") : ''}
                        </p>
                      </div>
                      <p className="text-xs text-emerald-900 font-medium">{evalItem.adminResponse}</p>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-4 border-t border-dashed">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Responder al cliente</Label>
                      <div className="flex gap-2">
                        <Textarea 
                          placeholder="Agradezca el feedback o responda a sus dudas..." 
                          className="min-h-[60px] text-xs"
                          value={replyText[evalItem.id] || ""}
                          onChange={(e) => setReplyText({ ...replyText, [evalItem.id]: e.target.value })}
                        />
                        <Button 
                          size="icon" 
                          className="shrink-0 h-auto"
                          onClick={() => handleSendReply(evalItem.id)}
                          disabled={!replyText[evalItem.id]}
                        >
                          <Send className="h-4 w-4" />
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
