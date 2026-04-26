import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'https://minecraft.karaya.site/api' : '/api'),
});

// Interceptor to add auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
