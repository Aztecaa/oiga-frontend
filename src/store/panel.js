// store/panel.js
import { defineStore } from 'pinia'

export const usePanelStore = defineStore('panel', {
    state: () => ({
        abierto: false,
        contexto: null,

        config: {
            stock: {
                columnas: {
                    codigo: true,
                    nombre: true,
                    lotes: true,
                    categoria: true,
                    cantidad: true,
                    acciones: true
                },
                vencimientos: {
                    rojo: 7,
                    amarillo: 30,
                    verde: 60
                }
            }
        }
    }),

    actions: {
        abrir(ctx) {
            this.contexto = ctx
            this.abierto = true
        },

        cerrar() {
            this.abierto = false
        },

        toggleColumna(col) {
            this.config.stock.columnas[col] = !this.config.stock.columnas[col]
            this.guardarConfig()
        },

        guardarConfig() {
            localStorage.setItem('panel_config', JSON.stringify(this.config))
        },

        cargarConfig() {
            const data = localStorage.getItem('panel_config')

            if (data) {
                this.config = JSON.parse(data)
            }
        }
    },
})