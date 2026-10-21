# TEST-RESULTS — Batch polish dan kenyamanan (21 Oktober 2026)

## Hasil akhir: 78/80 assertion lulus, dua assertion belum lulus

Pengujian dibatasi **dua putaran**. Tidak dilakukan putaran ketiga atau klaim sesi bermain manual penuh. Tidak ada error JavaScript pada harness akhir. Pemeriksaan dilakukan di Edge Chromium headless, memakai Phaser asli, simulasi sentuhan melalui CDP, dan empat konteks browser Firebase terpisah.

| Kelompok putaran 2 | Lulus | Total |
|---|---:|---:|
| Statistik, audio, efek, layout host | 32 | 32 |
| Firebase dan controller | 13 | 14 |
| Regresi puzzle langkah tetap 1000/60 ms | 25 | 25 |
| Integrasi tambahan checkpoint/audio/fullscreen/storage | 8 | 9 |

### Hasil yang tidak boleh dianggap lulus

1. Harness controller mengharapkan 5 tulisan tetapi merekam 6: kiri → netral → kanan → kanan+lompat → lompat saja → netral. Pelepasan dua pointer menghasilkan dua event terpisah. Semua tulisan mempunyai perubahan boolean nyata; lima pointermove tambahan pada sisi kanan tidak menghasilkan tulisan. Kunci tetap left, right, jump, seq, jumpSeq. Assertion asli tetap dicatat gagal; log mendukung bahwa tidak ada tulisan saat status tetap sama.
2. Assertion gabungan **mute musik tetap mengizinkan volume efek 0,16** gagal. Slider musik/efek sendiri lulus melalui currentConfig Phaser, tetapi assertion gabungan memakai sound.get('coin') tanpa membedakan instance efek sebelumnya. Tidak ada pengujian ulang setelah batas dua putaran, sehingga penyebab pasti dan validasi gabungan ini belum disimpulkan. Pemeriksaan dengan mendengarkan suara secara fisik belum dilakukan.

### Riwayat putaran pertama

- Host: enam assertion musik membaca gain WebAudio headless bernilai 1 walaupun currentConfig menyimpan 0,22. Putaran kedua membaca konfigurasi Phaser yang benar; bukan klaim pengukuran volume akustik.
- Retry diperiksa terlalu lambat sehingga pemain sudah mengambil koin di dekat checkpoint (+10 dan satu koin). Putaran kedua memeriksa pemulihan tepat setelah aksi restart sebelum langkah fisika berikutnya.
- Harness jaringan berhenti karena selector #remote-menu, padahal elemen memakai class .remote-menu; diperbaiki pada harness. Pemeriksaan warna juga dipindahkan ke setelah start saat session.roster telah diisi.
- Tidak diperlukan perubahan data level atau fisika untuk mengatasi hasil tersebut.

## Cakupan yang lulus

- Gelar untuk 1–4 pemain, solo tanpa perbandingan, pemenang terpisah dan seri semua pemain.
- Empat jenis item dicatat; hati dibatasi maksimum; Super Mushroom menyerap hit dan tercatat sekali; invincibility tidak menggandakan hit; defeatEnemy menambah statistik musuh dan +50.
- Snapshot statistik independen, aktivasi checkpoint runtime menangkap statistik, restart memulihkan snapshot, Main Lagi mereset statistik.
- Track level 1/2 dan level 3 berganti tanpa lebih dari satu objek musik, loop, ending berhenti, Main Lagi satu musik. Volume tersimpan, reload memakai pilihan, JSON rusak dan storage gagal memakai fallback. Slider musik/efek meneruskan nilai ke Phaser.
- Batas gabungan 40 objek efek, posisi/alpha membeku selama scene paused, efek selesai dibersihkan, objek efek lama dibersihkan saat restart.
- Lobi bantuan, HUD progres/panel Suara, ending 1 dan 4 pemain di 1366×768 dan 1920×1080. Screenshot ditinjau: QR terpisah dari Cara main, hati di kiri atas tidak tertutup progres; kartu ending dan tombol Main Lagi muat.
- Controller di 844×390, 915×412, 667×375, 740×360: hit area muat viewport dan jarak menu ke pad/A minimal 24 px. Screenshot diperiksa. Tukar sisi, persistensi dan storage ditolak tidak mematikan tombol.
- Firebase asli: empat UID/sesi, warna unik saat start, presence, delapan hati; pemimpin MULAI/JEDA/LANJUT; geser kiri–netral–kanan dengan multitouch A diterima host. Blur/pointercancel melepaskan input. Room NLPM (putaran 1) dan GQRM (putaran 2) dihapus oleh host setelah pengujian.
- Regresi puzzle: 1–4 pemain kecil/besar, durasi 10 detik, lorong terisi, penghalang tertutup, solo/empat pemain menuju bendera, saklar berulang, kotak/buff/nyawa, jeda/resume dan checkpoint ketiga retry. Fullscreen host juga diuji.

