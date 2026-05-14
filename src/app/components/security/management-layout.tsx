import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  BookUser,
  ArrowDownToLine,
  ChevronDown,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MapPin,
  ShieldCheck,
  ShieldUser,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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

const securityMenuItems: MenuItem[] = [
  { title: "Usuarios", to: "/app/users", description: "Gestion de usuarios", icon: Users },
  { title: "Perfiles", to: "/app/profiles", description: "Gestion de perfiles", icon: ShieldUser },
  { title: "Roles", to: "/app/roles", description: "Gestion de roles", icon: BadgeCheck },
  { title: "Permisos", to: "/app/permissions", description: "Gestion de permisos", icon: KeyRound },
];

const homeMenuItem: MenuItem = {
  title: "Home",
  to: "/app",
  description: "Resumen general",
  icon: LayoutDashboard,
};

const teamMenuItem: MenuItem = {
  title: "Team",
  to: "/app/team",
  description: "Equipo del proyecto",
  icon: BookUser,
};

const nearbyStopsMenuItem: MenuItem = {
  title: "Paraderos",
  to: "/app/nearby-stops",
  description: "Buscar paraderos cercanos",
  icon: MapPin,
};

const ticketAlightMenuItem: MenuItem = {
  title: "Descenso",
  to: "/app/ticket/alight",
  description: "Cerrar viaje y liberar cupo",
  icon: ArrowDownToLine,
};

function isActivePath(pathname: string, target: string) {
  if (target === "/app") {
    return pathname === "/app";
  }

  return pathname === target || pathname.startsWith(`${target}/`);
}

export function ManagementLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const homeActive = isActivePath(location.pathname, homeMenuItem.to);
  const securityActive = securityMenuItems.some((item) => isActivePath(location.pathname, item.to));
  const teamActive = isActivePath(location.pathname, teamMenuItem.to);
  const nearbyStopsActive = isActivePath(location.pathname, nearbyStopsMenuItem.to);
  const ticketAlightActive = isActivePath(location.pathname, ticketAlightMenuItem.to);

  const [isSecurityOpen, setIsSecurityOpen] = useState(securityActive);
  const [isTeamOpen, setIsTeamOpen] = useState(teamActive);

  const securityOpen = securityActive || isSecurityOpen;
  const teamOpen = teamActive || isTeamOpen;

  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="icon" className="overflow-hidden">
        <SidebarHeader>
          <div
            className="rounded-2xl border border-(--security-border) px-4 py-4 text-(--security-foreground) shadow-sm transition-all group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2"
            style={{
              backgroundImage:
                "linear-gradient(160deg, var(--security-hero-start) 0%, var(--security-hero-end) 100%)",
            }}
          >
            <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
              <img
                src={busLogo}
                alt="Bus UCaldas"
                className="size-10 rounded-md bg-white p-1 group-data-[collapsible=icon]:size-8"
              />
              <div className="group-data-[collapsible=icon]:hidden">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">UCaldas</p>
                <h1 className="text-lg font-semibold text-white">Backend UI</h1>
              </div>
            </div>
            <p className="mt-2 text-sm text-white/85 group-data-[collapsible=icon]:hidden">security/ panel de administracion</p>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={homeActive} title={homeMenuItem.title} size="sm">
                    <NavLink to={homeMenuItem.to} end>
                      <LayoutDashboard className="size-4" />
                      <span className="font-medium">{homeMenuItem.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={securityActive}
                    title="Security"
                    size="sm"
                    className="justify-between"
                    onClick={() => { setIsSecurityOpen(!securityOpen); }}
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck />
                      <span className="font-medium">Security</span>
                    </span>
                    <ChevronDown className={`size-4 transition-transform ${securityOpen ? "rotate-180" : ""}`} />
                  </SidebarMenuButton>

                  {securityOpen ? (
                    <SidebarMenuSub>
                      {securityMenuItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActivePath(location.pathname, item.to);

                        return (
                          <SidebarMenuSubItem key={item.to}>
                            <SidebarMenuSubButton asChild isActive={active}>
                              <NavLink to={item.to} end={item.to === "/app"}>
                                <Icon className="size-4" />
                                <span>{item.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={teamActive}
                    title="Team"
                    size="sm"
                    className="justify-between"
                    onClick={() => { setIsTeamOpen(!teamOpen); }}
                  >
                    <span className="flex items-center gap-2">
                      <BookUser />
                      <span className="font-medium">Team</span>
                    </span>
                    <ChevronDown className={`size-4 transition-transform ${teamOpen ? "rotate-180" : ""}`} />
                  </SidebarMenuButton>

                  {teamOpen ? (
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={teamActive}>
                          <NavLink to={teamMenuItem.to}>
                            <BookUser className="size-4" />
                            <span>{teamMenuItem.title}</span>
                          </NavLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={nearbyStopsActive} title={nearbyStopsMenuItem.title} size="sm">
                    <NavLink to={nearbyStopsMenuItem.to} end>
                      <MapPin className="size-4" />
                      <span className="font-medium">{nearbyStopsMenuItem.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={ticketAlightActive} title={ticketAlightMenuItem.title} size="sm">
                    <NavLink to={ticketAlightMenuItem.to} end>
                      <ArrowDownToLine className="size-4" />
                      <span className="font-medium">{ticketAlightMenuItem.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
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
            <div className="flex items-center gap-3">
              <div className="hidden rounded-full border border-(--security-border) bg-(--security-surface) px-4 py-2 text-sm text-(--security-muted-foreground) md:block">
                <span className="flex items-center gap-2">
                  <img src={busLogo} alt="Bus UCaldas" className="size-5" />
                  Bus UCaldas
                </span>
              </div>
            </div>
          </div>
        </div>

        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}