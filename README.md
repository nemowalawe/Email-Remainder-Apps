# 📧 Vendor Reminder System

Aplikasi web untuk mengirim email reminder otomatis kepada vendor terkait deadline pengumpulan file pengadaan. Dibangun dengan React, TypeScript, Vite, Tailwind CSS, dan Vercel Serverless Functions dengan MongoDB Atlas.

## ✨ Fitur

- ✅ Kirim email reminder HTML terformat ke vendor
- ✅ Jadwalkan reminder berdasarkan waktu yang ditentukan
- ✅ Reminder berulang: harian, mingguan, atau hari tertentu
- ✅ Kirim langsung tanpa scheduling
- ✅ Pencarian server-side dengan debounce
- ✅ Filter berdasarkan status
- ✅ Pagination
- ✅ Nomor dokumen untuk setiap reminder
- ✅ Data persisten di MongoDB Atlas
- ✅ Tampilan modern bergaya shadcn dengan gradient background
- ✅ Responsive design
- ✅ Validasi form dengan Zod
- ✅ Test konfigurasi email
- ✅ 100% gratis dengan Vercel Hobby + cron-job.org

## 🏗️ Arsitektur

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: Vercel Serverless Functions (TypeScript)
- **Database**: MongoDB Atlas via Mongoose
- **Email**: Nodemailer (SMTP)
- **Scheduler**: cron-job.org (atau GitHub Actions)
- **Timezone**: Asia/Jakarta (WIB) dengan Luxon

## 📋 Prerequisites

- Node.js v18 atau lebih baru
- Akun MongoDB Atlas (gratis)
- Akun email (Gmail atau SMTP lainnya)
- Akun Vercel (Hobby plan gratis)
- Akun cron-job.org (gratis) untuk scheduler
- App password untuk Gmail (jika menggunakan Gmail)

## 🚀 Cara Install & Menjalankan

### 1. Clone dan Install Dependencies

```bash
cd vendor-reminder
npm install
```

### 2. Konfigurasi Environment Variables

Salin `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Edit file `.env` dan masukkan kredensial Anda:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vendor-reminder?retryWrites=true&w=majority

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here
MAIL_FROM="Vendor Reminder System" <your-email@gmail.com>

# Cron Secret (for protecting /api/cron/dispatch endpoint)
# Generate a strong random string: openssl rand -base64 32
CRON_SECRET=your-random-secret-key-here

# Timezone (default: Asia/Jakarta)
APP_TIMEZONE=Asia/Jakarta
```

**Untuk Gmail:**
1. Aktifkan 2-Factor Authentication di akun Google Anda
2. Buat App Password: Google Account → Security → App passwords
3. Gunakan app password tersebut sebagai `SMTP_PASS`

**Untuk CRON_SECRET:**
```bash
# Generate random secret
openssl rand -base64 32
```

### 3. Jalankan Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

### 4. Build untuk Production

```bash
npm run build
```

### 5. Jalankan Tests

```bash
npm run test
```

## 🌐 Deploy ke Vercel

### 1. Siapkan MongoDB Atlas

1. Buat cluster MongoDB Atlas (gratis)
2. Buat database user dengan readWrite permission
3. Network Access: Tambahkan `0.0.0.0/0` (Vercel menggunakan IP dinamis)
4. Dapatkan connection string dan masukkan ke `MONGODB_URI`

### 2. Deploy ke Vercel

1. Push code ke GitHub repository
2. Import project di Vercel Dashboard
3. Tambahkan semua environment variables di Project Settings → Environment Variables
4. Deploy

### 3. Konfigurasi Cron Job dengan cron-job.org

**Penting:** Vercel Hobby plan tidak mendukung cron job. Gunakan cron-job.org (gratis).

**Langkah-langkah:**

