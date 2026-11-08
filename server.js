const express = require('express');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory storage untuk scheduled reminders (tanpa database)
let reminders = [];
let reminderIdCounter = 1;

// Konfigurasi Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verifikasi koneksi email saat startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error.message);
    console.log('💡 Please check your .env file for correct email credentials');
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// Fungsi untuk mengirim email reminder
async function sendReminderEmail(reminder) {
  const mailOptions = {
    from: `"${process.env.SENDER_NAME || 'Vendor Reminder'}" <${process.env.EMAIL_USER}>`,
    to: reminder.vendorEmail,
    subject: `⏰ Reminder: Deadline Pengumpulan File - ${reminder.projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">📅 Deadline Reminder</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
          <p style="font-size: 16px; color: #374151;">Kepada Yth. <strong>${reminder.vendorName}</strong>,</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Detail Pengadaan:</p>
            <h3 style="margin: 0; color: #1f2937; font-size: 18px;">${reminder.projectName}</h3>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">📍 Deadline:</td>
                <td style="padding: 8px 0; font-weight: 600; color: #ef4444;">${new Date(reminder.deadline).toLocaleString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">📝 Catatan:</td>
                <td style="padding: 8px 0; color: #374151;">${reminder.notes || 'Tidak ada catatan tambahan'}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #fef3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              ⚠️ Harap segera lengkapi dan kumpulkan dokumen yang diperlukan sebelum batas waktu yang ditentukan.
            </p>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            Terima kasih atas perhatian dan kerjasamanya.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">
            Email ini dikirim secara otomatis oleh sistem Vendor Reminder. Mohon tidak membalas email ini.
          </p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${reminder.vendorEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${reminder.vendorEmail}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Fungsi untuk schedule reminder
function scheduleReminder(reminder) {
  const reminderDate = new Date(reminder.reminderTime);
  const now = new Date();
  
  // Hitung delay dalam milliseconds
  const delay = reminderDate.getTime() - now.getTime();
  
  if (delay <= 0) {
    console.log(`⚠️ Reminder time for ${reminder.vendorEmail} is in the past. Sending immediately.`);
    sendReminderEmail(reminder);
    reminder.status = 'sent';
    return;
  }
  
  // Schedule menggunakan setTimeout (simple approach without DB)
  const timeoutId = setTimeout(() => {
    sendReminderEmail(reminder);
    reminder.status = 'sent';
    reminder.scheduledJob = null;
  }, delay);
  
  reminder.scheduledJob = timeoutId;
  reminder.status = 'scheduled';
  console.log(`⏰ Reminder scheduled for ${reminder.vendorEmail} at ${reminderDate.toLocaleString('id-ID')}`);
}

// API Routes

// Get all reminders
app.get('/api/reminders', (req, res) => {
  const reminderList = reminders.map(r => ({
    id: r.id,
    vendorName: r.vendorName,
    vendorEmail: r.vendorEmail,
    projectName: r.projectName,
    deadline: r.deadline,
    reminderTime: r.reminderTime,
    status: r.status,
    notes: r.notes,
    createdAt: r.createdAt
  }));
  res.json({ success: true, data: reminderList });
});

// Create new reminder
app.post('/api/reminders', async (req, res) => {
  try {
    const { 
      vendorName, 
      vendorEmail, 
      projectName, 
      deadline, 
      reminderTime, 
      notes, 
      sendImmediate,
      isRecurring,
      recurringType,
      recurringTime,
      selectedDays
    } = req.body;
    
    // Validasi input
    if (!vendorName || !vendorEmail || !projectName || !deadline) {
      return res.status(400).json({ 
        success: false, 
        error: 'Semua field wajib harus diisi' 
      });
    }
    
    if (!isRecurring && !reminderTime) {
      return res.status(400).json({ 
        success: false, 
        error: 'Waktu reminder harus diisi' 
      });
    }
    
    // Validasi email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(vendorEmail)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Format email tidak valid' 
      });
    }
    
    // Validasi tanggal
    const deadlineDate = new Date(deadline);
    const now = new Date();
    
    if (deadlineDate <= now) {
      return res.status(400).json({ 
        success: false, 
        error: 'Deadline harus di masa depan' 
      });
    }
    
    // Handle recurring reminders
    if (isRecurring) {
      const schedules = generateRecurringSchedules(
        deadlineDate, 
        recurringType, 
        recurringTime, 
        selectedDays || []
      );
      
      if (schedules.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Tidak ada jadwal reminder yang valid' 
        });
      }
      
      const createdReminders = [];
      
      for (const schedule of schedules) {
        const reminder = {
          id: reminderIdCounter++,
          vendorName,
          vendorEmail,
          projectName,
          deadline,
          reminderTime: schedule.toISOString(),
          notes,
          status: 'pending',
          createdAt: new Date().toISOString(),
          scheduledJob: null,
          isRecurring: true,
          recurringType
        };
        
        reminders.push(reminder);
        scheduleReminder(reminder);
        createdReminders.push({
          id: reminder.id,
          reminderTime: reminder.reminderTime,
          status: reminder.status
        });
      }
      
      res.json({ 
        success: true, 
        data: {
          vendorName,
          vendorEmail,
          projectName,
          deadline,
          totalSchedules: createdReminders.length,
          schedules: createdReminders
        }, 
        message: `Berhasil membuat ${createdReminders.length} reminder berulang` 
      });
      
      return;
    }
    
    // Validasi single reminder
    const reminderDate = new Date(reminderTime);
    
    if (reminderDate >= deadlineDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Waktu reminder harus sebelum deadline' 
      });
    }
    
    // Buat reminder baru (single)
    const reminder = {
      id: reminderIdCounter++,
      vendorName,
      vendorEmail,
      projectName,
      deadline,
      reminderTime,
      notes,
      status: 'pending',
      createdAt: new Date().toISOString(),
      scheduledJob: null
    };
    
    reminders.push(reminder);
    
    // Kirim immediate atau schedule
    if (sendImmediate) {
      const result = await sendReminderEmail(reminder);
      if (result.success) {
        reminder.status = 'sent';
      } else {
        reminder.status = 'failed';
      }
      res.json({ 
        success: true, 
        data: {
          id: reminder.id,
          vendorName: reminder.vendorName,
          vendorEmail: reminder.vendorEmail,
          projectName: reminder.projectName,
          deadline: reminder.deadline,
          reminderTime: reminder.reminderTime,
          notes: reminder.notes,
          status: reminder.status,
          createdAt: reminder.createdAt
        }, 
        message: 'Email reminder berhasil dikirim',
        emailResult: result 
      });
    } else {
      scheduleReminder(reminder);
      res.json({ 
        success: true, 
        data: {
          id: reminder.id,
          vendorName: reminder.vendorName,
          vendorEmail: reminder.vendorEmail,
          projectName: reminder.projectName,
          deadline: reminder.deadline,
          reminderTime: reminder.reminderTime,
          notes: reminder.notes,
          status: reminder.status,
          createdAt: reminder.createdAt
        }, 
        message: 'Reminder berhasil dijadwalkan' 
      });
    }
    
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Terjadi kesalahan pada server' 
    });
  }
});

// Generate recurring schedules
function generateRecurringSchedules(deadline, recurringType, recurringTime, selectedDays) {
  const schedules = [];
  const now = new Date();
  const [hours, minutes] = recurringTime.split(':').map(Number);
  
  let currentDate = new Date(now);
  currentDate.setHours(hours, minutes, 0, 0);
  
  // If time has passed today, start from tomorrow
  if (currentDate <= now) {
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  const maxIterations = 365; // Prevent infinite loop
  let iterations = 0;
  
  while (currentDate < deadline && iterations < maxIterations) {
    iterations++;
    
    let shouldSchedule = false;
    
    switch (recurringType) {
      case 'daily':
        shouldSchedule = true;
        break;
        
      case 'weekly':
        // Same day of week as start
        shouldSchedule = currentDate.getDay() === now.getDay();
        break;
        
      case 'custom':
        shouldSchedule = selectedDays.includes(currentDate.getDay());
        break;
    }
    
    if (shouldSchedule) {
      schedules.push(new Date(currentDate));
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return schedules;
}

// Delete reminder
app.delete('/api/reminders/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = reminders.findIndex(r => r.id === id);
  
  if (index === -1) {
    return res.status(404).json({ 
      success: false, 
      error: 'Reminder tidak ditemukan' 
    });
  }
  
  const reminder = reminders[index];
  
  // Cancel scheduled job if exists
  if (reminder.scheduledJob) {
    clearTimeout(reminder.scheduledJob);
  }
  
  reminders.splice(index, 1);
  res.json({ 
    success: true, 
    message: 'Reminder berhasil dihapus' 
  });
});

// Test email endpoint
app.post('/api/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email harus diisi' 
      });
    }
    
    const mailOptions = {
      from: `"${process.env.SENDER_NAME || 'Vendor Reminder'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '✅ Test Email - Vendor Reminder System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10b981;">✅ Email Test Berhasil!</h2>
          <p>Konfigurasi email Anda sudah benar dan siap digunakan.</p>
          <p style="color: #6b7280; font-size: 12px;">Waktu pengiriman: ${new Date().toLocaleString('id-ID')}</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    res.json({ 
      success: true, 
      message: 'Test email berhasil dikirim' 
    });
    
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Gagal mengirim test email: ' + error.message 
    });
  }
});

// Serve HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`📧 Email service: ${process.env.EMAIL_SERVICE || 'gmail'}`);
  console.log(`👤 Email user: ${process.env.EMAIL_USER || 'not configured'}\n`);
});
