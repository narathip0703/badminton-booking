import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/badminton-booking/', // 👈 เพิ่มบรรทัดนี้ (ใส่ชื่อ repo ของคุณ)
})
