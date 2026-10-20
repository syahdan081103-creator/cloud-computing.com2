# EduManage — Student Management System

Aplikasi CRUD mahasiswa untuk tugas Cloud Computing. Dibuat menggunakan HTML, CSS, JavaScript, Node.js, Express, dan MySQL/MariaDB.

## Fitur

- Create: tambah data mahasiswa.
- Read: tampilkan, cari, dan filter data.
- Update: edit data mahasiswa.
- Delete: hapus data dengan konfirmasi.
- Dashboard statistik status mahasiswa.
- REST API dengan validasi input dan query SQL berparameter.
- UI responsif untuk desktop dan ponsel.
- Health check untuk memeriksa koneksi database.

## Persyaratan

- Node.js 18 atau lebih baru.
- MySQL atau MariaDB.
- Browser modern.

## Menjalankan di laptop

1. Pastikan MySQL aktif (bisa dari XAMPP Control Panel).
2. Buka phpMyAdmin, lalu pilih menu **Import** dan impor `schema.sql`. Alternatif: jalankan isi `schema.sql` melalui MySQL client.
3. Salin `.env.example` menjadi `.env`.
4. Sesuaikan nilai `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, dan `DB_NAME` dengan konfigurasi MySQL lokal kamu.
5. Buka terminal pada folder proyek dan jalankan:

   ```bash
   npm install
   npm start
   ```

6. Buka `http://localhost:3000`.

### Membuat user database khusus (disarankan)

Jalankan perintah ini di MySQL sebagai administrator. Ganti password contoh dengan password kuat milikmu:

```sql
CREATE USER 'student_app'@'localhost' IDENTIFIED BY 'GANTI_PASSWORD_KUAT';
GRANT SELECT, INSERT, UPDATE, DELETE ON cloud_student_db.* TO 'student_app'@'localhost';
FLUSH PRIVILEGES;
```

Kemudian isi `DB_USER=student_app` dan `DB_PASSWORD` dengan nilai yang sama di file `.env`.

## Endpoint REST API

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/health` | Status server dan database |
| GET | `/api/students` | Semua data mahasiswa |
| GET | `/api/students?search=andi` | Cari mahasiswa |
| GET | `/api/students?status=Aktif` | Filter berdasarkan status |
| GET | `/api/students/:id` | Detail mahasiswa |
| POST | `/api/students` | Tambah data |
| PUT | `/api/students/:id` | Ubah data |
| DELETE | `/api/students/:id` | Hapus data |

Contoh JSON untuk POST/PUT:

```json
{
  "nim": "202610006",
  "name": "Andi Pratama",
  "email": "andi@example.com",
  "program": "Informatika",
  "faculty": "Fakultas Teknik",
  "phone": "081234567890",
  "status": "Aktif"
}
```

## Catatan deployment VPS

- Jangan upload file `.env` ke GitHub.
- Buat database dan user SQL di VPS, lalu impor `schema.sql`.
- Jalankan aplikasi Node.js menggunakan process manager seperti PM2.
- Gunakan Nginx sebagai reverse proxy dan HTTPS melalui sertifikat TLS.
- Jangan membuka port database `3306` ke seluruh internet; izinkan akses lokal atau dari server aplikasi saja.
- Simpan backup database secara berkala.
- UI menggunakan Google Fonts; jika internet eksternal tidak tersedia, browser akan memakai font cadangan.

## Struktur folder

```text
cloud-student-management/
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── schema.sql
├── server.js
├── package.json
├── .env.example
├── .gitignore
└── README.md
```
