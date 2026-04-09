# Sebelum Go Live

Checklist singkat ini dipakai sebelum aplikasi benar-benar digunakan user.

## 1. Config

- [ ] `API/appsettings.Production.json` sudah diisi benar
- [ ] `client/.env.production` sudah diisi benar
- [ ] tidak ada placeholder `YOUR_*`
- [ ] `DefaultConnection` tidak kosong
- [ ] `Runtime:AspNetCoreUrls` tidak kosong
- [ ] `VITE_API_BASE_URL` tidak kosong
- [ ] `WhatsAppGateway:PublicBaseUrl` tidak kosong
- [ ] `VITE_API_BASE_URL` dan `WhatsAppGateway:PublicBaseUrl` sudah mengarah ke API yang sama

## 2. Server

- [ ] API bisa dijalankan dengan mode `Production`
- [ ] API listen di alamat/port yang sesuai dengan `Runtime:AspNetCoreUrls`
- [ ] frontend hasil build sudah tersalin ke lokasi publish
- [ ] folder `wwwroot/uploads` ada dan bisa ditulis
- [ ] server bisa akses database
- [ ] firewall / port server sudah dibuka sesuai kebutuhan

## 3. Database

- [ ] database tujuan benar
- [ ] user SQL punya hak akses yang cukup
- [ ] tabel penting sudah ada
- [ ] data master awal sudah tersedia bila dibutuhkan

## 4. Browser / Network

- [ ] `AllowedOrigins` sudah sesuai alamat frontend
- [ ] `AllowedOrigins` berisi alamat frontend, bukan alamat backend/API
- [ ] frontend bisa login ke API
- [ ] frontend tidak lagi mengarah ke `localhost` jika dibuka dari komputer lain
- [ ] file upload / image / audio bisa dibuka dari browser client

## 5. Fitur Utama

- [ ] login berhasil
- [ ] menu sidebar tampil sesuai hak akses
- [ ] master user bisa dibuka
- [ ] application setting bisa dibuka dan disimpan
- [ ] TR Birthday Pray bisa dibuka
- [ ] upload gambar / audio berjalan normal

## 6. Scheduler / Integrasi

- [ ] `WhatsAppGateway:Url` sudah benar jika dipakai
- [ ] `WhatsAppGateway:Token` sudah benar jika dipakai
- [ ] `WhatsAppGateway:PublicBaseUrl` sudah mengarah ke URL API yang bisa diakses client/gateway
- [ ] link file/gambar/audio yang dibagikan aplikasi membuka host yang benar, bukan `localhost` atau IP lama
- [ ] proses scheduler jalan tanpa error

## 7. Deploy Final

- [ ] jalankan `MENU_DEPLOY.bat`
- [ ] pilih `Cek Config Production`
- [ ] jalankan publish production
- [ ] jalankan API production
- [ ] lakukan test singkat setelah publish

## 8. Backup

- [ ] simpan backup file config production
- [ ] simpan backup database sebelum go live bila diperlukan
- [ ] simpan backup folder upload lama bila ada migrasi server

## 9. Cek Cepat Error Umum

- [ ] tidak ada `localhost` tersisa pada config live kecuali memang server diakses lokal
- [ ] tidak ada IP/server lama yang masih tertinggal di `PublicBaseUrl`
- [ ] port API yang dipakai benar-benar bisa diakses dari komputer user
- [ ] skema `http/https` frontend dan API sudah konsisten
- [ ] jika hosting baru memakai host/IP/domain berbeda, `VITE_API_BASE_URL`, `AllowedOrigins`, dan `PublicBaseUrl` sudah ikut diperbarui
