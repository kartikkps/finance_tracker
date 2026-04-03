import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout } from './Layout';

export const ProtectedRoute = () => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-center" style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p>Loading application...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Wraps authenticated pages in a master layout
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};
