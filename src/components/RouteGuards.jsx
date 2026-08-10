import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || !['Admin', 'SuperAdmin'].includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}

export function SuperAdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== 'SuperAdmin') return <Navigate to="/login" replace />;
  return children;
}

export function PosRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || !['Staff', 'Admin', 'SuperAdmin'].includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}
