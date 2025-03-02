<template>
  <!-- Layout Container -->
  <div class="flex gap-4 h-full" ref="editorContainer">
    <!-- Canvas Area -->
    <div class="relative aspect-square bg-gray-100 rounded-lg flex-1 border border-gray-100">
      <div class="absolute inset-0" ref="stageContainer">
        <v-stage
          ref="stage"
          :config="stageConfig"
          @click="handleStageClick"
          @mousedown="handleMouseDown"
          @touchstart="handleTouchStart"
        >
          <v-layer ref="mainLayer">
            <!-- Avatar Image (Below) -->
            <v-image
              v-if="avatar.image"
              :config="{
                ...avatar.config,
                id: 'avatar',
                draggable: selectedId === 'avatar',
                listening: selectedId === 'avatar',
                x: avatar.config.x,
                y: avatar.config.y,
                scaleX: avatar.config.scaleX,
                scaleY: avatar.config.scaleY,
                rotation: avatar.config.rotation || 0
              }"
              @dragstart="handleDragStart"
              @dragmove="handleDragMove('avatar')"
              @dragend="updatePosition('avatar')"
              @transformstart="handleTransformStart"
              @transformend="handleTransform('avatar')"
            />

            <!-- Frame Image (Above) -->
            <v-image
              v-if="background.image"
              :config="{
                ...background.config,
                id: 'frame',
                draggable: selectedId === 'frame',
                listening: selectedId === 'frame'
              }"
              @dragstart="handleDragStart"
              @dragmove="handleDragMove('frame')"
              @dragend="updatePosition('frame')"
              @transformstart="handleTransformStart"
              @transformend="handleTransform('frame')"
            />

            <!-- Transformer for selected object -->
            <v-transformer
              v-if="selectedId"
              ref="transformer"
              :config="transformerConfig"
            />
          </v-layer>

          <!-- Mask Layer -->
          <v-layer ref="maskLayer">
            <v-rect
              :config="{
                x: 0,
                y: 0,
                width: stageConfig.width,
                height: stageConfig.height,
                fill: 'rgba(255,255,255,0)',
                listening: false
              }"
            />

            <!-- Horizontal grid lines -->
            <v-line
              v-for="(_, index) in Array(20)"
              :key="`h-${index}`"
              :config="{
                points: [
                  0,
                  (index + 1) * (stageConfig.height / 20),
                  stageConfig.width,
                  (index + 1) * (stageConfig.height / 20)
                ],
                stroke: 'rgba(200, 200, 200, 0.4)',
                strokeWidth: 1,
                dash: [5, 5],
                listening: false
              }"
            />

            <!-- Vertical grid lines -->
            <v-line
              v-for="(_, index) in Array(20)"
              :key="`v-${index}`"
              :config="{
                points: [
                  (index + 1) * (stageConfig.width / 20),
                  0,
                  (index + 1) * (stageConfig.width / 20),
                  stageConfig.height
                ],
                stroke: 'rgba(200, 200, 200, 0.4)',
                strokeWidth: 1,
                dash: [5, 5],
                listening: false
              }"
            />

            <!-- Center lines (slightly darker) -->
            <v-line
              :config="{
                points: [
                  0,
                  stageConfig.height / 2,
                  stageConfig.width,
                  stageConfig.height / 2
                ],
                stroke: 'rgba(150, 150, 150, 0.7)',
                strokeWidth: 1,
                dash: [5, 5],
                listening: false
              }"
            />
            <v-line
              :config="{
                points: [
                  stageConfig.width / 2,
                  0,
                  stageConfig.width / 2,
                  stageConfig.height
                ],
                stroke: 'rgba(150, 150, 150, 0.5)',
                strokeWidth: 1,
                dash: [5, 5],
                listening: false
              }"
            />

            <!-- Frame boundary indicator (based on safe area) -->
            <v-rect
              :config="{
                x: (stageConfig.width - safeArea.width) / 2,
                y: (stageConfig.height - safeArea.height) / 2,
                width: safeArea.width,
                height: safeArea.height,
                stroke: 'rgba(100, 100, 100, 0.1)',
                strokeWidth: 2,
                dash: [10, 5],
                listening: false
              }"
            />
          </v-layer>
        </v-stage>
      </div>

      <!-- Upload Overlay -->
      <div v-if="!background.image || !avatar.image"
           class="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-lg z-10">
        <div class="text-center p-6 max-w-md">
          <!-- Step indicator -->
          <div class="flex items-center justify-center mb-4 step-indicator">
            <div class="w-8 h-8 rounded-full flex items-center justify-center"
                 :class="background.image ? 'bg-teal-100 text-teal-700' : 'bg-teal-600 text-white'">1</div>
            <div class="w-16 h-1" :class="background.image ? 'bg-teal-100' : 'bg-gray-200'"></div>
            <div class="w-8 h-8 rounded-full flex items-center justify-center"
                 :class="avatar.image ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-600'">2</div>
          </div>

          <!-- Instruction text -->
          <h3 class="text-xl font-medium text-gray-800 mb-2">
            {{ !background.image ? 'Choose a Frame' : 'Upload Your Avatar' }}
          </h3>
          <p class="text-gray-600 mb-6">
            {{ !background.image ? 'Select a frame from the gallery or upload your own from the left sidebar' : 'Upload your avatar to start editing' }}
          </p>


          <!-- Action buttons -->
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              v-if="background.image && !avatar.image"
              class="btn btn-primary flex items-center justify-center gap-2 px-6 py-3 text-base"
              @click="$emit('upload-avatar')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
              </svg>
              Choose Avatar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Layer Panel -->
    <!-- <div class="w-64 bg-white rounded-lg p-4 border border-gray-200 layer-panel"> -->
    <div class="w-64 bg-white border border-gray-200 rounded-lg layer-panel">
      <div class="p-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-800">Layers</h2>
      </div>

      <!-- Layer List -->
      <div class="space-y-2 p-4">
        <!-- Frame Layer -->
        <div
          v-if="background.image"
          class="flex items-center p-2 rounded cursor-pointer"
          :class="{ 'bg-teal-50 ring-1 ring-teal-500': selectedId === 'frame' }"
          @click="handleLayerSelect('frame')"
        >
          <div class="flex-1">
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h12v7H4V5z" clip-rule="evenodd" />
              </svg>
              <span class="font-medium text-gray-700">Frame</span>
            </div>
            <div class="text-xs text-gray-500 mt-1" v-if="background.image">
              {{ background.image.width }}x{{ background.image.height }}px
            </div>
          </div>
          <button
            class="p-1 hover:bg-teal-100 rounded"
            @click.stop="toggleLayerVisibility('frame')"
          >
            <svg v-if="layerVisibility.frame" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
              <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
            </svg>
          </button>
        </div>

        <!-- Avatar Layer -->
        <div
          v-if="avatar.image"
          class="flex items-center p-2 rounded cursor-pointer"
          :class="{ 'bg-teal-50 ring-1 ring-teal-500': selectedId === 'avatar' }"
          @click="handleLayerSelect('avatar')"
        >
          <div class="flex-1">
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
              </svg>
              <span class="font-medium text-gray-700">Avatar</span>
            </div>
            <div class="text-xs text-gray-500 mt-1" v-if="avatar.image">
              {{ avatar.image.width }}x{{ avatar.image.height }}px
            </div>
          </div>
          <button
            class="p-1 hover:bg-teal-100 rounded"
            @click.stop="toggleLayerVisibility('avatar')"
          >
            <svg v-if="layerVisibility.avatar" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
              <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch, reactive } from 'vue'

