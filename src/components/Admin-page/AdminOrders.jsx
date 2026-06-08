import { useEffect, useMemo, useState } from 'react'
import AdminLayout from './AdminLayout.jsx'
import api from '../../services/api.js'
import '../../css/Admin-page/Orders.css'
import useAdminSettings from '../../hooks/useAdminSettings.js'
import { formatMoney as formatMoneyWithCurrency } from '../../services/settings.js'

function AdminOrders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [toast, setToast] = useState({ show: false, message: '', type: '' })

    const [availableProducts, setAvailableProducts] = useState([])
    const [availableUsers, setAvailableUsers] = useState([])

    const [showAddModal, setShowAddModal] = useState(false)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [orderToDelete, setOrderToDelete] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    const [orderFilters, setOrderFilters] = useState({ status: 'ALL', sortBy: 'id-desc', active: [] })
    const [newOrderFilter, setNewOrderFilter] = useState({ field: 'id', value: '' })

    const [filtersOpen, setFiltersOpen] = useState({ orders: false })

    // For creating an order: products is a list of rows, later we convert to { [productId]: quantity }
    const [newOrder, setNewOrder] = useState({
        userId: '',
        status: 'PENDING',
        products: [{ productId: '', quantity: 1 }]
    })

    const settings = useAdminSettings()

    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true)
                const response = await api.get('/admin/getAllOrders')
                const sorted = Array.isArray(response.data)
                    ? [...response.data].sort((a, b) => (b.id || 0) - (a.id || 0))
                    : []
                setOrders(sorted)
                setError(null)
            } catch (err) {
                console.error('Error fetching orders:', err)
                setError(err.response?.data?.message || 'Failed to load orders')
            } finally {
                setLoading(false)
            }
        }

        init()
    }, [])

    const pushToast = (message, type = 'success') => {
        setToast({ show: true, message, type })
        setTimeout(() => {
            setToast({ show: false, message: '', type: '' })
        }, 3000)
    }

    const fetchProductsForPicker = async () => {
        try {
            const res = await api.get('/public/getAllProducts')
            const list = Array.isArray(res.data) ? res.data : []
            const sorted = [...list].sort((a, b) => (a.id || 0) - (b.id || 0))
            setAvailableProducts(sorted)
        } catch (err) {
            console.error('Error fetching products for order picker:', err)
            pushToast('Failed to load products list', 'error')
        }
    }

    const fetchUsersForPicker = async () => {
        try {
            const res = await api.get('/admin/getAllUsers')
            const list = Array.isArray(res.data) ? res.data : []
            const sorted = [...list].sort((a, b) => (a.id || 0) - (b.id || 0))
            setAvailableUsers(sorted)
        } catch (err) {
            console.error('Error fetching users for order picker:', err)
            pushToast('Failed to load users list', 'error')
        }
    }

    const onOpenAddModal = async () => {
        setNewOrder(prev => ({
            ...prev,
            status: settings.defaultOrderStatus || 'PENDING'
        }))

        setShowAddModal(true)
        // load only when needed
        if (availableProducts.length === 0) {
            await fetchProductsForPicker()
        }
        if (availableUsers.length === 0) {
            await fetchUsersForPicker()
        }
    }

    const fetchOrders = async (opts = {}) => {
        try {
            setLoading(true)
            const response = await api.get('/admin/getAllOrders')
            const sorted = Array.isArray(response.data)
                ? [...response.data].sort((a, b) => (b.id || 0) - (a.id || 0))
                : []
            setOrders(sorted)
            setError(null)

            if (opts.showSuccessToast) {
                pushToast('Orders refreshed successfully!', 'success')
            }
        } catch (err) {
            console.error('Error fetching orders:', err)
            setError(err.response?.data?.message || 'Failed to load orders')

            if (opts.showSuccessToast) {
                pushToast(err.response?.data?.message || 'Failed to refresh orders', 'error')
            }
        } finally {
            setLoading(false)
        }
    }

    const formatDateTime = (value) => {
        if (!value) return '-'
        const d = new Date(value)
        if (Number.isNaN(d.getTime())) return String(value)
        return d.toLocaleString()
    }

    const formatMoney = (value) => formatMoneyWithCurrency(value, settings.currency)

    const countItems = (products) => {
        if (!products || typeof products !== 'object') return 0
        return Object.values(products).reduce((sum, qty) => sum + Number(qty || 0), 0)
    }

    const getProductImage = (product) => {
        return product?.imageUrl || product?.image || product?.thumbnail || product?.picture || product?.photo || ''
    }

    const productNameById = useMemo(() => {
        const map = new Map()
        availableProducts.forEach((product) => {
            map.set(Number(product.id), product?.name || `#${product.id}`)
        })
        return map
    }, [availableProducts])

    const getProductNameById = useMemo(() => {
        return (productId) => productNameById.get(Number(productId)) || `#${productId}`
    }, [productNameById])

    const totalItems = useMemo(() => {
        return orders.reduce((sum, o) => sum + countItems(o.products), 0)
    }, [orders])

    const totalOrdersValue = useMemo(() => {
        return orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)
    }, [orders])

    const selectedProductIds = useMemo(() => {
        return new Set(
            (newOrder.products || [])
                .map(r => Number(r.productId))
                .filter(id => Number.isFinite(id) && id > 0)
        )
    }, [newOrder.products])

    const productLabel = (p) => {
        const name = p?.name ? ` - ${p.name}` : ''
        const stock = (p?.stock === 0 || p?.stock) ? ` (stock: ${p.stock})` : ''
        return `#${p.id}${name}${stock}`
    }

    const filteredOrders = useMemo(() => {
        const list = orders.filter((order) => {
            // 1. Filter by status
            const status = String(order.status || 'PENDING').toUpperCase()
            if (orderFilters.status !== 'ALL' && status !== orderFilters.status) {
                return false
            }

            // 2. Apply all active filters
            for (const filter of orderFilters.active) {
                const { field, value } = filter
                const filterValue = String(value).toLowerCase()
                if (!filterValue) continue

                let targetValue = ''
                switch (field) {
                    case 'id':
                        targetValue = String(order.id)
                        break
                    case 'userId':
                        targetValue = String(order.userId)
                        break
                    case 'totalAmount':
                        targetValue = String(order.totalAmount)
                        break
                    case 'productName': {
                        const orderProductsText = Object.keys(order.products || {})
                            .map(productId => getProductNameById(productId))
                            .join(' ')
                            .toLowerCase()
                        if (!orderProductsText.includes(filterValue)) return false
                        continue // Skip the generic check below
                    }
                }

                if (!String(targetValue).toLowerCase().includes(filterValue)) {
                    return false
                }
            }

            return true
        })

        // 3. Sort the filtered list
        return [...list].sort((a, b) => {
            switch (orderFilters.sortBy) {
                case 'total-asc':
                    return Number(a.totalAmount || 0) - Number(b.totalAmount || 0)
                case 'total-desc':
                    return Number(b.totalAmount || 0) - Number(a.totalAmount || 0)
                case 'date-asc':
                    return new Date(a.orderDate || 0) - new Date(b.orderDate || 0)
                case 'date-desc':
                    return new Date(b.orderDate || 0) - new Date(a.orderDate || 0)
                default: // id-desc
                    return (Number(b.id) || 0) - (Number(a.id) || 0)
            }
        })
    }, [orders, orderFilters, getProductNameById])

    const resolveProductName = (productId) => {
        const idNum = Number(productId)
        if (!Number.isFinite(idNum)) return String(productId)
        const name = getProductNameById(idNum)
        // If lookup returns "#id" but we have the product list, keep it; otherwise still show #id.
        return name || `#${idNum}`
    }

    const openDetails = async (order) => {
        // Ensure we have products available to resolve product names in the details modal
        if (availableProducts.length === 0) {
            await fetchProductsForPicker()
        }
        setSelectedOrder(order)
        setShowDetailsModal(true)
    }

    const closeDetails = () => {
        setSelectedOrder(null)
        setShowDetailsModal(false)
    }

    const handleDeleteClick = (order) => {
        setOrderToDelete(order)
        setShowDeleteModal(true)
    }

    const confirmDelete = async () => {
        if (!orderToDelete) return

        try {
            setSubmitting(true)
            await api.delete(`/admin/deleteOrderById/${orderToDelete.id}`)
            pushToast(`Order #${orderToDelete.id} deleted successfully!`, 'success')
            setShowDeleteModal(false)
            setOrderToDelete(null)
            await fetchOrders()
        } catch (err) {
            console.error('Error deleting order:', err)
            pushToast(err.response?.data?.message || 'Failed to delete order', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const cancelDelete = () => {
        setShowDeleteModal(false)
        setOrderToDelete(null)
    }

    const handleUpdateOrderStatus = async (orderId) => {
        const idNum = Number(orderId)
        if (!Number.isFinite(idNum) || idNum <= 0) return

        try {
            setSubmitting(true)
            await api.put(`/admin/updateOrderStatus/${idNum}`)
            pushToast(`Order #${idNum} status updated successfully!`, 'success')
            await fetchOrders()

            // If details modal is open for this order, refresh selected order from the updated list
            if (selectedOrder && Number(selectedOrder.id) === idNum) {
                const updated = orders.find(o => Number(o.id) === idNum)
                if (updated) setSelectedOrder(updated)
            }
        } catch (err) {
            console.error('Error updating order status:', err)
            pushToast(err.response?.data?.message || 'Failed to update order status', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const handleAddOrderFilter = (e) => {
        e.preventDefault()
        if (!newOrderFilter.value.trim()) {
            pushToast('Filter value cannot be empty', 'error')
            return
        }
        setOrderFilters(prev => ({
            ...prev,
            active: [...prev.active, { ...newOrderFilter, id: Date.now() }]
        }))
        setNewOrderFilter({ field: 'id', value: '' }) // Reset form
    }

    const handleRemoveOrderFilter = (filterId) => {
        setOrderFilters(prev => ({
            ...prev,
            active: prev.active.filter(f => f.id !== filterId)
        }))
    }

    const resetNewOrder = () => {
        setNewOrder({
            userId: '',
            status: 'PENDING',
            products: [{ productId: '', quantity: 1 }]
        })
    }

    const addProductRow = () => {
        setNewOrder(prev => ({
            ...prev,
            products: [...prev.products, { productId: '', quantity: 1 }]
        }))
    }

    const removeProductRow = (index) => {
        setNewOrder(prev => ({
            ...prev,
            products: prev.products.filter((_, i) => i !== index)
        }))
    }

    const updateProductRow = (index, field, value) => {
        setNewOrder(prev => ({
            ...prev,
            products: prev.products.map((row, i) => i === index ? { ...row, [field]: value } : row)
        }))
    }

    const handleCreateOrder = async (e) => {
        e.preventDefault()

        const userIdNum = Number(newOrder.userId)
        if (!Number.isFinite(userIdNum) || userIdNum <= 0) {
            pushToast('Please select a valid user', 'error')
            return
        }

        const productsMap = {}
        for (const row of newOrder.products) {
            const pid = Number(row.productId)
            const qty = Number(row.quantity)
            if (!Number.isFinite(pid) || pid <= 0) {
                pushToast('Please select a product for each row', 'error')
                return
            }

            const selected = availableProducts.find(p => Number(p.id) === pid)
            const outOfStock = selected && Number(selected.stock) === 0
            if (outOfStock && !settings.enableOutOfStockPurchases) {
                pushToast(`Product #${pid} is out of stock`, 'error')
                return
            }

            if (!Number.isFinite(qty) || qty <= 0) {
                pushToast('Each product row must have a quantity > 0', 'error')
                return
            }
            productsMap[pid] = (productsMap[pid] || 0) + qty
        }

        try {
            setSubmitting(true)
            await api.post('/public/createOrder', {
                userId: userIdNum,
                status: newOrder.status || 'PENDING',
                products: productsMap
            })
            pushToast('Order created successfully!', 'success')

            // Refresh products so stock changes are reflected immediately for the next order
            await fetchProductsForPicker()

            setShowAddModal(false)
            resetNewOrder()
            await fetchOrders()
        } catch (err) {
            console.error('Error creating order:', err)
            pushToast(err.response?.data?.message || 'Failed to create order', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <AdminLayout>
                <div className="orders-loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading orders...</p>
                </div>
            </AdminLayout>
        )
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="orders-error-container">
                    <div className="error-icon">⚠️</div>
                    <h3>Error loading orders</h3>
                    <p>{error}</p>
                    <button onClick={() => fetchOrders({ showSuccessToast: true })} className="retry-btn">Try Again</button>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <div className="orders-content">
                {/* Toast Notification */}
                {toast.show && (
                    <div className={`toast-notification ${toast.type}`}>
                        <span className="toast-message">{toast.message}</span>
                        <button className="toast-close" onClick={() => setToast({ show: false, message: '', type: '' })}>×</button>
                    </div>
                )}

                {/* Header */}
                <div className="orders-header">
                    <div>
                        <h1>Orders</h1>
                    </div>
                    <div className="orders-header-actions">
                        <button className="add-order-btn" onClick={onOpenAddModal}>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Order
                        </button>
                        <button className="refresh-orders-btn" onClick={() => fetchOrders({ showSuccessToast: true })}>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M5 19a9 9 0 0114-7.5L20 10M19 5a9 9 0 00-14 7.5L4 14" />
                            </svg>
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="orders-stats">
                    <div className="stat-box">
                        <h3>{orders.length}</h3>
                        <p>Total Orders</p>
                    </div>
                    <div className="stat-box">
                        <h3>{orders.filter(o => (o.status || 'PENDING') === 'PENDING').length}</h3>
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

                {/* Filters */}
                <div className="orders-filters-panel">
                    <div className="orders-filters-header">
                        <button
                            type="button"
                            className="orders-filters-toggle"
                            onClick={() => setFiltersOpen(prev => ({ ...prev, orders: !prev.orders }))}
                        >
                            <span>Order filters</span>
                            <span className={`chev ${filtersOpen.orders ? 'open' : ''}`}>▾</span>
                        </button>
                        <button
                            type="button"
                            className="orders-filters-clear"
                            onClick={() => setOrderFilters({ status: 'ALL', sortBy: 'id-desc', active: [] })}
                        >
                            Clear All
                        </button>
                    </div>

                    {filtersOpen.orders && (
                        <div className="orders-filters-body">
                            {/* New filter creation form */}
                            <form onSubmit={handleAddOrderFilter} className="orders-add-filter-form">
                                <select
                                    value={newOrderFilter.field}
                                    onChange={(e) => setNewOrderFilter(prev => ({ ...prev, field: e.target.value }))}
                                >
                                    <option value="id">Order ID</option>
                                    <option value="userId">User ID</option>
                                    <option value="totalAmount">Total Amount</option>
                                    <option value="productName">Product Name</option>
                                </select>
                                <input
                                    type="text"
                                    value={newOrderFilter.value}
                                    onChange={(e) => setNewOrderFilter(prev => ({ ...prev, value: e.target.value }))}
                                    placeholder="Filter value..."
                                />
                                <button type="submit">Add Filter</button>
                            </form>

                            {/* Static filters */}
                            <div className="orders-static-filters">
                                <div className="orders-filter-group">
                                    <label>Status</label>
                                    <select
                                        value={orderFilters.status}
                                        onChange={(e) => setOrderFilters(prev => ({ ...prev, status: e.target.value }))}
                                    >
                                        <option value="ALL">All statuses</option>
                                        <option value="PENDING">PENDING</option>
                                        <option value="SHIPPED">SHIPPED</option>
                                        <option value="DELIVERED">DELIVERED</option>
                                        <option value="CANCELLED">CANCELLED</option>
                                    </select>
                                </div>
                                <div className="orders-filter-group">
                                    <label>Sort orders</label>
                                    <select
                                        value={orderFilters.sortBy}
                                        onChange={(e) => setOrderFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                                    >
                                        <option value="id-desc">Newest first</option>
                                        <option value="id-asc">Oldest first</option>
                                        <option value="total-desc">Total: high to low</option>
                                        <option value="total-asc">Total: low to high</option>
                                        <option value="date-desc">Date: newest first</option>
                                        <option value="date-asc">Date: oldest first</option>
                                    </select>
                                </div>
                            </div>

                            {/* Active dynamic filters */}
                            {orderFilters.active.length > 0 && (
                                <div className="orders-active-filters">
                                    {orderFilters.active.map(filter => (
                                        <div key={filter.id} className="orders-active-filter-tag">
                                            <span><strong>{filter.field}:</strong> {filter.value}</span>
                                            <button onClick={() => handleRemoveOrderFilter(filter.id)}>×</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* Orders Table */}
                <div className="orders-table-container">
                    <table className="orders-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>User ID</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th>Order Date</th>
                            <th>Total</th>
                            <th>Items</th>
                            <th className="orders-actions-col">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="orders-empty">No orders found</td>
                            </tr>
                        ) : (
                            filteredOrders.map((order) => {
                                const status = (order.status || 'PENDING').toUpperCase()
                                const statusClass = status.toLowerCase()
                                const paymentStatus = String(order.paymentStatus || '-').toUpperCase()
                                return (
                                    <tr key={order.id}>
                                        <td>{order.id}</td>
                                        <td>{order.userId}</td>
                                        <td>
                                            <span className={`status-badge ${statusClass}`}>{status}</span>
                                        </td>
                                        <td>{paymentStatus}</td>
                                        <td>{formatDateTime(order.orderDate)}</td>
                                        <td>{formatMoney(order.totalAmount)}</td>
                                        <td>{countItems(order.products)}</td>
                                        <td className="orders-actions-cell">
                                            <button className="view-order-btn" onClick={() => openDetails(order)}>
                                                View
                                            </button>
                                            <button
                                                className="refresh-orders-btn"
                                                type="button"
                                                disabled={submitting}
                                                onClick={() => handleUpdateOrderStatus(order.id)}
                                                title="Update order status"
                                                style={{ padding: '8px 12px', borderRadius: 10 }}
                                            >
                                                Update Status
                                            </button>
                                            <button className="delete-order-btn" onClick={() => handleDeleteClick(order)}>
                                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Add Order Modal */}
                {showAddModal && (
                    <div className="orders-modal-overlay" onClick={() => !submitting && setShowAddModal(false)}>
                        <div className="orders-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="orders-modal-header">
                                <h2>Add Order</h2>
                                <button className="orders-modal-close" onClick={() => !submitting && setShowAddModal(false)}>×</button>
                            </div>

                            <form className="orders-form" onSubmit={handleCreateOrder}>
                                <div className="orders-form-row">
                                    <label>User</label>
                                    <select
                                        value={newOrder.userId}
                                        onChange={(e) => setNewOrder(prev => ({ ...prev, userId: e.target.value }))}
                                        required
                                    >
                                        <option value="">Select user...</option>
                                        {availableUsers.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                #{u.id} - {u.userName}{u.email ? ` (${u.email})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="orders-form-row">
                                    <label>Status</label>
                                    <select
                                        value={newOrder.status}
                                        onChange={(e) => setNewOrder(prev => ({ ...prev, status: e.target.value }))}
                                    >
                                        <option value="PENDING">PENDING</option>
                                        <option value="SHIPPED">SHIPPED</option>
                                        <option value="DELIVERED">DELIVERED</option>
                                        <option value="CANCELLED">CANCELLED</option>
                                    </select>
                                </div>

                                <div className="orders-form-products">
                                    <div className="orders-form-products-header">
                                        <h3>Products</h3>
                                        <button type="button" className="orders-add-row-btn" onClick={addProductRow} disabled={submitting}>
                                            + Add another product
                                        </button>
                                    </div>

                                    {availableProducts.length === 0 ? (
                                        <div className="orders-products-empty">No products loaded.</div>
                                    ) : (
                                        newOrder.products.map((row, idx) => {
                                            const currentId = Number(row.productId)
                                            const selectedProduct = availableProducts.find(p => Number(p.id) === currentId)
                                            const selectedImage = getProductImage(selectedProduct)
                                            return (
                                                <div key={idx} className="orders-product-row">
                                                    <select
                                                        value={row.productId}
                                                        onChange={(e) => updateProductRow(idx, 'productId', e.target.value)}
                                                        required
                                                        className="orders-product-select"
                                                    >
                                                        <option value="">Select product...</option>
                                                        {availableProducts.map((p) => {
                                                            const alreadySelected = selectedProductIds.has(Number(p.id)) && Number(p.id) !== currentId
                                                            const outOfStock = Number(p.stock) === 0
                                                            const disabled = alreadySelected || (outOfStock && !settings.enableOutOfStockPurchases)
                                                            return (
                                                                <option key={p.id} value={p.id} disabled={disabled}>
                                                                    {productLabel(p)}{outOfStock ? ' - OUT OF STOCK' : ''}
                                                                </option>
                                                            )
                                                        })}
                                                    </select>

                                                    <div className="orders-product-preview-column">
                                                        {row.productId ? (
                                                            <div className="orders-product-preview">
                                                                {selectedImage ? (
                                                                    <img
                                                                        src={selectedImage}
                                                                        alt={selectedProduct?.name || 'Product preview'}
                                                                        className="orders-product-preview-image"
                                                                    />
                                                                ) : (
                                                                    <div className="orders-product-preview-placeholder">No image</div>
                                                                )}
                                                                <span className="orders-product-preview-name">
                                                                    {getProductNameById(row.productId)}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="orders-product-preview-placeholder">Select a product</div>
                                                        )}
                                                    </div>

                                                    <input
                                                        type="number"
                                                        min="1"
                                                        placeholder="Qty"
                                                        value={row.quantity}
                                                        onChange={(e) => updateProductRow(idx, 'quantity', e.target.value)}
                                                        required
                                                    />

                                                    <button
                                                        type="button"
                                                        className="orders-remove-row-btn"
                                                        onClick={() => removeProductRow(idx)}
                                                        disabled={submitting || newOrder.products.length === 1}
                                                        title={newOrder.products.length === 1 ? 'At least one product is required' : 'Remove row'}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>

                                <div className="orders-form-actions">
                                    <button type="button" className="orders-cancel-btn" onClick={() => !submitting && setShowAddModal(false)} disabled={submitting}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="orders-submit-btn" disabled={submitting || availableProducts.length === 0 || availableUsers.length === 0}>
                                        {submitting ? 'Creating...' : 'Create Order'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Order Details Modal */}
                {showDetailsModal && selectedOrder && (
                    <div className="orders-modal-overlay" onClick={closeDetails}>
                        <div className="orders-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="orders-modal-header">
                                <h2>Order #{selectedOrder.id}</h2>
                                <button className="orders-modal-close" onClick={closeDetails}>×</button>
                            </div>

                            <div className="orders-details-grid">
                                <div className="orders-detail-item">
                                    <span className="label">User ID</span>
                                    <span className="value">{selectedOrder.userId}</span>
                                </div>
                                <div className="orders-detail-item">
                                    <span className="label">Status</span>
                                    <span className={`value status-badge ${(selectedOrder.status || 'PENDING').toLowerCase()}`}>{(selectedOrder.status || 'PENDING').toUpperCase()}</span>
                                </div>
                                <div className="orders-detail-item">
                                    <span className="label">Order Date</span>
                                    <span className="value">{formatDateTime(selectedOrder.orderDate)}</span>
                                </div>
                                <div className="orders-detail-item">
                                    <span className="label">Total Amount</span>
                                    <span className="value">{formatMoney(selectedOrder.totalAmount)}</span>
                                </div>
                            </div>

                            <div className="orders-products-section">
                                <h3>Products</h3>
                                {selectedOrder.products && Object.keys(selectedOrder.products).length > 0 ? (
                                    <table className="orders-products-table">
                                        <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Quantity</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {Object.entries(selectedOrder.products).map(([productId, qty]) => (
                                            <tr key={productId}>
                                                <td>
                                                    <div className="orders-detail-product-cell">
                                                        <div className="orders-detail-product-name">{resolveProductName(productId)}</div>
                                                    </div>
                                                </td>
                                                <td>{qty}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="orders-empty-products">No products on this order.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && orderToDelete && (
                    <div className="orders-modal-overlay" onClick={cancelDelete}>
                        <div className="orders-modal delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="orders-modal-header">
                                <h2>Delete Order</h2>
                                <button className="orders-modal-close" onClick={cancelDelete}>×</button>
                            </div>

                            <div className="delete-confirm-content">
                                <div className="delete-warning-icon">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3>Are you sure?</h3>
                                <p>
                                    You are about to delete order <strong>#{orderToDelete.id}</strong>.
                                    <br />
                                    This action cannot be undone.
                                </p>
                                <div className="delete-order-details">
                                    <div><strong>User ID:</strong> {orderToDelete.userId}</div>
                                    <div><strong>Total:</strong> {formatMoney(orderToDelete.totalAmount)}</div>
                                    <div><strong>Status:</strong> {orderToDelete.status}</div>
                                </div>
                                <div className="orders-form-actions">
                                    <button type="button" className="orders-cancel-btn" onClick={cancelDelete} disabled={submitting}>
                                        Cancel
                                    </button>
                                    <button type="button" className="delete-confirm-btn" onClick={confirmDelete} disabled={submitting}>
                                        {submitting ? 'Deleting...' : 'Yes, Delete Order'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}

export default AdminOrders
