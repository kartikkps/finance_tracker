import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Records from './pages/Records';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-container">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/records" element={<Records />} />
              <Route path="/users" element={<AdminPanel />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
