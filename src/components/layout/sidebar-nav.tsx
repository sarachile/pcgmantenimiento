
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  Building2, 
  Settings, 
  ShieldCheck,
  CreditCard,
  LogOut,
  BarChart3,
  Globe
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
import { Role } from "@/lib/types";

interface NavItem {
  title: string;
  href: string;
  icon: any;
  roles?: Role[];
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Órdenes de Trabajo", href: "/work-orders", icon: ClipboardList },
  { title: "Mi Empresa", href: "/company", icon: Building2, roles: ['companyAdmin', 'supervisor'] },
  { title: "Equipo", href: "/team", icon: Users, roles: ['companyAdmin', 'supervisor'] },
  { title: "Revisiones", href: "/reviews", icon: ShieldCheck, roles: ['reviewer', 'supervisor'] },
  { title: "Suscripción", href: "/subscription", icon: CreditCard, roles: ['companyAdmin'] },
];

const adminItems: NavItem[] = [
  { title: "Control Plataforma", href: "/admin", icon: Globe, roles: ['superadmin'] },
  { title: "Empresas", href: "/admin/companies", icon: Building2, roles: ['superadmin'] },
  { title: "Usuarios Globales", href: "/admin/users", icon: Users, roles: ['superadmin'] },
  { title: "Estadísticas", href: "/admin/stats", icon: BarChart3, roles: ['superadmin'] },
];

export function SidebarNav({ userRole = 'tecnico' }: { userRole?: Role }) {
  const pathname = usePathname();

  const filteredItems = navItems.filter(item => 
    !item.roles || item.roles.includes(userRole)
  );

  const filteredAdminItems = adminItems.filter(item => 
    item.roles?.includes(userRole)
  );

  return (
    <Sidebar className="border-r border-border/50 bg-card">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <ShieldCheck className="text-primary-foreground h-6 w-6" />
          </div>
          <span className="font-bold text-xl tracking-tight text-primary">PCGMANT</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
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

        {filteredAdminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administración SaaS</SidebarGroupLabel>
            <SidebarMenu>
              {filteredAdminItems.map((item) => (
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
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
