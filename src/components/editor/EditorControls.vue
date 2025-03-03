<template>
  <div class="bg-white p-4 flex">
    <!-- Check if there is an avatar and background -->
    <div v-if="hasAvatarAndFrame" class="flex space-x-4">
      <!-- Display buttons -->
      <button
        class="btn btn-outline flex items-center justify-center gap-2 px-6 py-3 text-base"
        @click="handleUploadAvatar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
        </svg>
        Choose another image
      </button>

      <button
        class="btn btn-primary flex items-center justify-center gap-2 px-6 py-3 text-base shadow-md hover:shadow-lg active:shadow-none active:translate-y-0.5 download-btn"
        @click="handleExport('png')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
        Download
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  avatar: {
    type: Object,
    required: true
  },
  background: {
    type: Object,
    required: true
  }
})

const emit = defineEmits([
  'upload-avatar',
  'export'
])

// Check if there is an avatar and frame
const hasAvatarAndFrame = computed(() => {
  return props.avatar && props.avatar.image && props.background && props.background.image
})

// Handle upload avatar
const handleUploadAvatar = () => {
  emit('upload-avatar')
}

// Handle export
const handleExport = (format) => {
  emit('export', format)
}
</script>

<style scoped>
.btn {
  @apply font-medium rounded-md transition-all duration-200;
}

.btn-outline {
  @apply border border-gray-300 bg-white text-gray-700 hover:bg-gray-50;
}

.btn-primary {
  @apply bg-indigo-600 text-white hover:bg-indigo-700;
}
</style>
