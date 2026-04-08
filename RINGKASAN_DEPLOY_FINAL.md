# Ringkasan Deploy Final

Dokumen ini adalah ringkasan 1 halaman untuk melihat hasil akhir setup deploy project ini.

## 1. File Config Yang Perlu Diisi

Development:

- [client/.env.development](/d:/KANTOR/Project%20VB/WEB%20DOA/client/.env.development)
- [API/appsettings.Development.json](/d:/KANTOR/Project%20VB/WEB%20DOA/API/appsettings.Development.json)

Production:

- [client/.env.production](/d:/KANTOR/Project%20VB/WEB%20DOA/client/.env.production)
- [API/appsettings.Production.json](/d:/KANTOR/Project%20VB/WEB%20DOA/API/appsettings.Production.json)

Sample:

- [client/.env.development.sample](/d:/KANTOR/Project%20VB/WEB%20DOA/client/.env.development.sample)
- [client/.env.production.sample](/d:/KANTOR/Project%20VB/WEB%20DOA/client/.env.production.sample)
- [API/appsettings.Development.sample.json](/d:/KANTOR/Project%20VB/WEB%20DOA/API/appsettings.Development.sample.json)
- [API/appsettings.Production.sample.json](/d:/KANTOR/Project%20VB/WEB%20DOA/API/appsettings.Production.sample.json)

## 2. Nilai Paling Penting

Frontend:

- `VITE_API_BASE_URL`

Backend:

- `ConnectionStrings:DefaultConnection`
- `Runtime:AspNetCoreUrls`
- `AppClient:AllowedOrigins`
- `WhatsAppGateway:PublicBaseUrl`

## 3. Script Yang Tersedia

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

## 4. Alur Paling Singkat

Development:

1. Jalankan `prepare-development-config.bat`
2. Isi config development
3. Jalankan `Cek Config Development` dari [MENU_DEPLOY.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/MENU_DEPLOY.bat)
4. Jalankan `publish-development.bat`
5. Jalankan `start-api-development.bat`

Production:

1. Jalankan `prepare-production-config.bat`
2. Isi config production
3. Jalankan `Cek Config Production` dari [MENU_DEPLOY.bat](/d:/KANTOR/Project%20VB/WEB%20DOA/MENU_DEPLOY.bat)
4. Jalankan `publish-production.bat`
5. Jalankan `start-api-production.bat`

## 5. Output Publish

- `publish/development/client`
- `publish/development/api`
- `publish/production/client`
- `publish/production/api`

## 6. Hubungan URL

- `Runtime:AspNetCoreUrls` = API listen di server
- `WhatsAppGateway:PublicBaseUrl` = URL publik API
- `VITE_API_BASE_URL` = URL yang dipakai frontend

Idealnya `VITE_API_BASE_URL` dan `WhatsAppGateway:PublicBaseUrl` mengarah ke API yang sama.

## 7. Dokumen Pendukung

- [README_PUBLISH_SINGKAT.md](/d:/KANTOR/Project%20VB/WEB%20DOA/README_PUBLISH_SINGKAT.md)
- [DEPLOYMENT_CONFIG.md](/d:/KANTOR/Project%20VB/WEB%20DOA/DEPLOYMENT_CONFIG.md)
- [SEBELUM_GO_LIVE.md](/d:/KANTOR/Project%20VB/WEB%20DOA/SEBELUM_GO_LIVE.md)
- [CHANGELOG_DEPLOY_SETUP.md](/d:/KANTOR/Project%20VB/WEB%20DOA/CHANGELOG_DEPLOY_SETUP.md)

## 8. Status Akhir

- config development dan production sudah dipisah
- frontend dan backend sudah memakai pengaturan terpusat
- script deploy sudah tersedia dan dirapikan
- checker config sudah tersedia
- checklist go-live sudah tersedia
