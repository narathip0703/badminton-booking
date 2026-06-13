// =====================================================================
// 📋 Google Apps Script สำหรับ SUSA Badminton Court Booking (รวมระบบ LINE OA)
// =====================================================================

// 📅 แปลงวันที่ yyyy-MM-dd เป็นภาษาไทยอ่านง่าย เช่น "จันทร์ 2 มิ.ย. 69"

function formatThaiDate(dateStr) {
  try {
    const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const parts = dateStr.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const dayName = days[d.getDay()];
    const dateNum = d.getDate();
    const monthName = months[d.getMonth()];
    const thaiYear = (d.getFullYear() + 543) % 100;
    return `${dayName} ${dateNum} ${monthName} ${thaiYear}`;
  } catch (err) {
    return dateStr;
  }
}

// =====================================================================
// 🧪 ฟังก์ชันทดสอบส่ง LINE (ให้กดรันจากหน้า Apps Script เพื่อเช็คว่า LINE ทำงานไหม)
// =====================================================================
function testLineNotification() {
  const result = sendLineNotification("🧪 ทดสอบแจ้งเตือน LINE จากระบบจองสนาม SUSA\n\nถ้าเห็นข้อความนี้แสดงว่าระบบ LINE ทำงานปกติครับ!");
  Logger.log("=== ผลการทดสอบ LINE ===");
  Logger.log(result);
}

