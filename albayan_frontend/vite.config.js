import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
    server: {
    port: 5173, //  Change this to any free port
    open: true,
      allowedHosts: [
      'e343ded3bb57.ngrok-free.app'  // 👈 Your latest Ngrok domain
    ]
  },
});