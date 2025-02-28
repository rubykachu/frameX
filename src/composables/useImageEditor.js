import { ref, reactive, computed, nextTick } from 'vue'

// Constants for Facebook avatar dimensions
const FB_AVATAR_SIZE = 500 // Facebook recommends 500x500px

export function useImageEditor() {
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
      rotation: 0,
      dragBoundFunc: function(pos) {
        return pos;
      }
    }
  })

  // Add safe area state
  const safeArea = reactive({
    width: FB_AVATAR_SIZE,
    height: FB_AVATAR_SIZE,
    x: 0,
    y: 0
  })

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

  // Add selected node state
  const selectedId = ref(null)

  // Transformer config
  const transformerConfig = {
    enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    rotationSnaps: [0, 90, 180, 270],
    borderStroke: '#0D9488',
    borderStrokeWidth: 2,
    anchorStroke: '#0D9488',
    anchorFill: '#fff',
    anchorSize: 8,
    anchorCornerRadius: 4,
    padding: -10,
    keepRatio: true,
    boundBoxFunc: (oldBox, newBox) => {
      // Prevent scaling smaller than 10px
      if (newBox.width < 10 || newBox.height < 10) {
        return oldBox
      }

      // Prevent scaling larger than stage size
      if (newBox.width > stageConfig.width * 1.2 || newBox.height > stageConfig.height * 1.2) {
        return oldBox
      }

      // Ensure the transformer box stays within stage bounds
      if (newBox.x < 0 || newBox.y < 0 ||
          newBox.x + newBox.width > stageConfig.width ||
          newBox.y + newBox.height > stageConfig.height) {
        return oldBox
      }

      return newBox
    }
  }

  // Computed
  const avatarScale = computed(() => avatar.config?.scaleX || 1)

  // Methods
  const updateStageSize = (container) => {
    if (!container) return

    stageConfig.width = container.clientWidth
    stageConfig.height = container.clientWidth  // Set height equal to width for square aspect ratio
    // stageConfig.height = 600
  }

  const loadImage = (file) => {
    return new Promise((resolve, reject) => {
      if (!file || !file.type?.startsWith('image/')) {
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
      const img = typeof file === 'object' ? await loadImage(file) : file
      background.image = img

      // Calculate scale to fit stage while maintaining aspect ratio
      const containerSize = Math.min(stageConfig.width, stageConfig.height)
      const scale = containerSize / Math.max(img.width, img.height)

      // Center the frame
      const x = (stageConfig.width - img.width * scale) / 2
      const y = (stageConfig.height - img.height * scale) / 2

      background.config = {
        image: img,
        draggable: true,
        x,
        y,
        scaleX: scale,
        scaleY: scale,
        listening: true // Enable interactions with frame
      }

      // Update safe area to match frame size
      safeArea.width = containerSize
      safeArea.height = containerSize
      safeArea.x = (stageConfig.width - containerSize) / 2
      safeArea.y = (stageConfig.height - containerSize) / 2

    } catch (error) {
      console.error('Error loading frame:', error)
      throw error
    }
  }

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
        rotation: 0,
        dragBoundFunc: function(pos) {
          return pos;
        }
      }

      // Select avatar after upload
      nextTick(() => {
        handleSelect('avatar')
      })
    } catch (error) {
      console.error('Error loading avatar:', error)
      throw error
    }
  }

  const updatePosition = (type, node) => {
    const target = type === 'frame' ? background : avatar
    if (!node) return

    target.config.x = node.x()
    target.config.y = node.y()

    console.log(`${type} position updated:`, {
      to: { x: target.config.x, y: target.config.y }
    })
  }

  const updateTransform = (type, node) => {
    const target = type === 'frame' ? background : avatar
    if (!node) return

    target.config.scaleX = node.scaleX()
    target.config.scaleY = node.scaleY()
    target.config.rotation = node.rotation() || 0

    // Update position after transform
    target.config.x = node.x()
    target.config.y = node.y()
  }

  const handleScale = (scale) => {
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

  const handleExport = (format, stage) => {
    if (!stage || !background.image || !avatar.image) return

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
    const avatarNode = stage.getNode().find('#avatar')[0]
    const avatarClone = avatarNode.clone({
      x: (avatarNode.x() - safeArea.x) * (FB_AVATAR_SIZE / safeArea.width),
      y: (avatarNode.y() - safeArea.y) * (FB_AVATAR_SIZE / safeArea.height),
      scaleX: avatarNode.scaleX() * (FB_AVATAR_SIZE / safeArea.width),
      scaleY: avatarNode.scaleY() * (FB_AVATAR_SIZE / safeArea.height)
    })
    tempLayer.add(avatarClone)

    // Add the frame on top
    const frameNode = stage.getNode().find('#frame')[0]
    const frameClone = frameNode.clone({
      x: 0,
      y: 0,
      width: FB_AVATAR_SIZE,
      height: FB_AVATAR_SIZE,
      scaleX: 1,
      scaleY: 1
    })
    tempLayer.add(frameClone)

    // Đảm bảo frame luôn ở trên cùng khi xuất ảnh
    frameClone.moveToTop()

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

  // Selection handling
  const handleSelect = (nodeId) => {
    selectedId.value = nodeId
    updateImageStyles()
  }

  const handleStageClick = (e, stage) => {
    if (e.target === stage.getNode()) {
      selectedId.value = null
      updateImageStyles()
    }
  }

  const updateImageStyles = () => {
    if (background.config) {
      background.config.shadowBlur = selectedId.value === 'frame' ? 10 : 0
      background.config.stroke = selectedId.value === 'frame' ? '#0D9488' : undefined
      background.config.strokeWidth = selectedId.value === 'frame' ? 2 : 0
    }
    if (avatar.config) {
      avatar.config.shadowBlur = 0
      avatar.config.stroke = undefined
      avatar.config.strokeWidth = 0
    }
  }

  // Crop methods
  const startCrop = (stage) => {
    if (!avatar.image || !selectedId.value) return

    cropMode.value = true
    const node = stage.getNode().find(`#${selectedId.value}`)[0]
    if (!node) return

    // Set crop area to match the selected object's bounds
    const nodeRect = node.getClientRect()

    cropConfig.x = nodeRect.x
    cropConfig.y = nodeRect.y
    cropConfig.width = nodeRect.width
    cropConfig.height = nodeRect.height
    cropConfig.visible = true

    // Hide the transformer while in crop mode
    const transformer = stage.getNode().find('Transformer')[0]
    if (transformer) {
      transformer.visible(false)
    }
  }

  const applyCrop = (stage) => {
    if (!cropMode.value || !selectedId.value) return

    const node = stage.getNode().find(`#${selectedId.value}`)[0]
    const cropNode = stage.getNode().find('#crop')[0]
    if (!node || !cropNode) return

    // Create temporary canvas for cropping
    const tempCanvas = document.createElement('canvas')
    const ctx = tempCanvas.getContext('2d')

    // Set canvas size to crop size
    tempCanvas.width = cropConfig.width
    tempCanvas.height = cropConfig.height

    // Calculate the relative position and scale for cropping
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    const rotation = node.rotation()

    // Save current node attributes
    const nodeAttrs = {
      x: node.x(),
      y: node.y(),
      scaleX: scaleX,
      scaleY: scaleY,
      rotation: rotation
    }

    // Reset node transformation temporarily
    node.setAttrs({
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0
    })

    // Draw cropped portion
    ctx.drawImage(
      node.image(),
      (cropConfig.x - nodeAttrs.x) / scaleX,
      (cropConfig.y - nodeAttrs.y) / scaleY,
      cropConfig.width / scaleX,
      cropConfig.height / scaleY,
      0,
      0,
      cropConfig.width,
      cropConfig.height
    )

    // Create new image from cropped canvas
    const croppedImage = new Image()
    croppedImage.onload = () => {
      if (selectedId.value === 'avatar') {
        avatar.image = croppedImage
        avatar.config = {
          ...avatar.config,
          image: croppedImage,
          x: cropConfig.x,
          y: cropConfig.y,
          scaleX: 1,
          scaleY: 1
        }
      }

      // Reset crop mode
      cropMode.value = false
      cropConfig.visible = false

      // Show transformer again
      const transformer = stage.getNode().find('Transformer')[0]
      if (transformer) {
        transformer.visible(true)
      }
    }
    croppedImage.src = tempCanvas.toDataURL()

    // Restore node attributes
    node.setAttrs(nodeAttrs)
  }

  const cancelCrop = () => {
    cropMode.value = false
    cropConfig.visible = false
  }

  const updateCropPosition = (node) => {
    if (!node) return

    cropConfig.x = node.x()
    cropConfig.y = node.y()
  }

  const updateCropTransform = (node) => {
    if (!node) return

    cropConfig.width = node.width() * node.scaleX()
    cropConfig.height = node.height() * node.scaleY()
  }

  // Frame handling methods
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

  return {
    stageConfig,
    background,
    avatar,
    safeArea,
    cropMode,
    cropConfig,
    selectedId,
    transformerConfig,
    avatarScale,
    updateStageSize,
    loadImage,
    handleBackgroundUpload,
    handleAvatarUpload,
    updatePosition,
    updateTransform,
    handleScale,
    handleRotate,
    handleExport,
    handleSelect,
    handleStageClick,
    updateImageStyles,
    startCrop,
    applyCrop,
    cancelCrop,
    updateCropPosition,
    updateCropTransform,
    handleSelectFrame,
    handleFrameFromUrl
  }
}
