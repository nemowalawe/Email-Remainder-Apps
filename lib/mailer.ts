import nodemailer from 'nodemailer';
import type { IReminder } from './models/Reminder.js';

const TIMEZONE = 'Asia/Jakarta';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE !== 'false',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function verifyTransporter(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return false;
  }
}

/**
 * Format date to Indonesian locale with WIB timezone
 */
function formatDateWIB(date: Date): string {
  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: TIMEZONE,
    dateStyle: 'long',
    timeStyle: 'short',
  });
  return formatter.format(date) + ' WIB';
}

export function generateEmailHTML(reminder: IReminder): string {
  const deadlineFormatted = formatDateWIB(new Date(reminder.deadline));
  const recurrenceInfo = getRecurrenceInfo(reminder);

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reminder: ${escapeHtml(reminder.title)}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6;">
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">📅 Deadline Reminder</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; color: #374151;">Kepada Yth. <strong>${escapeHtml(reminder.vendorName)}</strong>,</p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Nomor Dokumen:</p>
            <h3 style="margin: 0; color: #1f2937; font-size: 16px;">${escapeHtml(reminder.documentNumber)}</h3>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Detail Pengadaan:</p>
            <h3 style="margin: 0; color: #1f2937; font-size: 18px;">${escapeHtml(reminder.title)}</h3>
          </div>
          
          <div style="background: #ffffff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 140px;">📍 Deadline:</td>
                <td style="padding: 8px 0; font-weight: 600; color: #ef4444;">${deadlineFormatted}</td>
              </tr>
              ${reminder.message ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">📝 Catatan:</td>
                <td style="padding: 8px 0; color: #374151;">${escapeHtml(reminder.message)}</td>
              </tr>
              ` : ''}
              ${recurrenceInfo ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">🔁 Pengulangan:</td>
                <td style="padding: 8px 0; color: #374151;">${recurrenceInfo}</td>
              </tr>
              ` : ''}
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
    </body>
    </html>
  `;
}

export function generateTestEmailHTML(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: TIMEZONE,
    dateStyle: 'long',
    timeStyle: 'short',
  });
  const timeFormatted = formatter.format(now) + ' WIB';

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test Email</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6;">
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">✅ Email Test Berhasil!</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; color: #374151;">Konfigurasi email Anda sudah benar dan siap digunakan.</p>
          <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
            Waktu pengiriman: ${timeFormatted}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getRecurrenceInfo(reminder: IReminder): string | null {
  if (!reminder.recurrence || reminder.recurrence.type === 'none') {
    return null;
  }

  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const time = reminder.recurrence.time || '09:00';

  switch (reminder.recurrence.type) {
    case 'daily':
      return `Setiap hari pukul ${time} WIB`;
    case 'weekly':
      return `Setiap minggu pukul ${time} WIB`;
    case 'days':
      if (reminder.recurrence.daysOfWeek && reminder.recurrence.daysOfWeek.length > 0) {
        const days = reminder.recurrence.daysOfWeek.map((d) => dayNames[d]).join(', ');
        return `Setiap ${days} pukul ${time} WIB`;
      }
      return null;
    default:
      return null;
  }
}

export async function sendReminderEmail(reminder: IReminder): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const mailOptions = {
    from: process.env.MAIL_FROM || `"Vendor Reminder" <${process.env.SMTP_USER}>`,
    to: reminder.vendorEmail,
    subject: `⏰ Reminder: Deadline Pengumpulan File - ${reminder.documentNumber} - ${reminder.title}`,
    html: generateEmailHTML(reminder),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${reminder.vendorEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Failed to send email to ${reminder.vendorEmail}:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function sendTestEmail(email: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const mailOptions = {
    from: process.env.MAIL_FROM || `"Vendor Reminder" <${process.env.SMTP_USER}>`,
    to: email,
    subject: '✅ Test Email - Vendor Reminder System',
    html: generateTestEmailHTML(),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}
