import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  BookUser,
  KeyRound,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  ShieldUser,
  UserCog,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import busLogo from "@/assets/icons/images.png";

interface MenuItem {
  title: string;
  to: string;
  description: string;
  icon: typeof LayoutDashboard;
}

const menuItems: MenuItem[] = [
  { title: "Inicio", to: "/app", description: "Resumen general", icon: LayoutDashboard },
  { title: "Usuarios", to: "/app/users", description: "Gestion de usuarios", icon: Users },
  { title: "Perfiles", to: "/app/profiles", description: "Gestion de perfiles", icon: ShieldUser },
  { title: "Roles", to: "/app/roles", description: "Gestion de roles", icon: BadgeCheck },
  { title: "Permisos", to: "/app/permissions", description: "Gestion de permisos", icon: KeyRound },
  { title: "Usuario / Rol", to: "/app/user-roles", description: "Gestion de asignaciones", icon: UserCog },
  { title: "Rol / Permiso", to: "/app/role-permissions", description: "Gestion de permisos por rol", icon: ShieldCheck },
  { title: "Equipo", to: "/app/team", description: "Equipo del proyecto", icon: BookUser },
];

function isActivePath(pathname: string, target: string) {
  if (target === "/app") {
    return pathname === "/app";
  }

  return pathname === target || pathname.startsWith(`${target}/`);
}

export function ManagementLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="icon">
        <SidebarHeader>
          <div
            className="rounded-2xl border border-(--security-border) px-4 py-4 text-(--security-foreground) shadow-sm"
            style={{
              backgroundImage:
                "linear-gradient(160deg, var(--security-hero-start) 0%, var(--security-hero-end) 100%)",
            }}
          >
            <div className="flex items-center gap-3">
              <img src={busLogo} alt="Bus UCaldas" className="size-10 rounded-md bg-white p-1" />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">UCaldas</p>
                <h1 className="text-lg font-semibold text-white">Backend UI</h1>
              </div>
            </div>
            <p className="mt-2 text-sm text-white/85">security/ panel de administracion</p>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>security/</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => {
                  const active = isActivePath(location.pathname, item.to);
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={active} title={item.title}>
                        <NavLink to={item.to} end={item.to === "/app"}>
                          <Icon />
                          <span>
                            <span className="block font-medium">{item.title}</span>
                            <span className="block text-xs text-(--security-muted-foreground)">{item.description}</span>
                          </span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter>
          <Button
            type="button"
            variant="outline"
            className="justify-start"
            onClick={() => {
              localStorage.removeItem("authToken");
              void navigate("/login");
            }}
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <div className="border-b border-(--security-border) bg-(--security-surface) px-6 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-(--security-muted-foreground)">Panel de administración</p>
                <h2 className="text-lg font-semibold text-(--security-foreground)">Gestión de módulos de seguridad</h2>
              </div>
            </div>
            <div className="hidden rounded-full border border-(--security-border) bg-(--security-surface) px-4 py-2 text-sm text-(--security-muted-foreground) md:block">
              <span className="flex items-center gap-2">
                <img src={busLogo} alt="Bus UCaldas" className="size-5" />
                Bus UCaldas
              </span>
            </div>
          </div>
        </div>

        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}