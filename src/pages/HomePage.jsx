import React, { useState, useEffect } from 'react';

// ==========================================
// 🔗 Google Sheets Web App URL
// ==========================================
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbxoJu7dH4xEGlo2jzWSMQlr_MrB_WviCZZixLhdecJYEh4BAGvbX2TjTWg8eDXZ17327w/exec';

// ==========================================
// 📤 ฟังก์ชันส่งข้อมูลไป Google Sheets
// ==========================================
const sendToGoogleSheet = async (data) => {
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
const fetchBookingsFromSheet = async (setBookedSlots, setParticipantsList, showToast) => {
    if (!GOOGLE_SHEET_URL || GOOGLE_SHEET_URL.startsWith('ใส่_URL')) return;

    try {
        const response = await fetch(GOOGLE_SHEET_URL);
        const data = await response.json();

        // รองรับทั้ง Array เดิม และ Object ใหม่ ({ bookings, participants })
        const bookingsData = Array.isArray(data) ? data : (data.bookings || []);
        const participantsData = Array.isArray(data) ? [] : (data.participants || []);

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

        console.log('🔄 อัปเดตข้อมูลจาก Google Sheets สำเร็จ');
    } catch (error) {
        console.error('❌ ไม่สามารถดึงข้อมูลจาก Google Sheets ได้:', error);
        if (showToast) showToast('⚠️ ไม่สามารถอัปเดตข้อมูลล่าสุดจาก Sheets ได้');
    }
};

// ==========================================
// 📅 ฟังก์ชันสร้างวันที่ล่วงหน้า 7 วัน (เริ่มต้นจากวันนี้)
// ==========================================
const getNext7Days = () => {
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
const formatCurrentDateTime = (dateObj) => {
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

function HomePage({ handleLogout }) {
    const datesList = getNext7Days();

    // ==========================================
    // ⚙️ STATE MANAGEMENT
    // ==========================================
    const [activeTab, setActiveTab] = useState('booking');
    const [isSending, setIsSending] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(datesList[0].id);
    const [activeCourtForBooking, setActiveCourtForBooking] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showTodaySummary, setShowTodaySummary] = useState(false);
    const [currentDateTime, setCurrentDateTime] = useState(new Date());

    // 💡 สเตตสำหรับการย้ายเวลา (Move Booking) แบบ Batch
    const [isMoveMode, setIsMoveMode] = useState(false);
    const [selectedForMove, setSelectedForMove] = useState([]);

    // สเตตสำหรับหน้าต่างเลือกเวลาใหม่
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [newMoveDate, setNewMoveDate] = useState('');
    const [newMoveCourt, setNewMoveCourt] = useState('');
    const [newMoveTime, setNewMoveTime] = useState('');

    // สเตตเก็บเวลาแบบใหม่ (สำหรับวงล้อเลื่อนช่วงเวลาจอง)
    const [bookingStartTime, setBookingStartTime] = useState('16:00');
    const [bookingEndTime, setBookingEndTime] = useState('17:00');

    // 💡 สเตตสำหรับข้อมูลผู้จอง (ดึงค่าเริ่มต้นจาก localStorage ถ้ามี)
    const [bookingNickname, setBookingNickname] = useState(localStorage.getItem('bookingNickname') || '');
    const [bookingPhone, setBookingPhone] = useState(localStorage.getItem('bookingPhone') || '');

    // ฐานข้อมูลของการจองสนาม (เปลี่ยนเป็นเริ่มต้นด้วยอาเรย์ว่าง เพื่อรอโหลดจริงจาก Sheets)
    const [bookedSlots, setBookedSlots] = useState([]);
    const [toastMessage, setToastMessage] = useState(null);

    // ==========================================
    // 🏸 รายชื่อสนามและสล็อตเวลาความละเอียด 30 นาที
    // ==========================================
    const leftCourts = ['สนาม 6', 'สนาม 7'];
    const rightCourts = ['สนาม 1', 'สนาม 2', 'สนาม 3', 'สนาม 4', 'สนาม 5'];

    // จุดตัดแบ่งเวลาสำหรับวงล้อเลื่อน (Time Points)
    const timePoints = [
        '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
        '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '00:00'
    ];

    const timeSlots = [
        { time: '16:00 - 16:30', isPeak: false, price: 90 },
        { time: '16:30 - 17:00', isPeak: false, price: 90 },
        { time: '17:00 - 17:30', isPeak: false, price: 90 },
        { time: '17:30 - 18:00', isPeak: false, price: 90 },
        { time: '18:00 - 18:30', isPeak: true, price: 110 },
        { time: '18:30 - 19:00', isPeak: true, price: 110 },
        { time: '19:00 - 19:30', isPeak: true, price: 110 },
        { time: '19:30 - 20:00', isPeak: true, price: 110 },
        { time: '20:00 - 20:30', isPeak: true, price: 110 },
        { time: '20:30 - 21:00', isPeak: true, price: 110 },
        { time: '21:00 - 21:30', isPeak: false, price: 90 },
        { time: '21:30 - 22:00', isPeak: false, price: 90 },
        { time: '22:00 - 22:30', isPeak: false, price: 90 },
        { time: '22:30 - 23:00', isPeak: false, price: 90 },
        { time: '23:00 - 23:30', isPeak: false, price: 90 },
        { time: '23:30 - 00:00', isPeak: false, price: 90 }
    ];

    // ==========================================
    // 🏃 STATE ตีเกม
    // ==========================================
    const [participantsList, setParticipantsList] = useState([]);

    const [newParticipantName, setNewParticipantName] = useState(localStorage.getItem('newParticipantName') || localStorage.getItem('bookingNickname') || '');
    const [participantLevel, setParticipantLevel] = useState(localStorage.getItem('participantLevel') || 'มือกลาง (Intermediate)');

    // 💡 บันทึกข้อมูลลง LocalStorage อัตโนมัติเมื่อผู้ใช้พิมพ์ (ป้องกันข้อมูลหายเมื่อรีเฟรช)
    useEffect(() => {
        localStorage.setItem('bookingNickname', bookingNickname);
    }, [bookingNickname]);

    useEffect(() => {
        localStorage.setItem('bookingPhone', bookingPhone);
    }, [bookingPhone]);

    useEffect(() => {
        localStorage.setItem('newParticipantName', newParticipantName);
    }, [newParticipantName]);

    useEffect(() => {
        localStorage.setItem('participantLevel', participantLevel);
    }, [participantLevel]);

    // 💡 รันตัวนับเวลาสากลหน้าเว็บ
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 15000);
        return () => clearInterval(timer);
    }, []);

    // 💡 ดึงข้อมูลตามจริงจาก Google Sheets ทันทีเมื่อเปิดหน้าเว็บ
    useEffect(() => {
        fetchBookingsFromSheet(setBookedSlots, setParticipantsList, showToast);
    }, []);

    // ==========================================
    // 💡 ฟังก์ชันทำงาน (Logic)
    // ==========================================

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage(null);
        }, 3000);
    };

    const getAvailableSlotsCount = (courtName) => {
        const bookedCount = bookedSlots.filter(
            (b) => b.date === selectedDate && b.court === courtName
        ).length;
        return timeSlots.length - bookedCount;
    };

    // แตกช่วงเวลาที่ผู้ใช้เลือกจากวงล้อ ออกมาเป็นบล็อกย่อยชิ้นละ 30 นาที
    const getSlotsFromRange = (start, end) => {
        const startIndex = timePoints.indexOf(start);
        const endIndex = timePoints.indexOf(end);
        if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) return [];

        const slots = [];
        for (let i = startIndex; i < endIndex; i++) {
            const slotTime = `${timePoints[i]} - ${timePoints[i + 1]}`;
            const config = timeSlots.find(ts => ts.time === slotTime) || { isPeak: false, price: 90 };
            slots.push({
                date: selectedDate,
                court: activeCourtForBooking,
                time: slotTime,
                price: config.price
            });
        }
        return slots;
    };

    const currentRangeSlots = activeCourtForBooking ? getSlotsFromRange(bookingStartTime, bookingEndTime) : [];

    // ตรวจสอบว่าช่วงเวลาที่เลือกทับซ้อนกับที่ผู้อื่นจองไว้แล้วหรือไม่
    const isRangeConflictWithOthers = currentRangeSlots.some(slot => {
        return bookedSlots.some(b => b.date === selectedDate && b.court === activeCourtForBooking && b.time === slot.time && !b.byMe);
    });

    // ตรวจสอบว่าช่วงเวลาที่เลือกทับซ้อนกับที่เราจองไว้แล้วหรือไม่
    const isRangeConflictWithMe = currentRangeSlots.some(slot => {
        return bookedSlots.some(b => b.date === selectedDate && b.court === activeCourtForBooking && b.time === slot.time && b.byMe);
    });

    const totalPrice = currentRangeSlots.reduce((sum, s) => sum + s.price, 0);

    const handleConfirmBooking = async () => {
        if (currentRangeSlots.length === 0) return;

        // 💡 ตรวจสอบการกรอกข้อมูลชื่อเล่นและเบอร์โทร
        if (!bookingNickname.trim() || !bookingPhone.trim()) {
            showToast('⚠️ กรุณากรอกชื่อเล่นและเบอร์โทรศัพท์ก่อนยืนยันการจอง');
            return;
        }

        if (isRangeConflictWithOthers) {
            showToast('⚠️ ไม่สามารถจองได้ เนื่องจากมีช่วงเวลาที่ผู้อื่นจองแล้ว');
            return;
        }
        if (isRangeConflictWithMe) {
            showToast('⚠️ คุณได้เคยจองบางช่วงเวลาในนี้ไว้แล้ว');
            return;
        }

        // เซฟชื่อและเบอร์ลงในหน่วยความจำของบราวเซอร์เพื่อความสะดวกในครั้งต่อไป
        localStorage.setItem('bookingNickname', bookingNickname.trim());
        localStorage.setItem('bookingPhone', bookingPhone.trim());

        const newBookings = currentRangeSlots.map(s => ({
            date: s.date,
            court: s.court,
            time: s.time,
            byMe: true,
            name: bookingNickname.trim(),
            phone: bookingPhone.trim()
        }));

        // อัปเดต UI ทันทีแบบ Snappy
        setBookedSlots([...bookedSlots, ...newBookings]);
        setActiveCourtForBooking(null);
        showToast('🎉 จองสนามสำเร็จเรียบร้อย!');

        if (GOOGLE_SHEET_URL && !GOOGLE_SHEET_URL.startsWith('ใส่_URL')) {
            setIsSending(true);
            const sheetData = {
                action: 'booking',
                bookings: currentRangeSlots.map(s => ({
                    date: s.date,
                    court: s.court,
                    time: s.time,
                    price: s.price || '-',
                    name: bookingNickname.trim(),
                    phone: bookingPhone.trim()
                }))
            };
            const response = await sendToGoogleSheet(sheetData);
            setIsSending(false);
            if (response.success) {
                showToast('📤 บันทึกข้อมูลลง Google Sheets แล้ว');
            } else if (response.data && response.data.status === 'conflict') {
                showToast('⚠️ ' + response.data.message);
                // หากถูกจองตัดหน้าไปแล้ว ให้โหลดข้อมูลล่าสุดมาทับ (Revert UI ที่เพิ่งอัปเดตไป)
                fetchBookingsFromSheet(setBookedSlots, setParticipantsList, () => { });
            } else {
                showToast('⚠️ ระบบเซิร์ฟเวอร์ไม่ว่าง กรุณารีเฟรชและลองใหม่');
            }
        }
    };

    const toggleSelectForMove = (booking) => {
        const isSelected = selectedForMove.some(b => b.date === booking.date && b.court === booking.court && b.time === booking.time);
        if (isSelected) {
            setSelectedForMove(selectedForMove.filter(b => !(b.date === booking.date && b.court === booking.court && b.time === booking.time)));
        } else {
            setSelectedForMove([...selectedForMove, booking]);
        }
    };

    const handleOpenMoveModal = () => {
        if (selectedForMove.length === 0) {
            showToast('⚠️ กรุณาเลือกรายการจองอย่างน้อย 1 รายการ');
            return;
        }
        setNewMoveDate(selectedForMove[0].date);
        setNewMoveCourt(selectedForMove[0].court);
        setNewMoveTime('');
        setShowMoveModal(true);
    };

    const handleConfirmMove = async () => {
        if (!newMoveTime) {
            showToast('⚠️ กรุณาเลือกเวลาเริ่มต้นใหม่ที่ต้องการย้ายไป');
            return;
        }

        const startTimeIndex = timeSlots.findIndex(t => t.time === newMoveTime);
        if (startTimeIndex === -1) return;

        const numSlotsNeeded = selectedForMove.length;
        if (startTimeIndex + numSlotsNeeded > timeSlots.length) {
            showToast('⚠️ เวลาที่เลือกมีไม่เพียงพอสำหรับจำนวนสล็อตที่ย้าย');
            return;
        }

        const newBookings = [];
        for (let i = 0; i < numSlotsNeeded; i++) {
            const slot = timeSlots[startTimeIndex + i];
            const isTaken = bookedSlots.some(b =>
                b.date === newMoveDate &&
                b.court === newMoveCourt &&
                b.time === slot.time &&
                !selectedForMove.some(selected => selected.date === b.date && selected.court === b.court && selected.time === b.time)
            );
            if (isTaken) {
                showToast(`⚠️ ไม่สามารถย้ายได้ เวลา ${slot.time} ถูกจองแล้ว`);
                return;
            }
            newBookings.push({
                date: newMoveDate,
                court: newMoveCourt,
                time: slot.time,
                price: slot.price,
                name: bookingNickname.trim(),
                phone: bookingPhone.trim()
            });
        }

        const confirmMove = window.confirm(`ยืนยันการย้าย ${numSlotsNeeded} รายการ เริ่มเวลา ${newMoveTime} ใช่หรือไม่?`);
        if (!confirmMove) return;

        // Optimistic UI Update 
        const remainingSlots = bookedSlots.filter(b =>
            !selectedForMove.some(selected => selected.date === b.date && selected.court === b.court && selected.time === b.time)
        );
        const newSlotsWithByMe = newBookings.map(b => ({ ...b, byMe: true }));
        setBookedSlots([...remainingSlots, ...newSlotsWithByMe]);

        setShowMoveModal(false);
        setIsMoveMode(false);
        const backupSelected = [...selectedForMove];
        setSelectedForMove([]);
        showToast('🔄 กำลังย้ายเวลา...');

        if (GOOGLE_SHEET_URL && !GOOGLE_SHEET_URL.startsWith('ใส่_URL')) {
            setIsSending(true);
            const sheetData = {
                action: 'move_booking',
                oldBookings: backupSelected.map(b => ({
                    date: b.date,
                    court: b.court,
                    time: b.time,
                    name: bookingNickname.trim(),
                    phone: bookingPhone.trim()
                })),
                newBookings: newBookings
            };
            const response = await sendToGoogleSheet(sheetData);
            setIsSending(false);
            if (response.success) {
                showToast('✅ ย้ายเวลาและอัปเดตระบบสำเร็จ!');
            } else {
                showToast('⚠️ ' + (response.data ? response.data.message : 'เกิดข้อผิดพลาดในการย้ายเวลา'));
                // Revert UI หากเกิดข้อผิดพลาด
                fetchBookingsFromSheet(setBookedSlots, setParticipantsList, () => { });
            }
        }
    };

    const handleCancelBooking = async (bookingToCancel) => {
        const confirmCancel = window.confirm(
            `ต้องการยกเลิกการจอง ${bookingToCancel.court} เวลา ${bookingToCancel.time} (${formatDateText(bookingToCancel.date)}) หรือไม่?`
        );

        if (confirmCancel) {
            setBookedSlots(bookedSlots.filter(
                (b) => !(b.date === bookingToCancel.date && b.court === bookingToCancel.court && b.time === bookingToCancel.time)
            ));
            showToast('🗑️ ยกเลิกการจองเรียบร้อย');

            if (GOOGLE_SHEET_URL && !GOOGLE_SHEET_URL.startsWith('ใส่_URL')) {
                setIsSending(true);
                const sheetData = {
                    action: 'cancel_bookings',
                    bookings: [{
                        date: bookingToCancel.date,
                        court: bookingToCancel.court,
                        time: bookingToCancel.time,
                        name: bookingNickname.trim(),
                        phone: bookingPhone.trim()
                    }]
                };
                const response = await sendToGoogleSheet(sheetData);
                setIsSending(false);
                if (response.success) {
                    showToast('🗑️ อัปเดตข้อมูลการยกเลิกบน Google Sheets แล้ว');
                } else {
                    showToast('⚠️ ยกเลิกสำเร็จใน UI แต่ส่งข้อมูลไป Google Sheets ไม่ได้');
                }
            }
        }
    };

    const handleCancelAllToday = async () => {
        const confirmCancel = window.confirm('คุณต้องการยกเลิกการจองทั้งหมดของคุณของวันนี้ใช่หรือไม่?');
        if (confirmCancel) {
            const toCancel = bookedSlots.filter(b => b.date === selectedDate && b.byMe);

            setBookedSlots(bookedSlots.filter(b => !(b.date === selectedDate && b.byMe)));
            showToast('🗑️ ยกเลิกการจองทั้งหมดของวันนี้เรียบร้อย');

            if (GOOGLE_SHEET_URL && !GOOGLE_SHEET_URL.startsWith('ใส่_URL') && toCancel.length > 0) {
                setIsSending(true);
                const sheetData = {
                    action: 'cancel_bookings',
                    bookings: toCancel.map(b => ({
                        date: b.date,
                        court: b.court,
                        time: b.time,
                        name: bookingNickname.trim(),
                        phone: bookingPhone.trim()
                    }))
                };
                await sendToGoogleSheet(sheetData);
                setIsSending(false);
            }
        }
    };

    const handleCancelAllGlobal = async () => {
        const confirmCancel = window.confirm('คุณต้องการยกเลิกประวัติการจองทั้งหมดของคุณในระบบใช่หรือไม่?');
        if (confirmCancel) {
            const toCancel = bookedSlots.filter(b => b.byMe);

            setBookedSlots(bookedSlots.filter(b => !b.byMe));
            setShowHistoryModal(false);
            showToast('🗑️ ยกเลิกการจองทั้งหมดของคุณในระบบเรียบร้อย');

            if (GOOGLE_SHEET_URL && !GOOGLE_SHEET_URL.startsWith('ใส่_URL') && toCancel.length > 0) {
                setIsSending(true);
                const sheetData = {
                    action: 'cancel_bookings',
                    bookings: toCancel.map(b => ({
                        date: b.date,
                        court: b.court,
                        time: b.time,
                        name: bookingNickname.trim(),
                        phone: bookingPhone.trim()
                    }))
                };
                await sendToGoogleSheet(sheetData);
                setIsSending(false);
            }
        }
    };

    const handleRegisterMatchLobby = async (e) => {
        e.preventDefault();
        if (!newParticipantName.trim()) {
            showToast('⚠️ กรุณากรอกชื่อของคุณเพื่อลงชื่อ');
            return;
        }

        const isAlreadyRegistered = participantsList.some(p => p.isMe);
        if (isAlreadyRegistered) {
            showToast('⚠️ คุณได้ลงชื่อร่วมก๊วนนี้ไปแล้ว');
            return;
        }

        const newPlayer = {
            name: newParticipantName.trim(),
            level: participantLevel,
            isMe: true
        };

        setParticipantsList([...participantsList, newPlayer]);
        showToast('🏸 ลงชื่อร่วมก๊วนสำเร็จ!');

        if (GOOGLE_SHEET_URL && !GOOGLE_SHEET_URL.startsWith('ใส่_URL')) {
            setIsSending(true);
            const sheetData = {
                action: 'match_register',
                name: newParticipantName.trim(),
                level: participantLevel
            };
            const response = await sendToGoogleSheet(sheetData);
            setIsSending(false);
            if (response.success) {
                showToast('📤 บันทึกลงชื่อใน Google Sheets แล้ว');
            } else {
                showToast('⚠️ ลงชื่อสำเร็จ แต่ส่งข้อมูลไป Google Sheets ไม่ได้');
            }
        }
    };

    const handleUnregisterMatchLobby = async () => {
        const myRegistration = participantsList.find(p => p.isMe);
        const registeredName = myRegistration ? myRegistration.name : newParticipantName.trim();

        setParticipantsList(participantsList.filter(p => !p.isMe));
        showToast('🏃 ยกเลิกการลงชื่อร่วมก๊วนแล้ว');

        if (GOOGLE_SHEET_URL && !GOOGLE_SHEET_URL.startsWith('ใส่_URL')) {
            setIsSending(true);
            const sheetData = {
                action: 'cancel_match',
                name: registeredName
            };
            const response = await sendToGoogleSheet(sheetData);
            setIsSending(false);
            if (response.success) {
                showToast('🏃 ยกเลิกลงชื่อใน Google Sheets เรียบร้อย');
            }
        }
    };

    const formatDateText = (dateStr) => {
        const match = datesList.find(d => d.id === dateStr);
        if (match) {
            const todayStr = datesList[0].id;
            const tomorrowStr = datesList[1].id;
            if (dateStr === todayStr) return 'วันนี้';
            if (dateStr === tomorrowStr) return 'วันพรุ่งนี้';
            return `${match.dayName} ${match.dateNum} ${match.monthName}`;
        }
        return dateStr;
    };

    const myBookingsToday = bookedSlots.filter(b => b.date === selectedDate && b.byMe);
    const allMyBookings = bookedSlots.filter(b => b.byMe);
    const isUserRegisteredInMatch = participantsList.some(p => p.isMe);

    // 🟠 สรุปข้อมูลจองวันนี้ (today) ทุกสนาม ทุกคน
    const todayStr = datesList[0].id;
    const todayBookings = bookedSlots.filter(b => b.date === todayStr);

    // จัดกลุ่มตามสนาม แล้วจัดกลุ่มตามชื่อผู้จอง แล้วรวมเวลาที่ต่อเนื่องกัน
    const getTodaySummaryByCourt = () => {
        const allCourts = [...leftCourts, ...rightCourts];
        const summary = [];
        allCourts.forEach(court => {
            const courtBookings = todayBookings.filter(b => b.court === court);
            if (courtBookings.length === 0) return;

            // จัดกลุ่มตามชื่อผู้จอง
            const byPerson = {};
            courtBookings.forEach(b => {
                const key = b.name || 'ไม่ระบุ';
                if (!byPerson[key]) byPerson[key] = [];
                byPerson[key].push(b);
            });

            const persons = [];
            Object.entries(byPerson).forEach(([name, bookings]) => {
                // เรียงตามเวลา
                const sorted = bookings.sort((a, bb) => {
                    const aStart = a.time.split(' - ')[0];
                    const bStart = bb.time.split(' - ')[0];
                    return aStart.localeCompare(bStart);
                });

                // รวมเวลาที่ต่อเนื่องกัน
                const ranges = [];
                let currentStart = null;
                let currentEnd = null;
                sorted.forEach(b => {
                    const [s, e] = b.time.split(' - ').map(x => x.trim());
                    if (currentEnd === null) {
                        currentStart = s;
                        currentEnd = e;
                    } else if (s === currentEnd) {
                        currentEnd = e;
                    } else {
                        ranges.push(`${currentStart} - ${currentEnd}`);
                        currentStart = s;
                        currentEnd = e;
                    }
                });
                if (currentStart !== null) {
                    ranges.push(`${currentStart} - ${currentEnd}`);
                }

                persons.push({ name, ranges, slotCount: bookings.length });
            });

            summary.push({ court, persons, totalSlots: courtBookings.length });
        });
        return summary;
    };

    return (
        <div className="app-container">
            {/* 🔴 TOAST NOTIFICATION */}
            {toastMessage && (
                <div style={{
                    position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(30, 30, 36, 0.95)', color: 'white', padding: '12px 20px',
                    borderRadius: '50px', zIndex: 200, boxShadow: '0 4px 15px rgba(0, 0, 0, 0.25)',
                    fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center',
                    gap: '8px', minWidth: '280px', justifyContent: 'center', animation: 'fadeIn 0.2s ease-out'
                }}>
                    {toastMessage}
                </div>
            )}

            {/* 🔴 MODAL สำหรับย้ายเวลาแบบหลายรายการ */}
            {showMoveModal && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
                    zIndex: 250, display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 0.2s'
                }}>
                    <div style={{
                        backgroundColor: 'white', width: '90%', maxWidth: '400px', borderRadius: '16px', padding: '24px',
                        display: 'flex', flexDirection: 'column', animation: 'scaleIn 0.2s ease-out'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--primary)' }}>
                                <i className="fa-solid fa-calendar-days"></i> ย้ายเวลาจอง ({selectedForMove.length} รายการ)
                            </h3>
                            <button onClick={() => setShowMoveModal(false)} style={{ background: 'var(--border-color)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <div style={{ backgroundColor: '#fff5f5', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #fed7d7', maxHeight: '120px', overflowY: 'auto' }} className="hide-scrollbar">
                            <div style={{ fontSize: '12px', color: '#e53e3e', fontWeight: 'bold', marginBottom: '4px' }}>รายการที่จะย้าย:</div>
                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                                {selectedForMove.map((b, idx) => (
                                    <li key={idx}>{b.court} | {formatDateText(b.date)} | {b.time}</li>
                                ))}
                            </ul>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>วันที่ใหม่ :</label>
                                <select value={newMoveDate} onChange={(e) => { setNewMoveDate(e.target.value); setNewMoveTime(''); }} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}>
                                    {datesList.map(d => <option key={d.id} value={d.id}>{formatDateText(d.id)} ({d.dateNum} {d.monthName})</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>สนามใหม่ :</label>
                                <select value={newMoveCourt} onChange={(e) => { setNewMoveCourt(e.target.value); setNewMoveTime(''); }} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}>
                                    {[...leftCourts, ...rightCourts].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>เวลาเริ่มต้นใหม่ :</label>
                                <select value={newMoveTime} onChange={(e) => setNewMoveTime(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}>
                                    <option value="">-- เลือกเวลาเริ่มต้น --</option>
                                    {timeSlots.map(ts => {
                                        const startIndex = timeSlots.findIndex(t => t.time === ts.time);
                                        const numSlots = selectedForMove.length;
                                        if (startIndex + numSlots > timeSlots.length) return null;
                                        let isAllAvailable = true;
                                        for (let i = 0; i < numSlots; i++) {
                                            const slotToCheck = timeSlots[startIndex + i];
                                            const isTaken = bookedSlots.some(b =>
                                                b.date === newMoveDate &&
                                                b.court === newMoveCourt &&
                                                b.time === slotToCheck.time &&
                                                !selectedForMove.some(selected => selected.date === b.date && selected.court === b.court && selected.time === b.time)
                                            );
                                            if (isTaken) { isAllAvailable = false; break; }
                                        }
                                        if (!isAllAvailable) return null;
                                        return <option key={ts.time} value={ts.time}>{ts.time} ({ts.price}฿)</option>;
                                    })}
                                </select>
                                {newMoveTime && (
                                    <div style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '4px' }}>
                                        * ระบบจะย้ายต่อเนื่องจำนวน {selectedForMove.length} สล็อต
                                    </div>
                                )}
                            </div>
                        </div>

                        <button onClick={handleConfirmMove} disabled={!newMoveTime} style={{ width: '100%', padding: '12px', background: newMoveTime ? 'var(--primary-gradient)' : '#ccc', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: newMoveTime ? 'pointer' : 'not-allowed' }}>
                            <i className="fa-solid fa-check"></i> ยืนยันการย้ายเวลา
                        </button>
                    </div>
                </div>
            )}

            {/* ☰ 🔴 SIDE MENU DRAWER */}
            {isMenuOpen && (
                <>
                    <div className="drawer-overlay" onClick={() => setIsMenuOpen(false)}></div>
                    <div className="drawer-menu">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                            <button onClick={() => setIsMenuOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '1.5px solid var(--border-color)', paddingBottom: '20px' }}>
                            <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 12px auto' }}>
                                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80" alt="User Avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }} />
                                <span style={{ position: 'absolute', bottom: '0', right: '0', backgroundColor: '#10b981', width: '18px', height: '18px', borderRadius: '50%', border: '2px solid white' }}></span>
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>{bookingNickname || 'ผู้ใช้งานระบบ'}</h3>
                            <span style={{ fontSize: '12px', padding: '3px 10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '20px', fontWeight: 'bold' }}>
                                เบอร์โทร: {bookingPhone || 'ยังไม่ได้ระบุ'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
                            <button onClick={() => { setActiveTab('booking'); setIsMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 16px', background: activeTab === 'booking' ? 'var(--primary-light)' : 'none', border: 'none', borderRadius: 'var(--radius-sm)', color: activeTab === 'booking' ? 'var(--primary)' : 'var(--text-primary)', fontSize: '16px', fontWeight: 'bold', textAlign: 'left', cursor: 'pointer', width: '100%' }}>
                                <i className="fa-solid fa-map-location-dot" style={{ width: '20px' }}></i> แผนผังและจองสนาม
                            </button>

                            <button onClick={() => { setActiveTab('matchmaking'); setIsMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 16px', background: activeTab === 'matchmaking' ? 'var(--primary-light)' : 'none', border: 'none', borderRadius: 'var(--radius-sm)', color: activeTab === 'matchmaking' ? 'var(--primary)' : 'var(--text-primary)', fontSize: '16px', fontWeight: 'bold', textAlign: 'left', cursor: 'pointer', width: '100%' }}>
                                <i className="fa-solid fa-users" style={{ width: '20px' }}></i> ก๊วนตีเกมหาเพื่อน
                            </button>

                            <button onClick={() => { setShowHistoryModal(true); setIsMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 16px', background: 'none', border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '16px', fontWeight: 'bold', textAlign: 'left', cursor: 'pointer', width: '100%' }}>
                                <i className="fa-solid fa-clock-rotate-left" style={{ width: '20px' }}></i> ประวัติการจองทั้งหมด ({allMyBookings.length})
                            </button>

                            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '10px 0' }}></div>

                            <div style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                <p style={{ fontWeight: 'bold', marginBottom: '6px' }}>สนามแบดมินตัน SUSA</p>
                                <p><i className="fa-solid fa-phone" style={{ marginRight: '6px' }}></i> 089-123-4567</p>
                                <p><i className="fa-brands fa-line" style={{ marginRight: '6px', color: '#06C755' }}></i> @susab badminton</p>
                            </div>
                        </div>

                        <button onClick={handleLogout} className="btn-animate" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '12px', backgroundColor: 'var(--danger-light)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                            <i className="fa-solid fa-right-from-bracket"></i> ออกจากระบบ
                        </button>
                    </div>
                </>
            )}

            {/* 🔴 MODAL สำหรับย้ายเวลา */}


            {/* 🔴 MODAL แสดงประวัติการจองทั้งหมด */}
            {showHistoryModal && (
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
            )}

            {/* 🔴 POPUP MODAL จองสนามแบบละเอียด (ปรับปรุงแก้ปัญหาการโดนเบียดบนมือถือ) */}
            {activeCourtForBooking !== null && (
                <>
                    <div className="drawer-overlay" onClick={() => setActiveCourtForBooking(null)}></div>

                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, width: '100%', maxHeight: '85%',
                        backgroundColor: '#ffffff', borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
                        boxShadow: '0 -8px 30px rgba(0,0,0,0.15)', padding: '24px 20px 16px 20px', zIndex: 120,
                        display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        {/* หัวป๊อปอัพ (คงที่ไว้ด้านบน) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexShrink: 0 }}>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 'bold' }}>📅 เลือกเวลาจองแบบเลื่อนสะดวกสบาย</span>
                                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>🏸 {activeCourtForBooking}</h3>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>ประจำวัน: {formatDateText(selectedDate)}</p>
                            </div>
                            <button onClick={() => setActiveCourtForBooking(null)} style={{ background: 'var(--border-color)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        {/* 🟢 ส่วนเนื้อหาตรงกลาง: มัดรวมกันแล้วเปิด overflowY: 'auto' เพื่อแก้ปัญหาโดนเบียด */}
                        <div style={{ overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px', paddingRight: '4px' }} className="hide-scrollbar">

                            {/* 1. ส่วนเลื่อนเลือกเวลา (Dropdown วงล้อ) */}
                            <div style={{ backgroundColor: 'var(--bg-light)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>🕒 เวลาเริ่มต้น :</label>
                                        <select
                                            value={bookingStartTime}
                                            onChange={(e) => {
                                                setBookingStartTime(e.target.value);
                                                const startIdx = timePoints.indexOf(e.target.value);
                                                const endIdx = timePoints.indexOf(bookingEndTime);
                                                if (startIdx >= endIdx && startIdx < timePoints.length - 1) {
                                                    setBookingEndTime(timePoints[startIdx + 1]);
                                                }
                                            }}
                                            style={{ padding: '10px', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '15px', fontWeight: 'bold', backgroundColor: 'white', outline: 'none', width: '100%' }}
                                        >
                                            {timePoints.slice(0, -1).map(tp => (
                                                <option key={tp} value={tp}>{tp} น.</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ fontSize: '18px', color: 'var(--text-secondary)', marginTop: '16px' }}>→</div>

                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>🕒 เวลาสิ้นสุด :</label>
                                        <select
                                            value={bookingEndTime}
                                            onChange={(e) => setBookingEndTime(e.target.value)}
                                            style={{ padding: '10px', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '15px', fontWeight: 'bold', backgroundColor: 'white', outline: 'none', width: '100%' }}
                                        >
                                            {timePoints.map(tp => {
                                                const startIdx = timePoints.indexOf(bookingStartTime);
                                                const currentIdx = timePoints.indexOf(tp);
                                                if (currentIdx <= startIdx) return null;
                                                return <option key={tp} value={tp}>{tp} น.</option>;
                                            })}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* 2. แสดงรายการสล็อตที่เลือก */}
                            <div>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>📋 ตรวจสอบสล็อตเวลาที่เลื่อนเลือกไว้:</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {currentRangeSlots.map((slot) => {
                                        const isBookedOthers = bookedSlots.some(b => b.date === selectedDate && b.court === activeCourtForBooking && b.time === slot.time && !b.byMe);
                                        const isBookedMe = bookedSlots.some(b => b.date === selectedDate && b.court === activeCourtForBooking && b.time === slot.time && b.byMe);

                                        let statusText = `ว่าง (${slot.price}฿)`;
                                        let bgColor = '#f0fff4'; let textColor = '#22c55e'; let icon = 'fa-circle-check';

                                        if (isBookedOthers) {
                                            statusText = '🔒 มีผู้จองแล้ว'; bgColor = '#fff5f5'; textColor = '#e53e3e'; icon = 'fa-circle-xmark';
                                        } else if (isBookedMe) {
                                            statusText = '👤 คุณจองแล้ว'; bgColor = '#eff6ff'; textColor = '#3b82f6'; icon = 'fa-user-check';
                                        }

                                        return (
                                            <div key={slot.time} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: bgColor, borderRadius: 'var(--radius-sm)', border: `1px solid ${textColor}40` }}>
                                                <div style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <i className="fa-regular fa-clock"></i> {slot.time}
                                                </div>
                                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: textColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <i className={`fa-solid ${icon}`}></i> {statusText}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 3. กล่องกรอกข้อมูลผู้จอง (💡 แก้ไข Bug ชื่อตัวแปรจาก bookingName เป็น bookingNickname ให้ถูกต้อง) */}
                            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        👤 ชื่อเล่นของคุณ :
                                    </label>
                                    <input
                                        type="text"
                                        value={bookingNickname}
                                        onChange={(e) => setBookingNickname(e.target.value)}
                                        placeholder="กรอกชื่อเล่นผู้จอง"
                                        style={{ padding: '10px 12px', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '14px', outline: 'none', backgroundColor: 'white' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        📱 เบอร์โทรศัพท์ :
                                    </label>
                                    <input
                                        type="tel"
                                        value={bookingPhone}
                                        onChange={(e) => setBookingPhone(e.target.value)}
                                        placeholder="กรอกเบอร์โทรศัพท์"
                                        style={{ padding: '10px 12px', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '14px', outline: 'none', backgroundColor: 'white' }}
                                    />
                                </div>
                            </div>

                        </div>

                        {/* ท้ายป๊อปอัพควบคุมปุ่มยืนยันราคา (ตรึงอยู่กับที่ด้านล่างสุด) */}
                        <div style={{ borderTop: '1.5px solid var(--border-color)', paddingTop: '16px', display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                            {isRangeConflictWithOthers ? (
                                <div style={{ width: '100%', color: 'var(--danger)', fontSize: '13px', fontWeight: 'bold', textAlign: 'center', padding: '10px', backgroundColor: 'var(--danger-light)', borderRadius: 'var(--radius-sm)' }}>
                                    ⚠️ ไม่สามารถทำรายการได้เนื่องจากเวลานี้ถูกจองแล้วบางส่วน
                                </div>
                            ) : (
                                <>
                                    <div style={{ flexGrow: 1 }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>รวมทั้งสิ้น ({currentRangeSlots.length} สล็อต)</span>
                                        <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--primary)' }}>
                                            {totalPrice} <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>บาท</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleConfirmBooking}
                                        className="btn-animate"
                                        style={{ flexGrow: 1.5, background: 'var(--primary-gradient)', border: 'none', color: 'white', padding: '12px 16px', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: 'var(--shadow-md)' }}
                                    >
                                        <i className="fa-solid fa-circle-check"></i> ยืนยันจองเวลานี้
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* 🔴 HEADER ZONE */}
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

                    <button onClick={() => setIsMenuOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <img src="https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png" alt="Profile Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid white', objectFit: 'cover' }} />
                    </button>
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

            {/* 🔴 MAIN CONTENT ZONE */}
            <main style={{ flexGrow: 1, overflowY: 'auto', padding: '16px' }} className="hide-scrollbar">
                {activeTab === 'booking' && (
                    <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
                        {/* 📅 ปฏิทินเลื่อนแนวนอน */}
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

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            <span style={{ fontSize: '16px' }}>📍</span>
                            <span><b>ผังคอร์ท:</b> แตะที่สนามเพื่อทำการเลื่อนสล็อตจองเวลา</span>
                        </div>

                        {/* 🏸 แผนผังสนาม */}
                        <div className="court-hall">
                            <div className="court-col-left">
                                {leftCourts.map((courtName) => {
                                    const availableCount = getAvailableSlotsCount(courtName);
                                    return (
                                        <div key={courtName} onClick={() => { setActiveCourtForBooking(courtName); setBookingStartTime('16:00'); setBookingEndTime('17:00'); }} className="court-item court-vertical">
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
                                        <div key={courtName} onClick={() => { setActiveCourtForBooking(courtName); setBookingStartTime('16:00'); setBookingEndTime('17:00'); }} className="court-item court-horizontal">
                                            <div className="court-title">{courtName}</div>
                                            <div className={`court-badge ${availableCount === 0 ? 'full' : 'available-high'}`}>{availableCount === 0 ? 'เต็มแล้ว' : `ว่าง ${availableCount}/16`}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* รายการจองวันนี้และปุ่มยกเลิก */}
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
                    </div>
                )}

                {/* แท็บตีเกมหาเพื่อน */}
                {activeTab === 'matchmaking' && (
                    <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
                        {/* 💡 ปรับสไตล์กล่องที่ 1 ให้มีขนาด มิติ และสัดส่วนเท่ากับหน้าจองสนามพอดี */}
                        <div style={{ backgroundColor: 'var(--card-bg)', padding: '16px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1.5px solid var(--border-color)', marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '5px', height: '100%', backgroundColor: 'var(--primary)' }}></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginLeft: '6px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 'bold' }}>🏸 ก๊วนหลัก สนาม SUSA วันนี้</span>
                                    <h2 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', margin: '2px 0 6px 0' }}>ก๊วนพี่เอก ชวนตีเกมร่วมสนุก</h2>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                        <div><i className="fa-solid fa-user-tie" style={{ width: '18px', color: 'var(--primary)' }}></i> <b>ผู้จัด (Host):</b> พี่เอก สายตบ</div>
                                        <div><i className="fa-solid fa-map-location-dot" style={{ width: '18px', color: 'var(--primary)' }}></i> <b>สนาม (Court):</b> สนาม 3 (SUSA Hall)</div>
                                        <div><i className="fa-regular fa-clock" style={{ width: '18px', color: 'var(--primary)' }}></i> <b>ช่วงเวลา:</b> 18:00 - 21:00 น.</div>
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
                                    <div className="price-scale-box"><div className="price-scale-title">ตี 1 เกม</div><div className="price-scale-val">40 บาท</div></div>
                                    <div className="price-scale-box"><div className="price-scale-title">ตี 2 เกม</div><div className="price-scale-val">70 บาท</div></div>
                                    <div className="price-scale-box" style={{ border: '1.5px solid var(--primary)' }}><div className="price-scale-title">3 เกมขึ้นไป</div><div className="price-scale-val">100 บาท</div></div>
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
                )}
            </main>

            {/* 🟠 FLOATING ACTION BUTTON - สรุปข้อมูลวันนี้ */}
            <button
                onClick={() => setShowTodaySummary(true)}
                className="btn-animate"
                style={{
                    position: 'fixed', bottom: '24px', right: '24px',
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FF6B00, #FF8C33)',
                    border: 'none', color: 'white', fontSize: '22px',
                    cursor: 'pointer', zIndex: 90,
                    boxShadow: '0 4px 15px rgba(255, 107, 0, 0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 0, 0.5)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 107, 0, 0.4)'; }}
                title="สรุปข้อมูลจองวันนี้"
            >
                <i className="fa-solid fa-calendar-day"></i>
            </button>

            {/* 🟠 MODAL สรุปข้อมูลจองวันนี้ - แบบตารางกริดเหมือน Google Sheets */}
            {showTodaySummary && (() => {
                // 🎨 พาเลตต์สีสำหรับผู้จองแต่ละคน (สุ่มสีต่างกัน)
                const bookerColors = [
                    { bg: '#FFB74D', text: '#4e342e', border: '#FF9800' },   // ส้ม
                    { bg: '#64B5F6', text: '#1a237e', border: '#42A5F5' },   // ฟ้า
                    { bg: '#BA68C8', text: '#4a148c', border: '#AB47BC' },   // ม่วง
                    { bg: '#4DB6AC', text: '#004d40', border: '#26A69A' },   // เขียวมิ้นต์
                    { bg: '#FF8A65', text: '#3e2723', border: '#FF7043' },   // ส้มแดง
                    { bg: '#F06292', text: '#880e4f', border: '#EC407A' },   // ชมพู
                    { bg: '#FFD54F', text: '#5d4037', border: '#FFCA28' },   // เหลือง
                    { bg: '#AED581', text: '#33691e', border: '#9CCC65' },   // เขียวอ่อน
                    { bg: '#7986CB', text: '#1a237e', border: '#5C6BC0' },   // ม่วงน้ำเงิน
                    { bg: '#4FC3F7', text: '#01579b', border: '#29B6F6' },   // ฟ้าอ่อน
                    { bg: '#E57373', text: '#b71c1c', border: '#EF5350' },   // แดง
                    { bg: '#81C784', text: '#1b5e20', border: '#66BB6A' },   // เขียว
                ];
                // สร้าง map ชื่อ -> สี (ใช้สีเดิมตลอดสำหรับคนเดียวกัน)
                const uniqueNames = [...new Set(todayBookings.map(b => b.name || 'ไม่ระบุ'))];
                const nameColorMap = {};
                uniqueNames.forEach((name, idx) => {
                    nameColorMap[name] = bookerColors[idx % bookerColors.length];
                });

                const gameColor = { bg: '#ef5350', text: '#ffffff', border: '#d32f2f' };
                const availableColor = { bg: '#d4edda', text: '#388e3c', border: '#a3d9a5' };

                // สร้างช่วงเวลา 1 ชม. สำหรับหัวตาราง
                const hourBlocks = [
                    { label: '16:00-17:00', slots: ['16:00 - 16:30', '16:30 - 17:00'] },
                    { label: '17:00-18:00', slots: ['17:00 - 17:30', '17:30 - 18:00'] },
                    { label: '18:00-19:00', slots: ['18:00 - 18:30', '18:30 - 19:00'] },
                    { label: '19:00-20:00', slots: ['19:00 - 19:30', '19:30 - 20:00'] },
                    { label: '20:00-21:00', slots: ['20:00 - 20:30', '20:30 - 21:00'] },
                    { label: '21:00-22:00', slots: ['21:00 - 21:30', '21:30 - 22:00'] },
                    { label: '22:00-23:00', slots: ['22:00 - 22:30', '22:30 - 23:00'] },
                    { label: '23:00-00:00', slots: ['23:00 - 23:30', '23:30 - 00:00'] },
                ];
                const allCourts = ['สนาม 1', 'สนาม 2', 'สนาม 3', 'สนาม 4', 'สนาม 5', 'สนาม 6', 'สนาม 7'];

                // ฟังก์ชันหาข้อมูลแต่ละ slot (30 นาที)
                const getSlotInfo = (court, slotTime) => {
                    const booking = todayBookings.find(b => b.court === court && b.time === slotTime);
                    if (!booking) return { status: 'available', name: '', color: availableColor };
                    const name = booking.name || 'ไม่ระบุ';
                    const isGame = name.includes('ตีเกม') || name.includes('เกมส์');
                    if (isGame) return { status: 'game', name: 'ตีเกมส์', color: gameColor };
                    return { status: 'booked', name, color: nameColorMap[name] || bookerColors[0] };
                };

                return (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
                        zIndex: 300, display: 'flex', justifyContent: 'center', alignItems: 'center',
                        animation: 'fadeIn 0.2s'
                    }} onClick={() => setShowTodaySummary(false)}>
                        <div style={{
                            backgroundColor: 'white', width: '96%', maxWidth: '600px', maxHeight: '90%',
                            borderRadius: '20px', padding: '20px', overflow: 'hidden',
                            display: 'flex', flexDirection: 'column',
                            animation: 'scaleIn 0.25s ease-out',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                        }} onClick={(e) => e.stopPropagation()}>
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexShrink: 0 }}>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '20px' }}>📋</span> ตารางจองสนามวันนี้
                                    </h3>
                                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
                                        {formatDateText(todayStr)} — เลื่อนซ้าย-ขวาเพื่อดูเวลาทั้งหมด
                                    </p>
                                </div>
                                <button onClick={() => setShowTodaySummary(false)} style={{
                                    background: 'var(--border-color)', border: 'none', width: '32px', height: '32px',
                                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', fontSize: '14px'
                                }}>
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>

                            {/* Legend */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexShrink: 0, flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                                    <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: '#d4edda', border: '1px solid #a3d9a5' }}></div>
                                    ว่าง
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                                    <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: '#ef5350', border: '1px solid #d32f2f' }}></div>
                                    ตีเกมส์
                                </div>
                                {uniqueNames.filter(n => !n.includes('ตีเกม') && !n.includes('เกมส์')).map((name, idx) => (
                                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                                        <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: nameColorMap[name].bg, border: `1px solid ${nameColorMap[name].border}` }}></div>
                                        {name}
                                    </div>
                                ))}
                            </div>

                            {/* Grid Table */}
                            <div style={{ overflowX: 'auto', overflowY: 'auto', flexGrow: 1 }} className="hide-scrollbar">
                                <table style={{
                                    borderCollapse: 'collapse', width: 'max-content', minWidth: '100%',
                                    fontSize: '11px', fontFamily: 'inherit'
                                }}>
                                    <thead>
                                        <tr>
                                            <th style={{
                                                position: 'sticky', left: 0, zIndex: 2,
                                                backgroundColor: '#FF6B00', color: 'white',
                                                padding: '8px 10px', fontWeight: '800', fontSize: '11px',
                                                border: '1px solid #e65100', minWidth: '65px',
                                                textAlign: 'center'
                                            }}>
                                                สนาม
                                            </th>
                                            {hourBlocks.map((hb) => (
                                                <th key={hb.label} style={{
                                                    backgroundColor: '#FF6B00', color: 'white',
                                                    padding: '8px 4px', fontWeight: '700', fontSize: '9px',
                                                    border: '1px solid #e65100', minWidth: '80px',
                                                    textAlign: 'center', whiteSpace: 'nowrap'
                                                }}>
                                                    {hb.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allCourts.map((court) => (
                                            <tr key={court}>
                                                <td style={{
                                                    position: 'sticky', left: 0, zIndex: 1,
                                                    backgroundColor: '#4CAF50', color: 'white',
                                                    padding: '8px 8px', fontWeight: '800', fontSize: '11px',
                                                    border: '1px solid #388E3C',
                                                    textAlign: 'center', whiteSpace: 'nowrap'
                                                }}>
                                                    {court}
                                                </td>
                                                {hourBlocks.map((hb) => {
                                                    const slot1 = getSlotInfo(court, hb.slots[0]);
                                                    const slot2 = getSlotInfo(court, hb.slots[1]);

                                                    // ถ้าทั้ง 2 สล็อตเป็นคนเดียวกันและสถานะเหมือนกัน -> แสดงเป็นเซลล์เดียว
                                                    const sameBooker = slot1.status === slot2.status && slot1.name === slot2.name;

                                                    if (sameBooker) {
                                                        return (
                                                            <td key={hb.label} style={{
                                                                backgroundColor: slot1.color.bg,
                                                                color: slot1.color.text,
                                                                padding: '0',
                                                                border: `1px solid ${slot1.color.border}`,
                                                                textAlign: 'center',
                                                                fontWeight: slot1.status !== 'available' ? '700' : '400',
                                                                fontSize: '9px',
                                                                minWidth: '80px',
                                                                height: '36px',
                                                                verticalAlign: 'middle',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}>
                                                                {slot1.name}
                                                            </td>
                                                        );
                                                    }

                                                    // แบ่งครึ่ง: ซ้าย = 30 นาทีแรก, ขวา = 30 นาทีหลัง
                                                    return (
                                                        <td key={hb.label} style={{
                                                            padding: '0',
                                                            border: '1px solid #bbb',
                                                            minWidth: '80px',
                                                            height: '36px',
                                                            overflow: 'hidden'
                                                        }}>
                                                            <div style={{ display: 'flex', height: '100%' }}>
                                                                <div style={{
                                                                    flex: 1,
                                                                    backgroundColor: slot1.color.bg,
                                                                    color: slot1.color.text,
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    fontSize: '8px', fontWeight: slot1.status !== 'available' ? '700' : '400',
                                                                    borderRight: '1px dashed rgba(0,0,0,0.15)',
                                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                                    padding: '0 2px'
                                                                }}>
                                                                    {slot1.name}
                                                                </div>
                                                                <div style={{
                                                                    flex: 1,
                                                                    backgroundColor: slot2.color.bg,
                                                                    color: slot2.color.text,
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    fontSize: '8px', fontWeight: slot2.status !== 'available' ? '700' : '400',
                                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                                    padding: '0 2px'
                                                                }}>
                                                                    {slot2.name}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary footer */}
                            <div style={{
                                display: 'flex', gap: '8px', marginTop: '12px', flexShrink: 0,
                                borderTop: '1px solid var(--border-color)', paddingTop: '10px'
                            }}>
                                <div style={{
                                    flex: 1, background: 'linear-gradient(135deg, #fff5eb, #ffe8d5)',
                                    padding: '8px', borderRadius: '10px', textAlign: 'center',
                                    border: '1px solid rgba(255,107,0,0.15)'
                                }}>
                                    <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--primary)' }}>{todayBookings.length}</div>
                                    <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: '600' }}>จองแล้ว</div>
                                </div>
                                <div style={{
                                    flex: 1, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                                    padding: '8px', borderRadius: '10px', textAlign: 'center',
                                    border: '1px solid rgba(34,197,94,0.15)'
                                }}>
                                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#22c55e' }}>
                                        {(allCourts.length * timeSlots.length) - todayBookings.length}
                                    </div>
                                    <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: '600' }}>ว่าง</div>
                                </div>
                                <div style={{
                                    flex: 1, background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                                    padding: '8px', borderRadius: '10px', textAlign: 'center',
                                    border: '1px solid rgba(59,130,246,0.15)'
                                }}>
                                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#3b82f6' }}>
                                        {new Set(todayBookings.map(b => b.name)).size}
                                    </div>
                                    <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: '600' }}>ผู้จอง</div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

export default HomePage;