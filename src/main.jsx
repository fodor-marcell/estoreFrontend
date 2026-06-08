import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log('=== ENV VARS ===')
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL)
console.log('All env:', import.meta.env)

createRoot(document.getElementById('root')).render(
    <App />
)