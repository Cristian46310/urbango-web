import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { LoginPage, GithubCallbackPage, TeamPage, DashboardPage, PermissionsPage, ProfilesPage, RolesPage, UsersPage } from './pages'
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
        <Route path="/auth/github/callback" element={<GithubCallbackPage />} />
        <Route path="/app" element={<ManagementLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="permissions" element={<PermissionsPage />} />
          <Route path="profiles" element={<ProfilesPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="team" element={<TeamPage />} />
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
