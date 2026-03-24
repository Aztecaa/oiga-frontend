/* Navbar.vue */
<script setup>
import { usePanelStore } from "../store/panel";
import { useRoute } from "vue-router";
import { useUserStore } from "../store/user";
import { storeToRefs } from "pinia";

const panel = usePanelStore();
const route = useRoute();
const userStore = useUserStore();
const { user, role } = storeToRefs(userStore);

function abrirPanel() {
  panel.abrir(route.name); // 👈 clave
}
</script>

<template>
  <nav class="flex text-white p-2 bg-slate-950">
    <!-- Links -->
    <div class="flex items-center gap-4">
      <router-link class="hover:text-rose-700" to="/">Stock</router-link>
      <router-link class="hover:text-rose-700" to="/dashboard"
        >Dashboard</router-link
      >
      <router-link
        class="hover:text-rose-700"
        v-if="user"
        :to="role === 'supervisor' ? '/users' : '#'"
        :class="{ 'opacity-50 cursor-not-allowed': role !== 'supervisor' }"
      >
        Usuarios
      </router-link>
    </div>

    <!-- User Info / Login -->
    <button @click="panel.abrir('stock')" class="text-xl">⚙️</button>
    <div class="ml-auto flex gap-4 items-center">
      <router-link class="hover:text-rose-700" v-if="!user" to="/login"
        >Login</router-link
      >
      <div v-else class="flex gap-2 items-center">
        <span v-if="role === 'supervisor'">🖥️</span>
        <span v-if="role === 'cajero'">📦</span>
        <span>{{ user.username }} ({{ role }})</span>
        <button
          class="bg-red-700 hover:bg-red-600 text-white cursor-pointer px-2 py-1 rounded-lg"
          @click="userStore.logout()"
        >
          Salir
        </button>
      </div>
    </div>
  </nav>
</template>
