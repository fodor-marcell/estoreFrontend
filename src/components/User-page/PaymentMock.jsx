import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'
import UserTopNav from './UserTopNav.jsx'
import '../../css/User-page/PaymentMock.css'

function PaymentMock() {
    const { id } = useParams()
    const navigate = useNavigate()

    const orderId = useMemo(() => Number(id), [id])

    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const callUpdate = async (paymentStatus) => {
        if (!Number.isFinite(orderId) || orderId <= 0) {
            setError('Invalid order id')
            return
        }

        try {
            setLoading(true)
            setError('')
            setMessage('')

            await api.put(`/public/updatePaymentStatus/${orderId}/${paymentStatus}`)

            if (paymentStatus) {
                localStorage.removeItem('cart')
                setMessage('Payment successful. Your order is paid!')
            } else {
                setMessage('Payment failed. You can try again.')
            }
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to update payment status')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="payment-page">
            <UserTopNav search="" onSearchChange={() => {}} />

            <div className="payment-main">
                <div className="payment-inner">
                    <div className="payment-card">
                        <h1>Mock Payment</h1>
                        <p>Order <strong>#{orderId}</strong></p>

                        {error && <div className="payment-error">{error}</div>}
                        {message && <div className="payment-message">{message}</div>}

                        <div className="payment-actions">
                            <button type="button" className="pay-success" onClick={() => callUpdate(true)} disabled={loading}>
                                {loading ? 'Processing...' : 'Pay (success)'}
                            </button>
                            <button type="button" className="pay-fail" onClick={() => callUpdate(false)} disabled={loading}>
                                {loading ? 'Processing...' : 'Pay (fail)'}
                            </button>
                        </div>

                        <div className="payment-footer">
                            <Link to="/" className="payment-link">Back to products</Link>
                            <button type="button" className="payment-link" onClick={() => navigate('/user/orders')}>
                                Go to Your Orders
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PaymentMock

