# Changelog Deploy Setup

Dokumen ini merangkum perubahan yang sudah ditambahkan untuk merapikan proses konfigurasi dan publish project.

## 1. Pemisahan Config Berdasarkan Mode

Frontend:

- `client/.env.development`
- `client/.env.production`
- `client/.env.development.sample`
- `client/.env.production.sample`

Backend:

- `API/appsettings.json`
- `API/appsettings.Development.json`
- `API/appsettings.Production.json`
- `API/appsettings.Development.sample.json`
- `API/appsettings.Production.sample.json`

## 2. Helper Config Pusat Frontend

Ditambahkan:

- [appConfig.ts](/d:/KANTOR/Project%20VB/WEB%20DOA/client/src/config/appConfig.ts)

Fungsi:

- menyatukan pembacaan `VITE_API_BASE_URL`
- menyatukan pembentukan URL media/file upload
- mengurangi hardcode URL di banyak halaman

## 3. Refactor URL Frontend

Pemakaian URL API / media dirapikan pada:

- [http.ts](/d:/KANTOR/Project%20VB/WEB%20DOA/client/src/api/http.ts)
- [ApplicationSetting.tsx](/d:/KANTOR/Project%20VB/WEB%20DOA/client/src/Pages/Tools/ApplicationSetting.tsx)
- [TRBirthdayPray.tsx](/d:/KANTOR/Project%20VB/WEB%20DOA/client/src/Pages/Transaction/TRBirthdayPray.tsx)
- [MasterBarang.tsx](/d:/KANTOR/Project%20VB/WEB%20DOA/client/src/Pages/Master/MasterBarang.tsx)

## 4. Refactor CORS Backend

Di [Program.cs](/d:/KANTOR/Project%20VB/WEB%20DOA/API/Program.cs):

- CORS tidak lagi hardcoded langsung di source
- origin frontend sekarang dibaca dari:
  - `AppClient:AllowedOrigins`

## 5. Script Deploy

Ditambahkan script:

- [MENU_DEPLOY.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/MENU_DEPLOY.bat)
- [prepare-development-config.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/scripts/deploy/prepare-development-config.bat)
- [publish-development.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/scripts/deploy/publish-development.bat)
- [start-api-development.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/scripts/deploy/start-api-development.bat)
- [prepare-production-config.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/scripts/deploy/prepare-production-config.bat)
- [publish-production.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/scripts/deploy/publish-production.bat)
- [start-api-production.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/scripts/deploy/start-api-production.bat)
- [clean-publish.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/scripts/deploy/clean-publish.bat)

## 6. Checker Config

Script publish sekarang akan memeriksa:

- file config aktif ada atau belum
- masih ada placeholder `YOUR_*` atau tidak
- `DefaultConnection` kosong atau tidak
- `VITE_API_BASE_URL` kosong atau tidak

Checker tersedia juga dari:

- menu `Cek Config Development`
- menu `Cek Config Production`

## 7. Struktur Folder Script

Script teknis dipindahkan ke:

- `scripts/deploy`

Tujuan:

- root project lebih rapi
- tetap mudah dipakai karena ada `MENU_DEPLOY.bat` di root

## 8. Dokumentasi Deploy

Ditambahkan dokumen:

- [README_PUBLISH_SINGKAT.md](/d:/KANTOR/Project%20VB/WEB%20DOA/README_PUBLISH_SINGKAT.md)
- [DEPLOYMENT_CONFIG.md](/d:/KANTOR/Project%20VB/WEB%20DOA/DEPLOYMENT_CONFIG.md)
- [SEBELUM_GO_LIVE.md](/d:/KANTOR/Project%20VB/WEB%20DOA/SEBELUM_GO_LIVE.md)
- [CHANGELOG_DEPLOY_SETUP.md](/d:/KANTOR/Project%20VB/WEB%20DOA/CHANGELOG_DEPLOY_SETUP.md)

## 9. Tujuan Akhir

Dengan setup ini:

- titik ubah config menjadi lebih terpusat
- development dan production punya pola yang sama
- proses publish lebih aman karena ada checker
- tim operasional bisa memakai menu deploy tanpa harus memahami detail source code