1. Buat akun di [cron-job.org](https://cron-job.org)
2. Buka menu **Cronjobs** → **Create cronjob**
3. Isi form:
   - **Title**: `Vendor Reminder Dispatch`
   - **URL**: `https://your-app.vercel.app/api/cron/dispatch`
   - **Schedule**: `* * * * *` (setiap menit) atau sesuai kebutuhan
   - **Request method**: `GET`
   - **Headers**: 
     - Key: `Authorization`
     - Value: `Bearer YOUR_CRON_SECRET`
   - **Timeout**: `30 seconds`
   - **Enable**: ✓

4. Klik **Create cronjob**

**Verifikasi:**
- Buka log di cron-job.org untuk melihat response
- Response harus berisi `{ "success": true, "processed": 0, "sent": 0, ... }`
- Jika response `401 Unauthorized`, periksa `CRON_SECRET` di header

**Alternatif: GitHub Actions**

GitHub Actions juga bisa digunakan, namun:
- Minimum interval adalah 5 menit
- Sering terjadi delay hingga beberapa menit
- Kurang presisi untuk reminder waktu tertentu

Contoh workflow:
```yaml
name: Trigger Cron
on:
  schedule:
    - cron: '*/5 * * * *'  # Setiap 5 menit
jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Call cron endpoint
        run: |
          curl -X GET "https://your-app.vercel.app/api/cron/dispatch" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## 📖 Cara Penggunaan

### Membuat Reminder Baru

1. **Nomor Dokumen**: Masukkan nomor dokumen pengadaan
2. **Judul**: Deskripsi singkat pengadaan
3. **Nama Vendor**: Nama perusahaan/vendor
4. **Email Vendor**: Alamat email vendor yang akan menerima reminder
5. **Deadline Pengumpulan**: Tanggal dan waktu batas akhir (WIB)
6. **Mode Kirim**: Pilih "Jadwalkan" atau "Kirim Sekarang"
7. **Waktu Kirim Reminder**: Kapan email reminder akan dikirim (untuk mode jadwalkan, WIB)
8. **Pengulangan**: Aktifkan jika ingin reminder berulang
9. **Catatan Tambahan** (opsional): Instruksi atau catatan untuk vendor
10. Klik **"Simpan & Jadwalkan"** atau **"Kirim Email Sekarang"**

**Catatan waktu:** Semua input waktu otomatis dianggap zona WIB (Asia/Jakarta).

### Test Konfigurasi Email

1. Masukkan email di field "Test Konfigurasi Email"
2. Klik "Kirim Test"
3. Cek inbox email Anda

### Mencari dan Filter

- Gunakan search box untuk mencari berdasarkan nomor dokumen, judul, nama vendor, atau email
- Pencarian menggunakan substring case-insensitive
- Gunakan dropdown status untuk filter berdasarkan status reminder
- Navigasi antar halaman menggunakan tombol pagination

### Melihat Daftar Reminder

Semua reminder yang telah dibuat akan muncul dengan status:
- ⏳ **Menunggu**: Reminder baru saja dibuat
- 📅 **Terjadwal**: Reminder sudah dijadwalkan menunggu waktu kirim
- ✅ **Terkirim**: Email sudah berhasil dikirim
- ❌ **Gagal**: Email gagal dikirim

### Menghapus Reminder

Klik tombol "Hapus" pada reminder yang ingin dihapus. Reminder yang sudah terkirim tidak dapat dihapus.

## 📁 Struktur Project

```
vendor-reminder/
├─ api/                    # Vercel Serverless Functions
│  ├─ reminders/
│  │  ├─ index.ts          # GET (list+search), POST (create)
│  │  └─ [id].ts           # DELETE
│  ├─ cron/
│  │  └─ dispatch.ts       # Cron endpoint
│  └─ test-email.ts        # Test email endpoint
├─ lib/                    # Shared server code
│  ├─ db.ts                # MongoDB connection
│  ├─ mailer.ts            # Email sender
│  ├─ schedule.ts          # Scheduling logic with Luxon
│  ├─ schedule.test.ts     # Unit tests
│  ├─ validation.ts        # Zod schemas
│  └─ models/
│     └─ Reminder.ts       # Mongoose model
├─ src/                    # React app
│  ├─ components/
│  │  ├─ Pagination.tsx
│  │  ├─ ReminderForm.tsx
│  │  ├─ ReminderList.tsx
│  │  ├─ SearchBar.tsx
│  │  ├─ StatusBadge.tsx
│  │  └─ TestEmailCard.tsx
│  ├─ hooks/
│  │  ├─ useDebounce.ts
│  │  └─ useReminders.ts
│  ├─ lib/
│  │  └─ api.ts
│  ├─ App.tsx
│  ├─ main.tsx
│  └─ index.css
├─ vercel.json
├─ .env.example
├─ vite.config.ts
├─ vitest.config.ts
├─ tailwind.config.ts
├─ tsconfig.json
└─ README.md
```

## ⚙️ API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/reminders?q=&status=&page=&limit=` | Daftar reminder + pencarian + filter + paging |
| POST | `/api/reminders` | Buat reminder baru |
| DELETE | `/api/reminders/:id` | Hapus reminder |
| POST | `/api/test-email` | Kirim email test |
| GET | `/api/cron/dispatch` | Proses reminder yang jatuh tempo (dipanggil cron-job.org) |

## 🔧 Troubleshooting

**Email tidak terkirim:**
- Periksa kredensial email di `.env`
- Pastikan App Password sudah benar (untuk Gmail)
- Cek koneksi internet
- Lihat log error di Vercel dashboard

**Data tidak tersimpan:**
- Periksa `MONGODB_URI` sudah benar
- Pastikan Network Access di MongoDB Atlas adalah `0.0.0.0/0`
- Cek log error di Vercel dashboard

**Cron tidak berjalan:**
- Pastikan `CRON_SECRET` sudah diset di environment variables Vercel
- Periksa header `Authorization: Bearer YOUR_SECRET` di cron-job.org
- Cek log di cron-job.org untuk melihat response
- Response 401 berarti secret salah
- Response 500 berarti ada error di server

**Waktu tidak cocok:**
- Semua waktu disimpan dalam UTC di database
- Tampilan di UI dan email diformat ke WIB
- Input datetime-local otomatis dikonversi dari WIB ke UTC
- Pastikan timezone sistem browser benar

## 🔒 Keamanan

- Semua kredensial disimpan di environment variables server
- Tidak ada `VITE_` prefix untuk kredensial (tidak terekspos ke frontend)
- Cron endpoint dilindungi dengan Bearer token
- Constant-time comparison untuk mencegah timing attack
- Atomic claim untuk mencegah duplikasi pengiriman
- Input di-escape untuk mencegah regex injection

## 📄 License

ISC

---

Dibuat dengan ❤️ menggunakan React, TypeScript, Vite, dan Vercel
