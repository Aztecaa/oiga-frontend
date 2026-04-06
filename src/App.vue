/* App.vue */
<template>
  <Layout>
    <router-view />
  </Layout>
</template>

<script setup>
import Layout from "./components/Layout.vue";
import { usePanelStore } from "./store/panel";

const panel = usePanelStore();
panel.cargarConfig();
</script>
