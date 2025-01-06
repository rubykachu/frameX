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
        <!-- Scale Control -->
        <div v-if="selectedId === 'avatar'">
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

        <!-- Rotate Controls -->
        <div class="flex space-x-4">
          <button class="btn flex-1" @click="$emit('rotate', 'left')">
            <span class="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Rotate Left
            </span>
          </button>
          <button class="btn flex-1" @click="$emit('rotate', 'right')">
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
        <button
          class="btn btn-primary w-full"
          @click="$emit('export', selectedFormat)"
        >
          Download Image
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Props
const props = defineProps({
  background: {
    type: Object,
    required: true
  },
  avatar: {
    type: Object,
    required: true
  },
  selectedId: {
    type: String,
    default: null
  }
})

// Emits
const emit = defineEmits([
  'upload-background',
  'upload-avatar',
  'update-scale',
  'rotate',
  'export'
])

// Local state
const backgroundError = ref('')
const avatarError = ref('')
const selectedFormat = ref('png')

// Computed
const hasImages = computed(() => props.background.image && props.avatar.image)
const avatarScale = computed(() => props.avatar.config?.scaleX || 1)

// Handlers
const handleBackgroundUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  backgroundError.value = ''
  emit('upload-background', file)
}

const handleAvatarUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  avatarError.value = ''
  emit('upload-avatar', file)
}

const handleScaleChange = (event) => {
  emit('update-scale', Number(event.target.value))
}
</script>
