Kamu adalah AI coding agent senior. Buat project baru bernama `doa-donatur-pwa`.

Tujuan project:
Buat aplikasi web doa donatur yang sangat ringan, installable sebagai PWA di iOS dan Windows, dengan tampilan mengikuti referensi screenshot:
1. Page Login
2. Page Dashboard kalender doa donatur seperti gambar 1
3. Page Detail List Ulang Tahun Donatur seperti gambar 2

Output utama:
- React + Vite + TypeScript.
- PWA installable.
- Bisa jalan offline untuk data mock.
- UI mobile-first dengan tema dark purple seperti screenshot.
- Jangan gunakan Electron, Tauri, Capacitor, Ionic, MUI, Ant Design, Redux, date-fns, moment, atau dependency berat lain.
- Gunakan CSS biasa agar ringan.
- Gunakan routing sederhana berbasis hash route, tanpa react-router.
- Gunakan localStorage untuk session login dan status doa.

Tech stack:
- Vite
- React
- TypeScript
- CSS biasa
- vite-plugin-pwa saja untuk PWA

Command setup:
1. Buat project:
   npm create vite@latest doa-donatur-pwa -- --template react-ts
2. Masuk folder:
   cd doa-donatur-pwa
3. Install dependency:
   npm install
   npm install -D vite-plugin-pwa
4. Jalankan:
   npm run dev
5. Build:
   npm run build
6. Preview PWA:
   npm run preview

Struktur file yang wajib dibuat:

src/
  main.tsx
  App.tsx
  styles/
    global.css
  data/
    donors.ts
  lib/
    auth.ts
    date.ts
    storage.ts
    router.ts
  pages/
    LoginPage.tsx
    DashboardPage.tsx
    BirthdayDetailPage.tsx
  components/
    AppShell.tsx
    CalendarCard.tsx
    DonorCard.tsx
    StatusLegend.tsx
    IconButton.tsx

public/
  icons/
    icon-192.png
    icon-512.png
    maskable-512.png

Konfigurasi PWA:
- Pakai `vite-plugin-pwa`.
- Buat konfigurasi di `vite.config.ts`.
- Manifest:
  name: "Doa Donatur"
  short_name: "Doa"
  description: "Aplikasi jadwal doa donatur"
  start_url: "/"
  scope: "/"
  display: "standalone"
  orientation: "portrait"
  background_color: "#17151d"
  theme_color: "#563b91"
  icons:
    /icons/icon-192.png 192x192
    /icons/icon-512.png 512x512
    /icons/maskable-512.png 512x512 purpose maskable
- Gunakan service worker autoUpdate.
- Cache hanya file statis penting: html, js, css, png, svg, webmanifest.
- Jangan cache API karena saat ini belum ada backend.
- Tambahkan register SW di main.tsx jika diperlukan oleh vite-plugin-pwa.

index.html wajib berisi meta:
- viewport dengan `viewport-fit=cover`
- theme-color
- apple-mobile-web-app-capable yes
- apple-mobile-web-app-status-bar-style black-translucent
- apple-mobile-web-app-title Doa
- apple-touch-icon mengarah ke icon 192 atau 512
- manifest otomatis dari VitePWA

Desain umum:
- Mobile-first.
- Lebar utama max 430px di desktop, center horizontal.
- Background utama: #17151d atau #15141a.
- Header purple: #563b91.
- Card: #2a2632 / #2f2a38.
- Text utama: #f5edf8.
- Text secondary: #aaa1b5.
- Accent purple muda: #cbb7ff.
- Merah status belum selesai: #3a0d0d dengan dot #ff8a7a.
- Hijau status selesai: #0f3318 dengan dot #79d17c.
- Border radius besar: 22px sampai 28px.
- Shadow soft.
- Font gunakan system font saja agar ringan:
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
- Untuk kesan mirip screenshot, gunakan letter spacing pada heading:
  letter-spacing: 0.18em;
- Jangan import Google Fonts.

Safe area iOS:
- Body/app root gunakan min-height: 100dvh.
- Tambahkan padding-top: env(safe-area-inset-top).
- Tambahkan padding-bottom: env(safe-area-inset-bottom).
- Hindari horizontal scroll.
- Gunakan touch-action dan button size minimal 44px untuk mobile.

Routing:
Gunakan hash route sederhana:
- `#/login`
- `#/dashboard`
- `#/birthdays?date=2026-05-29`

Buat helper `router.ts`:
- getRoute()
- navigate(path)
- parseQuery()
- listenRouteChange(callback)

