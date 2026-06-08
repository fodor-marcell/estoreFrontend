import { Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'

function AdminProtectedRoute({ children }) {
    const { user } = useAuth()

    // AuthContext hydrates from localStorage; don't gate on token separately or you'll get redirect loops.
    if (!user) {
        return <Navigate to="/admin-login" replace />
    }

    const role = String(user.role || '').toUpperCase()
    if (role !== 'ADMIN') {
        return <Navigate to="/" replace />
    }

    return children
}

export default AdminProtectedRoute