import React from 'react';
import { leftCourts, rightCourts, timeSlots } from '../constants/courtData';

function CourtMap({ bookedSlots, selectedDate, onCourtClick }) {
    const getAvailableSlotsCount = (courtName) => {
        const bookedCount = bookedSlots.filter(
            (b) => b.date === selectedDate && b.court === courtName
        ).length;
        return timeSlots.length - bookedCount;
    };

    return (
        <div className="court-hall">
            <div className="court-col-left">
                {leftCourts.map((courtName) => {
                    const availableCount = getAvailableSlotsCount(courtName);
                    return (
                        <div key={courtName} onClick={() => onCourtClick(courtName)} className="court-item court-vertical">
                            <div className="court-title">{courtName}</div>
                            <div className={`court-badge ${availableCount === 0 ? 'full' : 'available-high'}`}>{availableCount === 0 ? 'เต็มแล้ว' : `ว่าง ${availableCount}/16`}</div>
                        </div>
                    );
                })}
            </div>

            <div className="court-col-right">
                {rightCourts.map((courtName) => {
                    const availableCount = getAvailableSlotsCount(courtName);
                    return (
                        <div key={courtName} onClick={() => onCourtClick(courtName)} className="court-item court-horizontal">
                            <div className="court-title">{courtName}</div>
                            <div className={`court-badge ${availableCount === 0 ? 'full' : 'available-high'}`}>{availableCount === 0 ? 'เต็มแล้ว' : `ว่าง ${availableCount}/16`}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default CourtMap;
