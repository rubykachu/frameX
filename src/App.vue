<template>
  <div class="min-h-screen bg-background flex flex-col">
    <Header />

    <main class="container mx-auto px-4 py-8 flex-1">
      <div class="flex flex-row gap-6 h-full">
        <!-- Sidebar -->
        <Sidebar
          @select-frame="handleSelectFrame"
          @upload-frame="handleFrameUpload"
          @load-from-url="handleFrameFromUrl"
        />

        <!-- Editor Container -->
        <div class="flex-1">
          <!-- Hidden file inputs -->
          <input
            type="file"
            ref="avatarInput"
            @change="onAvatarFileSelected"
            accept="image/png,image/jpeg,image/svg+xml"
            class="hidden"
          />
          <!-- Canvas Container -->
          <div class="relative aspect-square bg-gray-100 rounded-lg mb-4 flex-1 border border-gray-100">
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

            <!-- Upload Overlay - Show when no frame or no avatar -->
            <div v-if="!background.image || !avatar.image"
                 class="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-lg z-10">
              <div class="text-center p-6 max-w-md">
                <!-- Step indicator -->
                <div class="flex items-center justify-center mb-4 step-indicator">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center"
                       :class="background.image ? 'bg-teal-100 text-teal-700' : 'bg-teal-600 text-white'">1</div>
                  <div class="w-16 h-1" :class="background.image ? 'bg-teal-100' : 'bg-gray-200'"></div>
                  <div class="w-8 h-8 rounded-full flex items-center justify-center"
                       :class="avatar.image ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-600'">2</div>
                </div>

                <!-- Instruction text -->
                <h3 class="text-xl font-medium text-gray-800 mb-2">
                  {{ !background.image ? 'Chọn khung ảnh' : 'Thêm ảnh đại diện của bạn' }}
                </h3>
                <p class="text-gray-600 mb-6">
                  {{ !background.image ? 'Chọn một khung từ gallery hoặc tải lên khung của bạn từ sidebar bên trái' : 'Tải lên ảnh đại diện để bắt đầu chỉnh sửa' }}
                </p>

                <!-- Action buttons -->
                <div class="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    v-if="background.image && !avatar.image"
                    class="btn btn-primary flex items-center justify-center gap-2 px-6 py-3 text-base"
                    @click="handleUploadAvatar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                    </svg>
                    Chọn ảnh
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons - Moved closer to the canvas -->
          <div class="flex justify-center space-x-4 mb-6">
            <button
              v-if="!cropMode && avatar.image"
              class="btn btn-outline flex items-center justify-center gap-2 px-6 py-3 text-base"
              @click="handleUploadAvatar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
              </svg>
              Chọn ảnh khác
            </button>
            <button
              v-if="!cropMode && avatar.image"
              class="btn btn-secondary flex items-center justify-center gap-2 px-6 py-3 text-base"
              @click="startCrop"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.5 2A1.5 1.5 0 004 3.5v13A1.5 1.5 0 005.5 18h9a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0014.5 2h-9zM5 3.5a.5.5 0 01.5-.5h9a.5.5 0 01.5.5v13a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5v-13z" clip-rule="evenodd" />
                <path d="M8 6h4a1 1 0 110 2H8a1 1 0 110-2z" />
              </svg>
              Cắt ảnh
            </button>
            <template v-if="cropMode">
              <button
                class="btn btn-primary flex items-center justify-center gap-2 px-6 py-3 text-base"
                @click="applyCrop"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                Xác nhận
              </button>
              <button
                class="btn btn-secondary flex items-center justify-center gap-2 px-6 py-3 text-base"
                @click="cancelCrop"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
                Hủy
              </button>
            </template>
            <button
              v-if="avatar.image && !cropMode"
              class="btn btn-primary flex items-center justify-center gap-2 px-6 py-3 text-base shadow-md hover:shadow-lg active:shadow-none active:translate-y-0.5 download-btn"
              @click="handleExport('png')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
              Tải xuống
            </button>
          </div>
        </div>
      </div>
    </main>

    <Footer />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import Header from './components/layout/Header.vue'
import Footer from './components/layout/Footer.vue'
import Sidebar from './components/layout/Sidebar.vue'

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

// Add refs
const frameInput = ref(null)
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

// Add frame upload methods
const handleUploadFrame = () => {
  frameInput.value?.click()
}

const onFrameFileSelected = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  try {
    await handleBackgroundUpload(file)
    event.target.value = ''
  } catch (error) {
    console.error('Error uploading frame:', error)
  }
}

