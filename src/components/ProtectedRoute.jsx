import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spin } from 'antd';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { loading, isAuthenticated, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;