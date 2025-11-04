import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Páginas carregadas imediatamente (críticas)
import LoginPage from './pages/LoginPage';
import DashboardLayout from './pages/DashboardLayout';
import DashboardPage from './pages/DashboardPage';

// Páginas com lazy loading (carregadas sob demanda)
const ClientesPage = lazy(() => import('./pages/ClientesPage'));
const VisitasPage = lazy(() => import('./pages/VisitasPage'));
const NovaVisitaPage = lazy(() => import('./pages/NovaVisitaPage'));
const VisitaDetalhesPage = lazy(() => import('./pages/VisitaDetalhesPage'));
const FazendasPage = lazy(() => import('./pages/FazendasPage'));
const TalhoesPage = lazy(() => import('./pages/TalhoesPage'));
const TimelinePage = lazy(() => import('./pages/TimelinePage'));
const RelatoriosPage = lazy(() => import('./pages/RelatoriosPage'));
const InsightsPage = lazy(() => import('./pages/InsightsPage'));
const AnaliseSoloPage = lazy(() => import('./pages/AnaliseSoloPage'));
const MonitoramentoPage = lazy(() => import('./pages/MonitoramentoPage'));
const ColheitaPage = lazy(() => import('./pages/ColheitaPage'));
const ClimaPage = lazy(() => import('./pages/ClimaPage'));

// Loading component para páginas lazy
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Carregando módulo...</p>
      </div>
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route 
          path="clientes" 
          element={
            <Suspense fallback={<PageLoader />}>
              <ClientesPage />
            </Suspense>
          } 
        />
        <Route 
          path="fazendas" 
          element={
            <Suspense fallback={<PageLoader />}>
              <FazendasPage />
            </Suspense>
          } 
        />
        <Route 
          path="fazendas/:id/timeline" 
          element={
            <Suspense fallback={<PageLoader />}>
              <TimelinePage />
            </Suspense>
          } 
        />
        <Route 
          path="talhoes" 
          element={
            <Suspense fallback={<PageLoader />}>
              <TalhoesPage />
            </Suspense>
          } 
        />
        <Route 
          path="analise-solo" 
          element={
            <Suspense fallback={<PageLoader />}>
              <AnaliseSoloPage />
            </Suspense>
          } 
        />
        <Route 
          path="monitoramento" 
          element={
            <Suspense fallback={<PageLoader />}>
              <MonitoramentoPage />
            </Suspense>
          } 
        />
        <Route 
          path="colheita" 
          element={
            <Suspense fallback={<PageLoader />}>
              <ColheitaPage />
            </Suspense>
          } 
        />
        <Route 
          path="clima" 
          element={
            <Suspense fallback={<PageLoader />}>
              <ClimaPage />
            </Suspense>
          } 
        />
        <Route 
          path="visitas" 
          element={
            <Suspense fallback={<PageLoader />}>
              <VisitasPage />
            </Suspense>
          } 
        />
        <Route 
          path="visitas/nova" 
          element={
            <Suspense fallback={<PageLoader />}>
              <NovaVisitaPage />
            </Suspense>
          } 
        />
        <Route 
          path="visitas/:id" 
          element={
            <Suspense fallback={<PageLoader />}>
              <VisitaDetalhesPage />
            </Suspense>
          } 
        />
        <Route 
          path="relatorios" 
          element={
            <Suspense fallback={<PageLoader />}>
              <RelatoriosPage />
            </Suspense>
          } 
        />
        <Route 
          path="insights" 
          element={
            <Suspense fallback={<PageLoader />}>
              <InsightsPage />
            </Suspense>
          } 
        />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
