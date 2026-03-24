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
                    acciones: true
                },

                // 🔴 ESTO FALTABA
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
        }
    },
})