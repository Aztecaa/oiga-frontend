//user.js
// 📌 Store de ejemplo: maneja lista de usuarios
// 👉 Lo podés eliminar sin afectar la app base si no vas a usar usuarios

import { defineStore } from 'pinia'
import router from '../router'
import api from '../services/api'

export const useUserStore = defineStore('user', {
    state: () => ({
        user: JSON.parse(localStorage.getItem('user')) || null,       // { username, role }
        users: [],         // lista de usuarios (ejemplo)
        loading: false,    // estado de carga
        error: null        // errores de login/fetch
    }),
    actions: {
        // 🔗 Traer lista de usuarios (ejemplo, podés borrar si no lo usás)
        async fetchUsers() {
            this.loading = true
            this.error = null
            try {
                const { data } = await api.get('/users', { withCredentials: true })
                this.users = data
            } catch (err) {
                console.error('Error al traer usuarios:', err)
                this.error = 'No se pudieron cargar los usuarios'
            } finally {
                this.loading = false
            }
        },

        // 🔗 Login
        async login(username, password) {
            try {
                const { data } = await api.post(
                    '/auth/login',
                    { username, password },
                    { withCredentials: true }
                )

                this.user = { username, role: data.role }

                // 🔑 Guardamos sesión en localStorage
                localStorage.setItem('user', JSON.stringify(this.user))

                return true
            } catch (err) {
                console.error('Login fallido:', err)
                return false
            }
        },

        // 🔗 Logout
        async logout() {
            try {
                await api.get('/auth/logout', { withCredentials: true })
            } catch (err) {
                console.error('Error al cerrar sesión en backend:', err)
            } finally {
                this.user = null
                localStorage.removeItem('user') // 🔑 Borra sesión guardada
                router.push('/') // 👈 redirige a la raíz
            }
        }
    },
    getters: {
        // Sabe si hay usuario logueado
        isLogged: (state) => !!state.user,
        // Devuelve el rol o null si no hay usuario
        role: (state) => state.user?.role || null
    }
})