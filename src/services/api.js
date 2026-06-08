import axios from 'axios'

const getBaseURL = () => {
    // Fejlesztésben is használd a backend URL-t
    if (import.meta.env.DEV) {
        return import.meta.env.VITE_API_URL || 'http://localhost:8080'
    }
    return import.meta.env.VITE_API_URL || ''
}

const api = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
})

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        console.log('Full URL:', config.baseURL + config.url)
        return config
    },
    (error) => Promise.reject(error)
)

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const token = localStorage.getItem('token')
        if (error.response?.status === 401 && token) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/admin-login'
        }
        return Promise.reject(error)
    }
)

export default api