## Batas verifikasi

- Ini harness otomatis dan inspeksi screenshot, bukan uji manual penuh tiga level atau HP fisik/iPhone. Safe-area memakai CSS env(); perangkat notch fisik belum dicoba.
- Lostpointercapture dan pergantian fase mempertahankan jalur reset; pointercancel dan blur diuji eksplisit. Tidak ada benchmark FPS lintas perangkat; hanya batas objek efek 40 yang diverifikasi.
- Tidak semua interaksi musuh/rintangan lama dimainkan ulang. Statistik kill memakai fungsi defeatEnemy bersama untuk injak, bintang, dan cangkang; semua jalur atribusi tidak diuji terpisah pada batch ini.

## Integritas dan artefak

SHA-256 dibandingkan dengan sumber sebelum batch: config.js, database.rules.json, network.js, remote.js, local-test.js, player.js, platforms.js, levels/level1.js, level2.js, level3.js semuanya identik. Tidak ada field Firebase baru. styles.css hanya mendapat tambahan selector controller; host memakai host-polish.css. Instrumen hanya di folder work/polish di luar paket.

Bukti mentah dan screenshot: work/polish/{host-1,host-2,controller-1,controller-2,puzzle-round2,additional-2,integrity}.json dan *.png di workspace, tidak dimasukkan ke ZIP distribusi. Arsip distribusi memuat folder platformer-hp, termasuk local-test.js; tidak memuat work atau instrumen. Tidak diunggah ke Netlify.

---

## Arsip pemeriksaan sebelum batch ini

# TEST-RESULTS — jarak pintu dan bendera

**LULUS: 25/25 pemeriksaan puzzle/geometri dan satu jalur keyboard lokal (2/2 assertion) dalam satu putaran.** Tidak ada error JavaScript dan tidak diperlukan perbaikan lanjutan. Hanya dua nilai data permainan berubah pada levels/level3.js: puzzle.doorX 17510 → 17450, flag.x 17550 → 17680.

## Pengukuran dan penataan
- Tepi kanan pintu x17482, tepi kiri tubuh/gambar bendera x17648: **jarak bersih 166 px**, melewati minimum 150 px. Bendera x17680 berada sebelum batas lebar level minus 80 (x17720); tepi gambar kanannya x17712 juga masih di dalam batas tersebut.
- Saat karakter besar tertahan di sisi kiri pintu tertutup, jarak antara tepi kanan tubuhnya dan tepi kiri tubuh bendera **230 px**, lebih dari 20 px. Level tidak dapat selesai dari sisi kiri pintu.
- Saklar tetap x17000: jarak saklar–pintu **450 px**. Checkpoint ketiga tetap x16700. Jarak aman saklar ke hazard lama tetap sama (>110 px); rintangan lain tidak berubah.

## Pemeriksaan satu putaran
Harness Phaser Arcade langkah tetap 1000/60 ms melalui Edge Chromium headless:
- 1–4 pemain kecil/besar mengaktifkan saklar dari atas, deadline playTime +10000 ms; penutupan diamati dalam toleransi satu langkah setelah deadline, tidak lebih awal.
- Lorong terisi mencegah penutupan; pintu menutup setelah pemain kecil/besar keluar.
- Lompatan penuh kecil/besar dari kedua sisi tidak menembus penghalang tertutup.
- Solo kecil mencapai bendera setelah **2216,67 ms**, besar **2183,33 ms**, keduanya tanpa buff kecepatan/lompat dan tanpa kehilangan nyawa dalam fixture terisolasi. Posisi pusat tubuh saat finish masing-masing x17631,30 dan x17621,51, sudah melewati tepi kanan pintu x17482.
- Empat pemain lewat satu aktivasi; saklar bisa diaktifkan ulang; retry checkpoint ketiga memulihkan pintu/saklar; jeda membekukan playTime/deadline/label dan lanjut menggerakkan timer kembali.
- Pemeriksaan singkat kotak, buff, batas nyawa dan satu instance musik tetap lolos.

Satu uji interaksi keyboard melalui http://localhost:8083/host.html?mulai=level3&x=16600: bergerak kanan menuju saklar, melompat di tempat, lalu berlari kanan ke bendera. Musuh tetap aktif, tanpa penempatan tubuh atau pengubahan clock/buff oleh harness. Saklar terpicu dan ending tercapai dengan tiga dari lima nyawa; musik berhenti. Screenshot diperiksa: bendera tergambar terpisah di kanan pintu. Ini interaksi browser yang dioperasikan agen, bukan sesi manusia penuh sepanjang tiga level.

## Integritas dan paket
Perbandingan data memastikan hanya dua koordinat di atas berubah. SHA-256 config.js, database.rules.json, network.js, remote.js, controller.js sama. README diperbarui dengan angka posisi dan waktu baru. Tidak ada pengujian jaringan Firebase atau room uji dibuat. ZIP berisi platformer-hp/ tanpa work atau instrumen, tidak diunggah ke Netlify.

