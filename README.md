<div align="center">

<<<<<<< HEAD
# 🌊 Siaga Gempa — Edukasi Kesiapsiagaan Bencana Wilayah Aceh
**Aplikasi Web & Progressive Web App (PWA) Peringatan Dini Bencana Gempa Bumi & Tsunami**

[![Status](https://img.shields.io/badge/System-Online-10B981?style=for-the-badge&logo=icloud&logoColor=white)]()
=======
# ⚡ SiagaGempa - Modern PWA Emergency Platform
**Aplikasi Web & PWA Siaga Darurat Bencana Gempa Bumi Berbasis Real-time**

[![Status Sistem](https://img.shields.io/badge/System-Online-10B981?style=for-the-badge&logo=icloud&logoColor=white)]()
>>>>>>> 682d02fbbdc02aac0ff47485f37481372b722f11
[![PWA Ready](https://img.shields.io/badge/PWA-Supported-06B6D4?style=for-the-badge&logo=pwa&logoColor=white)]()
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)]()

</div>

---

<<<<<<< HEAD
## 📖 Ringkasan Proyek
Aplikasi Web **Siaga Gempa** dibangun dengan antarmuka elegan, responsif untuk ponsel/tablet/laptop, dan berfungsi sebagai Progressive Web App (PWA) yang dapat dipasang di layar utama pengguna layaknya aplikasi native.

Aplikasi ini dirancang khusus untuk mitigasi dan kesiapsiagaan bencana gempa bumi & tsunami di wilayah Aceh dan Sumatra, dengan panduan tiga fase kesiapsiagaan, peta jalur evakuasi, nomor darurat nasional dan daerah, serta integrasi Google Maps.

---

## ✨ Fitur-Fitur Utama

1. **📱 Tampilan Responsif & Desain Modern:**
   - Desain persis seperti referensi visual: Header SG Siaga Gempa, Hero gradient hijau toska gelap, Mockup Smartphone interaktif, 3 Kartu Fitur, Bagian Tiga Fase Kesiapsiagaan, Visual Jalur Evakuasi Aceh, dan Banner Nomor Darurat (112, 117, BMKG).
   - Sepenuhnya responsif untuk smartphone (Android & iPhone), tablet (iPad & Android), maupun laptop/desktop.

2. **⚡ PWA Standalone & Sembunyikan Tombol Pasang Otomatis:**
   - Ketika dibuka melalui browser biasa, tombol **"+ Pasang Aplikasi"** dan **"+ Pasang sebagai Aplikasi"** akan muncul.
   - Begitu pengguna memasang aplikasi ke layar utama (mode *standalone* / *PWA*), tombol pasang akan **otomatis hilang / disembunyikan** karena sudah menjadi aplikasi terpasang di perangkat.

3. **📋 Tata Cara Instalasi Lengkap per Perangkat:**
   - Modal panduan instalasi langkah demi langkah untuk:
     - 📱 **Android**: Buka Chrome -> Menu titik tiga (⋮) -> "Instal aplikasi" / "Tambahkan ke Layar Utama".
     - 💻 **Laptop / PC**: Klik ikon instal di address bar Chrome/Edge atau menu "Simpan dan Bagikan".
     - 📟 **Tablet**: Android Tablet (Chrome) vs Apple iPad (Safari Share -> Add to Home Screen).
     - 🍏 **iPhone (iOS)**: Wajib via Safari -> Tombol Bagikan / Share -> "Tambah ke Layar Utama" (Add to Home Screen).
     - 🖥️ **macOS**: Safari (Menu File -> Tambahkan ke Dock) dan Chrome (Ikon instal di URL bar).

4. **🛡️ Onboarding Perizinan Otomatis (Saat Pertama Masuk):**
   - **Izin Notifikasi Dini**: Untuk menerima peringatan gempa seketika bahkan saat layar terkunci.
   - **Izin Lokasi GPS & Navigasi Google Maps**: Menghitung jarak ke titik kumpul terdekat (Lapangan Blang Padang) dan membuka rute navigasi Google Maps.
   - **Akses Kontak Darurat**: Mendukung Contact Picker API modern atau form simpan kontak keluarga lokal, serta tombol unduh file vCard (.vcf) resmi untuk menyimpan 112, 117, dan BMKG ke buku telepon HP dengan sekali klik.

5. **🚨 Logika Peringatan Gempa Ganda:**
   - **Kondisi 1: Gempa Sangat Kuat Level 3 & Potensi Tsunami di Sumatra / Aceh:**
     - Memenuhi **SELURUH LAYAR HP (Full-Screen Alarm Takeover)** dengan lampu berkedip merah menyala.
     - Suara sirine alarm keras Web Audio API berbunyi secara berulang tanpa henti.
     - Pola getaran darurat HP aktif.
     - Tombol cepat buka rute evakuasi Google Maps dan tombol matikan alarm jika sudah aman.
   - **Kondisi 2: Gempa Biasa / Luar Daerah Sumatra-Aceh (atau < Level 3 Tanpa Tsunami):**
     - **TIDAK MUNCUL ALARM FULL-SCREEN** dan tidak ada sirine panik.
     - Hanya memunculkan notifikasi banner (toast) lembut yang informatif.

6. **🧪 Panel Uji Coba Cepat (Test Bench):**
   - Tombol floating *"Uji Simulasi & Izin"* di sudut kanan bawah untuk menguji kedua skenario secara instan:
     - Uji Gempa Level 3 & Tsunami Aceh (Alarm Penuh)
     - Uji Gempa Biasa Luar Daerah (Toast)
     - Buka Panduan Instalasi
     - Buka Pengaturan Izin
     - Reset Data Normal BMKG

---

## 🚀 Cara Menjalankan Secara Lokal

Cukup jalankan server lokal sederhana:

```bash
# Menggunakan Python 3:
python -m http.server 8080

# Atau menggunakan Node.js (npx serve):
npx serve .
```

Buka peramban di `http://localhost:8080` untuk melihat aplikasi.
=======
## 🚀 Tentang Proyek
**SiagaGempa** adalah platform mitigasi dan peringatan dini bencana gempa bumi modern dengan antarmuka bertema *Deep Obsidian Dark Mode* dan aksen neon dinamis. Dibangun sebagai *Progressive Web App (PWA)* agar dapat diinstal layaknya aplikasi native di perangkat seluler maupun desktop demi kecepatan akses saat situasi darurat.

---

## ✨ Fitur Utama
* **📱 Progressive Web App (PWA):** Dapat diinstal di HP, ringan, serta tetap responsif bahkan saat koneksi internet tidak stabil.
* **🔔 Notifikasi Dini Real-time:** Sistem pemberitahuan otomatis begitu data gempa terbaru terdeteksi.
* **🗺️ Integrasi Peta & Berbagi Lokasi:** Visualisasi titik pusat gempa secara interaktif serta fitur *Share Location* untuk mengirimkan koordinat keberadaan pengguna.
* **⚠️ Klasifikasi Tingkat Bahaya:** Indikator level peringatan dini (Mulai dari Level 1 Rendah, Level 2 Sedang, hingga Level 3 Sangat Bahaya).
* **📨 Pesan Darurat SMS:** Fitur tombol darurat yang memicu format pesan teks cepat ke nomor kontak penting saat jaringan internet terputus.

---

## 🛠️ Teknologi yang Digunakan
* **Frontend:** HTML5, CSS3 (Modern Grid & Glassmorphism), JavaScript (ES6+)
* **Database:** MySQL / phpMyAdmin (`database.sql`)
* **PWA Features:** Service Worker, Manifest.json

---

## ⚙️ Cara Instalasi & Menjalankan Proyek

1. **Clone Repository Ini:**
   ```bash
   git clone [https://github.com/Asya-Code2146/SiagaGempa.git](https://github.com/Asya-Code2146/SiagaGempa.git)
>>>>>>> 682d02fbbdc02aac0ff47485f37481372b722f11
