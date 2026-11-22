import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../lib/db';
import { Reminder } from '../../lib/models/Reminder';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID reminder tidak valid' });
  }

  await connectDB();

  if (req.method === 'DELETE') {
    return handleDelete(id, res);
  } else {
    return res.status(405).json({ error: 'Method tidak diizinkan' });
  }
}

async function handleDelete(id: string, res: VercelResponse) {
  try {
    const reminder = await Reminder.findById(id);

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder tidak ditemukan' });
    }

    // Prevent deletion of sent reminders
    if (reminder.status === 'terkirim') {
      return res.status(400).json({ error: 'Reminder yang sudah terkirim tidak dapat dihapus' });
    }

    await Reminder.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Reminder berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
}
