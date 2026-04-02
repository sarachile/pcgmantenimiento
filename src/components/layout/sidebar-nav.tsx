
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  Building2, 
  ShieldCheck,
  CreditCard,
  LogOut,
  BarChart3,
  Globe,
  HardHat,
  Package,
  CalendarDays,
  Settings,
  MessageCircleHeart,
  Camera,
  Receipt,
  Layers,
  Sparkles,
  Lock,
  Cpu,
  Droplets,
  Waves,
  LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar
} from "@/components/ui/sidebar";
import { Role, Company } from "@/lib/types";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { FirebaseImage } from "@/components/FirebaseImage";
import { usePlanLimits } from "@/hooks/use-plan-limits";

interface NavItem {
  title: string;
  href: string;
  icon: any;
  roles?: Role[];
  badge?: string;
  highlight?: boolean;
  featureFlag?: string;
}

const operationalItems: NavItem[] = [
  { title: "Dashboard / Cartera", href: "/dashboard", icon: LayoutDashboard },
  { title: "Calendario", href: "/calendar", icon: CalendarDays, roles: ['companyAdmin', 'supervisor', 'tecnico', 'reviewer', 'superadmin'] },
  { title: "Órdenes de Trabajo", href: "/work-orders", icon: ClipboardList, roles: ['companyAdmin', 'supervisor', 'tecnico', 'reviewer', 'superadmin'] },
  { title: "Control de Agua (IoT)", href: "/water-control", icon: Droplets, highlight: true, roles: ['companyAdmin', 'supervisor', 'buildingAdmin'] },
  { title: "Revisiones Técnicas", href: "/reviews", icon: ShieldCheck, roles: ['reviewer', 'supervisor', 'companyAdmin'] },
  { title: "Monitor IoT Alertas", href: "/iot-control", icon: Cpu, roles: ['companyAdmin', 'supervisor'] },
  { title: "Captura Terreno", href: "/field/capture", icon: Camera, roles: ['companyAdmin', 'supervisor', 'tecnico'] },
];

const inventoryItems: NavItem[] = [
  { title: "Activos e Equipos", href: "/assets", icon: HardHat, roles: ['companyAdmin', 'supervisor', 'tecnico'] },
  { title: "Inventario / Insumos", href: "/inventory", icon: Package, roles: ['companyAdmin', 'supervisor', 'tecnico'] },
];

const businessItems: NavItem[] = [
  { title: "Clientes", href: "/clients", icon: Users, roles: ['companyAdmin', 'supervisor'] },
  { title: "Facturación DTE", href: "/billing", icon: Receipt, roles: ['companyAdmin', 'supervisor'], featureFlag: 'electronicBilling' },
  { title: "Satisfacción (Feedback)", href: "/feedback", icon: MessageCircleHeart, roles: ['companyAdmin', 'supervisor'] },
  { title: "Reportes & BI", href: "/reports", icon: BarChart3, roles: ['companyAdmin', 'supervisor'] },
];

const settingsItems: NavItem[] = [
  { title: "Mi Empresa (Ficha)", href: "/company", icon: Building2, roles: ['companyAdmin', 'supervisor'] },
  { title: "Equipo Técnico", href: "/team", icon: Users, roles: ['companyAdmin', 'supervisor'] },
  { title: "Suscripción", href: "/subscription", icon: CreditCard, roles: ['companyAdmin'] },
];

const adminItems: NavItem[] = [
  { title: "Control Maestro", href: "/admin", icon: Globe, roles: ['superadmin'] },
  { title: "Comunidades SaaS", href: "/admin/companies", icon: Building2, roles: ['superadmin'] },
  { title: "Gestión Agua IoT", href: "/admin/water", icon: Waves, roles: ['superadmin'] },
  { title: "Estadísticas Infra", href: "/admin/stats", icon: BarChart3, roles: ['superadmin'] },
];

