import { useState, useEffect, useMemo } from 'react'
import AdminLayout from './AdminLayout.jsx'
import api from '../../services/api.js'
import '../../css/Admin-page/Products.css'
import useAdminSettings from '../../hooks/useAdminSettings.js'
import { formatMoney } from '../../services/settings.js'

function AdminProducts() {
    console.log('AdminProducts component rendered')
    const settings = useAdminSettings()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [toast, setToast] = useState({ show: false, message: '', type: '' })
    const [newProduct, setNewProduct] = useState({
        name: '',
        description: '',
        price: '',
        stock: '',
        imageUrl: ''
    })
    const [editProduct, setEditProduct] = useState({
        id: null,
        name: '',
        description: '',
        price: '',
        stock: '',
        imageUrl: ''
    })
    const [submitting, setSubmitting] = useState(false)

    // Szűrési állapotok
    const [productFilters, setProductFilters] = useState({
        search: '',
        sortBy: 'id-desc',
        active: []  // Dinamikus szűrők listája
    })
    const [newProductFilter, setNewProductFilter] = useState({ field: 'name', value: '' })
    const [filtersOpen, setFiltersOpen] = useState(false)

    useEffect(() => {
        console.log('Token on load:', localStorage.getItem('token'))
        const init = async () => {
            const token = localStorage.getItem('token')
            if (token) {
                await fetchProducts()
            } else {
                setTimeout(() => {
                    if (localStorage.getItem('token')) {
                        fetchProducts()
                    }
                }, 100)
            }
        }
        init()
    }, [])

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type })
        setTimeout(() => {
            setToast({ show: false, message: '', type: '' })
        }, 3000)
    }

    const fetchProducts = async () => {
        try {
            setLoading(true)
            const response = await api.get('/public/getAllProducts')
            const sortedProducts = [...response.data].sort((a, b) => a.id - b.id)
            setProducts(sortedProducts)
            setError(null)
        } catch (err) {
            console.error('Error fetching products:', err)
            setError(err.response?.data?.message || 'Failed to load products')
        } finally {
            setLoading(false)
        }
    }

    // Szűrő hozzáadása
    const handleAddProductFilter = (e) => {
        e.preventDefault()
        if (!newProductFilter.value.trim()) {
            showToast('Filter value cannot be empty', 'error')
            return
        }
        setProductFilters(prev => ({
            ...prev,
            active: [...prev.active, { ...newProductFilter, id: Date.now() }]
        }))
        setNewProductFilter({ field: 'name', value: '' })
    }

    // Szűrő eltávolítása
    const handleRemoveProductFilter = (filterId) => {
        setProductFilters(prev => ({
            ...prev,
            active: prev.active.filter(f => f.id !== filterId)
        }))
    }

    // Szűrt termékek
    const filteredProducts = useMemo(() => {
        let list = [...products]

        // 1. Dinamikus szűrők alkalmazása
        for (const filter of productFilters.active) {
            const { field, value } = filter
            const filterValue = String(value).toLowerCase()
            if (!filterValue) continue

            list = list.filter(product => {
                let targetValue = ''
                switch (field) {
                    case 'id':
                        targetValue = String(product.id)
                        break
                    case 'name':
                        targetValue = String(product.name || '')
                        break
                    case 'price':
                        targetValue = String(product.price || '')
                        break
                    case 'stock':
                        targetValue = String(product.stock || '')
                        break
                    case 'description':
                        targetValue = String(product.description || '')
                        break
                    default:
                        targetValue = ''
                }
                return String(targetValue).toLowerCase().includes(filterValue)
            })
        }

        // 2. Szöveges keresés
        const search = productFilters.search.trim().toLowerCase()
        if (search) {
            list = list.filter((product) => {
                const haystack = [product.id, product.name, product.description, product.price]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()
                return haystack.includes(search)
            })
        }

        // 3. Rendezés
        return [...list].sort((a, b) => {
            switch (productFilters.sortBy) {
                case 'price-asc':
                    return Number(a.price || 0) - Number(b.price || 0)
                case 'price-desc':
                    return Number(b.price || 0) - Number(a.price || 0)
                case 'name-asc':
                    return String(a.name || '').localeCompare(String(b.name || ''))
                case 'name-desc':
                    return String(b.name || '').localeCompare(String(a.name || ''))
                case 'stock-asc':
                    return Number(a.stock || 0) - Number(b.stock || 0)
                case 'stock-desc':
                    return Number(b.stock || 0) - Number(a.stock || 0)
                default: // id-desc
                    return (Number(b.id) || 0) - (Number(a.id) || 0)
            }
        })
    }, [products, productFilters])

    const handleViewDetails = (product) => {
        setSelectedProduct(product)
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setSelectedProduct(null)
    }

    const handleEdit = async (product) => {
        try {
            const response = await api.get(`/public/getProductById/${product.id}`)
            const freshProduct = response.data
            setEditProduct({
                id: freshProduct.id,
                name: freshProduct.name,
                description: freshProduct.description,
                price: freshProduct.price,
                stock: freshProduct.stock,
                imageUrl: freshProduct.imageUrl || ''
            })
            setShowEditModal(true)
        } catch (err) {
            console.error('Error fetching product:', err)
            showToast('Failed to load product data', 'error')
        }
    }

    const handleUpdateProduct = async (e) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            await api.put(`/admin/updateProduct/${editProduct.id}`, {
                name: editProduct.name,
                description: editProduct.description,
                price: parseFloat(editProduct.price),
                stock: parseInt(editProduct.stock),
                imageUrl: editProduct.imageUrl || ''
            })
            showToast('Product updated successfully!', 'success')
            setShowEditModal(false)
            setEditProduct({ id: null, name: '', description: '', price: '', stock: '', imageUrl: '' })
            fetchProducts()
        } catch (err) {
            console.error('Error updating product:', err)
            showToast(err.response?.data?.message || 'Failed to update product', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
            try {
                await api.delete(`/admin/deleteProduct/${id}`)
                fetchProducts()
                showToast('Product deleted successfully!', 'success')
            } catch (err) {
                console.error('Error deleting product:', err)
                showToast(err.response?.data || 'Failed to delete product', 'error')
            }
        }
    }

    const handleAddProduct = async (e) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            await api.post('/admin/addProduct', {
                name: newProduct.name,
                description: newProduct.description,
                price: parseFloat(newProduct.price),
                stock: parseInt(newProduct.stock),
                imageUrl: newProduct.imageUrl || ''
            })
            showToast('Product added successfully!', 'success')
            setShowAddModal(false)
            setNewProduct({ name: '', description: '', price: '', stock: '', imageUrl: '' })
            fetchProducts()
        } catch (err) {
            console.error('Error adding product:', err)
            showToast(err.response?.data?.message || 'Failed to add product', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const handleInputChange = (e) => {
        setNewProduct({
            ...newProduct,
            [e.target.name]: e.target.value
        })
    }

    const handleEditInputChange = (e) => {
        setEditProduct({
            ...editProduct,
            [e.target.name]: e.target.value
        })
    }

    if (loading) {
        return (
            <AdminLayout>
                <div className="products-loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading products...</p>
                </div>
            </AdminLayout>
        )
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="products-error-container">
                    <div className="error-icon">⚠️</div>
                    <h3>Error loading products</h3>
                    <p>{error}</p>
                    <button onClick={fetchProducts} className="retry-btn">Try Again</button>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <div className="products-content">
                {/* Toast Notification */}
                {toast.show && (
                    <div className={`toast-notification ${toast.type}`}>
                        <span className="toast-message">{toast.message}</span>
                        <button className="toast-close" onClick={() => setToast({ show: false, message: '', type: '' })}>×</button>
                    </div>
                )}

                {/* Header */}
                <div className="products-header">
                    <div>
                        <h1>Products</h1>
                    </div>
                    <button className="add-product-btn" onClick={() => setShowAddModal(true)}>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Product
                    </button>
                </div>

                {/* Stats */}
                <div className="products-stats">
                    <div className="stat-box">
                        <h3>{products.length}</h3>
                        <p>Total Products</p>
                    </div>
                    <div className="stat-box">
                        <h3>{products.filter(p => p.stock > 0).length}</h3>
                        <p>In Stock</p>
                    </div>
                    <div className="stat-box">
                        <h3>{products.filter(p => p.stock === 0).length}</h3>
                        <p>Out of Stock</p>
                    </div>
                </div>

                {/* Product Filters */}
                <div className="products-filters-panel">
                    <div className="products-filters-header">
                        <button
                            type="button"
                            className="products-filters-toggle"
                            onClick={() => setFiltersOpen(prev => !prev)}
                        >
                            <span>Product Filters</span>
                            <span className={`chev ${filtersOpen ? 'open' : ''}`}>▾</span>
                        </button>
                        <button
                            type="button"
                            className="products-filters-clear"
                            onClick={() => setProductFilters({ search: '', sortBy: 'id-desc', active: [] })}
                        >
                            Clear All
                        </button>
                    </div>

                    {filtersOpen && (
                        <div className="products-filters-body">
                            {/* Új szűrő hozzáadása */}
                            <form onSubmit={handleAddProductFilter} className="products-add-filter-form">
                                <select
                                    value={newProductFilter.field}
                                    onChange={(e) => setNewProductFilter(prev => ({ ...prev, field: e.target.value }))}
                                >
                                    <option value="id">Product ID</option>
                                    <option value="name">Name</option>
                                    <option value="price">Price</option>
                                    <option value="stock">Stock</option>
                                    <option value="description">Description</option>
                                </select>
                                <input
                                    type="text"
                                    value={newProductFilter.value}
                                    onChange={(e) => setNewProductFilter(prev => ({ ...prev, value: e.target.value }))}
                                    placeholder="Filter value..."
                                />
                                <button type="submit">Add Filter</button>
                            </form>

                            {/* Aktív szűrők */}
                            {productFilters.active.length > 0 && (
                                <div className="products-active-filters">
                                    {productFilters.active.map(filter => (
                                        <div key={filter.id} className="products-active-filter-tag">
                                            <span><strong>{filter.field}:</strong> {filter.value}</span>
                                            <button onClick={() => handleRemoveProductFilter(filter.id)}>×</button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Keresés és rendezés */}
                            <div className="products-static-filters">
                                <div className="products-filter-group">
                                    <label>Search products</label>
                                    <input
                                        type="text"
                                        value={productFilters.search}
                                        onChange={(e) => setProductFilters(prev => ({ ...prev, search: e.target.value }))}
                                        placeholder="Search by ID, name, description, price..."
                                    />
                                </div>
                                <div className="products-filter-group">
                                    <label>Sort products</label>
                                    <select
                                        value={productFilters.sortBy}
                                        onChange={(e) => setProductFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                                    >
                                        <option value="id-desc">Newest first</option>
                                        <option value="id-asc">Oldest first</option>
                                        <option value="price-desc">Price: high to low</option>
                                        <option value="price-asc">Price: low to high</option>
                                        <option value="name-asc">Name: A-Z</option>
                                        <option value="name-desc">Name: Z-A</option>
                                        <option value="stock-desc">Stock: high to low</option>
                                        <option value="stock-asc">Stock: low to high</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Products Table */}
                <div className="products-table-container">
                    <table className="products-table">
                        <thead>
                        <tr>
                            <th className="product-name-col">Product Name</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th className="actions-col">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                                <tr key={product.id}>
                                    <td>
                                        <div className="product-cell">
                                            <div className="product-cell-image">
                                                {product.imageUrl ? (
                                                    <img src={product.imageUrl} alt={product.name} />
                                                ) : (
                                                    <div className="image-placeholder-small">
                                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="product-cell-name">{product.name}</span>
                                        </div>
                                    </td>
                                    <td>{formatMoney(product.price, settings)}</td>
                                    <td>
                                            <span className="stock-amount">
                                                {product.stock}
                                            </span>
                                    </td>
                                    <td>
                                            <span className={`status-badge ${product.stock > 0 ? 'active' : 'out-of-stock'}`}>
                                                {product.stock > 0 ? 'ACTIVE' : 'OUT OF STOCK'}
                                            </span>
                                    </td>
                                    <td>
                                        <div className="product-actions">
                                            <button className="view-btn" onClick={() => handleViewDetails(product)}>
                                                View
                                            </button>
                                            <button className="edit-btn" onClick={() => handleEdit(product)}>
                                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button className="delete-btn" onClick={() => handleDelete(product.id, product.name)}>
                                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="products-empty">No products found.</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* View Details Modal */}
                {showModal && selectedProduct && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="product-details-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="product-details-header">
                                {selectedProduct.imageUrl ? (
                                    <img
                                        src={selectedProduct.imageUrl}
                                        alt={selectedProduct.name}
                                        className="product-details-header-image"
                                    />
                                ) : (
                                    <div className="product-details-header-placeholder">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}
                                <div className="product-details-id-badge">
                                    #{selectedProduct.id}
                                </div>
                                <button className="modal-close-btn" onClick={closeModal}>×</button>
                            </div>

                            <div className="product-details-content">
                                <h2 className="product-details-title">{selectedProduct.name}</h2>

                                <div className="product-details-price-section">
                    <span className="product-details-price">
                        {formatMoney(selectedProduct.price, settings)}
                    </span>
                                    <span className={`product-details-stock ${selectedProduct.stock > 0 ? (selectedProduct.stock < 10 ? 'low-stock' : 'in-stock') : 'out-of-stock'}`}>
                        {selectedProduct.stock > 0 ? (
                            <>
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {selectedProduct.stock < 10 ? `Only ${selectedProduct.stock} left` : `${selectedProduct.stock} in stock`}
                            </>
                        ) : (
                            <>
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Out of stock
                            </>
                        )}
                    </span>
                                </div>

                                <div className="product-details-info-grid">
                                    <div className="product-details-info-card">
                                        <div className="product-details-info-icon">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                            </svg>
                                        </div>
                                        <div className="product-details-info-text">
                                            <span className="product-details-info-label">Product ID</span>
                                            <span className="product-details-info-value">{selectedProduct.id}</span>
                                        </div>
                                    </div>

                                    <div className="product-details-info-card">
                                        <div className="product-details-info-icon">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="product-details-info-text">
                                            <span className="product-details-info-label">Price</span>
                                            <span className="product-details-info-value">{formatMoney(selectedProduct.price, settings)}</span>
                                        </div>
                                    </div>

                                    <div className="product-details-info-card">
                                        <div className="product-details-info-icon">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                        </div>
                                        <div className="product-details-info-text">
                                            <span className="product-details-info-label">Stock</span>
                                            <span className="product-details-info-value">{selectedProduct.stock} units</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="product-details-description">
                                    <div className="product-details-description-header">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                        <span>Description</span>
                                    </div>
                                    <p>{selectedProduct.description || "No description available for this product."}</p>
                                </div>

                                <div className="product-details-close-wrapper">
                                    <button className="product-details-close-btn" onClick={closeModal}>
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Add Product Modal (ugyanaz marad) */}
                {showAddModal && (
                    <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                        <div className="modal-content add-product-modal" onClick={(e) => e.stopPropagation()}>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
                            <h2>Add New Product</h2>
                            <form onSubmit={handleAddProduct} className="add-product-form">
                                <div className="form-group">
                                    <label>Product Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={newProduct.name}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter product name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description *</label>
                                    <textarea
                                        name="description"
                                        value={newProduct.description}
                                        onChange={handleInputChange}
                                        required
                                        rows="4"
                                        placeholder="Enter product description"
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Price *</label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={newProduct.price}
                                            onChange={handleInputChange}
                                            required
                                            step="0.01"
                                            min="0.01"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Stock *</label>
                                        <input
                                            type="number"
                                            name="stock"
                                            value={newProduct.stock}
                                            onChange={handleInputChange}
                                            required
                                            step="1"
                                            min="1"
                                            placeholder="Quantity"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Image URL</label>
                                    <input
                                        type="text"
                                        name="imageUrl"
                                        value={newProduct.imageUrl}
                                        onChange={handleInputChange}
                                        placeholder="https://example.com/product-image.jpg"
                                    />
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="cancel-btn" onClick={() => setShowAddModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="submit-btn" disabled={submitting}>
                                        {submitting ? 'Adding...' : 'Add Product'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Product Modal (ugyanaz marad) */}
                {showEditModal && (
                    <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                        <div className="modal-content add-product-modal" onClick={(e) => e.stopPropagation()}>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
                            <h2>Edit Product</h2>
                            <form onSubmit={handleUpdateProduct} className="add-product-form">
                                <div className="form-group">
                                    <label>Product Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={editProduct.name || ''}
                                        onChange={handleEditInputChange}
                                        required
                                        placeholder="Enter product name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description *</label>
                                    <textarea
                                        name="description"
                                        value={editProduct.description || ''}
                                        onChange={handleEditInputChange}
                                        required
                                        rows="4"
                                        placeholder="Enter product description"
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Price *</label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={editProduct.price || ''}
                                            onChange={handleEditInputChange}
                                            required
                                            step="0.01"
                                            min="0.01"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Stock *</label>
                                        <input
                                            type="number"
                                            name="stock"
                                            value={editProduct.stock || ''}
                                            onChange={handleEditInputChange}
                                            required
                                            step="1"
                                            min="1"
                                            placeholder="Quantity"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Image URL</label>
                                    <input
                                        type="text"
                                        name="imageUrl"
                                        value={editProduct.imageUrl || ''}
                                        onChange={handleEditInputChange}
                                        placeholder="https://example.com/product-image.jpg"
                                    />
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="cancel-btn" onClick={() => setShowEditModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="submit-btn" disabled={submitting}>
                                        {submitting ? 'Updating...' : 'Update Product'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}

export default AdminProducts