import { ref, reactive, computed, nextTick } from 'vue'
import Konva from 'konva'

// Constants for Facebook avatar dimensions
const FB_AVATAR_SIZE = 500 // Facebook recommends 500x500px

export function useImageEditor() {
  // Stage configuration
  const stageConfig = reactive({
    width: FB_AVATAR_SIZE,
    height: FB_AVATAR_SIZE
  })

  // Image states
  const background = reactive({
    image: null,
    config: {
      image: null,
      draggable: true,
      x: 0,
      y: 0
    }
  })

  const avatar = reactive({
    image: null,
    config: {
      image: null,
      draggable: true,
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      dragBoundFunc: function(pos) {
        return pos;
      }
    }
  })

  // Layer order state
  const layerOrder = reactive({
    frame: 1,  // Higher z-index (on top by default)
    avatar: 0  // Lower z-index (bottom by default)
  })

  // Add safe area state
  const safeArea = reactive({
    width: FB_AVATAR_SIZE,
    height: FB_AVATAR_SIZE,
    x: 0,
    y: 0
  })

  // Add selected node state
  const selectedId = ref(null)

  // Transformer config
  const transformerConfig = {
    enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    rotationSnaps: [0, 90, 180, 270],
    borderStroke: '#0D9488',
    borderStrokeWidth: 5,
    anchorStroke: '#0D9488',
    anchorFill: '#fff',
    anchorSize: 15,
    anchorCornerRadius: 10,
    padding: -5,
    keepRatio: true,
    boundBoxFunc: (oldBox, newBox) => {
      // Prevent scaling smaller than 10px
      if (newBox.width < 10 || newBox.height < 10) {
        return oldBox
      }

      // Prevent scaling larger than stage size
      if (newBox.width > stageConfig.width * 1.2 || newBox.height > stageConfig.height * 1.2) {
        return oldBox
      }

      // Ensure the transformer box stays within stage bounds
      if (newBox.x < 0 || newBox.y < 0 ||
          newBox.x + newBox.width > stageConfig.width ||
          newBox.y + newBox.height > stageConfig.height) {
        return oldBox
      }

      return newBox
    }
  }

  // Computed
  const avatarScale = computed(() => avatar.config?.scaleX || 1)

  // Methods
  const updateStageSize = (container) => {
    if (!container) return

    stageConfig.width = container.clientWidth
    stageConfig.height = container.clientWidth  // Set height equal to width for square aspect ratio
    // stageConfig.height = 600
  }

  const loadImage = (file) => {
    return new Promise((resolve, reject) => {
      // Nếu file là đối tượng Image đã tải, trả về luôn
      if (file instanceof HTMLImageElement) {
        resolve(file);
        return;
      }

      // Kiểm tra file type chỉ khi file là File object
      if (!file || (file instanceof File && !file.type?.startsWith('image/'))) {
        reject(new Error('Invalid file type'));
        return;
      }

      if (file instanceof File && file.size > 20 * 1024 * 1024) {
        reject(new Error('File size exceeds 20MB limit'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleBackgroundUpload = async (file) => {
    try {
      // Nếu file là đối tượng Image, sử dụng trực tiếp
      // Nếu không, gọi loadImage để xử lý
      const img = file instanceof HTMLImageElement ? file : await loadImage(file);

      background.image = img;

      // Calculate scale to fit stage while maintaining aspect ratio
      const containerSize = Math.min(stageConfig.width, stageConfig.height);
      const scale = containerSize / Math.max(img.width, img.height);

      // Center the frame
      const x = (stageConfig.width - img.width * scale) / 2;
      const y = (stageConfig.height - img.height * scale) / 2;

      background.config = {
        image: img,
        draggable: true,
        x,
        y,
        scaleX: scale,
        scaleY: scale,
        listening: true // Enable interactions with frame
      };

      // Update safe area to match frame size
      safeArea.width = containerSize;
      safeArea.height = containerSize;
      safeArea.x = (stageConfig.width - containerSize) / 2;
      safeArea.y = (stageConfig.height - containerSize) / 2;

      return Promise.resolve(); // Đảm bảo trả về Promise

    } catch (error) {
      console.error('Error loading frame:', error);
      throw error;
    }
  };

  const handleAvatarUpload = async (file) => {
    try {
      const img = await loadImage(file)
      avatar.image = img

      // Set initial size (70% of safe area)
      const maxSize = Math.min(safeArea.width, safeArea.height) * 0.7
      const scale = maxSize / Math.max(img.width, img.height)

      // Center in safe area
      const x = safeArea.x + (safeArea.width - img.width * scale) / 2
      const y = safeArea.y + (safeArea.height - img.height * scale) / 2

      avatar.config = {
        image: img,
        draggable: true,
        x,
        y,
        scaleX: scale,
        scaleY: scale,
        rotation: 0,
        dragBoundFunc: function(pos) {
          return pos;
        }
      }

      // Select avatar after upload
      nextTick(() => {
        handleSelect('avatar')
      })
    } catch (error) {
      console.error('Error loading avatar:', error)
      throw error
    }
  }

  const updatePosition = (type, node) => {
    const target = type === 'frame' ? background : avatar
    if (!node) return

    target.config.x = node.x()
    target.config.y = node.y()

    console.log(`${type} position updated:`, {
      to: { x: target.config.x, y: target.config.y }
    })
  }

  const updateTransform = (type, node) => {
    const target = type === 'frame' ? background : avatar
    if (!node) return

    target.config.scaleX = node.scaleX()
    target.config.scaleY = node.scaleY()
    target.config.rotation = node.rotation() || 0

    // Update position after transform
    target.config.x = node.x()
    target.config.y = node.y()
  }

  const handleScale = (scale) => {
    if (!avatar.config || isNaN(scale)) return

    const oldScale = avatar.config.scaleX
    const newScale = scale

    // Get center of safe area
    const centerX = safeArea.x + safeArea.width / 2
    const centerY = safeArea.y + safeArea.height / 2

    // Calculate new position to maintain center point
    const currentX = avatar.config.x
    const currentY = avatar.config.y
    const imgCenterX = currentX + (avatar.image.width * oldScale) / 2
    const imgCenterY = currentY + (avatar.image.height * oldScale) / 2

    // Calculate offset from center
    const offsetX = imgCenterX - centerX
    const offsetY = imgCenterY - centerY

    // Scale the offset
    const newOffsetX = (offsetX * newScale) / oldScale
    const newOffsetY = (offsetY * newScale) / oldScale

    // Update position and scale
    avatar.config.scaleX = newScale
    avatar.config.scaleY = newScale
    avatar.config.x = centerX + newOffsetX - (avatar.image.width * newScale) / 2
    avatar.config.y = centerY + newOffsetY - (avatar.image.height * newScale) / 2
  }

  const handleRotate = (direction) => {
    if (!avatar.config) return
    const rotation = direction === 'left' ? -90 : 90
    avatar.config.rotation = (avatar.config.rotation + rotation) % 360
  }

  const handleExport = (format, stageRef) => {
    if (!stageRef) {
      console.error('Stage reference is missing');
      return;
    }

    try {
      // Lấy stage node
      const stage = stageRef.getNode();

      // Lấy các node từ stage gốc
      const avatarNode = stage.findOne('#avatar');
      const frameNode = stage.findOne('#frame');

      if (!avatarNode || !frameNode) {
        console.error('Avatar or frame node not found');
        return;
      }

      // Tạo một canvas tạm thời để vẽ chỉ avatar và frame
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Tính toán kích thước và vị trí của vùng cần xuất
      // Lấy kích thước và vị trí của cả avatar và frame
      const avatarRect = {
        x: avatarNode.x(),
        y: avatarNode.y(),
        width: avatarNode.width() * avatarNode.scaleX(),
        height: avatarNode.height() * avatarNode.scaleY()
      };

      const frameRect = {
        x: frameNode.x(),
        y: frameNode.y(),
        width: frameNode.width() * frameNode.scaleX(),
        height: frameNode.height() * frameNode.scaleY()
      };

      // Tính toán vùng bao quanh cả avatar và frame
      const boundingBox = {
        x: Math.min(avatarRect.x, frameRect.x),
        y: Math.min(avatarRect.y, frameRect.y),
        width: Math.max(
          avatarRect.x + avatarRect.width,
          frameRect.x + frameRect.width
        ) - Math.min(avatarRect.x, frameRect.x),
        height: Math.max(
          avatarRect.y + avatarRect.height,
          frameRect.y + frameRect.height
        ) - Math.min(avatarRect.y, frameRect.y)
      };

      // Thêm padding nhỏ xung quanh để đảm bảo không cắt sát quá
      const padding = 10;
      boundingBox.x -= padding;
      boundingBox.y -= padding;
      boundingBox.width += padding * 2;
      boundingBox.height += padding * 2;

      // Đảm bảo không vượt quá kích thước stage
      boundingBox.x = Math.max(0, boundingBox.x);
      boundingBox.y = Math.max(0, boundingBox.y);
      boundingBox.width = Math.min(boundingBox.width, stage.width() - boundingBox.x);
      boundingBox.height = Math.min(boundingBox.height, stage.height() - boundingBox.y);

      // Đặt kích thước cho canvas
      canvas.width = boundingBox.width;
      canvas.height = boundingBox.height;

      // Tạo một stage tạm thời để render
      const tempStage = new Konva.Stage({
        container: document.createElement('div'),
        width: boundingBox.width,
        height: boundingBox.height
      });

      const tempLayer = new Konva.Layer();
      tempStage.add(tempLayer);

      // Tạo bản sao của avatar và frame, điều chỉnh vị trí tương đối với boundingBox
      const tempAvatar = avatarNode.clone({
        x: avatarRect.x - boundingBox.x,
        y: avatarRect.y - boundingBox.y,
        draggable: false,
        listening: false
      });

      const tempFrame = frameNode.clone({
        x: frameRect.x - boundingBox.x,
        y: frameRect.y - boundingBox.y,
        draggable: false,
        listening: false
      });

      // Thêm avatar và frame vào layer tạm thời
      tempLayer.add(tempAvatar);
      tempLayer.add(tempFrame);

      // Đảm bảo thứ tự layer đúng theo layerOrder
      if (layerOrder.frame > layerOrder.avatar) {
        tempFrame.moveToTop();
      } else {
        tempAvatar.moveToTop();
      }

      // Render layer
      tempLayer.draw();

      // Xuất hình ảnh từ stage tạm thời
      const dataURL = tempStage.toDataURL({
        pixelRatio: 2, // Tăng chất lượng hình ảnh
        mimeType: format === 'png' ? 'image/png' : 'image/jpeg',
        quality: 1
      });

      // Tạo link tải xuống
      const link = document.createElement('a');
      link.download = `avatar-frame-${new Date().getTime()}.${format}`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Dọn dẹp
      tempStage.destroy();

      return dataURL;
    } catch (error) {
      console.error('Error exporting image:', error);
      return null;
    }
  };

  // Selection handling
  const handleSelect = (nodeId) => {
    selectedId.value = nodeId
    updateImageStyles()
  }

  const handleStageClick = (e, stage) => {
    if (e.target === stage.getNode()) {
      selectedId.value = null
      updateImageStyles()
    }
  }

  const updateImageStyles = () => {
    if (background.config) {
      background.config.shadowBlur = selectedId.value === 'frame' ? 10 : 0
      background.config.stroke = selectedId.value === 'frame' ? '#0D9488' : undefined
      background.config.strokeWidth = selectedId.value === 'frame' ? 2 : 0
    }
    if (avatar.config) {
      avatar.config.shadowBlur = 0
      avatar.config.stroke = undefined
      avatar.config.strokeWidth = 0
    }
  }

  // Frame handling methods
  const handleSelectFrame = (frame) => {
    if (frame && frame.src) {
      console.log("Đang tải frame từ URL:", frame.src);

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        console.log("Frame đã tải thành công:", img.width, "x", img.height);
        // Truyền trực tiếp đối tượng Image đã tải vào handleBackgroundUpload
        // thay vì gọi loadImage lại
        handleBackgroundUpload(img)
          .then(() => {
            console.log("Background đã được cập nhật thành công");
          })
          .catch(err => {
            console.error("Lỗi khi xử lý frame:", err);
          });
      };

      img.onerror = (err) => {
        console.error("Lỗi khi tải frame:", err);
      };

      img.src = frame.src;
    }
  };

  const handleFrameFromUrl = async (url) => {
    try {
      console.log("Đang tải frame từ URL:", url);

      const img = new Image();
      img.crossOrigin = 'anonymous';

      return new Promise((resolve, reject) => {
        img.onload = () => {
          console.log("Frame đã tải thành công:", img.width, "x", img.height);
          handleBackgroundUpload(img);
          resolve();
        };

        img.onerror = (err) => {
          console.error("Lỗi khi tải frame từ URL:", err);
          reject(new Error("Không thể tải hình ảnh từ URL đã cung cấp"));
        };

        img.src = url;
      });
    } catch (error) {
      console.error("Lỗi khi kiểm tra URL hình ảnh:", error);
      throw error;
    }
  };

  // New method to handle layer order changes
  const updateLayerOrder = (order) => {
    if (!order || typeof order !== 'object') return;

    // Update the layer order state
    if (typeof order.frame === 'number') layerOrder.frame = order.frame;
    if (typeof order.avatar === 'number') layerOrder.avatar = order.avatar;

    console.log('Layer order updated:', layerOrder);
  }

  return {
    stageConfig,
    background,
    avatar,
    safeArea,
    selectedId,
    transformerConfig,
    layerOrder,
    avatarScale,
    updateStageSize,
    loadImage,
    handleBackgroundUpload,
    handleAvatarUpload,
    updatePosition,
    updateTransform,
    handleScale,
    handleRotate,
    handleExport,
    handleSelect,
    handleStageClick,
    updateImageStyles,
    handleSelectFrame,
    handleFrameFromUrl,
    updateLayerOrder
  }
}
