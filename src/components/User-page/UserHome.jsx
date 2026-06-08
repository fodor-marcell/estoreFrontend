import { useEffect } from 'react'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Navigate } from 'react-router-dom'
import GuestHome from './GuestHome.jsx'

function UserHome() {
    const { user, logout } = useAuth()

    // If an ADMIN user lands on the public storefront, log them out to avoid
    // the admin session "sticking" while browsing the user side.
    useEffect(() => {
        const role = String(user?.role || '').toUpperCase()
        if (user && role === 'ADMIN') {
            logout?.()
        }
    }, [user, logout])

    const role = String(user?.role || '').toUpperCase()
    if (user && role !== 'ADMIN') {
        return <Navigate to="/home" replace />
    }

    return <GuestHome />
}

export default UserHome
