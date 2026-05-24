# ModalIn Backend API

Backend RESTful API untuk aplikasi **ModalIn** — AI Credit Scoring untuk UMKM.  
Dibangun dengan **Node.js + Express + MongoDB**.

---

## 📁 Struktur Folder

```
modalin-backend/
├── src/
│   ├── index.js              ← Entry point server
│   ├── config/
│   │   └── database.js       ← Koneksi MongoDB
│   ├── models/
│   │   ├── User.js           ← Model data user
│   │   └── Upload.js         ← Model data file upload
│   ├── controllers/
│   │   ├── authController.js     ← Register, Login, OTP
│   │   ├── userController.js     ← Profil user
│   │   ├── uploadController.js   ← Upload file
│   │   └── scoringController.js  ← Credit scoring
│   ├── routes/
│   │   ├── auth.js
│   │   ├── user.js
│   │   ├── upload.js
│   │   └── scoring.js
│   └── middleware/
│       ├── auth.js           ← Cek JWT token
│       └── upload.js         ← Konfigurasi multer
├── uploads/                  ← File yang diupload (auto-dibuat)
├── .env.example              ← Contoh environment variables
├── .gitignore
└── package.json
```

---

## 🚀 Cara Menjalankan

### 1. Install dependencies
```bash
cd modalin-backend
npm install
```

### 2. Siapkan file .env
```bash
cp .env.example .env
```
Lalu edit file `.env` dan isi:
- `MONGODB_URI` — koneksi MongoDB kamu
- `JWT_SECRET` — string acak panjang (boleh apa saja, misal: `modalin2024_xK9mP3qR`)
- `EMAIL_USER` dan `EMAIL_PASS` — Gmail untuk kirim OTP

### 3. Install MongoDB (pilih salah satu)
**Opsi A — Local (install di komputer):**
- Download di https://www.mongodb.com/try/download/community
- Jalankan: `mongod`

**Opsi B — Cloud gratis (MongoDB Atlas):**
- Daftar di https://cloud.mongodb.com
- Buat cluster gratis
- Copy connection string ke `MONGODB_URI` di `.env`

### 4. Jalankan server
```bash
# Mode development (auto-restart saat file berubah)
npm run dev

# Mode production
npm start
```

Server akan berjalan di: **http://localhost:5000**

---

## 📋 Daftar Endpoint API

### 🔐 Auth (tidak perlu login)
| Method | URL | Keterangan |
|--------|-----|------------|
| POST | `/api/auth/register` | Daftar akun baru |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/forgot-password` | Kirim OTP ke email |
| POST | `/api/auth/verify-otp` | Verifikasi kode OTP |
| POST | `/api/auth/reset-password` | Reset password baru |

### 👤 User (butuh token)
| Method | URL | Keterangan |
|--------|-----|------------|
| GET | `/api/user/profile` | Ambil data profil |
| PUT | `/api/user/profile/personal` | Update info pribadi |
| PUT | `/api/user/profile/business` | Update info bisnis |
| PUT | `/api/user/profile/password` | Ubah password |

### 📁 Upload (butuh token)
| Method | URL | Keterangan |
|--------|-----|------------|
| POST | `/api/upload/data` | Upload file (PDF/CSV/XLS) |
| GET | `/api/upload/riwayat` | Riwayat upload |

### 📊 Scoring (butuh token)
| Method | URL | Keterangan |
|--------|-----|------------|
| GET | `/api/scoring` | Hasil credit scoring |
| GET | `/api/scoring/anomali` | Anomali arus kas |
| GET | `/api/scoring/rekomendasi` | Rekomendasi pinjaman |

---

## 🔑 Cara Pakai Token

Setelah login/register, simpan `token` dari response.  
Kirim di setiap request yang butuh login dengan header:
```
Authorization: Bearer <token_kamu>
```

---

## 📤 Contoh Request

### Register
```json
POST /api/auth/register
{
  "nik": "3578123456789012",
  "nama": "Budi Santoso",
  "email": "budi@email.com",
  "password": "password123"
}
```

### Login
```json
POST /api/auth/login
{
  "email": "budi@email.com",
  "password": "password123"
}
```

### Upload File
```
POST /api/upload/data
Content-Type: multipart/form-data
Authorization: Bearer <token>

files: [file1.pdf, file2.csv]
```

---

## ⚠️ Catatan Penting untuk Koneksi ke Frontend

Frontend perlu menambahkan fetch/axios ke tombol yang sudah ada.  
**Tidak ada perubahan pada tampilan UI.**

Contoh koneksi di tombol Register (App.tsx):
```typescript
// Di onClick tombol "Daftar Sekarang", ganti:
onComplete(form.nik, form.nama, form.email)

// Menjadi:
const res = await fetch("http://localhost:5000/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    nik: form.nik,
    nama: form.nama,
    email: form.email,
    password: form.password
  })
});
const data = await res.json();
if (data.status === "success") {
  localStorage.setItem("token", data.data.token);
  onComplete(form.nik, form.nama, form.email);
}
```
