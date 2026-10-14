import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config' // Import from vitest instead of vite
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Add this configuration block to tell Vitest to simulate a browser
  test: {
    environment: 'happy-dom',
    globals: true, // Optional: Allows you to skip writing "describe, it, expect" imports in every file
  },
})
