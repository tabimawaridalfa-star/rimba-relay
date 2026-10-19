# Pembaruan musik dan kredit — 19 Oktober 2026

Proyek: Rimba-Relay-musik/platformer-hp. Maksimal dua putaran pengujian dipatuhi; tidak dilakukan putaran ketiga.

## Perubahan

- Musik aktif hanya assets/music/tema.ogg; tema-cadangan.ogg tidak direferensikan oleh kode runtime.
- Satu instance musik pada SoundManager global, loop true dan volume 0.22. Pergantian level/retry memakai kembali instance tersebut. Ending menghentikan musik langsung sebelum menunggu Firebase. Mulai setelah Main Lagi memutar instance yang sama kembali.
- Tombol Musik: nyala/mati membisukan instance musik saja, tanpa mengubah mute SoundManager/efek suara.
- Pilihan mute diterapkan sesudah play(), karena play() dapat memulihkan konfigurasi awal. Perbaikan urutan ini dilakukan setelah putaran kedua dan tidak diuji ulang sesuai batas pengguna.
- Judul index, host, controller; kredit pembuat di lobi dan join; kredit lengkap di ending dan README.
- Seluruh config.js (termasuk firebaseConfig dan musicPath) serta database.rules.json identik byte demi byte dengan sebelum pengerjaan, diverifikasi SHA-256.

## Putaran 1

Server lokal port 8082, Edge/Chromium headless, dua konteks browser mobile terpisah memakai Firebase sungguhan. Judul/kredit awal dan join dua pemain lulus. Musik terdeteksi playing=true, loop=true, satu instance, audio context running. Pemeriksaan volume gagal karena perbandingan angka persis: Web Audio mengembalikan 0.2199999988079071 alih-alih 0.22. Toleransi pemeriksaan diperbaiki menjadi 0.000001.

## Putaran 2 (terakhir)

Lulus:
- Judul ketiga HTML dan kredit pembuat pada lobi/join.
- Dua controller browser mobile bergabung melalui Firebase.
- Setelah klik Mulai: satu musik aktif, loop true, volume mendekati 0.22, AudioContext running.
- Analyser Web Audio mendeteksi sinyal nonnol pada jalur musik (peak sekitar 1.0118 sebelum node volume). Ini verifikasi sinyal digital, bukan konfirmasi suara speaker secara langsung.
- Kredit join tidak tampil saat controller bermain.

Belum lulus / belum terverifikasi:
- Setelah klik tombol musik, pembacaan langsung properti mute masih false sehingga assertion berhenti. Kemungkinan jeda penerapan AudioParam belum dibuktikan; fungsi tombol tidak dinyatakan lulus berdasarkan pemeriksaan ini.
- Pemeriksaan efek suara saat mute, multitouch, game over/retry, transisi level 1–3, ending, dan Main Lagi tidak sempat dijalankan pada putaran terakhir karena tes berhenti pada assertion tersebut.
- Kode untuk tidak menumpuk musik, berhenti pada ending, serta kredit ending sudah dipasang dan diperiksa secara statis, tetapi belum terverifikasi lewat alur permainan pada pembaruan ini.
- HP fisik, speaker fisik, dan deployment Netlify tidak diuji.

Tidak ada perubahan aturan/database Firebase melalui Console. Pengujian memakai aturan yang sudah aktif. ZIP merupakan paket sumber siap diunggah ke Netlify, bukan klaim seluruh pemeriksaan runtime sudah lulus.

---

## Arsip pengujian versi sebelumnya (sebelum pembaruan musik/kredit)

# Hasil pengujian — 19 Oktober 2026

## Lingkungan

- Server HTTP lokal pada laptop Windows.
- Microsoft Edge/Chromium headless: host 1440×1000, controller mobile landscape 900×420 dengan dukungan touch.
- Dua konteks browser terisolasi untuk dua pemain, lalu diperluas menjadi empat dan satu percobaan pemain kelima.
- **Firebase Authentication dan Realtime Database sungguhan** dari `config.js`, bukan mock jaringan. Anonymous Authentication diaktifkan oleh pemilik proyek selama pengerjaan.

## Lulus

- Room empat huruf, link QR controller, dua pemain masuk dan mendapat warna unik.
- Input kedua controller sampai ke host dan menggerakkan dua karakter.
- Tahan kanan tidak menambah nomor urutan input selama status tombol tetap sama.
- Dua titik sentuh nyata melalui protokol browser: kanan + lompat bersamaan pada kedua controller menghasilkan lompatan sambil bergerak.
- Reload controller dan Gabung kembali mempertahankan karakter tanpa menambah slot.
- Koin menambah skor; injak musuh mengalahkan musuh.
- Damage mengurangi nyawa bersama; hit berikutnya selama kebal tidak mengurangi lagi.
- Pemain tertinggal kembali dekat pemain terdepan setelah tiga detik.
- Game over dan ulang level yang sama dengan lima nyawa.
- Menyentuh bendera memicu ringkasan level, transisi level 1 → 2 → 3, ending, dan Main Lagi.
- Empat pemain diterima, pemain kelima mendapatkan pesan room penuh.
- Main Lagi dapat memulai ulang dengan empat pemain.
- Coyote time dan jump buffer diuji pada logika fisika pemain.
- Celah terlebar 210 px dilompati dengan fisika normal dan mendarat: x≈6728,76; y=479,7; grounded=true.
- Platform tinggi di level 3 dapat dicapai dari titik ancang-ancang: x≈1743,26; y=317,7; grounded=true.
- Sintaks modul JavaScript dan JSON diperiksa. Sprite dan suara yang digunakan berhasil dimuat saat pengujian browser.

Untuk pengujian skor, musuh, respawn, dan bendera, harness pengujian memposisikan aktor agar callback fisika dapat diuji secara deterministik. Perpindahan antarlevel bukan hasil playthrough manusia penuh. Pengujian celah/platform memakai lompatan fisika normal setelah penempatan pada titik awal.

## Batas verifikasi

- **Belum ada konfirmasi uji pada dua HP fisik.** Sesi mobile di atas adalah emulasi browser terpisah. Getar, Wake Lock, rotasi otomatis, dan latensi jaringan HP perlu diperiksa pada perangkat Anda.
- Tidak ada musik latar yang ditambahkan; slot musik opsional disediakan.
- `database.rules.json` disertakan dan valid sebagai JSON, tetapi belum dipublikasikan/diuji terhadap aturan tersebut di Firebase Console. Uji jaringan menggunakan aturan proyek yang sedang aktif. Terapkan rules dan ulangi checklist README sebelum publikasi.
- File siap deploy Netlify; belum dipublikasikan ke akun Netlify.
- Durasi 1–2 menit per level merupakan target berdasarkan panjang rute dan kecepatan gerak, belum pengukuran playthrough manusia.

## Pengemasan repository — 19 Oktober 2026

Konfigurasi publik memakai template. Rules disalin dari database.rules.fixed.json terbaru. Sintaks dan semua aset preload diperiksa tanpa mengakses database produksi. Pelaporan rules berhasil Publish berasal dari percakapan pengguna; pengujian alur baru sesudah rules belum dikonfirmasi. Catatan historis di atas tetap menunjukkan keadaan saat pengujian, bukan status deploy saat ini.
