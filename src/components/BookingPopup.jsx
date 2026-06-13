import React from 'react';
import { timePoints } from '../constants/courtData';

function BookingPopup({
    activeCourtForBooking,
    setActiveCourtForBooking,
    selectedDate,
    formatDateText,
    bookingStartTime,
    setBookingStartTime,
    bookingEndTime,
    setBookingEndTime,
    currentRangeSlots,
    bookedSlots,
    bookingNickname,
    setBookingNickname,
    bookingPhone,
    setBookingPhone,
    isRangeConflictWithOthers,
    totalPrice,
    handleConfirmBooking
}) {
    if (!activeCourtForBooking) return null;

    return (
        <>
            <div className="drawer-overlay" onClick={() => setActiveCourtForBooking(null)}></div>

            <div style={{
                position: 'absolute', bottom: 0, left: 0, width: '100%', maxHeight: '85%',
                backgroundColor: '#ffffff', borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
                boxShadow: '0 -8px 30px rgba(0,0,0,0.15)', padding: '24px 20px 16px 20px', zIndex: 120,
                display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                {/* หัวป๊อปอัพ (คงที่ไว้ด้านบน) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexShrink: 0 }}>
                    <div>
                        <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 'bold' }}>📅 เลือกเวลาจองแบบเลื่อนสะดวกสบาย</span>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>🏸 {activeCourtForBooking}</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>ประจำวัน: {formatDateText(selectedDate)}</p>
                    </div>
                    <button onClick={() => setActiveCourtForBooking(null)} style={{ background: 'var(--border-color)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* 🟢 ส่วนเนื้อหาตรงกลาง: มัดรวมกันแล้วเปิด overflowY: 'auto' เพื่อแก้ปัญหาโดนเบียด */}
                <div style={{ overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px', paddingRight: '4px' }} className="hide-scrollbar">

                    {/* 1. ส่วนเลื่อนเลือกเวลา (Dropdown วงล้อ) */}
                    <div style={{ backgroundColor: 'var(--bg-light)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>🕒 เวลาเริ่มต้น :</label>
                                <select
                                    value={bookingStartTime}
                                    onChange={(e) => {
                                        setBookingStartTime(e.target.value);
                                        const startIdx = timePoints.indexOf(e.target.value);
                                        const endIdx = timePoints.indexOf(bookingEndTime);
                                        if (startIdx >= endIdx && startIdx < timePoints.length - 1) {
                                            setBookingEndTime(timePoints[startIdx + 1]);
                                        }
                                    }}
                                    style={{ padding: '10px', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '15px', fontWeight: 'bold', backgroundColor: 'white', outline: 'none', width: '100%' }}
                                >
                                    {timePoints.slice(0, -1).map(tp => (
                                        <option key={tp} value={tp}>{tp} น.</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ fontSize: '18px', color: 'var(--text-secondary)', marginTop: '16px' }}>→</div>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>🕒 เวลาสิ้นสุด :</label>
                                <select
                                    value={bookingEndTime}
                                    onChange={(e) => setBookingEndTime(e.target.value)}
                                    style={{ padding: '10px', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '15px', fontWeight: 'bold', backgroundColor: 'white', outline: 'none', width: '100%' }}
                                >
                                    {timePoints.map(tp => {
                                        const startIdx = timePoints.indexOf(bookingStartTime);
                                        const currentIdx = timePoints.indexOf(tp);
                                        if (currentIdx <= startIdx) return null;
                                        return <option key={tp} value={tp}>{tp} น.</option>;
                                    })}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 2. แสดงรายการสล็อตที่เลือก */}
                    <div>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>📋 ตรวจสอบสล็อตเวลาที่เลื่อนเลือกไว้:</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {currentRangeSlots.map((slot) => {
                                const isBookedOthers = bookedSlots.some(b => b.date === selectedDate && b.court === activeCourtForBooking && b.time === slot.time && !b.byMe);
                                const isBookedMe = bookedSlots.some(b => b.date === selectedDate && b.court === activeCourtForBooking && b.time === slot.time && b.byMe);

                                let statusText = `ว่าง (${slot.price}฿)`;
                                let bgColor = '#f0fff4'; let textColor = '#22c55e'; let icon = 'fa-circle-check';

                                if (isBookedOthers) {
                                    statusText = '🔒 มีผู้จองแล้ว'; bgColor = '#fff5f5'; textColor = '#e53e3e'; icon = 'fa-circle-xmark';
                                } else if (isBookedMe) {
                                    statusText = '👤 คุณจองแล้ว'; bgColor = '#eff6ff'; textColor = '#3b82f6'; icon = 'fa-user-check';
                                }

                                return (
                                    <div key={slot.time} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: bgColor, borderRadius: 'var(--radius-sm)', border: `1px solid ${textColor}40` }}>
                                        <div style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <i className="fa-regular fa-clock"></i> {slot.time}
                                        </div>
                                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: textColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <i className={`fa-solid ${icon}`}></i> {statusText}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 3. กล่องกรอกข้อมูลผู้จอง (💡 แก้ไข Bug ชื่อตัวแปรจาก bookingName เป็น bookingNickname ให้ถูกต้อง) */}
                    <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                👤 ชื่อเล่นของคุณ :
                            </label>
                            <input
                                type="text"
                                value={bookingNickname}
                                onChange={(e) => setBookingNickname(e.target.value)}
                                placeholder="กรอกชื่อเล่นผู้จอง"
                                style={{ padding: '10px 12px', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '14px', outline: 'none', backgroundColor: 'white' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                📱 เบอร์โทรศัพท์ :
                            </label>
                            <input
                                type="tel"
                                inputMode="numeric"
                                maxLength={10}
                                value={bookingPhone}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setBookingPhone(val);
                                }}
                                placeholder="กรอกเบอร์โทรศัพท์ 10 หลัก"
                                style={{ padding: '10px 12px', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '14px', outline: 'none', backgroundColor: 'white', letterSpacing: '1px' }}
                            />
                            {bookingPhone && bookingPhone.length < 10 && (
                                <span style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '2px' }}>
                                    ⚠️ เบอร์โทรต้องครบ 10 หลัก (ใส่แล้ว {bookingPhone.length}/10)
                                </span>
                            )}
                            {bookingPhone && bookingPhone.length === 10 && (
                                <span style={{ fontSize: '11px', color: '#22c55e', marginTop: '2px' }}>
                                    ✅ เบอร์โทรถูกต้อง
                                </span>
                            )}
                        </div>
                    </div>

                </div>

                {/* ท้ายป๊อปอัพควบคุมปุ่มยืนยันราคา (ตรึงอยู่กับที่ด้านล่างสุด) */}
                <div style={{ borderTop: '1.5px solid var(--border-color)', paddingTop: '16px', display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                    {isRangeConflictWithOthers ? (
                        <div style={{ width: '100%', color: 'var(--danger)', fontSize: '13px', fontWeight: 'bold', textAlign: 'center', padding: '10px', backgroundColor: 'var(--danger-light)', borderRadius: 'var(--radius-sm)' }}>
                            ⚠️ ไม่สามารถทำรายการได้เนื่องจากเวลานี้ถูกจองแล้วบางส่วน
                        </div>
                    ) : (
                        <>
                            <div style={{ flexGrow: 1 }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>รวมทั้งสิ้น ({currentRangeSlots.length} สล็อต)</span>
                                <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--primary)' }}>
                                    {totalPrice} <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>บาท</span>
                                </div>
                            </div>
                            <button
                                onClick={handleConfirmBooking}
                                className="btn-animate"
                                style={{ flexGrow: 1.5, background: 'var(--primary-gradient)', border: 'none', color: 'white', padding: '12px 16px', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: 'var(--shadow-md)' }}
                            >
                                <i className="fa-solid fa-circle-check"></i> ยืนยันจองเวลานี้
                            </button>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

export default BookingPopup;
