//src/store/stock.js
import { defineStore } from "pinia"
import api from "../services/api"

export const useStockStore = defineStore("stock", {

  state: () => ({
    productos: [],
    categorias: ["bebidas", "chocolates", "cigarrillos", "caramelos", "gomitas", "chicles", "accesorios", "tecnologia"]
  }),

  actions: {
    async cargarStock() {
      const { data } = await api.get("/productos")
      this.productos = data
    },

    async agregarProducto(data) {

      const { data: res } = await api.post("/productos", data)
      this.productos = res
    },
    async editarLote(data) {
      console.log(data)
      const { data: res } = await api.put(`/productos/${data.codigo}/lote`, data)
      this.productos = res
    },

    async eliminarProducto(codigo) {
      const { data } = await api.delete(`/productos/${codigo}`)
      this.productos = data
    },
    async eliminarLote(codigo, numero) {
      const { data } = await api.delete(`/productos/${codigo}/lote/${numero}`)
      this.productos = data
    },
    agregarCategoria(nombre) {
      if (!this.categorias.includes(nombre)) {
        this.categorias.push(nombre)
      }
    },

    eliminarCategoria(nombre) {
      this.categorias = this.categorias.filter(c => c !== nombre)
    },
    async editarProducto(codigo, body) {
      const { data } = await api.put(`/productos/${codigo}`, body)
      this.productos = data
    }

  }

})