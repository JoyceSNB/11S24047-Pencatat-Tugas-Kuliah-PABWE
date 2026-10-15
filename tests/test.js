// Tugas I 11S3133 PABWE | Joyce Stephanie Naibaho | 11S24047
// Pengujian Catatan Tugas Kuliah. Jalankan: npm test
//   U1-U6 : uji unit modul JavaScript (validation.js dan store.js) langsung di Node
//   T1-T8 : uji antarmuka, memuat index.html beserta semua file js/ di jsdom
process.env.TZ = 'Asia/Jakarta'; // simulasi zona waktu WIB agar hasil sama di semua komputer
const { JSDOM } = require('jsdom');
const path = require('path');
const V = require('../js/validation');
const S = require('../js/store');

const FAKE = '2026-10-13T20:00:00Z'; // = 14 Okt 2026 03:00 WIB
const MK = 'Kecerdasan Buatan';

async function muat(file) {
  const dom = await JSDOM.fromFile(path.join(__dirname, '..', file), {
    runScripts: 'dangerously',
    resources: 'usable', // memuat css/ dan js/ yang dirujuk index.html
    beforeParse(w) {
      const Asli = w.Date;
      w.Date = class extends Asli {
        constructor(...a) { a.length ? super(...a) : super(FAKE); }
        static now() { return new Asli(FAKE).getTime(); }
      };
    },
  });
  if (dom.window.document.readyState !== 'complete') {
    await new Promise(r => dom.window.addEventListener('load', r));
  }
  return dom;
}

function isi(dom, judul, matkul, deadline) {
  const d = dom.window.document;
  d.getElementById('title').value = judul;
  d.getElementById('course').value = matkul;
  d.getElementById('deadline').value = deadline;
  d.getElementById('task-form').dispatchEvent(
    new dom.window.Event('submit', { bubbles: true, cancelable: true }));
}

function storagePalsu(awal) {
  const data = new Map(awal ? [[S.STORAGE_KEY, awal]] : []);
  return { getItem: k => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, v) };
}

(async () => {
  const berkas = process.argv[2] || 'index.html';
  const hasil = [];
  const cek = (n, ok) => hasil.push([ok ? 'LULUS' : 'GAGAL', n]);
  const baru = async () => { const dom = await muat(berkas); return [dom, dom.window.document]; };
  let dom, d;

  // ---------- Uji unit ----------
  cek('U1 judul: kurang dari 3 karakter ditolak, 3 karakter diterima',
    V.validateTitle('ab') !== '' && V.validateTitle('abc') === '' && V.validateTitle('   x  ') !== '');
  cek('U2 tanggal 2026-02-31 ditolak, 2028-02-29 diterima',
    !V.isValidISODate('2026-02-31') && V.isValidISODate('2028-02-29'));
  cek('U3 deadline hari ini diterima, kemarin ditolak',
    V.validateDeadline('2026-10-14', '2026-10-14') === '' && V.validateDeadline('2026-10-13', '2026-10-14') !== '');
  cek('U4 data localStorage rusak disaring',
    S.sanitizeStored([{ id: 'a', title: 'Valid', course: MK, deadline: '2026-10-20', done: true },
      { id: 'b', title: 'x', course: MK, deadline: '2026-10-20' },
      { id: 'c', title: 'Matkul palsu', course: 'XYZ', deadline: '2026-10-20' },
      null, 'bukan objek']).length === 1 && S.sanitizeStored('bukan array').length === 0);
  const urut = S.sortTasks([
    { title: 'a', deadline: '2026-10-30', done: true },
    { title: 'b', deadline: '2026-10-25', done: false },
    { title: 'c', deadline: '2026-10-20', done: false }]).map(t => t.title).join('');
  cek('U5 urutan: belum selesai dulu, lalu deadline terdekat', urut === 'cba');
  const st = storagePalsu(); const toko = S.createStore(st);
  toko.add({ title: 'Laporan', course: MK, deadline: '2026-10-20' });
  const id = toko.getAll()[0].id;
  toko.toggle(id);
  const toko2 = S.createStore(st); toko2.load();
  const pulih = toko2.getAll();
  toko2.remove(id);
  cek('U6 data tersimpan, dimuat ulang, lalu dihapus',
    pulih.length === 1 && pulih[0].done === true && toko2.getAll().length === 0);

  // ---------- Uji antarmuka ----------
  [dom, d] = await baru(); isi(dom, 'Laporan Praktikum', MK, '2026-10-20');
  cek('T1 input valid ditambahkan', d.querySelectorAll('#task-list li').length === 1);

  [dom, d] = await baru(); isi(dom, '   ', MK, '2026-10-20');
  cek('T2 judul hanya spasi ditolak', d.querySelectorAll('#task-list li').length === 0);

  [dom, d] = await baru(); isi(dom, '<img src=x onerror=alert(1)>', MK, '2026-10-20');
  cek('T3 HTML pada judul tidak menjadi elemen',
    d.querySelector('#task-list img') === null && d.querySelectorAll('#task-list li').length === 1);

  [dom, d] = await baru(); isi(dom, 'Tugas Lama', MK, '2026-10-13');
  cek('T4 deadline kemarin (zona WIB) ditolak', d.querySelectorAll('#task-list li').length === 0);

  [dom, d] = await baru(); isi(dom, 'Tugas Tanpa Tanggal', MK, '');
  cek('T5 deadline kosong ditolak', /wajib/.test(d.getElementById('deadline-error').textContent));

  [dom, d] = await baru(); isi(dom, 'Tugas Hapus', MK, '2026-10-20');
  d.querySelector('#task-list .btn-delete').click();
  cek('T6 tombol Hapus menghapus item', d.querySelectorAll('#task-list li').length === 0);

  [dom, d] = await baru(); isi(dom, 'Tanpa Matkul', '', '2026-10-20');
  cek('T7 mata kuliah belum dipilih ditolak',
    d.querySelectorAll('#task-list li').length === 0 && /Pilih/.test(d.getElementById('course-error').textContent));

  [dom, d] = await baru(); isi(dom, 'Tugas Centang', MK, '2026-10-20');
  const cb = d.querySelector('#task-list input[type=checkbox]'); cb.checked = true;
  cb.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  cek('T8 centang memperbarui ringkasan',
    d.getElementById('sum-done').textContent === '1' && d.getElementById('sum-open').textContent === '0');

  console.log('\n== ' + berkas);
  hasil.forEach(([s, n]) => console.log(s.padEnd(6), n));
  if (hasil.some(([s]) => s === 'GAGAL')) process.exitCode = 1;
})();