// 🕒 ฟังก์ชันรวมเวลาที่ติดกัน เช่น ["16:00 - 16:30", "16:30 - 17:00"] -> "16:00 - 17:00"
function mergeTimeSlots(times) {
  if (!times || times.length === 0) return '';
  let slots = times.map(t => {
    let [s, e] = t.split('-').map(x => x.trim());
    let sm = parseInt(s.split(':')[0]) * 60 + parseInt(s.split(':')[1]);
    let em = parseInt(e.split(':')[0]) * 60 + parseInt(e.split(':')[1]);
    return { s, e, sm, em };
  }).sort((a, b) => a.sm - b.sm);

  let merged = [];
  let curr = slots[0];

  for (let i = 1; i < slots.length; i++) {
    if (slots[i].sm <= curr.em) {
      if (slots[i].em > curr.em) {
        curr.em = slots[i].em;
        curr.e = slots[i].e;
      }
    } else {
      merged.push(curr);
      curr = slots[i];
    }
  }
  merged.push(curr);

  return merged.map(m => `${m.s} - ${m.e}`).join(', ');
}
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // 🟢 ตรวจสอบว่าเป็น Webhook จาก LINE หรือไม่ (เพื่อดึง Group ID)
    if (data.events) {
      data.events.forEach(event => {
        let source = event.source;
        // ถ้ารับข้อความมาจากกลุ่ม หรือดึงบอทเข้ากลุ่ม
        if (source && source.groupId) {
          if (event.replyToken) {
            replyLineMessage(event.replyToken, `ดึงบอทเข้ากลุ่มเรียบร้อย!\n\nรหัสกลุ่ม (Group ID) คือ:\n${source.groupId}\n\nให้นำรหัสนี้ไปใส่แทน userId ในโค้ด Google Apps Script ได้เลยครับ`);
          }
        }
      });
      return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (data.action === 'booking') {
      const lock = LockService.getScriptLock();
      try {
        lock.waitLock(10000);

        const sheet = ss.getSheetByName('จองสนาม');
        const rows = sheet.getDataRange().getDisplayValues();

        let isConflict = false;
        let conflictDetails = [];

        for (let j = 0; j < data.bookings.length; j++) {
          let target = data.bookings[j];
          for (let i = 1; i < rows.length; i++) {
            if (rows[i][1] == target.date && rows[i][2] == target.court && rows[i][3] == target.time) {
              isConflict = true;
              conflictDetails.push(`${target.court} เวลา ${target.time}`);
              break;
            }
          }
        }

        if (isConflict) {
          return ContentService.createTextOutput(JSON.stringify({
            status: 'conflict',
            message: 'ขออภัย มีผู้จองตัดหน้าไปแล้ว: ' + conflictDetails.join(', ')
          })).setMimeType(ContentService.MimeType.JSON);
        }

        // 🟢 บันทึกการจองสำเร็จ -> เตรียมสร้างข้อความแจ้งเตือน LINE
        let summaryMap = {};
        data.bookings.forEach(function (booking) {
          sheet.appendRow([
            new Date(),
            booking.date,
            booking.court,
            booking.time,
            booking.price,
            booking.name,
            booking.phone
          ]);

          // บันทึกลง DashBoard
          logToDashboard(ss, 'จอง', booking.date, booking.court, booking.time, booking.price, booking.name, booking.phone);

          let key = `${booking.name}|${booking.date}|${booking.court}`;
          if (!summaryMap[key]) summaryMap[key] = { name: booking.name, date: booking.date, court: booking.court, times: [] };
          summaryMap[key].times.push(booking.time);
        });

        let lineMessage = "📝 มีรายการจองสนามใหม่!\n";
        for (let key in summaryMap) {
          let s = summaryMap[key];
          lineMessage += `• ชื่อ: ${s.name}\n  สนาม: ${s.court}\n  เวลา: ${mergeTimeSlots(s.times)}\n  วันที่: ${formatThaiDate(s.date)}\n`;
        }

        // 🚀 ส่งแจ้งเตือนไปที่ LINE OA (ห้ามให้ LINE พังแล้วทำให้ระบบหลักพัง)
        try { sendLineNotification(lineMessage.trim()); } catch (lineErr) { console.error("Line Notify Error (booking):", lineErr); }

        return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'บันทึกการจองสำเร็จ' })).setMimeType(ContentService.MimeType.JSON);

      } catch (e) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'ระบบไม่ว่าง กรุณาลองใหม่ (Server Busy)' })).setMimeType(ContentService.MimeType.JSON);
      } finally {
        lock.releaseLock();
      }

    } else if (data.action === 'match_register') {
      const sheet = ss.getSheetByName('ลงชื่อตีเกม');
      sheet.appendRow([
        new Date(),
        data.name,
        data.level
      ]);

      // บันทึกลง DashBoard
      logToDashboard(ss, 'ลงชื่อตีเกม', '', '', '', '', data.name, '');

      // 🚀 ส่งแจ้งเตือน LINE เมื่อมีคนลงชื่อตีเกม
      try { sendLineNotification(`🏸 มีคนลงชื่อตีเกมเพิ่ม!\n• คุณ ${data.name} (Level: ${data.level})`); } catch (lineErr) { console.error("Line Notify Error (match_register):", lineErr); }

      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'บันทึกลงชื่อตีเกมสำเร็จ' })).setMimeType(ContentService.MimeType.JSON);

    } else if (data.action === 'cancel_bookings') {
      const sheet = ss.getSheetByName('จองสนาม');
      const rows = sheet.getDataRange().getValues();
      const normalizePhone = (p) => p ? String(p).replace(/^0+/, '').trim() : '';

      let cancelSummary = {};
      let cancelledCount = 0;

      data.bookings.forEach(function (target) {
        for (let i = rows.length - 1; i >= 1; i--) {
          let rowDate = rows[i][1];
          if (rowDate instanceof Date) {
            rowDate = Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
          } else {
            rowDate = rowDate.toString();
          }

          if (
            rowDate == target.date &&
            rows[i][2] == target.court &&
            rows[i][3] == target.time &&
            String(rows[i][5]).trim() === String(target.name).trim() &&
            normalizePhone(rows[i][6]) === normalizePhone(target.phone)
          ) {
            sheet.deleteRow(i + 1);
            rows.splice(i, 1);

            // บันทึกลง DashBoard
            logToDashboard(ss, 'ยกเลิก', target.date, target.court, target.time, '', target.name, target.phone);

            let key = `${target.name}|${target.date}|${target.court}`;
            if (!cancelSummary[key]) cancelSummary[key] = { name: target.name, date: target.date, court: target.court, times: [] };
            cancelSummary[key].times.push(target.time);

            cancelledCount++;
            break;
          }
        }
      });

      let cancelMessage = "🗑️ มีการยกเลิกการจองสนาม!\n";
      for (let key in cancelSummary) {
        let s = cancelSummary[key];
        cancelMessage += `• ชื่อ: ${s.name}\n  สนาม: ${s.court}\n  เวลา: ${mergeTimeSlots(s.times)}\n  วันที่: ${formatThaiDate(s.date)}\n`;
      }

      // 🚀 ส่งแจ้งเตือน LINE เฉพาะเมื่อมีการยกเลิกจริง
      if (cancelledCount > 0) {
        try { sendLineNotification(cancelMessage.trim()); } catch (lineErr) { console.error("Line Notify Error (cancel_bookings):", lineErr); }
      }

      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'ยกเลิกรายการจองใน Sheet เรียบร้อย' })).setMimeType(ContentService.MimeType.JSON);

    } else if (data.action === 'cancel_match') {
      const sheet = ss.getSheetByName('ลงชื่อตีเกม');
      const rows = sheet.getDataRange().getValues();

      for (let i = rows.length - 1; i >= 1; i--) {
        if (rows[i][1] == data.name) {
          sheet.deleteRow(i + 1);
          rows.splice(i, 1);

          // บันทึกลง DashBoard
          logToDashboard(ss, 'ยกเลิกตีเกม', '', '', '', '', data.name, '');
        }
      }

      // 🚀 ส่งแจ้งเตือน LINE เมื่อมีคนถอนชื่อตีเกม
      try { sendLineNotification(`❌ คุณ ${data.name} ได้ถอนชื่อออกจากรายการตีเกมแล้ว`); } catch (lineErr) { console.error("Line Notify Error (cancel_match):", lineErr); }

      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'ยกเลิกลงชื่อตีเกมใน Sheet เรียบร้อย' })).setMimeType(ContentService.MimeType.JSON);

    } else if (data.action === 'move_booking') {
      const lock = LockService.getScriptLock();
      try {
        lock.waitLock(10000);
        const sheet = ss.getSheetByName('จองสนาม');
        const rows = sheet.getDataRange().getDisplayValues();
        const normalizePhone = (p) => p ? String(p).replace(/^0+/, '').trim() : '';

        const oldBookings = data.oldBookings;
        const newBookings = data.newBookings;
        let oldRowIndices = [];
        let isConflict = false;
        let conflictMessage = '';

        for (let b = 0; b < oldBookings.length; b++) {
          let oldB = oldBookings[b];
          let foundIndex = -1;
          for (let i = 1; i < rows.length; i++) {
            let rowDate = rows[i][1];
            if (rowDate instanceof Date) {
              rowDate = Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
            }
            if (
              rowDate == oldB.date &&
              rows[i][2] == oldB.court &&
              rows[i][3] == oldB.time &&
              String(rows[i][5]).trim() === String(oldB.name).trim() &&
              normalizePhone(rows[i][6]) === normalizePhone(oldB.phone)
            ) {
              foundIndex = i + 1;
              break;
            }
          }
          if (foundIndex === -1) {
            return ContentService.createTextOutput(JSON.stringify({
              status: 'error',
              message: `ไม่พบข้อมูลการจองเดิม (${oldB.time}) หรือคุณไม่มีสิทธิ์ย้ายเวลานี้`
            })).setMimeType(ContentService.MimeType.JSON);
          }
          oldRowIndices.push(foundIndex);
        }

        for (let b = 0; b < newBookings.length; b++) {
          let newB = newBookings[b];
          for (let i = 1; i < rows.length; i++) {
            if (oldRowIndices.includes(i + 1)) continue;
            let rowDate = rows[i][1];
            if (rowDate instanceof Date) {
              rowDate = Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
            }
            if (rowDate == newB.date && rows[i][2] == newB.court && rows[i][3] == newB.time) {
              isConflict = true;
              conflictMessage = `ขออภัย เวลาใหม่ (${newB.court} ${newB.time}) ถูกจองไปแล้ว`;
              break;
            }
          }
          if (isConflict) break;
        }

        if (isConflict) {
          return ContentService.createTextOutput(JSON.stringify({ status: 'conflict', message: conflictMessage })).setMimeType(ContentService.MimeType.JSON);
        }

        oldRowIndices.sort((a, b) => b - a);
        oldRowIndices.forEach(idx => {
          let oldData = rows[idx - 1]; // -1 เพราะ idx มาจาก i+1
          let rowDate = oldData[1];
          if (rowDate instanceof Date) {
            rowDate = Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
          }
          logToDashboard(ss, 'ยกเลิก (ย้ายเวลา)', rowDate, oldData[2], oldData[3], oldData[4], oldData[5], oldData[6]);
          sheet.deleteRow(idx);
        });

        let moveSummary = {};
        newBookings.forEach(newB => {
          sheet.appendRow([
            new Date(),
            newB.date,
            newB.court,
            newB.time,
            newB.price,
            newB.name,
            newB.phone
          ]);

          // บันทึกลง DashBoard
          logToDashboard(ss, 'จอง (ย้ายเวลา)', newB.date, newB.court, newB.time, newB.price, newB.name, newB.phone);

          let key = `${newB.name}|${newB.date}|${newB.court}`;
          if (!moveSummary[key]) moveSummary[key] = { name: newB.name, date: newB.date, court: newB.court, times: [] };
          moveSummary[key].times.push(newB.time);
        });

        let moveMessage = "🔄 มีการย้ายเวลาจองสนาม!\n";
        for (let key in moveSummary) {
          let s = moveSummary[key];
          moveMessage += `• ชื่อ: ${s.name}\n  สนาม: ${s.court}\n  เวลา: ${mergeTimeSlots(s.times)}\n  วันที่: ${formatThaiDate(s.date)}\n`;
        }

        // 🚀 ส่งแจ้งเตือน LINE เมื่อย้ายสำเร็จ
        try { sendLineNotification(moveMessage.trim()); } catch (lineErr) { console.error("Line Notify Error (move_booking):", lineErr); }

        return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'ย้ายเวลาสำเร็จ' })).setMimeType(ContentService.MimeType.JSON);

      } catch (e) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'ระบบไม่ว่าง (Server Busy)' })).setMimeType(ContentService.MimeType.JSON);
      } finally {
        lock.releaseLock();
      }

      // 🔴🔴🔴 เริ่ม: โค้ดที่เพิ่มเข้ามาใหม่สำหรับระบบ Blacklist 🔴🔴🔴
    } else if (data.action === 'blacklist') {
      let sheet = ss.getSheetByName('ยกเลิก 3 ครั้ง');
      if (!sheet) {
        sheet = ss.insertSheet('ยกเลิก 3 ครั้ง');
        sheet.appendRow(['ชื่อ', 'เบอร์โทร', 'เวลาที่โดนแบน']);
      }

      let timestamp = new Date();
      let name = data.name || 'ไม่ระบุชื่อ';
      let phone = data.phone || 'ไม่ระบุเบอร์';

      sheet.appendRow([name, phone, timestamp]);

      // เอาการส่งแจ้งเตือน LINE ออกตามที่ต้องการ
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'เพิ่มลง Blacklist เรียบร้อย' })).setMimeType(ContentService.MimeType.JSON);
      // 🔴🔴🔴 จบ: โค้ดที่เพิ่มเข้ามาใหม่สำหรับระบบ Blacklist 🔴🔴🔴

    } else {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Unknown action' })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('จองสนาม');
    if (!sheet) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);

    const rows = sheet.getDataRange().getDisplayValues();
    const bookings = [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][1] && rows[i][2] && rows[i][3]) {
        bookings.push({
          date: rows[i][1],
          court: rows[i][2],
          time: rows[i][3],
          price: rows[i][4],
          name: rows[i][5],
          phone: rows[i][6]
        });
      }
    }

    const matchSheet = ss.getSheetByName('ลงชื่อตีเกม');
    const participants = [];
    if (matchSheet) {
      const matchRows = matchSheet.getDataRange().getDisplayValues();
      for (let i = 1; i < matchRows.length; i++) {
        if (matchRows[i][1]) {
          participants.push({ name: matchRows[i][1], level: matchRows[i][2] });
        }
      }
    }

    // 🔴🔴🔴 เริ่ม: โค้ดที่เพิ่มเข้ามาใหม่เพื่อดึงข้อมูลแบล็คลิสต์ไปเช็ค 🔴🔴🔴
    const blacklistSheet = ss.getSheetByName('ยกเลิก 3 ครั้ง');
    const blacklists = [];
    if (blacklistSheet) {
      const blRows = blacklistSheet.getDataRange().getDisplayValues();
      for (let i = 1; i < blRows.length; i++) {
        if (blRows[i][1]) { // ดึงเบอร์โทรศัพท์ในคอลัมน์ที่ 2 (B)
          let phoneStr = String(blRows[i][1]).replace(/^0+/, '').trim();
          blacklists.push(phoneStr);
        }
      }
    }
    // 🔴🔴🔴 จบ: โค้ดที่เพิ่มเข้ามาใหม่เพื่อดึงข้อมูลแบล็คลิสต์ไปเช็ค 🔴🔴🔴

    return ContentService.createTextOutput(JSON.stringify({ bookings, participants, blacklists })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}


