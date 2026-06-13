import React, { useState, useEffect } from 'react';

const InstallPwaPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [showIosPrompt, setShowIosPrompt] = useState(false);

    useEffect(() => {
        // ตรวจสอบว่าเป็น iOS หรือไม่
        const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        // ตรวจสอบว่าเปิดเป็นแอป (Standalone) หรือยัง
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        
        if (isIos && !isStandalone) {
            setShowIosPrompt(true);
        }

        const handler = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
            setShowPrompt(false);
        } else {
            console.log('User dismissed the install prompt');
        }
        
        setDeferredPrompt(null);
    };

    // แสดงสำหรับ iOS
    if (showIosPrompt) {
        return (
            <div style={{
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'var(--card-bg, #ffffff)',
                padding: '20px',
                borderRadius: '16px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                zIndex: 9999,
                width: '90%',
                maxWidth: '400px',
                border: '1px solid var(--border-color, #e2e8f0)',
                color: 'var(--text-primary)'
            }}>
                <button 
                    onClick={() => setShowIosPrompt(false)}
                    style={{ position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '20px', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                    <i className="fa-solid fa-xmark"></i>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <i className="fa-brands fa-apple" style={{ fontSize: '24px', color: '#000' }}></i>
                    <h4 style={{ margin: 0, fontSize: '16px' }}>ติดตั้งแอปบน iPhone</h4>
                </div>
                <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                    <b>ถ้าใช้ iPhone ให้ทำแบบนี้:</b>
                    <ol style={{ paddingLeft: '20px', margin: '8px 0 0 0' }}>
                        <li>กดปุ่ม <b>•••</b> มุมขวาล่าง</li>
                        <li>เลือก <b>เปิดใน Safari</b> (Open in Safari)</li>
                        <li>เมื่อเปิดใน Safari แล้ว กดปุ่ม <b>แชร์</b> (สี่เหลี่ยมมีลูกศรชี้ขึ้น)</li>
                        <li>เลื่อนลงแล้วเลือก <b>เพิ่มไปยังหน้าจอโฮม</b> (Add to Home Screen)</li>
                        <li>กด <b>เพิ่ม</b></li>
                    </ol>
                </div>
            </div>
        );
    }

    // แสดงสำหรับ Android/Desktop
    if (!showPrompt) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--card-bg, #ffffff)',
            padding: '16px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            zIndex: 9999,
            width: '90%',
            maxWidth: '400px',
            border: '1px solid var(--border-color, #e2e8f0)'
        }}>
            <div style={{
                backgroundColor: 'var(--primary-light, #fff7ed)',
                color: 'var(--primary, #ff6b00)',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
            }}>
                <i className="fa-solid fa-download"></i>
            </div>
            
            <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary, #1e293b)' }}>ติดตั้งแอป SUSA</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>
                    ติดตั้งลงเครื่องเพื่อเข้าถึงอย่างรวดเร็ว
                </p>
            </div>
            
            <button 
                onClick={handleInstallClick}
                style={{
                    backgroundColor: 'var(--primary, #ff6b00)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    cursor: 'pointer'
                }}
            >
                ติดตั้ง
            </button>
            <button 
                onClick={() => setShowPrompt(false)}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary, #64748b)',
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '4px'
                }}
            >
                <i className="fa-solid fa-xmark"></i>
            </button>
        </div>
    );
};

export default InstallPwaPrompt;
