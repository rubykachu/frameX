<template>
  <div class="flex space-x-4 mb-6 mt-1">
    <!-- Kiểm tra xem có avatar và background không -->
    <div v-if="hasAvatarAndFrame">
      <!-- Các nút hiển thị khi không ở chế độ cắt -->
      <div v-if="true" class="flex space-x-4">
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
          class="btn btn-secondary flex items-center justify-center gap-2 px-6 py-3 text-base"
          @click="startCrop"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.5 2A1.5 1.5 0 004 3.5v13A1.5 1.5 0 005.5 18h9a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0014.5 2h-9zM5 3.5a.5.5 0 01.5-.5h9a.5.5 0 01.5.5v13a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5v-13z" clip-rule="evenodd" />
            <path d="M8 6h4a1 1 0 110 2H8a1 1 0 110-2z" />
          </svg>
          Cắt ảnh
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

      <!-- Các nút hiển thị khi ở chế độ cắt và đã nhấp vào nút "Cắt ảnh" -->
      <div v-else-if="cropMode && isInCropMode" class="flex space-x-4">
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
      </div>
    </div>

    <!-- Nút tải xuống riêng - luôn hiển thị nếu có avatar và frame -->
    <button
      v-if="hasAvatarAndFrame && !cropMode"
      class="btn btn-primary flex items-center justify-center gap-2 px-6 py-3 text-base shadow-md hover:shadow-lg active:shadow-none active:translate-y-0.5 download-btn fixed bottom-10 right-10"
      @click="$emit('export', 'png')"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
      Tải xuống
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  avatar: {
    type: Object,
    required: true
  },
  background: {
    type: Object,
    required: true
  },
  cropMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'upload-avatar',
  'start-crop',
  'apply-crop',
  'cancel-crop',
  'export'
])

// Kiểm tra xem có cả avatar và frame không
const hasAvatarAndFrame = computed(() => {
  return props.avatar && props.avatar.image && props.background && props.background.image
})

// Trạng thái để theo dõi xem người dùng đã nhấp vào nút "Cắt ảnh" chưa
const isInCropMode = ref(false)

// Khi người dùng nhấp vào nút "Cắt ảnh"
const startCrop = () => {
  isInCropMode.value = true
  emit('start-crop')
}

// Khi người dùng nhấp vào nút "Xác nhận"
const applyCrop = () => {
  isInCropMode.value = false
  emit('apply-crop')
}

// Khi người dùng nhấp vào nút "Hủy"
const cancelCrop = () => {
  isInCropMode.value = false
  emit('cancel-crop')
}

// Reset isInCropMode khi cropMode thay đổi về false
watch(() => props.cropMode, (newValue) => {
  if (!newValue) {
    isInCropMode.value = false
  }
})

// Ghi log để debug
watch(() => ({
  hasAvatarAndFrame: hasAvatarAndFrame.value,
  avatar: props.avatar?.image ? 'yes' : 'no',
  background: props.background?.image ? 'yes' : 'no',
  cropMode: props.cropMode,
  isInCropMode: isInCropMode.value
}), (newValue) => {
  console.log('EditorControls state:', newValue)
})
</script>