Auth:
Buat auth ringan di `lib/auth.ts`:
- login(username, password)
- logout()
- isAuthenticated()
- Gunakan localStorage key: `doa.session`
- Untuk demo:
  username: admin
  password: admin
- Jangan tampilkan password di UI setelah login.
- Jika belum login, redirect ke `#/login`.
- Jika sudah login dan buka login, redirect ke `#/dashboard`.

Data mock:
Buat `src/data/donors.ts`.

Model:
type Donor = {
  id: string;
  name: string;
  phone: string;
  birthday: string; // format YYYY-MM-DD
};

Data contoh wajib:
- Christian Marpaung, 081311181107, birthday 2026-05-29
- Ediono, 0818143225, birthday 2026-05-29
- Edward, 081231113113, birthday 2026-05-29
- Eldrans Yovenky, 0818911829, birthday 2026-05-29
- Elfrans Yovendi, 0818911899, birthday 2026-05-29
- Eli Sumartini, 085362265454, birthday 2026-05-29
- Tambahkan beberapa donor pada 2026-05-30 dan 2026-05-31 agar dashboard menampilkan dot merah seperti screenshot.

Status doa:
- Simpan status doa di localStorage key: `doa.prayerStatus`.
- Format:
  {
    "2026-05-29": {
      "donor-id": true
    }
  }
- Jika semua donor pada tanggal itu sudah direkam, status tanggal = selesai.
- Jika ada donor tapi belum semua direkam, status tanggal = belum selesai.
- Jika tidak ada donor, tanggal tidak punya status dot.

Page Login:
UI:
- Full screen dark.
- Card center.
- Judul: "Doa Donatur"
- Subtitle: "Masuk untuk melihat jadwal doa"
- Input username.
- Input password.
- Button: "Masuk"
- Info kecil: "Demo: admin / admin"
- Jika salah login, tampilkan error kecil warna merah muda.
- Setelah login sukses, navigate ke `#/dashboard`.

Page Dashboard:
Mengikuti gambar 1.

Layout:
- Top app bar purple tinggi sekitar 68px.
- Judul besar kiri: "DASHBOARD".
- Konten dark.
- Section title center: "JADWAL DOA DONATUR".
- Calendar card besar rounded.
- Bulan: "Mei"
- Tahun: "2026"
- Tombol prev/next bulat di kanan atas card.
- Header hari:
  Min, Sen, Sel, Rab, Kam, Jum, Sab
- Grid kalender 7 kolom.
- Tanggal biasa warna abu.
- Tanggal dengan donor diberi dot kecil.
- Tanggal belum selesai diberi lingkaran/dot merah.
- Tanggal selesai diberi dot hijau.
- Tanggal selected diberi border purple muda seperti 29 pada screenshot.
- Di bawah card:
  "Ketuk tanggal untuk melihat daftar donatur yang berulang tahun."
- Legend:
  merah: "Belum Selesai"
  hijau: "Selesai"

Behavior:
- Default tampil bulan Mei 2026 agar sama seperti screenshot.
- Prev/next mengubah bulan.
- Klik tanggal yang punya donor navigate ke:
  `#/birthdays?date=YYYY-MM-DD`
- Klik tanggal tanpa donor boleh tidak melakukan apa-apa atau tampil toast ringan "Tidak ada donatur".

Page BirthdayDetail:
Mengikuti gambar 2.

Layout:
- Top app bar purple dengan tombol back di kiri.
- Judul: "Ulang Tahun"
- Back navigate ke dashboard.
- Section title center:
  "DONATUR YANG BERULANG TAHUN"
- Tanggal besar center:
  contoh "29 Mei"
- List donor card.
- Card donor:
  - Avatar lingkaran berisi inisial nama.
  - Nama donor 2 baris bila panjang.
  - Nomor HP kecil.
  - Button outline purple: "Rekam Doa"
- Jika sudah direkam:
  - Button berubah jadi "Selesai"
  - Card boleh diberi aksen hijau kecil.
- Tombol Rekam Doa:
  - Tidak perlu audio recording agar aplikasi tetap ringan.
  - Saat ditekan, toggle status donor menjadi selesai.
  - Simpan ke localStorage.
  - Setelah semua donor selesai, dashboard tanggal tersebut berubah hijau.
- Jika date tidak ada data, tampilkan empty state:
  "Tidak ada donatur ulang tahun pada tanggal ini."

Komponen:
1. AppShell:
   - Wrapper max-width 430px.
   - Background dark.
   - Handle safe area.
