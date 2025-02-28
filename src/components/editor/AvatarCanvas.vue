<template>
  <div class="relative aspect-square bg-gray-100 rounded-lg mb-4 flex-1 border border-gray-100">
    <div class="absolute inset-0" ref="stageContainer">
      <v-stage
        ref="stage"
        :config="stageConfig"
        @click="handleStageClick"
        @mousedown="handleMouseDown"
        @touchstart="handleTouchStart"
      >
        <!-- Main Layer (Avatar) -->
        <v-layer ref="layer">
          <!-- Avatar Image -->
          <v-image
            v-if="avatar.image"
            :config="{
              ...avatar.config,
              id: 'avatar',
              draggable: true,
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
            @click="handleNodeClick"
          />

          <!-- Frame Image -->
          <v-image
            v-if="background.image"
            :config="{
              ...background.config,
              id: 'frame',
              draggable: true,
              listening: true
            }"
            @dragstart="handleDragStart"
            @dragmove="handleDragMove('frame')"
            @dragend="updatePosition('frame')"
            @transformstart="handleTransformStart"
            @transformend="handleTransform('frame')"
            @click="handleNodeClick"
          />

          <!-- Transformer for selected object -->
          <v-transformer
            v-if="selectedId && !cropMode"
            ref="transformer"
            :config="transformerConfig"
          />

          <!-- Crop Rectangle -->
          <v-transformer
            v-if="cropMode"
            ref="cropTransformer"
            :config="{
              ...transformerConfig,
              enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
              boundBoxFunc: (oldBox, newBox) => {
                // Ensure minimum size
                if (newBox.width < 50 || newBox.height < 50) {
                  return oldBox
                }
                return newBox
              },
              zIndex: 3
            }"
          />
          <v-rect
            v-if="cropMode"
            :config="{
              ...cropConfig,
              id: 'crop'
            }"
            @dragend="updateCropPosition"
            @transformend="updateCropTransform"
          />
        </v-layer>

        <!-- Mask Layer -->
        <v-layer ref="maskLayer">
          <!-- Dark Overlay -->
          <v-rect
            :config="{
              x: 0,
              y: 0,
              width: stageConfig.width,
              height: stageConfig.height,
              fill: 'rgba(0,0,0,0.6)',
              listening: false
            }"
          />
          <!-- Circle Cutout -->
          <v-circle
            :config="{
              x: stageConfig.width / 2,
              y: stageConfig.height / 2,
              radius: Math.min(safeArea.width, safeArea.height) / 2,
              fill: 'black',
              globalCompositeOperation: 'destination-out',
              listening: false
            }"
          />
        </v-layer>
      </v-stage>
    </div>

    <!-- Upload Overlay - Show when no frame or no avatar -->
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
          {{ !background.image ? 'Chọn khung ảnh' : 'Thêm ảnh đại diện của bạn' }}
        </h3>
        <p class="text-gray-600 mb-6">
          {{ !background.image ? 'Chọn một khung từ gallery hoặc tải lên khung của bạn từ sidebar bên trái' : 'Tải lên ảnh đại diện để bắt đầu chỉnh sửa' }}
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
            Chọn ảnh
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'

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
  cropMode: {
    type: Boolean,
    default: false
  },
  cropConfig: {
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
  'update-crop-position',
  'update-crop-transform',
  'upload-avatar'
])

// Refs
const stage = ref(null)
const stageContainer = ref(null)
const layer = ref(null)
const maskLayer = ref(null)
const cropTransformer = ref(null)
const selectedId = ref(null)

// Methods
const handleStageClick = (e) => {
  emit('stage-click', e, stage.value)
}

const handleDragStart = (e) => {
  const target = e.target;

  // Thêm hiệu ứng khi kéo
  target.setAttr('dragging', true);
  target.getLayer().batchDraw();

  // Log để debug
  console.log('Started dragging avatar:', {
    id: target.id(),
    position: { x: target.x(), y: target.y() }
  });
}

const handleDragMove = (type) => {
  const node = stage.value.getNode().find(`#${type}`)[0];
  if (!node) return;

  // Log vị trí trong quá trình di chuyển
  console.log('Avatar moving:', {
    x: node.x(),
    y: node.y()
  });

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

  // Xóa hiệu ứng khi kết thúc kéo
  if (type === 'avatar') {
    node.setAttr('dragging', false);
  }

  // Log vị trí cuối cùng
  console.log('Final position:', {
    x: node.x(),
    y: node.y()
  });

  emit('update-position', type, node);
  node.getLayer().batchDraw();
}

const handleTransform = (type) => {
  const node = stage.value.getNode().find(`#${type}`)[0];
  if (!node) return;
  emit('update-transform', type, node);
}

const updateCropPosition = () => {
  const cropNode = stage.value.getNode().find('#crop')[0]
  if (!cropNode) return
  emit('update-crop-position', cropNode)
}

const updateCropTransform = () => {
  const cropNode = stage.value.getNode().find('#crop')[0]
  if (!cropNode) return
  emit('update-crop-transform', cropNode)
}

const handleMouseDown = (e) => {
  // Chỉ xử lý khi không ở chế độ cắt và có click vào avatar
  if (props.cropMode) return

  const target = e.target
  if (target.id() === 'avatar') {
    console.log('Avatar clicked')
  }
}

const handleTouchStart = (e) => {
  // Chỉ xử lý khi không ở chế độ cắt và có chạm vào avatar
  if (props.cropMode) return

  const touches = e.evt.touches
  if (touches && touches.length === 1) {
    const stageNode = stage.value.getNode()
    const pos = stageNode.getPointerPosition()
    const shape = stageNode.getIntersection(pos)

    if (shape && shape.id() === 'avatar') {
      console.log('Avatar touched')
    }
  }
}

const handleNodeClick = (e) => {
  // Get clicked node
  const clickedNode = e.target;
  const nodeId = clickedNode.id();

  // Update selection
  selectedId.value = nodeId;

  // Attach transformer to selected node
  const transformer = stage.value.getNode().find('Transformer')[0];
  if (transformer) {
    transformer.nodes([clickedNode]);
    layer.value.getNode().batchDraw();
  }
}

// Lifecycle hooks
onMounted(() => {
  emit('update-stage-size', stageContainer.value)
  window.addEventListener('resize', () => emit('update-stage-size', stageContainer.value))

  // Watch for selected node changes
  watch(() => selectedId.value, (newValue) => {
    if (newValue) {
      nextTick(() => {
        const node = stage.value.getNode().find(`#${newValue}`)[0];
        const transformer = stage.value.getNode().find('Transformer')[0];
        if (node && transformer) {
          transformer.nodes([node]);
          layer.value.getNode().batchDraw();
        }
      });
    }
  });

  // Update crop transformer when crop mode changes
  watch(() => props.cropMode, (newValue) => {
    if (newValue) {
      nextTick(() => {
        const cropNode = stage.value.getNode().find('#crop')[0]
        if (cropNode && cropTransformer.value) {
          cropTransformer.value.getNode().nodes([cropNode])
        }
      })
    }
  })

  // Đảm bảo frame luôn ở trên cùng khi component được mount
  nextTick(() => {
    const frameNode = stage.value?.getNode()?.find('#frame')?.[0]
    if (frameNode) {
      frameNode.moveToTop()
      layer.value.getNode().draw()
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', () => emit('update-stage-size', stageContainer.value))
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
</style>
