import React from 'react';

function SideMenu({ isOpen, onClose, activeTab, setActiveTab, setShowHistoryModal, allMyBookingsCount, bookingNickname, bookingPhone, handleLogout, setShowInfoModal }) {
    if (!isOpen) return null;

    return (
        <>
            <div className="drawer-overlay" onClick={onClose}></div>
            <div className="drawer-menu">
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '1.5px solid var(--border-color)', paddingBottom: '20px' }}>
                    <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 12px auto' }}>
                        <img src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png" alt="User Avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border-color)' }} />
                        <span style={{ position: 'absolute', bottom: '0', right: '0', backgroundColor: '#10b981', width: '18px', height: '18px', borderRadius: '50%', border: '2px solid white' }}></span>
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>{bookingNickname || 'ผู้ใช้งานระบบ'}</h3>
                    <span style={{ fontSize: '12px', padding: '3px 10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '20px', fontWeight: 'bold' }}>
                        เบอร์โทร: {bookingPhone || 'ยังไม่ได้ระบุ'}
                    </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
                    <button onClick={() => { setActiveTab('booking'); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 16px', background: activeTab === 'booking' ? 'var(--primary-light)' : 'none', border: 'none', borderRadius: 'var(--radius-sm)', color: activeTab === 'booking' ? 'var(--primary)' : 'var(--text-primary)', fontSize: '16px', fontWeight: 'bold', textAlign: 'left', cursor: 'pointer', width: '100%' }}>
                        <i className="fa-solid fa-map-location-dot" style={{ width: '20px' }}></i> แผนผังและจองสนาม
                    </button>

                    <button onClick={() => { setActiveTab('matchmaking'); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 16px', background: activeTab === 'matchmaking' ? 'var(--primary-light)' : 'none', border: 'none', borderRadius: 'var(--radius-sm)', color: activeTab === 'matchmaking' ? 'var(--primary)' : 'var(--text-primary)', fontSize: '16px', fontWeight: 'bold', textAlign: 'left', cursor: 'pointer', width: '100%' }}>
                        <i className="fa-solid fa-users" style={{ width: '20px' }}></i> ก๊วนตีเกมหาเพื่อน
                    </button>

                    <button onClick={() => { setShowHistoryModal(true); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 16px', background: 'none', border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '16px', fontWeight: 'bold', textAlign: 'left', cursor: 'pointer', width: '100%' }}>
                        <i className="fa-solid fa-clock-rotate-left" style={{ width: '20px' }}></i> ประวัติการจองทั้งหมด ({allMyBookingsCount})
                    </button>

                    <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '10px 0' }}></div>

                    <button onClick={() => { setShowInfoModal(true); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 16px', background: 'var(--primary-light)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--primary)', fontSize: '15px', fontWeight: 'bold', textAlign: 'left', cursor: 'pointer', width: '100%' }}>
                        <i className="fa-solid fa-circle-info" style={{ width: '20px' }}></i> กฎสนาม / ราคา / ติดต่อ
                    </button>

                    <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '10px 0' }}></div>

                    <button 
                        onClick={() => {
                            if ('Notification' in window) {
                                Notification.requestPermission().then(permission => {
                                    if (permission === 'granted') {
                                        new Notification('เปิดการแจ้งเตือนสำเร็จ', { body: 'คุณจะได้รับการแจ้งเตือนเมื่อมีการจองใหม่' });
                                    } else {
                                        alert('กรุณาอนุญาตการแจ้งเตือนในตั้งค่าเบราว์เซอร์ของคุณ');
                                    }
                                });
                            } else {
                                alert('เบราว์เซอร์นี้ไม่รองรับ Push Notification\n\nสาเหตุที่เป็นไปได้:\n1. ใช้ iOS (iPhone/iPad) ต้องกด "เพิ่มลงในหน้าจอหลัก" ก่อนถึงจะใช้ได้\n2. เปิดผ่านแอปไลน์หรือ Facebook\n3. ไม่ได้เปิดเว็บผ่าน HTTPS\n\n*แต่อย่างไรก็ตาม ระบบจะยังมีการแจ้งเตือนในแอป (In-app Notification) ให้ตามปกติครับ*');
                            }
                        }} 
                        style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 16px', background: 'none', border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '15px', fontWeight: 'bold', textAlign: 'left', cursor: 'pointer', width: '100%' }}>
                        <i className="fa-regular fa-bell" style={{ width: '20px' }}></i> เปิดการแจ้งเตือน (เว็บ)
                    </button>

                    <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '10px 0' }}></div>

                    <div style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '6px' }}>สนามแบดมินตัน SUSA</p>
                        <p><i className="fa-solid fa-phone" style={{ marginRight: '6px' }}></i> 089-123-4567</p>
                        <p><i className="fa-brands fa-line" style={{ marginRight: '6px', color: '#06C755' }}></i> @susab badminton</p>
                    </div>
                </div>

                <button onClick={handleLogout} className="btn-animate" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '12px', backgroundColor: 'var(--danger-light)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                    <i className="fa-solid fa-right-from-bracket"></i> ออกจากระบบ
                </button>
            </div>
        </>
    );
}

export default SideMenu;
