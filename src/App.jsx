import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { App as AntdApp } from 'antd';
import { ErrorBoundary } from './pages/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import NodeConfigPage from './pages/NodeConfigPage';
import ConfigLegacyRedirect from './pages/ConfigLegacyRedirect';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import UserManagement from './pages/UserManagement';
import ProfileSettings from './pages/ProfileSettings';
import ProfileProjects from './components/Profile/ProfileProjects';
import MyProjects from './components/Projects/MyProjects';
import ProjectDetail from './components/Projects/ProjectDetail';
import ProjectEnvironments from './components/Projects/ProjectEnvironments';
import EnvManagement from './pages/EnvManagement';
import SystemSettings from './pages/SystemSettings';
import Trash from "./pages/Trash";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    // <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AntdApp>
          <AuthProvider>
            <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/home" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Home />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/projects/:projectId/nodes/:nodeId"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <NodeConfigPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/config/:id"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ConfigLegacyRedirect />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/projects" 
              >
                <Route 
                index
                element={
                  <ProtectedRoute>
                    <MainLayout>
                    <MyProjects />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
                <Route path="/projects/:id" element={ <ProtectedRoute>
                  <MainLayout><ProjectDetail /></MainLayout>
                  </ProtectedRoute>} />
                <Route path="/projects/:id/environments" element={ <ProtectedRoute>
                  <MainLayout><ProjectEnvironments /></MainLayout>
                  </ProtectedRoute>} />
              </Route>
              <Route
                path="/nodes/backend"
                element={<Navigate to="/projects" replace />}
              />
              <Route
                path="/nodes/frontend"
                element={<Navigate to="/projects" replace />}
              />
              <Route
                path="/preview-services"
                element={<Navigate to="/projects" replace />}
              />
              <Route
                path="/preview-nodes"
                element={<Navigate to="/projects" replace />}
              />
              <Route
                path="/environments"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <EnvManagement />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/users" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <UserManagement />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ProfileSettings />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <SystemSettings />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trash"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Trash />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
          {import.meta.env.DEV ? (
            <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
          ) : null}
        </AuthProvider>
        </AntdApp>
      </QueryClientProvider>
    // </ErrorBoundary>
  );
}

export default App;
