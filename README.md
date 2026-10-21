# Rimba Relay

**[Demo / layar host](https://game-multiplayer-alfa.netlify.app/host.html)** · **[Repository](https://github.com/tabimawaridalfa-star/rimba-relay)**

## Paket source publik — 21 Oktober 2026

Source diambil dari versi Rimba-Relay-polish. Konfigurasi Firebase aktif diganti template di `config.js` dan `config.example.js`. Isi nilai GANTI_... menggunakan konfigurasi Web Firebase milik sendiri sebelum menjalankan salinan ini. Versi Netlify yang sudah tayang tidak diubah.

Rules mengikuti versi terbaru dalam paket polish, termasuk commands pemimpin dan paused; bukan rules awal proyek. Tidak ada aturan yang dipublikasikan otomatis oleh paket ini.

Aset yang dipakai kode disertakan; varian aset lain yang tidak dimuat tidak ikut dipaketkan. Musik cadangan kini dipakai di level 3 dan disertakan.

**Status pengujian pengembangan: 78/80 assertion lulus dalam dua putaran.** Dua assertion terkait jumlah tulisan input dan gabungan mute/efek belum lulus; lihat TEST-RESULTS.md. Pengemasan GitHub ini memeriksa sintaks dan kelengkapan lokal, tanpa menjalankan ulang sesi Firebase atau menambah putaran pengujian gameplay.


Platformer side-scroller lokal untuk 1–4 pemain: laptop/TV sebagai host, setiap HP sebagai controller. Tiga rute orisinal: **Lembah Tunas**, **Lintasan Kabut**, dan **Puncak Pendar**. Tema petualang berkostum penjelajah memakai aset Kenney; tidak memakai karakter, rute, atau musik Nintendo/Mario.

HTML5, JavaScript ES modules, Phaser **3.90.0 / Arcade Physics**, Firebase SDK **10.14.1**, QRCode Generator **1.4.4**. Tanpa bundler atau build. Phaser, generator QR, dan SDK Firebase sudah disertakan di `vendor/`. Internet tetap diperlukan untuk autentikasi dan database meskipun semua perangkat memakai Wi-Fi yang sama.

## Mulai lokal

1. Pastikan Node.js tersedia, lalu buka terminal di folder ini.
2. Jalankan `node start-local.cjs`.
3. Buka alamat **Laptop + HP** yang dicetak server di browser laptop, contohnya `http://192.168.100.15:8080/host.html`. Alamat bisa berubah mengikuti jaringan. Jangan memakai `localhost` untuk QR yang akan dipindai HP.
4. Hubungkan dua HP ke Wi-Fi yang sama. Jika Windows meminta izin server Node, izinkan pada jaringan privat. Jika gagal terhubung, periksa firewall dan fitur isolasi perangkat Wi-Fi.
5. Scan QR di masing-masing HP, masukkan nama, lalu putar ke landscape. Klik **Siapkan layar** sekali di laptop untuk fullscreen dan audio. Pemain online dengan slot terkecil menjadi pemimpin dan menekan **MULAI** di HP.
6. Tekan/tahan kiri atau kanan; tekan lompat dengan jari lain. Semua fisika berjalan di host, jadi biarkan tab host aktif.

Jangan membuka HTML melalui `file://` karena modul JavaScript membutuhkan HTTP/HTTPS. Hentikan server dengan Ctrl+C. Jika port terpakai, PowerShell: `$env:PORT=8081`, lalu jalankan lagi.

## Firebase (Singapura)

Konfigurasi dalam repository berupa contoh. Isi `config.js` dari proyek Firebase Anda:

1. Buat proyek di [Firebase Console](https://console.firebase.google.com/), lalu daftarkan aplikasi Web melalui Project settings.
2. Buka **Build → Realtime Database → Create database**, pilih **Singapore / asia-southeast1**. Region dipilih saat membuat instance. Salin URL persis dari Console, biasanya `https://NAMA-DATABASE.asia-southeast1.firebasedatabase.app`. Lihat [lokasi resmi RTDB](https://firebase.google.com/docs/database/locations).
3. Buka **Authentication → Get started → Sign-in method → Anonymous → Enable**. Login anonim menyimpan identitas browser HP untuk reconnect. Lihat [panduan autentikasi anonim](https://firebase.google.com/docs/auth/web/anonymous-auth).
4. Isi `firebaseConfig` di `config.js`: `apiKey`, `authDomain`, `databaseURL`, `projectId`, `storageBucket`, `messagingSenderId`, dan `appId`. Ini konfigurasi web publik, bukan service-account key. Jangan masukkan private key ke frontend.
5. Aturan database: file `database.rules.json` di folder ini sama dengan aturan yang sudah dipublikasikan di Firebase Console (termasuk fase `paused` dan node `commands`) dan sudah diuji pada 21 Oktober 2026. Jangan meninggalkan database dalam test mode terbuka. Aturan ini membatasi penulisan status permainan ke host dan input ke pemilik slot. Gunakan database khusus game, atau gabungkan node `rooms` dengan aturan proyek Anda yang sudah ada.
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
  commands/0..3: { action, seq }
```

Input dikirim hanya ketika tombol berubah atau perlu dinetralkan (blur, pergantian fase, reconnect). Tidak ada loop pengiriman per frame. `jumpSeq` menangkap tap pendek; `onDisconnect` menetralkan input dan presence saat server mendeteksi putus. Posisi, musuh, koin, nyawa, dan skor hanya dihitung di host. Firebase tidak mengirim posisi setiap frame karena semua pemain melihat satu layar utama.

Reconnect: buka controller dengan kode room yang sama **di browser, profil, dan origin yang sama**, lalu Gabung. UID anonim yang tersimpan mengembalikan slot dan warna; skor tetap di host. Menghapus data browser, berpindah browser, atau berpindah domain membuat identitas baru. Jangan refresh host saat bermain: progres ada di memori host dan refresh membuat room baru. Saat jaringan host putus sementara, fisika dijeda sampai tersambung kembali.

## Aturan permainan

- Nyawa awal/maksimum bersama = **4 + jumlah pemain yang sudah masuk saat Mulai**: 5/6/7/8 untuk 1/2/3/4 pemain. Dihitung sekali dari slot lobi (termasuk yang sedang offline), tetap selama sesi dan antarlevel. Main Lagi kembali ke lobi; Mulai berikutnya menghitung ulang.
- Koin +10, injak musuh +50, pemain pertama menyentuh bendera +100. Menyentuh bendera mengakhiri level bagi seluruh tim.
- Injak dari atas: musuh kalah dan pemain memantul. Benturan samping: satu nyawa hilang, kebal 1,6 detik. Jatuh jurang: satu nyawa hilang dan respawn.
- Nyawa habis: **Ulang level** memulihkan nyawa awal dan skor snapshot checkpoint terakhir. Jika belum ada checkpoint, mulai dari awal level dengan skor awal level. Koin, kotak dan musuh di kiri checkpoint tidak dibuat lagi; sisi kanan kembali ke keadaan awal.
- Pemain saling bertabrakan tanpa damage. Pemain di belakang kamera selama tiga detik dipindahkan ke posisi tanah aman pemain yang paling maju.
- Coyote time dan jump buffer 110 ms. Gravitasi 1350 px/s², kecepatan maksimal 293,75 px/s, impuls lompat 690 px/s.
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
- `Sprites/Enemies/Default/`: `slime_normal_walk_a/b`, `snail_walk_a/b`, `bee_a/b`, `fly_a/b`, `frog_idle`, `frog_jump`, `ladybug_walk_a/b`, `mouse_walk_a/b`, `saw_a/b`, `worm_normal_move_a/b` (semua `.png`). Kecepatan patroli dasar tetap; musuh darat menghindari tepi dan dinding, siput menjadi cangkang, dan katak dapat melompat menuju pemain. Jenis terbang/saw tidak dipengaruhi gravitasi.
- `Sprites/Tiles/Default/`: `terrain_{grass,sand,purple}_block_{top,center}`, `block_plank`, `coin_gold`, `flag_green_a/b`, `bush`, `grass`, `mushroom_red`, `sign_right` (semua `.png`).
- `Sprites/Backgrounds/Default/background_color_{hills,desert,mushrooms}.png`.
- `Sounds/sfx_{jump,jump-high,coin,gem,hurt,bump,disappear,magic,select,throw}.ogg`. Semua disiapkan; gameplay memakai jump, coin, hurt, bump, disappear, magic. Efek lainnya tersedia tanpa mekanik tambahan.
- Paket GitHub menyertakan aset yang dimuat kode beserta lisensinya.

Musik level 1–2 memakai `assets/music/tema.ogg`; level 3 memakai `assets/music/tema-cadangan.ogg`. Pemetaan ada di `audio.js`; `musicPath` di config.js tetap sebagai fallback. Musik loop dengan satu instance, berhenti di ending dan lobi, serta dijeda bersama permainan. Volume awal musik 22% dan efek 35%. Panel **Suara** menyimpan kedua volume di localStorage dengan fallback aman jika storage tidak tersedia. Tombol **Musik: nyala/mati** hanya membisukan musik.

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
- Musik: **"bgm_space_upbeat_F"** (level 1–2) dan **"bgm_stage_F__faster_"** (level 3), paket **400 Indie Game Music Loops** oleh **Subspace Audio**, lisensi **CC0**. Berkas asal dan konversi tercatat di `assets/music/CREDITS.md`.


## Pembaruan layar dan gerak (20 Oktober 2026)

- HUD memakai ikon hati Kenney penuh/kosong sesuai maksimum nyawa sesi, dengan animasi kehilangan nyawa.
- Kecepatan 293,75 px/s (+25%), percepatan 1937,5 px/s², drag 1812,5 px/s². Tahan lompat mempertahankan impuls 690 px/s; melepas saat naik membatasi kecepatan ke 340 px/s. Coyote dan buffer tetap 110 ms. Pantulan musuh tidak dipotong oleh pelepasan tombol.
- Kamera memakai waktu penghalusan 128 ms; kecepatan musuh tidak diubah karena rute patrolinya tetap sama.
- Klik **Siapkan layar** di lobi untuk meminta fullscreen dan membuka audio dalam satu gesture. Tombol pojok bisa keluar/masuk fullscreen; alternatif F11. Mulai tetap dapat membuka audio bila persiapan dilewati.
- Saat bermain, HUD memakai 64 px dan canvas memenuhi sisa jendela dengan rasio 16:9 (letterbox bila diperlukan), tanpa pemotongan.
- Gabung controller meminta fullscreen sebelum menunggu Firebase, lalu landscape bila didukung. Browser yang menolak menampilkan petunjuk **Tambahkan ke Layar Utama untuk layar penuh**. Manifest dan meta Apple tersedia; ini tidak menambahkan mode offline/service worker.
- Controller memakai safe-area dan 100dvh. Notch fisik, Safari iPhone, dan fullscreen perangkat nyata tetap perlu diperiksa langsung.


## Remote HP tahap 2

Pemimpin dihitung lokal dari slot bernomor terkecil dengan presence tepat true; otomatis berpindah setelah Firebase mendeteksi pemain offline. Tidak ada field leader baru. Pemain lain melihat nama pemimpin. Tombol host tetap menjadi cadangan.

| Fase | Tombol pemimpin |
| --- | --- |
| lobby | MULAI |
| playing | JEDA |
| paused | LANJUT, ULANG LEVEL, KE LOBI |
| between | LANJUT |
| gameover | ULANG LEVEL |
| ending | MAIN LAGI (kembali ke lobi) |

D-pad kiri/kanan dan tombol A untuk lompat mendukung multitouch. Saat paused, scene Phaser (fisika, animasi musuh, timer) dan audio dijeda; input dinetralkan, lalu lanjut dari posisi yang sama. Ulang level memulihkan nyawa awal sesi dan skor checkpoint terakhir (atau skor awal level jika belum ada checkpoint). Ke lobi mengakhiri sesi permainan saat ini; MULAI berikutnya mereset skor.

Controller menulis commands pada slot sendiri dengan transaksi seq meningkat, termasuk setelah reload. Host mengonsumsi seq baru, memeriksa pemimpin dan fase, lalu memanggil fungsi aksi yang sama dengan tombol host. Perintah lama/tidak valid/non-pemimpin tidak dijalankan ulang saat keadaan berubah. Jangan menutup tab host; laptop tetap menghitung game.

Klik Siapkan layar sebelum bermain. Bila dilewati, MULAI dari HP tetap bekerja; pengingat host dapat diklik untuk audio dan fullscreen. Browser tidak mengizinkan HP memberikan izin fullscreen/audio untuk laptop.

Aturan tahap 2 telah dipublikasikan pemilik dan diuji pada Firebase asli pada 21 Oktober 2026. Satu putaran selesai: 21/21 pemeriksaan lolos dengan host dan empat sesi controller terpisah, plus satu sesi kelima untuk uji penolakan room penuh. Lihat TEST-RESULTS.md untuk bukti penolakan lintas slot dan batas pengujian. Agen tidak mengubah atau menerbitkan aturan pada pengujian ini.


## Kotak misteri, buff, dan interaksi musuh

Empat kotak solid per level; sisi bawah berada 138 px di atas tanah. Sundul dari bawah ketika naik: kotak berubah kosong sekali, lalu satu item acak keluar dari atas dan bergeser ke samping hingga turun. Kotak direset saat level diulang.

- Hati: +1 nyawa bersama, dibatasi nyawa maksimum sesi.
- Bintang: kebal terhadap benturan musuh selama 6 detik; menyentuh musuh mengalahkannya dan memberi +50. Jurang tetap menyebabkan respawn dan kehilangan nyawa.
- Super Mushroom (jamur merah): ukuran karakter dan tubuh tumbukan menjadi 1,4×, tanpa mengubah kecepatan/tinggi lompat. Satu benturan musuh mengembalikan ukuran kecil tanpa mengurangi nyawa dan memberi kebal singkat. Jurang tetap mengurangi nyawa dan mengembalikan ukuran kecil. Besar berakhir saat ganti/ulang level, tanpa batas waktu. Jamur berulang tidak menambah ukuran.
- Permata biru: +100 skor pemain yang mengambilnya.

Bintang dan jamur berlaku per pemain. Bintang berulang memperbarui durasi; HUD menampilkan detik bintang atau status Besar untuk Super Mushroom. Pembesaran menunggu ruang cukup jika terhalang plafon/dinding, dengan status Menunggu ruang. Posisi kaki dijaga saat ukuran berubah. Semua status dihitung di host, tanpa menulis data Firebase.

Musuh darat berbalik di dinding, tepi tanah/platform, dan saat bertabrakan dengan musuh lain. Siput yang diinjak berubah menjadi cangkang diam (belum dihitung kalah). Sentuh sisi/injak cangkang diam untuk menendangnya menjauh; cangkang melaju 300 px/s dan memberikan +50 kepada penendang untuk setiap musuh yang dikalahkan. Injak cangkang bergulir untuk menghentikannya; terkena sisinya melukai pemain. Katak dalam jarak 250 px melompat ke arah pemain terdekat dengan cooldown 1,5 detik, tanpa menaikkan kecepatan patroli dasarnya.

Modul baru buffs.js mengatur kotak/item. Aset Kenney CC0 tambahan yang dimuat: Tiles/Default/block_exclamation.png, block_empty.png, heart.png, star.png, gem_blue.png serta Enemies/Default/snail_shell.png. mushroom_red.png dipakai ulang. Semua tersedia di assets; tanpa unduhan aset baru. Suara bump, gem, magic, jump-high, throw memakai berkas Sounds yang sudah ada.

Pemimpin dapat memulai, menjeda, melanjutkan, mengulang level dan kembali ke lobi dari HP. Tombol host tetap menjadi cadangan. Dalam uji jaringan, timer, fisika, musuh, buff dan musik membeku selama paused, lalu dilanjutkan; pergantian pemimpin mengikuti presence dan reconnect memulihkan slot/UID yang sama.


## Hati di langit dan Super Mushroom
Hati Kenney sejumlah nyawa maksimum sesi tampil langsung di langit tanpa panel/latar, 24 px dari sudut kiri atas canvas, masing-masing 32 px. Posisi tetap mengikuti layar saat kamera bergerak dan saat jendela berubah ukuran. Animasi kehilangan nyawa tetap berlaku. Tujuh atau delapan hati disusun dua baris (empat kolom). Efek jamur super lompat lama sudah diganti Super Mushroom sesuai aturan di atas.


## Checkpoint dan rintangan berbasis level

Level 1 dan 2 mempunyai dua checkpoint; level 3 mempunyai tiga, termasuk satu sebelum saklar pada jalur akhir. Menyentuh dengan pemain mana pun mengaktifkan checkpoint, merekam skor tim di memori host, mengubah bendera dari flag_off ke flag_green_a, dan memainkan select. Checkpoint hanya maju, tidak mundur. Ganti level menghapus checkpoint lama. Saat retry dari checkpoint, pemain mendapat kebal singkat agar sempat bergerak.

Array terpisah di levels/level1.js, level2.js, level3.js:

| Array | Bentuk objek dan arti |
|---|---|
| checkpoints | {x,y,spawnY?}: posisi bendera; spawn ulang dekat x, default tinggi spawn 440 |
| spikes | {x,y,count}: awal kelompok paku 1–3 tile; jarak tile 64 px |
| springs | {x,y}: pegas; pantulan -1000,5 px/s (1,45× impuls normal) |
| saws | {x,y,axis,length,speed}: pusat jalur, axis x/y, panjang total lintasan px, kecepatan px/s; length 0 = diam |
| pools | {start,end,y,type,fish?,height?,period?}: batas jurang, posisi permukaan visual, lava/water, warna ikan blue/purple, tinggi lompatan px dan periode ms |

Level 1: lima tile paku dalam empat kelompok, tiga pegas. Level 2: empat gergaji dan tiga kolam ikan. Level 3: empat kelompok paku, tiga gergaji baru, dan empat jurang lava. Gergaji lama juga tidak dapat dikalahkan. Kecepatan patroli musuh lain tidak berubah.

Paku memakai hitbox 48×32 px (setengah tinggi gambar), sedangkan gergaji memakai hitbox diperkecil. Paku, gergaji, dan ikan memberi hit seperti musuh: satu nyawa, kebal 1,6 detik, terpental. Super Mushroom menyerap satu hit, bintang menolak hit. Gergaji tidak bisa dikalahkan oleh injakan, bintang, atau cangkang. Ikan berada di bawah jalur utama; bergerak naik-turun periodik. Lava bersifat visual; jatuh tetap memicu respawn dan kehilangan nyawa seperti jurang biasa. Pegas tetap memakai collider sehingga plafon/kotak solid menghentikan pantulan.

Tidak ada data baru di Firebase. Modul obstacles.js mengelola objek ini di host. Aset Kenney CC0 tambahan yang dimuat sudah tersedia di assets: flag_off, spikes, spring, spring_out, lava/lava_top, water/water_top; fish_blue_rest/swim_a/swim_b dan fish_purple_rest/up/down. saw_a/saw_b dan suara select/jump-high digunakan ulang.

Pertahankan minimal 110 px dari tepi awal tanah ke hitbox rintangan setelah jurang, serta area bebas di spawn/checkpoint. Kelompok paku dan jalur gergaji harus tetap bisa dilompati tanpa buff; jangan menumpuknya dengan platform, kotak atau lokasi keluarnya item. Pengukuran rinci dan batas metode uji ada di TEST-RESULTS.md.


## Pemeriksaan kenyamanan posisi

Penataan akhir 20 Oktober 2026: platform pertama level 1 digeser satu tile ke kiri agar pendekatan lompat dari kanan tidak terhalang kotak. Paku awal dipindah ke x2280, melewati titik mendarat pegas pertama; sembilan koin di bagian itu disusun sebagai petunjuk melompat. Jumlah rintangan dan koin tidak bertambah atau berkurang.

Level 3: paku x9000 dipindah ke x8240; gergaji diam x16000 dipindah ke x9800, dengan koin diarahkan ke lintasan lompat/platform. Dua gergaji patroli memiliki batas yang dijauhkan dari ujung platform dan jurang (8820–9100 serta 15720–15900), dengan kecepatan dasar tetap. Checkpoint level 2 kedua menjadi x10750; level 3 menjadi x6870 dan x12370 agar empat posisi respawn tidak berada di bawah sisi platform.

Kepadatan rintangan, kecepatan gergaji level 2, rumus nyawa dan hukuman game over tetap. Platform tinggi masih membutuhkan tahan lompat; adanya satu jalur aman tidak berarti setiap waktu/titik lompat akan berhasil. Lihat TEST-RESULTS.md untuk hasil uji posisi dan batas metode.


## Hasil pengujian jaringan tahap 2 (21 Oktober 2026)

Firebase asli: empat browser controller dengan UID dan warna berbeda. MULAI/JEDA/LANJUT/ULANG LEVEL/KE LOBI/LANJUT antarlevel/MAIN LAGI dari HP lolos; tombol Jeda host juga menulis paused. Host mengabaikan perintah non-pemimpin, seq lama, dan aksi tidak sesuai fase. Controller kelima ditolak dengan pesan room penuh. Percobaan controller slot 1 menulis commands/0 ditolak PERMISSION_DENIED sesuai aturan; alur normal tidak mengalami penolakan. Room uji dihapus setelah selesai.

Sesi berikutnya menghitung ulang 4 + jumlah slot lobi; pengujian 4→3 pemain memakai penghapusan catatan slot uji oleh host setelah controller ditutup. Ini hanya fixture pengujian, bukan penambahan tombol keluar. Menjadi offline sendiri tetap tidak menghapus slot.


## Variasi platform dan balok (21 Oktober 2026)

**Status pemeriksaan terarah: 17/17 lulus.** Koreksi kontak awan dan posisi balok telah diverifikasi; pengujian hanya mengulang kasus yang sebelumnya gagal, bukan seluruh suite atau sesi manual penuh. Rincian dan arsip kegagalan ada di TEST-RESULTS.md.

- Level 2: dua jurang 400 px memakai awan sand horizontal wajib (60 px/s, jeda 0,8 detik), satu awan vertikal opsional (50 px/s, rentang 120 px), dan satu awan horizontal di atas kolam dengan tiga koin yang dipindah dari baris lama. Lebar semua awan empat tile untuk empat karakter besar.
- Level 3: lapangan lava 780 px dengan empat platform ungu dua tile, sela 100 px. Setelah diinjak bergetar 0,6 detik, jatuh dan muncul kembali 3 detik kemudian. Empat balok menggantung memperingatkan 0,4 detik, jatuh, diam 0,6 detik, naik 1,5 detik dan menunggu 2,5 detik. Balok hanya bahaya; bintang kebal damage tetapi tidak menghancurkannya.
- Level 1, jumlah koin/rintangan lama, rumus nyawa dan kecepatan tetap. Checkpoint tetap pada tanah; retry membuat ulang seluruh objek sementara. Data permainan tetap dihitung di host; tidak ada data Firebase baru.

Data host di file level: movingPlatforms berisi {x,y,tiles,axis,range,speed,pause,required?}; x/y adalah pusat awal, range adalah perpindahan positif total (px), speed px/s dan pause detik. crumblingPlatforms berisi {x,y,tiles}. fallingBlocks berisi {x,y,floor}, floor adalah permukaan tanah. platforms.js mengelola pijakan dan penumpang, obstacles.js mengelola balok jatuh.

Aset tambahan yang dimuat, semua Kenney CC0: terrain_sand_cloud_left/middle/right.png, terrain_purple_cloud_left/middle/right.png, serta Enemies/Default/block_idle.png, block_rest.png, block_fall.png. Memakai sfx_bump dan sfx_disappear yang sudah tersedia.


## Uji lokal

Jalankan `node start-local.cjs`, lalu buka `http://localhost:8080/host.html?mulai=level3&x=4800` (sesuaikan port server). Gunakan `level1`, `level2`, atau `level3`; `x` opsional, default 160 dan dibatasi ke dalam lebar level. Halaman langsung menjalankan satu pemain uji tanpa Firebase atau HP. Gunakan panah kiri/kanan untuk bergerak dan Spasi/panah atas untuk lompat. Klik pengingat Siapkan layar & audio bila ingin suara/fullscreen.

Pintasan hanya aktif untuk hostname `localhost`, `127.0.0.1`, atau alamat IPv4 pribadi `192.168.*.*`, `10.*.*.*`, `172.16.*.*` sampai `172.31.*.*`. Pada domain Netlify/domain lain parameter ini diabaikan dan alur lobi/controller normal tetap digunakan. Tanpa parameter `mulai` yang valid, alamat lokal juga memakai alur normal. Tidak ada perubahan data Firebase untuk fasilitas ini.


## Tahap 2b — saklar dan pintu

Di akhir level 3, checkpoint ketiga x16700 diikuti saklar hijau x17000 dan pintu x17450, sebelum bendera akhir. Lompat lalu mendarat pada saklar untuk membuka pintu selama 10 detik waktu permainan. Efek select dan magic menandai aktivasi; angka di atas pintu menunjukkan detik tersisa. Jeda menghentikan hitung mundur.

Pintu menunggu semua pemain keluar dari lorong sebelum menutup, lalu saklar siap ditekan lagi. Pemain yang tertinggal dapat mengaktifkannya kembali. Jarak saklar ke pintu 450 px: satu pemain dapat mencapai bendera dalam sekitar 2,18–2,22 detik pada harness, tanpa buff. Penghalang tertutup setinggi 320 px; lorong terbuka 64×128 px cukup untuk Super Mushroom. Retry dari checkpoint ketiga memulihkan pintu tertutup dan saklar awal.

Data level 3: puzzle berisi {switchX,doorX,floor,duration}, durasi dalam ms. Checkpoint ketiga memakai spawnY:480 agar spawn dekat tanah di bawah platform lama; dua checkpoint lainnya tetap. puzzle.js mengelola saklar, pintu, sensor lorong, dan label. Semua status hanya di memori host, tanpa perubahan Firebase.

Aset tambahan Kenney CC0 dari Tiles/Default: switch_green.png, switch_green_pressed.png, door_closed.png, door_closed_top.png, door_open.png, door_open_top.png. Blok terrain ungu dan suara select/magic yang sudah ada digunakan ulang.

Untuk uji jalur akhir: buka http://localhost:8080/host.html?mulai=level3&x=17080 (sesuaikan port), bergerak ke kiri ke saklar, lompat di tempat, lalu berlari kanan. Untuk memeriksa checkpoint baru, gunakan x=16700. Pemeriksaan Tahap 2b: 23/23 terarah dan 2/2 interaksi keyboard lokal lulus; rincian batas metode tersedia di TEST-RESULTS.md.


## Penataan finish setelah pintu

Pintu level 3 berada di x17450, bendera finish x17680, dan saklar tetap x17000. Jarak bersih tepi kanan pintu ke tepi kiri bendera 166 px; pemain harus keluar dari lorong lalu berjalan menuju bendera untuk menyelesaikan level. Checkpoint ketiga tetap x16700. Pemeriksaan satu putaran: 25/25 puzzle/geometri dan uji keyboard lokal dari `host.html?mulai=level3&x=16600` lolos.

## Polish dan kenyamanan

- Panel **Cara main** dapat dibuka di lobi tanpa menutupi QR. Petunjuk **Lompat ke saklar!** terlihat selama pintu tertutup.
- Pad arah HP dapat digeser kiri/kanan tanpa mengangkat jari: zona mati 11%, histeresis 2%, dan area sentuh 20 px di luar gambar. Tombol A memiliki area sentuh 1,2× diameter visual. Dua jari tetap dapat bergerak dan melompat bersamaan.
- Menu pemimpin berada di atas tengah. Tombol **⇄** menukar pad arah dan A; pilihan disimpan lokal dengan fallback jika penyimpanan ditolak. Tidak ada perubahan format input atau perintah Firebase.
- Ending menampilkan kartu skor, koin, musuh kalah (termasuk bintang/cangkang), hit/jatuh, dan item. Gelar seri diberikan ke semua pemain yang seri; solo hanya menampilkan statistik. Statistik mengikuti snapshot checkpoint/awal level dan direset saat Main Lagi.
- Kilau koin, puff musuh, debu pendaratan >80 px, goyang kamera 100 ms saat hit, angka skor, serta bilah progres dengan penanda checkpoint dan finish. Partikel dan angka berbagi batas 40 objek; mengikuti jeda scene dan dibersihkan saat restart.
- Efek geometris ringan dibuat dengan Phaser; sprite dan SFX tetap Kenney CC0. Tidak ada perubahan data level, kecepatan, atau fisika karakter.

## Kontribusi dan lisensi kode

Konsep, arahan fitur, dan iterasi oleh Alfa Tabi Mawarid bersama asisten AI; implementasi berbantuan AI. Lisensi Kenney, Subspace Audio, dan vendor dipertahankan. Paket ini tidak menetapkan lisensi baru untuk kode proyek.
