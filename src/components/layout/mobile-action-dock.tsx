
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ClipboardList, 
  Camera, 
  Package,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileActionDock() {
  const pathname = usePathname();
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    // Mostrar el hint después de un breve delay para que no se pierda en la carga
    const timer = setTimeout(() => {
      setShowHint(true);
    }, 1500);

    // Ocultar el hint automáticamente después de 15 segundos
    const hideTimer = setTimeout(() => {
      setShowHint(false);
    }, 16500);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  const navItems = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Mis OTs", href: "/work-orders", icon: ClipboardList },
    { title: "Captura", href: "/field/capture", icon: Camera, isMain: true },
    { title: "Insumos", href: "/inventory", icon: Package },
    { title: "Buscar", href: "/work-orders", icon: Search },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-0 right-0 z-50 px-4 animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] h-20 flex items-center justify-around px-2 relative">
        <div className="absolute left-1/2 -translate-x-1/2 w-20 h-20 bg-blue-600/20 blur-2xl rounded-full" />
        
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          if (item.isMain) {
            return (
              <div key={item.title} className="relative">
                {/* HINT FLOTANTE REFORZADO */}
                {showHint && (
                  <div 
                    className="absolute -top-24 left-1/2 -translate-x-1/2 w-[200px] animate-bounce z-[60]"
                    onClick={() => setShowHint(false)}
                  >
                    <div className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-5 py-4 rounded-[1.5rem] shadow-2xl relative border-2 border-white/30 text-center leading-tight">
                      REPORTE DE TERRENO:
                      <br />
                      <span className="text-[8px] opacity-80 font-bold">PULSA AQUÍ PARA ABRIR CÁMARA</span>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-600 rotate-45 border-r-2 border-b-2 border-white/30" />
                    </div>
                  </div>
                )}

                <Link 
                  href={item.href}
                  onClick={() => setShowHint(false)}
                  className="relative -top-8 flex flex-col items-center group"
                >
                  <div className={cn(
                    "h-16 w-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-90",
                    isActive 
                      ? "bg-white text-slate-900" 
                      : "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/40 border-2 border-white/20"
                  )}>
                    <item.icon className="h-8 w-8" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 mt-2">
                    {item.title}
                  </span>
                </Link>
              </div>
            );
          }

          return (
            <Link 
              key={item.title} 
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-300 active:scale-95",
                isActive ? "text-white" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-blue-400")} />
              <span className="text-[8px] font-bold uppercase tracking-tighter">
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
