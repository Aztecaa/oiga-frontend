<script setup>
//src/views/Stock.vue
import { ref, computed, onMounted, nextTick } from "vue";
import { useStockStore } from "../store/stock";
import { usePanelStore } from "../store/panel";
import * as XLSX from "xlsx";

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
const fecha_vencimiento = ref("");
const numeroLote = ref("");
const cantidad = ref(0);

const productoSeleccionado = ref(null);

const busquedaModal = ref("");
const busqueda = ref("");
const categoriaFiltro = ref("");
const loteEditando = ref(null);

const scanInput = ref("");

onMounted(() => {
  stock.cargarStock();
});

const productoExistente = computed(() =>
  stock.productos.some((p) => p.codigo === codigo.value),
);

function totalProducto(p) {
  if (!p.lotes || p.lotes.length === 0) return 0;

  return p.lotes.reduce((total, l) => total + (l.cantidad || 0), 0);
}

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

  const lote = loteMasProximo(p);

  numeroLote.value = lote?.numero || "";
  cantidad.value = lote?.cantidad || 0;
  fecha_vencimiento.value =
    lote?.fecha_vencimiento || lote?.fecha_vencimiento || "";

  modal.value = true;
}

function editarLote(p, l) {
  modo.value = "editarLote";

  productoSeleccionado.value = p;
  loteEditando.value = l;

  codigo.value = p.codigo;
  nombre.value = p.nombre;
  categoria.value = p.categoria || "";

  numeroLote.value = l.numero;
  cantidad.value = l.cantidad;
  fecha_vencimiento.value = formatearParaInput(l.fecha_vencimiento);

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
    modo.value = "producto";

    codigo.value = producto.codigo;
    nombre.value = producto.nombre;
    categoria.value = producto.categoria || "";
  } else {
    modo.value = "crear";

    codigo.value = input;
    nombre.value = "";
    categoria.value = "";
  }

  // valores comunes
  numeroLote.value = "";
  cantidad.value = 0;
  fecha_vencimiento.value = "";

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
  if (modo.value === "crear" || modo.value === "producto") {
    await stock.agregarProducto({
      nombre: nombre.value,
      codigo: codigo.value,
      cantidad: cantidad.value,
      categoria: categoria.value,
      fechaVencimiento: fecha_vencimiento.value,
      numeroLote: numeroLote.value,
    });
  } else if (modo.value === "editar") {
    await stock.editarProducto(codigo.value, {
      nombre: nombre.value,
    });
  } else if (modo.value === "editarLote") {
    await stock.editarLote({
      codigo: codigo.value,
      numeroOriginal: loteEditando.value.numero,
      cantidad: cantidad.value,
      fechaVencimiento: fecha_vencimiento.value,
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

function loteMasProximo(producto) {
  if (!producto.lotes || producto.lotes.length === 0) return null;

  return [...producto.lotes]
    .filter((l) => l.fecha_vencimiento || l.fecha_vencimiento)
    .sort((a, b) => {
      const fa = new Date(a.fecha_vencimiento || a.fecha_vencimiento);
      const fb = new Date(b.fecha_vencimiento || b.fecha_vencimiento);
      return fa - fb;
    })[0];
}

function formatearParaInput(fecha) {
  if (!fecha) return "";

  return fecha.split("T")[0]; // 👈 clave
}

function formatearFecha(fecha) {
  if (!fecha) return "-";

  const f = new Date(fecha);

  const dia = String(f.getDate()).padStart(2, "0");
  const mes = String(f.getMonth() + 1).padStart(2, "0");
  const anio = String(f.getFullYear()).slice(-2);

  return `${dia}/${mes}/${anio}`;
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
    const total = totalProducto(p);

    if (!p.lotes || p.lotes.length === 0) {
      filas.push({
        Codigo: p.codigo,
        Nombre: p.nombre,
        Categoria: p.categoria || "",
        Lote: "",
        Cantidad: "",
        Total: total,
        Vencimiento: "",
      });
    } else {
      p.lotes.forEach((l) => {
        filas.push({
          Codigo: p.codigo,
          Nombre: p.nombre,
          Categoria: p.categoria || "",
          Lote: l.numero,
          Cantidad: l.cantidad,
          Total: total,
          Vencimiento: l.fecha_vencimiento,
        });
      });
    }
  });

  // Crear hoja
  const worksheet = XLSX.utils.json_to_sheet(filas);

  // Crear libro
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Stock");

  // Descargar
  XLSX.writeFile(workbook, "stock.xlsx");
}
</script>

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

      <select v-model="categoriaFiltro">
        <option value="">Todas</option>
        <option v-for="c in stock.categorias" :key="c" :value="c">
          {{ c }}
        </option>
      </select>

      <button @click="abrirCrear">Agregar producto</button>

      <button @click="exportarExcel">Exportar Excel</button>
    </div>

    <!-- tabla -->

    <table class="w-full border">
      <thead>
        <tr>
          <th v-if="panel.config.stock.columnas.codigo">Codigo</th>
          <th v-if="panel.config.stock.columnas.nombre">Nombre</th>
          <th v-if="panel.config.stock.columnas.lotes">Lotes</th>
          <th v-if="panel.config.stock.columnas.cantidad">Total</th>
          <th v-if="panel.config.stock.columnas.categoria">Categoria</th>
          <th v-if="panel.config.stock.columnas.acciones">Acciones</th>
        </tr>
      </thead>

      <tbody class="aling-center">
        <tr
          v-for="(p, i) in productosFiltrados"
          :key="p.codigo"
          :class="i % 2 === 0 ? 'bg-gray-300' : 'bg-white'"
        >
          <td class="pl-2" v-if="panel.config.stock.columnas.codigo">
            {{ p.codigo }}
          </td>
          <td v-if="panel.config.stock.columnas.nombre">{{ p.nombre }}</td>
          <td
            v-if="panel.config.stock.columnas.lotes"
            class="cursor-pointer"
            @click="abrirLotes(p)"
          >
            <div class="flex gap-1">
              <span
                v-for="(l, i) in p.lotes"
                :key="i"
                :class="[
                  'px-1 rounded text-xs hover:bg-gray-100',
                  claseLote(estadoLote(l.fecha_vencimiento)),
                ]"
              >
                L{{ l.cantidad }}
              </span>
            </div>
          </td>
          <td v-if="panel.config.stock.columnas.cantidad">
            {{ totalProducto(p) }}
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
              claseLote(estadoLote(l.fecha_vencimiento)),
            ]"
          >
            <div>
              <div><strong>Lote:</strong> {{ l.numero }}</div>
              <div><strong>Cant:</strong> {{ l.cantidad }}</div>
              <div>
                <strong>Vence:</strong>
                {{ formatearFecha(l.fecha_vencimiento) }}
              </div>
            </div>

            <div class="flex flex-col gap-1">
              <button
                class="text-blue-500"
                @click="editarLote(productoSeleccionado, l)"
              >
                editar
              </button>

              <button
                class="text-red-500"
                @click="eliminarLote(productoSeleccionado.codigo, l.numero)"
              >
                eliminar
              </button>
            </div>
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
          {{
            modo === "crear"
              ? "Nuevo producto"
              : modo === "producto"
                ? "Agregar lote"
                : modo === "editar"
                  ? "Editar producto"
                  : "Editar lote"
          }}
        </h3>

        <form @submit.prevent="guardar">
          <input
            class="p-1"
            v-model="codigo"
            placeholder="codigo"
            :disabled="modo === 'editarLote' || modo === 'producto'"
            required
          />

          <input
            ref="inputNombreRef"
            class="p-1"
            v-model="nombre"
            placeholder="nombre"
            :disabled="modo === 'editarLote' || modo === 'producto'"
            required
          />

          <input
            ref="inputLoteRef"
            class="p-1"
            v-model="numeroLote"
            placeholder="lote"
          />

          <input
            class="p-1"
            type="number"
            v-model="cantidad"
            placeholder="cantidad"
          />

          <input class="p-1" type="date" v-model="fecha_vencimiento" />

          <select
            class="p-1"
            v-model="categoria"
            :disabled="modo === 'editarLote' || modo === 'producto'"
          >
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
