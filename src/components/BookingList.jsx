import React from 'react';

function BookingList({
    myBookingsToday,
    selectedDate,
    formatDateText,
    isMoveMode,
    setIsMoveMode,
    selectedForMove,
    setSelectedForMove,
    handleOpenMoveModal,
    handleCancelAllToday,
    toggleSelectForMove,
    handleCancelBooking,
    handleShareBooking
}) {
    return (
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', marginBottom: '30px', marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                    <span style={{ color: 'var(--primary)' }}>🏸</span> รายการจองของคุณ ({formatDateText(selectedDate)})
                </h3>
                {myBookingsToday.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {!isMoveMode ? (
                            <button onClick={() => { setIsMoveMode(true); setSelectedForMove([]); }} className="btn-animate" style={{ border: 'none', background: 'none', color: 'var(--primary)', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <i className="fa-solid fa-exchange"></i> ย้ายเวลา
                            </button>
                        ) : (
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={() => setIsMoveMode(false)} className="btn-animate" style={{ border: 'none', background: 'none', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                                    ยกเลิก
                                </button>
                                <button onClick={handleOpenMoveModal} disabled={selectedForMove.length === 0} className="btn-animate" style={{ border: 'none', background: selectedForMove.length > 0 ? 'var(--primary)' : '#ccc', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: selectedForMove.length > 0 ? 'pointer' : 'not-allowed' }}>
                                    ดำเนินการ ({selectedForMove.length})
                                </button>
                            </div>
                        )}
                        <button onClick={handleCancelAllToday} className="btn-animate" style={{ border: 'none', background: 'none', color: 'var(--danger)', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <i className="fa-solid fa-trash-can"></i> ยกเลิกทั้งหมดวันนี้
                        </button>
                    </div>
                )}
            </div>

            {myBookingsToday.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '10px 0' }}>คุณยังไม่มีการจองสนามในวันนี้</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {myBookingsToday.map((booking, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: 'rgba(255, 107, 0, 0.03)', border: '1px dashed rgba(255, 107, 0, 0.3)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {isMoveMode && (
                                    <input type="checkbox" style={{ transform: 'scale(1.3)', accentColor: 'var(--primary)', cursor: 'pointer' }}
                                        checked={selectedForMove.some(b => b.date === booking.date && b.court === booking.court && b.time === booking.time)}
                                        onChange={() => toggleSelectForMove(booking)}
                                    />
                                )}
                                <div>
                                    <span style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--primary)' }}>{booking.court}</span>
                                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', marginLeft: '8px' }}>เวลา {booking.time}</span>
                                </div>
                            </div>
                            {!isMoveMode && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => handleCancelBooking(booking)} className="btn-animate" style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', padding: '4px 8px' }}>
                                        <i className="fa-solid fa-circle-xmark"></i> ยกเลิกจอง
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default BookingList;
