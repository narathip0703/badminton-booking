// ==========================================
// 🔗 Google Sheets Web App URL
// ==========================================
export const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbxP2X6_3uadjhqoYuFPmU12disK_8secGDJX-Lb2Uu2B_H4NBAVZb6rjGFlHOyVlagKKg/exec';

// ==========================================
// 📤 ฟังก์ชันส่งข้อมูลไป Google Sheets
// ==========================================
export const sendToGoogleSheet = async (data) => {
    try {
        const response = await fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            // เปลี่ยนจาก no-cors เป็นการใช้ text/plain เพื่อเลี่ยง Preflight (OPTIONS) แต่ยังสามารถอ่านผลลัพธ์กลับมาได้
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        return { success: result.status === 'success', data: result };
    } catch (error) {
        console.error('❌ ส่งข้อมูลไป Google Sheets ไม่สำเร็จ:', error);
        return { success: false, data: null };
    }
};

// ==========================================
// 📥 ฟังก์ชันดึงข้อมูลการจองจริงและก๊วนตีเกมมาจาก Google Sheets (Real-time Sync)
// ==========================================
export const fetchBookingsFromSheet = async (setBookedSlots, setParticipantsList, showToast, setBlacklistStatus) => {
    if (!GOOGLE_SHEET_URL || GOOGLE_SHEET_URL.startsWith('ใส่_URL')) return;

    try {
        const response = await fetch(GOOGLE_SHEET_URL);
        const data = await response.json();

        // รองรับทั้ง Array เดิม และ Object ใหม่ ({ bookings, participants, blacklists })
        const bookingsData = Array.isArray(data) ? data : (data.bookings || []);
        const participantsData = Array.isArray(data) ? [] : (data.participants || []);
        const blacklistsData = Array.isArray(data) ? [] : (data.blacklists || []);

        if (bookingsData.length > 0 || !Array.isArray(data)) {
            const savedPhone = localStorage.getItem('bookingPhone') || '';
            const updatedSlots = bookingsData.map(b => {
                const normalizePhone = (p) => p ? String(p).replace(/^0+/, '').trim() : '';
                const isMyBooking = b.phone && normalizePhone(b.phone) === normalizePhone(savedPhone);

                return {
                    date: b.date,
                    court: b.court,
                    time: b.time,
                    price: Number(b.price) || 0,
                    name: b.name,
                    phone: b.phone,
                    byMe: isMyBooking
                };
            });
            setBookedSlots(updatedSlots);
        }

        if (participantsData.length > 0) {
            const savedName = localStorage.getItem('bookingNickname') || '';
            const updatedParticipants = participantsData.map(p => ({
                name: p.name,
                level: p.level || 'มือกลาง (Intermediate)',
                isMe: String(p.name).trim() === String(savedName).trim()
            }));
            setParticipantsList(updatedParticipants);
        }

        if (setBlacklistStatus) {
            const savedPhone = localStorage.getItem('bookingPhone') || '';
            const normalizePhone = (p) => p ? String(p).replace(/^0+/, '').trim() : '';
            const myPhone = normalizePhone(savedPhone);

            // ตรวจสอบว่าเบอร์ของเราอยู่ในลิสต์คนโดนแบนใน Sheet หรือไม่
            if (myPhone && blacklistsData.length > 0) {
                const isBlacklisted = blacklistsData.includes(myPhone);
                setBlacklistStatus(isBlacklisted);
            } else {
                setBlacklistStatus(false);
            }
        }

        console.log('🔄 อัปเดตข้อมูลจาก Google Sheets สำเร็จ');
    } catch (error) {
        console.error('❌ ไม่สามารถดึงข้อมูลจาก Google Sheets ได้:', error);
        if (showToast) showToast('⚠️ ไม่สามารถอัปเดตข้อมูลล่าสุดจาก Sheets ได้');
    }
};
