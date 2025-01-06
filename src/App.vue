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
              @click="handleStageClick"
            >
              <v-layer ref="layer">
                <!-- Safe Area Boundary -->
                <v-rect
                  :config="{
                    x: safeArea.x,
                    y: safeArea.y,
                    width: safeArea.width,
                    height: safeArea.height,
                    stroke: '#0D9488',
                    strokeWidth: 2,
                    dash: [10, 5],
                    listening: false,
                    strokeScaleEnabled: false
                  }"
                />
                <!-- Background Image -->
                <v-image
                  v-if="background.image"
                  :config="{
                    ...background.config,
                    id: 'background'
                  }"
                  @click="handleSelect('background')"
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
                  @click="handleSelect('avatar')"
                  @dragend="updatePosition('avatar')"
                  @transformend="updateTransform('avatar')"
                />
                <!-- Transformer -->
                <v-transformer
                  v-if="selectedId"
                  ref="transformer"
                  :config="transformerConfig"
                  @mounted="updateTransformerNodes"
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
            :selected-id="selectedId"
            @upload-background="handleBackgroundUpload"
            @upload-avatar="handleAvatarUpload"
            @update-scale="handleScale"
            @rotate="handleRotate"
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
  shadowOffsetY: 0
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
  width: 0,
  height: 0,
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

const handleExport = (format) => {
  if (!stage.value || !background.image) return

  // Create a temporary stage with size of background image
  const tempStage = new window.Konva.Stage({
    container: 'temp-container',
    width: background.image.width,
    height: background.image.height
  })

  // Create a temporary layer
  const tempLayer = new window.Konva.Layer()
  tempStage.add(tempLayer)

  // Clone the background image
  const bgNode = stage.value.getNode().find('#background')[0]
  const bgClone = bgNode.clone({
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    width: background.image.width,
    height: background.image.height
  })
  tempLayer.add(bgClone)

  // Clone the avatar if exists and adjust its position relative to safe area
  if (avatar.image) {
    const avatarNode = stage.value.getNode().find('#avatar')[0]
    const avatarClone = avatarNode.clone()

    // Calculate position relative to safe area
    const avatarPos = avatarNode.getAbsolutePosition()
    const safeAreaScale = safeArea.width / background.image.width

    avatarClone.setPosition({
      x: (avatarPos.x - safeArea.x) / safeAreaScale,
      y: (avatarPos.y - safeArea.y) / safeAreaScale
    })

    // Scale relative to safe area
    avatarClone.scale({
      x: avatarNode.scaleX() / safeAreaScale,
      y: avatarNode.scaleY() / safeAreaScale
    })

    tempLayer.add(avatarClone)
  }

  // Get data URL from temporary stage
  const dataUrl = tempStage.toDataURL({
    pixelRatio: 2,
    mimeType: `image/${format}`,
    quality: 1
  })

  // Clean up
  tempStage.destroy()

  // Create download link
  const link = document.createElement('a')
  link.download = `combined-image.${format}`
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Add watch effect for selection
const updateImageStyles = () => {
  if (background.config) {
    background.config.shadowBlur = selectedId.value === 'background' ? 10 : 0
  }
  if (avatar.config) {
    avatar.config.shadowBlur = selectedId.value === 'avatar' ? 10 : 0
  }
}

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
