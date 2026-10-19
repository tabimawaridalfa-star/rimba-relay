# Rimba Relay

**[Buka layar host / demo](https://game-multiplayer-alfa.netlify.app/host.html)**

## Paket source GitHub

Paket ini memakai versi terbaru dengan musik dan kredit. Konfigurasi Firebase aktif diganti contoh pada `config.js`; isi nilai `GANTI_...` dari proyek Firebase Anda sebelum menjalankan salinan ini. `config.example.js` menyediakan salinan template. Situs yang sudah tayang tidak berubah.

Aturan `database.rules.json` menggunakan versi perbaikan terakhir dari percakapan pengembangan, tanpa `numChildren()`. Pemilik melaporkan rules berhasil dipublikasikan, tetapi koneksi game setelah penggantian rules belum terkonfirmasi. Paket ini tidak menerbitkan atau mengubah rules di Firebase.

Game dan kontrol tetap sama. Aset yang dimuat oleh preload disertakan; varian aset tambahan dan musik cadangan yang tidak dipakai dihilangkan dari paket publik.


Platformer side-scroller lokal untuk 1–4 pemain: laptop/TV sebagai host, setiap HP sebagai controller. Tiga rute orisinal: **Lembah Tunas**, **Lintasan Kabut**, dan **Puncak Pendar**. Tema petualang berkostum penjelajah memakai aset Kenney; tidak memakai karakter, rute, atau musik Nintendo/Mario.

HTML5, JavaScript ES modules, Phaser **3.90.0 / Arcade Physics**, Firebase SDK **10.14.1**, QRCode Generator **1.4.4**. Tanpa bundler atau build. Phaser, generator QR, dan SDK Firebase sudah disertakan di `vendor/`. Internet tetap diperlukan untuk autentikasi dan database meskipun semua perangkat memakai Wi-Fi yang sama.

## Mulai lokal

1. Pastikan Node.js tersedia, lalu buka terminal di folder ini.
2. Jalankan `node start-local.cjs`.
3. Buka alamat **Laptop + HP** yang dicetak server di browser laptop, contohnya `http://192.168.100.15:8080/host.html`. Alamat bisa berubah mengikuti jaringan. Jangan memakai `localhost` untuk QR yang akan dipindai HP.
4. Hubungkan dua HP ke Wi-Fi yang sama. Jika Windows meminta izin server Node, izinkan pada jaringan privat. Jika gagal terhubung, periksa firewall dan fitur isolasi perangkat Wi-Fi.
5. Scan QR di masing-masing HP, masukkan nama, lalu putar ke landscape. Host menekan **Mulai petualangan** untuk memulai sekaligus membuka audio.
6. Tekan/tahan kiri atau kanan; tekan lompat dengan jari lain. Semua fisika berjalan di host, jadi biarkan tab host aktif.

Jangan membuka HTML melalui `file://` karena modul JavaScript membutuhkan HTTP/HTTPS. Hentikan server dengan Ctrl+C. Jika port terpakai, PowerShell: `$env:PORT=8081`, lalu jalankan lagi.

## Firebase (Singapura)

Isi konfigurasi Web Firebase pada `config.js` dari Console proyek Anda. Langkah setup:

1. Buat proyek di [Firebase Console](https://console.firebase.google.com/), lalu daftarkan aplikasi Web melalui Project settings.
2. Buka **Build → Realtime Database → Create database**, pilih **Singapore / asia-southeast1**. Region dipilih saat membuat instance. Salin URL persis dari Console, biasanya `https://NAMA-DATABASE.asia-southeast1.firebasedatabase.app`. Lihat [lokasi resmi RTDB](https://firebase.google.com/docs/database/locations).
3. Buka **Authentication → Get started → Sign-in method → Anonymous → Enable**. Login anonim menyimpan identitas browser HP untuk reconnect. Lihat [panduan autentikasi anonim](https://firebase.google.com/docs/auth/web/anonymous-auth).
4. Isi `firebaseConfig` di `config.js`: `apiKey`, `authDomain`, `databaseURL`, `projectId`, `storageBucket`, `messagingSenderId`, dan `appId`. Ini konfigurasi web publik, bukan service-account key. Jangan masukkan private key ke frontend.
5. Di **Realtime Database → Rules**, salin seluruh isi `database.rules.json`, lalu **Publish**. Jangan meninggalkan database dalam test mode terbuka. Aturan ini membatasi penulisan status permainan ke host dan input ke pemilik slot. Gunakan database khusus game atau gabungkan node `rooms` dengan aturan proyek Anda yang sudah ada.
6. Jika ada pembatasan API key/domain pada proyek, izinkan origin lokal dan domain Netlify yang dipakai. Jika App Check dipaksakan, atur integrasinya pada proyek terlebih dahulu; kode ini tidak menyertakan App Check.

Aturan yang disertakan belum dipublikasikan otomatis ke Console. Pengujian koneksi memakai konfigurasi dan aturan yang sedang aktif pada proyek Anda. Sebelum penggunaan publik, terapkan aturan ini dan ulangi uji dua HP. Room lama bisa dihapus manual dari node `rooms` ketika sudah tidak dipakai.

Struktur data:

```text
rooms/KODE/
  host, createdAt, phase, level, hostOnline
  palette/0..4                     # rotasi lima warna
  slots/0..3: { uid, name, color }  # transaksi untuk mencegah slot ganda
  presence/0..3: boolean
  inputs/0..3: { left, right, jump, seq, jumpSeq }
```

Input dikirim hanya ketika tombol berubah atau perlu dinetralkan (blur, pergantian fase, reconnect). Tidak ada loop pengiriman per frame. `jumpSeq` menangkap tap pendek; `onDisconnect` menetralkan input dan presence saat server mendeteksi putus. Posisi, musuh, koin, nyawa, dan skor hanya dihitung di host. Firebase tidak mengirim posisi setiap frame karena semua pemain melihat satu layar utama.

Reconnect: buka controller dengan kode room yang sama **di browser, profil, dan origin yang sama**, lalu Gabung. UID anonim yang tersimpan mengembalikan slot dan warna; skor tetap di host. Menghapus data browser, berpindah browser, atau berpindah domain membuat identitas baru. Jangan refresh host saat bermain: progres ada di memori host dan refresh membuat room baru. Saat jaringan host putus sementara, fisika dijeda sampai tersambung kembali.

## Aturan permainan

- Lima nyawa **bersama** pada awal permainan. Nyawa tersisa dibawa ke level berikutnya.
- Koin +10, injak musuh +50, pemain pertama menyentuh bendera +100. Menyentuh bendera mengakhiri level bagi seluruh tim.
- Injak dari atas: musuh kalah dan pemain memantul. Benturan samping: satu nyawa hilang, kebal 1,6 detik. Jatuh jurang: satu nyawa hilang dan respawn.
- Nyawa habis: **Ulang level**, nyawa kembali lima dan skor kembali ke snapshot awal level, sehingga percobaan ulang tidak menggandakan skor.
- Pemain saling bertabrakan tanpa damage. Pemain di belakang kamera selama tiga detik dipindahkan ke posisi tanah aman pemain yang paling maju.
- Coyote time dan jump buffer 110 ms. Gravitasi 1350 px/s², kecepatan maksimal 235 px/s, impuls lompat 690 px/s.
- Tiga rute sepanjang 15.400–17.800 px dirancang sekitar 1–2 menit masing-masing, tergantung kecepatan tim dan kegagalan. Peringkat akhir memakai skor total; jika seri, semua pemain dengan skor tertinggi disebut juara.
- Getar dan Wake Lock dipakai bila browser mendukung. Wake Lock umumnya memerlukan HTTPS (tersedia melalui Netlify); pada HTTP LAN fungsi itu dapat tidak tersedia. Jika lock orientasi ditolak browser, controller menampilkan petunjuk rotasi.

## Deploy Netlify

Ikuti [panduan deploy Netlify](https://docs.netlify.com/deploy/create-deploys/).

- Cara manual: ekstrak ZIP, lalu upload **folder `platformer-hp`** yang langsung berisi `index.html`, `host.html`, dan `assets/` ke Netlify Drop / Deploy manually.
- Cara Git: masukkan isi folder ini ke repository. Build command kosong, publish directory `.`. `netlify.toml` sudah disediakan.
- Buka `https://NAMA-SITE.netlify.app/host.html` di laptop. QR otomatis memakai origin HTTPS tersebut; HP cukup memiliki internet.
- Setelah mengganti `config.js`, deploy ulang. Tidak ada server Node yang dibutuhkan pada Netlify.

## Struktur kode

| File | Tugas |
| --- | --- |
| `host.html`, `host.js` | Lobi, kode & QR, mulai, HUD, hasil, main lagi |
| `controller.html`, `controller.js` | Form join, multitouch Pointer Events, getar, Wake Lock |
| `network.js` | Auth anonim, transaksi room/slot, input berubah, presence |
| `game.js` | Load aset, dunia Phaser, kamera kelompok, skor dan flow level |
| `player.js` | Percepatan, gesekan, lompat, coyote/buffer, kebal dan respawn |
| `enemies.js` | Animasi dan patroli musuh kiri–kanan |
| `levels/level1.js` … `level3.js` | Array tanah, platform, baris koin, objek musuh dan bendera |
| `ui.js`, `styles.css` | Komponen UI dan tata letak |
| `config.js`, `database.rules.json` | Pengaturan dan aturan akses Firebase |
| `start-local.cjs` | Server statis untuk tes LAN tanpa dependensi |

Untuk menambah level, buat modul baru mengikuti bentuk level yang ada, lalu impor dan tambahkan ke array `levels` di `game.js`. Sesuaikan jumlah level di flow host dan validasi `level` pada rules. Tanah atas berada di y=520; platform menggunakan titik tengah tile. Uji celah dan tinggi platform terhadap kemampuan lompat, jangan hanya mengandalkan penampilan.

## Aset dan lisensi

Seluruh sprite dan efek suara berasal dari **Kenney New Platformer Pack 1.0 (1 Mei 2025), CC0**, sesuai `assets/License.txt` asli yang disertakan. Tidak ada sprite yang digambar sendiri. Musik disediakan pemilik proyek. [Kenney](https://kenney.nl/) · [CC0](https://creativecommons.org/publicdomain/zero/1.0/).

Daftar aset yang dimuat:

- `Sprites/Characters/Default/character_{beige,green,pink,purple,yellow}_{idle,walk_a,walk_b,jump,duck,hit,climb_a,climb_b}.png`. Idle/walk/jump/hit dipakai dalam permainan; duck/climb disiapkan sebagai pose aset, tanpa menambah tombol atau mekanik baru. Setiap room memakai empat dari lima warna dengan rotasi acak.
- `Sprites/Enemies/Default/`: `slime_normal_walk_a/b`, `snail_walk_a/b`, `bee_a/b`, `fly_a/b`, `frog_idle`, `frog_jump`, `ladybug_walk_a/b`, `mouse_walk_a/b`, `saw_a/b`, `worm_normal_move_a/b` (semua `.png`). Seluruh jenis mengikuti patroli horizontal; jenis terbang/saw tidak dipengaruhi gravitasi.
- `Sprites/Tiles/Default/`: `terrain_{grass,sand,purple}_block_{top,center}`, `block_plank`, `coin_gold`, `flag_green_a/b`, `bush`, `grass`, `mushroom_red`, `sign_right` (semua `.png`).
- `Sprites/Backgrounds/Default/background_color_{hills,desert,mushrooms}.png`.
- `Sounds/sfx_{jump,jump-high,coin,gem,hurt,bump,disappear,magic,select,throw}.ogg`. Semua disiapkan; gameplay memakai jump, coin, hurt, bump, disappear, magic. Efek lainnya tersedia tanpa mekanik tambahan.
- Hanya aset runtime yang dimuat kode serta lisensinya yang disertakan dalam paket repository ini.

Musik memakai `assets/music/tema.ogg` sesuai `musicPath` di `config.js`. File `tema-cadangan.ogg` hanya cadangan dan tidak dimuat. Musik mulai setelah klik **Mulai petualangan**, loop pada volume 22%, memakai satu instance selama pergantian level dan game over, lalu berhenti pada ending. **Main Lagi** kembali ke lobi; musik baru mulai kembali setelah **Mulai petualangan** diklik. Tombol **Musik: nyala/mati** hanya membisukan musik, bukan efek suara; pilihan tetap berlaku selama halaman host terbuka.

Library pihak ketiga: Phaser (MIT), QRCode Generator (MIT), Firebase JS SDK (Apache-2.0). Teks lisensi vendor lokal berada di `vendor/`. UI memakai font yang tersedia pada sistem tanpa unduhan font eksternal.

## Pemeriksaan dua HP

1. Kedua HP masuk bersamaan: nama dan warna harus berbeda di lobi.
2. Tahan kanan di keduanya. Tambahkan jari pada lompat: keduanya harus bergerak dan melompat sekaligus.
3. Lepaskan tombol, pindahkan tab, lalu kembali: tidak boleh ada arah yang tersangkut.
4. Reload satu controller dan gabung lagi: warna/karakter lama kembali tanpa slot baru.
5. Kumpulkan koin, injak musuh, bentur samping, jatuh jurang; cocokkan perubahan skor dan nyawa.
6. Tinggalkan satu pemain di belakang layar: ia muncul dekat rekan setelah tiga detik.
7. Habis nyawa → Ulang level; tiga bendera → ending dan Main Lagi.

Hasil pengujian otomatis dan batas verifikasi tersedia di `TEST-RESULTS.md`.


## Pembuat dan Kredit

Game dibuat oleh **Alfa Tabi Mawarid**.

- Aset grafis dan efek suara: **Kenney (kenney.nl)**, lisensi **CC0**.
- Musik: **"bgm_space_upbeat_F"** dari paket **400 Indie Game Music Loops** oleh **Subspace Audio**, lisensi **CC0**. File aktif: `assets/music/tema.ogg`; file cadangan tidak dipakai.

## Proses pengembangan

Konsep dan arahan fitur oleh Alfa Tabi Mawarid, dengan implementasi dan iterasi berbantuan AI. Kenney serta Subspace Audio dikreditkan untuk aset masing-masing. Paket ini tidak menetapkan lisensi baru untuk kode proyek; lisensi vendor dan aset tetap disertakan.

## Pemeriksaan paket publik

Sintaks source, JSON rules, referensi modul lokal, dan seluruh aset yang dimuat preload diperiksa pada pengemasan. Ini pemeriksaan lokal tanpa login atau perubahan data Firebase. Riwayat uji jaringan serta batas musik/mute tercatat pada TEST-RESULTS.md; tidak diklaim sebagai uji ulang dua HP fisik.
