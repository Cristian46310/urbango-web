import { Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import {
  AdminAgeDistributionPage,
  AdminRouteCreatePage,
  AdminSchedulerCreatePage,
  CitizenBoardingPage,
  DashboardPage,
  DriverTurnStartPage,
  ForgotPasswordPage,
  GithubCallbackPage,
  LoginPage,
  MicrosoftCallbackPage,
  PermissionsPage,
  ProfilesPage,
  ResetPasswordPage,
  RolesPage,
  TeamPage,
  UsersPage,
  NearbyStopsPage,
  IncidentReportPage,
  TicketAlightSearchPage,
  TicketAlightValidationPage,
  AccessDeniedPage,
  RegisterProfilePage,
  BusinessDashboardPage,
  AddressesPage,
  EnterprisesPage,
  StopsAdminPage,
  PaymentMethodsPage,
  CitizensPage,
  DriversAdminPage,
  RoutesPage,
  NodesPage,
  BusesPage,
  SchedulersPage,
  TurnsPage,
  PaymentMethodCitizensPage,
  IncidentsPage,
  IncidentsByBusPage,
  IncidentDetailPage,
} from './pages'

const BUSINESS_ADMIN_ROLES = ['ADMIN', 'ADMIN_BUS', 'SUPERVISER'] as const
import { PageLoader } from './components/page-loader'
import { ManagementLayout } from './components/security/management-layout'
import { ProtectedRoute } from '@/components/guards/ProtectedRoute'
import { RoleGuard } from '@/components/guards/RoleGuard'
import { Toaster } from '@/components/ui/sonner'
import { oauthConfig } from '@/config/oauth'
import { useHttpErrorHandler } from '@/hooks/security/useHttpErrorHandler'
import { useAuthStore } from '@/store/security/authStore'
import RegisterBusPage from './pages/fleet/register-bus/page'

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
        <Route path="/auth/microsoft/callback" element={<MicrosoftCallbackPage />} />
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
              <RoleGuard requiredRoles={['ADMIN', 'ADMIN_BUS', 'SUPERVISER']}>
                <UsersPage />
              </RoleGuard>
            }
          />
          <Route
            path="permissions"
            element={
              <RoleGuard requiredRoles={['ADMIN', 'ADMIN_BUS', 'SUPERVISER']}>
                <PermissionsPage />
              </RoleGuard>
            }
          />
          <Route
            path="profiles"
            element={
              <RoleGuard requiredRoles={['ADMIN', 'ADMIN_BUS', 'SUPERVISER']}>
                <ProfilesPage />
              </RoleGuard>
            }
          />
          <Route
            path="roles"
            element={
              <RoleGuard requiredRoles={['ADMIN', 'ADMIN_BUS', 'SUPERVISER']}>
                <RolesPage />
              </RoleGuard>
            }
          />
          <Route path="team" element={<TeamPage />} />
          <Route
            path="fleet/register-bus"
            element={
              <RoleGuard requiredRoles={['ADMIN', 'ADMIN_BUS', 'SUPERVISER']}>
                <RegisterBusPage />
              </RoleGuard>
            }
          />
          <Route
            path="nearby-stops"
            element={
              <RoleGuard requiredRoles={['CITIZEN', 'DRIVER', 'ADMIN', 'ADMIN_BUS', 'SUPERVISER']}>
                <NearbyStopsPage />
              </RoleGuard>
            }
          />
          <Route
            path="incident-report"
            element={
              <RoleGuard requiredRoles={['DRIVER', 'ADMIN', 'ADMIN_BUS', 'SUPERVISER']}>
                <IncidentReportPage />
              </RoleGuard>
            }
          />
          <Route
            path="ticket/alight"
            element={
              <RoleGuard requiredRoles={['CITIZEN', 'DRIVER', 'ADMIN', 'ADMIN_BUS', 'SUPERVISER']}>
                <TicketAlightSearchPage />
              </RoleGuard>
            }
          />
          <Route
            path="ticket/:ticketId/alight"
            element={
              <RoleGuard requiredRoles={['CITIZEN', 'DRIVER', 'ADMIN', 'ADMIN_BUS', 'SUPERVISER']}>
                <TicketAlightValidationPage />
              </RoleGuard>
            }
          />
          <Route
            path="business/dashboard"
            element={
              <RoleGuard requiredRoles={[...BUSINESS_ADMIN_ROLES]}>
                <BusinessDashboardPage />
              </RoleGuard>
            }
          />
          <Route path="business/addresses" element={<RoleGuard requiredRoles={[...BUSINESS_ADMIN_ROLES]}><AddressesPage /></RoleGuard>} />
          <Route path="business/enterprises" element={<RoleGuard requiredRoles={[...BUSINESS_ADMIN_ROLES]}><EnterprisesPage /></RoleGuard>} />
          <Route path="business/stops" element={<RoleGuard requiredRoles={[...BUSINESS_ADMIN_ROLES]}><StopsAdminPage /></RoleGuard>} />
          <Route path="business/payment-methods" element={<RoleGuard requiredRoles={[...BUSINESS_ADMIN_ROLES]}><PaymentMethodsPage /></RoleGuard>} />
          <Route path="business/citizens" element={<RoleGuard requiredRoles={[...BUSINESS_ADMIN_ROLES]}><CitizensPage /></RoleGuard>} />
          <Route path="business/drivers" element={<RoleGuard requiredRoles={[...BUSINESS_ADMIN_ROLES]}><DriversAdminPage /></RoleGuard>} />
          <Route path="business/routes" element={<RoleGuard requiredRoles={[...BUSINESS_ADMIN_ROLES]}><RoutesPage /></RoleGuard>} />
          <Route path="business/nodes" element={<RoleGuard requiredRoles={[...BUSINESS_ADMIN_ROLES]}><NodesPage /></RoleGuard>} />
          <Route path="business/buses" element={<RoleGuard requiredRoles={[...BUSINESS_ADMIN_ROLES]}><BusesPage /></RoleGuard>} />
          <Route path="business/schedulers" element={<RoleGuard requiredRoles={[...BUSINESS_ADMIN_ROLES]}><SchedulersPage /></RoleGuard>} />
          <Route path="business/turns" element={<RoleGuard requiredRoles={[...BUSINESS_ADMIN_ROLES]}><TurnsPage /></RoleGuard>} />
          <Route path="business/payment-method-citizens" element={<RoleGuard requiredRoles={[...BUSINESS_ADMIN_ROLES]}><PaymentMethodCitizensPage /></RoleGuard>} />
          <Route path="business/incidents" element={<RoleGuard requiredRoles={[...BUSINESS_ADMIN_ROLES]}><IncidentsPage /></RoleGuard>} />
          <Route path="business/incidents/bus/:busId" element={<RoleGuard requiredRoles={[...BUSINESS_ADMIN_ROLES]}><IncidentsByBusPage /></RoleGuard>} />
          <Route path="business/incidents/:incidentId" element={<RoleGuard requiredRoles={[...BUSINESS_ADMIN_ROLES]}><IncidentDetailPage /></RoleGuard>} />
        </Route>

        <Route
          path="/admin/reports/age-distribution"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminAgeDistributionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/routes/create"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminRouteCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/schedulers/create"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminSchedulerCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver/turn-start"
          element={
            <ProtectedRoute roles={["driver"]}>
              <DriverTurnStartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/boarding"
          element={
            <ProtectedRoute roles={["citizen"]}>
              <CitizenBoardingPage />
            </ProtectedRoute>
          }
        />

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
