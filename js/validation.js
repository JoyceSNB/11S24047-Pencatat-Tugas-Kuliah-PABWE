/* Modul 1: VALIDASI
   Fungsi murni: tidak menyentuh DOM maupun penyimpanan, sehingga bisa diuji langsung di Node. */
(function (root) {
  'use strict';

  const COURSES = [
    'Pengembangan Aplikasi Berbasis Web',
    'Analisis dan Perancangan Perangkat Lunak',
    'Kecerdasan Buatan',
    'Manajemen Proyek Teknologi Informasi',
    'Pengujian dan Penjaminan Mutu Perangkat Lunak',
    'Kriptografi dan Keamanan Informasi'
  ];
  const TITLE_MIN = 3;
  const TITLE_MAX = 100;

  // Tanggal lokal hari ini 'YYYY-MM-DD' (bukan UTC, supaya tidak meleset zona waktu).
  function getTodayISO(now = new Date()) {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Cek string benar-benar tanggal kalender yang valid (menolak 2026-02-31).
  function isValidISODate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [y, m, d] = value.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
  }

  // Setiap validateX mengembalikan pesan error (string) atau '' jika valid.
  function validateTitle(raw) {
    const title = String(raw).trim();
    if (title.length < TITLE_MIN) return `Judul minimal ${TITLE_MIN} karakter.`;
    if (title.length > TITLE_MAX) return `Judul maksimal ${TITLE_MAX} karakter.`;
    return '';
  }

  function validateCourse(value) {
    if (!value) return 'Pilih mata kuliah.';
    if (!COURSES.includes(value)) return 'Mata kuliah tidak dikenali.';
    return '';
  }

  function validateDeadline(value, today) {
    if (!value) return 'Deadline wajib diisi.';
    if (!isValidISODate(value)) return 'Format tanggal tidak valid.';
    // Format YYYY-MM-DD aman dibandingkan sebagai string.
    if (value < today) return 'Deadline tidak boleh sebelum hari ini.';
    return '';
  }

  // Validasi seluruh form. Hasil: { valid, errors, values }.
  function validateTask(input, today = getTodayISO()) {
    const errors = {
      title: validateTitle(input.title),
      course: validateCourse(input.course),
      deadline: validateDeadline(input.deadline, today)
    };
    return {
      valid: !errors.title && !errors.course && !errors.deadline,
      errors,
      values: { title: String(input.title).trim(), course: input.course, deadline: input.deadline }
    };
  }

  const api = {
    COURSES, TITLE_MIN, TITLE_MAX,
    getTodayISO, isValidISODate,
    validateTitle, validateCourse, validateDeadline, validateTask
  };

  root.PT = root.PT || {};
  root.PT.validation = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
