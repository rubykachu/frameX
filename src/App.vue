<template>
  <div class="min-h-screen bg-background">
    <Header />

    <main class="container mx-auto px-4 py-8">
      <div class="lg:grid lg:grid-cols-5 lg:gap-8 space-y-6 lg:space-y-0">
        <!-- Canvas Preview -->
        <div class="lg:col-span-3">
          <CanvasPreview ref="canvasPreviewRef" :image-editor="imageEditor" />
        </div>

        <!-- Control Panel -->
        <div class="lg:col-span-2">
          <ControlPanel :image-editor="imageEditor" />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import Header from './components/layout/Header.vue'
import CanvasPreview from './components/editor/CanvasPreview.vue'
import ControlPanel from './components/editor/ControlPanel.vue'
import { useImageEditor } from './composables/useImageEditor'

const canvasPreviewRef = ref(null)

// Initialize with default values
const imageEditor = reactive({
  hasImages: false,
  hasBackground: false,
  canvas: null,
  setBackgroundImage: () => Promise.resolve(false),
  setAvatarImage: () => Promise.resolve(false),
  updateAvatarScale: () => {},
  rotateAvatar: () => {},
  exportImage: () => null
})

onMounted(() => {
  const canvas = canvasPreviewRef.value.$el.querySelector('canvas')
  const editor = useImageEditor(canvas)

  // Update the reactive object with real methods
  Object.assign(imageEditor, editor)
})
</script>
