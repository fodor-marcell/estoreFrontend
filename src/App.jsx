// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import AdminLogin from './components/Admin-page/AdminLogin.jsx'
import AdminDashboard from './components/Admin-page/AdminDashboard.jsx'
import AdminProducts from './components/Admin-page/AdminProducts.jsx'
import AdminUsers from './components/Admin-page/AdminUsers.jsx'
import AdminOrders from './components/Admin-page/AdminOrders.jsx'
import AdminSettings from './components/Admin-page/AdminSettings.jsx'
import AdminProtectedRoute from './components/Admin-page/AdminProtectedRoute.jsx'
import LoginRegister from './components/Auth/LoginRegister.jsx';
import UserOrders from './components/User-page/UserOrders.jsx';
import UserDashboard from './components/User-page/UserDashboard.jsx';
import UserHome from './components/User-page/UserHome.jsx';
import UserHomeLoggedIn from './components/User-page/UserHomeLoggedIn.jsx';
import Checkout from './components/User-page/Checkout.jsx';
import PaymentMock from './components/User-page/PaymentMock.jsx';

function UserProtectedRoute({ children }) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/user-login" />;
    const role = String(user.role || '').toUpperCase();
    if (role === 'ADMIN') return <Navigate to="/dashboard" />;
    return children;
}

function AppRoutes() {
    return (
        <Routes>
            {/* Public user storefront */}
            <Route path="/" element={<UserHome />} />
            <Route path="/home" element={<UserHomeLoggedIn />} />

            {/* Checkout + payment */}
            <Route path="/user/checkout" element={<Checkout />} />
            <Route path="/user/payment/:id" element={<PaymentMock />} />

            {/* Admin routes */}
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/dashboard" element={
                <AdminProtectedRoute>
                    <AdminDashboard />
                </AdminProtectedRoute>
            } />
            <Route path="/products" element={
                <AdminProtectedRoute>
                    <AdminProducts />
                </AdminProtectedRoute>
            } />
            <Route path="/users" element={
                <AdminProtectedRoute>
                    <AdminUsers />
                </AdminProtectedRoute>
            } />
            <Route path="/orders" element={
                <AdminProtectedRoute>
                    <AdminOrders />
                </AdminProtectedRoute>
            } />
            <Route path="/settings" element={
                <AdminProtectedRoute>
                    <AdminSettings />
                </AdminProtectedRoute>
            } />

            {/* User auth */}
            <Route path="/user-login" element={<LoginRegister onSuccessRedirectTo="/home" />} />

            {/* User routes (orders require login) */}
            <Route path="/user/orders" element={
                <UserProtectedRoute>
                    <UserOrders />
                </UserProtectedRoute>
            } />

            {/* Optional: keep these for now, but they are not required to access the user storefront */}
            <Route path="/user/dashboard" element={
                <UserProtectedRoute>
                    <UserDashboard />
                </UserProtectedRoute>
            } />
            <Route path="/user" element={<Navigate to="/" />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App