<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useStockStore } from "../store/stock";
import { usePanelStore } from "../store/panel";

const stock = useStockStore();
const panel = usePanelStore();

const modal = ref(false);
const modalLotes = ref(false);
const modalBuscar = ref(false);

const modo = ref("crear");
const inputNombreRef = ref(null);
const inputLoteRef = ref(null);

const codigo = ref("");
const nombre = ref("");
const categoria = ref("");
const fechaVencimiento = ref("");
const numeroLote = ref("");
const cantidad = ref(0);

const productoSeleccionado = ref(null);

const busquedaModal = ref("");
const busqueda = ref("");
const categoriaFiltro = ref("");

const scanInput = ref("");

onMounted(() => {
  stock.cargarStock();
});

const productoExistente = computed(() =>
  stock.productos.some((p) => p.codigo === codigo.value),
);

const resultadosBusqueda = computed(() => {
  const texto = busquedaModal.value.toLowerCase();

  if (!texto) return stock.productos;

  return stock.productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(texto) ||
      p.codigo.toLowerCase().includes(texto),
  );
});

const productosFiltrados = computed(() => {
  return stock.productos.filter((p) => {
    const texto = busqueda.value.toLowerCase();

    const coincideBusqueda =
      p.nombre.toLowerCase().includes(texto) ||
      p.codigo.toLowerCase().includes(texto);

    const coincideCategoria =
      !categoriaFiltro.value || p.categoria === categoriaFiltro.value;

    return coincideBusqueda && coincideCategoria;
  });
});

function abrirCrear() {
  modo.value = "crear";
  modal.value = true;
}

function abrirEditar(p) {
  modo.value = "editar";

  nombre.value = p.nombre;
  codigo.value = p.codigo;
  categoria.value = p.categoria || "";

  const lote = p.lotes?.[0];

  numeroLote.value = lote?.numero || "";
  cantidad.value = lote?.cantidad || 0;
  fechaVencimiento.value = lote?.fechaVencimiento || "";

  modal.value = true;
}

function abrirLotes(p) {
  productoSeleccionado.value = p;
  modalLotes.value = true;
}

function cerrar() {
  modal.value = false;
  nombre.value = "";
  codigo.value = "";
}

async function escanear() {
  const input = scanInput.value;
  const producto = stock.productos.find((p) => p.codigo === input);

  if (producto) {
    modo.value = "crear";

    codigo.value = producto.codigo;
    nombre.value = producto.nombre;
    categoria.value = producto.categoria || "";

    numeroLote.value = "";
    cantidad.value = 0;
    fechaVencimiento.value = "";
  } else {
    codigo.value = input;
    nombre.value = "";
    categoria.value = "";
  }

  modal.value = true;
  scanInput.value = "";

  await nextTick();

  if (producto) {
    inputLoteRef.value?.focus();
  } else {
    inputNombreRef.value?.focus();
  }
}

async function guardar() {
  if (modo.value === "crear") {
    await stock.agregarProducto({
      nombre: nombre.value,
      codigo: codigo.value,
      cantidad: cantidad.value,
      categoria: categoria.value,
      fechaVencimiento: fechaVencimiento.value,
      numeroLote: numeroLote.value,
    });
    scanInput.value = null;
  } else {
    await stock.editarProducto(codigo.value, {
      nombre: nombre.value,
    });
  }

  cerrar();
}

async function eliminar(codigo) {
  await stock.eliminarProducto(codigo);
}

async function eliminarLote(codigo, numero) {
  await stock.eliminarLote(codigo, numero);

  const actualizado = stock.productos.find((p) => p.codigo === codigo);
  productoSeleccionado.value = actualizado;
}

function seleccionarProducto(p) {
  modalBuscar.value = false;
  abrirEditar(p);
}

function estadoLote(fecha) {
  if (!fecha) return "sin";

  const hoy = new Date();
  const vencimiento = new Date(fecha);
  const diff = (vencimiento - hoy) / (1000 * 60 * 60 * 24);

  const config = panel.config.stock.vencimientos;

  if (diff < config.rojo) return "rojo";
  if (diff < config.amarillo) return "amarillo";
  if (diff >= config.verde) return "verde";

  return "amarillo";
}

function claseLote(estado) {
  if (estado === "rojo") return "bg-red-300 text-red-900";
  if (estado === "amarillo") return "bg-yellow-200 text-yellow-800";
  if (estado === "verde") return "bg-green-200 text-green-800";
  return "bg-gray-200";
}

