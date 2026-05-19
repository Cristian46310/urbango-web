import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowDownToLine,
  BadgeCheck,
  BookUser,
  CreditCard,
  ChevronDown,
  AlertTriangle,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MapPin,
  Briefcase,
  BusFront,
  UserPlus,
  ShieldCheck,
  ShieldUser,
  Users,
  BarChart3,
  Building2,
  Bus,
  Route,
  MapPinned,
  CalendarClock,
  Link2,
  AlertCircle,
  Home,
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
import { useCardRechargePaymentReturn } from "@/hooks/business/useCardRechargePaymentReturn";
import { useAuthStore } from "@/store/security/authStore";

interface MenuItem {
  title: string;
  to: string;
  description: string;
  icon: typeof LayoutDashboard;
  requiredRoles?: string[]; // Roles required to see this menu item
}

const securityMenuItems: MenuItem[] = [
  { title: "Usuarios", to: "/app/users", description: "Gestion de usuarios", icon: Users, requiredRoles: ["ADMIN", "ADMIN_BUS", "SUPERVISER"] },
  { title: "Perfiles", to: "/app/profiles", description: "Gestion de perfiles", icon: ShieldUser, requiredRoles: ["ADMIN", "ADMIN_BUS", "SUPERVISER"] },
  { title: "Roles", to: "/app/roles", description: "Gestion de roles", icon: BadgeCheck, requiredRoles: ["ADMIN", "ADMIN_BUS", "SUPERVISER"] },
  { title: "Permisos", to: "/app/permissions", description: "Gestion de permisos", icon: KeyRound, requiredRoles: ["ADMIN", "ADMIN_BUS", "SUPERVISER"] },
];

const homeMenuItem: MenuItem = {
  title: "Home",
  to: "/app",
  description: "Resumen general",
  icon: LayoutDashboard,
};

const registerProfileMenuItem: MenuItem = {
  title: "Mi perfil",
  to: "/app/register-profile",
  description: "Registrarse como conductor o ciudadano",
  icon: UserPlus,
};

const teamMenuItem: MenuItem = {
  title: "Team",
  to: "/app/team",
  description: "Equipo del proyecto",
  icon: BookUser,
};

const businessAdminRoles = ["ADMIN", "ADMIN_BUS", "SUPERVISER"] as const;
const fleetMenuItems: MenuItem[] = [
  {
    title: "Registrar bus",
    to: "/app/fleet/register-bus",
    description: "Alta de vehículo en la flota",
    icon: BusFront,
    requiredRoles: ["ADMIN", "ADMIN_BUS", "SUPERVISER"],
  },
];

