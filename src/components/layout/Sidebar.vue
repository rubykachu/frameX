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
            @click="selectFrame(frame)"
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
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// Emits
const emit = defineEmits(['select-frame', 'upload-frame']);

// Categories
const categories = ref([
  { id: 'all', name: 'All Frames' },
  { id: 'holidays', name: 'Holidays' },
  { id: 'business', name: 'Business' },
  { id: 'social', name: 'Social Media' },
  { id: 'personal', name: 'Personal' },
  { id: 'events', name: 'Events' },
  { id: 'decorative', name: 'Decorative' }
]);

const showAllCategories = ref(false);
const selectedCategory = ref('all');

const displayedCategories = computed(() => {
  return showAllCategories.value ? categories.value : categories.value.slice(0, 3);
});

// Sample frames data - in a real app, this would come from an API
const frames = ref([
  {
    id: 'frame1',
    thumbnail: 'https://via.placeholder.com/150/4f46e5/ffffff?text=Frame+1',
    src: 'https://via.placeholder.com/800/4f46e5/ffffff?text=Frame+1',
    category: 'social'
  },
  {
    id: 'frame2',
    thumbnail: 'https://via.placeholder.com/150/4f46e5/ffffff?text=Frame+2',
    src: 'https://via.placeholder.com/800/4f46e5/ffffff?text=Frame+2',
    category: 'business'
  },
  {
    id: 'frame3',
    thumbnail: 'https://via.placeholder.com/150/4f46e5/ffffff?text=Frame+3',
    src: 'https://via.placeholder.com/800/4f46e5/ffffff?text=Frame+3',
    category: 'personal'
  },
  {
    id: 'frame4',
    thumbnail: 'https://via.placeholder.com/150/4f46e5/ffffff?text=Frame+4',
    src: 'https://via.placeholder.com/800/4f46e5/ffffff?text=Frame+4',
    category: 'events'
  }
]);

const selectedFrameId = ref(null);

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

const onFrameSelected = (event) => {
  const file = event.target.files[0];
  if (file) {
    emit('upload-frame', file);
  }
};

// Fetch frames data
onMounted(() => {
  // In a real app, you would fetch frames from an API here
  // frames.value = await fetchFrames();
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
