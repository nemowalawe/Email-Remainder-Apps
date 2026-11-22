import type { VercelRequest, VercelResponse } from '@vercel/node';
import { testEmailSchema } from '../lib/validation.js';
import { sendTestEmail } from '../lib/mailer.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method tidak diizinkan' });
  }

  try {
    const body = testEmailSchema.parse(req.body);
    const result = await sendTestEmail(body.email);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Test email berhasil dikirim',
      });
    } else {
      return res.status(500).json({
        error: 'Gagal mengirim test email',
        details: result.error,
      });
    }
  } catch (error) {
    console.error('Test email error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validasi gagal',
        details: error,
      });
    }

    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
}
