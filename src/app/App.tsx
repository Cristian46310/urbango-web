import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './routes'
import { TeamPage } from './routes'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