2. CalendarCard:
   Props:
   - currentMonth Date
   - selectedDate string optional
   - donors Donor[]
   - prayerStatus object
   - onSelectDate(dateString)
   - onPrevMonth()
   - onNextMonth()
3. DonorCard:
   Props:
   - donor
   - completed
   - onToggle()
4. StatusLegend:
   - render 2 badge: Belum Selesai dan Selesai.
5. IconButton:
   - Untuk back, prev, next.
   - Gunakan karakter atau inline SVG, jangan install icon package.

Date helper:
Buat `lib/date.ts`:
- formatDateKey(date): YYYY-MM-DD
- parseDateKey(key): Date
- getMonthMatrix(year, month): array 42 cell untuk calendar
- formatMonthNameId(monthIndex): Januari-Desember
- formatShortDateId(dateKey): "29 Mei"
- getDayNamesId(): ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

Storage helper:
Buat `lib/storage.ts`:
- safeGetJSON<T>(key, fallback)
- safeSetJSON(key, value)
- Jangan crash jika localStorage error.

CSS detail:
Buat `global.css` lengkap.
Wajib style:
- reset box-sizing
- body margin 0
- button inherit font
- `.app-shell`
- `.topbar`
- `.page`
- `.section-title`
- `.calendar-card`
- `.calendar-head`
- `.calendar-grid`
- `.calendar-day`
- `.calendar-day.is-selected`
- `.calendar-day.has-pending`
- `.calendar-day.has-done`
- `.status-dot`
- `.legend`
- `.donor-card`
- `.avatar`
- `.outline-button`
- `.login-page`
- `.login-card`
- `.input`
- `.primary-button`

Responsiveness:
- Di layar desktop, app tetap terlihat seperti mobile app di tengah.
- Di layar kecil, full width.
- Hindari ukuran fixed tinggi yang membuat konten terpotong.
- Detail page harus scroll vertical.

Performance:
- Tidak ada external font.
- Tidak ada UI library.
- Tidak ada image besar.
- Tidak ada runtime animation berat.
- Gunakan CSS transition ringan saja.
- Build harus kecil.
- Pastikan `npm run build` sukses tanpa TypeScript error.

PWA testing:
- `npm run build`
- `npm run preview`
- Buka di browser.
- Pastikan manifest terdeteksi.
- Pastikan service worker aktif.
- Pastikan app tetap bisa dibuka setelah offline reload.
- Di iOS, user bisa Add to Home Screen.
- Di Windows Edge/Chrome, user bisa Install app dari browser.

Acceptance criteria:
1. App punya 3 halaman saja: Login, Dashboard, Birthday Detail.
2. Setelah login, user masuk Dashboard.
3. Dashboard tampilan mendekati gambar 1.
4. Detail ulang tahun tampilan mendekati gambar 2.
5. Klik tanggal 29 Mei menampilkan daftar donor seperti screenshot.
6. Klik Rekam Doa mengubah status donor menjadi selesai.
7. Jika semua donor pada tanggal selesai, status tanggal di dashboard menjadi hijau.
8. Status tersimpan setelah refresh karena localStorage.
9. Bisa build production.
10. Bisa install sebagai PWA.
11. Tidak memakai dependency berat.
12. Tidak memakai backend.
13. Tidak memakai Electron/Tauri/Capacitor.
14. Tidak ada console error.

Catatan penting:
- Fokus dulu pada frontend PWA ringan.
- Jangan membuat fitur di luar scope.
- Jangan membuat dashboard ERP.
- Jangan membuat CRUD donor lengkap.
- Jangan membuat audio recorder.
- Jangan membuat notifikasi push.
- Jangan membuat database.
- Buat kode bersih, sederhana, dan mudah nanti disambungkan ke API.

Tambahan requirement platform:
Aplikasi wajib berjalan baik dan installable sebagai PWA pada:
1. iOS / iPhone
2. Android
3. Windows desktop

Tetap gunakan React + Vite + TypeScript + PWA.
Jangan ubah ke React Native, Flutter, Electron, Tauri, Capacitor, atau Ionic.
Target utama adalah aplikasi web ringan yang bisa di-install dari browser.

Target device:
- iPhone Safari
- Android Chrome
- Windows Chrome / Edge
- Lebar desain utama mobile-first: 360px sampai 430px
- Di desktop, app tetap berada di tengah dengan max-width 430px
- Di Android/iOS, app full width dan terasa seperti aplikasi mobile

PWA install behavior:
- iOS:
  - User install manual melalui Safari: Share → Add to Home Screen
  - Pastikan app tampil standalone tanpa address bar jika dibuka dari Home Screen
