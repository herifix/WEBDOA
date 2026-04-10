# Panduan Publish Singkat

Panduan ini dibuat supaya aplikasi bisa dipindahkan ke komputer/server lain dengan langkah sederhana.

## Ringkasan Fitur Deploy

Semua proses deploy sekarang bisa dijalankan dari:

- [MENU_DEPLOY.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/MENU_DEPLOY.bat)

Fitur yang tersedia:

- `Prepare Config Development`
  Membuat file config development aktif dari file sample jika belum ada.

- `Cek Config Development`
  Mengecek apakah config development masih berisi placeholder `YOUR_*` atau value penting masih kosong.

- `Publish Development`
  Build frontend mode development dan publish backend ke folder `publish/development`.

- `Start API Development`
  Menjalankan API dengan mode `Development`.

- `Prepare Config Production`
  Membuat file config production aktif dari file sample jika belum ada.

- `Cek Config Production`
  Mengecek apakah config production masih berisi placeholder `YOUR_*` atau value penting masih kosong.

- `Publish Production`
  Build frontend mode production dan publish backend ke folder `publish/production`.

- `Start API Production`
  Menjalankan API dengan mode `Production`.

- `Clean Folder Publish`
  Menghapus folder hasil publish development dan production supaya bisa mulai dari output bersih.

- `Buka README Publish Singkat`
  Membuka panduan ini.

- `Buka Deployment Config`
  Membuka dokumen konfigurasi lebih detail di [DEPLOYMENT_CONFIG.md](/d:/KANTOR/Project%20VB/WEB%20DOA/DEPLOYMENT_CONFIG.md).

Cara termudah:

- jalankan [MENU_DEPLOY.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/MENU_DEPLOY.bat)
- lalu pilih nomor sesuai kebutuhan
- sebelum publish development, jalankan dulu menu `Cek Config Development`
- sebelum publish live, jalankan dulu menu `Cek Config Production`
- checker sekarang mendeteksi placeholder `YOUR_*` dan value penting yang masih kosong
- jika ingin mulai dari output bersih, jalankan menu `Clean Folder Publish`

## A. Jika untuk komputer development / test

Catatan penting:

- `client/.env.development` dipakai untuk coding harian dengan `npm run dev`
- `client/.env.devpublish` dipakai khusus untuk `publish-development.bat`
- jadi konfigurasi deploy development tidak lagi menimpa konfigurasi coding harian

### A1. Development coding harian

File [client/.env.development](/d:/KANTOR/Project%20VB/WEB%20DOA/client/.env.development)
```env
VITE_API_BASE_URL=https://localhost:7125
VITE_API_PROXY_TARGET=http://127.0.0.1:5178
```

Ini mengikuti API local dari [launchSettings.json](/d:/KANTOR/Project%20VB/WEB%20DOA/API/Properties/launchSettings.json).

### A2. Development hasil publish

1. Buka file [client/.env.devpublish](/d:/KANTOR/Project%20VB/WEB%20DOA/client/.env.devpublish)
   Isi `VITE_API_BASE_URL` sesuai alamat API.
   Untuk contoh default paket publish development ini, gunakan `http://127.0.0.1:5000`.

   Jika belum ada, bisa mulai dari:
   - [client/.env.devpublish.sample](/d:/KANTOR/Project%20VB/WEB%20DOA/client/.env.devpublish.sample)

2. Buka file [API/appsettings.Development.json](/d:/KANTOR/Project%20VB/WEB%20DOA/API/appsettings.Development.json)
   Isi:
   - `ConnectionStrings:DefaultConnection`
   - `Runtime:AspNetCoreUrls`
   - `AppClient:AllowedOrigins`
   - `WhatsAppGateway:PublicBaseUrl`

   Agar konsisten dengan contoh publish development, samakan:
   - `Runtime:AspNetCoreUrls = http://127.0.0.1:5000`
   - `WhatsAppGateway:PublicBaseUrl = http://127.0.0.1:5000`

   Jika belum ada, bisa mulai dari:
   - [API/appsettings.Development.sample.json](/d:/KANTOR/Project%20VB/WEB%20DOA/API/appsettings.Development.sample.json)

   Atau jalankan dulu:
   - [prepare-development-config.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/scripts/deploy/prepare-development-config.bat)

3. Jalankan file:
   - cek dulu config development dari [MENU_DEPLOY.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/MENU_DEPLOY.bat)
   - lalu jalankan
   - [publish-development.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/scripts/deploy/publish-development.bat)

4. Setelah selesai, jalankan:
   - [start-api-development.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/scripts/deploy/start-api-development.bat)
   - script ini akan membaca `Runtime:AspNetCoreUrls` dari `appsettings.Development.json` lalu otomatis memasangnya ke `ASPNETCORE_URLS`

