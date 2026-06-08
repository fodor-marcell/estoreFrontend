import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout.jsx'
import api from '../../services/api.js'
import '../../css/Admin-page/Users.css'

function AdminUsers() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [toast, setToast] = useState({ show: false, message: '', type: '' })

    useEffect(() => {
        fetchUsers()
    }, [])

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type })
        setTimeout(() => {
            setToast({ show: false, message: '', type: '' })
        }, 3000)
    }

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const response = await api.get('/admin/getAllUsers')
            setUsers(response.data)
            setError(null)
        } catch (err) {
            console.error('Error fetching users:', err)
            setError(err.response?.data?.message || 'Failed to load users')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (username) => {
        if (window.confirm(`Are you sure you want to delete user "${username}"?`)) {
            try {
                await api.delete(`/admin/deleteUserByUsername/${username}`)
                fetchUsers()
                showToast('User deleted successfully!', 'success')
            } catch (err) {
                console.error('Error deleting user:', err)
                showToast(err.response?.data || 'Failed to delete user', 'error')
            }
        }
    }

    if (loading) {
        return (
            <AdminLayout>
                <div className="users-loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading users...</p>
                </div>
            </AdminLayout>
        )
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="users-error-container">
                    <div className="error-icon">⚠️</div>
                    <h3>Error loading users</h3>
                    <p>{error}</p>
                    <button onClick={fetchUsers} className="retry-btn">Try Again</button>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <div className="users-content">
                {/* Toast Notification */}
                {toast.show && (
                    <div className={`toast-notification ${toast.type}`}>
                        <span className="toast-message">{toast.message}</span>
                        <button className="toast-close" onClick={() => setToast({ show: false, message: '', type: '' })}>×</button>
                    </div>
                )}

                {/* Stats */}
                <div className="users-stats">
                    <div className="stat-box">
                        <h3>{users.length}</h3>
                        <p>Total Users</p>
                    </div>
                    <div className="stat-box">
                        <h3>{users.filter(u => u.role === 'ADMIN').length}</h3>
                        <p>Admins</p>
                    </div>
                    <div className="stat-box">
                        <h3>{users.filter(u => u.role === 'USER').length}</h3>
                        <p>Regular Users</p>
                    </div>
                </div>

                {/* AdminUsers Table */}
                <div className="users-table-container">
                    <table className="users-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>{user.userName}</td>
                                <td>{user.email}</td>
                                <td>
                                        <span className={`role-badge ${user.role === 'ADMIN' ? 'admin' : 'user'}`}>
                                            {user.role || 'USER'}
                                        </span>
                                </td>
                                <td>
                                    <button
                                        className="delete-user-btn"
                                        onClick={() => handleDelete(user.userName)}
                                        disabled={user.userName === 'admin'}
                                        title={user.userName === 'admin' ? 'Cannot delete admin user' : 'Delete user'}
                                    >
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    )
}

export default AdminUsers