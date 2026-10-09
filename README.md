<div align="center">

# 🌊 Siaga Gempa — Edukasi Kesiapsiagaan Bencana Wilayah Aceh
**Aplikasi Web & Progressive Web App (PWA) Peringatan Dini Bencana Gempa Bumi & Tsunami**

[![Status](https://img.shields.io/badge/System-Online-10B981?style=for-the-badge&logo=icloud&logoColor=white)]()
[![PWA Ready](https://img.shields.io/badge/PWA-Supported-06B6D4?style=for-the-badge&logo=pwa&logoColor=white)]()
[![BMKG Verified](https://img.shields.io/badge/Data_Feed-BMKG_InaTEWS-0284C7?style=for-the-badge)]()
[![HAKI Protected](https://img.shields.io/badge/HAKI-UU_No._28_Tahun_2014-4F46E5?style=for-the-badge)]()

</div>

---

## 📖 Ringkasan Proyek
Aplikasi Web **Siaga Gempa** adalah platform informasi gempa bumi, sistem peringatan dini, dan edukasi kesiapsiagaan bencana terintegrasi data BMKG (Badan Meteorologi, Klimatologi, dan Geofisika).

Dibangun dengan arsitektur frontend HTML5, CSS3, dan Vanilla JavaScript, didukung oleh backend PHP native dan basis data MySQL, serta kompatibel untuk deployment serverless Vercel dan web hosting PHP.

Website produksi: https://siaga-gempa-five.vercel.app/

---

## ✨ Fitur-Fitur Utama

1. **📡 Sistem Data Gempa BMKG Real-Time:**
   - Mengambil data resmi BMKG (Autogempa, Gempa Dirasakan, dan Gempa Terkini M 5.0+).
   - Pembaruan otomatis setiap 60 detik disertai penghitung mundur waktu nyata.
   - Indikator status sinkronisasi: Tersinkron BMKG, Mode Offline, atau Data Cache Degradasi.
   - Deduplikasi data berbasis identitas unik lokasi dan waktu kejadian.
   - Pembedaan data simulasi/drill versus kejadian nyata untuk mencegah kepanikan publik.

2. **🌊 Sistem Peringatan Dini & Klasifikasi Bahaya Resmi:**
   - Membedakan informasi gempa biasa, waspada M 6.0+, dan peringatan dini tsunami resmi BMKG.
   - Mendeteksi status peringatan tsunami: Aktif (Active Warning), Dicabut/Berakhir (Ended), atau Aman (No Tsunami).
   - Full-Screen Alarm Takeover dengan sirine Web Audio API dan getaran hanya aktif jika terdapat potensi tsunami nyata atau gempa destruktif terverifikasi.

3. **🗺️ Peta Interaktif Episentrum & Titik Evakuasi (Leaflet):**
   - Menampilkan titik episentrum gempa riil dari koordinat BMKG lengkap dengan popup informasi magnitudo, kedalaman, dan radius getaran.
   - Filter data berdasarkan Zona Sumatra-Aceh, Magnitudo M 5.0+, dan Potensi Tsunami.
   - Responsif di seluruh ukuran layar ponsel, tablet, dan komputer desktop.

4. **📍 Smart Evacuation Routing — Google Maps Integration:**
   - Deteksi posisi pengguna menggunakan HTML5 Geolocation API dengan izin eksplisit.
   - Pilihan pemilihan wilayah manual jika GPS tidak aktif atau izin ditolak.
   - Daftar shelter keselamatan resmi terverifikasi: Gedung Evakuasi Vertikal Tsunami (TES Lambung, TES Deah Glumpang, TES Alue Deah Teungoh, TDMRC USK), Dataran Tinggi Bukit Mata Ie, Lapangan Blang Padang, dan Stadion Harapan Bangsa.
   - Perhitungan jarak matematis Haversine, estimasi waktu tempuh jalan kaki (~4.5 km/jam) dan berkendara (~30 km/jam).
   - Penentuan rute aman cerdas: Jika ancaman tsunami aktif, sistem memprioritaskan gedung vertikal TES dan bukit serta memperingatkan pengguna untuk menjauhi area datar pesisir.
   - Tombol satu ketukan buka rute Google Maps langsung (mode jalan kaki dan berkendara).

5. **🤖 AI Seismic Analyst & Modul Edukasi:**
   - Analisis statistik deskriptif dari data observasi BMKG aktual (distribusi kedalaman dangkal/menengah/dalam, sebaran magnitudo, dan frekuensi zona busur Sumatra).
   - Sintesis penjelasan ilmiah dalam bahasa Indonesia yang objektif tanpa klaim ramalan palsu.
   - Pusat tanya jawab interaktif kesiapsiagaan (gempa susulan, fenomena gempa dangkal, tanda alami tsunami pesisir, dan standar tas siaga bencana).

6. **🎒 Mode Darurat Offline & Kesiapsiagaan Keluarga:**
   - Panduan tiga fase keselamatan (Sebelum, Saat, Sesudah gempa).
   - Checklist digital Tas Siaga Bencana 72 jam mandiri tersimpan di localStorage.
   - Konfirmasi keselamatan keluarga ("Saya Aman") dengan tautan lokasi GPS opsional via WhatsApp dan SMS tanpa pengumpulan data pribadi.
   - Tombol unduh file kontak vCard darurat (112 Darurat Nasional, 117 BPBD Aceh, 196 BMKG).
   - Dukungan Progressive Web App (PWA) dan Service Worker cache offline.

7. **⚖️ Perlindungan Hak Kekayaan Intelektual (HAKI):**
   - Dilindungi Undang-Undang Republik Indonesia Nomor 28 Tahun 2014 tentang Hak Cipta.
   - Dilindungi Undang-Undang Republik Indonesia Nomor 11 Tahun 2008 jo. UU Nomor 1 Tahun 2024 tentang ITE.
   - Atribusi resmi terbuka kepada BMKG Indonesia, BNPB, BPBD Kota Banda Aceh, dan TDMRC Universitas Syiah Kuala.
   - Modal informasi HAKI, Kebijakan Privasi GPS tanpa pelacakan, dan Batasan Tanggung Jawab (Disclaimer Kebencanaan) terpasang di antarmuka web.

---

## 🗄️ Struktur Database MySQL

File skema database tersedia di `database/database.sql`:
- `earthquakes`: Menyimpan riwayat kejadian gempa BMKG dengan kolom event_id unik, magnitudo, kedalaman, koordinat, potensi tsunami, status peringatan tsunami, dan penanda simulasi.
- `evacuation_shelters`: Titik shelter vertikal tsunami dan titik kumpul terverifikasi beserta kapasitas, elevasi, dan koordinat.
- `devices`: Menyimpan endpoint langganan Web Push Notification jika diaktifkan.
- `sync_logs`: Catatan log sinkronisasi feed API BMKG.

---

## 🚀 Panduan Menjalankan

### Frontend (Lokal / Vercel):
```bash
npx serve .
```
Atau buka langsung file `index.html` pada peramban modern.

### Backend PHP:
Impor file `database/database.sql` ke MySQL database server Anda, lalu sesuaikan kredensial koneksi melalui environment variable (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_PORT`) di hosting backend.

---

## ⚖️ Hak Cipta
Hak Cipta © 2024–2026 Siaga Gempa. Seluruh Hak Cipta dan Hak Kekayaan Intelektual Dilindungi Undang-Undang Republik Indonesia.