// 🔔 ฟังก์ชันกลางสำหรับเรียกยิงส่งข้อความไปยัง LINE OA (ใช้โทเคนและรหัสของคุณ)
function sendLineNotification(text) {
  const accessToken = "28STSX5rxOxxw7quHv/qE9lzgaKtBRFWv67BVk0xFTvRVh5xsmaWoB8DWaeKZlWU9ep9pY/oiCRwZyFetiZpeT3wuhQiqjJYnsI1d3jnYTP6Hderji0yNqpAw2Tx/jb6oTx+WVSSO3KkWSoqmKzBwwdB04t89/1O/w1cDnyilFU=";
  const userId = "Cbb92e94106f90ef308d216ca5b28ed57"; // 🟢 เปลี่ยนมาใช้ Group ID แล้ว
  const url = "https://api.line.me/v2/bot/message/push";

  const payload = {
    "to": userId,
    "messages": [
      {
        "type": "text",
        "text": text
      }
    ]
  };

  const options = {
    "method": "post",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + accessToken
    },
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();
    Logger.log("LINE API Status Code: " + responseCode);
    Logger.log("LINE API Response: " + responseBody);
    return "Status: " + responseCode + " | Body: " + responseBody;
  } catch (error) {
    Logger.log("UrlFetchApp Error: " + error.toString());
    throw error;
  }
}

