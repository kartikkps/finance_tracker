import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ReceiptText, Users, LogOut } from 'lucide-react';
import './Layout.css';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="layout-container">
      <aside className="sidebar glass-card">
        <div className="sidebar-header">
          <h2>Finance Tracker</h2>
          <span className="role-badge">{user?.role}</span>
        </div>

        <nav className="nav-links">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
          
          <NavLink to="/records" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <ReceiptText size={20} /> Records
          </NavLink>

          {user?.role === 'ADMIN' && (
            <NavLink to="/users" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <Users size={20} /> Admin Panel
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="email">{user?.email}</span>
          </div>
          <button className="btn-logout" onClick={logout}>
            <LogOut size={20} />
          </button>
        </div>
      </aside>
      
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
