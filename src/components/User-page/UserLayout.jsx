import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext.jsx'
import '../../css/User-page/Layout.css'

function UserLayout({ children }) {
    const navigate = useNavigate()
    const location = useLocation()
    const [showProfileMenu, setShowProfileMenu] = useState(false)

    const { user, logout } = useAuth()

    const handleLogout = () => {
        logout?.()
        navigate('/')
    }

    const isActive = (path) => {
        return location.pathname === path ? 'user-nav-item active' : 'user-nav-item'
    }

    return (
        <div className="user-layout">
            <header className="user-headerbar">
                <div className="user-headerbar-inner">
                    <div className="user-brand">
                        <Link to="/" className="user-brand-link">E-Store</Link>
                        <span className="user-brand-badge">USER</span>
                    </div>

                    <nav className="user-nav">
                        <Link to="/user/dashboard" className={isActive('/user/dashboard')}>
                            Dashboard
                        </Link>
                        <Link to="/user/orders" className={isActive('/user/orders')}>
                            Orders
                        </Link>
                    </nav>

                    <div className="user-header-actions">
                        <button
                            type="button"
                            className="user-avatar-btn"
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            aria-label="Open profile menu"
                        >
                            {(user?.userName || user?.username)?.charAt(0)?.toUpperCase() || 'U'}
                        </button>

                        {showProfileMenu && (
                            <div className="user-profile-dropdown">
                                <div className="user-profile-header">
                                    <div className="user-profile-avatar">
                                        {(user?.userName || user?.username)?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="user-profile-info">
                                        <div className="user-profile-name">{user?.userName || user?.username}</div>
                                        <div className="user-profile-role">{user?.role || 'USER'}</div>
                                    </div>
                                </div>
                                <div className="user-profile-divider"></div>
                                <button onClick={handleLogout} className="user-profile-logout">
                                    Logout
                                </button>
                            </div>
                        )}

                        <button type="button" onClick={handleLogout} className="user-logout-btn">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="user-main">
                <div className="user-content">{children}</div>
            </main>
        </div>
    )
}

export default UserLayout
