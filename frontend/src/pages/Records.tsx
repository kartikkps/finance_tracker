import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import './Records.css';

interface RecordItem {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: string;
  category: string;
  date: string;
  notes?: string;
  user?: { email: string };
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function Records() {
  const { user } = useAuth();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    type: 'EXPENSE',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const fetchRecords = async (p = page) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/records?page=${p}&limit=10`);
      setRecords(res.data);
      setMeta(res.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(page);
  }, [page]);

  const handleOpenModal = (record?: RecordItem) => {
    if (record) {
      setEditingId(record.id);
      setFormData({
        type: record.type,
        amount: record.amount,
        category: record.category,
        date: record.date.split('T')[0],
        notes: record.notes || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        type: 'EXPENSE',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (editingId) {
        await apiFetch(`/records/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch('/records', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      
      handleCloseModal();
      fetchRecords(page); // refresh
    } catch (err: any) {
      alert(err.message || 'Error saving record');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await apiFetch(`/records/${id}`, { method: 'DELETE' });
      fetchRecords(page);
    } catch (err: any) {
      alert(err.message || 'Error deleting record');
    }
  };

  const canEdit = user?.role === 'ADMIN' || user?.role === 'ANALYST';
  const canDelete = user?.role === 'ADMIN';

  return (
    <div className="page-container">
      <div className="records-header">
        <h1>Financial Records</h1>
        {canEdit && (
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} /> Add Record
          </button>
        )}
      </div>

      <div className="records-table-container glass-card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '24px' }}>Loading records...</div>
        ) : (
          <>
            <table className="records-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>User</th>
                  <th>Notes</th>
                  {(canEdit || canDelete) && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {records.length > 0 ? records.map(r => (
                  <tr key={r.id}>
                    <td>{new Date(r.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${r.type.toLowerCase()}`}>
                        {r.type}
                      </span>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{r.category}</td>
                    <td style={{ fontWeight: 'bold' }}>${r.amount}</td>
                    <td>{r.user?.email || 'N/A'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{r.notes?.substring(0, 30) || '-'}{r.notes && r.notes.length > 30 ? '...' : ''}</td>
                    {(canEdit || canDelete) && (
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {canEdit && (
                            <button className="btn-icon" onClick={() => handleOpenModal(r)} title="Edit">
                              <Edit2 size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button className="btn-danger" onClick={() => handleDelete(r.id)} title="Delete">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {meta && meta.totalPages > 1 && (
              <div className="pagination">
                <span style={{ color: 'var(--text-muted)' }}>
                  Showing page {meta.page} of {meta.totalPages} ({meta.total} total)
                </span>
                <div className="pagination-controls">
                  <button 
                    className="btn-icon" 
                    disabled={meta.page <= 1} 
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button 
                    className="btn-icon" 
                    disabled={meta.page >= meta.totalPages} 
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <div className="modal-header">
              <h2>{editingId ? 'Edit Record' : 'Add Record'}</h2>
            </div>
            <form onSubmit={handleSave} className="modal-body">
              <div className="form-group">
                <label>Type</label>
                <select 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                </select>
              </div>

              <div className="form-group">
                <label>Amount</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  value={formData.amount} 
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <input 
                  type="text" 
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  placeholder="e.g. Groceries, Salary..."
                  required 
                />
              </div>

              <div className="form-group">
                <label>Date</label>
                <input 
                  type="date" 
                  value={formData.date} 
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                ></textarea>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
