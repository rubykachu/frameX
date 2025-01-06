import { ref, computed, onMounted, onUnmounted } from 'vue'
import 'fabric'
const fabric = window.fabric

export function useImageEditor(canvasRef) {
  // State
  const canvas = ref(null)
  const backgroundImage = ref(null)
  const avatarImage = ref(null)
  const isInitialized = ref(false)

  // Computed
  const hasImages = computed(() => backgroundImage.value && avatarImage.value)
  const hasBackground = computed(() => !!backgroundImage.value)

  // Methods
  const initCanvas = () => {
    if (!canvasRef || !canvasRef.value || isInitialized.value) return

    canvas.value = new fabric.Canvas(canvasRef.value, {
      preserveObjectStacking: true,
      selection: false
    })

    // Set initial canvas size
    const container = canvasRef.value.parentElement
    canvas.value.setWidth(container.clientWidth)
    canvas.value.setHeight(400)

    isInitialized.value = true

    // Handle window resize
    const handleResize = () => {
      if (!canvas.value || !backgroundImage.value) return

      const container = canvasRef.value.parentElement
      const containerWidth = container.clientWidth
      const containerHeight = 400
      const imgRatio = backgroundImage.value.width / backgroundImage.value.height
      const containerRatio = containerWidth / containerHeight

      let width = containerWidth
      let height = containerHeight

      if (containerRatio > imgRatio) {
        width = height * imgRatio
      } else {
        height = width / imgRatio
      }

      canvas.value.setWidth(width)
      canvas.value.setHeight(height)
      canvas.value.renderAll()
    }

    window.addEventListener('resize', handleResize)
    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
      canvas.value?.dispose()
    })
  }

  const loadImage = (file) => {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        reject(new Error('Invalid file type'))
        return
      }

      if (file.size > 20 * 1024 * 1024) { // 20MB limit
        reject(new Error('File size exceeds 20MB limit'))
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        fabric.Image.fromURL(e.target.result, (img) => {
          resolve(img)
        })
      }
      reader.onerror = () => reject(new Error('Failed to load image'))
      reader.readAsDataURL(file)
    })
  }

  const setBackgroundImage = async (file) => {
    try {
      const img = await loadImage(file)

      // Set background image size to canvas size
      const canvasWidth = canvas.value.width
      const canvasHeight = canvas.value.height
      const imgRatio = img.width / img.height
      const canvasRatio = canvasWidth / canvasHeight

      if (canvasRatio > imgRatio) {
        img.scaleToWidth(canvasWidth)
      } else {
        img.scaleToHeight(canvasHeight)
      }

      // Center the image
      img.set({
        left: (canvasWidth - img.getScaledWidth()) / 2,
        top: (canvasHeight - img.getScaledHeight()) / 2,
        selectable: false,
        evented: false
      })

      // Remove old background if exists
      if (backgroundImage.value) {
        canvas.value.remove(backgroundImage.value)
      }

      backgroundImage.value = img
      canvas.value.add(img)
      canvas.value.sendToBack(img)
      canvas.value.renderAll()

      return true
    } catch (error) {
      console.error('Error loading background:', error)
      return false
    }
  }

  const setAvatarImage = async (file) => {
    try {
      const img = await loadImage(file)

      // Set initial avatar size (30% of canvas width)
      const maxSize = canvas.value.width * 0.3
      if (img.width > maxSize || img.height > maxSize) {
        if (img.width > img.height) {
          img.scaleToWidth(maxSize)
        } else {
          img.scaleToHeight(maxSize)
        }
      }

      // Center the image
      img.set({
        left: (canvas.value.width - img.getScaledWidth()) / 2,
        top: (canvas.value.height - img.getScaledHeight()) / 2,
        cornerColor: '#0D9488',
        cornerStrokeColor: '#0D9488',
        cornerStyle: 'circle',
        transparentCorners: false,
        padding: 10
      })

      // Remove old avatar if exists
      if (avatarImage.value) {
        canvas.value.remove(avatarImage.value)
      }

      avatarImage.value = img
      canvas.value.add(img)
      canvas.value.setActiveObject(img)
      canvas.value.renderAll()

      return true
    } catch (error) {
      console.error('Error loading avatar:', error)
      return false
    }
  }

  const updateAvatarScale = (scale) => {
    if (!avatarImage.value) return

    const currentWidth = avatarImage.value.width * avatarImage.value.scaleX
    const newScale = (currentWidth * scale) / avatarImage.value.width

    avatarImage.value.scale(newScale)
    canvas.value.renderAll()
  }

  const rotateAvatar = (direction) => {
    if (!avatarImage.value) return

    const rotation = direction === 'left' ? -90 : 90
    const currentRotation = avatarImage.value.angle
    avatarImage.value.rotate((currentRotation + rotation) % 360)
    canvas.value.renderAll()
  }

  const exportImage = (format = 'png') => {
    if (!canvas.value || !hasImages.value) return null
    return canvas.value.toDataURL({
      format: format,
      quality: 1
    })
  }

  // Initialize canvas when mounted
  onMounted(() => {
    initCanvas()
  })

  return {
    // State
    canvas,
    hasImages,
    hasBackground,

    // Methods
    setBackgroundImage,
    setAvatarImage,
    updateAvatarScale,
    rotateAvatar,
    exportImage
  }
}
