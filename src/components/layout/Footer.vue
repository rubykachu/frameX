<template>
  <footer class="bg-white border-t border-gray-200 py-4 mt-auto">
    <div class="container mx-auto px-4">
      <div class="flex justify-between items-center">
        <p class="text-sm text-gray-600">{{ copyrightYears(2025) }} Image Frame Editor</p>
        <p class="text-sm text-gray-600">
          <a href="https://www.facebook.com/tangquocminh" target="_blank" class="hover:text-blue-600">
            Developed by Tăng Quốc Minh
          </a>
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
function copyrightYears(from) {
  const currentYear = new Date().getFullYear()
  return from === currentYear ? `${from}` : `${from}-${currentYear}`
}
</script>
