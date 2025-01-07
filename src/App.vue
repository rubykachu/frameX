<template>
  <div class="min-h-screen bg-background">
    <Header />

    <main class="container mx-auto px-4 py-8">
      <!-- Editor Container -->
      <div class="max-w-2xl mx-auto">
        <!-- Canvas Container -->
        <div class="relative aspect-square bg-gray-100 rounded-lg mb-6">
          <div class="absolute inset-0" ref="stageContainer">
            <v-stage
              ref="stage"
              :config="stageConfig"
              @click="handleStageClick"
            >
              <!-- Main Layer (Avatar) -->
              <v-layer ref="layer">
                <!-- Avatar Image -->
                <v-image
                  v-if="avatar.image"
                  :config="{
                    ...avatar.config,
                    id: 'avatar',
                    draggable: !cropMode
                  }"
                  @dragend="updatePosition('avatar')"
                  @transformend="updateTransform('avatar')"
                />
                <!-- Frame Image -->
                <v-image
                  v-if="background.image"
                  :config="{
                    ...background.config,
                    id: 'frame',
                    draggable: false,
                    listening: false
                  }"
                />
                <!-- Crop Rectangle -->
                <v-transformer
                  v-if="cropMode"
                  ref="cropTransformer"
                  :config="{
                    ...transformerConfig,
                    enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
                    boundBoxFunc: (oldBox, newBox) => {
                      // Ensure minimum size
                      if (newBox.width < 50 || newBox.height < 50) {
                        return oldBox
                      }
                      return newBox
                    }
                  }"
                />
                <v-rect
                  v-if="cropMode"
                  :config="{
                    ...cropConfig,
                    id: 'crop'
                  }"
                  @dragend="updateCropPosition"
                  @transformend="updateCropTransform"
                />
              </v-layer>

              <!-- Mask Layer -->
              <v-layer ref="maskLayer">
                <!-- Dark Overlay -->
                <v-rect
                  :config="{
                    x: 0,
                    y: 0,
                    width: stageConfig.width,
                    height: stageConfig.height,
                    fill: 'rgba(0,0,0,0.6)',
                    listening: false
                  }"
                />
                <!-- Circle Cutout -->
                <v-circle
                  :config="{
                    x: stageConfig.width / 2,
                    y: stageConfig.height / 2,
                    radius: Math.min(safeArea.width, safeArea.height) / 2,
                    fill: 'black',
                    globalCompositeOperation: 'destination-out',
                    listening: false
                  }"
                />
              </v-layer>
            </v-stage>
          </div>
        </div>

        <!-- Controls -->
        <div class="space-y-6">
          <!-- Scale Control -->
          <div class="flex items-center space-x-4 px-4">
            <button class="p-2 text-gray-600 hover:text-gray-900">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
              </svg>
            </button>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.01"
              class="w-full"
              :value="avatarScale"
              @input="handleScale"
            />
            <button class="p-2 text-gray-600 hover:text-gray-900">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-center space-x-4">
            <button
              class="btn btn-secondary"
              @click="handleUploadAvatar"
            >
              Chọn ảnh
            </button>
            <button
              v-if="avatar.image && !cropMode"
              class="btn btn-secondary"
              @click="startCrop"
            >
              Cắt ảnh
            </button>
            <template v-if="cropMode">
              <button
                class="btn btn-primary"
                @click="applyCrop"
              >
                Xác nhận
              </button>
              <button
                class="btn btn-secondary"
                @click="cancelCrop"
              >
                Huỷ
              </button>
            </template>
            <button
              v-if="avatar.image && !cropMode"
              class="btn btn-primary"
              @click="handleExport('png')"
            >
              Tải về
            </button>
          </div>

          <!-- Hidden File Input -->
          <input
            type="file"
            ref="avatarInput"
            class="hidden"
            accept="image/png,image/jpeg"
            @change="onAvatarFileSelected"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import Header from './components/layout/Header.vue'
import ControlPanel from './components/editor/ControlPanel.vue'

