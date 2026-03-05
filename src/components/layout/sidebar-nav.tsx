
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
  LifeBuoy,
  FileText,
  Receipt
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
  SidebarGroupLabel
} from "@/components/ui/sidebar";
import { Role, Company } from "@/lib/types";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { FirebaseImage } from "@/components/FirebaseImage";

interface NavItem {
  title: string;
  href: string;
  icon: any;
  roles?: Role[];
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Calendario", href: "/calendar", icon: CalendarDays },
  { title: "Órdenes de Trabajo", href: "/work-orders", icon: ClipboardList },
  { title: "Facturación", href: "/billing", icon: Receipt, roles: ['companyAdmin', 'supervisor'] },
  { title: "Clientes", href: "/clients", icon: Users, roles: ['companyAdmin', 'supervisor'] },
  { title: "Activos e Equipos", href: "/assets", icon: HardHat, roles: ['companyAdmin', 'supervisor', 'tecnico'] },
  { title: "Inventario", href: "/inventory", icon: Package, roles: ['companyAdmin', 'supervisor', 'tecnico'] },
  { title: "Reportes", href: "/reports", icon: BarChart3, roles: ['companyAdmin', 'supervisor'] },
  { title: "Feedback Clientes", href: "/feedback", icon: MessageCircleHeart, roles: ['companyAdmin', 'supervisor'] },
  { title: "Mi Empresa", href: "/company", icon: Building2 },
  { title: "Equipo", href: "/team", icon: Users, roles: ['companyAdmin', 'supervisor'] },
  { title: "Revisiones", href: "/reviews", icon: ShieldCheck, roles: ['reviewer', 'supervisor'] },
  { title: "Suscripción", href: "/subscription", icon: CreditCard, roles: ['companyAdmin'] },
];

const adminItems: NavItem[] = [
  { title: "Control Maestro", href: "/admin", icon: Globe, roles: ['superadmin'] },
  { title: "Soporte Técnico", href: "/support", icon: LifeBuoy, roles: ['superadmin'] },
  { title: "Empresas Registradas", href: "/admin/companies", icon: Building2, roles: ['superadmin'] },
  { title: "Usuarios Globales", href: "/admin/users", icon: Users, roles: ['superadmin'] },
  { title: "Tickets Globales", href: "/admin/support", icon: LifeBuoy, roles: ['superadmin'] },
  { title: "Estadísticas SaaS", href: "/admin/stats", icon: BarChart3, roles: ['superadmin'] },
];

export function SidebarNav({ userRole = 'tecnico' }: { userRole?: Role }) {
  const pathname = usePathname();
  const { profile, isSuperAdmin } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();

  const companyRef = useMemoFirebase(() => {
    if (!db || !profile?.companyId) return null;
    return doc(db, "companies", profile.companyId);
  }, [db, profile?.companyId]);

  const { data: company } = useDoc<Company>(companyRef);

  const filteredItems = isSuperAdmin ? [] : navItems.filter(item => 
    !item.roles || item.roles.includes(userRole)
  );

  const filteredAdminItems = adminItems.filter(item => 
    item.roles?.includes(userRole)
  );

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/auth/login");
  };

  return (
    <Sidebar className="border-r border-border/50 bg-card">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          {isSuperAdmin ? (
            <div className="bg-primary p-2 rounded-lg">
              <ShieldCheck className="text-primary-foreground h-6 w-6" />
            </div>
          ) : company?.logoUrl ? (
            <div className="h-10 w-10 relative overflow-hidden rounded-lg border bg-white flex items-center justify-center">
              <FirebaseImage 
                url={company.logoUrl} 
                alt={company.name} 
                className="h-full w-full"
              />
            </div>
          ) : (
            <div className="bg-primary p-2 rounded-lg">
              <Settings className="text-primary-foreground h-6 w-6" />
            </div>
          )}
          <span className="font-bold text-xl tracking-tight text-primary uppercase truncate max-w-[140px]">
            {isSuperAdmin ? "CONTROL MAESTRO" : (company?.name || "PCGMANT")}
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {!isSuperAdmin && filteredItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {filteredAdminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-primary font-bold">Administración Global</SidebarGroupLabel>
            <SidebarMenu>
              {filteredAdminItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    className="text-primary hover:bg-primary/5"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="text-muted-foreground hover:text-destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
