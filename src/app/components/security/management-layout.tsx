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
  Users,
  BarChart3,
  Building2,
  Bus,
  Route,
  MapPinned,
  CalendarClock,
  Link2,
  AlertCircle,
  Wrench,
  MessageCircle,
  Bell,
  Megaphone,
  Headset,
  CalendarCheck,
  FileText,
  SlidersHorizontal,
} from "lucide-react";

import { GlobalAlertsListener } from "@/app/components/alerts/GlobalAlertsListener";
import { WeatherTicker } from "@/app/components/weather/WeatherTicker";

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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import busLogo from "@/assets/icons/images.png";
import { useCardRechargePaymentReturn } from "@/hooks/business/useCardRechargePaymentReturn";
import { useInboxUnreadCount } from "@/hooks/messaging/useInboxUnreadCount";
import { useAlertsUnreadCount } from "@/hooks/alerts/useAlertsUnreadCount";
import { useAuthStore } from "@/store/security/authStore";
import { ROLES, ROLE_GROUPS } from "@/core/domain/entities/security/Roles";

interface MenuItem {
  title: string;
  to: string;
  description: string;
  icon: typeof LayoutDashboard;
  requiredRoles?: string[]; // Roles required to see this menu item
}

const CITIZEN_AND_ADMIN_ROLES = [ROLES.CITIZEN, ...ROLE_GROUPS.ADMIN_ROLES];

const securityMenuItems: MenuItem[] = [
  { title: "Usuarios", to: "/app/users", description: "Gestion de usuarios", icon: Users, requiredRoles: [...ROLE_GROUPS.ADMIN_ROLES] },
  { title: "Roles", to: "/app/roles", description: "Gestion de roles", icon: BadgeCheck, requiredRoles: [...ROLE_GROUPS.ADMIN_ROLES] },
  { title: "Permisos", to: "/app/permissions", description: "Gestion de permisos", icon: KeyRound, requiredRoles: [...ROLE_GROUPS.ADMIN_ROLES] },
  { title: "Alertas masivas", to: "/app/admin/mass-alerts", description: "Envío de alertas masivas", icon: Megaphone, requiredRoles: [...ROLE_GROUPS.MASS_ALERTS] },
];


const globalAdminMenuItems: MenuItem[] = [
  { title: "Distribución Edades", to: "/app/reports/age-distribution", description: "Reporte demográfico de usuarios", icon: BarChart3, requiredRoles: ["admin", "ADMIN"] },
];

const homeMenuItem: MenuItem = {
  title: "Inicio",
  to: "/app",
  description: "Resumen general",
  icon: LayoutDashboard,
};

const registerProfileMenuItem: MenuItem = {
  title: "Mi perfil",
  to: "/app/register-profile",
  description: "Perfil ciudadano o conductor (ms-business)",
  icon: UserPlus,
};

const teamMenuItem: MenuItem = {
  title: "Equipo",
  to: "/app/team",
  description: "Equipo del proyecto",
  icon: BookUser,
};

const messagingMenuItem: MenuItem = {
  title: "Mensajería",
  to: "/app/messaging",
  description: "Mensajes directos en tiempo real",
  icon: MessageCircle,
};

const alertsMenuItem: MenuItem = {
  title: "Alertas",
  to: "/app/alerts",
  description: "Avisos del sistema",
  icon: Bell,
};

const preferencesMenuItem: MenuItem = {
  title: "Preferencias",
  to: "/app/profile/preferences",
  description: "Alertas de clima para tu viaje",
  icon: SlidersHorizontal,
  requiredRoles: CITIZEN_AND_ADMIN_ROLES,
};

const supportMenuItems: MenuItem[] = [
  {
    title: "Citas de reclamos",
    to: "/app/support/appointments",
    description: "Agenda y gestiona citas de atención",
    icon: CalendarCheck,
    requiredRoles: CITIZEN_AND_ADMIN_ROLES,
  },
  {
    title: "PQRS",
    to: "/app/support/pqrs",
    description: "Peticiones, quejas, reclamos y sugerencias",
    icon: FileText,
    requiredRoles: CITIZEN_AND_ADMIN_ROLES,
  },
];

const businessAdminRoles = [
  ROLES.ADMIN,
  ROLES.BUSINESS_ADMIN,
  ROLES.SUPERVISOR,
  ROLES.ADMIN_BUS,
  ROLES.SUPERVISER,
] as const;
const fleetMenuItems: MenuItem[] = [
  {
    title: "Registrar bus",
    to: "/app/fleet/register-bus",
    description: "Alta de vehículo en la flota",
    icon: BusFront,
    requiredRoles: [...ROLE_GROUPS.FLEET_ACCESS],
  },
];

