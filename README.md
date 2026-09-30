# 🤖 Zimzz-AI — WhatsApp Bot

Bot WhatsApp berbasis Termux dengan pairing code. Support fitur kick, bikin grup, ambil link grup, buka foto "sekali lihat", auto-reply AI di chat pribadi, dan welcome message otomatis.

---

## ⚠️ DISCLAIMER

**BACA DULU SEBELUM PAKAI.**

1. **Bot ini bukan bot resmi WhatsApp.** Dibuat pakai library tidak resmi (`f-baileys`), yang artinya **melanggar ToS WhatsApp**. Nomor yang dipakai untuk bot **berisiko diblokir permanen** oleh WhatsApp.
2. **Gunakan nomor cadangan**, jangan nomor utama. Kalau nomor utama kena banned, kamu kehilangan semua chat & kontak.
3. **Fitur `.rvo` (buka view-once)** memanfaatkan celah mekanisme WhatsApp. Celah ini **bisa ditutup kapan saja** oleh WhatsApp, dan pemakaiannya bisa memicu ban.
4. **Fitur `.kick`, `.sw`, `.newgroup`** hanya berfungsi kalau Bot dijadikan **admin grup**. Bot tidak bisa bypass izin grup.
5. **Jangan pakai bot untuk spam, scam, atau aktivitas ilegal.** Segala penyalahgunaan adalah tanggung jawab pengguna.
6. **Developer tidak bertanggung jawab** atas kerusakan, kehilangan data, akun diblokir, atau kerugian lain akibat pemakaian bot ini.
7. **Gunakan dengan risiko sendiri.** Kalau kamu tidak setuju, jangan pakai bot ini.

Dengan mengunduh, menjalankan, atau memakai bot ini, kamu dianggap **sudah membaca dan menyetujui** seluruh poin di atas.

---

## ✨ Fitur

| Command | Fungsi | Syarat |
|---------|--------|--------|
| `.menu` | Tampilkan daftar fitur | — |
| `.kick` | Keluarkan member dari grup | Balas pesan target + Bot admin grup |
| `.newgroup <nama>` | Bikin grup baru | — |
| `.sw` | Ambil link undangan grup | Bot admin grup |
| `.rvo` | Ubah foto/video "sekali lihat" jadi media biasa | Balas media view-once |
| **Chat biasa** | Auto-reply AI | Hanya di chat pribadi |

**Semua fitur bisa dipakai siapa saja**, di grup maupun chat pribadi (kecuali `.kick` & `.sw` yang khusus grup).

Ada juga **welcome message otomatis** saat ada member baru join grup.

---

## 📋 Persyaratan

- Android + **Termux** (bisa di HP)
- **Node.js** versi 18 ke atas
- **FFmpeg**
- Nomor WhatsApp cadangan (yang belum dipakai bot lain)
- Koneksi internet stabil

---

## 🚀 Cara Install & Run

### 1. Install Termux

Download dari **F-Droid**, jangan dari Play Store (versi Play Store sudah usang).

### 2. Install dependensi

Buka Termux, jalankan:

```bash
pkg update && pkg upgrade -y
pkg install nodejs git ffmpeg -y
```

### 3. Clone repo ini

```bash
git clone https://github.com/username/zimzz-ai.git
cd zimzz-ai
```

> Ganti `username` dengan username GitHub kamu.

### 4. Install library Node.js

```bash
npm install
```

Kalau belum ada `package.json`, bikin dulu:

```bash
npm init -y
npm install f-baileys
```

### 5. Edit nomor Bot

Buka `bot.js`, cari baris:

```javascript
phoneNumber: '628xxxxxxxxxx', // ← ganti ke nomor Bot kamu
```

Ganti dengan nomor WhatsApp yang mau dijadikan Bot (format: kode negara + nomor, **tanpa** `+` dan **tanpa** spasi).

Contoh untuk Indonesia: `6281234567890`

### 6. Jalankan Bot

```bash
node bot.js
```

