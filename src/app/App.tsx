import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { LoginPage, ForgotPasswordPage, ResetPasswordPage, GithubCallbackPage, MicrosoftCallbackPage, TeamPage, DashboardPage, PermissionsPage, ProfilesPage, RolesPage, UsersPage, NearbyStopsPage, TicketAlightPage } from './pages'
import { ManagementLayout } from './components/security/management-layout'
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
          <Route path="nearby-stops" element={<NearbyStopsPage />} />
          <Route path="ticket/alight" element={<TicketAlightPage />} />
          <Route path="ticket/:ticketId/alight" element={<TicketAlightPage />} />
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
