<template>
  <aside class="w-64 h-full bg-white border border-gray-200 overflow-y-auto rounded-lg">
    <div class="p-4">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">Frame Gallery</h2>

      <!-- Upload Frame -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Upload Your Frame
        </label>
        <div class="relative">
          <input
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            @change="onFrameSelected"
            class="hidden"
            ref="fileInput"
          />
          <button
            @click="$refs.fileInput.click()"
            class="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
            Browse Files
          </button>
        </div>
      </div>

      <!-- Frame Categories -->
      <div class="mb-4">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-sm font-medium text-gray-700">Categories</h3>
          <button
            @click="showAllCategories = !showAllCategories"
            class="text-indigo-600 text-xs hover:underline focus:outline-none"
          >
            {{ showAllCategories ? 'Collapse' : 'View All' }}
          </button>
        </div>
        <div class="space-y-2">
          <button
            v-for="(category, index) in displayedCategories"
            :key="index"
            @click="selectCategory(category)"
            class="block w-full text-left px-3 py-2 text-sm rounded-md transition-colors"
            :class="selectedCategory === category.id ? 'bg-indigo-100 text-indigo-600 font-medium' : 'hover:bg-gray-100 text-gray-700'"
          >
            {{ category.name }}
          </button>
        </div>
      </div>

      <!-- Available Frames Grid -->
      <div>
        <h3 class="text-sm font-medium text-gray-700 mb-2">Available Frames</h3>
        <div class="grid grid-cols-2 gap-2">
          <div
            v-for="(frame, index) in filteredFrames"
            :key="index"
            @click="previewFrame(frame)"
            class="relative aspect-square border rounded-md cursor-pointer hover:border-indigo-500 transition-colors p-1"
            :class="selectedFrameId === frame.id ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'"
          >
            <img
              :src="frame.thumbnail"
              alt="Frame thumbnail"
              class="w-full h-full object-contain"
            />
          </div>

          <!-- No frames message -->
          <div v-if="filteredFrames.length === 0" class="col-span-2 py-4 text-center text-gray-500 text-sm">
            No frames available in this category
          </div>
        </div>
      </div>
    </div>
  </aside>

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
          class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          @click="showPreview = false"
        >
          Close
        </button>
        <button
          class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          @click="selectAndClosePreview"
        >
          {{ previewingFrame?.isUploaded ? 'Use Uploaded Frame' : 'Use This Frame' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// Emits
const emit = defineEmits(['select-frame', 'upload-frame']);

// Categories - initialize as empty array, will be loaded from JSON
const categories = ref([]);

const showAllCategories = ref(false);
const selectedCategory = ref('all');

const displayedCategories = computed(() => {
  return showAllCategories.value ? categories.value : categories.value.slice(0, 3);
});

/**
 * Helper function to get the correct path for frame images
 * @param {string} path - The image path or URL
 * @returns {string} - The complete path or URL
 */
function getFramePath(path) {
  // If it's a URL (starts with http or https), return it as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Otherwise, it's a local path - prepend with the base URL
  return `/assets/frames/${path}`;
}

// Initialize empty frames array
const frames = ref([]);

const selectedFrameId = ref(null);
const showPreview = ref(false);
const previewFrameUrl = ref('');
const previewingFrame = ref(null);

// Methods
const filteredFrames = computed(() => {
  if (selectedCategory.value === 'all') {
    return frames.value;
  }
  return frames.value.filter(frame => frame.category === selectedCategory.value);
});

const selectCategory = (category) => {
  selectedCategory.value = category.id;
};

const selectFrame = (frame) => {
  selectedFrameId.value = frame.id;
  emit('select-frame', frame);
};

const previewFrame = (frame) => {
  // Use the correct source based on whether it's a remote or local frame
  previewFrameUrl.value = frame.src;
  previewingFrame.value = frame;
  showPreview.value = true;
};

const onFrameSelected = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Create a URL for the selected file
  const url = URL.createObjectURL(file);

  // Create a frame-like object for the uploaded file
  const uploadedFrame = {
    id: 'uploaded-' + Date.now(),
    name: file.name,
    thumbnail: url,
    src: url,
    file: file,
    isUploaded: true
  };

  // Show preview
  previewFrameUrl.value = url;
  previewingFrame.value = uploadedFrame;
  showPreview.value = true;

  // Reset input to allow selecting the same file again
  event.target.value = null;
};

const selectAndClosePreview = () => {
  if (previewingFrame.value) {
    if (previewingFrame.value.isUploaded) {
      // If it's an uploaded file - emit just the file object as expected by the parent component
      emit('upload-frame', previewingFrame.value.file);
    } else {
      // If it's a frame from the gallery
      selectedFrameId.value = previewingFrame.value.id;
      emit('select-frame', previewingFrame.value);
    }
    showPreview.value = false;
  }
};

// Fetch frames and categories data
onMounted(() => {
  // Load frames and categories from the JSON file
  async function loadData() {
    try {
      const response = await fetch('/assets/frames/frames.json');
      const data = await response.json();

      // Set categories
      categories.value = data.categories || [];

      // Default to 'all' category
      selectedCategory.value = 'all';

      // Process each frame to add the correct path and determine if it's remote
      const processedFrames = (data.frames || []).map(frame => ({
        ...frame,
        thumbnail: getFramePath(frame.thumbnail),
        src: getFramePath(frame.src),
        isRemote: frame.thumbnail.startsWith('http://') || frame.thumbnail.startsWith('https://')
      }));

      // Set the frames
      frames.value = processedFrames;
    } catch (error) {
      console.error('Error loading frames and categories:', error);
    }
  }

  loadData();
});
</script>

<style scoped>
/* Custom scrollbar for Webkit browsers */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: #c5c5c5;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a5a5a5;
}
</style>
