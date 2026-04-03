import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { Trash2, Users } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import './AdminPanel.css';

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'VIEWER' | 'ANALYST' | 'ADMIN';
  createdAt: string;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/users');
      setUsersList(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      await apiFetch(`/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole })
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === user.id) {
      alert('You cannot delete your own account.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this user? All their records will also be deleted.')) {
      return;
    }
    
    try {
      await apiFetch(`/users/${id}`, { method: 'DELETE' });
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Error deleting user');
    }
  };

  return (
    <div className="page-container">
      <div className="admin-header">
        <h1><Users size={28} style={{ verticalAlign: 'middle', marginRight: '12px' }}/> User Management</h1>
      </div>

      <div className="users-table-container glass-card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '24px' }}>Loading users...</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Joined Date</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersList.length > 0 ? usersList.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <select 
                      className="role-select"
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={u.id === user.id}
                    >
                      <option value="VIEWER">Viewer</option>
                      <option value="ANALYST">Analyst</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td>
                    <button 
                      className="btn-danger" 
                      onClick={() => handleDeleteUser(u.id)} 
                      disabled={u.id === user.id}
                      title="Delete User"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
