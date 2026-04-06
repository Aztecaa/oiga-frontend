/* src/componets/Panel.vue */
<script setup>
import { usePanelStore } from "../store/panel";
import { ref } from "vue";
import { useStockStore } from "../store/stock";

const panel = usePanelStore();

const stock = useStockStore();
const nuevaCategoria = ref("");

function agregarCategoria() {
  if (!nuevaCategoria.value.trim()) return;

  stock.agregarCategoria(nuevaCategoria.value);
  nuevaCategoria.value = ""; // 👈 limpiar input
}
</script>

<template>
  <div class="fixed inset-0 bg-black/50 flex justify-end">
    <div class="bg-white p-4 space-y-4">
      <button @click="panel.cerrar()">❌</button>

      <!-- STOCK -->
      <div class="flex flex-col gap-3" v-if="panel.contexto === 'stock'">
        <h3 class="font-bold text-lg">Configuración de Stock</h3>

        <div>
          <h4 class="font-bold">Semáforo de vencimientos</h4>

          <label>
            Fecha corta:
            <input class="w-11 p-1"
              type="number"
              v-model="panel.config.stock.vencimientos.rojo"
              @change="panel.guardarConfig()"
            />
          </label>

          <label>
            Amarillo
            <input class="w-11 p-1"
              type="number"
              v-model="panel.config.stock.vencimientos.amarillo"
              @change="panel.guardarConfig()"
            />
          </label>

          <label>
            Verde
            <input class="w-11 p-1"
              type="number"
              v-model="panel.config.stock.vencimientos.verde"
              @change="panel.guardarConfig()"
            />
          </label>
        </div>

        <div>
          <h4 class="font-bold">Categorías</h4>
          <div
            v-for="c in stock.categorias"
            :key="c"
            class="flex justify-between"
          >
            <span>{{ c }}</span>
            <button @click="stock.eliminarCategoria(c)">❌</button>
          </div>

          <input v-model="nuevaCategoria" placeholder="Nueva categoría" />
          <button @click="agregarCategoria">
            Agregar
          </button>
        </div>

        <div>
          <h4 class="font-semibold">Columnas visibles</h4>

          <div class="flex gap-2 space-y-1">
            <label v-for="(v, key) in panel.config.stock.columnas" :key="key">
              <input
                type="checkbox"
                :checked="v"
                @change="panel.toggleColumna(key)"
              />
              {{ key }}
            </label>
          </div>
        </div>
      </div>

      <!-- VENTAS -->
      <div v-else-if="panel.contexto === 'ventas'">
        <h3>Configuración de Ventas</h3>
      </div>
    </div>
  </div>
</template>