5. Ambil hasil publish dari folder:
   - `publish/development/client`
   - `publish/development/api`

Script yang dipakai di belakang layar:

- [prepare-development-config.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/scripts/deploy/prepare-development-config.bat)
- [publish-development.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/scripts/deploy/publish-development.bat)
- [start-api-development.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/scripts/deploy/start-api-development.bat)

## B. Jika untuk server live

1. Buka file [client/.env.production](/d:/KANTOR/Project%20VB/WEB%20DOA/client/.env.production)
   Isi `VITE_API_BASE_URL` dengan alamat API live.

   Jika mau lebih aman, mulai dari template:
   - [client/.env.production.sample](/d:/KANTOR/Project%20VB/WEB%20DOA/client/.env.production.sample)

2. Buka file [API/appsettings.Production.json](/d:/KANTOR/Project%20VB/WEB%20DOA/API/appsettings.Production.json)
   Isi:
   - `ConnectionStrings:DefaultConnection`
   - `Runtime:AspNetCoreUrls`
   - `AppClient:AllowedOrigins`
   - `WhatsAppGateway:Url`
   - `WhatsAppGateway:Token`
   - `WhatsAppGateway:PublicBaseUrl`

   Jika mau lebih aman, mulai dari template:
   - [API/appsettings.Production.sample.json](/d:/KANTOR/Project%20VB/WEB%20DOA/API/appsettings.Production.sample.json)

   Atau jalankan dulu:
   - [prepare-production-config.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/scripts/deploy/prepare-production-config.bat)
   supaya file aktif dibuat otomatis dari sample jika belum ada.

3. Jalankan file:
   - cek dulu config live dari [MENU_DEPLOY.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/MENU_DEPLOY.bat)
     atau pastikan file tidak lagi berisi `YOUR_*`
   - lalu jalankan
   - [publish-production.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/scripts/deploy/publish-production.bat)

4. Setelah selesai, jalankan:
   - [start-api-production.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/scripts/deploy/start-api-production.bat)
   - script ini akan membaca `Runtime:AspNetCoreUrls` dari `appsettings.Production.json` lalu otomatis memasangnya ke `ASPNETCORE_URLS`

5. Ambil hasil publish dari folder:
   - `publish/production/client`
   - `publish/production/api`

Script yang dipakai di belakang layar:

- [prepare-production-config.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/scripts/deploy/prepare-production-config.bat)
- [publish-production.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/scripts/deploy/publish-production.bat)
- [start-api-production.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/scripts/deploy/start-api-production.bat)

## C. Yang paling penting untuk diganti

Frontend:

- `VITE_API_BASE_URL`

Backend:

- `DefaultConnection`
- `Runtime:AspNetCoreUrls`
- `AllowedOrigins`
- `PublicBaseUrl`

Catatan sinkronisasi:

- `VITE_API_BASE_URL` sebaiknya menunjuk ke URL API yang sama dengan `WhatsAppGateway:PublicBaseUrl`
- `Runtime:AspNetCoreUrls` adalah alamat bind server API saat dijalankan
- untuk akses dari komputer lain, biasanya `Runtime:AspNetCoreUrls` dibuat `http://0.0.0.0:5000`, lalu `VITE_API_BASE_URL` dan `PublicBaseUrl` diisi alamat host/IP server yang benar, misalnya `http://192.168.1.10:5000`

Jika host/IP/domain hosting berubah lagi di kemudian hari, cek dan ubah minimal file berikut:

- [client/.env.production](/d:/KANTOR/Project%20VB/WEB%20DOA/client/.env.production)
- [API/appsettings.Production.json](/d:/KANTOR/Project%20VB/WEB%20DOA/API/appsettings.Production.json)

Field yang biasanya wajib ikut disesuaikan:

- `VITE_API_BASE_URL`
- `AppClient:AllowedOrigins`
- `WhatsAppGateway:PublicBaseUrl`

Jika UI dan API dipindah ke host baru, lakukan publish ulang setelah nilai-nilai di atas diperbarui.

## D. Kalau setelah pindah server aplikasi tidak bisa dibuka

Periksa urutan ini:

1. API sudah jalan atau belum
2. IP / domain API sudah benar atau belum
3. CORS `AllowedOrigins` sudah sesuai atau belum
4. Database server bisa diakses atau belum
5. Folder `wwwroot/uploads` punya izin tulis atau belum

## E. Contoh Konfigurasi Siap Pakai

### 1. Lokal 1 komputer

Jika frontend dan backend dijalankan di komputer yang sama:

File [client/.env.development](/d:/KANTOR/Project%20VB/WEB%20DOA/client/.env.development)
```env
VITE_API_BASE_URL=https://localhost:7125
VITE_API_PROXY_TARGET=http://127.0.0.1:5178
```

