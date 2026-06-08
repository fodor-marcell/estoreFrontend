import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext.jsx'
import api from '../../services/api'
import '../../css/Admin-page/Orders.css'
import '../../css/User-page/UserOrders.css'
import { formatMoney as formatMoneyWithCurrency } from '../../services/settings'
import UserLayout from './UserLayout.jsx'

function UserOrders() {
    const { user } = useAuth()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [products, setProducts] = useState([])
    const [selectedProducts, setSelectedProducts] = useState({})

    const [orderSuccess, setOrderSuccess] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')

    useEffect(() => {
        if (!user?.id) return
        const fetchOrders = async () => {
            try {
                setLoading(true)
                const res = await api.get(`/public/getOrdersByUserId/${user.id}`)
                const list = Array.isArray(res.data) ? res.data : []
                const sorted = [...list].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0))
                setOrders(sorted)
                setError(null)
            } catch {
                setError('Failed to load your orders')
            } finally {
                setLoading(false)
            }
        }
        fetchOrders()
    }, [user?.id])

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await api.get('/public/getAllProducts')
                setProducts(Array.isArray(res.data) ? res.data : [])
            } catch {
                setProducts([])
            }
        }
        fetchProducts()
    }, [])

    const handleProductChange = (productId, qty) => {
        setSelectedProducts(prev => ({
            ...prev,
            [productId]: qty > 0 ? qty : undefined
        }))
    }

    const handleOrderSubmit = async (e) => {
        e.preventDefault()
        if (!user?.id) return

        setSubmitError('')
        setOrderSuccess(false)

        const orderProducts = Object.fromEntries(
            Object.entries(selectedProducts)
                .map(([productId, qty]) => [Number(productId), Number(qty)])
                .filter(([, qty]) => Number.isFinite(qty) && qty > 0)
        )

        if (Object.keys(orderProducts).length === 0) {
            setSubmitError('Please add at least 1 product quantity.')
            return
        }

        try {
            setSubmitting(true)
            await api.post('/public/createOrder', {
                userId: Number(user.id),
                status: 'PENDING',
                products: orderProducts
            })

            setOrderSuccess(true)
            setSelectedProducts({})

            const res = await api.get(`/public/getOrdersByUserId/${user.id}`)
            const list = Array.isArray(res.data) ? res.data : []
            const sorted = [...list].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0))
            setOrders(sorted)
        } catch (err) {
            setSubmitError(err?.response?.data?.message || 'Failed to place order')
        } finally {
            setSubmitting(false)
        }
    }

    const formatDateTime = (value) => {
        if (!value) return '-'
        const d = new Date(value)
        if (Number.isNaN(d.getTime())) return String(value)
        return d.toLocaleString()
    }

    const formatMoney = (value) => formatMoneyWithCurrency(value, 'HUF')

    const totalItems = useMemo(() => {
        return orders.reduce((sum, o) => sum + Object.values(o.products || {}).reduce((s, q) => s + Number(q || 0), 0), 0)
    }, [orders])

    const totalOrdersValue = useMemo(() => {
        return orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)
    }, [orders])

    const pendingOrders = useMemo(() => {
        return orders.filter(o => String(o.status || 'PENDING').toUpperCase() === 'PENDING').length
    }, [orders])

    return (
        <UserLayout>
            <div className="orders-content">
                <div className="orders-header">
                    <div>
                        <h1>My Orders</h1>
                        <p>Place a new order and review your previous orders.</p>
                    </div>
                </div>

                <div className="orders-stats">
                    <div className="stat-box">
                        <h3>{orders.length}</h3>
                        <p>Total Orders</p>
                    </div>
                    <div className="stat-box">
                        <h3>{pendingOrders}</h3>
                        <p>Pending</p>
                    </div>
                    <div className="stat-box">
                        <h3>{totalItems}</h3>
                        <p>Total Items</p>
                    </div>
                    <div className="stat-box">
                        <h3>{formatMoney(totalOrdersValue)}</h3>
                        <p>Orders Value</p>
                    </div>
                </div>

                <form className="user-order-form" onSubmit={handleOrderSubmit}>
                    <div className="user-order-form-header">
                        <h2>Place New Order</h2>
                        <button className="user-order-submit" type="submit" disabled={submitting}>
                            {submitting ? 'Placing...' : 'Place Order'}
                        </button>
                    </div>

                    <div className="user-order-products">
                        {products.length === 0 ? (
                            <div className="user-order-empty">No products available.</div>
                        ) : (
                            products.map(product => (
                                <div key={product.id} className="user-order-product-row">
                                    <span title={product.name}>{product.name}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={selectedProducts[product.id] || ''}
                                        onChange={e => handleProductChange(product.id, Number(e.target.value))}
                                        placeholder="Qty"
                                        disabled={submitting}
                                    />
                                </div>
                            ))
                        )}
                    </div>

                    {submitError && <div className="order-error">{submitError}</div>}
                    {orderSuccess && <div className="order-success">Order placed!</div>}
                </form>

                <div className="orders-table-container">
                    <table className="orders-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th>Order Date</th>
                            <th>Total</th>
                            <th>Items</th>
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="orders-empty">Loading...</td></tr>
                        ) : error ? (
                            <tr><td colSpan={6} className="orders-empty">{error}</td></tr>
                        ) : orders.length === 0 ? (
                            <tr><td colSpan={6} className="orders-empty">No orders found</td></tr>
                        ) : (
                            orders.map(order => (
                                <tr key={order.id}>
                                    <td>{order.id}</td>
                                    <td>
                                        <span className={`status-badge ${(order.status || 'PENDING').toLowerCase()}`}>
                                            {(order.status || 'PENDING').toUpperCase()}
                                        </span>
                                    </td>
                                    <td>{String(order.paymentStatus || '-').toUpperCase()}</td>
                                    <td>{formatDateTime(order.orderDate)}</td>
                                    <td>{formatMoney(order.totalAmount)}</td>
                                    <td>{Object.values(order.products || {}).reduce((sum, qty) => sum + Number(qty || 0), 0)}</td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </UserLayout>
    )
}

export default UserOrders