export function SidebarNav({ userRole = 'tecnico' }: { userRole?: Role }) {
  const pathname = usePathname();
  const { profile, isSuperAdmin } = useUser();
  const { features } = usePlanLimits();
  const { setOpenMobile } = useSidebar();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();

  const companyRef = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return doc(db, "companies", profile.companyId);
  }, [db, profile?.companyId]);

  const { data: company } = useDoc<Company>(companyRef);

  const filterByRole = (items: NavItem[]) => 
    items.filter(item => !item.roles || item.roles.includes(userRole));

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/auth/login");
  };

  const filteredOp = filterByRole(operationalItems);
  const filteredInv = filterByRole(inventoryItems);
  const filteredBus = filterByRole(businessItems);
  const filteredSet = filterByRole(settingsItems);

  const handleNavClick = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar className="border-r border-border/50 bg-slate-950 text-slate-300">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 relative overflow-hidden flex items-center justify-center shrink-0">
            {company?.logoUrl ? (
              <FirebaseImage 
                url={company.logoUrl} 
                alt={company.name} 
                className="h-full w-full"
              />
            ) : (
              <img 
                src="/logogenko.png" 
                alt="GENKO" 
                className="h-8 w-auto object-contain" 
                onError={(e) => (e.currentTarget.src = "https://placehold.co/100x100?text=GENKO")} 
              />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-black text-sm tracking-tighter text-white uppercase truncate">
              {isSuperAdmin ? "CORE INFRA" : (company?.name || "GENKO ERP")}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Gestión Inteligente</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        {!isSuperAdmin ? (
          <>
            {filteredOp.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase text-slate-600 tracking-[0.2em] mb-2">Cartera & Operación</SidebarGroupLabel>
                <SidebarMenu>
                  {filteredOp.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={pathname === item.href}
                        onClick={handleNavClick}
                        className={cn(
                          "rounded-xl px-4 h-11 transition-all",
                          item.highlight && "bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 font-bold",
                          !item.highlight && "hover:bg-white/5"
                        )}
                      >
                        <Link href={item.href}>
                          <item.icon className={cn("h-4 w-4", item.highlight && "text-blue-400")} />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            )}

            {filteredInv.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase text-slate-600 tracking-[0.2em] mb-2">Recursos & Activos</SidebarGroupLabel>
                <SidebarMenu>
                  {filteredInv.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={pathname === item.href} onClick={handleNavClick} className="rounded-xl px-4 h-11 hover:bg-white/5">
                        <Link href={item.href}><item.icon className="h-4 w-4" /><span>{item.title}</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            )}

            {filteredBus.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase text-slate-600 tracking-[0.2em] mb-2">Gestión Comercial</SidebarGroupLabel>
                <SidebarMenu>
                  {filteredBus.map((item) => {
                    const isLocked = item.featureFlag && !features[item.featureFlag as keyof typeof features];
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={pathname === item.href} 
                          onClick={handleNavClick}
                          className={cn(
                            "rounded-xl px-4 h-11 transition-all",
                            isLocked ? "opacity-50 grayscale hover:bg-transparent" : "hover:bg-white/5"
                          )}
                        >
                          <Link href={isLocked ? "/subscription" : item.href}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                            {isLocked && <Lock className="h-3 w-3 ml-auto text-amber-500" />}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            )}

            {filteredSet.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase text-slate-600 tracking-[0.2em] mb-2">Sistema & Config</SidebarGroupLabel>
                <SidebarMenu>
                  {filteredSet.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={pathname === item.href} onClick={handleNavClick} className="rounded-xl px-4 h-11 hover:bg-white/5">
                        <Link href={item.href}><item.icon className="h-4 w-4" /><span>{item.title}</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            )}
          </>
        ) : (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-[10px] font-black uppercase text-blue-400 tracking-[0.2em] mb-2">Administración Global</SidebarGroupLabel>
            <SidebarMenu>
              {filterByRole(adminItems).map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} onClick={handleNavClick} className="rounded-xl px-4 h-11 hover:bg-blue-600/10 text-blue-100">
                    <Link href={item.href}><item.icon className="h-4 w-4" /><span>{item.title}</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="rounded-xl h-11 text-slate-500 hover:text-rose-400 hover:bg-rose-400/5" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span className="font-bold">Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