const businessMenuItems: MenuItem[] = [
  { title: "Rutas", to: "/app/planning/routes", description: "Consultar rutas; crear/editar si eres admin", icon: Route, requiredRoles: [...ROLE_GROUPS.PARADEROS_ACCESS] },
  { title: "Paraderos cercanos", to: "/app/nearby-stops", description: "Top 5 paraderos con GPS", icon: MapPin, requiredRoles: [...ROLE_GROUPS.PARADEROS_ACCESS] },
  { title: "Abordar", to: "/app/boarding", description: "Registrar abordaje y boleto", icon: BusFront, requiredRoles: CITIZEN_AND_ADMIN_ROLES },
  { title: "Descenso", to: "/app/ticket/alight", description: "Cerrar viaje activo", icon: ArrowDownToLine, requiredRoles: [...ROLE_GROUPS.DESCENSO_ACCESS] },
  { title: "Mis viajes", to: "/app/trips", description: "Historial y mapa de viajes", icon: MapPinned, requiredRoles: CITIZEN_AND_ADMIN_ROLES },
  { title: "Métodos de pago", to: "/app/payment-methods", description: "Vincular métodos y ver saldo", icon: CreditCard, requiredRoles: CITIZEN_AND_ADMIN_ROLES },
  { title: "Recargar tarjeta", to: "/app/card-recharge", description: "Recarga prepagada con ePayco", icon: CreditCard, requiredRoles: CITIZEN_AND_ADMIN_ROLES },
  { title: "Iniciar turno", to: "/app/driver/turn-start", description: "Turno y GPS del bus", icon: Bus, requiredRoles: [...ROLE_GROUPS.INCIDENT_REPORT_ACCESS] },
  { title: "Reportar incidente", to: "/app/incident-report", description: "Formulario conductor", icon: AlertTriangle, requiredRoles: [...ROLE_GROUPS.INCIDENT_REPORT_ACCESS] },
  { title: "Dashboard", to: "/app/business/dashboard", description: "Analítica business", icon: BarChart3, requiredRoles: [...ROLE_GROUPS.DASHBOARD_OPS] },
  { title: "Paradas admin", to: "/app/business/stops", description: "CRUD de paradas", icon: MapPinned, requiredRoles: [...businessAdminRoles] },
  { title: "Nodos", to: "/app/business/nodes", description: "Nodos ruta-parada", icon: Link2, requiredRoles: [...businessAdminRoles] },
  { title: "Empresas", to: "/app/business/enterprises", description: "Empresas de transporte", icon: Building2, requiredRoles: [...businessAdminRoles] },
  { title: "Buses", to: "/app/business/buses", description: "Flota de buses", icon: Bus, requiredRoles: [...businessAdminRoles] },
  { title: "Programación", to: "/app/business/schedulers", description: "Horarios", icon: CalendarClock, requiredRoles: [...businessAdminRoles] },
  { title: "Turnos", to: "/app/business/turns", description: "Turnos conductores", icon: CalendarClock, requiredRoles: [...businessAdminRoles] },
  { title: "Ciudadanos", to: "/app/business/citizens", description: "Admin ciudadanos", icon: Users, requiredRoles: [...businessAdminRoles] },
  { title: "Conductores", to: "/app/business/drivers", description: "Admin conductores", icon: Users, requiredRoles: [...businessAdminRoles] },
  { title: "Catálogo de pagos", to: "/app/business/payment-methods", description: "Catálogo admin", icon: CreditCard, requiredRoles: [...businessAdminRoles] },
  { title: "Incidentes", to: "/app/business/incidents", description: "Supervisión incidentes", icon: AlertCircle, requiredRoles: [...businessAdminRoles] },
];

function isActivePath(pathname: string, target: string) {
  if (target === "/app") {
    return pathname === "/app";
  }
  return pathname === target || pathname.startsWith(`${target}/`);
}

const parentMenuButtonClass = (open: boolean) =>
  [
    "h-9 justify-between rounded-lg border px-2.5 transition-colors",
    "[&_svg]:size-4 [&_svg]:stroke-[1.75]",
    "data-[active=true]:border-teal-200 data-[active=true]:bg-teal-50 data-[active=true]:text-teal-800",
    "dark:data-[active=true]:border-teal-800 dark:data-[active=true]:bg-teal-950/60 dark:data-[active=true]:text-teal-200",
    open
      ? "border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100 hover:text-teal-900 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-200"
      : "border-transparent hover:bg-teal-50/70 hover:text-teal-800 dark:hover:bg-teal-950/40 dark:hover:text-teal-200",
  ].join(" ");