File [client/.env.devpublish](/d:/KANTOR/Project%20VB/WEB%20DOA/client/.env.devpublish)
```env
VITE_API_BASE_URL=http://127.0.0.1:5000
VITE_API_PROXY_TARGET=http://127.0.0.1:5000
```

File [API/appsettings.Development.json](/d:/KANTOR/Project%20VB/WEB%20DOA/API/appsettings.Development.json)
```json
"Runtime": {
  "AspNetCoreUrls": "http://127.0.0.1:5000"
},
"WhatsAppGateway": {
  "PublicBaseUrl": "http://127.0.0.1:5000"
}
```

### 2. Server LAN kantor

Jika backend dijalankan di server kantor dan diakses komputer lain dalam jaringan:

Contoh IP server: `192.168.1.10`

File [client/.env.production](/d:/KANTOR/Project%20VB/WEB%20DOA/client/.env.production)
```env
VITE_API_BASE_URL=http://192.168.1.10:5000
VITE_API_PROXY_TARGET=http://192.168.1.10:5000
```

File [API/appsettings.Production.json](/d:/KANTOR/Project%20VB/WEB%20DOA/API/appsettings.Production.json)
```json
"Runtime": {
  "AspNetCoreUrls": "http://0.0.0.0:5000"
},
"AppClient": {
  "AllowedOrigins": [
    "http://192.168.1.10",
    "http://192.168.1.10:5000"
  ]
},
"WhatsAppGateway": {
  "PublicBaseUrl": "http://192.168.1.10:5000"
}
```

### 3. Server live dengan domain internet

Jika backend diakses lewat domain:

Contoh domain API: `https://api.domainanda.com`
Contoh domain frontend: `https://app.domainanda.com`

File [client/.env.production](/d:/KANTOR/Project%20VB/WEB%20DOA/client/.env.production)
```env
VITE_API_BASE_URL=https://api.domainanda.com
VITE_API_PROXY_TARGET=https://api.domainanda.com
```

File [API/appsettings.Production.json](/d:/KANTOR/Project%20VB/WEB%20DOA/API/appsettings.Production.json)
```json
"Runtime": {
  "AspNetCoreUrls": "http://0.0.0.0:5000"
},
"AppClient": {
  "AllowedOrigins": [
    "https://app.domainanda.com"
  ]
},
"WhatsAppGateway": {
  "PublicBaseUrl": "https://api.domainanda.com"
}
```

Catatan:

- `AspNetCoreUrls` adalah alamat bind server, bukan selalu alamat yang diketik user di browser
- untuk mode domain/live, sering kali aplikasi tetap bind ke `0.0.0.0:5000`, lalu domain diarahkan ke sana lewat IIS, reverse proxy, atau port forwarding

### 4. IIS satu domain dengan subpath API

Jika UI dibuka dari `http://172.16.1.254/` dan API harus dibuka dari `http://172.16.1.254/api/swagger/index.html`:

File [client/.env.production](/d:/KANTOR/Project%20VB/WEB%20DOA/client/.env.production)
```env
VITE_API_BASE_URL=http://172.16.1.254
VITE_API_PROXY_TARGET=http://172.16.1.254
```

File [API/appsettings.Production.json](/d:/KANTOR/Project%20VB/WEB%20DOA/API/appsettings.Production.json)
```json
"Runtime": {
  "AspNetCoreUrls": "http://0.0.0.0:5000"
},
"AppClient": {
  "AllowedOrigins": [
    "http://172.16.1.254"
  ]
},
"WhatsAppGateway": {
  "PublicBaseUrl": "http://172.16.1.254/api"
}
```

Setup IIS:

- Site utama arahkan ke folder `publish/production/client`
- Buat `Application` baru dengan alias `api`
- Alias `api` arahkan ke folder `publish/production/api`
- App Pool untuk `api` gunakan `No Managed Code`
- Install ASP.NET Core Hosting Bundle di server IIS
- Setelah itu tes `http://172.16.1.254/api/swagger/index.html`

Catatan:

- `AllowedOrigins` harus berisi origin frontend saja, misalnya `http://172.16.1.254`, bukan `http://172.16.1.254/api`
- frontend cukup mengarah ke `http://172.16.1.254` karena source code client sudah memanggil endpoint dengan prefix `"/api/..."`
- jangan isi `VITE_API_BASE_URL=http://172.16.1.254/api` jika request di code masih memakai `"/api/..."`
- `WhatsAppGateway:PublicBaseUrl` tetap harus `.../api` karena dipakai backend untuk membentuk link file/audio publik

## F. Tabel Ringkas Nilai Config

