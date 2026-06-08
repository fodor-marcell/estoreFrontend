import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import UserTopNav from './UserTopNav.jsx'
import CartDrawer from './CartDrawer.jsx'
import '../../css/User-page/UserHome.css'

function GuestHome() {
    const [products, setProducts] = useState([])
    const [recommended, setRecommended] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [search, setSearch] = useState('')

    const [cartOpen, setCartOpen] = useState(false)
    const [cart, setCart] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('cart') || '{}')
        } catch {
            return {}
        }
    })
    const [qtyById, setQtyById] = useState({})

    const productsById = useMemo(() => {
        const m = new Map()
        products.forEach((p) => m.set(Number(p.id), p))
        return m
    }, [products])

    useEffect(() => {
        const onCartEvent = () => {
            try {
                setCart(JSON.parse(localStorage.getItem('cart') || '{}'))
            } catch {
                setCart({})
            }
        }
        window.addEventListener('cart:changed', onCartEvent)
        return () => window.removeEventListener('cart:changed', onCartEvent)
    }, [])

    const persistCart = (next) => {
        setCart(next)
        localStorage.setItem('cart', JSON.stringify(next))
        window.dispatchEvent(new Event('cart:changed'))
    }

    const addToCart = (productId, qty = 1) => {
        const id = Number(productId)
        const q = Number(qty)
        if (!Number.isFinite(id)) return
        if (!Number.isFinite(q) || q <= 0) return
        const next = { ...(cart || {}) }
        next[String(id)] = Number(next[String(id)] || 0) + q
        persistCart(next)
        setCartOpen(true)
    }

    const removeFromCart = (productId) => {
        const next = { ...(cart || {}) }
        delete next[String(productId)]
        persistCart(next)
    }

    const clearCart = () => persistCart({})

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)

                const res = await api.get('/public/getAllProducts')
                setProducts(Array.isArray(res.data) ? res.data : [])

                // Guests: always call recommended with userId=0
                try {
                    const rec = await api.get('/public/getRecommendedProducts/0')
                    setRecommended(Array.isArray(rec.data) ? rec.data : [])
                } catch {
                    setRecommended([])
                }

                setError('')
            } catch {
                setError('Failed to load products')
                setProducts([])
                setRecommended([])
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const filteredRecommended = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return recommended
        return recommended.filter((p) => {
            const hay = [p?.name, p?.description, p?.price, p?.id]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
            return hay.includes(q)
        })
    }, [recommended, search])

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return products
        return products.filter((p) => {
            const hay = [p?.name, p?.description, p?.price, p?.id].filter(Boolean).join(' ').toLowerCase()
            return hay.includes(q)
        })
    }, [products, search])

    const renderActions = (p) => {
        const current = Number(qtyById?.[p.id] ?? 1)
        const safe = Number.isFinite(current) && current > 0 ? current : 1
        return (
            <div className="user-product-actions">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
                    <label style={{ fontSize: 12, opacity: 0.8 }}>Qty</label>
                    <input
                        type="number"
                        min={1}
                        step={1}
                        value={safe}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                            e.stopPropagation()
                            const v = Math.max(1, Number(e.target.value || 1))
                            setQtyById((prev) => ({ ...(prev || {}), [p.id]: v }))
                        }}
                        style={{ width: 64, padding: '6px 8px', borderRadius: 8, border: '1px solid #e5e7eb' }}
                    />
                    <button
                        type="button"
                        className="user-add-to-cart"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            addToCart(p.id, safe)
                        }}
                    >
                        Add to cart
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="user-home">
            <UserTopNav search={search} onSearchChange={setSearch} />

            <main className="user-home-main">
                <div className="user-home-inner">
                    {filteredRecommended.length > 0 && (
                        <>
                            <h1 className="user-home-title">Recommended products</h1>

                            {loading ? (
                                <div className="user-home-state">Loading...</div>
                            ) : error ? (
                                <div className="user-home-state user-home-state--error">{error}</div>
                            ) : (
                                <div className="user-products-grid">
                                    {filteredRecommended.map((p) => (
                                        <div
                                            key={`rec-${p.id}`}
                                            className="user-product-card"
                                            onClick={() => {}}
                                        >
                                            <div className="user-product-image">
                                                {p.imageUrl ? (
                                                    <img src={p.imageUrl} alt={p.name} />
                                                ) : (
                                                    <div className="user-product-image--placeholder">No image</div>
                                                )}
                                            </div>

                                            <div className="user-product-body">
                                                <div className="user-product-name" title={p.name}>
                                                    {p.name}
                                                </div>
                                                <div className="user-product-price">{p.price}</div>
                                                <div className="user-product-desc">{p.description || 'No description.'}</div>

                                                {renderActions(p)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    <h1 className="user-home-title">Products</h1>

                    {loading ? (
                        <div className="user-home-state">Loading...</div>
                    ) : error ? (
                        <div className="user-home-state user-home-state--error">{error}</div>
                    ) : filtered.length === 0 ? (
                        <div className="user-home-state">No products found.</div>
                    ) : (
                        <div className="user-products-grid">
                            {filtered.map((p) => (
                                <div key={p.id} className="user-product-card" onClick={() => {}}>
                                    <div className="user-product-image">
                                        {p.imageUrl ? (
                                            <img src={p.imageUrl} alt={p.name} />
                                        ) : (
                                            <div className="user-product-image--placeholder">No image</div>
                                        )}
                                    </div>

                                    <div className="user-product-body">
                                        <div className="user-product-name" title={p.name}>
                                            {p.name}
                                        </div>
                                        <div className="user-product-price">{p.price}</div>
                                        <div className="user-product-desc">{p.description || 'No description.'}</div>

                                        {renderActions(p)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <CartDrawer
                open={cartOpen}
                items={cart}
                productsById={productsById}
                onClose={() => setCartOpen(false)}
                onRemove={removeFromCart}
                onClear={clearCart}
                onCheckout={() => {
                    setCartOpen(false)
                    window.location.href = '/user/checkout'
                }}
            />
        </div>
    )
}

export default GuestHome