// Constants for Facebook avatar dimensions
const FB_AVATAR_SIZE = 500 // Facebook recommends 500x500px

// Stage configuration
const stageConfig = reactive({
  width: FB_AVATAR_SIZE,
  height: FB_AVATAR_SIZE
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

// Add ref for transformer
const transformer = ref(null)

// Add selected node state
const selectedId = ref(null)

// Update transformer config
const transformerConfig = {
  enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
  rotationSnaps: [0, 90, 180, 270],
  borderStroke: '#0D9488',
  borderStrokeWidth: 2,
  anchorStroke: '#0D9488',
  anchorFill: '#fff',
  anchorSize: 8,
  anchorCornerRadius: 4,
  padding: 8,
  keepRatio: true,
  boundBoxFunc: (oldBox, newBox) => {
    // Prevent scaling smaller than 10px
    if (newBox.width < 10 || newBox.height < 10) {
      return oldBox
    }
    return newBox
  }
}

// Update background and avatar config to include selection style
const getImageConfig = (type, img, x, y, scaleX, scaleY, rotation = 0) => ({
  image: img,
  draggable: true,
  x,
  y,
  scaleX,
  scaleY,
  rotation,
  id: type,
  shadowColor: '#0D9488',
  shadowBlur: selectedId.value === type ? 10 : 0,
  shadowOpacity: 0.5,
  shadowEnabled: true,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  stroke: selectedId.value === type ? '#0D9488' : undefined,
  strokeWidth: selectedId.value === type ? 2 : 0
})

// Update transformer nodes handler
const updateTransformerNodes = () => {
  if (!stage.value || !transformer.value || !selectedId.value) return
  const node = stage.value.getNode().find(`#${selectedId.value}`)[0]
  if (node) {
    transformer.value.getNode().nodes([node])
  }
}

// Add selection handler
const handleSelect = (nodeId) => {
  selectedId.value = nodeId
  updateTransformerNodes()
  updateImageStyles()
}

// Add deselection handler
const handleStageClick = (e) => {
  if (e.target === stage.value.getNode()) {
    selectedId.value = null
    updateTransformerNodes()
    updateImageStyles()
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

// Add safe area state
const safeArea = reactive({
  width: FB_AVATAR_SIZE,
  height: FB_AVATAR_SIZE,
  x: 0,
  y: 0
})

const handleBackgroundUpload = async (file) => {
  try {
    const img = await loadImage(file)
    background.image = img

    // Calculate scale to fit stage
    const scale = Math.min(
      stageConfig.width / img.width,
      stageConfig.height / img.height
    )

    const x = (stageConfig.width - img.width * scale) / 2
    const y = (stageConfig.height - img.height * scale) / 2

    background.config = getImageConfig(
      'background',
      img,
      x,
      y,
      scale,
      scale
    )

    // Update safe area to match background size and position
    safeArea.width = img.width * scale
    safeArea.height = img.height * scale
    safeArea.x = x
    safeArea.y = y

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

    avatar.config = getImageConfig(
      'avatar',
      img,
      (stageConfig.width - img.width * scale) / 2,
      (stageConfig.height - img.height * scale) / 2,
      scale,
      scale
    )

    // Select avatar after upload
    nextTick(() => {
      handleSelect('avatar')
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

const handleScale = (event) => {
  const scale = Number(event.target.value)
  if (!avatar.config || isNaN(scale)) return

  avatar.config.scaleX = scale
  avatar.config.scaleY = scale
}

const handleRotate = (direction) => {
  if (!avatar.config) return
  const rotation = direction === 'left' ? -90 : 90
  avatar.config.rotation = (avatar.config.rotation + rotation) % 360
}

const handleExport = (format) => {
  if (!stage.value || !background.image || !avatar.image) return

  // Create a temporary stage with Facebook avatar dimensions
  const tempStage = new window.Konva.Stage({
    container: 'temp-container',
    width: FB_AVATAR_SIZE,
    height: FB_AVATAR_SIZE
  })

  // Create a temporary layer
  const tempLayer = new window.Konva.Layer()
  tempStage.add(tempLayer)

  // Clone and position the avatar
  const avatarNode = stage.value.getNode().find('#avatar')[0]
  const avatarClone = avatarNode.clone({
    x: (avatarNode.x() - safeArea.x) * (FB_AVATAR_SIZE / safeArea.width),
    y: (avatarNode.y() - safeArea.y) * (FB_AVATAR_SIZE / safeArea.height),
    scaleX: avatarNode.scaleX() * (FB_AVATAR_SIZE / safeArea.width),
    scaleY: avatarNode.scaleY() * (FB_AVATAR_SIZE / safeArea.height)
  })
  tempLayer.add(avatarClone)

  // Add the frame on top
  const frameNode = stage.value.getNode().find('#frame')[0]
  const frameClone = frameNode.clone({
    x: 0,
    y: 0,
    width: FB_AVATAR_SIZE,
    height: FB_AVATAR_SIZE,
    scaleX: 1,
    scaleY: 1
  })
  tempLayer.add(frameClone)

  // Get data URL
  const dataUrl = tempStage.toDataURL({
    pixelRatio: 2,
    mimeType: `image/${format}`,
    quality: 1
  })

  // Clean up
  tempStage.destroy()

  // Download
  const link = document.createElement('a')
  link.download = `avatar-with-frame.${format}`
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Add watch effect for selection
const updateImageStyles = () => {
  if (background.config) {
    background.config.shadowBlur = selectedId.value === 'background' ? 10 : 0
    background.config.stroke = selectedId.value === 'background' ? '#0D9488' : undefined
    background.config.strokeWidth = selectedId.value === 'background' ? 2 : 0
  }
  if (avatar.config) {
    avatar.config.shadowBlur = selectedId.value === 'avatar' ? 10 : 0
    avatar.config.stroke = selectedId.value === 'avatar' ? '#0D9488' : undefined
    avatar.config.strokeWidth = selectedId.value === 'avatar' ? 2 : 0
  }
}

// Add refs for new layers
const bgLayer = ref(null)
const borderLayer = ref(null)

// File input ref
const avatarInput = ref(null)

// Computed
const avatarScale = computed(() => avatar.config?.scaleX || 1)

// Methods
const handleUploadAvatar = () => {
  avatarInput.value?.click()
}

const onAvatarFileSelected = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  try {
    await handleAvatarUpload(file)
    // Reset input so the same file can be selected again
    event.target.value = ''
  } catch (error) {
    console.error('Error uploading avatar:', error)
  }
}

// Add missing refs
const stage = ref(null)
const stageContainer = ref(null)
const layer = ref(null)
const maskLayer = ref(null)

// Add crop state
const cropMode = ref(false)
const cropConfig = reactive({
  visible: false,
  x: 0,
  y: 0,
  width: FB_AVATAR_SIZE,
  height: FB_AVATAR_SIZE,
  stroke: '#0D9488',
  strokeWidth: 2,
  fill: 'rgba(0,0,0,0.3)',
  draggable: true,
  keepRatio: true
})

// Add crop methods
const startCrop = () => {
  if (!avatar.image) return

  cropMode.value = true
  const node = stage.value.getNode().find('#avatar')[0]

  cropConfig.x = node.x()
  cropConfig.y = node.y()
  cropConfig.width = node.width() * node.scaleX()
  cropConfig.height = node.height() * node.scaleY()
  cropConfig.visible = true
}

const applyCrop = () => {
  if (!avatar.image || !cropMode.value) return

  const avatarNode = stage.value.getNode().find('#avatar')[0]
  const cropNode = stage.value.getNode().find('#crop')[0]

  // Create temporary canvas for cropping
  const tempCanvas = document.createElement('canvas')
  const ctx = tempCanvas.getContext('2d')

  // Set canvas size to crop size
  tempCanvas.width = cropConfig.width
  tempCanvas.height = cropConfig.height

  // Draw cropped portion
  ctx.drawImage(
    avatarNode.image(),
    (cropConfig.x - avatarNode.x()) / avatarNode.scaleX(),
    (cropConfig.y - avatarNode.y()) / avatarNode.scaleY(),
    cropConfig.width / avatarNode.scaleX(),
    cropConfig.height / avatarNode.scaleY(),
    0, 0,
    cropConfig.width,
    cropConfig.height
  )

  // Create new image from cropped canvas
  const croppedImage = new Image()
  croppedImage.onload = () => {
    avatar.image = croppedImage
    avatar.config = {
      ...avatar.config,
      image: croppedImage,
      x: cropConfig.x,
      y: cropConfig.y,
      scaleX: 1,
      scaleY: 1
    }

    // Reset crop mode
    cropMode.value = false
    cropConfig.visible = false
  }
  croppedImage.src = tempCanvas.toDataURL()
}

const cancelCrop = () => {
  cropMode.value = false
  cropConfig.visible = false
}

// Add crop position update methods
const updateCropPosition = () => {
  const cropNode = stage.value.getNode().find('#crop')[0]
  if (!cropNode) return

  cropConfig.x = cropNode.x()
  cropConfig.y = cropNode.y()
}

const updateCropTransform = () => {
  const cropNode = stage.value.getNode().find('#crop')[0]
  if (!cropNode) return

  cropConfig.width = cropNode.width() * cropNode.scaleX()
  cropConfig.height = cropNode.height() * cropNode.scaleY()
}

// Add crop transformer ref
const cropTransformer = ref(null)

// Lifecycle hooks
onMounted(() => {
  // Create temporary container for export
  const tempContainer = document.createElement('div')
  tempContainer.id = 'temp-container'
  tempContainer.style.display = 'none'
  document.body.appendChild(tempContainer)

  updateStageSize()
  window.addEventListener('resize', updateStageSize)
  updateTransformerNodes()

  // Update crop transformer when crop mode changes
  watch(cropMode, (newValue) => {
    if (newValue) {
      nextTick(() => {
        const cropNode = stage.value.getNode().find('#crop')[0]
        if (cropNode && cropTransformer.value) {
          cropTransformer.value.getNode().nodes([cropNode])
        }
      })
    }
  })
})

onUnmounted(() => {
  // Remove temporary container
  const tempContainer = document.getElementById('temp-container')
  if (tempContainer) {
    document.body.removeChild(tempContainer)
  }

  window.removeEventListener('resize', updateStageSize)
})
</script>

<style>
.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-colors;
}

.btn-primary {
  @apply bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Custom range input styling */
input[type="range"] {
  @apply h-2 rounded-lg bg-gray-200;
  -webkit-appearance: none;
}

input[type="range"]::-webkit-slider-thumb {
  @apply w-6 h-6 rounded-full bg-teal-600 cursor-pointer shadow-md;
  -webkit-appearance: none;
  margin-top: -8px;
}

input[type="range"]::-moz-range-thumb {
  @apply w-6 h-6 rounded-full bg-teal-600 cursor-pointer shadow-md border-0;
}

input[type="range"]:focus {
  @apply outline-none;
}

input[type="range"]:focus::-webkit-slider-thumb {
  @apply ring-4 ring-teal-200;
}

input[type="range"]:focus::-moz-range-thumb {
  @apply ring-4 ring-teal-200;
}

/* Disable avatar dragging during crop */
.crop-mode .avatar {
  pointer-events: none;
}

/* Container styles */
.canvas-container {
  @apply bg-white rounded-xl shadow-lg overflow-hidden;
}

/* Button group styles */
.button-group {
  @apply flex justify-center space-x-4 mt-6;
}

.button-group button {
  @apply min-w-[100px];
}

/* Scale control styles */
.scale-control {
  @apply flex items-center space-x-4 px-6 py-4 bg-white rounded-lg shadow-md;
}

.scale-control button {
  @apply p-2 text-gray-600 hover:text-gray-900 transition-colors;
}
</style>
