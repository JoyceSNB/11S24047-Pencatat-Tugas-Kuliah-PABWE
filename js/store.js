/* Modul 2: DATA / STATE
   Menyimpan daftar tugas di memori dan di localStorage. Tidak menyentuh DOM.
   Penyimpanan disuntikkan lewat parameter, jadi mudah diganti objek palsu saat pengujian. */
(function (root) {
  'use strict';

  const V = (typeof require === 'function' && typeof module === 'object')
    ? require('./validation')
    : root.PT.validation;

  const STORAGE_KEY = 'catatan-tugas-v1';

  function createId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // Bentuk ulang dan saring data dari localStorage; data tak valid dibuang.
  function sanitizeStored(data) {
    if (!Array.isArray(data)) return [];
    return data
      .filter(t => t && typeof t === 'object'
        && typeof t.id === 'string'
        && typeof t.title === 'string'
        && V.validateTitle(t.title) === ''
        && V.COURSES.includes(t.course)
        && V.isValidISODate(t.deadline))
      .map(t => ({
        id: t.id,
        title: t.title.trim(),
        course: t.course,
        deadline: t.deadline,
        done: t.done === true
      }));
  }

  // Hitung ringkasan dari array tugas.
  function computeSummary(list) {
    const done = list.filter(t => t.done).length;
    return { total: list.length, done, open: list.length - done };
  }

  // Urutan tampil: belum selesai dulu, lalu deadline terdekat.
  function sortTasks(list) {
    return [...list].sort((a, b) =>
      Number(a.done) - Number(b.done) || a.deadline.localeCompare(b.deadline));
  }

  function createStore(storage) {
    let tasks = [];

    function save() {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      } catch (e) { /* penyimpanan penuh/diblokir: aplikasi tetap jalan di memori */ }
    }

    function load() {
      try {
        tasks = sanitizeStored(JSON.parse(storage.getItem(STORAGE_KEY)));
      } catch (e) {
        tasks = [];
      }
      return getAll();
    }

    function getAll() { return tasks.map(t => ({ ...t })); }
    function find(id) { return tasks.find(t => t.id === id); }

    function add(values) {
      tasks.push({ id: createId(), title: values.title, course: values.course,
                   deadline: values.deadline, done: false });
      save();
    }

    function toggle(id) {
      const task = find(id);
      if (task) { task.done = !task.done; save(); }
    }

    function remove(id) {
      tasks = tasks.filter(t => t.id !== id);
      save();
    }

    return { load, getAll, find, add, toggle, remove, summary: () => computeSummary(tasks) };
  }

  const api = { STORAGE_KEY, sanitizeStored, computeSummary, sortTasks, createStore };

  root.PT = root.PT || {};
  root.PT.store = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
