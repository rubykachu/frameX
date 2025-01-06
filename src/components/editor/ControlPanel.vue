<template>
  <div class="card space-y-6">
    <!-- Upload Section -->
    <section>
      <h3 class="text-lg font-medium mb-4">Upload Images</h3>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Background Image</label>
          <input
            type="file"
            accept="image/png,image/jpeg"
            class="input-file"
            @change="handleBackgroundUpload"
          />
          <p v-if="backgroundError" class="mt-2 text-sm text-red-500">{{ backgroundError }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Avatar Image</label>
          <input
            type="file"
            accept="image/png,image/jpeg"
            class="input-file"
            @change="handleAvatarUpload"
          />
          <p v-if="avatarError" class="mt-2 text-sm text-red-500">{{ avatarError }}</p>
        </div>
      </div>
    </section>

    <!-- Transform Controls -->
    <section v-if="hasImages">
      <h3 class="text-lg font-medium mb-4">Transform Controls</h3>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Scale: {{ avatarScale.toFixed(1) }}x</label>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            :value="avatarScale"
            @input="handleScaleChange"
            class="w-full"
          />
        </div>
        <div class="flex space-x-4">
          <button class="btn flex-1" @click="handleRotate('left')">
            <span class="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Rotate Left
            </span>
          </button>
          <button class="btn flex-1" @click="handleRotate('right')">
            <span class="flex items-center justify-center">
              Rotate Right
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </section>

    <!-- Export Section -->
    <section v-if="hasImages">
      <h3 class="text-lg font-medium mb-4">Export</h3>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Format</label>
          <select v-model="selectedFormat" class="w-full p-2 border border-border rounded-lg">
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
          </select>
        </div>
        <button class="btn btn-primary w-full" @click="handleExport">
          Download Image
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Props and emits
const props = defineProps({
  imageEditor: {
    type: Object,
    required: true
  }
})

// Local state
const backgroundError = ref('')
const avatarError = ref('')
const selectedFormat = ref('png')

// Computed properties for imageEditor methods
const hasImages = computed(() => props.imageEditor.hasImages)
const avatarScale = computed(() => props.imageEditor.avatarScale)
const setBackgroundImage = computed(() => props.imageEditor.setBackgroundImage)
const setAvatarImage = computed(() => props.imageEditor.setAvatarImage)
const updateAvatarScale = computed(() => props.imageEditor.updateAvatarScale)
const rotateAvatar = computed(() => props.imageEditor.rotateAvatar)
const exportImage = computed(() => props.imageEditor.exportImage)

// Handlers
const handleBackgroundUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  backgroundError.value = ''
  if (setBackgroundImage.value) {
    const success = await setBackgroundImage.value(file)
    if (!success) {
      backgroundError.value = 'Failed to load background image. Please ensure it\'s a valid image under 20MB.'
    }
  }
}

const handleAvatarUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  avatarError.value = ''
  if (setAvatarImage.value) {
    const success = await setAvatarImage.value(file)
    if (!success) {
      avatarError.value = 'Failed to load avatar image. Please ensure it\'s a valid image under 20MB.'
    }
  }
}

const handleScaleChange = (event) => {
  if (updateAvatarScale.value) {
    updateAvatarScale.value(Number(event.target.value))
  }
}

const handleRotate = (direction) => {
  if (rotateAvatar.value) {
    rotateAvatar.value(direction)
  }
}

const handleExport = () => {
  if (!exportImage.value) return

  const dataUrl = exportImage.value(selectedFormat.value)
  if (!dataUrl) return

  // Create download link
  const link = document.createElement('a')
  link.download = `combined-image.${selectedFormat.value}`
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>