---

# Arsip sebelum perbaikan jarak — angka lama di bawah adalah riwayat

# TEST-RESULTS — Tahap 2b: saklar dan pintu

Tanggal: 21 Oktober 2026. **LULUS: 23/23 pemeriksaan terarah (fisika, jeda, dan retry) serta 2/2 pemeriksaan interaksi keyboard lokal.** Maksimum dua putaran dipatuhi. Tidak diperlukan perubahan kode permainan setelah hasil pengujian. Tidak diunggah ke Netlify.

## Lingkungan dan lingkup
Edge Chromium headless melalui Playwright, host 1366×768, Phaser Arcade produksi. Harness memakai langkah tetap 1000/60 ms: movePlatforms → world.update → scene.update → world.postUpdate. URL uji memakai fasilitas lokal host.html?mulai=level3&x=16700. Satu sampai empat tubuh pemain produksi, kecil/besar, dengan penempatan awal dibantu fixture. Musuh biasa dinonaktifkan hanya pada pengukuran fisika terisolasi.

Putaran pertama: seluruh 23 pemeriksaan terarah lolos. Percobaan interaksi keyboard pertama berhenti pada persiapan karena harness mencoba mengklik pengingat audio yang sudah tersembunyi (audio telah terbuka); belum ada input gameplay pada percobaan itu. Putaran kedua hanya memperbaiki kondisi harness tersebut dan menjalankan jalur keyboard lokal: 2/2 lolos. Tidak ada putaran ketiga. Kegagalan persiapan dicatat, tidak dihitung sebagai kelulusan.

## Hasil fisika dan alur
| Pemeriksaan | Hasil |
|---|---|
| Saklar dari atas, 1–4 pemain kecil/besar | 8/8 lulus. Pemicu digilir ke slot terakhir tiap kelompok, membuktikan pemain mana pun dapat mengaktifkan. Dua badan pintu dinonaktifkan dan tekstur saklar berubah. |
| Durasi pembukaan | Delapan kasus di atas: deadline tepat activationPlayTime + 10000 ms. Penutupan teramati pada 10000–10016,67 ms karena resolusi langkah 16,67 ms/pembulatan floating point; tidak menutup lebih awal. |
| Kontak samping saklar | 1/1 lulus, berjalan lewat sensor pada tanah tidak mengaktifkan; perlu turun/mendarat dari atas. |
| Lorong terisi setelah waktu habis | 2/2 lulus, kecil/besar. Pintu tetap terbuka selama 40 langkah setelah deadline ketika tubuh berada di dalam lorong. Menutup pada langkah berikutnya setelah pemain dipindah ke luar. Tidak ada badan solid pintu yang aktif selama lorong terisi. |
| Lompat penuh menembus penghalang tertutup | 4/4 lulus, kecil/besar dari kedua arah. Tidak dapat menyeberang. Penghalang dari y200 sampai tanah y520, tinggi 320 px. |
| Solo dari saklar ke bendera | 2/2 lulus, tanpa buff kecepatan/lompat. Kecil 1766,67 ms, besar 1750 ms. Tidak kehilangan nyawa dalam fixture terisolasi; mencapai collider bendera dengan pintu terbuka. |
| Empat pemain satu aktivasi | 1/1 lulus, empat badan mencapai sisi seberang sebelum 10 detik; nyawa tetap. |
| Pemain tertinggal mengaktifkan kembali | 1/1 lulus, saklar bekerja lagi setelah pintu menutup. |
| Regresi kotak, buff, nyawa, musik | 1/1 lulus: kotak sekali, item hati dibatasi maksimum, Super Mushroom dan bintang aktif, satu instance musik loop. |
| Jeda / lanjut | 2/2 lulus melalui tombol host. Selama jeda 400 ms, playTime, deadline, dan angka pintu identik; lanjut kembali memajukan playTime. |
| Retry checkpoint ketiga | 1/1 lulus melalui gameover dan tombol Ulang: spawn x16700, checkpoint y480, pintu tertutup, switch_green awal. |

## Interaksi lokal melalui browser
URL: http://localhost:8083/host.html?mulai=level3&x=17080.

Menggunakan input keyboard browser secara langsung, tanpa harness langkah tetap, tanpa memindahkan tubuh, mengubah clock/buff, atau menonaktifkan musuh: bergerak ke kiri menuju saklar, melompat di tempat, lalu berlari kanan sampai ending. Saklar tertekan dari lompatan (deadline masih sekitar 9983,34 ms pada observasi awal). Ending tercapai dengan empat dari lima nyawa; satu hit dari musuh lama terjadi. Musik berhenti pada ending. Tidak ada error JavaScript.

