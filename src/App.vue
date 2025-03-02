<template>
  <div class="min-h-screen flex flex-col">
    <Header />

    <main class="container mx-auto px-4 py-8 flex-1">
      <!-- Responsive layout with improved space distribution -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Sidebar with improved width on larger screens -->
        <div class="lg:col-span-4 xl:col-span-3">
          <Sidebar
            @select-frame="handleSelectFrame"
            @upload-frame="handleFrameUpload"
          />
        </div>

        <!-- Image Editor with responsive width -->
        <div class="lg:col-span-8 xl:col-span-9">
          <ImageEditor
            ref="editorRef"
            :initial-frame="initialFrame"
            @frame-selected="handleFrameSelected"
            @avatar-uploaded="handleAvatarUploaded"
          />
        </div>
      </div>
    </main>

    <Footer />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Header from './components/layout/Header.vue'
import Footer from './components/layout/Footer.vue'
import Sidebar from './components/layout/Sidebar.vue'
import ImageEditor from './components/editor/ImageEditor.vue'

const editorRef = ref(null)
const initialFrame = ref(null)

// Các phương thức xử lý
const handleSelectFrame = (frame) => {
  console.log("App: Frame đã được chọn:", frame);
  editorRef.value?.handleSelectFrame(frame)
}

const handleFrameUpload = (file) => {
  console.log("App: Frame đã được upload:", file.name);
  editorRef.value?.handleFrameUpload(file)
}

const handleFrameSelected = (frame) => {
  console.log('Frame selected:', frame)
}

const handleAvatarUploaded = (file) => {
  console.log('Avatar uploaded:', file.name)
}
</script>

<style>
.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-all duration-200;
}

.btn-primary {
  @apply bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Custom range input styling */
input[type="range"] {
  @apply h-2 rounded-lg bg-gray-200;
  -webkit-appearance: none;
}

input[type="range"]::-webkit-slider-thumb {
  @apply w-6 h-6 rounded-full bg-teal-600 cursor-pointer shadow-md;
  -webkit-appearance: none;
  margin-top: -8px;
}

input[type="range"]::-moz-range-thumb {
  @apply w-6 h-6 rounded-full bg-teal-600 cursor-pointer shadow-md border-0;
}

input[type="range"]::focus {
  @apply outline-none;
}

input[type="range"]::-webkit-slider-thumb {
  @apply ring-4 ring-teal-200;
}

input[type="range"]::-moz-range-thumb {
  @apply ring-4 ring-teal-200;
}

/* Container styles */
.canvas-container {
  @apply bg-white rounded-xl shadow-lg overflow-hidden;
}

/* Button group styles */
.button-group {
  @apply flex justify-center space-x-4 mt-6;
}

.button-group button {
  @apply min-w-[100px];
}

/* Scale control styles */
.scale-control {
  @apply flex items-center space-x-4 px-6 py-4 bg-white rounded-lg shadow-md;
}

.scale-control button {
  @apply p-2 text-gray-600 hover:text-gray-900 transition-colors;
}

/* Upload overlay styles */
.upload-overlay {
  @apply bg-white transition-all duration-300;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Step indicator styles */
.step-indicator {
  @apply flex items-center justify-center mb-6;
}

.step-indicator-item {
  @apply w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300;
}

.step-indicator-line {
  @apply w-16 h-1 transition-all duration-300;
}

/* Button hover effects */
.btn {
  @apply transform transition-all duration-200;
}

.btn:hover {
  @apply shadow-md -translate-y-0.5;
}

.btn:active {
  @apply shadow-none translate-y-0;
}

/* Canvas container with improved styling */
.relative.aspect-square {
  @apply bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100;
  transition: all 0.3s ease;
}

/* Download button pulse animation */
@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(13, 148, 136, 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(13, 148, 136, 0);
  }
}

.btn-primary.download-btn {
  animation: pulse 2s infinite;
}

/* Improved scale control */
.scale-control {
  @apply bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden;
}

/* Add smooth transitions */
.v-stage, .v-layer, .v-image {
  transition: transform 0.2s ease-out;
}
</style>
