import React, { useState } from 'react';
// 🟢 1. อิมพอร์ตดึงหน้าต่างๆ ที่คุณแยกไฟล์ไว้ในโฟลเดอร์ pages เข้ามาใช้งาน
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import InstallPwaPrompt from './components/InstallPwaPrompt';
// (ถ้ามีหน้า BookingPage ก็ดึงมาใส่เพิ่มได้ในอนาคตครับ)

function App() {
  // สเตตควบคุม: true = รันหน้าโฮมทันที, false = ไปหน้าล็อกอิน
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  // 🟢 2. เช็กเงื่อนไขสลับหน้าจอจากไฟล์ที่อิมพอร์ตเข้ามา
  if (isLoggedIn) {
    // ถ้าล็อกอินแล้ว (หรือตั้งเป็น true ไว้) ให้รันหน้า HomePage จากไฟล์ที่คุณแยกไว้ทันที
    return (
      <>
        <HomePage handleLogout={() => setIsLoggedIn(false)} />
        <InstallPwaPrompt />
      </>
    );
  }

  // ถ้ายังไม่ล็อกอิน ให้รันหน้า LoginPage จากไฟล์แยกของคุณ
  return (
    <>
      <LoginPage handleLogin={() => setIsLoggedIn(true)} />
      <InstallPwaPrompt />
    </>
  );
}

export default App;