const props = defineProps({
  stageConfig: {
    type: Object,
    required: true
  },
  background: {
    type: Object,
    required: true
  },
  avatar: {
    type: Object,
    required: true
  },
  safeArea: {
    type: Object,
    required: true
  },
  transformerConfig: {
    type: Object,
    required: true
  }
})

const emit = defineEmits([
  'update-stage-size',
  'stage-click',
  'update-position',
  'update-transform',
  'upload-avatar',
  'layer-visibility-change'
])

// Refs
const stage = ref(null)
const stageContainer = ref(null)
const mainLayer = ref(null)
const maskLayer = ref(null)
const selectedId = ref(null)
const editorContainer = ref(null)

// Layer visibility state
const layerVisibility = reactive({
  frame: true,
  avatar: true
})

// Methods
const handleStageClick = (e) => {
  // Only deselect when clicking on stage background
  if (e.target === stage.value.getNode()) {
    selectedId.value = null
    emit('stage-click', e, stage.value)
  }
}

const handleDragStart = (e) => {
  const target = e.target;
  const id = target.id();

  // Only allow drag if layer is already selected
  if (selectedId.value !== id) return;

  target.setAttr('dragging', true);
  target.getLayer().batchDraw();

  console.log(`Started dragging ${id}:`, {
    position: { x: target.x(), y: target.y() }
  });
}

const handleDragMove = (type) => {
  const node = stage.value.getNode().find(`#${type}`)[0];
  if (!node) return;

  // Get stage boundaries
  const stageBox = {
    x: 0,
    y: 0,
    width: props.stageConfig.width,
    height: props.stageConfig.height
  };

  // Calculate node boundaries with scale
  const scale = {
    x: node.scaleX(),
    y: node.scaleY()
  };
  const width = node.width() * scale.x;
  const height = node.height() * scale.y;

  // Calculate new position with boundaries
  let newX = Math.max(stageBox.x, Math.min(node.x(), stageBox.width - width));
  let newY = Math.max(stageBox.y, Math.min(node.y(), stageBox.height - height));

  // Update node position
  node.position({
    x: newX,
    y: newY
  });

  // Ensure frame stays on top
  if (type === 'avatar') {
    const frameNode = stage.value.getNode().find('#frame')[0];
    if (frameNode) {
      frameNode.moveToTop();
    }
  }

  emit('update-position', type, node);
  node.getLayer().batchDraw();
}

const handleTransformStart = (e) => {
  // Đánh dấu bắt đầu biến đổi (scale/rotate)
  const id = e.target.id()
  console.log(`Started transforming ${id}`)
}

