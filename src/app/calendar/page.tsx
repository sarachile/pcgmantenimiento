
"use client";

import { useState, useEffect } from "react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  parseISO
} from "date-fns";
import { es } from "date-fns/locale";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  ArrowRight,
  ArrowLeft,
  Loader2,
  Clock,
  ClipboardList
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { MOCK_WORK_ORDERS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { WorkOrder } from "@/lib/types";

export default function CalendarPage() {
  const { profile, isLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  
  // Hydration protection
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  }, []);

  const workOrdersQuery = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return collection(db, "companies", profile.companyId, "workOrders");
  }, [db, profile?.companyId]);

  const { data: realWorkOrders, isLoading: isOrdersLoading } = useCollection<WorkOrder>(workOrdersQuery);

  const workOrders = realWorkOrders && realWorkOrders.length > 0 ? realWorkOrders : MOCK_WORK_ORDERS;
  const isDemo = !realWorkOrders || realWorkOrders.length === 0;

  const nextMonth = () => currentMonth && setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => currentMonth && setCurrentMonth(subMonths(currentMonth, 1));

  const getOrdersForDay = (day: Date) => {
    return workOrders.filter(ot => {
      const dateToUse = ot.scheduledDate || ot.createdAt;
      if (!dateToUse) return false;
      const otDate = dateToUse?.toDate ? dateToUse.toDate() : parseISO(dateToUse);
      return isSameDay(day, otDate);
    });
  };

  if (isAuthLoading || !mounted || !currentMonth || !selectedDate) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const selectedDayOrders = getOrdersForDay(selectedDate);

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
            <h2 className="text-3xl font-bold tracking-tight">Calendario Operacional</h2>
            <p className="text-muted-foreground">Planificación visual basada en fechas de ejecución y plazos.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDemo && <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">MODO DEMO</Badge>}
          <Button asChild>
            <Link href="/work-orders/new">
              <Plus className="mr-2 h-4 w-4" /> Nueva OT
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-3 border-none shadow-sm overflow-hidden bg-card">
          <CardHeader className="flex flex-row items-center justify-between bg-muted/30 pb-4">
            <div className="flex items-center gap-4">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <CardTitle className="capitalize text-xl font-bold">
                {format(currentMonth, "MMMM yyyy", { locale: es })}
              </CardTitle>
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                setCurrentMonth(new Date());
                setSelectedDate(new Date());
              }} className="h-8 text-xs">
                Hoy
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b text-center bg-muted/10">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                <div key={day} className="py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                const dayOrders = getOrdersForDay(day);
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isToday = isSameDay(day, new Date());

                return (
                  <div 
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "min-h-[100px] p-2 border-b border-r last:border-r-0 transition-colors cursor-pointer group hover:bg-muted/50",
                      !isCurrentMonth && "bg-muted/20 text-muted-foreground/50",
                      isSelected && "bg-primary/5 ring-1 ring-inset ring-primary/20",
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-sm font-semibold h-7 w-7 flex items-center justify-center rounded-full",
                        isToday && "bg-primary text-white shadow-sm",
                        !isToday && isSelected && "text-primary bg-primary/10",
                        !isToday && !isSelected && "text-foreground"
                      )}>
                        {format(day, "d")}
                      </span>
                      {dayOrders.length > 0 && (
                        <span className="text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded-md">
                          {dayOrders.length}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayOrders.slice(0, 3).map(ot => (
                        <div 
                          key={ot.id} 
                          className={cn(
                            "text-[10px] truncate px-1.5 py-0.5 rounded-sm font-medium border",
                            ot.status === 'aprobada' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                            ot.status === 'en revision' ? "bg-amber-50 text-amber-700 border-amber-100" :
                            "bg-blue-50 text-blue-700 border-blue-100"
                          )}
                        >
                          {ot.id}
                        </div>
                      ))}
                      {dayOrders.length > 3 && (
                        <div className="text-[9px] text-center text-muted-foreground font-bold">
                          + {dayOrders.length - 3} más
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm flex flex-col h-full bg-card">
          <CardHeader className="border-b bg-muted/10">
            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Detalle del Día</CardTitle>
            <CardDescription className="font-bold text-foreground">
              {format(selectedDate, "eeee d 'de' MMMM", { locale: es })}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-4 overflow-y-auto min-h-[400px]">
            {selectedDayOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground opacity-50">
                <Clock className="h-10 w-10 mb-4" />
                <p className="text-sm italic">No hay órdenes programadas para este día.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayOrders.map(ot => (
                  <div 
                    key={ot.id} 
                    className="p-3 rounded-lg border bg-card hover:border-primary/50 transition-all group shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-primary">{ot.id}</span>
                      <Badge variant="outline" className={cn(
                        "text-[10px] font-bold uppercase",
                        ot.status === 'aprobada' && "bg-emerald-50 text-emerald-700",
                        ot.status === 'en revision' && "bg-amber-50 text-amber-700",
                        ot.status === 'creada' && "bg-blue-50 text-blue-700",
                      )}>
                        {ot.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {ot.description}
                    </p>
                    {ot.estimatedEndDate && (
                      <p className="text-[10px] font-bold text-amber-600 mb-2">
                        Término previsto: {format(ot.estimatedEndDate?.toDate ? ot.estimatedEndDate.toDate() : parseISO(ot.estimatedEndDate), 'dd/MM/yyyy')}
                      </p>
                    )}
                    <Button variant="ghost" size="sm" className="w-full h-8 text-xs font-bold group-hover:bg-primary group-hover:text-white" asChild>
                      <Link href={`/work-orders/${ot.id}`}>
                        Ver OT <ArrowRight className="ml-2 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <div className="p-4 bg-muted/5 border-t">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-blue-500" /> Pendientes
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-amber-500" /> En Revisión
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-emerald-500" /> Aprobadas
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
