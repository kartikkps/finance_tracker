import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { DollarSign, TrendingUp, TrendingDown, Activity, PieChart } from 'lucide-react';
import './Dashboard.css';

interface Summary {
  totalIncome: string;
  totalExpense: string;
  netBalance: string;
  totalRecords: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const sumRes = await apiFetch('/dashboard/summary');
        setSummary(sumRes.data);

        if (user?.role !== 'VIEWER') {
          const trendsRes = await apiFetch('/dashboard/trends');
          setTrends(trendsRes.data);

          const catRes = await apiFetch('/dashboard/categories');
          setCategories(catRes.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return <div className="page-container"><p>Loading dashboard...</p></div>;
  }

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
      </div>

      <div className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Net Balance</span>
            <div className="stat-icon" style={{ color: 'var(--accent)' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div className="stat-value">${summary?.netBalance || '0.00'}</div>
          <span className="stat-label">Total remaining</span>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Income</span>
            <div className="stat-icon" style={{ color: 'var(--success)' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stat-value">${summary?.totalIncome || '0.00'}</div>
          <span className="stat-label">All-time</span>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Expense</span>
            <div className="stat-icon" style={{ color: 'var(--danger)' }}>
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="stat-value">${summary?.totalExpense || '0.00'}</div>
          <span className="stat-label">All-time</span>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Records</span>
            <div className="stat-icon" style={{ color: 'var(--text-muted)' }}>
              <Activity size={20} />
            </div>
          </div>
          <div className="stat-value">{summary?.totalRecords || 0}</div>
          <span className="stat-label">Entries logged</span>
        </div>
      </div>

      {user?.role !== 'VIEWER' && (
        <div className="charts-grid">
          <div className="glass-card chart-card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} /> Monthly Trends
            </h3>
            {trends.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {trends.map(t => (
                  <div key={t.month} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <span>{t.month}</span>
                    <span style={{ color: 'var(--success)' }}>+${t.income}</span>
                    <span style={{ color: 'var(--danger)' }}>-${t.expense}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="placeholder-chart">No trend data available</div>
            )}
          </div>

          <div className="glass-card chart-card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={20} /> Expenses by Category
            </h3>
            {categories.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {categories.map(c => (
                  <div key={c.category} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <span style={{ textTransform: 'capitalize' }}>{c.category}</span>
                    <span style={{ fontWeight: 'bold' }}>${c.totalAmount}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="placeholder-chart">No category data available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