const updatePosition = (type) => {
  const node = stage.value.getNode().find(`#${type}`)[0];
  if (!node) return;

  // Remove dragging effect
  node.setAttr('dragging', false);

  // Ensure frame stays on top after drag
  if (type === 'avatar') {
    const frameNode = stage.value.getNode().find('#frame')[0];
    if (frameNode) {
      frameNode.moveToTop();
    }
  }

  emit('update-position', type, node);
  node.getLayer().batchDraw();
}

const handleTransform = (type) => {
  const node = stage.value.getNode().find(`#${type}`)[0];
  if (!node) return;
  emit('update-transform', type, node);
}

const handleMouseDown = () => {}
const handleTouchStart = () => {}

const handleLayerSelect = (type) => {
  // Don't select if layer is hidden
  if (!layerVisibility[type]) return;

  // If clicking on already selected layer, deselect it
  if (selectedId.value === type) {
    selectedId.value = null;
    const transformer = stage.value.getNode().find('Transformer')[0];
    if (transformer) {
      transformer.nodes([]);
      mainLayer.value.getNode().batchDraw();
    }
    return;
  }

  selectedId.value = type;
  const node = stage.value.getNode().find(`#${type}`)[0];
  const transformer = stage.value.getNode().find('Transformer')[0];

  if (node && transformer) {
    transformer.nodes([node]);
    mainLayer.value.getNode().batchDraw();
  }
}

const toggleLayerVisibility = (type) => {
  const node = stage.value.getNode().find(`#${type}`)[0]
  if (node) {
    const newVisibility = !node.visible()
    layerVisibility[type] = newVisibility
    node.visible(newVisibility)

    // If hiding selected layer, deselect it
    if (!newVisibility && selectedId.value === type) {
      selectedId.value = null
    }

    mainLayer.value.getNode().batchDraw()
    emit('layer-visibility-change', { type, visible: newVisibility })
  }
}

// Hàm để hủy chọn object khi click ra ngoài
const handleOutsideClick = (e) => {
  // Kiểm tra xem đã chọn object nào chưa
  if (!selectedId.value) return;

  // Kiểm tra xem click có phải là bên trong stage container không
  const stageEl = stage.value?.getNode()?.getStage().container();
  const editorEl = editorContainer.value;

  // Nếu click không phải trong stage container và không phải trong editor container
  // hoặc click vào editor container nhưng không phải vào stage hoặc layer panel
  if (!stageEl?.contains(e.target) &&
      (!editorEl?.contains(e.target) ||
       (editorEl?.contains(e.target) && !e.target.closest('.layer-panel') && !stageEl?.contains(e.target)))) {
    // Hủy chọn object
    selectedId.value = null;

    // Cập nhật transformer
    const transformer = stage.value?.getNode()?.find('Transformer')[0];
    if (transformer) {
      transformer.nodes([]);
      mainLayer.value?.getNode()?.batchDraw();
    }

    // Thông báo cho component cha
    emit('stage-click', null, stage.value);
  }
}

// Lifecycle hooks
onMounted(() => {
  emit('update-stage-size', stageContainer.value)

  const handleResize = () => {
    emit('update-stage-size', stageContainer.value)
  }

  window.addEventListener('resize', handleResize)

  // Thêm event listener cho click bên ngoài
  document.addEventListener('mousedown', handleOutsideClick)
  document.addEventListener('touchstart', handleOutsideClick)

  // Watch for selected node changes
  watch(() => selectedId.value, (newValue) => {
    if (newValue) {
      nextTick(() => {
        const node = stage.value.getNode().find(`#${newValue}`)[0]
        const transformer = stage.value.getNode().find('Transformer')[0]
        if (node && transformer) {
          transformer.nodes([node])
          mainLayer.value.getNode().batchDraw()
        }
      })
    }
  })

  // Ensure frame is always rendered above avatar
  nextTick(() => {
    const frameNode = stage.value?.getNode()?.find('#frame')?.[0]
    if (frameNode) {
      frameNode.moveToTop()
      mainLayer.value.getNode().draw()
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)

  // Xóa event listener khi component bị hủy
  document.removeEventListener('mousedown', handleOutsideClick)
  document.removeEventListener('touchstart', handleOutsideClick)
})

// Expose stage to parent component
defineExpose({
  stage
})
</script>

<style scoped>
/* Cải thiện trải nghiệm kéo thả */
.v-stage {
  touch-action: none; /* Ngăn chặn hành vi mặc định của trình duyệt trên thiết bị cảm ứng */
}

/* Cursor khi hover lên avatar */
:deep(.konvajs-content) {
  cursor: default;
}

:deep([id="avatar"]) {
  cursor: move !important;
}

/* Thêm hiệu ứng cho avatar khi được kéo */
:deep(.dragging) {
  filter: brightness(1.05);
}

/* Cải thiện hiển thị trên thiết bị di động */
@media (max-width: 768px) {
  .v-stage {
    width: 100% !important;
    height: auto !important;
  }
}

/* Thêm class cho layer panel để dễ select */
.layer-panel {
  position: relative;
  z-index: 10;
}
</style>
