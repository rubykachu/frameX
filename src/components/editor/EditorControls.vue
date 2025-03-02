<template>
  <div class="flex space-x-4 mb-6 mt-1">
    <!-- Kiểm tra xem có avatar và background không -->
    <div v-if="hasAvatarAndFrame">
      <!-- Các nút hiển thị - đã loại bỏ nút cắt ảnh -->
      <div class="flex space-x-4">
        <button
          class="btn btn-outline flex items-center justify-center gap-2 px-6 py-3 text-base"
          @click="$emit('upload-avatar')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
          </svg>
          Chọn ảnh khác
        </button>

        <button
          class="btn btn-primary flex items-center justify-center gap-2 px-6 py-3 text-base shadow-md hover:shadow-lg active:shadow-none active:translate-y-0.5 download-btn"
          @click="$emit('export', 'png')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
          Tải xuống
        </button>
      </div>
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

// Kiểm tra xem có cả avatar và frame không
const hasAvatarAndFrame = computed(() => {
  return props.avatar && props.avatar.image && props.background && props.background.image
})
</script>
