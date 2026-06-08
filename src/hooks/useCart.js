import { useCallback, useEffect, useMemo, useState } from 'react'

const readCart = () => {
  try {
    return JSON.parse(localStorage.getItem('cart') || '{}')
  } catch {
    return {}
  }
}

export default function useCart() {
  const [cart, setCart] = useState(() => readCart())

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== 'cart') return
      setCart(readCart())
    }

    const onCartEvent = () => setCart(readCart())

    window.addEventListener('storage', onStorage)
    window.addEventListener('cart:changed', onCartEvent)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('cart:changed', onCartEvent)
    }
  }, [])

  const persist = useCallback((next) => {
    setCart(next)
    localStorage.setItem('cart', JSON.stringify(next))
    window.dispatchEvent(new Event('cart:changed'))
  }, [])

  const add = useCallback((productId, qty = 1) => {
    const id = Number(productId)
    const q = Number(qty)
    if (!Number.isFinite(id) || !Number.isFinite(q) || q <= 0) return
    const next = { ...readCart() }
    next[String(id)] = Number(next[String(id)] || 0) + q
    persist(next)
  }, [persist])

  const remove = useCallback((productId) => {
    const next = { ...readCart() }
    delete next[String(productId)]
    persist(next)
  }, [persist])

  const clear = useCallback(() => {
    persist({})
  }, [persist])

  const count = useMemo(() => {
    return Object.values(cart || {}).reduce((s, q) => s + Number(q || 0), 0)
  }, [cart])

  return { cart, setCart: persist, add, remove, clear, count }
}

