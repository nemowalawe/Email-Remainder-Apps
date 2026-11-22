import React, { useState } from 'react';
import { emailApi } from '../lib/api';
import toast from 'react-hot-toast';
import { MailIcon, SendIcon } from './icons';

export const TestEmailCard: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendTest = async () => {
    if (!email.trim()) {
      toast.error('Masukkan alamat email untuk test');
      return;
    }

    setIsLoading(true);
    try {
      const result = await emailApi.test(email);
      if (result.success) {
        toast.success('Test email berhasil dikirim! Cek inbox Anda.');
        setEmail('');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengirim test email';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#111215] rounded-xl border border-white/[0.08] p-5">
      <div className="flex items-center gap-2 mb-1.5">
        <MailIcon size={16} className="text-zinc-400" />
        <h3 className="text-sm font-semibold text-zinc-200">
          Diagnostik & Test SMTP
        </h3>
      </div>
      <p className="text-xs text-zinc-400 mb-3.5">
        Verifikasi integrasi SMTP dengan mengirimkan email uji coba ke alamat tujuan.
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@perusahaan.com"
          className="flex-1 px-3 py-2 text-sm bg-zinc-900/60 border border-white/[0.08] text-zinc-100 placeholder-zinc-500 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
        />
        <button
          onClick={handleSendTest}
          disabled={isLoading}
          className="btn-press inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-zinc-200 bg-white/[0.06] border border-white/[0.1] rounded-lg hover:bg-white/[0.1] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-0.5 mr-1 h-3.5 w-3.5 text-zinc-300" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Menguji...</span>
            </>
          ) : (
            <>
              <SendIcon size={14} />
              <span>Kirim Test</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
