import React from 'react';
import { formatCurrentDateTime } from '../utils/dateHelpers';

function Header({ activeTab, setActiveTab, setActiveCourtForBooking, setIsMenuOpen, currentDateTime }) {
    return (
        <header style={{ background: 'var(--primary-gradient)', padding: '20px 20px 0 20px', color: 'white', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px', boxShadow: 'var(--shadow-md)', zIndex: 10, flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <button onClick={() => setIsMenuOpen(true)} className="btn-animate" style={{ background: 'rgba(255, 255, 255, 0.2)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px' }}>
                    <i className="fa-solid fa-bars"></i>
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '20px' }}>🏸</span>
                        <h1 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '0.5px', margin: 0 }}>สนาม SUSA</h1>
                    </div>
                    <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.85)', marginTop: '2px', fontWeight: '500' }}>
                        {formatCurrentDateTime(currentDateTime)}
                    </div>
                </div>

                {/* Spacer to keep title perfectly centered */}
                <div style={{ width: '40px' }}></div>
            </div>

            <div style={{ display: 'flex', width: '100%' }}>
                <div onClick={() => { setActiveTab('booking'); setActiveCourtForBooking(null); }} className={`nav-tab ${activeTab === 'booking' ? 'active' : ''}`}>
                    <i className="fa-solid fa-magnifying-glass-chart" style={{ marginRight: '6px' }}></i> จองสนาม
                </div>
                <div onClick={() => { setActiveTab('matchmaking'); setActiveCourtForBooking(null); }} className={`nav-tab ${activeTab === 'matchmaking' ? 'active' : ''}`}>
                    <i className="fa-solid fa-users-rectangle" style={{ marginRight: '6px' }}></i> ตีเกม
                </div>
            </div>
        </header>
    );
}

export default Header;
