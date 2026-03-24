/* ButtonToggleTheme.vue */
<template>
    <div class="absolute right-2 bottom-2">
        <button @click="$emit('toggle')"
            :class="['px-4 py-2 rounded-lg border-transparent', isDark ? 'text-white bg-black border border-transparent cursor-pointer transition-colors duration-200 px-4 py-2 rounded-lg' : 'bg-black hover:bg-gray-900 text-white cursor-pointer px-4 py-2 rounded-lg']">
            Cambiar tema <span>{{ isDark ? 'Oscuro' : 'Claro' }}</span>
        </button>
    </div>
</template>

<script setup>
defineProps({
    isDark: Boolean
})
</script>