// 🔔 ฟังก์ชันสำหรับตอบกลับ LINE (ใช้สำหรับแจ้ง Group ID เวลาดึงเข้ากลุ่ม)
function replyLineMessage(replyToken, text) {
  const accessToken = "28STSX5rxOxxw7quHv/qE9lzgaKtBRFWv67BVk0xFTvRVh5xsmaWoB8DWaeKZlWU9ep9pY/oiCRwZyFetiZpeT3wuhQiqjJYnsI1d3jnYTP6Hderji0yNqpAw2Tx/jb6oTx+WVSSO3KkWSoqmKzBwwdB04t89/1O/w1cDnyilFU=";
  const url = "https://api.line.me/v2/bot/message/reply";

  const payload = {
    "replyToken": replyToken,
    "messages": [{ "type": "text", "text": text }]
  };

  const options = {
    "method": "post",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + accessToken
    },
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  try {
    UrlFetchApp.fetch(url, options);
  } catch (error) {
    console.error("Reply Error:", error);
  }
}

// =====================================================================
// 🧹 ฟังก์ชันสำหรับลบข้อมูลของวันที่ผ่านมาแล้ว (ตั้งเวลา Trigger ให้ทำงานทุกวัน)
// =====================================================================
function deleteOldBookings() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. ลบรายการจองสนามที่ผ่านวันไปแล้ว
  const bookingSheet = ss.getSheetByName('จองสนาม');
  if (bookingSheet) {
    const rows = bookingSheet.getDataRange().getValues();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // รีเซ็ตเวลาเป็น 00:00:00 ของวันนี้

    // วนลูปจากล่างขึ้นบน เพื่อป้องกันปัญหา Index ของแถวเลื่อนเวลาลบ
    for (let i = rows.length - 1; i >= 1; i--) {
      let rowDateStr = rows[i][1];
      if (!rowDateStr) continue;

      let rowDate;
      if (rowDateStr instanceof Date) {
        rowDate = rowDateStr;
      } else {
        // กรณีเป็น Text รูปแบบ yyyy-MM-dd
        let parts = String(rowDateStr).split('-');
        if (parts.length === 3) {
          rowDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
      }

      // ถ้าวันที่จองน้อยกว่าวันนี้ (เป็นอดีต) ให้ลบแถวนั้นทิ้ง
      if (rowDate && rowDate < today) {
        bookingSheet.deleteRow(i + 1);
      }
    }
  }

  // 2. ลบรายการลงชื่อตีเกมของเมื่อวานทิ้ง (เช็คจาก Timestamp คอลัมน์แรก)
  const matchSheet = ss.getSheetByName('ลงชื่อตีเกม');
  if (matchSheet) {
    const matchRows = matchSheet.getDataRange().getValues();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = matchRows.length - 1; i >= 1; i--) {
      let timestamp = matchRows[i][0];
      if (timestamp instanceof Date) {
        if (timestamp < today) {
          matchSheet.deleteRow(i + 1);
        }
      }
    }
  }
}

// =====================================================================
// 📊 ฟังก์ชันบันทึก Event Log สำหรับทำ Dashboard
// =====================================================================
function logToDashboard(ss, type, date, court, time, price, name, phone) {
  try {
    let dashSheet = ss.getSheetByName('DashBoard');
    if (dashSheet) {
      dashSheet.appendRow([
        new Date(),
        type || '',
        date || '',
        court || '',
        time || '',
        price || '',
        name || '',
        phone || ''
      ]);
    }
  } catch (e) {
    console.error("Dashboard Log Error:", e);
  }
}