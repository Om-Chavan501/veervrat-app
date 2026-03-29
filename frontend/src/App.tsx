import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { AppLayout } from './components/layout/AppLayout'
import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'
import { Dashboard } from './pages/Dashboard'
import { Lacunae } from './pages/Lacunae'
import { Assessment } from './pages/Assessment'
import { AssessmentResults } from './pages/AssessmentResults'
import { Journeys } from './pages/Journeys'
import { JourneyDetail } from './pages/JourneyDetail'
import { Clarify } from './pages/Clarify'
import { Archive } from './pages/Archive'
import { Vratmitra } from './pages/Vratmitra'
import { Ontology } from './pages/Ontology'
import { ShortlistReview } from './pages/ShortlistReview'
import { Assessments } from './pages/Assessments'
import { JoinRedirect } from './pages/JoinRedirect'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* Join redirect — public, no auth check */}
      <Route path="/join/:code" element={<JoinRedirect />} />

      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/lacunae" element={<Lacunae />} />
        <Route path="/assessments" element={<Assessments />} />
        <Route path="/assessments/:assessmentId" element={<Assessment />} />
        <Route path="/assessment-results/:assessmentId" element={<AssessmentResults />} />
        <Route path="/journeys" element={<Journeys />} />
        <Route path="/journeys/:journeyId" element={<JourneyDetail />} />
        <Route
          path="/journeys/:journeyId/clarify"
          element={<Clarify />}
        />
        <Route
          path="/journeys/:journeyId/clarify/:assessmentId"
          element={<Clarify />}
        />
        <Route path="/shortlists/:id" element={<ShortlistReview />} />
        <Route path="/archive" element={<Archive />} />
        <Route path="/vratmitra" element={<Vratmitra />} />
        <Route path="/ontology" element={<Ontology />} />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
