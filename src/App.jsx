import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import QuestsPage from './pages/QuestsPage.jsx';
const FlashcardsPage = lazy(() => import('./pages/FlashcardsPage.jsx'));
const ReflectionsPage = lazy(() => import('./pages/ReflectionsPage.jsx'));
const ReportPage = lazy(() => import('./pages/ReportPage.jsx'));

function PageLoader() {
  return (
    <div className="screen-center" role="status" aria-live="polite">
      <p className="muted">Carregando…</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="quests" element={<QuestsPage />} />
        <Route
          path="flashcards"
          element={
            <Suspense fallback={<PageLoader />}>
              <FlashcardsPage />
            </Suspense>
          }
        />
        <Route
          path="reflections"
          element={
            <Suspense fallback={<PageLoader />}>
              <ReflectionsPage />
            </Suspense>
          }
        />
        <Route
          path="report"
          element={
            <Suspense fallback={<PageLoader />}>
              <ReportPage />
            </Suspense>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