Ini adalah interaksi UI yang dijalankan agen dengan keyboard browser, bukan penguji manusia atau sesi manual penuh ketiga level. Screenshot bukti disimpan di work, tidak masuk ZIP. Audio diperiksa lewat state browser, bukan mendengar speaker. Tidak ada room Firebase dibuat dan jaringan multiplayer tidak diuji ulang pada tahap ini.

## Penataan dan keadilan
- Hanya level 3 mendapat data puzzle {switchX:17000, doorX:17510, floor:520, duration:10000} dan checkpoint ketiga {x:16700,y:472,spawnY:480}. Dua checkpoint lama tidak berubah.
- Saklar 510 px sebelum pintu; checkpoint 300 px sebelum saklar. Keduanya berada pada tanah akhir x16410–17800. Jarak bebas horizontal ke gergaji lama terdekat >1000 px untuk saklar, dan lebih jauh lagi ke paku, balok jatuh, dan lava; melampaui syarat 110 px. Checkpoint juga jauh dari hazard terdekat.
- Pintu terdiri dari dua tile setinggi 128 px; tiga blok ungu di atasnya membuat penghalang total 320 px. Lorong terbuka 64×128 px, cukup untuk tubuh besar sekitar 54,6×81,9 px. Tidak ada celah bawah; pintu tersambung tanah.
- SpawnY khusus checkpoint ketiga menjaga kaki dekat tanah saat retry sehingga empat posisi spawn tidak dimulai di dalam platform lama di atas lintasan. Checkpoint lama tetap memakai spawnY default 440.
- Penjagaan penutupan memeriksa seluruh tubuh pemain, termasuk slot offline yang tubuhnya masih ada, dengan margin 2 px pada lorong. Waktu tambahan hanya ketika lorong terisi; saklar kembali siap setelah pintu benar-benar menutup.
- Data level sebelum pekerjaan dibandingkan secara mendalam: seluruh ground, platform, celah, hazard, koin, musuh dan dua checkpoint lama sama persis. Level 1/2 identik.

## Integritas dan paket
SHA-256 config.js, database.rules.json, network.js, remote.js, controller.js tetap sama. Tidak ada data/kunci Firebase baru. State puzzle hanya di scene host, deadline memakai playTime. Aset enam sprite Kenney yang diminta tersedia dan dimuat tanpa kegagalan. Kode baru puzzle.js; game.js menghubungkan load/create/tick. obstacles.js menerima spawnY opsional checkpoint, tanpa mengubah perilaku dua checkpoint lama.

README diperbarui. ZIP berisi satu folder platformer-hp, tanpa work, instrumen atau file sementara. Hasil ini terbatas pada pengujian yang dijelaskan; tidak mengklaim mengulang semua regresi lama atau empat HP fisik.

---

# Arsip sebelum Tahap 2b

# TEST-RESULTS — pemeriksaan terarah

Status terbaru: **17/17 pemeriksaan fisika terarah LULUS**, tanpa error JavaScript. Dua koreksi terakhir dari versi sebelumnya kini sudah diuji. Tidak ada perubahan lanjutan pada platforms.js, obstacles.js, atau penataan level yang diperlukan. Satu pemeriksaan awal selesai; jatah satu putaran perbaikan/uji ulang tidak digunakan.

## Lingkup dan metode
Hanya kasus fisika yang sebelumnya gagal diperiksa kembali. Edge Chromium headless, Phaser Arcade asli, langkah tetap 1000/60 ms: movePlatforms → world.update → scene.update → world.postUpdate. Penempatan awal dan input dibantu harness; bukan sesi bermain manual penuh. Musuh biasa dinonaktifkan untuk mengisolasi rintangan sasaran; paku, tanah, kotak dan balok terkait tetap memakai collider/overlap produksi. Tidak mengulang seluruh suite regresi atau pengujian Firebase.

| Kasus | Hasil |
|---|---|
| Awan kolam x2760, 1–4 penumpang kecil/besar | 8/8 lulus; 330 langkah (5,5 detik) tiap kombinasi, mencakup pembalikan. Deviasi horizontal relatif terhadap awan dan deviasi kaki masing-masing 0 px. Tidak kehilangan nyawa. |
| Balok x5070, 6380, 11920, 13400 | 4/4 lulus; warning → fall → rest → rise → idle, kembali tepat ke posisi awal, lalu dapat memicu warning lagi setelah cooldown 2500 ms. Siklus teramati sekitar 2,97–3,02 detik. |
| Lewat aman balok x5070 | 2/2 lulus, kecil/besar. Mulai x4990 (bebas paku), berlari lalu melompat dekat x5095 melewati jurang berikutnya; benar-benar mendarat di tanah x>5320 dengan nyawa tetap 8. |
| Platform x16270 ke tanah seberang | 2/2 lulus, kecil/besar. Mulai x16140, mendarat pada platform (kaki y368), terus berjalan hingga mendarat pada tanah (kaki y520, x>16410). Tidak kehilangan nyawa. Tumpang tindih ujung platform dengan tepi tanah tidak menghalangi rute ini; penataan tidak diubah. |
| Kotak level 3 yang belum dipakai | 1/1 lulus. Kotak segar x350 disundul melalui fisika; jumlah item bertambah satu. Percobaan membuka lagi tidak menambah item. |

