<template>
  <div class="p-4">
    <h2 class="text-lg font-semibold mb-4">Imgur URL Test</h2>

    <div class="bg-gray-100 p-4 rounded-lg mb-4">
      <div class="relative aspect-square w-full max-w-md mx-auto" ref="stageContainer">
        <v-stage
          ref="stage"
          :config="stageConfig"
        >
          <v-layer>
            <v-image
              v-if="imgurImage"
              :config="{
                image: imgurImage,
                x: 0,
                y: 0,
                width: stageConfig.width,
                height: stageConfig.height
              }"
            />
          </v-layer>
        </v-stage>
      </div>
    </div>

    <div class="mb-4">
      <p class="text-sm" :class="status.success ? 'text-green-600' : 'text-red-600'">
        {{ status.message }}
      </p>
    </div>

    <button
      @click="loadImgurImage"
      class="btn btn-primary px-4 py-2"
    >
      Test Imgur URL
    </button>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';

const imgurUrl = "https://i.imgur.com/Rew8ydu.png";
const imgurImage = ref(null);
const stage = ref(null);
const stageContainer = ref(null);

const stageConfig = reactive({
  width: 400,
  height: 400
});

const status = reactive({
  message: "Chưa test URL Imgur",
  success: false
});

function loadImgurImage() {
  status.message = "Đang tải hình ảnh từ Imgur...";
  status.success = false;

  const img = new Image();
  img.crossOrigin = "anonymous";

  img.onload = () => {
    console.log("Hình ảnh đã tải thành công:", img.width, "x", img.height);
    imgurImage.value = img;
    status.message = "Tải hình ảnh thành công! Kích thước: " + img.width + "x" + img.height;
    status.success = true;
  };

  img.onerror = (err) => {
    console.error("Lỗi khi tải hình ảnh:", err);
    status.message = "Lỗi khi tải hình ảnh. Kiểm tra console để biết thêm chi tiết.";
    status.success = false;
  };

  img.src = imgurUrl;
}

onMounted(() => {
  if (stageContainer.value) {
    stageConfig.width = stageContainer.value.clientWidth;
    stageConfig.height = stageContainer.value.clientWidth;
  }
});
</script>
