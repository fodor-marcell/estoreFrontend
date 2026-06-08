import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from './AdminLayout.jsx'
import api from '../../services/api.js'
import '../../css/Admin-page/Dashboard.css'
import useAdminSettings from '../../hooks/useAdminSettings.js'
import { formatMoney as formatMoneyWithCurrency } from '../../services/settings.js'

function AdminDashboard() {
    const settings = useAdminSettings()

    const [stats, setStats] = useState({
        products: 0,
        orders: 0,
        revenue: 0,
        users: 0
    })
    const [recentOrders, setRecentOrders] = useState([])
    const [loading, setLoading] = useState(true)


    useEffect(() => {
        const loadStats = async () => {
            try {
                const [productsRes, usersRes, ordersRes] = await Promise.all([
                    api.get('/public/getAllProducts'),
                    api.get('/admin/getAllUsers'),
                    api.get('/admin/getAllOrders')
                ])

                const orders = Array.isArray(ordersRes.data) ? ordersRes.data : []
                const totalOrders = orders.length
                const revenue = orders.reduce((sum, o) => {
                    const n = Number(o.totalAmount)
                    return sum + (Number.isFinite(n) ? n : 0)
                }, 0)

                const recent = [...orders]
                    .sort((a, b) => {
                        // Prefer orderDate if present; fall back to id
                        const ad = a.orderDate ? new Date(a.orderDate).getTime() : NaN
                        const bd = b.orderDate ? new Date(b.orderDate).getTime() : NaN
                        if (Number.isFinite(ad) && Number.isFinite(bd)) return bd - ad
                        return (b.id || 0) - (a.id || 0)
                    })
                    .slice(0, 5)

                setRecentOrders(recent)

                setStats({
                    products: productsRes.data?.length || 0,
                    users: usersRes.data?.length || 0,
                    orders: totalOrders,
                    revenue
                })
            } catch (err) {
                console.error('Error loading stats:', err)
            } finally {
                setLoading(false)
            }
        }

        loadStats()
    }, [])

    const formatMoney = (value) => formatMoneyWithCurrency(value, settings.currency)

    const formatDate = (value) => {
        if (!value) return '-'
        const d = new Date(value)
        if (Number.isNaN(d.getTime())) return String(value)
        return d.toLocaleDateString()
    }

    const statusClass = useMemo(() => {
        return (status) => {
            const s = String(status || 'PENDING').toLowerCase()
            if (['delivered', 'completed'].includes(s)) return 'delivered'
            if (s === 'processing') return 'processing'
            if (s === 'shipped') return 'shipped'
            return 'pending'
        }
    }, [])

    if (loading) {
        return (
            <AdminLayout>
                <div className="dashboard-loading">
                    <div className="spinner-large"></div>
                    <p>Loading dashboard...</p>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <div className="dashboard-content">
                <div style={{ marginBottom: 12 }}>
                    <h1 style={{ margin: 0, fontSize: 22, color: '#1a1a2e' }}>{settings.shopName}</h1>
                    <p style={{ margin: '6px 0 0', color: '#666', fontSize: 14 }}>Admin dashboard overview</p>
                </div>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon blue">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <h3>{stats.products}</h3>
                            <p>Total Products</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon green">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <h3>{stats.orders}</h3>
                            <p>Total Orders</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon purple">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <h3>{formatMoney(stats.revenue)}</h3>
                            <p>Revenue</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon orange">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 0 0 18 8 0z" />
                            </svg>
                        </div>
                        <div className="stat-info">
                            <h3>{stats.users}</h3>
                            <p>Active Users</p>
                        </div>
                    </div>
                </div>

                {/* Recent Orders Table */}
                <div className="recent-section">
                    <div className="section-header">
                        <h2>Recent Orders</h2>
                        <Link to="/orders" className="view-all">View All →</Link>
                    </div>
                    <div className="recent-table">
                        <table>
                            <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>User ID</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                            </thead>
                            <tbody>
                            {recentOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>No orders yet</td>
                                </tr>
                            ) : (
                                recentOrders.map((o) => (
                                    <tr key={o.id}>
                                        <td>#{o.id}</td>
                                        <td>{o.userId}</td>
                                        <td>{formatMoney(o.totalAmount)}</td>
                                        <td><span className={`status ${statusClass(o.status)}`}>{(o.status || 'PENDING')}</span></td>
                                        <td>{formatDate(o.orderDate)}</td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}

export default AdminDashboard