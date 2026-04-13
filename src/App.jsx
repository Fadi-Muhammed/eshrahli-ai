import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './lib/AuthContext'
import { LanguageProvider } from './components/LanguageContext'
import { ThemeProvider } from './components/ThemeContext'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import Course from './pages/Course'
import Lecture from './pages/Lecture'
import Slide from './pages/Slide'
import Saved from './pages/Saved'
import Favorites from './pages/Favorites'
import Settings from './pages/Settings'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import ProtectedRoute from './lib/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <LanguageProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="course/:courseId" element={<Course />} />
                  <Route path="course/:courseId/lecture/:lectureId" element={<Lecture />} />
                  <Route path="course/:courseId/slide/:slideId" element={<Slide />} />
                  <Route path="favorites" element={<Favorites />} />
                  <Route path="saved" element={<Saved />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster position="top-right" richColors />
          </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
