import React, { useState } from 'react';
import './Login.css'; // ย้าย Inline Style ไปใส่ในไฟล์ CSS จะสะอาดขึ้นครับ

function LoginStyle() {
  // 1. สร้าง State สำหรับเปิด/ปิด ป็อปอัพสมัครสมาชิก
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' }}>

      {/* 2. เช็กเงื่อนไข: ถ้าไม่ได้เปิดสมัครสมาชิก (!showRegister) ให้โชว์หน้า Login ตามปกติ */}
      {!showRegister ? (
        <div className="BoxLogin" style={{ backgroundColor: 'white', width: '400px', padding: '30px', borderRadius: '10px', boxShadow: '0px 4px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <img src="https://placehold.co/80x80/28a745/white?text=Badminton" alt="App Logo" style={{ width: '80px', height: '80px', borderRadius: '50%' }} />
          </div>
          <h2 style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', color: '#333', fontSize: '22px' }}>Login to Badminton System</h2>

          {/* ช่องกรอกข้อมูล */}
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '15px' }}>
            <label style={{ paddingBottom: '5px', fontWeight: 'bold' }}>Email :</label>
            <input type="email" placeholder="email@gmail.com" style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px' }}>
            <label style={{ paddingBottom: '5px', fontWeight: 'bold' }}>Password :</label>
            <input type="password" placeholder="examxxxxx" style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
          </div>

          {/* ปุ่มกดโซนล็อกอิน/สมัครสมาชิก */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '20px' }}>
            {/* เมื่อกดปุ่ม "สมัครสมาชิก" จะสั่งให้เปลี่ยนค่า State เป็น true หน้า Login จะหายไปทันที */}
            <button onClick={() => setShowRegister(true)} style={{ width: '120px', height: '40px', backgroundColor: '#6e6e6e', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
              สมัครสมาชิก
            </button>
            <button style={{ width: '120px', height: '40px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
              ลงชื่อเข้าใช้
            </button>
          </div>

          {/* ... ส่วนของปุ่ม Social Login ด้านล่างใส่ต่อตรงนี้ได้ปกติเลยครับ ... */}
        </div>
      ) : (

        // 3. เงื่อนไขฝั่งนี้จะทำงานเมื่อ showRegister เป็น true (หน้า Pop-up สมัครสมาชิก)
        <div className="BoxRegister" style={{ backgroundColor: 'white', width: '400px', padding: '30px', borderRadius: '10px', boxShadow: '0px 4px 10px rgba(0,0,0,0.1)', position: 'relative' }}>
          <h2 style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', color: '#333', fontSize: '22px' }}>สมัครสมาชิกใหม่</h2>

          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '15px' }}>
            <label style={{ paddingBottom: '5px', fontWeight: 'bold' }}>ชื่อผู้ใช้งาน :</label>
            <input type="text" placeholder="Your Name" style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '15px' }}>
            <label style={{ paddingBottom: '5px', fontWeight: 'bold' }}>Email :</label>
            <input type="email" placeholder="email@gmail.com" style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px' }}>
            <label style={{ paddingBottom: '5px', fontWeight: 'bold' }}>สร้าง Password :</label>
            <input type="password" placeholder="อย่างน้อย 6 ตัวอักษร" style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
            <button style={{ width: '100%', height: '40px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
              ยืนยันการสมัคร
            </button>
          </div>

          {/* ปุ่มกากบาทมุมขวาบน หรือ ปุ่มย้อนกลับ เพื่อสลับกลับไปหน้าล็อกอิน */}
          <p onClick={() => setShowRegister(false)} style={{ textAlign: 'center', color: '#007bff', marginTop: '15px', cursor: 'pointer', fontSize: '14px' }}>
            กลับไปหน้าลงชื่อเข้าใช้
          </p>
        </div>
      )}

    </div>
  );
}

export default LoginStyle;