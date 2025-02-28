<template>
  <div class="flex-1">
    <!-- Avatar Canvas -->
    <AvatarCanvas
      ref="canvasRef"
      :stage-config="editor.stageConfig"
      :background="editor.background"
      :avatar="editor.avatar"
      :safe-area="editor.safeArea"
      :crop-mode="editor.cropMode"
      :crop-config="editor.cropConfig"
      :transformer-config="editor.transformerConfig"
      @update-stage-size="handleUpdateStageSize"
      @stage-click="handleStageClick"
      @update-position="handleUpdatePosition"
      @update-transform="handleUpdateTransform"
      @update-crop-position="handleUpdateCropPosition"
      @update-crop-transform="handleUpdateCropTransform"
      @upload-avatar="handleUploadAvatar"
    />

    <!-- Editor Controls -->
    <EditorControls
      :avatar="editor.avatar"
      :background="editor.background"
      :crop-mode="editor.cropMode"
      @upload-avatar="handleUploadAvatar"
      @start-crop="handleStartCrop"
      @apply-crop="handleApplyCrop"
      @cancel-crop="handleCancelCrop"
      @export="handleExport"
    />

    <!-- Image Uploader -->
    <ImageUploader
      ref="uploaderRef"
      @file-selected="handleAvatarFileSelected"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useImageEditor } from '../../composables/useImageEditor'
import AvatarCanvas from './AvatarCanvas.vue'
import EditorControls from './EditorControls.vue'
import ImageUploader from './ImageUploader.vue'

const props = defineProps({
  initialFrame: {
    type: Object,
    default: null
  }
})

const emit = defineEmits([
  'frame-selected',
  'avatar-uploaded',
  'export-complete'
])

// Initialize editor composable
const editor = useImageEditor()

// Refs
const canvasRef = ref(null)
const uploaderRef = ref(null)

// Methods
const handleUpdateStageSize = (container) => {
  editor.updateStageSize(container)
}

const handleStageClick = (e, stage) => {
  editor.handleStageClick(e, stage)
}

const handleUpdatePosition = (type, node) => {
  editor.updatePosition(type, node)
}

const handleUpdateTransform = (type, node) => {
  editor.updateTransform(type, node)
}

const handleUpdateCropPosition = (node) => {
  editor.updateCropPosition(node)
}

const handleUpdateCropTransform = (node) => {
  editor.updateCropTransform(node)
}

const handleUploadAvatar = () => {
  uploaderRef.value?.triggerFileInput()
}

const handleAvatarFileSelected = async (file) => {
  try {
    await editor.handleAvatarUpload(file)
    emit('avatar-uploaded', file)
  } catch (error) {
    console.error('Error uploading avatar:', error)
  }
}

const handleStartCrop = () => {
  editor.startCrop(canvasRef.value.stage)
}

const handleApplyCrop = () => {
  editor.applyCrop(canvasRef.value.stage)
}

const handleCancelCrop = () => {
  editor.cancelCrop()
}

const handleExport = (format) => {
  editor.handleExport(format, canvasRef.value.stage)
  emit('export-complete', format)
}

// Frame handling
const handleSelectFrame = (frame) => {
  editor.handleSelectFrame(frame)
  emit('frame-selected', frame)
}

const handleFrameUpload = async (file) => {
  try {
    await editor.handleBackgroundUpload(file)
    emit('frame-selected', { custom: true, file })
  } catch (error) {
    console.error('Error uploading frame:', error)
  }
}

const handleFrameFromUrl = async (url) => {
  try {
    await editor.handleFrameFromUrl(url)
    emit('frame-selected', { custom: true, url })
  } catch (error) {
    console.error('Error loading frame from URL:', error)
  }
}

// Lifecycle hooks
onMounted(() => {
  // Create temporary container for export
  const tempContainer = document.createElement('div')
  tempContainer.id = 'temp-container'
  tempContainer.style.display = 'none'
  document.body.appendChild(tempContainer)

  // Load initial frame if provided
  if (props.initialFrame) {
    handleSelectFrame(props.initialFrame)
  }
})

onUnmounted(() => {
  // Remove temporary container
  const tempContainer = document.getElementById('temp-container')
  if (tempContainer) {
    document.body.removeChild(tempContainer)
  }
})

// Expose methods to parent component
defineExpose({
  handleSelectFrame,
  handleFrameUpload,
  handleFrameFromUrl
})
</script>