const directMenuButtonClass =
  "h-9 rounded-lg px-2.5 [&_svg]:size-4 [&_svg]:stroke-[1.75] hover:bg-teal-50/70 hover:text-teal-800 data-[active=true]:bg-teal-50 data-[active=true]:text-teal-800 dark:hover:bg-teal-950/40 dark:hover:text-teal-200 dark:data-[active=true]:bg-teal-950/60 dark:data-[active=true]:text-teal-200";

const submenuClass =
  "mx-0 ml-4 translate-x-0 gap-1 border-l-2 border-teal-200 px-0 py-1.5 pl-3 dark:border-teal-800";

const submenuButtonClass =
  "h-8 rounded-lg px-2.5 [&_svg]:size-4 [&_svg]:stroke-[1.75] hover:bg-teal-50 hover:text-teal-800 data-[active=true]:bg-teal-100 data-[active=true]:font-medium data-[active=true]:text-teal-900 dark:hover:bg-teal-950/50 dark:hover:text-teal-200 dark:data-[active=true]:bg-teal-900/60 dark:data-[active=true]:text-teal-100";

const sectionLabelClass =
  "h-7 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400";

function roleBadgeClass(role: string) {
  const normalized = role.toUpperCase();
  if (normalized.includes("ADMIN")) {
    return "border-teal-200 bg-teal-50 text-teal-800";
  }
  if (normalized.includes("DRIVER")) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  if (normalized.includes("SUPERVIS")) {
    return "border-violet-200 bg-violet-50 text-violet-800";
  }
  if (normalized.includes("CITIZEN")) {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function ManagementLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout, hasAnyRole } = useAuthStore();
  const { count: inboxUnreadCount } = useInboxUnreadCount(Boolean(currentUser?.id));
  const { count: alertsUnreadCount } = useAlertsUnreadCount(Boolean(currentUser?.id));
  useCardRechargePaymentReturn();

  // Filter menu items based on user roles
  const visibleSecurityItems = securityMenuItems.filter((item) => {
    if (!item.requiredRoles) return true;
    return hasAnyRole(item.requiredRoles);
  });

  const visibleFleetItems = fleetMenuItems.filter((item) => {
    if (!item.requiredRoles) return true;
    return hasAnyRole(item.requiredRoles);
  });

  const visibleBusinessItems = businessMenuItems.filter((item) => {
    if (!item.requiredRoles) return true;
    return hasAnyRole(item.requiredRoles);
  });


  const visibleGlobalAdminItems = globalAdminMenuItems.filter((item) => {
    if (!item.requiredRoles) return true;
    return hasAnyRole(item.requiredRoles);
  });

  const visibleSupportItems = supportMenuItems.filter((item) => {
    if (!item.requiredRoles) return true;
    return hasAnyRole(item.requiredRoles);
  });

  const showPreferences = !preferencesMenuItem.requiredRoles ||
    hasAnyRole(preferencesMenuItem.requiredRoles);

  // Show all menu items - route guards handle access control
  const homeActive = isActivePath(location.pathname, homeMenuItem.to);
  const registerProfileActive = isActivePath(location.pathname, registerProfileMenuItem.to);
  const preferencesActive = isActivePath(location.pathname, preferencesMenuItem.to);
  const securityActive = visibleSecurityItems.some((item) => isActivePath(location.pathname, item.to));
  const teamActive = isActivePath(location.pathname, teamMenuItem.to);
  const messagingActive = isActivePath(location.pathname, messagingMenuItem.to);
  const alertsActive = isActivePath(location.pathname, alertsMenuItem.to);
  const fleetActive = visibleFleetItems.some((item) => isActivePath(location.pathname, item.to));
  const businessActive = visibleBusinessItems.some((item) => isActivePath(location.pathname, item.to));
  const supportActive = visibleSupportItems.some((item) => isActivePath(location.pathname, item.to));

  const globalAdminActive = visibleGlobalAdminItems.some((item) => isActivePath(location.pathname, item.to));

  const [isSecurityOpen, setIsSecurityOpen] = useState(securityActive);
  const [isTeamOpen, setIsTeamOpen] = useState(teamActive);
  const [isFleetOpen, setIsFleetOpen] = useState(fleetActive);
  const [isBusinessOpen, setIsBusinessOpen] = useState(businessActive);
  const [isSupportOpen, setIsSupportOpen] = useState(supportActive);
  const [isGlobalAdminOpen, setIsGlobalAdminOpen] = useState(globalAdminActive);

  const securityOpen = securityActive || isSecurityOpen;
  const teamOpen = teamActive || isTeamOpen;
  const fleetOpen = fleetActive || isFleetOpen;
  const businessOpen = businessActive || isBusinessOpen;
  const supportOpen = supportActive || isSupportOpen;
  const globalAdminOpen = globalAdminActive || isGlobalAdminOpen;

  const handleLogout = () => {
    logout();
    void navigate("/login");
  };

  return (
    <SidebarProvider>
      <GlobalAlertsListener enabled={Boolean(currentUser?.id)} />
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
                alt="urbanGO"
                className="size-10 rounded-md bg-white p-1 group-data-[collapsible=icon]:size-8"
              />
              <div className="group-data-[collapsible=icon]:hidden">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">urbanGO</p>
                <h1 className="text-lg font-semibold text-white">Movilidad urbana</h1>
              </div>
            </div>
            <p className="mt-2 text-sm text-white/85 group-data-[collapsible=icon]:hidden">Panel de administración</p>
          </div>
        </SidebarHeader>

        <SidebarContent className="gap-1">
          <SidebarGroup className="pb-1">
            <SidebarGroupLabel className={sectionLabelClass}>General</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={homeActive}
                    title={homeMenuItem.title}
                    className={directMenuButtonClass}
                  >
                    <NavLink to={homeMenuItem.to} end>
                      <LayoutDashboard />
                      <span className="font-medium">{homeMenuItem.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={registerProfileActive}
                    title={registerProfileMenuItem.title}
                    className={directMenuButtonClass}
                  >
                    <NavLink to={registerProfileMenuItem.to}>
                      <UserPlus />
                      <span className="font-medium">{registerProfileMenuItem.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {showPreferences && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={preferencesActive}
                      title={preferencesMenuItem.title}
                      className={directMenuButtonClass}
                    >
                      <NavLink to={preferencesMenuItem.to}>
                        <SlidersHorizontal />
                        <span className="font-medium">{preferencesMenuItem.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="py-2">
            <SidebarGroupLabel className={sectionLabelClass}>Administración</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleSecurityItems.length > 0 && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={securityActive}
                      title="Seguridad"
                      className={parentMenuButtonClass(securityOpen)}
                      onClick={() => { setIsSecurityOpen(!securityOpen); }}
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck />
                        <span className="font-medium">Seguridad</span>
                      </span>
                      <ChevronDown className={`transition-transform ${securityOpen ? "rotate-180" : ""}`} />
                    </SidebarMenuButton>
                    {securityOpen ? (
                      <SidebarMenuSub className={submenuClass}>
                        {visibleSecurityItems.map((item) => {
                          const Icon = item.icon;
                          const active = isActivePath(location.pathname, item.to);
                          return (
                            <SidebarMenuSubItem key={item.to}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={active}
                                className={submenuButtonClass}
                              >
                                <NavLink to={item.to} end={item.to === "/app"}>
                                  <Icon />
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

                {visibleGlobalAdminItems.length > 0 && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={globalAdminActive}
                      title="Configuración del sistema"
                      className={parentMenuButtonClass(globalAdminOpen)}
                      onClick={() => { setIsGlobalAdminOpen(!globalAdminOpen); }}
                    >
                      <span className="flex items-center gap-2">
                        <Wrench />
                        <span className="font-medium">Configuración</span>
                      </span>
                      <ChevronDown className={`transition-transform ${globalAdminOpen ? "rotate-180" : ""}`} />
                    </SidebarMenuButton>
                    {globalAdminOpen ? (
                      <SidebarMenuSub className={submenuClass}>
                        {visibleGlobalAdminItems.map((item) => {
                          const Icon = item.icon;
                          const active = isActivePath(location.pathname, item.to);
                          return (
                            <SidebarMenuSubItem key={item.to}>
                              <SidebarMenuSubButton asChild isActive={active} className={submenuButtonClass}>
                                <NavLink to={item.to}>
                                  <Icon />
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
                    title="Equipo"
                    className={parentMenuButtonClass(teamOpen)}
                    onClick={() => { setIsTeamOpen(!teamOpen); }}
                  >
                    <span className="flex items-center gap-2">
                      <BookUser />
                      <span className="font-medium">Equipo</span>
                    </span>
                    <ChevronDown className={`transition-transform ${teamOpen ? "rotate-180" : ""}`} />
                  </SidebarMenuButton>
                  {teamOpen ? (
                    <SidebarMenuSub className={submenuClass}>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={teamActive} className={submenuButtonClass}>
                          <NavLink to={teamMenuItem.to}>
                            <BookUser />
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
                      className={parentMenuButtonClass(fleetOpen)}
                      onClick={() => { setIsFleetOpen(!fleetOpen); }}
                    >
                      <span className="flex items-center gap-2">
                        <BusFront />
                        <span className="font-medium">Flota</span>
                      </span>
                      <ChevronDown className={`transition-transform ${fleetOpen ? "rotate-180" : ""}`} />
                    </SidebarMenuButton>
                    {fleetOpen ? (
                      <SidebarMenuSub className={submenuClass}>
                        {visibleFleetItems.map((item) => {
                          const Icon = item.icon;
                          const active = isActivePath(location.pathname, item.to);
                          return (
                            <SidebarMenuSubItem key={item.to}>
                              <SidebarMenuSubButton asChild isActive={active} className={submenuButtonClass}>
                                <NavLink to={item.to}>
                                  <Icon />
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

                {visibleBusinessItems.length > 0 && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={businessActive}
                      title="Operación"
                      className={parentMenuButtonClass(businessOpen)}
                      onClick={() => { setIsBusinessOpen(!businessOpen); }}
                    >
                      <span className="flex items-center gap-2">
                        <Briefcase />
                        <span className="font-medium">Operación</span>
                      </span>
                      <ChevronDown className={`transition-transform ${businessOpen ? "rotate-180" : ""}`} />
                    </SidebarMenuButton>
                    {businessOpen ? (
                      <SidebarMenuSub className={submenuClass}>
                        {visibleBusinessItems.map((item) => {
                          const Icon = item.icon;
                          const active = isActivePath(location.pathname, item.to);
                          return (
                            <SidebarMenuSubItem key={item.to}>
                              <SidebarMenuSubButton asChild isActive={active} className={submenuButtonClass}>
                                <NavLink to={item.to} end={item.to === "/app"}>
                                  <Icon />
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

          <SidebarGroup className="pt-2">
            <SidebarGroupLabel className={sectionLabelClass}>Soporte y operación</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleSupportItems.length > 0 && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={supportActive}
                      title="Atención al cliente"
                      className={parentMenuButtonClass(supportOpen)}
                      onClick={() => { setIsSupportOpen(!supportOpen); }}
                    >
                      <span className="flex items-center gap-2">
                        <Headset />
                        <span className="font-medium">Atención al cliente</span>
                      </span>
                      <ChevronDown className={`transition-transform ${supportOpen ? "rotate-180" : ""}`} />
                    </SidebarMenuButton>
                    {supportOpen ? (
                      <SidebarMenuSub className={submenuClass}>
                        {visibleSupportItems.map((item) => {
                          const Icon = item.icon;
                          const active = isActivePath(location.pathname, item.to);
                          return (
                            <SidebarMenuSubItem key={item.to}>
                              <SidebarMenuSubButton asChild isActive={active} className={submenuButtonClass}>
                                <NavLink to={item.to}>
                                  <Icon />
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
                    asChild
                    isActive={messagingActive}
                    title={messagingMenuItem.title}
                    className={directMenuButtonClass}
                  >
                    <NavLink to={messagingMenuItem.to} className="relative">
                      <MessageCircle />
                      <span className="font-medium">{messagingMenuItem.title}</span>
                      {inboxUnreadCount > 0 ? (
                        <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                          {inboxUnreadCount > 99 ? "99+" : inboxUnreadCount}
                        </span>
                      ) : null}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={alertsActive}
                    title={alertsMenuItem.title}
                    className={directMenuButtonClass}
                  >
                    <NavLink to={alertsMenuItem.to} className="relative">
                      <Bell />
                      <span className="font-medium">{alertsMenuItem.title}</span>
                      {alertsUnreadCount > 0 ? (
                        <span className="ml-auto rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-destructive-foreground">
                          {alertsUnreadCount > 99 ? "99+" : alertsUnreadCount}
                        </span>
                      ) : null}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter>
          <div className="space-y-2">
            {currentUser && (
              <div className="space-y-2 rounded-md bg-accent/50 px-2 py-2 text-xs text-muted-foreground">
                <p className="font-medium truncate">{currentUser.email}</p>
                <div className="flex flex-wrap gap-1">
                  {currentUser.roles.map((role, index) => (
                    <span
                      key={`${role}-${String(index)}`}
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleBadgeClass(role)}`}
                    >
                      {role.replaceAll("_", " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              className="justify-start w-full gap-2"
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
                  <img src={busLogo} alt="urbanGO" className="size-5" />
                  urbanGO
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-0">
          <WeatherTicker />
        </div>

        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}