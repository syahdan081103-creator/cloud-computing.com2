const $ = (selector) => document.querySelector(selector);
const state = { students: [], filtered: [], page: 1, pageSize: 6, editingId: null, search: "", status: "" };
const palette = [
  ["#e8efff", "#4868d6"], ["#e5f7f1", "#209b79"], ["#fff0e6", "#d78248"],
  ["#f0eaff", "#8568d6"], ["#e5f4fb", "#3d8db3"], ["#fdeaf0", "#c85e83"]
];

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase() || "M";
}
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}
function avatarStyle(name) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const colors = palette[hash % palette.length];
  return `background:${colors[0]};color:${colors[1]}`;
}
function statusClass(status) {
  return status === "Aktif" ? "status-aktif" : status === "Cuti" ? "status-cuti" : "status-lulus";
}
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type === "error" ? "error" : ""}`;
  toast.innerHTML = `<span class="toast-mark">${type === "error" ? "!" : "✓"}</span><span>${escapeHTML(message)}</span>`;
  $("#toastRegion").appendChild(toast);
  setTimeout(() => toast.remove(), 3600);
}
async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Permintaan gagal. Silakan coba lagi.");
  return payload;
}
function setConnection(ok, db = ok) {
  $("#connectionLabel").textContent = ok ? "Sistem terhubung" : "Koneksi bermasalah";
  $("#apiStatus").textContent = ok ? "Online" : "Offline";
  $("#dbStatus").textContent = db ? "Terhubung" : "Tidak terhubung";
  $("#apiDot").style.background = ok ? "#21b78b" : "#e36d68";
  $("#dbDot").style.background = db ? "#21b78b" : "#e36d68";
  document.querySelector(".status-dot").style.background = ok ? "#21b78b" : "#e36d68";
}
async function checkHealth() {
  try {
    const health = await api("/api/health");
    setConnection(health.status === "ok", health.database === "connected");
  } catch {
    setConnection(false, false);
  }
}
async function loadStudents() {
  const body = $("#studentTableBody");
  body.innerHTML = `<tr><td colspan="7" class="loading-cell"><span class="loader"></span> Memuat data mahasiswa...</td></tr>`;
  try {
    state.students = await api("/api/students");
    updateStats();
    applyFilters();
    setConnection(true, true);
  } catch (error) {
    body.innerHTML = `<tr><td colspan="7" class="empty-cell">Tidak dapat memuat data. Pastikan server dan database SQL sudah berjalan.</td></tr>`;
    showToast(error.message, "error");
    setConnection(false, false);
  }
}
function updateStats() {
  $("#totalStudents").textContent = state.students.length;
  $("#activeStudents").textContent = state.students.filter(s => s.status === "Aktif").length;
  $("#leaveStudents").textContent = state.students.filter(s => s.status === "Cuti").length;
  $("#graduatedStudents").textContent = state.students.filter(s => s.status === "Lulus").length;
  $("#sideCount").textContent = state.students.length;
}
function applyFilters() {
  const search = state.search.toLocaleLowerCase("id-ID");
  state.filtered = state.students.filter(student => {
    const text = [student.nim, student.name, student.email, student.program, student.faculty].join(" ").toLocaleLowerCase("id-ID");
    return text.includes(search) && (!state.status || student.status === state.status);
  });
  state.page = 1;
  renderTable();
}
function renderTable() {
  const body = $("#studentTableBody");
  const total = state.filtered.length;
  const pages = Math.max(1, Math.ceil(total / state.pageSize));
  state.page = Math.min(state.page, pages);
  const start = (state.page - 1) * state.pageSize;
  const rows = state.filtered.slice(start, start + state.pageSize);

  $("#tableCount").textContent = `${total} data`;
  $("#tableSummary").textContent = total ? `Menampilkan ${start + 1}–${Math.min(start + state.pageSize, total)} dari ${total} data` : "Tidak ada data yang cocok";
  $("#pageNumber").textContent = `${state.page} / ${pages}`;
  $("#prevPage").disabled = state.page <= 1;
  $("#nextPage").disabled = state.page >= pages;

  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="7" class="empty-cell">Belum ada data yang cocok. Coba ubah kata kunci atau tambahkan mahasiswa baru.</td></tr>`;
    return;
  }
  body.innerHTML = rows.map(student => `
    <tr>
      <td><input type="checkbox" disabled aria-label="Pilih ${escapeHTML(student.name)}"></td>
      <td><div class="student-cell"><div class="student-avatar" style="${avatarStyle(student.name)}">${escapeHTML(initials(student.name))}</div><div><div class="student-name">${escapeHTML(student.name)}</div><div class="student-email">${escapeHTML(student.email)}</div></div></div></td>
      <td><span class="nim-text">${escapeHTML(student.nim)}</span></td>
      <td><span class="program-name">${escapeHTML(student.program)}</span></td>
      <td><span class="faculty-name">${escapeHTML(student.faculty)}</span></td>
      <td><span class="status-badge ${statusClass(student.status)}">${escapeHTML(student.status)}</span></td>
      <td><div class="row-actions">
        <button class="row-action" title="Lihat detail" aria-label="Lihat detail ${escapeHTML(student.name)}" data-action="view" data-id="${student.id}">⌕</button>
        <button class="row-action" title="Edit mahasiswa" aria-label="Edit ${escapeHTML(student.name)}" data-action="edit" data-id="${student.id}">✎</button>
        <button class="row-action delete" title="Hapus mahasiswa" aria-label="Hapus ${escapeHTML(student.name)}" data-action="delete" data-id="${student.id}">⌫</button>
      </div></td>
    </tr>`).join("");
}
function openModal(student = null) {
  state.editingId = student ? student.id : null;
  const form = $("#studentForm");
  form.reset();
  $("#modalTitle").textContent = student ? "Edit Data Mahasiswa" : "Tambah Mahasiswa";
  $("#saveStudentBtn").innerHTML = student ? "<span>✓</span> Simpan Perubahan" : "<span>✓</span> Simpan Data";
  if (student) {
    for (const key of ["nim", "name", "email", "program", "faculty", "phone", "status"]) {
      form.elements[key].value = student[key] || (key === "status" ? "Aktif" : "");
    }
  }
  $("#studentModal").hidden = false;
  document.body.style.overflow = "hidden";
  setTimeout(() => form.elements.nim.focus(), 50);
}
function closeModal() {
  $("#studentModal").hidden = true;
  document.body.style.overflow = "";
  state.editingId = null;
}
function formPayload() {
  const form = $("#studentForm");
  return Object.fromEntries(["nim", "name", "email", "program", "faculty", "phone", "status"].map(key => [key, form.elements[key].value.trim()]));
}
async function handleSubmit(event) {
  event.preventDefault();
  const button = $("#saveStudentBtn");
  button.disabled = true;
  button.textContent = "Menyimpan...";
  try {
    const payload = formPayload();
    if (state.editingId) {
      await api(`/api/students/${state.editingId}`, { method: "PUT", body: JSON.stringify(payload) });
      showToast("Data mahasiswa berhasil diperbarui.");
    } else {
      await api("/api/students", { method: "POST", body: JSON.stringify(payload) });
      showToast("Mahasiswa baru berhasil ditambahkan.");
    }
    closeModal();
    await loadStudents();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    button.disabled = false;
    button.innerHTML = state.editingId ? "<span>✓</span> Simpan Perubahan" : "<span>✓</span> Simpan Data";
  }
}
async function handleTableAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = Number(button.dataset.id);
  const action = button.dataset.action;
  const student = state.students.find(item => item.id === id);
  if (!student) return;
  if (action === "view") {
    showToast(`${student.name} • ${student.nim} • ${student.program}`);
  } else if (action === "edit") {
    openModal(student);
  } else if (action === "delete") {
    const confirmed = window.confirm(`Hapus data mahasiswa "${student.name}" (${student.nim})? Tindakan ini tidak dapat dibatalkan.`);
    if (!confirmed) return;
    try {
      await api(`/api/students/${id}`, { method: "DELETE" });
      showToast("Data mahasiswa berhasil dihapus.");
      await loadStudents();
    } catch (error) {
      showToast(error.message, "error");
    }
  }
}
function init() {
  const now = new Date();
  $("#todayDate").textContent = new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).format(now);
  $("#addStudentBtn").addEventListener("click", () => openModal());
  $("#closeModal").addEventListener("click", closeModal);
  $("#cancelModal").addEventListener("click", closeModal);
  $("#studentModal").addEventListener("click", event => { if (event.target === $("#studentModal")) closeModal(); });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !$("#studentModal").hidden) closeModal();
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault(); $("#searchInput").focus();
    }
  });
  $("#studentForm").addEventListener("submit", handleSubmit);
  $("#studentTableBody").addEventListener("click", handleTableAction);
  $("#searchInput").addEventListener("input", event => { state.search = event.target.value; applyFilters(); });
  $("#statusFilter").addEventListener("change", event => { state.status = event.target.value; applyFilters(); });
  $("#refreshBtn").addEventListener("click", loadStudents);
  $("#prevPage").addEventListener("click", () => { if (state.page > 1) { state.page--; renderTable(); } });
  $("#nextPage").addEventListener("click", () => { if (state.page < Math.ceil(state.filtered.length / state.pageSize)) { state.page++; renderTable(); } });
  $("#menuToggle").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
  document.querySelectorAll(".nav-item").forEach(item => item.addEventListener("click", () => $("#sidebar").classList.remove("open")));
  checkHealth();
  loadStudents();
}
document.addEventListener("DOMContentLoaded", init);
