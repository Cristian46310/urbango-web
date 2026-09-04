import { Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import {
  AdminAgeDistributionPage,
  LoginPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  GithubCallbackPage,
  TeamPage,
  DashboardPage,
  PermissionsPage,
  RolesPage,
  UsersPage,
  NearbyStopsPage,
  BusAlertPage,
  IncidentReportPage,
  TicketAlightSearchPage,
  TicketAlightValidationPage,
  AccessDeniedPage,
  RegisterProfilePage,
  RegisterBusPage,
  CardRechargePage,
  CardRechargeReturnPage,
  CardRechargeStatusPage,
  CitizenPaymentMethodsPage,
  BusinessDashboardPage,
  EnterprisesPage,
  StopsAdminPage,
  PaymentMethodsPage,
  CitizensPage,
  DriversAdminPage,
  NodesPage,
  BusesPage,
  SchedulersPage,
  TurnsPage,
  IncidentsPage,
  IncidentsByBusPage,
  IncidentDetailPage,
  CitizenBoardingPage,
  CitizenRoutesPage,
  CitizenRouteDetailPage,
  CitizenTripsPage,
  CitizenTripDetailPage,
  DriverTurnStartPage,
  MessagingPage,
  AlertsPage,
  MassAlertsAdminPage,
  SupportAppointmentsPage,
  SupportPqrsPage,
  ProfilePreferencesPage,
} from './pages'
import { PageLoader } from './components/page-loader'
import { ManagementLayout } from './components/security/management-layout'
import { ProtectedRoute } from '@/components/guards/ProtectedRoute'
import { ProtectedRoute as JwtProtectedRoute } from '@/components/ProtectedRoute'
import { RoleGuard } from '@/components/guards/RoleGuard'
import { Toaster } from '@/components/ui/sonner'
import { oauthConfig } from '@/config/oauth'
import { useHttpErrorHandler } from '@/hooks/security/useHttpErrorHandler'
import { useAuthStore } from '@/store/security/authStore'
import { ROLES, ROLE_GROUPS } from '@/core/domain/entities/security/Roles'

const BUSINESS_ADMIN_ROLES = [
  ROLES.ADMIN,
  ROLES.BUSINESS_ADMIN,
  ROLES.SUPERVISOR,
  ROLES.ADMIN_BUS,
  ROLES.SUPERVISER,
] as const

const CITIZEN_AND_ADMIN_ROLES = [ROLES.CITIZEN, ...ROLE_GROUPS.ADMIN_ROLES] as const

function AppContent() {
  useHttpErrorHandler();
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <>
        <Toaster position="top-right" />
        <Suspense fallback={<PageLoader />}>
        <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/github/callback" element={<GithubCallbackPage />} />
        <Route path="/access-denied" element={<AccessDeniedPage />} />

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <ManagementLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="register-profile" element={<RegisterProfilePage />} />
          <Route
            path="users"
            element={
              <RoleGuard requiredRoles={[...ROLE_GROUPS.ADMIN_ROLES]}>
                <UsersPage />
              </RoleGuard>
            }
          />
          <Route
            path="permissions"
            element={
              <RoleGuard requiredRoles={[...ROLE_GROUPS.ADMIN_ROLES]}>
                <PermissionsPage />
              </RoleGuard>
            }
          />
          <Route
            path="roles"
            element={
              <RoleGuard requiredRoles={[...ROLE_GROUPS.ADMIN_ROLES]}>
                <RolesPage />
              </RoleGuard>
            }
          />
          <Route path="team" element={<TeamPage />} />
          <Route path="messaging" element={<MessagingPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route
            path="admin/mass-alerts"
            element={
              <RoleGuard requiredRoles={[...ROLE_GROUPS.MASS_ALERTS]}>
                <MassAlertsAdminPage />
              </RoleGuard>
            }
          />
          <Route
            path="fleet/register-bus"
            element={
              <RoleGuard requiredRoles={[...ROLE_GROUPS.FLEET_ACCESS]}>
                <RegisterBusPage />
              </RoleGuard>
            }
          />
          <Route
            path="planning/routes"
            element={
              <RoleGuard requiredRoles={[...ROLE_GROUPS.PARADEROS_ACCESS]}>
                <CitizenRoutesPage />
              </RoleGuard>
            }
          />
          <Route
            path="planning/routes/:id"
            element={
              <RoleGuard requiredRoles={[...ROLE_GROUPS.PARADEROS_ACCESS]}>
                <CitizenRouteDetailPage />
              </RoleGuard>
            }
          />
          <Route
            path="nearby-stops"
            element={
              <RoleGuard requiredRoles={[...ROLE_GROUPS.PARADEROS_ACCESS]}>
                <NearbyStopsPage />
              </RoleGuard>
            }
          />
          <Route
            path="bus-alert"
            element={
              <RoleGuard requiredRoles={[...ROLE_GROUPS.PARADEROS_ACCESS]}>
                <BusAlertPage />
              </RoleGuard>
            }
          />
          <Route
            path="boarding"
            element={
              <RoleGuard requiredRoles={[...CITIZEN_AND_ADMIN_ROLES]}>
                <CitizenBoardingPage />
              </RoleGuard>
            }
          />
          <Route
            path="trips"
            element={
              <RoleGuard requiredRoles={[...CITIZEN_AND_ADMIN_ROLES]}>
                <CitizenTripsPage />
              </RoleGuard>
            }
          />
          <Route
            path="trips/:historyId"
            element={
              <RoleGuard requiredRoles={[...CITIZEN_AND_ADMIN_ROLES]}>
                <CitizenTripDetailPage />
              </RoleGuard>
            }
          />
          <Route
            path="incident-report"
            element={
              <RoleGuard requiredRoles={[...ROLE_GROUPS.INCIDENT_REPORT_ACCESS]}>
                <IncidentReportPage />
              </RoleGuard>
            }
          />
          <Route
            path="ticket/alight"
            element={
              <RoleGuard requiredRoles={[...ROLE_GROUPS.DESCENSO_ACCESS]}>
                <TicketAlightSearchPage />
              </RoleGuard>
            }
          />
          <Route
            path="ticket/:ticketId/alight"
            element={
              <RoleGuard requiredRoles={[...ROLE_GROUPS.DESCENSO_ACCESS]}>
                <TicketAlightValidationPage />
              </RoleGuard>
            }
          />
          <Route
            path="card-recharge"
            element={
              <RoleGuard requiredRoles={[...CITIZEN_AND_ADMIN_ROLES]}>
                <CardRechargePage />
              </RoleGuard>
            }
          />
          <Route
            path="payment-methods"
            element={
              <RoleGuard requiredRoles={[...CITIZEN_AND_ADMIN_ROLES]}>
                <CitizenPaymentMethodsPage />
              </RoleGuard>
            }
          />
          <Route
            path="card-recharge/return"
            element={
              <RoleGuard requiredRoles={[...CITIZEN_AND_ADMIN_ROLES]}>
                <CardRechargeReturnPage />
              </RoleGuard>
            }
          />
          <Route
            path="card-recharge/status/:reference?"
            element={
              <RoleGuard requiredRoles={[...CITIZEN_AND_ADMIN_ROLES]}>
                <CardRechargeStatusPage />
              </RoleGuard>
            }
          />
          <Route
            path="business/dashboard"
            element={
              <RoleGuard requiredRoles={[...ROLE_GROUPS.DASHBOARD_OPS]}>
                <BusinessDashboardPage />
              </RoleGuard>
            }
          />
          <Route path="business/enterprises" element={<RoleGuard requiredRoles={[...BUSINESS_ADMIN_ROLES]}><EnterprisesPage /></RoleGuard>} />
          <Route path="business/stops" element={<RoleGuard requiredRoles={[...BUSINESS_ADMIN_ROLES]}><StopsAdminPage /></RoleGuard>} />
          <Route path="business/payment-methods" element={<RoleGuard requiredRoles={[...BUSINESS_ADMIN_ROLES]}><PaymentMethodsPage /></RoleGuard>} />
          <Route path="business/citizens" element={<RoleGuard requiredRoles={[...BUSINESS_ADMIN_ROLES]}><CitizensPage /></RoleGuard>} />
          <Route path="business/drivers" element={<RoleGuard requiredRoles={[...BUSINESS_ADMIN_ROLES]}><DriversAdminPage /></RoleGuard>} />
          <Route path="business/routes" element={<Navigate to="/app/planning/routes" replace />} />
          <Route path="business/nodes" element={<RoleGuard requiredRoles={[...BUSINESS_ADMIN_ROLES]}><NodesPage /></RoleGuard>} />
          <Route path="business/buses" element={<RoleGuard requiredRoles={[...BUSINESS_ADMIN_ROLES]}><BusesPage /></RoleGuard>} />
          <Route path="business/schedulers" element={<RoleGuard requiredRoles={[...BUSINESS_ADMIN_ROLES]}><SchedulersPage /></RoleGuard>} />
          <Route path="business/turns" element={<RoleGuard requiredRoles={[...BUSINESS_ADMIN_ROLES]}><TurnsPage /></RoleGuard>} />
          <Route path="business/incidents" element={<RoleGuard requiredRoles={[...BUSINESS_ADMIN_ROLES]}><IncidentsPage /></RoleGuard>} />
          <Route path="business/incidents/bus/:busId" element={<RoleGuard requiredRoles={[...BUSINESS_ADMIN_ROLES]}><IncidentsByBusPage /></RoleGuard>} />
          <Route path="business/incidents/:incidentId" element={<RoleGuard requiredRoles={[...BUSINESS_ADMIN_ROLES]}><IncidentDetailPage /></RoleGuard>} />
          <Route
            path="support/appointments"
            element={
              <RoleGuard requiredRoles={[...CITIZEN_AND_ADMIN_ROLES]}>
                <SupportAppointmentsPage />
              </RoleGuard>
            }
          />
          <Route
            path="support/pqrs"
            element={
              <RoleGuard requiredRoles={[...CITIZEN_AND_ADMIN_ROLES]}>
                <SupportPqrsPage />
              </RoleGuard>
            }
          />
          <Route
            path="profile/preferences"
            element={
              <RoleGuard requiredRoles={[...CITIZEN_AND_ADMIN_ROLES]}>
                <ProfilePreferencesPage />
              </RoleGuard>
            }
          />
          <Route
            path="driver/turn-start"
            element={
              <RoleGuard requiredRoles={[...ROLE_GROUPS.INCIDENT_REPORT_ACCESS]}>
                <DriverTurnStartPage />
              </RoleGuard>
            }
          />
          <Route
            path="reports/age-distribution"
            element={
              <JwtProtectedRoute roles={["admin"]}>
                <AdminAgeDistributionPage />
              </JwtProtectedRoute>
            }
          />
          <Route
            path="routes/create"
            element={<Navigate to="/app/planning/routes?mode=create" replace />}
          />
          <Route
            path="schedulers/create"
            element={<Navigate to="/app/business/schedulers?mode=create" replace />}
          />
        </Route>

        <Route path="/admin/reports/age-distribution" element={<Navigate to="/app/reports/age-distribution" replace />} />
        <Route path="/admin/routes/create" element={<Navigate to="/app/planning/routes?mode=create" replace />} />
        <Route path="/admin/schedulers/create" element={<Navigate to="/app/business/schedulers?mode=create" replace />} />
        <Route path="/driver/turn-start" element={<Navigate to="/app/driver/turn-start" replace />} />
        <Route path="/boarding" element={<Navigate to="/app/boarding" replace />} />

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
        </Suspense>
    </>
  )
}

function App() {
  return (
    <GoogleOAuthProvider clientId={oauthConfig.google.clientId}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}

export default App
