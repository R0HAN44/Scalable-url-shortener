import { Navigate } from 'react-router-dom';

export function AuthRoute({ children }) {
  const token = localStorage.getItem('token');
  
  // If user is already logged in, redirect to dashboard
  if (token && token !== 'undefined') {
    return <Navigate to="/" replace />;
  }
  
  return children;
}