<template>
  <div class="h-full flex flex-col">
    <h2 class="text-xl font-semibold mb-4">{{ title }}</h2>

    <!-- Upload Section -->
    <div class="mb-4">
      <h3 class="text-base font-medium mb-2">Upload Your Frame</h3>
      <button
        class="w-full btn btn-outline flex items-center justify-center gap-2 py-2"
        @click="triggerFileInput"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
        </svg>
        Browse Files
      </button>
      <input
        type="file"
        ref="fileInput"
        class="hidden"
        accept="image/*"
        @change="handleFileSelected"
      />
    </div>

    <!-- Categories -->
    <div class="mb-4">
      <div class="flex justify-between items-center mb-2">
        <h3 class="text-base font-medium">Categories</h3>
        <button
          class="text-sm text-teal-600 hover:text-teal-700"
          @click="viewAll"
        >
          View All
        </button>
      </div>

      <div class="space-y-1">
        <button
          v-for="category in categories"
          :key="category.id"
          class="w-full text-left px-3 py-2 rounded-md transition-colors"
          :class="selectedCategory === category.id ? 'bg-teal-50 text-teal-700' : 'hover:bg-gray-100 text-gray-700'"
          @click="selectCategory(category.id)"
        >
          {{ category.name }}
        </button>
      </div>
    </div>

    <!-- Available Frames -->
    <div class="flex-1 overflow-y-auto">
      <h3 class="text-base font-medium mb-2">Available Frames</h3>

      <div class="grid grid-cols-2 gap-3">
        <div
          v-for="frame in filteredFrames"
          :key="frame.id"
          class="relative aspect-square border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
          :class="{'ring-2 ring-teal-500': selectedFrame === frame.id}"
          @click="previewFrame(frame)"
        >
          <img
            :src="frame.thumbnail || frame.url"
            :alt="frame.name || 'Frame'"
            class="w-full h-full object-cover"
          />

          <!-- Preview Overlay -->
          <div
            class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
          >
            <button
              class="bg-white rounded-full p-1 shadow-md"
              @click.stop="previewFrame(frame)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <div v-if="showPreview" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-4 max-w-lg w-full max-h-[90vh] flex flex-col">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium">
            {{ previewingFrame?.isUploaded ? 'Uploaded Frame Preview' : 'Frame Preview' }}
            <span v-if="previewingFrame?.name" class="text-sm font-normal text-gray-500 ml-2">
              {{ previewingFrame.name }}
            </span>
          </h3>
          <button @click="showPreview = false" class="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-hidden flex items-center justify-center">
          <img
            :src="previewFrameUrl"
            alt="Frame Preview"
            class="max-w-full max-h-[60vh] object-contain"
          />
        </div>

        <div class="mt-4 flex justify-end space-x-2">
          <button
            class="btn btn-outline px-4 py-2"
            @click="showPreview = false"
          >
            Close
          </button>
          <button
            class="btn btn-primary px-4 py-2"
            @click="selectAndClosePreview"
          >
            {{ previewingFrame?.isUploaded ? 'Use Uploaded Frame' : 'Use This Frame' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: 'Frames'
  },
  frames: {
    type: Array,
    default: () => []
  },
  categories: {
    type: Array,
    default: () => [
      { id: 'all', name: 'All Frames' },
      { id: 'holidays', name: 'Holidays' },
      { id: 'business', name: 'Business' }
    ]
  }
})

const emit = defineEmits(['frame-selected', 'frame-uploaded'])

// Refs
const fileInput = ref(null)
const selectedCategory = ref('all')
const selectedFrame = ref(null)
const showPreview = ref(false)
const previewFrameUrl = ref('')
const previewingFrame = ref(null)

// Computed
const filteredFrames = computed(() => {
  if (selectedCategory.value === 'all') {
    return props.frames
  }
  return props.frames.filter(frame => frame.category === selectedCategory.value)
})

// Methods
const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileSelected = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Create a URL for the selected file
  const url = URL.createObjectURL(file)

  // Create a frame-like object for the uploaded file
  const uploadedFrame = {
    id: 'uploaded-' + Date.now(),
    name: file.name,
    url: url,
    file: file,
    isUploaded: true
  }

  // Show preview
  previewFrameUrl.value = url
  previewingFrame.value = uploadedFrame
  showPreview.value = true

  // Reset input to allow selecting the same file again
  event.target.value = null
}

const selectCategory = (categoryId) => {
  selectedCategory.value = categoryId
}

const viewAll = () => {
  selectedCategory.value = 'all'
}

const selectFrame = (frame) => {
  selectedFrame.value = frame.id

  // Show preview when a frame is selected
  previewFrameUrl.value = frame.thumbnail || frame.url
  previewingFrame.value = frame
  showPreview.value = true

  // Still emit the event for parent components that need it
  emit('frame-selected', frame)
}

const previewFrame = (frame) => {
  previewFrameUrl.value = frame.thumbnail || frame.url
  previewingFrame.value = frame
  showPreview.value = true
}

const selectAndClosePreview = () => {
  if (previewingFrame.value) {
    if (previewingFrame.value.isUploaded) {
      // If it's an uploaded file
      emit('frame-uploaded', {
        file: previewingFrame.value.file,
        url: previewingFrame.value.url,
        name: previewingFrame.value.name,
        id: previewingFrame.value.id
      })
    } else {
      // If it's a frame from the gallery
      selectedFrame.value = previewingFrame.value.id
      emit('frame-selected', previewingFrame.value)
    }
    showPreview.value = false
  }
}
</script>
