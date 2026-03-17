'use client';

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { MobileActionDock } from "@/components/layout/mobile-action-dock";
import { Separator } from "@/components/ui/separator";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Company } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, isLoading, isAuthenticated, isSuperAdmin } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/auth/login");
      } else if (isSuperAdmin && !pathname.startsWith('/admin')) {
        // Redirigir al Superadmin fuera de las áreas operativas de empresa
        router.push("/admin");
      }
    }
  }, [isLoading, isAuthenticated, isSuperAdmin, router, pathname]);

  const companyRef = useMemoFirebase(() => {
    if (!db || !profile?.companyId || isSuperAdmin) return null;
    return doc(db, "companies", profile.companyId);
  }, [db, profile?.companyId, isSuperAdmin]);

  const { data: company } = useDoc<Company>(companyRef);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Validando Credenciales...</p>
        </div>
      </div>
    );
  }

  // Si es Superadmin y está en una ruta /dashboard, no renderizamos nada mientras redirige
  if (isSuperAdmin && !pathname.startsWith('/admin')) return null;
  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <SidebarNav userRole={profile?.role || 'tecnico'} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-6 border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-10">
          <SidebarTrigger className="-ml-1 h-10 w-10 bg-slate-900 text-white rounded-xl shadow-lg md:bg-transparent md:text-slate-900 md:shadow-none" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex-1">
            <h1 className="text-sm font-black text-slate-900 uppercase italic truncate max-w-[200px] sm:max-w-[300px]">
              {isSuperAdmin ? "Control Maestro SaaS" : (company?.name || "PCGMANTENIMIENTO ERP")}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black uppercase text-slate-900">{profile?.name || "Usuario"}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">{profile?.role || "Personal"}</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-primary text-white flex items-center justify-center font-black text-xs shadow-md">
              {profile?.name?.split(' ').map(n => n[0]).join('') || "U"}
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6 overflow-auto pb-32 md:pb-6">
          {children}
        </div>
        {!isSuperAdmin && <MobileActionDock />}
      </SidebarInset>
    </SidebarProvider>
  );
}
