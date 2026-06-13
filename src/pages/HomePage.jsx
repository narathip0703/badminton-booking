import React, { useState, useEffect } from 'react';

// API
import { fetchBookingsFromSheet, sendToGoogleSheet, GOOGLE_SHEET_URL } from '../api/googleSheets';

// Constants
import { leftCourts, rightCourts, timePoints, timeSlots } from '../constants/courtData';

// Utils
import { getNext7Days, formatCurrentDateTime } from '../utils/dateHelpers';

// Components
import Toast from '../components/Toast';
import Header from '../components/Header';
import SideMenu from '../components/SideMenu';
import DatePicker from '../components/DatePicker';
import CourtMap from '../components/CourtMap';
import BookingPopup from '../components/BookingPopup';
import BookingList from '../components/BookingList';
import MoveModal from '../components/MoveModal';
import HistoryModal from '../components/HistoryModal';
import MatchLobby from '../components/MatchLobby';
import TodaySummaryModal from '../components/TodaySummaryModal';
import ConfirmDialog from '../components/ConfirmDialog';
import InfoModal from '../components/InfoModal';

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

    // ใหม่: Info Modal & Confirm Dialog
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [confirmDialogConfig, setConfirmDialogConfig] = useState({ show: false, title: '', message: '', onConfirm: null, isDanger: false });

    // ใหม่: Pull to Refresh
    const [touchStartY, setTouchStartY] = useState(0);
    const [touchCurrentY, setTouchCurrentY] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

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

    // ฐานข้อมูลของการจองสนาม
    const [bookedSlots, setBookedSlots] = useState([]);
    const [toastMessage, setToastMessage] = useState(null);

    // 💡 สเตตสำหรับติดตามจำนวนครั้งที่ยกเลิก (Blacklist 3 ครั้ง)
    const [cancelCount, setCancelCount] = useState(Number(localStorage.getItem('cancelCount')) || 0);

    // ==========================================
    // 🏃 STATE ตีเกม
    // ==========================================
    const [participantsList, setParticipantsList] = useState([]);
    const [newParticipantName, setNewParticipantName] = useState(localStorage.getItem('newParticipantName') || localStorage.getItem('bookingNickname') || '');
    const [participantLevel, setParticipantLevel] = useState(localStorage.getItem('participantLevel') || 'มือกลาง (Intermediate)');

    // 💡 บันทึกข้อมูลลง LocalStorage อัตโนมัติเมื่อผู้ใช้พิมพ์
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

    useEffect(() => {
        localStorage.setItem('cancelCount', cancelCount);
    }, [cancelCount]);

    // 💡 รันตัวนับเวลาสากลหน้าเว็บ
    useEffect(() => {
        const timer = setInterval(() => setCurrentDateTime(new Date()), 15000);
        return () => clearInterval(timer);
    }, []);

    const handleBlacklistSync = (isBlacklistedInDB) => {
        setCancelCount(prev => {
            if (!isBlacklistedInDB && prev >= 3) {
                showToast('🎉 สิทธิ์การจองของคุณได้รับการปลดล็อคแล้ว (แอดมินลบแบนแล้ว)');
                return 0; // ปลดแบน (รีเซ็ตกลับเป็น 0)
            } else if (isBlacklistedInDB && prev < 3) {
                return 3; // โดนแบนอยู่
            }
            return prev;
        });
    };

    // 💡 ดึงข้อมูลตามจริงจาก Google Sheets ทันทีเมื่อเปิดหน้าเว็บ และอัปเดตอัตโนมัติทุกๆ 1 นาที
    useEffect(() => {
        fetchBookingsFromSheet(setBookedSlots, setParticipantsList, showToast, handleBlacklistSync);
        
        const refreshTimer = setInterval(() => {
            fetchBookingsFromSheet(setBookedSlots, setParticipantsList, () => {}, handleBlacklistSync);
        }, 60000);

        return () => clearInterval(refreshTimer);
    }, []);

    // 🔔 ระบบแจ้งเตือนเมื่อมีคนจองใหม่
    const prevBookingsRef = React.useRef([]);
    useEffect(() => {
        // ข้ามการแจ้งเตือนตอนโหลดหน้าแรกครั้งแรก
        if (prevBookingsRef.current.length > 0 && bookedSlots.length > prevBookingsRef.current.length) {
            // หาการจองที่เพิ่งเพิ่มเข้ามาใหม่
            const newBookings = bookedSlots.filter(newSlot => 
                !prevBookingsRef.current.some(oldSlot => 
                    oldSlot.date === newSlot.date && 
                    oldSlot.court === newSlot.court && 
                    oldSlot.time === newSlot.time
                )
            );
            
            // กรองเอาเฉพาะที่คนอื่นจอง (ไม่แจ้งเตือนของตัวเอง)
            const othersBookings = newBookings.filter(b => !b.byMe);
            
            if (othersBookings.length > 0) {
                const uniqueNames = [...new Set(othersBookings.map(b => b.name))];
                const notifText = `มีการจองเข้ามาใหม่ ${othersBookings.length} รายการ จากคุณ: ${uniqueNames.join(', ')}`;
                
                // 1. In-app Toast (แจ้งเตือนในแอปเสมอ)
                showToast(`🔔 ${notifText}`);
                
                // 2. แจ้งเตือนด้วยเสียง (เล่นเสียงป๊อป)
                try {
                    // ใช้ Audio API พื้นฐานเพื่อเล่นเสียงสั้นๆ
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioCtx.createOscillator();
                    const gainNode = audioCtx.createGain();
                    oscillator.connect(gainNode);
                    gainNode.connect(audioCtx.destination);
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // โน้ต A5
                    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // ลดเสียงลงเพื่อไม่ให้หนวกหู
                    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
                    oscillator.start(audioCtx.currentTime);
                    oscillator.stop(audioCtx.currentTime + 0.5);
                } catch(e) {
                    // Ignore audio context errors
                }

                // 3. Web Push Notification (ถ้ารองรับและอนุญาต)
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('🏸 มีคนจองสนามใหม่', {
                        body: notifText,
                        icon: '/favicon.svg'
                    });
                }
            }
        }
        prevBookingsRef.current = bookedSlots;
    }, [bookedSlots]);


    // ==========================================
    // 💡 ฟังก์ชันทำงาน (Logic)
    // ==========================================

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // 📤 ฟังก์ชัน Share การจอง
    const handleShareBooking = async () => {
        const myBookingsTodayList = bookedSlots.filter(b => b.date === selectedDate && b.byMe);
        if (myBookingsTodayList.length === 0) return;

        const text = `🏸 จองสนาม SUSA\n📅 วันที่: ${formatDateText(selectedDate)}\n` +
            myBookingsTodayList.map(b => `- ${b.court} เวลา ${b.time}`).join('\n') +
            `\n\n📌 ชื่อผู้จอง: ${bookingNickname}\n📱 เบอร์โทร: ${bookingPhone}`;

        if (navigator.share) {
            try {
                await navigator.share({ title: 'สรุปการจองสนาม SUSA', text: text });
            } catch (error) {
                console.log('แชร์ไม่สำเร็จ:', error);
            }
        } else {
            navigator.clipboard.writeText(text);
            showToast('📋 คัดลอกข้อความการจองแล้ว สามารถนำไปวางเพื่อแชร์ได้เลย');
        }
    };

    // 🔄 Pull to Refresh Handlers
    const handleTouchStart = (e) => {
        const mainEl = document.getElementById('main-scroll-area');
        if (mainEl && mainEl.scrollTop === 0) {
            setTouchStartY(e.touches[0].clientY);
        }
    };

    const handleTouchMove = (e) => {
        if (touchStartY === 0) return;
        const currentY = e.touches[0].clientY;
        const diff = currentY - touchStartY;
        if (diff > 0 && diff < 100) { // Limit stretch distance
            setTouchCurrentY(diff);
        } else if (diff < 0) {
            setTouchCurrentY(0);
        }
    };

    const handleTouchEnd = () => {
        if (touchCurrentY > 60 && !isRefreshing) {
            setIsRefreshing(true);
            showToast('🔄 กำลังรีเฟรชข้อมูล...');
            fetchBookingsFromSheet(setBookedSlots, setParticipantsList, () => {}, handleBlacklistSync)
                .then(() => {
                    setIsRefreshing(false);
                    setTouchCurrentY(0);
                    showToast('✅ ข้อมูลอัปเดตล่าสุดแล้ว');
                })
                .catch(() => {
                    setIsRefreshing(false);
                    setTouchCurrentY(0);
                });
        } else {
            setTouchCurrentY(0);
        }
        setTouchStartY(0);
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

    // ตรวจสอบทับซ้อน
    const isRangeConflictWithOthers = currentRangeSlots.some(slot => 
        bookedSlots.some(b => b.date === selectedDate && b.court === activeCourtForBooking && b.time === slot.time && !b.byMe)
    );

    const isRangeConflictWithMe = currentRangeSlots.some(slot => 
        bookedSlots.some(b => b.date === selectedDate && b.court === activeCourtForBooking && b.time === slot.time && b.byMe)
    );

    const totalPrice = currentRangeSlots.reduce((sum, s) => sum + s.price, 0);

    const handleConfirmBooking = async () => {
        if (cancelCount >= 3) {
            showToast('🚫 คุณติดแบล็คลิสต์เนื่องจากยกเลิกจองครบ 3 ครั้ง กรุณาติดต่อแอดมินเพื่อจองสนาม');
            return;
        }

        if (currentRangeSlots.length === 0) return;

        if (!bookingNickname.trim() || !bookingPhone.trim()) {
            showToast('⚠️ กรุณากรอกชื่อเล่นและเบอร์โทรศัพท์ก่อนยืนยันการจอง');
            return;
        }

        if (bookingPhone.trim().length !== 10) {
            showToast('⚠️ กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก');
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

        setBookedSlots(prev => [...prev, ...newBookings]);
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

        const confirmMoveAction = () => {
            setBookedSlots(prev => {
                const remainingSlots = prev.filter(b =>
                    !selectedForMove.some(selected => selected.date === b.date && selected.court === b.court && selected.time === b.time)
                );
                const newSlotsWithByMe = newBookings.map(b => ({ ...b, byMe: true }));
                return [...remainingSlots, ...newSlotsWithByMe];
            });

            setShowMoveModal(false);
            setIsMoveMode(false);
            const backupSelected = [...selectedForMove];
            setSelectedForMove([]);
            setConfirmDialogConfig(prev => ({ ...prev, show: false }));
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
                sendToGoogleSheet(sheetData).then(response => {
                    setIsSending(false);
                    if (response.success) {
                        showToast('✅ ย้ายเวลาและอัปเดตระบบสำเร็จ!');
                    } else {
                        showToast('⚠️ ' + (response.data ? response.data.message : 'เกิดข้อผิดพลาดในการย้ายเวลา'));
                        fetchBookingsFromSheet(setBookedSlots, setParticipantsList, () => { });
                    }
                });
            }
        };

        setConfirmDialogConfig({
            show: true,
            title: 'ย้ายเวลา',
            message: `ยืนยันการย้าย ${numSlotsNeeded} รายการ เริ่มเวลา ${newMoveTime} ใช่หรือไม่?`,
            onConfirm: confirmMoveAction,
            isDanger: false
        });
    };

    const handleCancelBooking = (bookingToCancel) => {
        setConfirmDialogConfig({
            show: true,
            title: 'ยกเลิกการจอง',
            message: `ต้องการยกเลิกการจอง ${bookingToCancel.court} เวลา ${bookingToCancel.time} (${formatDateText(bookingToCancel.date)}) หรือไม่?`,
            isDanger: true,
            onConfirm: async () => {
                setConfirmDialogConfig(prev => ({ ...prev, show: false }));
                setBookedSlots(prev => prev.filter(
                    (b) => !(b.date === bookingToCancel.date && b.court === bookingToCancel.court && b.time === bookingToCancel.time)
                ));
                showToast('🗑️ ยกเลิกการจองเรียบร้อย');

                const newCount = cancelCount + 1;
                setCancelCount(newCount);
                if (cancelCount < 3 && newCount >= 3) {
                    showToast('🚫 แจ้งเตือน: คุณยกเลิกครบ 3 ครั้ง ถูกระงับสิทธิ์การจองแล้ว ติดต่อแอดมินเพื่อปลดแบน');
                    if (GOOGLE_SHEET_URL && !GOOGLE_SHEET_URL.startsWith('ใส่_URL')) {
                        sendToGoogleSheet({ action: 'blacklist', name: bookingNickname.trim(), phone: bookingPhone.trim() });
                    }
                }

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
        });
    };

    const handleCancelAllToday = () => {
        setConfirmDialogConfig({
            show: true,
            title: 'ยกเลิกทั้งหมดวันนี้',
            message: 'คุณต้องการยกเลิกการจองทั้งหมดของคุณของวันนี้ใช่หรือไม่?',
            isDanger: true,
            onConfirm: async () => {
                setConfirmDialogConfig(prev => ({ ...prev, show: false }));
                const currentDate = selectedDate;
                const toCancel = bookedSlots.filter(b => b.date === currentDate && b.byMe);

                setBookedSlots(prev => prev.filter(b => !(b.date === currentDate && b.byMe)));
                showToast('🗑️ ยกเลิกการจองทั้งหมดของวันนี้เรียบร้อย');

                const newCount = cancelCount + 1;
                setCancelCount(newCount);
                if (cancelCount < 3 && newCount >= 3) {
                    showToast('🚫 แจ้งเตือน: คุณยกเลิกครบ 3 ครั้ง ถูกระงับสิทธิ์การจองแล้ว ติดต่อแอดมินเพื่อปลดแบน');
                    if (GOOGLE_SHEET_URL && !GOOGLE_SHEET_URL.startsWith('ใส่_URL')) {
                        sendToGoogleSheet({ action: 'blacklist', name: bookingNickname.trim(), phone: bookingPhone.trim() });
                    }
                }

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
        });
    };

    const handleCancelAllGlobal = () => {
        setConfirmDialogConfig({
            show: true,
            title: 'ยกเลิกทั้งหมด',
            message: 'คุณต้องการยกเลิกประวัติการจองทั้งหมดของคุณในระบบใช่หรือไม่?',
            isDanger: true,
            onConfirm: async () => {
                setConfirmDialogConfig(prev => ({ ...prev, show: false }));
                const toCancel = bookedSlots.filter(b => b.byMe);

                setBookedSlots(prev => prev.filter(b => !b.byMe));
                setShowHistoryModal(false);
                showToast('🗑️ ยกเลิกการจองทั้งหมดของคุณในระบบเรียบร้อย');

                const newCount = cancelCount + 1;
                setCancelCount(newCount);
                if (cancelCount < 3 && newCount >= 3) {
                    showToast('🚫 แจ้งเตือน: คุณยกเลิกครบ 3 ครั้ง ถูกระงับสิทธิ์การจองแล้ว ติดต่อแอดมินเพื่อปลดแบน');
                    if (GOOGLE_SHEET_URL && !GOOGLE_SHEET_URL.startsWith('ใส่_URL')) {
                        sendToGoogleSheet({ action: 'blacklist', name: bookingNickname.trim(), phone: bookingPhone.trim() });
                    }
                }

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
        });
    };

    const handleRegisterMatchLobby = async (e) => {
        e.preventDefault();

        if (cancelCount >= 3) {
            showToast('🚫 คุณติดแบล็คลิสต์เนื่องจากยกเลิกจองครบ 3 ครั้ง กรุณาติดต่อแอดมินเพื่อจองสนามหรือลงชื่อก๊วน');
            return;
        }

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

    // ==========================================
    // 🎨 RENDER UI
    // ==========================================

    return (
        <div className="app-container">
            <Toast message={toastMessage} />

            <MoveModal 
                showMoveModal={showMoveModal} setShowMoveModal={setShowMoveModal} selectedForMove={selectedForMove}
                datesList={datesList} formatDateText={formatDateText} newMoveDate={newMoveDate} setNewMoveDate={setNewMoveDate}
                setNewMoveTime={setNewMoveTime} newMoveCourt={newMoveCourt} setNewMoveCourt={setNewMoveCourt}
                newMoveTime={newMoveTime} bookedSlots={bookedSlots} handleConfirmMove={handleConfirmMove}
            />

            <SideMenu 
                isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} activeTab={activeTab} setActiveTab={setActiveTab}
                setShowHistoryModal={setShowHistoryModal} allMyBookingsCount={allMyBookings.length}
                bookingNickname={bookingNickname} bookingPhone={bookingPhone} handleLogout={handleLogout}
                setShowInfoModal={setShowInfoModal}
            />

            <InfoModal show={showInfoModal} onClose={() => setShowInfoModal(false)} />

            {confirmDialogConfig.show && (
                <ConfirmDialog 
                    title={confirmDialogConfig.title} 
                    message={confirmDialogConfig.message} 
                    onConfirm={confirmDialogConfig.onConfirm} 
                    onCancel={() => setConfirmDialogConfig({ ...confirmDialogConfig, show: false })}
                    isDanger={confirmDialogConfig.isDanger}
                />
            )}

            <HistoryModal 
                showHistoryModal={showHistoryModal} setShowHistoryModal={setShowHistoryModal} allMyBookings={allMyBookings}
                formatDateText={formatDateText} handleCancelBooking={handleCancelBooking} handleCancelAllGlobal={handleCancelAllGlobal}
            />

            <TodaySummaryModal 
                showSummaryModal={showTodaySummary} setShowSummaryModal={setShowTodaySummary}
                formatDateText={formatDateText} selectedDate={selectedDate} leftCourts={leftCourts} rightCourts={rightCourts}
                bookedSlots={bookedSlots}
            />

            <Header 
                activeTab={activeTab} setActiveTab={setActiveTab} setActiveCourtForBooking={setActiveCourtForBooking}
                setIsMenuOpen={setIsMenuOpen} currentDateTime={currentDateTime}
            />

            <main 
                id="main-scroll-area"
                onTouchStart={handleTouchStart} 
                onTouchMove={handleTouchMove} 
                onTouchEnd={handleTouchEnd}
                style={{ 
                    flexGrow: 1, padding: '20px', overflowY: 'auto', paddingBottom: '80px',
                    transform: `translateY(${touchCurrentY}px)`, transition: touchCurrentY === 0 ? 'transform 0.3s ease-out' : 'none'
                }} 
                className="hide-scrollbar"
            >
                {/* Pull to refresh indicator */}
                <div style={{
                    position: 'absolute', top: '-40px', left: '0', width: '100%', display: 'flex', justifyContent: 'center', opacity: touchCurrentY > 10 ? 1 : 0
                }}>
                    <div style={{
                        background: 'white', padding: '6px 12px', borderRadius: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--primary)', fontWeight: 'bold'
                    }}>
                        <i className={`fa-solid fa-arrow-down ${touchCurrentY > 60 ? 'fa-rotate-180' : ''}`} style={{ transition: '0.2s' }}></i>
                        {touchCurrentY > 60 ? 'ปล่อยเพื่อรีเฟรช' : 'ดึงลงเพื่อรีเฟรช'}
                    </div>
                </div>

                {activeTab === 'booking' ? (
                    <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
                        
                        <DatePicker datesList={datesList} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px', marginTop: '10px' }}>
                            <button onClick={() => setShowInfoModal(true)} className="btn-animate" style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <i className="fa-solid fa-circle-info"></i> กฎกติกาและราคา
                            </button>
                        </div>
                        
                        <CourtMap bookedSlots={bookedSlots} selectedDate={selectedDate} onCourtClick={setActiveCourtForBooking} />

                        <BookingList 
                            myBookingsToday={myBookingsToday} selectedDate={selectedDate} formatDateText={formatDateText}
                            isMoveMode={isMoveMode} setIsMoveMode={setIsMoveMode} selectedForMove={selectedForMove}
                            setSelectedForMove={setSelectedForMove} handleOpenMoveModal={handleOpenMoveModal}
                            handleCancelAllToday={handleCancelAllToday} toggleSelectForMove={toggleSelectForMove}
                            handleCancelBooking={handleCancelBooking} handleShareBooking={handleShareBooking}
                        />
                    </div>
                ) : (
                    <MatchLobby 
                        participantsList={participantsList} isUserRegisteredInMatch={isUserRegisteredInMatch}
                        handleRegisterMatchLobby={handleRegisterMatchLobby} newParticipantName={newParticipantName}
                        setNewParticipantName={setNewParticipantName} participantLevel={participantLevel}
                        setParticipantLevel={setParticipantLevel} handleUnregisterMatchLobby={handleUnregisterMatchLobby}
                    />
                )}
            </main>

            {/* BookingPopup ต้องอยู่นอก <main> เพื่อตำแหน่งจะได้ไม่ถูกกระทบโดยการ scroll */}
            <BookingPopup 
                activeCourtForBooking={activeCourtForBooking} setActiveCourtForBooking={setActiveCourtForBooking}
                selectedDate={selectedDate} formatDateText={formatDateText}
                bookingStartTime={bookingStartTime} setBookingStartTime={setBookingStartTime}
                bookingEndTime={bookingEndTime} setBookingEndTime={setBookingEndTime}
                currentRangeSlots={currentRangeSlots} bookedSlots={bookedSlots}
                bookingNickname={bookingNickname} setBookingNickname={setBookingNickname}
                bookingPhone={bookingPhone} setBookingPhone={setBookingPhone}
                isRangeConflictWithOthers={isRangeConflictWithOthers} totalPrice={totalPrice}
                handleConfirmBooking={handleConfirmBooking}
            />

            {/* Floating Action Button สำหรับดูตารางสรุป (เฉพาะหน้าจอง) */}
            {activeTab === 'booking' && (
                <button 
                    onClick={() => setShowTodaySummary(true)} 
                    className="btn-animate" 
                    style={{ 
                        position: 'absolute', 
                        bottom: '24px', 
                        right: '24px', 
                        zIndex: 40,
                        background: 'var(--primary-gradient)', 
                        color: 'white', 
                        border: 'none', 
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%', 
                        boxShadow: '0 6px 16px rgba(255, 107, 0, 0.4)', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '24px'
                    }} 
                    title="ดูตารางสรุปการจอง"
                >
                    <i className="fa-solid fa-table-cells"></i>
                </button>
            )}

            {isSending && (
                <div style={{
                    position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', padding: '10px 20px',
                    borderRadius: '50px', zIndex: 999, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px'
                }}>
                    <i className="fa-solid fa-spinner fa-spin"></i> กำลังซิงค์ข้อมูลกับ Google Sheets...
                </div>
            )}
        </div>
    );
}

export default HomePage;