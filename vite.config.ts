import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { mealsApi } from './server/mealsApi.ts'

export default defineConfig({
  plugins: [react(), mealsApi()],
  server: {
    port: 5273,
    strictPort: true,
  },
  preview: {
    port: 4273,
    strictPort: true,
  },
})