const businessMenuItems: MenuItem[] = [
  { title: "Recargar tarjeta", to: "/app/card-recharge", description: "Recarga prepagada con ePayco", icon: CreditCard, requiredRoles: ["CITIZEN", "ADMIN", "ADMIN_BUS", "SUPERVISER"] },
  { title: "Paraderos", to: "/app/nearby-stops", description: "Buscar paraderos cercanos", icon: MapPin, requiredRoles: ["CITIZEN", "DRIVER", "ADMIN", "ADMIN_BUS", "SUPERVISER"] },
  { title: "Descenso", to: "/app/ticket/alight", description: "Cerrar viaje y liberar cupo", icon: ArrowDownToLine, requiredRoles: ["CITIZEN", "DRIVER", "ADMIN", "ADMIN_BUS", "SUPERVISER"] },
  { title: "Reportar", to: "/app/incident-report", description: "Registrar incidente", icon: AlertTriangle, requiredRoles: ["DRIVER", "ADMIN", "ADMIN_BUS", "SUPERVISER"] },
  { title: "Dashboard", to: "/app/business/dashboard", description: "Analítica business", icon: BarChart3, requiredRoles: [...businessAdminRoles] },
  { title: "Rutas", to: "/app/business/routes", description: "Gestión de rutas", icon: Route, requiredRoles: [...businessAdminRoles] },
  { title: "Paradas admin", to: "/app/business/stops", description: "CRUD de paradas", icon: MapPinned, requiredRoles: [...businessAdminRoles] },
  { title: "Nodos", to: "/app/business/nodes", description: "Nodos ruta-parada", icon: Link2, requiredRoles: [...businessAdminRoles] },
  { title: "Empresas", to: "/app/business/enterprises", description: "Empresas de transporte", icon: Building2, requiredRoles: [...businessAdminRoles] },
  { title: "Buses", to: "/app/business/buses", description: "Flota de buses", icon: Bus, requiredRoles: [...businessAdminRoles] },
  { title: "Programación", to: "/app/business/schedulers", description: "Horarios", icon: CalendarClock, requiredRoles: [...businessAdminRoles] },
  { title: "Turnos", to: "/app/business/turns", description: "Turnos conductores", icon: CalendarClock, requiredRoles: [...businessAdminRoles] },
  { title: "Ciudadanos", to: "/app/business/citizens", description: "Admin ciudadanos", icon: Users, requiredRoles: [...businessAdminRoles] },
  { title: "Conductores", to: "/app/business/drivers", description: "Admin conductores", icon: Users, requiredRoles: [...businessAdminRoles] },
  { title: "Direcciones", to: "/app/business/addresses", description: "Direcciones", icon: Home, requiredRoles: [...businessAdminRoles] },
  { title: "Métodos de pago", to: "/app/business/payment-methods", description: "Catálogo pagos", icon: CreditCard, requiredRoles: [...businessAdminRoles] },
  { title: "Pagos ciudadano", to: "/app/business/payment-method-citizens", description: "Vínculos de pago", icon: CreditCard, requiredRoles: [...businessAdminRoles] },
  { title: "Incidentes", to: "/app/business/incidents", description: "Supervisión incidentes", icon: AlertCircle, requiredRoles: [...businessAdminRoles] },
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
  const { currentUser, logout, hasAnyRole } = useAuthStore();
  useCardRechargePaymentReturn();

  // Filter menu items based on user roles
  const visibleSecurityItems = securityMenuItems.filter((item) => {
    if (!item.requiredRoles) return true;
    const hasAccess = hasAnyRole(item.requiredRoles);
    return hasAccess;
  });

  const visibleFleetItems = fleetMenuItems.filter((item) => {
    if (!item.requiredRoles) return true;
    const hasAccess = hasAnyRole(item.requiredRoles);
    return hasAccess;
  });

  const visibleBusinessItems = businessMenuItems.filter((item) => {
    if (!item.requiredRoles) return true;
    const hasAccess = hasAnyRole(item.requiredRoles);
    return hasAccess;
  });

  // Show all menu items - route guards handle access control
  const homeActive = isActivePath(location.pathname, homeMenuItem.to);
  const registerProfileActive = isActivePath(
    location.pathname,
    registerProfileMenuItem.to,
  );
  const securityActive = visibleSecurityItems.some((item) => isActivePath(location.pathname, item.to));
  const teamActive = isActivePath(location.pathname, teamMenuItem.to);
  const fleetActive = visibleFleetItems.some((item) =>
    isActivePath(location.pathname, item.to),
  );
  const businessActive = visibleBusinessItems.some((item) => isActivePath(location.pathname, item.to));

  const [isSecurityOpen, setIsSecurityOpen] = useState(securityActive);
  const [isTeamOpen, setIsTeamOpen] = useState(teamActive);
  const [isFleetOpen, setIsFleetOpen] = useState(fleetActive);
  const [isBusinessOpen, setIsBusinessOpen] = useState(businessActive);

  const securityOpen = securityActive || isSecurityOpen;
  const teamOpen = teamActive || isTeamOpen;
  const fleetOpen = fleetActive || isFleetOpen;
  const businessOpen = businessActive || isBusinessOpen;

  const handleLogout = () => {
    logout();
    void navigate("/login");
  };

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
                    asChild
                    isActive={registerProfileActive}
                    title={registerProfileMenuItem.title}
                    size="sm"
                  >
                    <NavLink to={registerProfileMenuItem.to}>
                      <UserPlus className="size-4" />
                      <span className="font-medium">{registerProfileMenuItem.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Security menu - Only show if user has access to any security items */}
                {visibleSecurityItems.length > 0 && (
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
                        {visibleSecurityItems.map((item) => {
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
                )}

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

                {visibleFleetItems.length > 0 && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={fleetActive}
                    title="Flota"
                    size="sm"
                    className="justify-between"
                    onClick={() => { setIsFleetOpen(!fleetOpen); }}
                  >
                    <span className="flex items-center gap-2">
                      <BusFront />
                      <span className="font-medium">Flota</span>
                    </span>
                    <ChevronDown className={`size-4 transition-transform ${fleetOpen ? "rotate-180" : ""}`} />
                  </SidebarMenuButton>

                  {fleetOpen ? (
                    <SidebarMenuSub>
                      {visibleFleetItems.map((item) => {
                          const Icon = item.icon;
                          const active = isActivePath(location.pathname, item.to);

                          return (
                            <SidebarMenuSubItem key={item.to}>
                              <SidebarMenuSubButton asChild isActive={active}>
                                <NavLink to={item.to}>
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
                )}

                {/* Business menu - Only show if user has access to any business items */}
                {visibleBusinessItems.length > 0 && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={businessActive}
                    title="Business"
                    size="sm"
                    className="justify-between"
                    onClick={() => { setIsBusinessOpen(!businessOpen); }}
                  >
                    <span className="flex items-center gap-2">
                      <Briefcase />
                      <span className="font-medium">Business</span>
                    </span>
                    <ChevronDown className={`size-4 transition-transform ${businessOpen ? "rotate-180" : ""}`} />
                  </SidebarMenuButton>

                  {businessOpen ? (
                    <SidebarMenuSub>
                      {visibleBusinessItems.map((item) => {
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
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter>
          <div className="space-y-2">
            {currentUser && (
              <div className="px-2 py-2 text-xs text-muted-foreground rounded-md bg-accent/50">
                <p className="font-medium truncate">{currentUser.email}</p>
                <p className="text-xs">{currentUser.roles.join(", ")}</p>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              className="justify-start"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              Cerrar sesión
            </Button>
          </div>
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
