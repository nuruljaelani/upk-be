# Koperasi Backend API (`koperasi-be`)

Backend API resmi untuk sistem Koperasi Simpan Pinjam, dibangun menggunakan **Bun**, **Express v5**, **PostgreSQL**, dan **Drizzle ORM** dengan standar **Pure JavaScript (ES Modules)**.

---

## 🛠️ Tech Stack & Arsitektur
- **Runtime:** Bun
- **Framework:** Express v5
- **Database:** PostgreSQL
- **ORM & Migrations:** Drizzle ORM + Drizzle Kit
- **Language:** JavaScript (ES Modules, `"type": "module"`)
- **Keamanan & Autentikasi:** JWT + RBAC (`superadmin`, `operator`, `staf`, `member`) & Bun native bcrypt hashing
- **Validasi Data:** Zod

---

## 📁 Struktur Direktori
```
koperasi-be/
├── src/
│   ├── config/
│   │   └── env.js                   # Validasi runtime variabel lingkungan (Zod)
│   ├── db/
│   │   ├── index.js                 # Pool connection postgres.js & Drizzle client
│   │   └── schema/
│   │       ├── users.js             # Tabel users & role enum (superadmin, operator, staf, member)
│   │       ├── members.js           # Tabel profil anggota & status keanggotaan
│   │       ├── simpanan.js          # Master jenis simpanan, rekening, & mutasi simpanan
│   │       ├── pinjaman.js          # Master jenis pinjaman, pengajuan, jadwal angsuran, pembayaran
│   │       └── index.js             # Export relasi antar-tabel Drizzle
│   ├── middlewares/
│   │   ├── auth.js                  # authenticate & authorize (RBAC)
│   │   ├── errorHandler.js          # Centralized error handler
│   │   └── validate.js              # Request body/query/params validator
│   ├── modules/
│   │   ├── auth/                    # Register member, Login, Get profile
│   │   ├── simpanan/                # Master simpanan, buka rekening, transaksi setor & tarik (ACID)
│   │   ├── pinjaman/                # Engine simulasi bunga (Flat, Menurun, Anuitas), ajukan, review, bayar
│   │   └── backoffice/              # Dashboard statistik, laporan kas/simpanan/pinjaman, manajemen anggota
│   ├── utils/
│   │   ├── auth.js                  # Hash & verify password, JWT sign & verify
│   │   ├── errors.js                # Custom ApiError class
│   │   └── response.js              # Standar format respon JSON
│   ├── app.js                       # Express bootstrap, middlewares, & route mounting
│   └── index.js                     # Server entry point & graceful shutdown
├── drizzle/                         # File migrasi SQL hasil Drizzle Kit
├── drizzle.config.js                # Konfigurasi Drizzle Kit
├── .env.example                     # Template variabel lingkungan
└── package.json
```

---

## 🚀 Panduan Menjalankan

### 1. Salin Environment
```bash
cp .env.example .env
```
Sesuaikan `DATABASE_URL` ke PostgreSQL Anda (contoh: `postgresql://postgres:postgres@localhost:5432/koperasi_db`).

### 2. Jalankan Migrasi Database
```bash
bun run db:generate  # Menghasilkan file SQL
bun run db:migrate   # Menjalankan migrasi ke PostgreSQL
```

### 3. Jalankan Development Server
```bash
bun run dev
```
Server akan aktif di `http://localhost:5000`.

---

## 📡 Daftar Endpoint API

### 1. General & Health
- `GET /api/health` - Health check status API

### 2. Autentikasi & Onboarding Anggota (`/api/v1/auth`)
- `POST /api/v1/auth/aktivasi/cek` - **(Step 1 Aktivasi)** Verifikasi kecocokan No. Anggota / NIK dan No. Handphone terdaftar
- `POST /api/v1/auth/aktivasi` - **(Step 2 Aktivasi)** Pembuatan username & password untuk mengaktifkan akun anggota lama
- `POST /api/v1/auth/login` - Login sistem fleksibel (mendukung input **Username**, **No. Handphone**, **No. Anggota**, atau **Email**)
- `POST /api/v1/auth/register` - Pendaftaran calon anggota baru (email bersifat opsional)
- `GET /api/v1/auth/me` - Profil user login *(Memerlukan JWT)*

### 3. Modul Simpanan (`/api/v1/simpanan`)
- `GET /api/v1/simpanan/jenis` - Daftar master jenis simpanan (Pokok, Wajib, Sukarela)
- `POST /api/v1/simpanan/jenis` - Tambah master jenis simpanan *(Staf/Operator/Admin)*
- `POST /api/v1/simpanan/rekening/buka` - Pembukaan rekening simpanan anggota *(Staf/Operator/Admin)*
- `GET /api/v1/simpanan/rekening/me` - Daftar rekening simpanan & saldo anggota login *(Member)*
- `GET /api/v1/simpanan/rekening/:id` - Detail rekening simpanan
- `GET /api/v1/simpanan/rekening/:id/mutasi` - Riwayat mutasi transaksi simpanan (Paginasi)
- `POST /api/v1/simpanan/transaksi` - Setor / Tarik simpanan dengan database ACID transaction *(Staf/Operator/Admin)*

### 4. Modul Pinjaman (`/api/v1/pinjaman`)
- `POST /api/v1/pinjaman/simulasi` - Kalkulator simulasi angsuran (Bunga Flat, Menurun/Efektif, Anuitas) *(Publik)*
- `GET /api/v1/pinjaman/jenis` - Daftar master jenis pinjaman
- `POST /api/v1/pinjaman/jenis` - Tambah master jenis pinjaman *(Staf/Operator/Admin)*
- `POST /api/v1/pinjaman/ajukan` - Pengajuan pinjaman oleh anggota *(Member)*
- `GET /api/v1/pinjaman/me` - Daftar riwayat pinjaman anggota login *(Member)*
- `GET /api/v1/pinjaman/:id` - Detail pinjaman & tabel jadwal cicilan per bulan
- `POST /api/v1/pinjaman/:id/review` - Persetujuan / Penolakan pinjaman *(Staf/Operator/Admin)*
- `POST /api/v1/pinjaman/:id/cairkan` - Pencairan dana pinjaman *(Staf/Operator/Admin)*
- `POST /api/v1/pinjaman/angsuran/bayar` - Pembayaran cicilan angsuran *(Staf/Operator/Admin)*

### 5. Back Office & Pelaporan (`/api/v1/bo`)
- `GET /api/v1/bo/dashboard` - Statistik KPI real-time (total anggota, total simpanan, total piutang, transaksi terbaru)
- `GET /api/v1/bo/laporan/simpanan` - Laporan rekapitulasi setoran & penarikan simpanan per periode
- `GET /api/v1/bo/laporan/pinjaman` - Laporan penyaluran & sisa piutang pinjaman
- `GET /api/v1/bo/laporan/arus-kas` - Laporan arus kas bersih (Cash Flow masuk vs keluar)
- `GET /api/v1/bo/anggota` - Daftar anggota dengan pencarian NIK/nama/nomor anggota & filter status
- `PATCH /api/v1/bo/anggota/:id/status` - Ubah status keanggotaan (active, pending, inactive, suspended)
