import { ref, computed } from 'vue'

export function useImageEditor() {
  // State
  const backgroundImage = ref(null)
  const avatarImage = ref(null)
  const avatarPosition = ref({ x: 0, y: 0 })
  const avatarScale = ref(1)
  const avatarRotation = ref(0)
  const canvasSize = ref({ width: 0, height: 0 })

  // Computed
  const hasImages = computed(() => backgroundImage.value && avatarImage.value)
  const hasBackground = computed(() => !!backgroundImage.value)

  // Methods
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

      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve(img)
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }

      img.src = url
    })
  }

  const setBackgroundImage = async (file) => {
    try {
      const img = await loadImage(file)
      backgroundImage.value = img

      // Reset canvas size based on background image
      canvasSize.value = {
        width: img.width,
        height: img.height
      }

      // Center avatar position
      if (avatarImage.value) {
        avatarPosition.value = {
          x: (img.width - avatarImage.value.width) / 2,
          y: (img.height - avatarImage.value.height) / 2
        }
      }

      return true
    } catch (error) {
      console.error('Error loading background:', error)
      return false
    }
  }

  const setAvatarImage = async (file) => {
    try {
      const img = await loadImage(file)
      avatarImage.value = img

      // Center avatar on current canvas if background exists
      if (backgroundImage.value) {
        avatarPosition.value = {
          x: (canvasSize.value.width - img.width) / 2,
          y: (canvasSize.value.height - img.height) / 2
        }
      }

      return true
    } catch (error) {
      console.error('Error loading avatar:', error)
      return false
    }
  }

  const updateAvatarPosition = (x, y) => {
    avatarPosition.value = { x, y }
  }

  const updateAvatarScale = (scale) => {
    avatarScale.value = scale
  }

  const rotateAvatar = (direction) => {
    const rotation = direction === 'left' ? -90 : 90
    avatarRotation.value = (avatarRotation.value + rotation) % 360
  }

  const exportImage = (format = 'png') => {
    if (!hasImages.value) return null

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    // Set canvas size to background size
    canvas.width = canvasSize.value.width
    canvas.height = canvasSize.value.height

    // Draw background
    ctx.drawImage(backgroundImage.value, 0, 0)

    // Draw avatar with transformations
    ctx.save()

    // Move to avatar position
    ctx.translate(
      avatarPosition.value.x + (avatarImage.value.width * avatarScale.value) / 2,
      avatarPosition.value.y + (avatarImage.value.height * avatarScale.value) / 2
    )

    // Apply rotation
    ctx.rotate((avatarRotation.value * Math.PI) / 180)

    // Apply scale
    ctx.scale(avatarScale.value, avatarScale.value)

    // Draw avatar centered
    ctx.drawImage(
      avatarImage.value,
      -avatarImage.value.width / 2,
      -avatarImage.value.height / 2
    )

    ctx.restore()

    // Convert to data URL
    return canvas.toDataURL(`image/${format}`)
  }

  return {
    // State
    backgroundImage,
    avatarImage,
    avatarPosition,
    avatarScale,
    avatarRotation,
    canvasSize,

    // Computed
    hasImages,
    hasBackground,

    // Methods
    setBackgroundImage,
    setAvatarImage,
    updateAvatarPosition,
    updateAvatarScale,
    rotateAvatar,
    exportImage
  }
}
