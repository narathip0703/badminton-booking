import React, { useState } from 'react';

// 🟢 รับ handleLogin มาจาก App.jsx เพื่อใช้สั่งเปลี่ยนสถานะเมื่อล็อกอินสำเร็จ
function LoginPage({ handleLogin }) {
    // State 1: สำหรับสลับหน้า Login / Register
    const [showRegister, setShowRegister] = useState(false);

    // State 2: สำหรับเปิด/ปิดตาเพื่อดูรหัสผ่าน
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#ffffffff',
            fontFamily: 'sans-serif',
            margin: 0,
            padding: 0,
            boxSizing: 'border-box'
        }}>

            {/* 🔐 หน้า LOGIN */}
            {!showRegister ? (
                <div style={{ backgroundColor: 'white', width: '400px', padding: '30px', borderRadius: '10px', boxShadow: '0px 4px 10px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                        <img src="https://placehold.co/80x80/28a745/white?text=Badminton" alt="App Logo" style={{ justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%' }} />
                    </div>
                    <h2 style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', color: '#333', fontSize: '22px' }}>Login to Badminton System</h2>

                    {/* ช่องกรอก Email */}
                    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '15px' }}>
                        <label style={{ paddingBottom: '5px', fontWeight: 'bold', color: '#333' }}>Email :</label>
                        <input type="email" placeholder="email@gmail.com" style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
                    </div>

                    {/* ช่องกรอก Password พร้อมปุ่มรูปตาเปิด/ปิด */}
                    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px' }}>
                        <label style={{ paddingBottom: '5px', fontWeight: 'bold', color: '#333' }}>Password :</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="examxxxxx"
                                style={{ padding: '10px', paddingRight: '40px', border: '1px solid #ccc', borderRadius: '5px', width: '100%' }}
                            />
                            <i
                                onClick={() => setShowPassword(!showPassword)}
                                className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}
                                style={{ position: 'absolute', right: '12px', cursor: 'pointer', color: '#777' }}
                            ></i>
                        </div>
                    </div>

                    {/* ปุ่ม สมัครสมาชิก / ลงชื่อเข้าใช้ */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '20px' }}>
                        <button onClick={() => setShowRegister(true)} style={{ width: '120px', height: '40px', backgroundColor: '#6e6e6e', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                            สมัครสมาชิก
                        </button>

                        {/* เมื่อกดปุ่มนี้ จะวิ่งไปเรียกฟังก์ชัน handleLogin เพื่อเปลี่ยนหน้าไปหน้าโฮม */}
                        <button
                            onClick={handleLogin}
                            style={{ width: '120px', height: '40px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            ลงชื่อเข้าใช้
                        </button>
                    </div>

                    {/* เส้นคั่น Social Login */}
                    <div style={{ display: 'flex', alignItems: 'center', margin: '25px 0 15px 0' }}>
                        <div style={{ flex: 1, height: '1px', backgroundColor: '#ccc' }}></div>
                        <span style={{ padding: '0 10px', color: '#777', fontSize: '14px' }}>หรือล็อกอินด้วย</span>
                        <div style={{ flex: 1, height: '1px', backgroundColor: '#ccc' }}></div>
                    </div>

                    {/* ปุ่ม Social Login */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', width: '100%', height: '40px', backgroundColor: '#ffffff', color: '#757575', border: '1px solid #ddd', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                            <i className="fa-brands fa-google" style={{ color: '#EA4335', fontSize: '18px' }}></i> Continue with Google
                        </button>
                        <button style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', width: '100%', height: '40px', backgroundColor: '#06C755', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                            <i className="fa-brands fa-line" style={{ fontSize: '20px' }}></i> Continue with Line
                        </button>
                        <button style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', width: '100%', height: '40px', backgroundColor: '#1877F2', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                            <i className="fa-brands fa-facebook" style={{ fontSize: '20px' }}></i> Continue with Facebook
                        </button>
                    </div>
                </div>
            ) : (

                /* 📝 หน้าสมัครสมาชิก POPUP */
                <div style={{ backgroundColor: 'white', width: '400px', padding: '30px', borderRadius: '10px', boxShadow: '0px 4px 10px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', color: '#333', fontSize: '22px' }}>สมัครสมาชิกใหม่</h2>

                    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '15px' }}>
                        <label style={{ paddingBottom: '5px', fontWeight: 'bold', color: '#333' }}>ชื่อผู้ใช้งาน :</label>
                        <input type="text" placeholder="Your Name" style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '15px' }}>
                        <label style={{ paddingBottom: '5px', fontWeight: 'bold', color: '#333' }}>Email :</label>
                        <input type="email" placeholder="email@gmail.com" style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px' }}>
                        <label style={{ paddingBottom: '5px', fontWeight: 'bold', color: '#333' }}>สร้าง Password :</label>
                        <input type="password" placeholder="อย่างน้อย 6 ตัวอักษร" style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button onClick={() => setShowRegister(false)} style={{ width: '100%', height: '40px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                            ยืนยันการสมัคร
                        </button>
                    </div>

                    <p onClick={() => setShowRegister(false)} style={{ textAlign: 'center', color: '#007bff', marginTop: '15px', cursor: 'pointer', fontSize: '14px' }}>
                        กลับไปหน้าลงชื่อเข้าใช้
                    </p>
                </div>
            )}

        </div>
    );
}

// 🟢 ส่งออก component เพื่อให้ App.jsx ดึงไปใช้งาน
export default LoginPage;