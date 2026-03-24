//../router/index.js

import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store/user'

const routes = [
    { path: '/', component: () => import('../views/Stock.vue') },
    { path: '/login', component: () => import('../components/Login.vue') },
    { path: '/dashboard', component: () => import('../views/Dashboard.vue'), meta: { requiresAuth: true } },
    {
        path: '/users', component: () => import('../views/Users.vue'), meta: { requiresAuth: true, roles: 'supervisor' }  // 🔗 Marcamos ruta protegida 
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// # Middleware de navegación
router.beforeEach((to, from, next) => {
    const userStore = useUserStore()

    if (to.meta.requiresAuth && !userStore.user) {
        return next('/login')
    }

    if (to.path === '/login' && userStore.user) {
        return next('/dashboard')
    }

    // 🔹 Si la ruta tiene roles y el rol del usuario no está incluido → redirige
    if (to.meta.roles && !to.meta.roles.includes(userStore.role)) {
        return next('/dashboard')
    }

    next()
})

export default router