Kegagalan terdahulu dipertahankan di arsip di bawah; bukan dihapus atau dihitung ulang secara retroaktif. Assertion lama kotak memakai objek yang sudah pernah tersundul; assertion gap berhenti sebelum pendaratan tanah; pendekatan balok lama berimpit paku. Fixture terarah memperbaiki ketiga batas pengukuran tersebut. Koreksi kontak awan dan body.reset balok yang telah ada pada paket masuk tetap digunakan tanpa perubahan.

## Fasilitas uji lokal
Ditambahkan local-test.js dan cabang startup lokal pada host.js. URL contoh: http://localhost:8080/host.html?mulai=level3&x=4800. Langsung membuat satu pemain lokal, lima nyawa, level/posisi yang dipilih; tanpa koneksi Firebase, room, atau controller. Panah kiri/kanan bergerak; Spasi/panah atas melompat. Audio/fullscreen tetap membutuhkan klik laptop sesuai pembatas browser.

Pemeriksaan khusus fasilitas baru:
- 8 hostname yang diizinkan diuji: localhost, 127.0.0.1, contoh kedua batas 192.168.*, 10.*, dan 172.16–31.*.
- 10 hostname ditolak: domain Netlify/publik, domain yang menyamar dengan prefix IP/localhost, IP di luar rentang pribadi, 127.0.0.2 dan IPv6 loopback (tidak diminta).
- Parameter level4 dan URL tanpa mulai tidak mengaktifkan mode lokal.
- Browser membuka level3 x4800: level internal 2, satu pemain tepat x4800; input kiri memindahkannya ke x4731,06. **0 permintaan Firebase dan 0 error JavaScript**.
- Parameter x dibatasi 40 sampai lebar level minus 200; x tidak valid kembali ke 160. Parameter level hanya menerima level1/level2/level3.

## Integritas dan penyerahan
SHA-256 config.js, database.rules.json, network.js, remote.js, controller.js sama dengan sebelum pekerjaan. Tidak menambah data/kunci Firebase. Tidak ada room uji dibuat pada tahap ini. Tidak ada fitur gameplay tambahan; keyboard hanya tersedia dalam mode uji lokal. README diperbarui. ZIP berisi platformer-hp/ tanpa work, harness atau instrumen, dan tidak diunggah ke Netlify.

---

# Arsip sebelum perbaikan terarah — status kegagalan di bawah adalah riwayat

# TEST-RESULTS — variasi platform dan balok jatuh

Tanggal: 21 Oktober 2026. **Status: belum lulus penuh; perlu verifikasi lanjutan sebelum publikasi.** Batas dua putaran fisika dipatuhi. Tidak ada sesi bermain manual penuh dan tidak diunggah ke Netlify.

## Metode dan batas putaran
Edge Chromium headless, Phaser Arcade produksi, langkah tetap 1000/60 ms. Harness lokal membuka session lewat route Playwright; network diganti fixture empat slot hanya untuk pengukuran fisika. Tidak ada instrumen di paket. Pemeriksaan jaringan regresi terpisah dalam putaran kedua menggunakan Firebase asli dan empat BrowserContext controller.

Satu kegagalan persiapan harness (flag online fixture belum diisi) terjadi sebelum permainan dapat dimulai; diperbaiki sebelum pengukuran fisika. Catatan bootstrap dipertahankan di bukti pengujian, tidak disamarkan sebagai keberhasilan.

- Putaran 1: 40 pemeriksaan level 1 lulus. Level 2 berhenti karena urutan argumen collider group-versus-object berbeda dari asumsi kode. Argumen diperbaiki sebelum putaran 2.
- Putaran 2: **196 dari 212 assertion fisika lulus; 16 gagal**, tanpa error JavaScript. Sesudah hasil ini dilakukan koreksi terakhir, tanpa putaran ketiga.
- Regresi jaringan putaran 2: **21/21 lulus**. Hasil tersebut tidak membuktikan koreksi fisika terakhir sudah berhasil.

