import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vitePluginCesium from 'vite-plugin-cesium'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue(), vitePluginCesium()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5176,
    open: true,
  },
})
