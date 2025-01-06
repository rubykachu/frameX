<template>
  <div class="min-h-screen bg-background">
    <Header />

    <main class="container mx-auto px-4 py-8">
      <div class="lg:grid lg:grid-cols-5 lg:gap-8 space-y-6 lg:space-y-0">
        <!-- Canvas Preview -->
        <div class="lg:col-span-3">
          <div class="card h-full min-h-[400px]" ref="stageContainer">
            <v-stage
              ref="stage"
              :config="stageConfig"
            >
              <v-layer ref="layer">
                <!-- Background Image -->
                <v-image
                  v-if="background.image"
                  :config="{
                    ...background.config,
                    id: 'background'
                  }"
                  @dragend="updatePosition('background')"
                  @transformend="updateTransform('background')"
                />
                <!-- Avatar Image -->
                <v-image
                  v-if="avatar.image"
                  :config="{
                    ...avatar.config,
                    id: 'avatar'
                  }"
                  @dragend="updatePosition('avatar')"
                  @transformend="updateTransform('avatar')"
                />
                <!-- Transformer for Avatar -->
                <v-transformer
                  v-if="avatar.image"
                  ref="transformer"
                  :config="transformerConfig"
                  @mounted="updateTransformerNodes"
                />
                <!-- Crop Rectangle -->
                <v-rect
                  v-if="cropConfig.visible"
                  :config="cropConfig"
                  @dragend="updateCropPosition"
                  @transformend="updateCropTransform"
                />
              </v-layer>
            </v-stage>
          </div>
        </div>

        <!-- Control Panel -->
        <div class="lg:col-span-2">
          <ControlPanel
            :background="background"
            :avatar="avatar"
            :is-cropping="cropConfig.visible"
            @upload-background="handleBackgroundUpload"
            @upload-avatar="handleAvatarUpload"
            @update-scale="handleScale"
            @rotate="handleRotate"
            @start-crop="handleStartCrop"
            @apply-crop="handleApplyCrop"
            @cancel-crop="handleCancelCrop"
            @export="handleExport"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import Header from './components/layout/Header.vue'
import ControlPanel from './components/editor/ControlPanel.vue'

// Stage configuration
const stageContainer = ref(null)
const stage = ref(null)
const layer = ref(null)

const stageConfig = reactive({
  width: 800,
  height: 400
})

// Image states
const background = reactive({
  image: null,
  config: {
    image: null,
    draggable: true,
    x: 0,
    y: 0
  }
})

const avatar = reactive({
  image: null,
  config: {
    image: null,
    draggable: true,
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0
  }
})

// Crop state
const cropConfig = reactive({
  visible: false,
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  stroke: '#0D9488',
  strokeWidth: 2,
  fill: 'rgba(0,0,0,0.3)',
  draggable: true,
  strokeScaleEnabled: false,
  dash: [5, 5],
  id: 'crop-rect'
})

// Add ref for transformer
const transformer = ref(null)

// Update transformer config
const transformerConfig = {
  enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
  rotationSnaps: [0, 90, 180, 270],
  borderStroke: '#0D9488',
  anchorStroke: '#0D9488',
  anchorFill: '#fff',
  anchorSize: 8,
  keepRatio: true
}

// Add watch effect to update transformer nodes
const updateTransformerNodes = () => {
  if (!stage.value || !transformer.value) return
  const node = stage.value.getNode().find('#avatar')[0]
  if (node) {
    transformer.value.getNode().nodes([node])
  }
}

// Methods
const updateStageSize = () => {
  if (!stageContainer.value) return

  const container = stageContainer.value
  stageConfig.width = container.clientWidth
  stageConfig.height = 400
}

const loadImage = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Invalid file type'))
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      reject(new Error('File size exceeds 20MB limit'))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

const handleBackgroundUpload = async (file) => {
  try {
    const img = await loadImage(file)
    background.image = img

    // Calculate scale to fit stage
    const scale = Math.min(
      stageConfig.width / img.width,
      stageConfig.height / img.height
    )

    background.config = {
      image: img,
      draggable: true,
      x: (stageConfig.width - img.width * scale) / 2,
      y: (stageConfig.height - img.height * scale) / 2,
      scaleX: scale,
      scaleY: scale
    }
  } catch (error) {
    console.error('Error loading background:', error)
  }
}

const handleAvatarUpload = async (file) => {
  try {
    const img = await loadImage(file)
    avatar.image = img

    // Set initial size (30% of stage width)
    const maxSize = stageConfig.width * 0.3
    const scale = Math.min(
      maxSize / img.width,
      maxSize / img.height
    )

    avatar.config = {
      image: img,
      draggable: true,
      x: (stageConfig.width - img.width * scale) / 2,
      y: (stageConfig.height - img.height * scale) / 2,
      scaleX: scale,
      scaleY: scale,
      rotation: 0
    }

    // Update transformer after avatar is loaded
    nextTick(() => {
      updateTransformerNodes()
    })
  } catch (error) {
    console.error('Error loading avatar:', error)
  }
}

const updatePosition = (type) => {
  const node = type === 'background' ? background : avatar
  const target = stage.value.getNode().find(`#${type}`)[0]
  if (!target) return

  node.config.x = target.x()
  node.config.y = target.y()
}

const updateTransform = (type) => {
  const node = type === 'background' ? background : avatar
  const target = stage.value.getNode().find(`#${type}`)[0]
  if (!target) return

  node.config.scaleX = target.scaleX()
  node.config.scaleY = target.scaleY()
  if (type === 'avatar') {
    node.config.rotation = target.rotation()
  }
}

const handleScale = (scale) => {
  if (!avatar.config) return
  avatar.config.scaleX = scale
  avatar.config.scaleY = scale
}

const handleRotate = (direction) => {
  if (!avatar.config) return
  const rotation = direction === 'left' ? -90 : 90
  avatar.config.rotation = (avatar.config.rotation + rotation) % 360
}

const handleStartCrop = (type) => {
  const target = type === 'background' ? background.config : avatar.config
  if (!target) return

  cropConfig.visible = true
  cropConfig.x = target.x
  cropConfig.y = target.y
  cropConfig.width = target.width * target.scaleX
  cropConfig.height = target.height * target.scaleY
}

const handleApplyCrop = () => {
  // TODO: Implement crop functionality
  cropConfig.visible = false
}

const handleCancelCrop = () => {
  cropConfig.visible = false
}

const handleExport = (format) => {
  if (!stage.value) return

  const dataUrl = stage.value.toDataURL({
    pixelRatio: 2,
    mimeType: `image/${format}`
  })

  const link = document.createElement('a')
  link.download = `combined-image.${format}`
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Add crop position and transform update methods
const updateCropPosition = () => {
  if (!stage.value) return
  const cropRect = stage.value.getNode().find('#crop-rect')[0]
  if (!cropRect) return

  cropConfig.x = cropRect.x()
  cropConfig.y = cropRect.y()
}

const updateCropTransform = () => {
  if (!stage.value) return
  const cropRect = stage.value.getNode().find('#crop-rect')[0]
  if (!cropRect) return

  cropConfig.width = cropRect.width() * cropRect.scaleX()
  cropConfig.height = cropRect.height() * cropRect.scaleY()
}

// Lifecycle hooks
onMounted(() => {
  updateStageSize()
  window.addEventListener('resize', updateStageSize)
  updateTransformerNodes()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateStageSize)
})
</script>
