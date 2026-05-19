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
} from './pages'
import { ManagementLayout } from './components/security/management-layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Toaster } from '@/components/ui/sonner'
import { oauthConfig } from '@/config/oauth'
import { useHttpErrorHandler } from '@/hooks/security/useHttpErrorHandler'

function AppContent() {
  useHttpErrorHandler();

  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/github/callback" element={<GithubCallbackPage />} />
        <Route path="/auth/microsoft/callback" element={<MicrosoftCallbackPage />} />
        <Route path="/app" element={<ManagementLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="permissions" element={<PermissionsPage />} />
          <Route path="profiles" element={<ProfilesPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="team" element={<TeamPage />} />
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