Terminal bakal munculin **kode pairing 8 digit**, contoh: `ABCD-EFGH`.

### 7. Pairing ke WhatsApp

Di HP yang nomornya mau dijadikan Bot:

1. Buka WhatsApp
2. **Setelan** → **Perangkat tertaut** → **Tautkan perangkat**
3. Pilih **Tautkan dengan nomor telepon** (opsi di bawah)
4. Masukkan kode pairing yang muncul di terminal

Kalau berhasil, terminal nampilin:

```
✓ Zimzz-AI sudah terhubung ke WhatsApp
```

### 8. Session tersimpan otomatis

Setelah login, folder `wa-session` bakal dibuat dan nyimpen kredensial. **Jangan dihapus**, karena next-nya nggak perlu pairing lagi — tinggal:

```bash
node bot.js
```

---

## 🔁 Cara Pakai Command

### `.menu`
Kirim `.menu` di chat Bot atau grup. Bot balas daftar fitur.

### `.kick`
1. Di grup, **balas (reply)** pesan orang yang mau di-kick
2. Kirim `.kick`
3. Bot keluarkan orang itu (kalau Bot admin)

### `.newgroup Nama Grup`
Kirim langsung, contoh:
```
.newgroup Grup Belajar Coding
```
Bot bikin grup baru dan kasih ID-nya.

### `.sw`
Di grup, kirim `.sw`. Bot kasih link undangan grup.

### `.rvo`
1. Ada orang kirim **foto/video "sekali lihat"**
2. **Balas (reply)** pesan media itu — **jangan dibuka dulu**
3. Kirim `.rvo`
4. Bot kirim ulang medianya sebagai media biasa (bisa disimpan)

> ⚠️ Kalau medianya sudah kamu buka, WhatsApp hapus dari server dan Bot nggak bisa ambil lagi.

### Chat AI
Kirim pesan biasa (bukan command) ke chat pribadi Bot. Bot balas otomatis dengan respon AI sederhana (berbasis keyword).

---

## ⚙️ Konfigurasi

Semua setting ada di bagian atas `bot.js`:

```javascript
const CONFIG = {
    phoneNumber: '628xxxxxxxxxx', // nomor Bot
    sessionPath: './wa-session',  // folder session
    botName: 'Zimzz-AI',          // nama Bot (muncul di menu)
};
```

---

## 🐛 Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `command not found: node` | Jalankan `pkg install nodejs` |
| Gagal install `f-baileys` | Update Termux dulu: `pkg update && pkg upgrade` |
| Kode pairing nggak muncul | Pastikan `phoneNumber` benar, tanpa `+` |
| Bot nggak balas command | Cek prefix — pakai titik `.`, bukan slash `/` |
| `.kick` gagal | Jadikan Bot **admin** di grup |
| `.sw` gagal | Bot harus admin grup |
| `.rvo` gagal | Balas dulu media view-once-nya sebelum dibuka |
| Welcome nggak muncul | Pastikan Bot ada di grup saat orang baru join |
| Bot disconnect terus | Koneksi internet kurang stabil, atau nomor kena limit |

---

## 📁 Struktur File

```
zimzz-ai/
├── bot.js            # Script utama bot
├── package.json      # Info project & dependensi
├── package-lock.json # Lock versi dependensi
├── .gitignore        # File yang diabaikan git
├── README.md         # Dokumentasi ini
└── wa-session/       # Folder session (TIDAK di-upload ke GitHub)
```

---

## 🤝 Kontribusi

Pull request & issue dipersilakan. Tapi ingat: **bot ini untuk edukasi**, bukan untuk produksi atau aktivitas ilegal.

---

## 📜 Lisensi

MIT License. Pakai dengan risiko sendiri. Lihat bagian **DISCLAIMER** di atas.

---

## ⭐ Catatan Akhir

Kalau bot ini berguna, kasih bintang di repo-nya. Tapi tolong **jangan** pakai buat spam atau ngerugiin orang lain.

**Stay safe, gunakan dengan bijak.** 🙏
