import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { LoginPage, ForgotPasswordPage, ResetPasswordPage, GithubCallbackPage, MicrosoftCallbackPage, TeamPage, DashboardPage, PermissionsPage, ProfilesPage, RolesPage, UsersPage, NearbyStopsPage, IncidentReportPage, TicketAlightSearchPage, TicketAlightValidationPage, AccessDeniedPage, RegisterProfilePage, RegisterBusPage, CardRechargePage, CardRechargeStatusPage, CardRechargeReturnPage } from './pages'
import { ManagementLayout } from './components/security/management-layout'
import { ProtectedRoute } from '@/components/guards/ProtectedRoute'
import { RoleGuard } from '@/components/guards/RoleGuard'
import { Toaster } from '@/components/ui/sonner'
import { oauthConfig } from '@/config/oauth'
import { useHttpErrorHandler } from '@/hooks/security/useHttpErrorHandler'
import { useAuthStore } from '@/store/security/authStore'

function AppContent() {
  useHttpErrorHandler();
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <>
        <Toaster position="top-right" />
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
            path="card-recharge"
            element={
              <RoleGuard requiredRoles={['CITIZEN', 'ADMIN', 'ADMIN_BUS', 'SUPERVISER']}>
                <CardRechargePage />
              </RoleGuard>
            }
          />
          <Route
            path="card-recharge/return"
            element={
              <RoleGuard requiredRoles={['CITIZEN', 'ADMIN', 'ADMIN_BUS', 'SUPERVISER']}>
                <CardRechargeReturnPage />
              </RoleGuard>
            }
          />
          <Route
            path="card-recharge/status/:reference?"
            element={
              <RoleGuard requiredRoles={['CITIZEN', 'ADMIN', 'ADMIN_BUS', 'SUPERVISER']}>
                <CardRechargeStatusPage />
              </RoleGuard>
            }
          />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
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
