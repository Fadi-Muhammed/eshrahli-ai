import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './lib/AuthContext'
import { LanguageProvider } from './components/LanguageContext'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import Course from './pages/Course'
import Slide from './pages/Slide'
import Saved from './pages/Saved'
import Settings from './pages/Settings'
import Login from './pages/Login'
import ProtectedRoute from './lib/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="course/:courseId" element={<Course />} />
                <Route path="course/:courseId/slide/:slideId" element={<Slide />} />
                <Route path="saved" element={<Saved />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-right" richColors />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