- Android:
  - Browser boleh menampilkan prompt install otomatis jika kriteria PWA terpenuhi
  - Sediakan juga tombol/instruksi “Install Aplikasi” bila event beforeinstallprompt tersedia
- Windows:
  - Bisa di-install dari Chrome/Edge sebagai desktop app

Manifest wajib:
- name: "Doa Donatur"
- short_name: "Doa"
- description: "Aplikasi jadwal doa donatur"
- start_url: "/"
- scope: "/"
- display: "standalone"
- orientation: "portrait"
- background_color: "#17151d"
- theme_color: "#563b91"
- categories: ["productivity", "lifestyle"]
- icons:
  - 192x192 PNG
  - 512x512 PNG
  - 512x512 maskable PNG

Tambahkan meta tag untuk iOS di index.html:
- viewport dengan viewport-fit=cover
- apple-mobile-web-app-capable = yes
- apple-mobile-web-app-status-bar-style = black-translucent
- apple-mobile-web-app-title = Doa
- apple-touch-icon
- theme-color

Safe area:
- Gunakan min-height: 100dvh, bukan hanya 100vh
- Gunakan padding-top: env(safe-area-inset-top)
- Gunakan padding-bottom: env(safe-area-inset-bottom)
- Pastikan header tidak tertutup notch iPhone
- Pastikan tombol bawah tidak tertutup gesture bar iPhone/Android

Mobile UX:
- Semua tombol minimal 44px tinggi/lebar
- Jangan pakai hover-only behavior
- Semua aksi harus bisa dengan tap
- Hindari input kecil
- Detail page harus scroll vertical lancar
- Calendar harus nyaman disentuh di layar 360px
- Gunakan touch-action: manipulation
- Hindari double tap zoom dengan ukuran font input minimal 16px

Android install prompt:
Buat helper ringan `lib/installPrompt.ts`:
- Simpan event `beforeinstallprompt`
- expose function:
  - canInstall()
  - promptInstall()
  - listenInstallPrompt(callback)
- Tampilkan tombol kecil “Install Aplikasi” hanya jika event tersedia
- Jangan tampilkan tombol ini di iOS karena iOS tidak memakai beforeinstallprompt seperti Android

iOS install hint:
Buat komponen `InstallHint.tsx`:
- Jika device iOS dan app belum standalone, tampilkan info kecil:
  "Untuk memasang aplikasi: buka Share lalu pilih Add to Home Screen."
- Jika sudah standalone, sembunyikan hint
- Deteksi standalone:
  window.matchMedia("(display-mode: standalone)").matches
  atau navigator.standalone untuk iOS Safari

Offline:
- App harus tetap bisa dibuka saat offline setelah pertama kali load
- Cache app shell: HTML, JS, CSS, icons, manifest
- Data mock donor tetap dari bundle/localStorage
- Jangan cache API karena belum ada backend
- Tampilkan pesan ringan jika app offline:
  "Mode offline aktif"

Service worker:
- Gunakan vite-plugin-pwa dengan registerType autoUpdate
- Jangan buat cache terlalu agresif
- Pastikan update app otomatis saat versi baru tersedia
- Tambahkan fallback agar refresh offline tetap membuka app

CSS tambahan:
- html, body, #root:
  width: 100%;
  min-height: 100%;
  background: #17151d;
- body:
  margin: 0;
  overscroll-behavior-y: none;
  -webkit-tap-highlight-color: transparent;
- input, button, textarea, select:
  font-size: 16px;
- .app-shell:
  min-height: 100dvh;
  width: 100%;
  max-width: 430px;
  margin: 0 auto;
  background: #17151d;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);

Testing wajib:
1. npm run build sukses.
2. npm run preview sukses.
3. Lighthouse PWA tidak error fatal.
4. Android Chrome:
   - manifest terbaca
   - service worker aktif
   - app bisa install
   - app bisa dibuka offline setelah pernah dibuka
5. iPhone Safari:
   - bisa Add to Home Screen
   - icon tampil benar
   - splash/background tidak putih mencolok
   - header aman dari notch
   - app terbuka standalone dari Home Screen
6. Windows Edge/Chrome:
   - bisa install sebagai app
   - ukuran desktop tetap seperti mobile app di tengah

Batasan yang harus dicatat:
- Jangan implement reminder/alarm background.
- Jangan implement push notification dulu.
- Jangan implement audio recorder dulu.
- Fokus pada login, dashboard kalender, detail ulang tahun, status Rekam Doa, offline basic, dan installable PWA.