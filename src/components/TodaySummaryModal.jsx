import React from 'react';
import { bookerColors, hourBlocks } from '../constants/courtData';

function TodaySummaryModal({
    showSummaryModal,
    setShowSummaryModal,
    formatDateText,
    selectedDate,
    leftCourts,
    rightCourts,
    bookedSlots
}) {
    if (!showSummaryModal) return null;

    // รวบรวมสนามทั้งหมดเพื่อแสดงในตาราง
    const allCourtsForSummary = [...leftCourts, ...rightCourts];

    // ฟังก์ชันหาสีประจำตัวผู้จองเพื่อความง่ายในการดู
    const getBookerColorStyle = (name, phone, isMyBooking) => {
        if (isMyBooking) return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' }; // สีของตัวเอง (น้ำเงินอ่อน)
        if (!name) return { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' }; // ไม่มีชื่อ (เทาอ่อน)

        const str = `${name}${phone}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % bookerColors.length;
        return bookerColors[index];
    };

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
            zIndex: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 0.2s'
        }}>
            <div style={{
                backgroundColor: '#f8fafc', width: '95%', height: '90%', maxWidth: '1200px', borderRadius: '16px',
                display: 'flex', flexDirection: 'column', animation: 'scaleIn 0.2s ease-out', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                overflow: 'hidden'
            }}>
                {/* Header ของ Modal */}
                <div style={{
                    padding: '16px 20px', backgroundColor: 'white', borderBottom: '1px solid var(--border-color)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
                }}>
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fa-solid fa-table-cells" style={{ color: 'var(--primary)' }}></i>
                            ตารางสรุปจองสนาม (Google Sheets View)
                        </h3>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: '500' }}>
                            ประจำวัน: <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{formatDateText(selectedDate)}</span>
                        </div>
                    </div>
                    <button onClick={() => setShowSummaryModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s' }}>
                        <i className="fa-solid fa-xmark" style={{ fontSize: '18px' }}></i>
                    </button>
                </div>

                {/* เนื้อหาตาราง */}
                <div style={{ overflow: 'auto', flexGrow: 1, padding: '20px', position: 'relative' }} className="custom-scrollbar">

                    {/* คำอธิบายสัญลักษณ์ */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                            <div style={{ width: '14px', height: '14px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '3px' }}></div> : รายการจองของคุณ
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                            <div style={{ width: '14px', height: '14px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '3px' }}></div> : ว่าง
                        </div>
                    </div>

                    <div style={{
                        display: 'inline-block', minWidth: '100%', backgroundColor: 'white', borderRadius: '12px',
                        border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', overflow: 'hidden'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px' }}>
                            <thead>
                                {/* แถวที่ 1: หัวตาราง (สนาม) */}
                                <tr>
                                    <th style={{
                                        position: 'sticky', top: 0, left: 0, zIndex: 30,
                                        backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1', borderRight: '2px solid #cbd5e1',
                                        padding: '8px', width: '85px', fontWeight: '800', color: '#334155', fontSize: '11px', height: '32px'
                                    }}>
                                        สนาม / เวลา
                                    </th>
                                    {hourBlocks.map((block, index) => (
                                        <th key={index} colSpan={2} style={{
                                            position: 'sticky', top: 0, zIndex: 20,
                                            backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0',
                                            padding: '4px', fontWeight: '700', color: '#475569', fontSize: '11px', height: '32px'
                                        }}>
                                            {block.label}
                                        </th>
                                    ))}
                                </tr>
                                {/* แถวที่ 2: สล็อตเวลา 30 นาที */}
                                <tr>
                                    <th style={{
                                        position: 'sticky', top: '32px', left: 0, zIndex: 30,
                                        backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1', borderRight: '2px solid #cbd5e1',
                                        padding: '4px', height: '28px'
                                    }}></th>
                                    {hourBlocks.map((block) => (
                                        block.slots.map((slotTime, idx) => {
                                            const displayTime = slotTime.split(' - ')[0]; // ดึงเฉพาะเวลาเริ่ม เช่น 16:00
                                            return (
                                                <th key={slotTime} style={{
                                                    position: 'sticky', top: '32px', zIndex: 20,
                                                    backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1',
                                                    borderRight: idx === 1 ? '1px solid #e2e8f0' : '1px dashed #e2e8f0',
                                                    padding: '4px 2px', fontSize: '10px', fontWeight: '600', color: '#64748b', minWidth: '55px', height: '28px'
                                                }}>
                                                    {displayTime}
                                                </th>
                                            );
                                        })
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {/* วนลูปสร้างแถวตามจำนวนสนาม */}
                                {allCourtsForSummary.map((courtName, courtIndex) => {
                                    return (
                                        <tr key={courtName} style={{ backgroundColor: courtIndex % 2 === 0 ? 'white' : '#f8fafc' }}>
                                            {/* คอลัมน์แรก: ชื่อสนาม (Sticky Left) */}
                                            <td style={{
                                                position: 'sticky', left: 0, zIndex: 10,
                                                backgroundColor: courtIndex % 2 === 0 ? 'white' : '#f8fafc',
                                                borderBottom: '1px solid #e2e8f0', borderRight: '2px solid #cbd5e1',
                                                padding: '8px 6px', fontWeight: '700', color: '#334155', textAlign: 'left', fontSize: '11px'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <div style={{ width: '6px', height: '18px', backgroundColor: 'var(--primary)', borderRadius: '3px' }}></div>
                                                    {courtName}
                                                </div>
                                            </td>

                                            {/* คอลัมน์เวลาต่างๆ */}
                                            {hourBlocks.map((block) => (
                                                block.slots.map((slotTime, idx) => {
                                                    // ค้นหาว่าสล็อตนี้มีการจองหรือไม่
                                                    const booking = bookedSlots.find(b => b.date === selectedDate && b.court === courtName && b.time === slotTime);

                                                    let cellContent = null;
                                                    let cellStyle = {
                                                        borderBottom: '1px solid #e2e8f0',
                                                        borderRight: idx === 1 ? '1px solid #e2e8f0' : '1px dashed #e2e8f0',
                                                        padding: '2px',
                                                        height: '36px',
                                                        verticalAlign: 'middle'
                                                    };

                                                    if (booking) {
                                                        // มีคนจอง
                                                        const colors = getBookerColorStyle(booking.name, booking.phone, booking.byMe);
                                                        cellContent = (
                                                            <div style={{
                                                                backgroundColor: colors.bg,
                                                                border: `1px solid ${colors.border}`,
                                                                borderRadius: '4px',
                                                                padding: '2px',
                                                                height: '100%',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                justifyContent: 'center',
                                                                alignItems: 'center',
                                                                boxSizing: 'border-box'
                                                            }}>
                                                                <div style={{ fontSize: '10px', fontWeight: '800', color: colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '48px' }}>
                                                                    {booking.name || 'ไม่ระบุชื่อ'}
                                                                </div>
                                                                {booking.byMe && <div style={{ fontSize: '8px', color: colors.text, opacity: 0.8, marginTop: '1px' }}>(คุณ)</div>}
                                                            </div>
                                                        );
                                                    } else {
                                                        // ว่าง
                                                        cellContent = (
                                                            <div style={{ color: '#cbd5e1', fontSize: '10px' }}>-</div>
                                                        );
                                                    }

                                                    return (
                                                        <td key={slotTime} style={cellStyle}>
                                                            {cellContent}
                                                        </td>
                                                    );
                                                })
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TodaySummaryModal;
