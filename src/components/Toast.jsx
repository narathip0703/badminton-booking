import React from 'react';

function Toast({ message }) {
    if (!message) return null;

    return (
        <div style={{
            position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
            backgroundColor: 'rgba(30, 30, 36, 0.95)', color: 'white', padding: '12px 20px',
            borderRadius: '50px', zIndex: 200, boxShadow: '0 4px 15px rgba(0, 0, 0, 0.25)',
            fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center',
            gap: '8px', minWidth: '280px', justifyContent: 'center', animation: 'fadeIn 0.2s ease-out'
        }}>
            {message}
        </div>
    );
}

export default Toast;