| Skenario | `Runtime:AspNetCoreUrls` | `WhatsAppGateway:PublicBaseUrl` | `VITE_API_BASE_URL` | `AllowedOrigins` |
| --- | --- | --- | --- | --- |
| Dev coding harian | `https://localhost:7125;http://localhost:5178` | sesuaikan kebutuhan file publik | `https://localhost:7125` | origin frontend lokal, mis. `http://localhost:5173` |
| Lokal 1 komputer | `http://127.0.0.1:5000` | `http://127.0.0.1:5000` | `http://127.0.0.1:5000` | origin frontend lokal, mis. `http://localhost:5173` |
| Server LAN kantor | `http://0.0.0.0:5000` | `http://192.168.1.10:5000` | `http://192.168.1.10:5000` | origin frontend LAN yang dipakai user |
| Server live domain | `http://0.0.0.0:5000` | `https://api.domainanda.com` | `https://api.domainanda.com` | domain frontend, mis. `https://app.domainanda.com` |

Cara baca tabel:

- `AspNetCoreUrls` menentukan API listen di server
- `PublicBaseUrl` menentukan link publik yang dibagikan aplikasi
- `VITE_API_BASE_URL` menentukan ke mana frontend mengirim request
- `AllowedOrigins` harus berisi alamat frontend yang membuka aplikasi, bukan alamat database atau alamat backend

## G. Utility Tambahan

- Bersihkan hasil publish:
  [clean-publish.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/scripts/deploy/clean-publish.bat)

- Dokumen konfigurasi lebih lengkap:
  [DEPLOYMENT_CONFIG.md](/d:/KANTOR/Project%20VB/WEB%20DOA/DEPLOYMENT_CONFIG.md)

- Checklist sebelum live:
  [SEBELUM_GO_LIVE.md](/d:/KANTOR/Project%20VB/WEB%20DOA/SEBELUM_GO_LIVE.md)

- Ringkasan perubahan setup deploy:
  [CHANGELOG_DEPLOY_SETUP.md](/d:/KANTOR/Project%20VB/WEB%20DOA/CHANGELOG_DEPLOY_SETUP.md)

- Ringkasan akhir 1 halaman:
  [RINGKASAN_DEPLOY_FINAL.md](/d:/KANTOR/Project%20VB/WEB%20DOA/RINGKASAN_DEPLOY_FINAL.md)

## H. Kesalahan Yang Paling Sering

- `AllowedOrigins` diisi alamat backend/API.
  Yang benar: isi dengan alamat frontend yang membuka aplikasi.

- host/IP/domain sudah berubah, tapi `VITE_API_BASE_URL`, `AllowedOrigins`, atau `PublicBaseUrl` masih memakai alamat lama.
  Akibatnya UI, API, CORS, atau link file masih mengarah ke server sebelumnya.

- `VITE_API_BASE_URL` masih `localhost` padahal frontend dibuka dari komputer lain.
  Akibatnya browser user lain tetap mencoba mengakses API di komputernya sendiri.

- `WhatsAppGateway:PublicBaseUrl` masih `localhost` atau IP lama.
  Akibatnya link file, audio, atau gambar dari API bisa salah alamat.

- `Runtime:AspNetCoreUrls` sudah benar, tapi firewall server belum membuka port `5000`.
  Akibatnya API terlihat jalan di server, tapi tidak bisa diakses dari komputer lain.

- `Runtime:AspNetCoreUrls` diisi IP spesifik yang tidak ada di server.
  Pilihan aman biasanya `http://0.0.0.0:5000` untuk server LAN/live.

- frontend diarahkan ke `https://...` tapi API sebenarnya hanya listen di `http://...`.
  Pastikan skema `http/https` konsisten dengan cara API dipublish.

- publish berhasil, tapi folder `wwwroot/uploads` tidak ikut dipindah atau tidak punya izin tulis.
  Akibatnya upload gambar, audio, atau file lain gagal atau tidak tampil.

- `DefaultConnection` benar formatnya, tapi SQL Server menolak koneksi dari server aplikasi.
  Cek nama server, user/password, firewall SQL, dan hak akses database.

- frontend berhasil dibuka, tapi semua request gagal `CORS`.
  Biasanya karena `AllowedOrigins` belum memuat domain/frontend host yang sebenarnya dipakai user.

- domain frontend sudah benar, tapi `PublicBaseUrl` masih pakai IP internal.
  Akibatnya link yang dibagikan keluar jaringan lokal menjadi tidak valid.

## I. Catatan

- `README_PUBLISH_SINGKAT.md` ini sekarang merangkum semua proses utama dan semua fitur script deploy.
- `DEPLOYMENT_CONFIG.md` tetap dipakai sebagai referensi yang lebih detail kalau Anda butuh melihat struktur konfigurasi lebih lengkap.
