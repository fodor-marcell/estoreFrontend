import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import api from '../../services/api';
import UserLayout from './UserLayout.jsx';
import '../../css/User-page/Dashboard.css';
import { formatMoney as formatMoneyWithCurrency } from '../../services/settings';

export default function UserDashboard() {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/public/getOrdersByUserId/${user.id}`);
        const list = Array.isArray(res.data) ? res.data : [];
        const sorted = [...list].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
        setOrders(sorted);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id]);

  const formatDateTime = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  };

  const formatMoney = (value) => formatMoneyWithCurrency(value, 'HUF');

  const totalOrders = orders.length;
  const pendingOrders = useMemo(
    () => orders.filter(o => String(o.status || 'PENDING').toUpperCase() === 'PENDING').length,
    [orders]
  );
  const totalSpend = useMemo(
    () => orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0),
    [orders]
  );
  const totalItems = useMemo(
    () => orders.reduce((sum, o) => sum + Object.values(o.products || {}).reduce((s, q) => s + Number(q || 0), 0), 0),
    [orders]
  );

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  return (
    <UserLayout>
      <div className="user-dashboard">
        <div className="user-dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p>
              Welcome{user?.userName || user?.username ? `, ${user.userName || user.username}` : ''}. Here’s a quick overview.
            </p>
          </div>

          <div className="user-dashboard-actions">
            <Link className="user-dashboard-primary-btn" to="/user/orders">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              My Orders
            </Link>
            <Link className="user-dashboard-secondary-btn" to="/">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Shop
            </Link>
          </div>
        </div>

        <div className="user-dashboard-stats">
          <div className="user-dashboard-stat">
            <h3>{totalOrders}</h3>
            <p>Total Orders</p>
          </div>
          <div className="user-dashboard-stat">
            <h3>{pendingOrders}</h3>
            <p>Pending</p>
          </div>
          <div className="user-dashboard-stat">
            <h3>{totalItems}</h3>
            <p>Total Items</p>
          </div>
          <div className="user-dashboard-stat">
            <h3>{formatMoney(totalSpend)}</h3>
            <p>Total Spend</p>
          </div>
        </div>

        <div className="user-dashboard-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <h2>Recent Orders</h2>
            <Link to="/user/orders" style={{ fontWeight: 900, color: '#667eea', textDecoration: 'none' }}>
              View all
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: 12, color: '#6b7280', fontWeight: 800 }}>Loading...</div>
          ) : recentOrders.length === 0 ? (
            <div style={{ padding: 12, color: '#6b7280', fontWeight: 800 }}>No orders yet.</div>
          ) : (
            <div className="user-dashboard-list">
              {recentOrders.map((o) => (
                <div key={o.id} className="user-dashboard-list-item">
                  <div className="left">
                    <div className="title">Order #{o.id}</div>
                    <div className="meta">{formatDateTime(o.orderDate)}</div>
                  </div>
                  <div className="right">
                    <div className="user-dashboard-badge">{String(o.status || 'PENDING').toUpperCase()}</div>
                    <div style={{ marginTop: 6 }}>{formatMoney(o.totalAmount)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
