import React from 'react';

function DatePicker({ datesList, selectedDate, setSelectedDate }) {
    return (
        <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>เลือกวันที่ทำรายการ</h3>
                <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 'bold' }}>เลื่อนขวาเพื่อดูวันอื่น <i className="fa-solid fa-chevron-right" style={{ marginLeft: '2px' }}></i></span>
            </div>

            <div className="horizontal-scroll hide-scrollbar">
                {datesList.map((day) => {
                    const isSelected = selectedDate === day.id;
                    return (
                        <div
                            key={day.id}
                            onClick={() => { setSelectedDate(day.id); }}
                            className="btn-animate"
                            style={{
                                flex: '0 0 68px', padding: '12px 6px', borderRadius: 'var(--radius-md)',
                                textAlign: 'center', cursor: 'pointer',
                                backgroundColor: isSelected ? 'var(--primary)' : 'var(--card-bg)',
                                color: isSelected ? 'white' : 'var(--text-primary)',
                                border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                                boxShadow: isSelected ? '0 4px 10px rgba(255, 107, 0, 0.2)' : 'var(--shadow-sm)',
                            }}
                        >
                            <div style={{ fontSize: '11px', fontWeight: 'bold', opacity: isSelected ? 0.9 : 0.6 }}>{day.dayName}</div>
                            <div style={{ fontSize: '19px', fontWeight: '800', margin: '2px 0' }}>{day.dateNum}</div>
                            <div style={{ fontSize: '11px', opacity: isSelected ? 0.9 : 0.6 }}>{day.monthName}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default DatePicker;