function exportarExcel() {
  const filas = [];

  stock.productos.forEach((p) => {
    if (!p.lotes || p.lotes.length === 0) {
      filas.push({
        codigo: p.codigo,
        nombre: p.nombre,
        categoria: p.categoria || "",
        lote: "",
        cantidad: "",
        vencimiento: "",
      });
    } else {
      p.lotes.forEach((l) => {
        filas.push({
          codigo: p.codigo,
          nombre: p.nombre,
          categoria: p.categoria || "",
          lote: l.numero,
          cantidad: l.cantidad,
          vencimiento: l.fechaVencimiento,
        });
      });
    }
  });

  const headers = [
    "codigo",
    "nombre",
    "categoria",
    "lote",
    "cantidad",
    "vencimiento",
  ];

  const csv = [
    headers.join(","),
    ...filas.map((f) => headers.map((h) => f[h]).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "stock_completo.csv";
  a.click();
}
</script>
0

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- escaner -->

    <div class="flex gap-2">
      <input
        class="p-1"
        v-model="scanInput"
        placeholder="escanear codigo"
        @keyup.enter="escanear"
      />
      <button @click="modalBuscar = true">Buscar</button>

      <select v-model="categoria">
        <option disabled value="">Seleccionar categoría</option>
        <option v-for="c in stock.categorias" :key="c" :value="c">
          {{ c }}
        </option>
      </select>

      <button @click="abrirCrear">Agregar producto</button>

      <button @click="exportarExcel">Exportar Excel</button>
    </div>

    <!-- tabla -->

    <table class="w-full p-1 border">
      <thead>
        <tr>
          <th v-if="panel.config.stock.columnas.codigo">codigo</th>
          <th v-if="panel.config.stock.columnas.nombre">nombre</th>
          <th v-if="panel.config.stock.columnas.lotes">lotes</th>
          <th v-if="panel.config.stock.columnas.cantidad">cantidad</th>
          <th v-if="panel.config.stock.columnas.categoria">categoria</th>
          <th v-if="panel.config.stock.columnas.acciones">acciones</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="p in productosFiltrados" :key="p.codigo">
          <td v-if="panel.config.stock.columnas.codigo">{{ p.codigo }}</td>
          <td v-if="panel.config.stock.columnas.nombre">{{ p.nombre }}</td>
          <td
            v-if="panel.config.stock.columnas.lotes"
            class="cursor-pointer hover:bg-gray-100"
            @click="abrirLotes(p)"
          >
            <div class="flex gap-1">
              <span
                v-for="(l, i) in p.lotes"
                :key="i"
                :class="[
                  'px-2 rounded text-xs',
                  claseLote(estadoLote(l.fechaVencimiento)),
                ]"
              >
                L{{ l.numero }}
              </span>
            </div>
          </td>
          <td v-if="panel.config.stock.columnas.categoria">
            {{ p.categoria }}
          </td>

          <td class="flex gap-2">
            <button @click="abrirEditar(p)">editar</button>

            <button @click="eliminar(p.codigo)">eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- modal -->
    <div
      v-if="modalLotes"
      class="fixed inset-0 bg-black/50 flex items-center justify-center"
    >
      <div class="bg-white p-6 space-y-4 w-96">
        <h3>Lotes de {{ productoSeleccionado?.nombre }}</h3>

        <div class="space-y-2">
          <div
            v-for="(l, i) in productoSeleccionado?.lotes"
            :key="i"
            :class="[
              'border p-2 flex justify-between items-center',
              claseLote(estadoLote(l.fechaVencimiento)),
            ]"
          >
            <div>
              <div><strong>Lote:</strong> {{ l.numero }}</div>
              <div><strong>Cant:</strong> {{ l.cantidad }}</div>
              <div><strong>Vence:</strong> {{ l.fechaVencimiento }}</div>
            </div>

            <button
              class="text-red-500"
              @click="eliminarLote(productoSeleccionado.codigo, l.numero)"
            >
              eliminar
            </button>
          </div>
        </div>

        <button @click="modalLotes = false">Cerrar</button>
      </div>
    </div>

    <div
      v-if="modal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center"
    >
      <div class="bg-white p-6 space-y-4 w-80">
        <h3>
          {{ modo === "crear" ? "Nuevo producto" : "Editar producto" }}
        </h3>

        <form @submit.prevent="guardar">
          <input
            class="p-1"
            v-model="codigo"
            placeholder="codigo"
            :disabled="productoExistente"
            required
          />

          <input
            ref="inputNombreRef"
            class="p-1"
            v-model="nombre"
            placeholder="nombre"
            :disabled="productoExistente"
            required
          />

          <input ref="inputLoteRef" class="p-1" v-model="numeroLote" placeholder="lote" />

          <input
            class="p-1"
            type="number"
            v-model="cantidad"
            placeholder="cantidad"
          />

          <input class="p-1" type="date" v-model="fechaVencimiento" />

          <select class="p-1" v-model="categoria" :disabled="productoExistente">
            <option value="">Todas las categorías</option>
            <option v-for="c in stock.categorias" :key="c" :value="c">
              {{ c }}
            </option>
          </select>

          <div class="flex gap-2">
            <button type="submit">guardar</button>

            <button type="button" @click="cerrar">cancelar</button>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="modalBuscar"
      class="fixed inset-0 bg-black/50 flex items-center justify-center"
    >
      <div class="bg-white p-6 space-y-4 w-96">
        <h3>Buscar producto</h3>

        <input
          v-model="busquedaModal"
          placeholder="Buscar por código o nombre"
          class="w-full border px-2"
        />

        <div class="max-h-60 overflow-y-auto border">
          <div
            v-for="p in resultadosBusqueda"
            :key="p.codigo"
            class="p-2 hover:bg-gray-100 cursor-pointer"
            @click="seleccionarProducto(p)"
          >
            <div class="font-bold">{{ p.nombre }}</div>
            <div class="text-sm text-gray-500">{{ p.codigo }}</div>
          </div>
        </div>

        <button @click="modalBuscar = false">Cerrar</button>
      </div>
    </div>
  </div>
</template>
