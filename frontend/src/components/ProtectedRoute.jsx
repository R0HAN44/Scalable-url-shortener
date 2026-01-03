import { Navigate, useLocation } from 'react-router-dom';

export function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  const location = useLocation();
  
  if (!token || token === 'undefined') {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  return children;
}