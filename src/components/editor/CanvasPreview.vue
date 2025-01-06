<template>
  <div class="card h-full min-h-[400px] flex items-center justify-center">
    <div v-if="!hasBackground" class="text-center p-8">
      <div class="text-primary mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <p class="text-textColor mb-2">No background image selected</p>
      <p class="text-sm text-primary">Upload a background image to start</p>
    </div>
    <canvas v-else ref="canvas" class="max-w-full max-h-full"></canvas>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const canvas = ref(null)
const hasBackground = ref(false)

// Canvas logic will be implemented in next steps
</script>
