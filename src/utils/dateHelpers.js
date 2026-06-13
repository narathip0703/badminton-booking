// ==========================================
// 📅 ฟังก์ชันสร้างวันที่ล่วงหน้า 7 วัน (เริ่มต้นจากวันนี้)
// ==========================================
export const getNext7Days = () => {
    const days = [];
    const optionsDay = { weekday: 'short' };
    const optionsDate = { day: 'numeric' };
    const optionsMonth = { month: 'short' };

    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        days.push({
            id: d.toISOString().split('T')[0],
            dayName: d.toLocaleDateString('th-TH', optionsDay),
            dateNum: d.toLocaleDateString('th-TH', optionsDate),
            monthName: d.toLocaleDateString('th-TH', optionsMonth),
            fullDate: d
        });
    }
    return days;
};

// ==========================================
// 🕒 ฟังก์ชันแปลงวันเวลาปัจจุบันให้เป็นภาษาไทย
// ==========================================
export const formatCurrentDateTime = (dateObj) => {
    const options = {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    };
    const dateText = dateObj.toLocaleDateString('th-TH', options);

    const pad = (n) => n < 10 ? '0' + n : n;
    const hours = pad(dateObj.getHours());
    const minutes = pad(dateObj.getMinutes());

    return `${dateText} เวลา ${hours}:${minutes} น.`;
};
