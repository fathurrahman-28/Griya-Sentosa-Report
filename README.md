# Griya Sentosa — Sistem Pembukuan Proyek

Webapp pembukuan untuk PT Griya Sentosa Property. Prinsip inti: **satu kali input di Jurnal Transaksi, semua laporan lain (Neraca, Laba Rugi, Arus Kas, Buku Besar, Kas per Kategori, Kartu Konsumen/Borongan/Hutang, HPP per Unit, Dashboard) ter-update otomatis.** Hanya Master Proyek, Estimasi Cashflow, dan Ekuitas yang diisi manual.

## Isi & Arsitektur

- **Next.js 16** (App Router, TypeScript, Tailwind) — satu aplikasi full-stack.
- **PostgreSQL** + **Drizzle ORM** — database & skema (`src/db/schema.ts`).
- **NextAuth v5** (Credentials) — login 3 role: **Owner**, **Admin**, **Viewer**.
- **Mesin akuntansi** (`src/lib/ledger.ts`) — satu-satunya tempat yang membaca jurnal transaksi berstatus `APPROVED` dan menurunkan semua laporan. Jangan query manual di halaman lain.
- **Alur approval**: Admin input (web/bot) → status `PENDING` → Owner approve/reject (web atau chat bot) → `APPROVED` baru mempengaruhi laporan.
- **Bot Telegram** (`src/app/api/bot/telegram/route.ts`) — admin kirim pesan bebas, di-parse jadi draft transaksi oleh Claude (Anthropic API), dikonfirmasi, lalu masuk antrian approval Owner via tombol chat.
- **Export Excel** (`src/lib/exportExcel.ts`, tombol di menu "Export Excel") — satu file berisi 20 sheet, dibangkitkan langsung dari data live.

## Menjalankan di Lokal

1. **Database**: siapkan PostgreSQL, lalu isi `DATABASE_URL` di `.env` (contoh sudah ada, arahnya ke Postgres lokal).
2. Install dependency:
   ```
   npm install
   ```
3. Push skema ke database:
   ```
   npx drizzle-kit push
   ```
4. Seed data awal (chart of accounts, 12 kavling, 3 user):
   ```
   npx tsx src/db/seed.ts
   ```
5. Jalankan:
   ```
   npm run dev
   ```
   Buka `http://localhost:3000`.

### Akun login awal (ganti password setelah deploy!)

| Role   | Username | Password   |
|--------|----------|------------|
| Owner  | owner    | owner123   |
| Admin  | admin    | admin123   |
| Viewer | viewer   | viewer123  |

## Environment Variables (`.env`)

```
DATABASE_URL=              # koneksi Postgres (Neon/Supabase/dsb saat deploy)
AUTH_SECRET=                # random string panjang, wajib diganti saat deploy (buat dgn: openssl rand -base64 32)
ANTHROPIC_API_KEY=          # untuk fitur bot memahami bahasa natural (https://console.anthropic.com)
TELEGRAM_BOT_TOKEN=         # dari @BotFather di Telegram
TELEGRAM_WEBHOOK_SECRET=    # random string, dicocokkan dgn header webhook Telegram
APP_BASE_URL=               # URL publik app setelah deploy, mis. https://griya-sentosa.vercel.app
```

## Deploy ke Produksi (disarankan: Vercel + Neon)

1. **Database**: buat project Postgres gratis di [Neon](https://neon.tech) atau [Supabase](https://supabase.com). Salin connection string ke `DATABASE_URL`.
2. **Push kode ke GitHub**, lalu import project di [Vercel](https://vercel.com).
3. Isi semua Environment Variables di atas pada pengaturan project Vercel.
4. Setelah deploy pertama sukses, jalankan sekali dari lokal (dengan `DATABASE_URL` diarahkan ke database produksi):
   ```
   npx drizzle-kit push
   npx tsx src/db/seed.ts
   ```
5. **Aktifkan bot Telegram**: daftarkan bot baru via [@BotFather](https://t.me/BotFather), dapatkan token, isi `TELEGRAM_BOT_TOKEN`. Lalu daftarkan webhook (ganti `<TOKEN>`, `<APP_BASE_URL>`, `<WEBHOOK_SECRET>`):
   ```
   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<APP_BASE_URL>/api/bot/telegram&secret_token=<WEBHOOK_SECRET>"
   ```
6. Login sebagai Owner → menu **Pengaturan Bot** → isi Telegram Chat ID untuk Owner & Admin (dapatkan ID dari [@userinfobot](https://t.me/userinfobot) atau kirim `/start` ke bot lalu cek log server).
7. Ganti password ke-3 user default (fitur ganti password bisa ditambahkan; untuk sekarang update langsung lewat `npx tsx` script atau database).

## Menambah WhatsApp (tahap 2)

Sesuai rencana: WhatsApp menyusul lewat **WhatsApp Business API resmi** (bukan library tidak resmi) setelah alur Telegram terbukti stabil, supaya nomor WA operasional tidak berisiko diblokir. Webhook baru bisa dibuat mengikuti pola `src/app/api/bot/telegram/route.ts`, memakai channel `WHATSAPP` yang sudah tersedia di skema.

## Keterbatasan & Catatan

- **Arus Kas** diklasifikasi otomatis pakai heuristik sederhana (beban/HPP → operasi, WIP → investasi, modal/hutang pemilik → pendanaan) berdasarkan akun lawan di tiap entri kas. Untuk kasus tidak biasa, review manual tetap disarankan.
- **Jenis transaksi** di form input (Kas Keluar, Kas Masuk Konsumen, Setor Modal, Mutasi Internal, Bayar Hutang Usaha) mencakup skenario harian yang paling umum. Untuk kasus khusus (pengakuan penjualan saat AJB/BAST, jurnal pajak, dst), Owner bisa pakai **Jurnal Manual** (opsi tersedia khusus role Owner).
- **HPP Aktual & Variance** di Master Proyek dihitung otomatis dari jurnal yang di-tag kavling terkait (akun WIP/HPP kode 12xx/5xxx), sesuai keputusan desain di awal proyek.
- Bot Telegram butuh `ANTHROPIC_API_KEY` aktif untuk memahami bahasa natural. Tanpa key ini, bot akan membalas pesan error yang jelas alih-alih diam.
