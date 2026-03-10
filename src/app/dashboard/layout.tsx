
'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { MobileActionDock } from "@/components/layout/mobile-action-dock";
import { Separator } from "@/components/ui/separator";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Company } from "@/lib/types";
import { Loader2, Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, isLoading, isAuthenticated } = useUser();
  const db = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const companyRef = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return doc(db, "companies", profile.companyId);
  }, [db, profile?.companyId]);

  const { data: company } = useDoc<Company>(companyRef);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
              {company?.name || "PCGMANTENIMIENTO ERP"}
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
        <MobileActionDock />
      </SidebarInset>
    </SidebarProvider>
  );
}
