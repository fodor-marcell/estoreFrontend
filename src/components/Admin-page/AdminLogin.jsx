import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import '../../css/Admin-page/Login.css'

function AdminLogin() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { user, login } = useAuth()

    useEffect(() => {
        const role = String(user?.role || '').toUpperCase()
        if (user && role === 'ADMIN') {
            navigate('/dashboard', { replace: true })
        }
    }, [user, navigate])

    const handleSubmit = async (e) => {
        // Teljesen megakadályozzuk az alapértelmezett működést
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }

        // Ha nincs username vagy password, ne csináljon semmit
        if (!username || !password) {
            setError('Please enter username and password')
            return
        }

        setError('')
        setLoading(true)

        try {
            // Use AuthContext login so user state updates immediately (no reload needed)
            const res = await login(username, password)
            if (!res?.success) {
                setError(res?.message || 'Invalid username or password')
                setLoading(false)
                return
            }

            // Read the user that AuthContext persisted
            const raw = localStorage.getItem('user')
            const u = raw ? JSON.parse(raw) : null
            const role = String(u?.role || '').toUpperCase()
            if (role !== 'ADMIN') {
                // Don't keep non-admin session when using the admin login
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                setError('Access Denied! Only ADMIN users can log in.')
                setLoading(false)
                return
            }

            navigate('/dashboard', { replace: true })
        } catch (err) {
            console.error('AdminLogin error:', err)
            setError(err?.response?.data?.message || err?.message || 'Invalid username or password')
            setLoading(false)
        }
    }

    return (
        <div className="login-wrapper">
            <div className="login-card">
                <div className="login-header">
                    <h1>Admin Login</h1>
                    <p>Please sign in to continue</p>
                </div>

                {error && (
                    <div className="error-message">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label>Username</label>
                        <div className="input-icon">
                            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <div className="input-icon">
                            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="login-button">
                        {loading ? <span className="spinner"></span> : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default AdminLogin