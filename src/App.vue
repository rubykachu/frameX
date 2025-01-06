<template>
  <div class="min-h-screen bg-background">
    <Header />

    <main class="container mx-auto px-4 py-8">
      <div class="lg:grid lg:grid-cols-5 lg:gap-8 space-y-6 lg:space-y-0">
        <!-- Canvas Preview -->
        <div class="lg:col-span-3">
          <CanvasPreview />
        </div>

        <!-- Control Panel -->
        <div class="lg:col-span-2">
          <ControlPanel />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import Header from './components/layout/Header.vue'
import CanvasPreview from './components/editor/CanvasPreview.vue'
import ControlPanel from './components/editor/ControlPanel.vue'
</script>
