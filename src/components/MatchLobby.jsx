import React from 'react';

function MatchLobby({
    participantsList,
    isUserRegisteredInMatch,
    handleRegisterMatchLobby,
    newParticipantName,
    setNewParticipantName,
    participantLevel,
    setParticipantLevel,
    handleUnregisterMatchLobby
}) {
    return (
        <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
            {/* 💡 ปรับสไตล์กล่องที่ 1 ให้มีขนาด มิติ และสัดส่วนเท่ากับหน้าจองสนามพอดี */}
            <div style={{ backgroundColor: 'var(--card-bg)', padding: '16px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1.5px solid var(--border-color)', marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '5px', height: '100%', backgroundColor: 'var(--primary)' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginLeft: '6px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 'bold' }}>🏸 ก๊วนหลัก สนาม SUSA วันนี้</span>
                        <h2 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', margin: '2px 0 6px 0' }}>ก๊วนพี่เก้ง ชวนตีเกมร่วมสนุก</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            <div><i className="fa-solid fa-user-tie" style={{ width: '18px', color: 'var(--primary)' }}></i> <b>ผู้จัด (Host):</b> พี่เก้ง </div>
                            <div><i className="fa-solid fa-map-location-dot" style={{ width: '18px', color: 'var(--primary)' }}></i> <b>สนาม (Court):</b> สนาม 1-2 (SUSA Hall)</div>
                            <div><i className="fa-regular fa-clock" style={{ width: '18px', color: 'var(--primary)' }}></i> <b>ช่วงเวลา:</b> 19:00 - 00:00 น.</div>
                            <div><i className="fa-solid fa-ranking-star" style={{ width: '18px', color: 'var(--primary)' }}></i> <b>ระดับฝีมือ:</b> ทุกระดับ (มือใหม่ - มือโปร)</div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '26px', fontWeight: '900', color: 'var(--primary)' }}>{participantsList.length}</span>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>คนลงชื่อ</div>
                    </div>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '14px 0 10px 0' }} />
                <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>💰 อัตราค่าบริการตีเกมแชร์ร่วมสนุก:</span>
                    <div className="price-scale-grid">
                        <div className="price-scale-box"><div className="price-scale-title">👦 เด็กหรือนศ. (ค่าสนาม)</div><div className="price-scale-val">30 บาท</div></div>
                        <div className="price-scale-box"><div className="price-scale-title">🧑 ผู้ใหญ่ (ค่าสนาม)</div><div className="price-scale-val">50 บาท</div></div>
                        <div className="price-scale-box" style={{ border: '1.5px solid var(--primary)' }}><div className="price-scale-title">🏸 ค่าตีเกม</div><div className="price-scale-val">25 บาท/เกม</div></div>
                    </div>
                </div>
            </div>

            {/* 💡 ปรับสไตล์กล่องที่ 2 ให้มีขนาด มิติ และสัดส่วนเท่ากับหน้าจองสนามพอดี */}
            <div style={{ backgroundColor: 'var(--card-bg)', padding: '16px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1.5px solid var(--border-color)', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>📝 ลงทะเบียนร่วมตีเกม</h3>
                {!isUserRegisteredInMatch ? (
                    <form onSubmit={handleRegisterMatchLobby} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>ชื่อของคุณ :</label>
                            <input type="text" value={newParticipantName} onChange={(e) => setNewParticipantName(e.target.value)} placeholder="กรอกชื่อผู้ลงชื่อ" style={{ padding: '10px 12px', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>ระดับมือแบดมินตัน :</label>
                            <select value={participantLevel} onChange={(e) => setParticipantLevel(e.target.value)} style={{ padding: '10px 12px', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '14px', outline: 'none', fontFamily: 'inherit', backgroundColor: 'white' }}>
                                <option value="มือใหม่ (Beginner)">มือใหม่ (Beginner)</option>
                                <option value="มือกลาง (Intermediate)">มือกลาง (Intermediate)</option>
                                <option value="มือโปร (Advanced)">มือโปร (Advanced)</option>
                            </select>
                        </div>
                        <button type="submit" className="btn-animate" style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none', padding: '12px', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', marginTop: '6px', boxShadow: '0 4px 10px rgba(255, 107, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <i className="fa-solid fa-signature"></i> ลงชื่อเข้าร่วมตีเกมตอนนี้
                        </button>
                    </form>
                ) : (
                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                        <div style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 'bold', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <i className="fa-solid fa-circle-check"></i> คุณลงชื่อเข้าร่วมก๊วนเรียบร้อยแล้ว
                        </div>
                        <button onClick={handleUnregisterMatchLobby} className="btn-animate" style={{ width: '100%', padding: '12px', backgroundColor: 'var(--danger-light)', border: 'none', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <i className="fa-solid fa-user-minus"></i> ยกเลิกการลงชื่อเข้าร่วมก๊วน
                        </button>
                    </div>
                )}
            </div>

            {/* รายชื่อผู้เข้าร่วมตีเกม */}
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    👥 รายชื่อผู้เข้าร่วมตีเกมวันนี้ ({participantsList.length} คน)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {participantsList.map((player, index) => {
                        let levelClass = 'p-intermediate';
                        if (player.level.includes('มือใหม่')) levelClass = 'p-beginner';
                        if (player.level.includes('มือโปร')) levelClass = 'p-advanced';

                        return (
                            <div key={index} className="participant-item" style={{ backgroundColor: player.isMe ? 'rgba(255, 107, 0, 0.04)' : 'var(--card-bg)', border: player.isMe ? '1.5px dashed var(--primary)' : '1.5px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                                <span className="participant-num">{index + 1}.</span>
                                <span className="participant-name" style={{ fontWeight: player.isMe ? '800' : '600' }}>{player.name} {player.isMe && <span style={{ color: 'var(--primary)', fontSize: '11px' }}>(คุณ ⭐)</span>}</span>
                                <span className={`participant-badge ${levelClass}`}>{player.level.split(' ')[0]}</span>
                                {player.isMe && <button onClick={handleUnregisterMatchLobby} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '14px' }} title="ยกเลิกลงชื่อ"><i className="fa-solid fa-circle-xmark"></i></button>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default MatchLobby;
