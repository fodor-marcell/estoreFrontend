import { useEffect, useMemo } from 'react'
import '../../css/User-page/CartDrawer.css'

function CartDrawer({ open, items, productsById, onClose, onRemove, onClear, onCheckout }) {
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.()
        }
        if (open) document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [open, onClose])

    const rows = useMemo(() => {
        return Object.entries(items || {})
            .map(([id, qty]) => ({
                id: Number(id),
                qty: Number(qty || 0)
            }))
            .filter(r => Number.isFinite(r.id) && r.qty > 0)
    }, [items])

    const total = useMemo(() => {
        return rows.reduce((sum, r) => {
            const p = productsById?.get?.(r.id)
            return sum + Number(p?.price || 0) * r.qty
        }, 0)
    }, [rows, productsById])

    if (!open) return null

    return (
        <div className="cart-overlay" onClick={onClose}>
            <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
                <div className="cart-header">
                    <div className="cart-title">Shopping Cart</div>
                    <button className="cart-close" type="button" onClick={onClose}>×</button>
                </div>

                {rows.length === 0 ? (
                    <div className="cart-empty">Your cart is empty.</div>
                ) : (
                    <>
                        <div className="cart-items">
                            {rows.map((r) => {
                                const p = productsById?.get?.(r.id)
                                const name = p?.name || `Product #${r.id}`
                                const imageUrl = p?.imageUrl
                                const price = Number(p?.price || 0)
                                return (
                                    <div key={r.id} className="cart-item">
                                        <div className="cart-item-img">
                                            {imageUrl ? <img src={imageUrl} alt={name} /> : <div className="cart-item-img--ph">No image</div>}
                                        </div>
                                        <div className="cart-item-mid">
                                            <div className="cart-item-name" title={name}>{name}</div>
                                            <div className="cart-item-meta">
                                                Qty: <strong>{r.qty}</strong>{price ? <> · Unit: <strong>{price}</strong></> : null}
                                            </div>
                                        </div>
                                        <div className="cart-item-right">
                                            <div className="cart-item-sub">{price ? (price * r.qty) : '-'}</div>
                                            <button className="cart-item-remove" type="button" onClick={() => onRemove?.(r.id)}>
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="cart-footer">
                            <div className="cart-total">
                                <span>Total:</span>
                                <strong>{total || '-'}</strong>
                            </div>
                            <div className="cart-actions">
                                <button type="button" className="cart-clear" onClick={onClear}>Clear cart</button>
                                <button type="button" className="cart-checkout" onClick={onCheckout}>Proceed to checkout</button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default CartDrawer
