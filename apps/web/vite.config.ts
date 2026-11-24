import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: mode === 'calibracao' ? 5174 : 5173,
    strictPort: true,
    proxy: { '/api': `http://127.0.0.1:${mode === 'calibracao' ? 3002 : 3001}` },
  },
}))
