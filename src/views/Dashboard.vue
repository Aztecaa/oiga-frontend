<script setup>
import { computed } from "vue";
import { useStockStore } from "../store/stock";
import { usePanelStore } from "../store/panel";

const stock = useStockStore();
const panel = usePanelStore();

// calcular días restantes
function diasRestantes(fecha) {
  const hoy = new Date();
  const vencimiento = new Date(fecha);

  return (vencimiento - hoy) / (1000 * 60 * 60 * 24);
}

// total por producto
function totalCantidad(p) {
  return p.lotes.reduce((acc, l) => acc + l.cantidad, 0);
}

// 🔴 fecha corta
const fechaCorta = computed(() => {
  const limite = panel.config.stock.vencimientos.rojo;

  return stock.productos.filter((p) =>
    p.lotes.some((l) => diasRestantes(l.fechaVencimiento) < limite),
  );
});

// 🟡 fecha próxima
const fechaProxima = computed(() => {
  const { rojo, amarillo } = panel.config.stock.vencimientos;

  return stock.productos.filter((p) =>
    p.lotes.some((l) => {
      const d = diasRestantes(l.fechaVencimiento);
      return d >= rojo && d < amarillo;
    }),
  );
});

// abrir detalle (reutilizamos tu modal)
import { ref } from "vue";

const productoSeleccionado = ref(null);
const modal = ref(false);

function verDetalle(p) {
  productoSeleccionado.value = p;
  modal.value = true;
}
</script>

<template>
  <div class="max-w-6xl mx-auto grid grid-cols-2 gap-6">
    <!-- 🔴 FECHA CORTA -->
    <div class="bg-red-100 p-4 rounded">
      <h2 class="font-bold text-red-700 mb-2">Fecha corta</h2>

      <div
        v-for="p in fechaCorta"
        :key="p.codigo"
        class="flex justify-between border-b py-1"
      >
        <span class="cursor-pointer underline" @click="verDetalle(p)">
          {{ p.nombre }}
        </span>

        <span>{{ totalCantidad(p) }}</span>
      </div>
    </div>

    <!-- 🟡 FECHA PRÓXIMA -->
    <div class="bg-yellow-100 p-4 rounded">
      <h2 class="font-bold text-yellow-700 mb-2">Fecha próxima</h2>

      <div
        v-for="p in fechaProxima"
        :key="p.codigo"
        class="flex justify-between border-b py-1"
      >
        <span class="cursor-pointer underline" @click="verDetalle(p)">
          {{ p.nombre }}
        </span>

        <span>{{ totalCantidad(p) }}</span>
      </div>
    </div>
  </div>

  <!-- MODAL DETALLE -->
  <div
    v-if="modal"
    class="fixed inset-0 bg-black/50 flex items-center justify-center"
  >
    <div class="bg-white p-6 w-96 space-y-3">
      <h3>{{ productoSeleccionado?.nombre }}</h3>

      <div v-for="l in productoSeleccionado?.lotes" :key="l.numero">
        <div>Lote: {{ l.numero }}</div>
        <div>Cantidad: {{ l.cantidad }}</div>
        <div>Vence: {{ l.fechaVencimiento }}</div>
      </div>

      <button @click="modal = false">Cerrar</button>
    </div>
  </div>
</template>
