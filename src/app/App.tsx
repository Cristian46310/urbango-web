import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { LoginPage, TeamPage, DashboardPage, PermissionsPage, ProfilesPage, RolePermissionsPage, RolesPage, UserRolesPage, UsersPage } from './pages'
import { ManagementLayout } from './components/security/management-layout'
import { Toaster } from '@/components/ui/sonner'
import { oauthConfig } from '@/config/oauth'

function App() {
  return (
    <GoogleOAuthProvider clientId={oauthConfig.google.clientId}>
      <BrowserRouter>
        <Toaster />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/app" element={<ManagementLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="permissions" element={<PermissionsPage />} />
            <Route path="profiles" element={<ProfilesPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="user-roles" element={<UserRolesPage />} />
            <Route path="role-permissions" element={<RolePermissionsPage />} />
            <Route path="team" element={<TeamPage />} />
          </Route>
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}

export default App