## Hasil rintangan baru
- Dua awan wajib dan satu awan vertikal: 24 kombinasi (1–4 penumpang × kecil/besar × 3 platform), diam di atasnya selama satu siklus bolak-balik termasuk jeda dan pembalikan. Deviasi kaki/horizontal memenuhi ambang <1 px pada assertion ini. Penempatan awal dibantu harness; bukan bukti empat pemain selalu berhasil naik bersamaan dari tanah.
- Awan opsional di atas kolam: **8 kombinasi gagal**, deviasi horizontal 20–24 px dan kaki hingga 26,375 px. Koreksi terakhir menyimpan kontak permukaan dan menyelaraskan kaki sebelum langkah Arcade. **Belum diuji ulang, jangan dianggap selesai terverifikasi.**
- Empat platform runtuh: peringatan sekitar 600 ms, tubuh dinonaktifkan saat jatuh, aktif kembali sekitar 3000 ms sesudah jatuh. Seluruh pemeriksaan siklus lolos. Lintasan empat batu dilalui harness untuk ukuran kecil dan besar tanpa kehilangan nyawa.
- Empat balok: batas pemicu di luar 110 px tidak memicu; pada 85 px memicu, peringatan/rest teramati. **Empat assertion kembali ke posisi idle gagal.** Penyebab yang ditangani: perpindahan manual badan dinamis diterapkan lagi oleh postUpdate. Koreksi terakhir menggunakan body.reset untuk menyelaraskan posisi sebelumnya. **Belum diuji ulang.**
- Satu assertion lewat aman balok x5070 gagal: titik awal fixture x4890 berimpit paku lama x4900, sehingga tidak mengisolasi balok. Tetap dicatat gagal; belum membuktikan pendekatan aman untuk kasus itu.
- Kontak balok normal mengurangi satu nyawa; Super Mushroom menyerap hit; bintang menolak damage dan balok tetap aktif: assertion empat balok lolos.
- Satu assertion kotak level 3 gagal karena fixture menjalankan kotak yang sudah tersundul oleh pemeriksaan lintasan sebelumnya. Regresi kotak terisolasi pada Firebase lulus, tetapi assertion gagal tidak dihapus dari total.

## Jarak dan penataan
- Impuls/kecepatan pemain tetap: 690 dan 293,75 px/s. Kalibrasi langkah tetap mencapai kenaikan kaki **170,625 px** pada ketiga level. Platform lama tertinggi: **167 px** di atas tanah (margin teoritis hasil harness 3,625 px). Semua target platform lama memiliki sampel pendaratan yang berhasil, kecil maupun besar.
- Dua celah level 2 diperlebar menjadi **400 px**, pada 5720–6120 dan 8800–9200. Sampel takeoff tidak berhasil melintas tanpa awan untuk kedua ukuran. Awan empat tile, 256 px, bergerak 60 px/s, rentang 400 px, jeda 0,8 detik. Checkpoint pertama dipindah ke x4500, 1220 px sebelum celah wajib pertama.
- Celah normal terlebar tetap **210 px**. Dua assertion celah 16200–16410 dicatat gagal karena harness berhenti saat mendarat di platform tetap yang dipindah ke sana (kaki y368), sebelum mencapai tanah seberang. Platform memanjang sampai x16430 dan bertumpang tindih dengan tepi tanah x16410; ini bukan bukti lompat 210 px gagal, tetapi rangkaian melanjutkan dari platform ke tanah belum diukur dalam assertion tersebut.
- Awan vertikal: x4600, pusat y330–450, 50 px/s. Awan kolam: x2760–2860, pusat y390, 60 px/s; tiga koin lama dipindahkan ke jalur atas, bukan ditambah.
- Lava baru level 3: x13790–14570 (**780 px**). Empat blok dua tile (128 px), sela 100 px. Bentang keseluruhan 812 px, ujung menumpang bank 16 px. Checkpoint x12370 berjarak **1420 px** sebelum lava. Bank sebelum lapangan 140 px sesudah jurang lama. Paku terdekat dipindah x14750; platform lama x14000 dipindah ke x16270; katak dipindah ke x16080 dengan kecepatan tetap.
- Balok pada x5070/6380/11920/13400, pusat y260: ruang bebas di bawah gambar 228 px, lebih dari 100 px. Titik berada di tanah tetap, lebih dari 110 px sesudah tepi mendarat dan lebih dari 300 px dari checkpoint.
- Level 1 tidak diedit. Koin per level tetap **77/74/68**; musuh **8/12/20**, platform tetap **10/11/13**. Jumlah paku/gergaji/pegas lama tetap. Nyawa dan kecepatan pemain tidak diubah.
- Pengujian reset setelah aktivasi checkpoint mengembalikan platform/balok ke keadaan awal dan spawn ke checkpoint pada ketiga level. Tidak ada checkpoint di atas platform sementara.
- Penanganan keluar dari solid tanpa damage tersedia, tetapi belum ada fixture penjepitan sintetis; tidak diklaim teruji untuk penataan level arbitrer.

## Regresi Firebase asli dan pembersihan
Host + empat controller terpisah: join, UID/warna unik, presence, input multitouch, pemimpin, pause/resume, retry, checkpoint, tiga level/ending/Main Lagi, nyawa dinamis, kotak/buff, hati, musik satu instance dan fullscreen lolos. Penempatan bendera/item/gameover dibantu fixture. Audio dibuktikan lewat WebAudio, bukan pendengaran speaker. Musuh bergerak pada runtime; tidak mengulang seluruh interaksi siput/katak dalam pengujian ini.

