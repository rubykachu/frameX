<template>
  <!-- Hidden file inputs -->
  <input
    type="file"
    ref="avatarInput"
    @change="onAvatarFileSelected"
    accept="image/png,image/jpeg,image/svg+xml"
    class="hidden"
  />
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  accept: {
    type: String,
    default: 'image/png,image/jpeg,image/svg+xml'
  }
})

const emit = defineEmits(['file-selected'])

// Refs
const avatarInput = ref(null)

// Methods
const triggerFileInput = () => {
  avatarInput.value?.click()
}

const onAvatarFileSelected = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  emit('file-selected', file)

  // Reset input so the same file can be selected again
  event.target.value = ''
}

// Expose methods to parent component
defineExpose({
  triggerFileInput
})
</script>
