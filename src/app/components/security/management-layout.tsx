import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  BookUser,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
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

type MenuItem = {
  title: string;
  to: string;
  description: string;
  icon: typeof LayoutDashboard;
};

const menuItems: MenuItem[] = [
  { title: "Inicio", to: "/app", description: "Resumen general", icon: LayoutDashboard },
  { title: "Usuarios", to: "/app/users", description: "CRUD de usuarios", icon: Users },
  { title: "Perfiles", to: "/app/profiles", description: "Datos de perfil", icon: ShieldUser },
  { title: "Roles", to: "/app/roles", description: "Consulta de roles", icon: BadgeCheck },
  { title: "Permisos", to: "/app/permissions", description: "CRUD de permisos", icon: KeyRound },
  { title: "Sesiones", to: "/app/sessions", description: "Administración de sesiones", icon: LockKeyhole },
  { title: "Usuario / Rol", to: "/app/user-roles", description: "Asignaciones de roles", icon: UserCog },
  { title: "Rol / Permiso", to: "/app/role-permissions", description: "Asignaciones de permisos", icon: ShieldCheck },
  { title: "Equipo", to: "/team", description: "Autores del proyecto", icon: BookUser },
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
          <div className="rounded-2xl border border-slate-200 bg-slate-950 px-4 py-4 text-white shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">UCaldas</p>
            <h1 className="mt-2 text-lg font-semibold">Backend UI</h1>
            <p className="mt-1 text-sm text-slate-300">Administración de seguridad y acceso</p>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Secciones</SidebarGroupLabel>
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
                            <span className="block text-xs text-slate-500">{item.description}</span>
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
        <div className="border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Panel de administración</p>
                <h2 className="text-lg font-semibold text-slate-900">Gestión de módulos de seguridad</h2>
              </div>
            </div>
            <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 md:block">
              Navegación basada en hooks
            </div>
          </div>
        </div>

        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}