Room **NNWO** dihapus oleh host; pembacaan setelah penghapusan memastikan exists=false. Tidak ada PERMISSION_DENIED pada alur normal. Percobaan negatif milik suite regresi: controller slot 1 menulis rooms/NNWO/commands/0 dengan {"action":"start","seq":99999}, ditolak PERMISSION_DENIED sesuai aturan. Tidak ada perubahan aturan atau field Firebase.

## Integritas dan penyerahan
SHA-256 kelima berkas terlarang sama dengan sumber ZIP: config.js, database.rules.json, network.js, remote.js, controller.js. remote/commands tidak diubah. Semua sprite memakai berkas Kenney CC0 yang sudah tersedia. README diperbarui. ZIP berstruktur platformer-hp/ tanpa work dan instrumen; **format siap diunggah, tetapi validasi gameplay belum lengkap**. Berhenti setelah dua putaran sesuai permintaan.

---

## Arsip hasil sebelum pembaruan ini

# TEST-RESULTS — jaringan tahap 2 / Firebase asli

Tanggal: 21 Oktober 2026 (Asia/Jakarta).
Status: **LULUS, 21/21 pemeriksaan, satu putaran dari maksimum dua.** Tidak ada perbaikan kode permainan dan tidak ada putaran kedua karena seluruh pemeriksaan lolos.

## Lingkungan
Server lokal HTTP port 8083; Edge Chromium headless melalui Playwright; satu host 1366×768, empat BrowserContext controller dengan penyimpanan/auth terpisah (landscape 844×390 dan 915×412), plus context kelima untuk penolakan join. SDK Firebase produksi, konfigurasi proyek yang ada, autentikasi anonim, dan Realtime Database asli digunakan. Empat UID dan empat warna berbeda terverifikasi.

Instrumen pengujian hanya dipasang lewat respons route Playwright: membuka referensi session/network dan mencatat set/update/transaction/onDisconnect.set. Tidak mengganti Firebase dengan mock. Instrumen dan fixture berada di work/, bukan paket deployment. config.js dan database.rules.json diverifikasi hash tetap sama sebelum/sesudah; tidak menerbitkan aturan, mengubah struktur data atau menambah fitur.

## Alur dan kontrol akses
- Host membuat room MOOR dengan phase lobby dan hostOnline true. Empat slot 0–3 join, presence true, warna unik; input multitouch kanan+lompat dari dua controller tercatat pada fisika host.
- Hanya slot online terkecil melihat kontrol game. Slot 0 menekan MULAI di HP; game dimulai dengan delapan nyawa. Slot 1 menulis perintah start ke slotnya sendiri: penulisan diterima Firebase, tetapi host mengabaikannya karena bukan pemimpin.
- Seq lama: commands/0 ditulis {action:"pause",seq:1} setelah start seq 1; host tetap playing. Aksi salah fase berikutnya {action:"next",seq:2} juga tidak memindahkan level/fase. Perintah valid sesudahnya tetap berjalan.
- Controller kelima ditolak dengan teks Room penuh (maksimal 4 pemain); jumlah slot tetap empat.

## Bukti penolakan yang memang diharapkan
Penulis: controller slot 1 yang terautentikasi dengan UID berbeda dari pemilik slot 0.

Path: **rooms/MOOR/commands/0**

Nilai yang dicoba ditulis:

```json
{
  "action": "start",
  "seq": 99999
}
```

Hasil: **PERMISSION_DENIED** — PERMISSION_DENIED: Permission denied

Penolakan ini adalah bukti aturan pemilikan slot bekerja, bukan kegagalan alur normal. Tepat satu penolakan teramati pada instrumen yang dikumpulkan, yaitu percobaan ini. Tidak ada PERMISSION_DENIED tidak terduga. Tidak menebak atau menerapkan perubahan aturan.

## Pause / resume
Pemimpin menekan JEDA, host menulis phase paused. Selama observasi 1000 ms:

- Posisi empat pemain dan semua musuh sama persis sebelum/sesudah.
- Scene time.now tetap 20082.9; waktu aktif tetap 832.90 ms.
- Timer tersisa tetap 600.07 ms, callback tidak terpicu.
- Durasi bintang tersisa tetap 1400.07 ms.
- Musik isPaused true, isPlaying false; seek tetap 0.829333 detik; satu instance musik.
- Input right+jump sengaja dikirim selama paused ke slot pemiliknya: penulisan diterima, controls host tetap netral dan posisi tidak berubah.

