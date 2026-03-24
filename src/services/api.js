//src/services/api.js
import axios from 'axios'

// 📌 VITE_API_URL se define en .env
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true
})

export default api