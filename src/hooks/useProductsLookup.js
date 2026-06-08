import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'

export default function useProductsLookup() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/public/getAllProducts')
        setProducts(Array.isArray(res.data) ? res.data : [])
      } catch {
        setProducts([])
      }
    }

    load()
  }, [])

  const productsById = useMemo(() => {
    const m = new Map()
    products.forEach((p) => m.set(Number(p.id), p))
    return m
  }, [products])

  return { products, productsById }
}

