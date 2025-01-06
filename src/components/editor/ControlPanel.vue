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
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Avatar Image</label>
          <input
            type="file"
            accept="image/png,image/jpeg"
            class="input-file"
            @change="handleAvatarUpload"
          />
        </div>
      </div>
    </section>

    <!-- Transform Controls -->
    <section v-if="hasImages">
      <h3 class="text-lg font-medium mb-4">Transform Controls</h3>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Scale</label>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            v-model="scale"
            class="w-full"
          />
        </div>
        <div class="flex space-x-4">
          <button class="btn flex-1" @click="rotateLeft">
            Rotate Left
          </button>
          <button class="btn flex-1" @click="rotateRight">
            Rotate Right
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
          <select v-model="exportFormat" class="w-full p-2 border border-border rounded-lg">
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
          </select>
        </div>
        <button class="btn btn-primary w-full" @click="exportImage">
          Download Image
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const hasImages = ref(false)
const scale = ref(1)
const exportFormat = ref('png')

const handleBackgroundUpload = (event) => {
  // Will implement in next steps
}

const handleAvatarUpload = (event) => {
  // Will implement in next steps
}

const rotateLeft = () => {
  // Will implement in next steps
}

const rotateRight = () => {
  // Will implement in next steps
}

const exportImage = () => {
  // Will implement in next steps
}
</script>
