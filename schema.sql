CREATE DATABASE IF NOT EXISTS cloud_student_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE cloud_student_db;

CREATE TABLE IF NOT EXISTS students (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nim VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL,
  program VARCHAR(100) NOT NULL,
  faculty VARCHAR(120) NOT NULL,
  phone VARCHAR(25) DEFAULT NULL,
  status ENUM('Aktif', 'Cuti', 'Lulus') NOT NULL DEFAULT 'Aktif',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_students_name (name),
  INDEX idx_students_program (program),
  INDEX idx_students_status (status)
);

-- Optional sample data. Remove this section if you want an empty database.
INSERT IGNORE INTO students (nim, name, email, program, faculty, phone, status) VALUES
('202610001', 'Nadia Putri', 'nadia.putri@example.com', 'Informatika', 'Fakultas Teknik', '081234567801', 'Aktif'),
('202610002', 'Rizky Pratama', 'rizky.pratama@example.com', 'Sistem Informasi', 'Fakultas Ilmu Komputer', '081234567802', 'Aktif'),
('202610003', 'Alya Ramadhani', 'alya.ramadhani@example.com', 'Informatika', 'Fakultas Teknik', '081234567803', 'Cuti'),
('202610004', 'Dimas Saputra', 'dimas.saputra@example.com', 'Teknik Industri', 'Fakultas Teknik', '081234567804', 'Lulus'),
('202610005', 'Farhan Akbar', 'farhan.akbar@example.com', 'Sistem Informasi', 'Fakultas Ilmu Komputer', '081234567805', 'Aktif');
