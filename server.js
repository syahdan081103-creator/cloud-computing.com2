require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "public")));

const pool = mysql.createPool({
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "",
  database: "cloud_student_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const allowedStatuses = ["Aktif", "Cuti", "Lulus"];

function validateStudent(body) {
  const fields = ["nim", "name", "email", "program", "faculty"];
  for (const field of fields) {
    if (typeof body[field] !== "string" || !body[field].trim()) {
      return `Kolom ${field} wajib diisi.`;
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    return "Format email tidak valid.";
  }
  if (body.status && !allowedStatuses.includes(body.status)) {
    return "Status mahasiswa tidak valid.";
  }
  return null;
}

function cleanStudent(body) {
  return {
    nim: body.nim.trim(),
    name: body.name.trim(),
    email: body.email.trim(),
    program: body.program.trim(),
    faculty: body.faculty.trim(),
    phone: typeof body.phone === "string" ? body.phone.trim() : "",
    status: body.status || "Aktif"
  };
}

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (_error) {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

app.get("/api/students", async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "").trim();
    const where = [];
    const params = [];

    if (search) {
      where.push("(nim LIKE ? OR name LIKE ? OR email LIKE ? OR program LIKE ? OR faculty LIKE ?)");
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }
    if (status && allowedStatuses.includes(status)) {
      where.push("status = ?");
      params.push(status);
    }

    const sql = `SELECT id, nim, name, email, program, faculty, phone, status,
      DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
      FROM students ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY created_at DESC, id DESC`;
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error("GET /api/students:", error.message);
    res.status(500).json({ message: "Gagal mengambil data mahasiswa." });
  }
});

app.get("/api/students/:id", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, nim, name, email, program, faculty, phone, status FROM students WHERE id = ?",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Mahasiswa tidak ditemukan." });
    res.json(rows[0]);
  } catch (error) {
    console.error("GET /api/students/:id:", error.message);
    res.status(500).json({ message: "Gagal mengambil detail mahasiswa." });
  }
});

app.post("/api/students", async (req, res) => {
  const validationError = validateStudent(req.body);
  if (validationError) return res.status(400).json({ message: validationError });

  const student = cleanStudent(req.body);
  try {
    const [result] = await pool.execute(
      `INSERT INTO students (nim, name, email, program, faculty, phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [student.nim, student.name, student.email, student.program, student.faculty, student.phone, student.status]
    );
    const [rows] = await pool.execute(
      "SELECT id, nim, name, email, program, faculty, phone, status FROM students WHERE id = ?",
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "NIM sudah digunakan. Gunakan NIM lain." });
    console.error("POST /api/students:", error.message);
    res.status(500).json({ message: "Gagal menambahkan mahasiswa." });
  }
});

app.put("/api/students/:id", async (req, res) => {
  const validationError = validateStudent(req.body);
  if (validationError) return res.status(400).json({ message: validationError });

  const student = cleanStudent(req.body);
  try {
    const [result] = await pool.execute(
      `UPDATE students SET nim = ?, name = ?, email = ?, program = ?, faculty = ?, phone = ?, status = ?
       WHERE id = ?`,
      [student.nim, student.name, student.email, student.program, student.faculty, student.phone, student.status, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Mahasiswa tidak ditemukan." });
    const [rows] = await pool.execute(
      "SELECT id, nim, name, email, program, faculty, phone, status FROM students WHERE id = ?",
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "NIM sudah digunakan oleh mahasiswa lain." });
    console.error("PUT /api/students/:id:", error.message);
    res.status(500).json({ message: "Gagal memperbarui data mahasiswa." });
  }
});

app.delete("/api/students/:id", async (req, res) => {
  try {
    const [result] = await pool.execute("DELETE FROM students WHERE id = ?", [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Mahasiswa tidak ditemukan." });
    res.json({ message: "Data mahasiswa berhasil dihapus." });
  } catch (error) {
    console.error("DELETE /api/students/:id:", error.message);
    res.status(500).json({ message: "Gagal menghapus data mahasiswa." });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

async function start() {
  try {
    await pool.query("SELECT 1");
    console.log("Database connected.");
  } catch (error) {
    console.warn("Database belum tersambung:", error.message);
    console.warn("Pastikan konfigurasi .env dan database sudah benar.");
  }
  app.listen(PORT, "0.0.0.0", () => console.log(`App berjalan di http://localhost:${PORT}`));
}
start();