LANJUT mengaktifkan kembali scene dan musik, timer berjalan sampai callback terpicu. Pergeseran posisi setelah 220 ms sesuai jatuh normal ke tanah, tanpa loncatan posisi besar. ULANG LEVEL dari paused mengaktifkan scene baru dengan delapan nyawa. KE LOBI dari paused menampilkan lobi. Klik Jeda memakai mouse di host juga menghasilkan phase paused yang tersimpan di Firebase; LANJUT dari HP berhasil.

## Pemimpin offline dan reconnect
Koneksi Firebase controller slot 0 diputus dengan SDK goOffline, sehingga onDisconnect presence/0=false benar-benar diproses server. Controller slot 1 menjadi pemimpin dan menampilkan MULAI. Controller lama reload/join di BrowserContext yang sama: UID dan slot 0 pulih, presence kembali true, tombol pemimpin kembali ke slot 0; controller slot 1 kembali menunggu.

## Retry, perpindahan level, ending
Checkpoint x5700 diaktifkan lewat overlap. Skor berubah setelah checkpoint, lalu gameover dipicu lewat damage produksi. Pemimpin menekan ULANG LEVEL dari HP: spawn x5700, nyawa 8, skor kembali tepat ke snapshot checkpoint ({"0":120,"1":0,"2":0,"3":0}).

Bendera disentuh melalui penempatan awal yang dibantu untuk memicu collider finish. Fase between → LANJUT HP → level berikutnya, tiga level → ending, musik berhenti, MAIN LAGI HP → lobby, semuanya lolos. Checkpoint lama kosong saat level berganti.

Penghitungan ulang nyawa diverifikasi dari empat menjadi tiga pemain: controller keempat ditutup, host menghapus catatan slot/presence/input/command milik sesi uji itu di lobi (node yang sudah ada), lalu MULAI HP menghasilkan maksimum dan nyawa awal tujuh. Penghapusan ini fixture pengujian untuk mensimulasikan pengurangan anggota permanen; game tidak mendapat fitur keluar baru dan presence false saja tidak mengurangi jumlah slot.

## Regresi singkat
Kotak dipicu dua kali lewat fungsi produksi tetapi tetap menghasilkan satu item acak; item hati dibatasi delapan; Super Mushroom membesarkan karakter; bintang aktif; HUD menampilkan delapan hati. Musik satu instance, loop, volume 0,22; tombol mute dapat diaktifkan lalu dimatikan. Fullscreen dari tombol Siapkan layar dan tombol pojok host berhasil; AudioContext running. Tidak ada error JavaScript browser.

## Pembersihan Realtime Database
- rooms/MOOR: dihapus oleh host pemilik; pembacaan get setelah set(null) memastikan exists=false.

Semua context controller ditutup sebelum penghapusan room. Listener host dihentikan dan onDisconnect host dibatalkan sebelum room dihapus. Semua room yang dibuat pada putaran ini telah dihapus; tidak ada room uji tersisa dari pengujian ini.

## Daftar pemeriksaan
- LULUS: Host membuat room Firebase asli
- LULUS: Siapkan layar: fullscreen dan audio
- LULUS: Empat controller terpisah: slot, UID dan warna unik, presence true
- LULUS: Pemimpin slot 0 saja melihat MULAI
- LULUS: Pemain kelima ditolak: room penuh
- LULUS: Aturan menolak controller slot 1 menulis commands/0
- LULUS: Perintah non-pemimpin di slot sendiri diabaikan host
- LULUS: MULAI dari HP pemimpin
- LULUS: Input multitouch sampai ke host
- LULUS: Seq lama dan aksi salah fase diabaikan
- LULUS: JEDA membekukan fisika, musuh, clock, buff, musik; input diabaikan
- LULUS: LANJUT melanjutkan timer/fisika/musik tanpa loncatan posisi
- LULUS: ULANG LEVEL dari paused
- LULUS: KE LOBI dari paused
- LULUS: Pemimpin offline berpindah ke slot 1; reconnect tetap slot 0
- LULUS: Tombol Jeda host menulis phase paused, LANJUT HP
- LULUS: Checkpoint, gameover, ULANG LEVEL HP
- LULUS: Regresi musik, kotak/buff, hati, fullscreen
- LULUS: LANJUT antarlevel, ending, MAIN LAGI dari controller
- LULUS: Nyawa awal dihitung ulang pada MULAI berikutnya (fixture 4→3 slot)
- LULUS: Tidak ada error JavaScript browser

## Batas hasil
Empat controller adalah browser simulasi, bukan empat HP fisik. Audio diperiksa melalui state WebAudio, bukan speaker. Penempatan karakter, pemberian item, gameover, dan pengurangan slot tertentu dibantu harness agar transisi dapat diuji terarah. Bukan sesi manual penuh sepanjang semua rute. Pengujian ini melengkapi uji fisika/kenyamanan sebelumnya, bukan mengulang seluruh rintangan pada setiap level.

Paket Netlify berisi folder platformer-hp tanpa work atau instrumen. Tidak diunggah ke Netlify otomatis.
