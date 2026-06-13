import React from 'react';

function ConfirmDialog({ title, message, confirmText, cancelText, onConfirm, onCancel, isDanger }) {
    return (
        <>
            <div className="drawer-overlay" onClick={onCancel} style={{ zIndex: 200 }}></div>
            <div className="confirm-dialog-box" style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: 'calc(100% - 48px)', maxWidth: '360px',
                backgroundColor: 'white', borderRadius: 'var(--radius-md)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.25)', zIndex: 201,
                overflow: 'hidden'
            }}>
                {/* Accent bar */}
                <div style={{ height: '4px', background: isDanger ? 'var(--danger-gradient)' : 'var(--primary-gradient)' }}></div>

                <div style={{ padding: '24px 20px 20px 20px' }}>
                    {/* Animated Icon */}
                    <div className={isDanger ? 'confirm-icon-danger' : 'confirm-icon-normal'} style={{
                        width: '56px', height: '56px', borderRadius: '50%',
                        backgroundColor: isDanger ? 'var(--danger-light)' : 'var(--primary-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px auto', fontSize: '24px',
                        color: isDanger ? 'var(--danger)' : 'var(--primary)',
                        border: isDanger ? '2px solid rgba(239, 68, 68, 0.2)' : '2px solid rgba(255, 107, 0, 0.2)'
                    }}>
                        <i className={`fa-solid ${isDanger ? 'fa-triangle-exclamation' : 'fa-circle-question'}`}></i>
                    </div>

                    {/* Title */}
                    <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', textAlign: 'center', marginBottom: '8px' }}>
                        {title || 'ยืนยันดำเนินการ'}
                    </h3>

                    {/* Message */}
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: '1.6', marginBottom: '24px' }}>
                        {message}
                    </p>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={onCancel}
                            className="btn-animate"
                            style={{
                                flex: 1, padding: '13px', border: '1.5px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)', backgroundColor: 'white',
                                fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
                                color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', gap: '6px'
                            }}
                        >
                            <i className="fa-solid fa-xmark"></i> {cancelText || 'ไม่ใช่'}
                        </button>
                        <button
                            onClick={onConfirm}
                            className="btn-animate"
                            style={{
                                flex: 1.2, padding: '13px', border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                background: isDanger ? 'var(--danger-gradient)' : 'var(--primary-gradient)',
                                color: 'white', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
                                boxShadow: isDanger ? '0 4px 12px rgba(239, 68, 68, 0.3)' : '0 4px 12px rgba(255, 107, 0, 0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                            }}
                        >
                            <i className={`fa-solid ${isDanger ? 'fa-trash-can' : 'fa-check'}`}></i> {confirmText || 'ยืนยัน'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ConfirmDialog;
