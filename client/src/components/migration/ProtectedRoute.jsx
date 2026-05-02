import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { loading, authenticated, user } = useAuth();

  if (loading) {
    return <div style={{ padding: 24 }}>Checking session...</div>;
  }

  if (!authenticated) {
    return <Navigate to="/login/admin" replace />;
  }

  if (allowedRoles.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/portal" replace />;
  }

  return children;
}

export default ProtectedRoute;


