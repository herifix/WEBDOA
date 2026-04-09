# Deployment Config

Dokumen ini adalah referensi teknis detail.

Untuk langkah operasional harian, gunakan:

- [README_PUBLISH_SINGKAT.md](/d:/KANTOR/Project%20VB/WEB%20DOA/README_PUBLISH_SINGKAT.md)
- [MENU_DEPLOY.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/MENU_DEPLOY.bat)
- [SEBELUM_GO_LIVE.md](/d:/KANTOR/Project%20VB/WEB%20DOA/SEBELUM_GO_LIVE.md)
- [CHANGELOG_DEPLOY_SETUP.md](/d:/KANTOR/Project%20VB/WEB%20DOA/CHANGELOG_DEPLOY_SETUP.md)

## Tujuan

Konfigurasi deploy dipisah berdasarkan mode:

- `Development`
- `Production`

Frontend mengikuti mode Vite, backend mengikuti `ASPNETCORE_ENVIRONMENT`.

## Frontend

Lokasi konfigurasi:

- [appConfig.ts](/d:/KANTOR/Project%20VB/WEB%20DOA/client/src/config/appConfig.ts)
- [vite.config.ts](/d:/KANTOR/Project%20VB/WEB%20DOA/client/vite.config.ts)
- [.env.development](/d:/KANTOR/Project%20VB/WEB%20DOA/client/.env.development)
- [.env.devpublish](/d:/KANTOR/Project%20VB/WEB%20DOA/client/.env.devpublish)
- [.env.production](/d:/KANTOR/Project%20VB/WEB%20DOA/client/.env.production)
- [.env.development.sample](/d:/KANTOR/Project%20VB/WEB%20DOA/client/.env.development.sample)
- [.env.devpublish.sample](/d:/KANTOR/Project%20VB/WEB%20DOA/client/.env.devpublish.sample)
- [.env.production.sample](/d:/KANTOR/Project%20VB/WEB%20DOA/client/.env.production.sample)

Variable utama:

- `VITE_API_BASE_URL`
- `VITE_API_PROXY_TARGET`

Catatan:

- `VITE_API_BASE_URL` dipakai frontend saat mengakses API yang sudah dipublish
- `VITE_API_PROXY_TARGET` dipakai saat development tooling/proxy
- `.env.development` dipakai untuk coding harian (`npm run dev`)
- `.env.devpublish` dipakai khusus untuk `publish-development.bat`

Build command:

- `npm run build:development`
- `npm run build:devpublish`
- `npm run build:production`

## Backend

Lokasi konfigurasi:

- [appsettings.json](/d:/KANTOR/Project%20VB/WEB%20DOA/API/appsettings.json)
- [appsettings.Development.json](/d:/KANTOR/Project%20VB/WEB%20DOA/API/appsettings.Development.json)
- [appsettings.Production.json](/d:/KANTOR/Project%20VB/WEB%20DOA/API/appsettings.Production.json)
- [appsettings.Development.sample.json](/d:/KANTOR/Project%20VB/WEB%20DOA/API/appsettings.Development.sample.json)
- [appsettings.Production.sample.json](/d:/KANTOR/Project%20VB/WEB%20DOA/API/appsettings.Production.sample.json)

Setting utama backend:

- `ConnectionStrings:DefaultConnection`
- `Runtime:AspNetCoreUrls`
- `AppClient:AllowedOrigins`
- `WhatsAppGateway:Url`
- `WhatsAppGateway:Token`
- `WhatsAppGateway:PublicBaseUrl`

Hubungan antar setting URL:

- `Runtime:AspNetCoreUrls` menentukan API bind ke alamat/port mana saat dijalankan
- `WhatsAppGateway:PublicBaseUrl` menentukan URL publik yang dibagikan aplikasi untuk file/link dari API
- `VITE_API_BASE_URL` di frontend sebaiknya mengarah ke URL publik API yang sama

Mode runtime:

- `ASPNETCORE_ENVIRONMENT=Development`
- `ASPNETCORE_ENVIRONMENT=Production`
- `ASPNETCORE_URLS` dibaca otomatis dari `Runtime:AspNetCoreUrls` pada file `appsettings` sesuai mode

## Script Deploy

Pintu masuk utama:

- [MENU_DEPLOY.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/MENU_DEPLOY.bat)

Script teknis:

- [prepare-development-config.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/scripts/deploy/prepare-development-config.bat)
- [publish-development.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/scripts/deploy/publish-development.bat)
- [start-api-development.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/scripts/deploy/start-api-development.bat)
- [prepare-production-config.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/scripts/deploy/prepare-production-config.bat)
- [publish-production.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/scripts/deploy/publish-production.bat)
- [start-api-production.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/scripts/deploy/start-api-production.bat)
- [clean-publish.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/scripts/deploy/clean-publish.bat)

## Validasi Otomatis

Script publish sekarang akan berhenti jika:

- file config aktif belum ada
- config masih berisi placeholder `YOUR_*`
- `DefaultConnection` masih kosong
- `Runtime:AspNetCoreUrls` masih kosong
- `VITE_API_BASE_URL` masih kosong

Menu checker tersedia di:

- `Cek Config Development`
- `Cek Config Production`

## Output Publish

Hasil publish disimpan di:

- `publish/development/client`
- `publish/development/api`
- `publish/production/client`
- `publish/production/api`

## Catatan

- `README_PUBLISH_SINGKAT.md` fokus ke langkah cepat pengguna.
- `DEPLOYMENT_CONFIG.md` fokus ke lokasi file, struktur config, dan referensi teknis.
