import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import UserTopNav from './UserTopNav.jsx'
import '../../css/User-page/Checkout.css'

function Checkout() {
    const navigate = useNavigate()

    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const cart = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('cart') || '{}')
        } catch {
            return {}
        }
    }, [])

    const rows = useMemo(() => {
        return Object.entries(cart)
            .map(([id, qty]) => ({ id: Number(id), qty: Number(qty || 0) }))
            .filter(r => Number.isFinite(r.id) && r.qty > 0)
    }, [cart])

    const placeOrder = async () => {
        setError('')

        let user = null
        try {
            const raw = localStorage.getItem('user')
            user = raw ? JSON.parse(raw) : null
        } catch {
            user = null
        }

        // tolerate different payload shapes
        const userIdMaybe = user?.id ?? user?.userId
        const userId = Number(userIdMaybe)

        if (!Number.isFinite(userId) || userId <= 0) {
            navigate('/user-login', { state: { mode: 'login' } })
            return
        }

        if (rows.length === 0) {
            setError('Your cart is empty.')
            return
        }

        const products = Object.fromEntries(rows.map(r => [r.id, r.qty]))

        try {
            setSubmitting(true)
            const res = await api.post('/public/createOrder', {
                userId,
                status: 'PENDING',
                products
            })

            const createdId = res?.data?.id
            if (!createdId) {
                setError('Order created, but no order ID was returned by the server.')
                return
            }

            navigate(`/user/payment/${createdId}`)
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to create order')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="checkout-page">
            <UserTopNav search="" onSearchChange={() => {}} />

            <div className="checkout-main">
                <div className="checkout-inner">
                    <div className="checkout-card">
                        <h1>Checkout</h1>
                        <p>We’ll create your order, then you can complete a mock payment.</p>

                        {error && <div className="checkout-error">{error}</div>}

                        <div className="checkout-summary">
                            <div><strong>Items:</strong> {rows.reduce((s, r) => s + r.qty, 0)}</div>
                            <div className="checkout-hint">(Total amount is calculated by backend.)</div>
                        </div>

                        <div className="checkout-actions">
                            <Link className="checkout-back" to="/">Back to products</Link>
                            <button className="checkout-primary" type="button" onClick={placeOrder} disabled={submitting}>
                                {submitting ? 'Creating order...' : 'Proceed to payment'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Checkout
