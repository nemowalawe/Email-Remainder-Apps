# 📧 Vendor Reminder System

Aplikasi web sederhana untuk mengirim reminder email kepada vendor terkait deadline pengumpulan file pengadaan. Dibangun dengan Node.js, Express, dan Nodemailer tanpa memerlukan database.

## ✨ Fitur

- ✅ Kirim email reminder ke vendor
- ✅ Jadwalkan reminder berdasarkan waktu yang ditentukan
- ✅ Tampilan modern mirip shadcn UI
- ✅ Tanpa database (in-memory storage)
- ✅ Test konfigurasi email
- ✅ Responsive design
- ✅ Validasi form
- ✅ Status tracking (pending, scheduled, sent, failed)

## 📋 Prerequisites

- Node.js v14 atau lebih baru
- Akun email (Gmail atau SMTP lainnya)
- App password untuk Gmail (jika menggunakan Gmail)

## 🚀 Cara Install & Menjalankan

### 1. Masuk ke folder project

```bash
cd vendor-reminder
```

### 2. Install dependencies

```bash
npm install
```

### 3. Konfigurasi Email

Edit file `.env` dan masukkan kredensial email Anda:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here
PORT=3000
SENDER_NAME=Vendor Reminder System
```

**Untuk Gmail:**
1. Aktifkan 2-Factor Authentication di akun Google Anda
2. Buat App Password: Google Account → Security → App passwords
3. Gunakan app password tersebut sebagai `EMAIL_PASS`

**Untuk SMTP lain (Outlook, Yahoo, dll):**
Ganti `EMAIL_SERVICE` dengan service yang sesuai atau konfigurasi SMTP manual di `server.js`.

### 4. Jalankan aplikasi

**Development mode (dengan auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

### 5. Akses aplikasi

Buka browser dan akses: `http://localhost:3000`

## 📖 Cara Penggunaan

### Membuat Reminder Baru

1. **Nama Vendor**: Masukkan nama perusahaan/vendor
2. **Email Vendor**: Masukkan alamat email vendor yang akan menerima reminder
3. **Nama Proyek/Pengadaan**: Deskripsi singkat pengadaan
4. **Deadline Pengumpulan**: Tanggal dan waktu batas akhir
5. **Waktu Kirim Reminder**: Kapan email reminder akan dikirim
6. **Catatan Tambahan** (opsional): Instruksi atau catatan untuk vendor
7. **Kirim Email Sekarang** (opsional): Centang jika ingin langsung mengirim tanpa scheduling
8. Klik **"Simpan & Jadwalkan"** atau **"Kirim Email Sekarang"**

### Test Konfigurasi Email

Sebelum menggunakan, Anda bisa test apakah konfigurasi email sudah benar:

1. Masukkan email Anda di field "Email untuk test"
2. Klik "Kirim Test"
3. Cek inbox email Anda

### Melihat Daftar Reminder

Semua reminder yang telah dibuat akan muncul di panel kanan dengan status:
- ⏳ **Menunggu**: Reminder baru saja dibuat
- 📅 **Terjadwal**: Reminder sudah dijadwalkan
- ✅ **Terkirim**: Email sudah berhasil dikirim
- ❌ **Gagal**: Email gagal dikirim

### Menghapus Reminder

Klik tombol "🗑️ Hapus" pada reminder yang ingin dihapus. Reminder yang sudah terkirim tidak dapat dihapus.

## 🏗️ Struktur Project

```
vendor-reminder/
├── public/
│   ├── index.html      # Frontend HTML
│   └── app.js          # Frontend JavaScript
├── .env                # Konfigurasi environment
├── .gitignore          # Git ignore file
├── package.json        # Dependencies
├── server.js           # Express server
└── README.md           # Dokumentasi
```

## ⚙️ API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/reminders` | Mendapatkan semua reminder |
| POST | `/api/reminders` | Membuat reminder baru |
| DELETE | `/api/reminders/:id` | Menghapus reminder |
| POST | `/api/test-email` | Test konfigurasi email |

## 📝 Contoh Request Body

**POST /api/reminders**
```json
{
  "vendorName": "PT. Maju Bersama",
  "vendorEmail": "vendor@email.com",
  "projectName": "Pengadaan Alat Tulis Kantor",
  "deadline": "2024-12-31T17:00:00",
  "reminderTime": "2024-12-30T09:00:00",
  "notes": "Mohon kumpulkan dokumen lengkap",
  "sendImmediate": false
}
```

## ⚠️ Catatan Penting

1. **Tanpa Database**: Data reminder disimpan in-memory. Jika server restart, data akan hilang.
2. **Scheduling**: Reminder menggunakan `setTimeout` dari JavaScript, bukan cron job yang presisi.
3. **Gmail Limits**: Gmail memiliki batas pengiriman email per hari (sekitar 500 email/hari).
4. **App Password**: Jangan gunakan password akun Google langsung. Gunakan App Password.

## 🔧 Troubleshooting

**Email tidak terkirim:**
- Periksa kredensial email di `.env`
- Pastikan App Password sudah benar (untuk Gmail)
- Cek koneksi internet
- Lihat log error di console server

**Server tidak jalan:**
- Pastikan port 3000 tidak digunakan aplikasi lain
- Cek apakah semua dependencies sudah terinstall

**Form tidak berfungsi:**
- Buka browser console (F12) untuk melihat error
- Pastikan server berjalan dengan benar

## 📄 License

ISC

## 👤 Author

Your Name

---

Dibuat dengan ❤️ menggunakan Node.js, Express, dan Nodemailer
