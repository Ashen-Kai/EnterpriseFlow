import { useState, useEffect } from 'react';
import { Package, ShoppingCart, Users, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { reportsApi } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await reportsApi.getDashboardStats();
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="kpi-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="kpi-card" style={{ opacity: 1, animation: 'pulse 1.5s infinite' }}>
            <div style={{ height: 80 }} />
          </div>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total Inventory Items',
      value: stats?.inventory?.totalItems || 0,
      icon: Package,
      color: 'blue',
      delay: 'stagger-1',
    },
    {
      label: 'Low Stock Alerts',
      value: stats?.inventory?.lowStockCount || 0,
      icon: AlertTriangle,
      color: stats?.inventory?.lowStockCount > 0 ? 'red' : 'green',
      delay: 'stagger-2',
    },
    {
      label: 'Pending Orders',
      value: stats?.procurement?.pendingOrders || 0,
      icon: ShoppingCart,
      color: 'yellow',
      delay: 'stagger-3',
    },
    {
      label: 'Active Employees',
      value: stats?.hr?.activeEmployees || 0,
      icon: Users,
      color: 'cyan',
      delay: 'stagger-4',
    },
  ];

  return (
    <div>
      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className={`kpi-card ${kpi.delay}`}>
              <div className="kpi-header">
                <div>
                  <div className="kpi-label">{kpi.label}</div>
                  <div className="kpi-value">{kpi.value.toLocaleString()}</div>
                </div>
                <div className={`kpi-icon ${kpi.color}`}>
                  <Icon />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent Orders */}
        <div className="glass-card animate-fade-in stagger-5">
          <div className="card-header">
            <h2 className="card-title">Recent Purchase Orders</h2>
            <ShoppingCart size={18} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="card-body">
            {stats?.recentActivity?.orders?.length > 0 ? (
              <ul className="activity-list">
                {stats.recentActivity.orders.map((order) => (
                  <li key={order.id} className="activity-item">
                    <div className={`activity-dot ${order.status === 'APPROVED' ? 'green' : order.status === 'PENDING' ? 'yellow' : 'blue'}`} />
                    <div>
                      <div className="activity-text">
                        <strong>{order.orderNumber}</strong> — {order.supplier?.name}
                        <span className={`badge badge-${order.status === 'APPROVED' ? 'success' : order.status === 'PENDING' ? 'warning' : 'info'}`} style={{ marginLeft: 8 }}>
                          {order.status}
                        </span>
                      </div>
                      <div className="activity-time">
                        ${order.totalAmount?.toLocaleString()} • {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">
                <ShoppingCart />
                <h3>No recent orders</h3>
                <p>Purchase orders will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Leave Requests */}
        <div className="glass-card animate-fade-in stagger-6">
          <div className="card-header">
            <h2 className="card-title">Recent Leave Requests</h2>
            <Clock size={18} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="card-body">
            {stats?.recentActivity?.leaves?.length > 0 ? (
              <ul className="activity-list">
                {stats.recentActivity.leaves.map((leave) => (
                  <li key={leave.id} className="activity-item">
                    <div className={`activity-dot ${leave.status === 'APPROVED' ? 'green' : leave.status === 'PENDING' ? 'yellow' : 'blue'}`} />
                    <div>
                      <div className="activity-text">
                        <strong>{leave.employee?.name}</strong> — {leave.leaveType} Leave
                        <span className={`badge badge-${leave.status === 'APPROVED' ? 'success' : leave.status === 'PENDING' ? 'warning' : 'info'}`} style={{ marginLeft: 8 }}>
                          {leave.status}
                        </span>
                      </div>
                      <div className="activity-time">
                        {leave.employee?.department} • {new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">
                <Clock />
                <h3>No recent leave requests</h3>
                <p>Employee leave requests will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 20 }}>
        <div className="glass-card animate-fade-in" style={{ animationDelay: '0.35s' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: '28px 20px' }}>
            <TrendingUp size={24} style={{ color: 'var(--accent-primary)', marginBottom: 8 }} />
            <div className="kpi-label">Total Inventory Value</div>
            <div className="kpi-value" style={{ fontSize: '1.5rem' }}>
              ${(stats?.inventory?.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
        <div className="glass-card animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: '28px 20px' }}>
            <ShoppingCart size={24} style={{ color: 'var(--status-warning)', marginBottom: 8 }} />
            <div className="kpi-label">Total Purchase Orders</div>
            <div className="kpi-value" style={{ fontSize: '1.5rem' }}>
              {stats?.procurement?.totalOrders || 0}
            </div>
          </div>
        </div>
        <div className="glass-card animate-fade-in" style={{ animationDelay: '0.45s' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: '28px 20px' }}>
            <Users size={24} style={{ color: 'var(--accent-secondary)', marginBottom: 8 }} />
            <div className="kpi-label">Pending Leave Requests</div>
            <div className="kpi-value" style={{ fontSize: '1.5rem' }}>
              {stats?.hr?.pendingLeaves || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
