import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../hooks/useAuthStore';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, fetchUser, accessToken } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (accessToken && !isAuthenticated) {
      fetchUser();
    }
  }, [accessToken]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#e8c547', fontFamily: 'serif', fontSize: '1.1rem' }}>
          <span style={{ animation: 'pulse 1.5s infinite' }}>💡</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
