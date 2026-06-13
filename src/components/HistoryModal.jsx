import React from 'react';

function HistoryModal({
    showHistoryModal,
    setShowHistoryModal,
    allMyBookings,
    formatDateText,
    handleCancelBooking,
    handleCancelAllGlobal
}) {
    if (!showHistoryModal) return null;

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)',
            zIndex: 150, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', animation: 'fadeIn 0.2s'
        }}>
            <div style={{
                backgroundColor: 'white', width: '100%', maxHeight: '80%',
                borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px',
                display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        <i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--primary)', marginRight: '8px' }}></i>
                        ประวัติการจองทั้งหมด ({allMyBookings.length})
                    </h3>
                    <button onClick={() => setShowHistoryModal(false)} style={{ background: 'var(--border-color)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div style={{ overflowY: 'auto', flexGrow: 1, paddingBottom: '16px' }} className="hide-scrollbar">
                    {allMyBookings.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>คุณยังไม่มีการจองสนามแบดมินตัน</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {allMyBookings.map((booking, idx) => (
                                <div key={idx} style={{ padding: '14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-color)', backgroundColor: '#fdfdfd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{booking.court}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{formatDateText(booking.date)} | {booking.time}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button onClick={() => handleCancelBooking(booking)} className="btn-animate" style={{ backgroundColor: 'var(--danger-light)', border: 'none', color: 'var(--danger)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                                            <i className="fa-solid fa-trash-can"></i> ยกเลิก
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {allMyBookings.length > 0 && (
                    <button onClick={handleCancelAllGlobal} className="btn-animate" style={{ width: '100%', padding: '12px', backgroundColor: 'var(--danger)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', marginTop: '10px' }}>
                        <i className="fa-solid fa-trash-arrow-up"></i> ยกเลิกรายการจองทั้งหมด ({allMyBookings.length} รายการ)
                    </button>
                )}
            </div>
        </div>
    );
}

export default HistoryModal;
