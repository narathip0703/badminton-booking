import React from 'react';

function InfoModal({ show, onClose }) {
    if (!show) return null;

    const sectionStyle = {
        backgroundColor: 'var(--bg-light)', padding: '14px', borderRadius: 'var(--radius-sm)',
        marginBottom: '12px', border: '1px solid var(--border-color)'
    };
    const titleStyle = { fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' };
    const itemStyle = { fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.8', display: 'flex', alignItems: 'flex-start', gap: '8px' };

    return (
        <>
            <div className="drawer-overlay" onClick={onClose}></div>
            <div style={{
                position: 'absolute', bottom: 0, left: 0, width: '100%', maxHeight: '88%',
                backgroundColor: '#ffffff', borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
                boxShadow: '0 -8px 30px rgba(0,0,0,0.15)', padding: '24px 20px 24px 20px', zIndex: 120,
                display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>📋 ข้อมูลสนามและกฎการจอง</h2>
                    <button onClick={onClose} style={{ background: 'var(--border-color)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* Scrollable content */}
                <div style={{ overflowY: 'auto', flexGrow: 1 }} className="hide-scrollbar">

                    {/* 💰 ราคาจองสนาม */}
                    <div style={sectionStyle}>
                        <div style={titleStyle}>
                            <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px' }}>💰</span>
                            ราคาจองสนาม
                        </div>
                        <div style={{ backgroundColor: 'white', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--primary)', textAlign: 'center' }}>
                            <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--primary)' }}>120 <span style={{ fontSize: '14px', fontWeight: '600' }}>บาท/ชั่วโมง</span></div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>ราคาเดียวตลอดทุกวัน ทุกเวลา</div>
                        </div>
                    </div>

                    {/* 🏸 ราคาตีเกม */}
                    <div style={sectionStyle}>
                        <div style={titleStyle}>
                            <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px' }}>🏸</span>
                            ราคาตีเกม (Matchmaking)
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <div style={{ flex: 1, backgroundColor: 'white', padding: '12px', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>👦 เด็ก (ค่าสนาม)</div>
                                <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--accent)' }}>20 <span style={{ fontSize: '11px' }}>บาท</span></div>
                            </div>
                            <div style={{ flex: 1, backgroundColor: 'white', padding: '12px', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>🧑 ผู้ใหญ่ (ค่าสนาม)</div>
                                <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--primary)' }}>40 <span style={{ fontSize: '11px' }}>บาท</span></div>
                            </div>
                        </div>
                        <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1.5px solid var(--primary)' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>🏸 ค่าตีเกม (ต่อเกม)</div>
                            <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--primary)' }}>22 <span style={{ fontSize: '11px' }}>บาท/เกม</span></div>
                        </div>
                    </div>

                    {/* 📜 กฎการจองสนาม */}
                    <div style={sectionStyle}>
                        <div style={titleStyle}>
                            <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px' }}>📜</span>
                            กฎการจองสนาม
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={itemStyle}>
                                <span style={{ color: 'var(--danger)', fontSize: '14px', marginTop: '2px' }}>⚠️</span>
                                <span>หากต้องการ<b style={{ color: 'var(--danger)' }}>ยกเลิกการจอง</b> ต้องยกเลิก<b>ก่อนเวลา 13:00 น.</b> ของวันที่จอง</span>
                            </div>
                            <div style={itemStyle}>
                                <span style={{ color: 'var(--danger)', fontSize: '14px', marginTop: '2px' }}>🚫</span>
                                <span>หากยกเลิกการจอง<b style={{ color: 'var(--danger)' }}>ครบ 3 ครั้ง</b> จะถูกระงับสิทธิ์การจอง (ต้องติดต่อแอดมินเพื่อปลดแบน)</span>
                            </div>
                            <div style={itemStyle}>
                                <span style={{ color: 'var(--primary)', fontSize: '14px', marginTop: '2px' }}>💳</span>
                                <span>ชำระค่าสนามที่จุดบริการ ณ วันที่เข้าใช้งาน</span>
                            </div>
                        </div>
                    </div>

                    {/* 📞 ติดต่อแอดมิน */}
                    <div style={sectionStyle}>
                        <div style={titleStyle}>
                            <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px' }}>📞</span>
                            ติดต่อแอดมิน
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <a href="tel:0891234567" style={{ ...itemStyle, textDecoration: 'none', color: 'var(--text-secondary)' }}>
                                <i className="fa-solid fa-phone" style={{ color: 'var(--primary)', marginTop: '2px' }}></i>
                                <span>089-123-4567</span>
                            </a>
                            <div style={itemStyle}>
                                <i className="fa-brands fa-line" style={{ color: '#06C755', marginTop: '2px' }}></i>
                                <span>@susabadminton</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}

export default InfoModal;
