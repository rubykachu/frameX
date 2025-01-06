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
    <canvas
      v-else
      ref="canvasRef"
      @mousedown="startDragging"
      @mousemove="handleDragging"
      @mouseup="stopDragging"
      @mouseleave="stopDragging"
      @touchstart="startDragging"
      @touchmove="handleDragging"
      @touchend="stopDragging"
      class="max-w-full max-h-full"
    ></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useImageEditor } from '../../composables/useImageEditor'

// Props and emits
const props = defineProps({
  imageEditor: {
    type: Object,
    required: true
  }
})

// Destructure imageEditor
const {
  backgroundImage,
  avatarImage,
  avatarPosition,
  avatarScale,
  avatarRotation,
  canvasSize,
  hasBackground,
  hasImages,
  updateAvatarPosition
} = props.imageEditor

// Canvas refs and state
const canvasRef = ref(null)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const dragOffset = ref({ x: 0, y: 0 })

// Drawing functions
const drawCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas || !backgroundImage.value) return

  const ctx = canvas.getContext('2d')
  const container = canvas.parentElement
  const containerRatio = container.clientWidth / container.clientHeight
  const imageRatio = backgroundImage.value.width / backgroundImage.value.height

  // Calculate dimensions to fit container while maintaining aspect ratio
  let width = container.clientWidth
  let height = container.clientHeight

  if (containerRatio > imageRatio) {
    width = height * imageRatio
  } else {
    height = width / imageRatio
  }

  // Set canvas size
  canvas.width = width
  canvas.height = height

  // Clear canvas
  ctx.clearRect(0, 0, width, height)

  // Draw background
  ctx.drawImage(backgroundImage.value, 0, 0, width, height)

  // Draw avatar if exists
  if (avatarImage.value) {
    ctx.save()

    // Calculate scale factor between original and displayed size
    const scaleFactor = width / canvasSize.value.width

    // Move to avatar position
    ctx.translate(
      avatarPosition.value.x * scaleFactor + (avatarImage.value.width * avatarScale.value * scaleFactor) / 2,
      avatarPosition.value.y * scaleFactor + (avatarImage.value.height * avatarScale.value * scaleFactor) / 2
    )

    // Apply rotation
    ctx.rotate((avatarRotation.value * Math.PI) / 180)

    // Apply scale
    ctx.scale(avatarScale.value * scaleFactor, avatarScale.value * scaleFactor)

    // Draw avatar centered
    ctx.drawImage(
      avatarImage.value,
      -avatarImage.value.width / 2,
      -avatarImage.value.height / 2
    )

    ctx.restore()
  }
}

// Dragging handlers
const startDragging = (event) => {
  if (!hasImages.value) return

  event.preventDefault()
  isDragging.value = true

  const { clientX, clientY } = event.touches?.[0] ?? event
  dragStart.value = { x: clientX, y: clientY }
  dragOffset.value = { ...avatarPosition.value }
}

const handleDragging = (event) => {
  if (!isDragging.value) return

  event.preventDefault()
  const { clientX, clientY } = event.touches?.[0] ?? event
  const canvas = canvasRef.value
  const scaleFactor = canvasSize.value.width / canvas.width

  const deltaX = (clientX - dragStart.value.x) * scaleFactor
  const deltaY = (clientY - dragStart.value.y) * scaleFactor

  updateAvatarPosition(
    dragOffset.value.x + deltaX,
    dragOffset.value.y + deltaY
  )

  drawCanvas()
}

const stopDragging = () => {
  isDragging.value = false
}

// Watch for changes that require redrawing
watch([backgroundImage, avatarImage, avatarScale, avatarRotation], drawCanvas, { deep: true })

// Handle window resize
let resizeTimeout
const handleResize = () => {
  clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(drawCanvas, 100)
}

// Lifecycle hooks
onMounted(() => {
  drawCanvas()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>