// Update handleBackgroundUpload to handle frame better
const handleBackgroundUpload = async (file) => {
  try {
    const img = await loadImage(file)
    background.image = img

    // Calculate scale to fit stage while maintaining aspect ratio
    const containerSize = Math.min(stageConfig.width, stageConfig.height)
    const scale = containerSize / Math.max(img.width, img.height)

    // Center the frame
    const x = (stageConfig.width - img.width * scale) / 2
    const y = (stageConfig.height - img.height * scale) / 2

    background.config = {
      image: img,
      draggable: false,
      x,
      y,
      scaleX: scale,
      scaleY: scale
    }

    // Update safe area to match frame size
    safeArea.width = containerSize
    safeArea.height = containerSize
    safeArea.x = (stageConfig.width - containerSize) / 2
    safeArea.y = (stageConfig.height - containerSize) / 2

  } catch (error) {
    console.error('Error loading frame:', error)
  }
}

// Update handleAvatarUpload to center in safe area
const handleAvatarUpload = async (file) => {
  try {
    const img = await loadImage(file)
    avatar.image = img

    // Set initial size (70% of safe area)
    const maxSize = Math.min(safeArea.width, safeArea.height) * 0.7
    const scale = maxSize / Math.max(img.width, img.height)

    // Center in safe area
    const x = safeArea.x + (safeArea.width - img.width * scale) / 2
    const y = safeArea.y + (safeArea.height - img.height * scale) / 2

    avatar.config = {
      image: img,
      draggable: true,
      x,
      y,
      scaleX: scale,
      scaleY: scale,
      rotation: 0
    }

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

// Update scale handler to scale from center
const handleScale = (event) => {
  const scale = Number(event.target.value)
  if (!avatar.config || isNaN(scale)) return

  const oldScale = avatar.config.scaleX
  const newScale = scale

  // Get center of safe area
  const centerX = safeArea.x + safeArea.width / 2
  const centerY = safeArea.y + safeArea.height / 2

  // Calculate new position to maintain center point
  const currentX = avatar.config.x
  const currentY = avatar.config.y
  const imgCenterX = currentX + (avatar.image.width * oldScale) / 2
  const imgCenterY = currentY + (avatar.image.height * oldScale) / 2

  // Calculate offset from center
  const offsetX = imgCenterX - centerX
  const offsetY = imgCenterY - centerY

  // Scale the offset
  const newOffsetX = (offsetX * newScale) / oldScale
  const newOffsetY = (offsetY * newScale) / oldScale

  // Update position and scale
  avatar.config.scaleX = newScale
  avatar.config.scaleY = newScale
  avatar.config.x = centerX + newOffsetX - (avatar.image.width * newScale) / 2
  avatar.config.y = centerY + newOffsetY - (avatar.image.height * newScale) / 2
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

// Handle frame selection from sidebar
const handleSelectFrame = (frame) => {
  if (frame && frame.src) {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = frame.src
    img.onload = () => {
      handleBackgroundUpload(img)
    }
    img.onerror = (err) => {
      console.error('Error loading frame image:', err)
    }
  }
}

// Handle frame upload from sidebar
const handleFrameUpload = (file) => {
  if (file) {
    onFrameFileSelected({ target: { files: [file] } })
  }
}

// Handle frame from URL input
const handleFrameFromUrl = async (url) => {
  try {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = url
    img.onload = () => {
      handleBackgroundUpload(img)
    }
    img.onerror = () => {
      console.error('Error loading image from URL')
    }
  } catch (error) {
    console.error('Error checking image URL:', error)
  }
}
</script>

<style>
.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-all duration-200;
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

input[type="range"]::focus {
  @apply outline-none;
}

input[type="range"]::-webkit-slider-thumb {
  @apply ring-4 ring-teal-200;
}

input[type="range"]::-moz-range-thumb {
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

/* Upload overlay styles */
.upload-overlay {
  @apply bg-white transition-all duration-300;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Step indicator styles */
.step-indicator {
  @apply flex items-center justify-center mb-6;
}

.step-indicator-item {
  @apply w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300;
}

.step-indicator-line {
  @apply w-16 h-1 transition-all duration-300;
}

/* Button hover effects */
.btn {
  @apply transform transition-all duration-200;
}

.btn:hover {
  @apply shadow-md -translate-y-0.5;
}

.btn:active {
  @apply shadow-none translate-y-0;
}

/* Canvas container with improved styling */
.relative.aspect-square {
  @apply bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100;
  transition: all 0.3s ease;
}

/* Download button pulse animation */
@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(13, 148, 136, 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(13, 148, 136, 0);
  }
}

.btn-primary.download-btn {
  animation: pulse 2s infinite;
}

/* Improved scale control */
.scale-control {
  @apply bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden;
}

/* Add smooth transitions */
.v-stage, .v-layer, .v-image {
  transition: transform 0.2s ease-out;
}
</style>
