# Pencatat Tugas Kuliah

Tugas I 11S3133 Pengembangan Aplikasi Berbasis Web

- Nama: Joyce Stephanie Naibaho
- NIM: 11S24047

Aplikasi web sederhana untuk mencatat tugas kuliah, ditulis dengan JavaScript murni
(tanpa framework) dan dikembangkan dengan bantuan AI generatif (Claude).
`index.html` hanya berisi kerangka kosong; seluruh tampilan dan logika dibuat oleh JavaScript.

## Fitur
- Tambah tugas (judul, mata kuliah, deadline) dengan validasi
- Tandai tugas selesai dan hapus tugas
- Ringkasan jumlah tugas, data tersimpan di localStorage

## Struktur
```
index.html          kerangka halaman (hanya <div id="app"> dan tag script)
css/style.css       gaya tampilan
js/validation.js    modul 1: aturan validasi (fungsi murni)
js/store.js         modul 2: data tugas dan penyimpanan localStorage
js/view.js          modul 3: membangun dan memperbarui DOM
js/app.js           modul 4: event handler yang menghubungkan ketiganya
tests/test.js       pengujian otomatis (6 uji unit + 8 uji antarmuka)
```

## Menjalankan
Buka folder proyek dengan Live Server (VS Code) atau server statis lain,
lalu buka `index.html`.

## Pengujian
Membutuhkan Node.js.

```
npm install
npm test
```

## Catatan penggunaan AI
Alat: Claude. Riwayat commit menunjukkan draf awal, temuan pengujian, dan perbaikannya.
Dokumen proposal lengkap dikumpulkan melalui e-course.
