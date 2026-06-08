import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth/AuthContext.jsx'
import CartDrawer from './CartDrawer.jsx'
import useCart from '../../hooks/useCart.js'
import useProductsLookup from '../../hooks/useProductsLookup.js'
import '../../css/User-page/UserTopNav.css'

function UserTopNav({ search, onSearchChange }) {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const [open, setOpen] = useState(false)
    const [cartOpen, setCartOpen] = useState(false)
    const menuRef = useRef(null)

    const { cart, remove, clear, count } = useCart()
    const { productsById } = useProductsLookup()

    useEffect(() => {
        const onDoc = (e) => {
            if (!open) return
            if (!menuRef.current) return
            if (!menuRef.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', onDoc)
        return () => document.removeEventListener('mousedown', onDoc)
    }, [open])

    const handleCheckout = () => {
        setCartOpen(false)
        navigate('/user/checkout')
    }

    const handleLogout = () => {
        logout?.()
        setOpen(false)
        setCartOpen(false)
        navigate('/', { replace: true })
    }

    return (
        <>
            <header className="amz-header">
                <div className="amz-header-inner">
                    <Link to="/" className="amz-logo">
                        <span className="amz-logo-mark">e</span>
                        <span className="amz-logo-text">store</span>
                    </Link>

                    <div className="amz-search">
                        <input
                            value={search}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            placeholder="Search products..."
                            aria-label="Search products"
                        />
                        <button type="button" className="amz-search-btn" aria-label="Search">
                            🔍
                        </button>
                    </div>

                    <div className="amz-actions" ref={menuRef}>
                        <button
                            type="button"
                            className="amz-account"
                            onClick={() => setOpen(o => !o)}
                        >
                            <div className="amz-account-line1">Hello, {user ? (user.userName || user.username) : 'sign in'}</div>
                            <div className="amz-account-line2">Account & Lists</div>
                        </button>

                        {open && (
                            <div className="amz-account-popover">
                                {!user ? (
                                    <>
                                        <div className="amz-popover-top">
                                            <button
                                                type="button"
                                                className="amz-signin-btn"
                                                onClick={() => {
                                                    setOpen(false)
                                                    navigate('/user-login')
                                                }}
                                            >
                                                Sign in
                                            </button>
                                            <div className="amz-register-row">
                                                <span>New customer? </span>
                                                <button
                                                    type="button"
                                                    className="amz-link"
                                                    onClick={() => {
                                                        setOpen(false)
                                                        navigate('/user-login', { state: { mode: 'register' } })
                                                    }}
                                                >
                                                    Start here.
                                                </button>
                                            </div>
                                        </div>

                                        <div className="amz-columns">
                                            <div className="amz-col">
                                                <div className="amz-col-title">Your Lists</div>
                                                <div className="amz-col-item">Create a List</div>
                                                <div className="amz-col-item">Find a Gift</div>
                                                <div className="amz-col-item">Baby Wishlist</div>
                                            </div>
                                            <div className="amz-col">
                                                <div className="amz-col-title">Your Account</div>
                                                <button
                                                    type="button"
                                                    className="amz-col-link"
                                                    onClick={() => {
                                                        setOpen(false)
                                                        navigate('/user/orders')
                                                    }}
                                                >
                                                    Your Orders
                                                </button>
                                                <div className="amz-col-item">Your Lists</div>
                                                <div className="amz-col-item">Your Wishlist</div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="amz-popover-top">
                                            <div className="amz-signedin-as">Signed in as <strong>{user.userName || user.username}</strong></div>
                                            <div className="amz-signedin-actions">
                                                <button
                                                    type="button"
                                                    className="amz-signin-btn"
                                                    onClick={() => {
                                                        setOpen(false)
                                                        navigate('/user/orders')
                                                    }}
                                                >
                                                    Your Orders
                                                </button>
                                                <button type="button" className="amz-signout-btn" onClick={handleLogout}>
                                                    Sign out
                                                </button>
                                            </div>
                                        </div>

                                        <div className="amz-columns">
                                            <div className="amz-col">
                                                <div className="amz-col-title">Your Account</div>
                                                <button
                                                    type="button"
                                                    className="amz-col-link"
                                                    onClick={() => {
                                                        setOpen(false)
                                                        navigate('/user/orders')
                                                    }}
                                                >
                                                    Your Orders
                                                </button>
                                            </div>
                                            <div className="amz-col">
                                                <div className="amz-col-title">Settings</div>
                                                <button type="button" className="amz-col-link" onClick={handleLogout}>Sign out</button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <button
                            type="button"
                            className="amz-orders"
                            onClick={() => navigate('/user/orders')}
                        >
                            <div className="amz-account-line1">Returns</div>
                            <div className="amz-account-line2">& Orders</div>
                        </button>

                        <button type="button" className="amz-cart" onClick={() => setCartOpen(true)}>
                            <span className="amz-cart-icon">
                                🛒
                                {count > 0 && <span className="amz-cart-badge">{count}</span>}
                            </span>
                            <span style={{ fontWeight: 900 }}>Cart</span>
                        </button>
                    </div>
                </div>
            </header>

            <CartDrawer
                open={cartOpen}
                items={cart}
                productsById={productsById}
                onClose={() => setCartOpen(false)}
                onRemove={remove}
                onClear={clear}
                onCheckout={handleCheckout}
            />
        </>
    )
}

export default UserTopNav
