import React from 'react';
import { leftCourts, rightCourts, timeSlots } from '../constants/courtData';

function MoveModal({
    showMoveModal,
    setShowMoveModal,
    selectedForMove,
    datesList,
    formatDateText,
    newMoveDate,
    setNewMoveDate,
    setNewMoveTime,
    newMoveCourt,
    setNewMoveCourt,
    newMoveTime,
    bookedSlots,
    handleConfirmMove
}) {
    if (!showMoveModal) return null;

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
            zIndex: 250, display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 0.2s'
        }}>
            <div style={{
                backgroundColor: 'white', width: '90%', maxWidth: '400px', borderRadius: '16px', padding: '24px',
                display: 'flex', flexDirection: 'column', animation: 'scaleIn 0.2s ease-out'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--primary)' }}>
                        <i className="fa-solid fa-calendar-days"></i> ย้ายเวลาจอง ({selectedForMove.length} รายการ)
                    </h3>
                    <button onClick={() => setShowMoveModal(false)} style={{ background: 'var(--border-color)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div style={{ backgroundColor: '#fff5f5', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #fed7d7', maxHeight: '120px', overflowY: 'auto' }} className="hide-scrollbar">
                    <div style={{ fontSize: '12px', color: '#e53e3e', fontWeight: 'bold', marginBottom: '4px' }}>รายการที่จะย้าย:</div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                        {selectedForMove.map((b, idx) => (
                            <li key={idx}>{b.court} | {formatDateText(b.date)} | {b.time}</li>
                        ))}
                    </ul>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>วันที่ใหม่ :</label>
                        <select value={newMoveDate} onChange={(e) => { setNewMoveDate(e.target.value); setNewMoveTime(''); }} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}>
                            {datesList.map(d => <option key={d.id} value={d.id}>{formatDateText(d.id)} ({d.dateNum} {d.monthName})</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>สนามใหม่ :</label>
                        <select value={newMoveCourt} onChange={(e) => { setNewMoveCourt(e.target.value); setNewMoveTime(''); }} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}>
                            {[...leftCourts, ...rightCourts].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>เวลาเริ่มต้นใหม่ :</label>
                        <select value={newMoveTime} onChange={(e) => setNewMoveTime(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}>
                            <option value="">-- เลือกเวลาเริ่มต้น --</option>
                            {timeSlots.map(ts => {
                                const startIndex = timeSlots.findIndex(t => t.time === ts.time);
                                const numSlots = selectedForMove.length;
                                if (startIndex + numSlots > timeSlots.length) return null;
                                let isAllAvailable = true;
                                for (let i = 0; i < numSlots; i++) {
                                    const slotToCheck = timeSlots[startIndex + i];
                                    const isTaken = bookedSlots.some(b =>
                                        b.date === newMoveDate &&
                                        b.court === newMoveCourt &&
                                        b.time === slotToCheck.time &&
                                        !selectedForMove.some(selected => selected.date === b.date && selected.court === b.court && selected.time === b.time)
                                    );
                                    if (isTaken) { isAllAvailable = false; break; }
                                }
                                if (!isAllAvailable) return null;
                                return <option key={ts.time} value={ts.time}>{ts.time} ({ts.price}฿)</option>;
                            })}
                        </select>
                        {newMoveTime && (
                            <div style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '4px' }}>
                                * ระบบจะย้ายต่อเนื่องจำนวน {selectedForMove.length} สล็อต
                            </div>
                        )}
                    </div>
                </div>

                <button onClick={handleConfirmMove} disabled={!newMoveTime} style={{ width: '100%', padding: '12px', background: newMoveTime ? 'var(--primary-gradient)' : '#ccc', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: newMoveTime ? 'pointer' : 'not-allowed' }}>
                    <i className="fa-solid fa-check"></i> ยืนยันการย้ายเวลา
                </button>
            </div>
        </div>
    );
}

export default MoveModal;
