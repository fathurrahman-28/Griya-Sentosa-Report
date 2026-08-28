import { requireRole } from "@/lib/authz";

export default async function ExportPage() {
  await requireRole("ADMIN", "OWNER");

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold mb-1">Export Excel</h1>
      <p className="text-sm text-slate-500 mb-6">
        Unduh rangkuman seluruh laporan (Dashboard, Jurnal, Neraca, Laba Rugi, Arus Kas, Buku Besar, Kas per
        kategori, Kartu Konsumen/Borongan/Hutang, HPP per Unit, Master Proyek, Data Akun, Estimasi Cashflow,
        Ekuitas) dalam satu file Excel — dibangkitkan langsung dari data terkini.
      </p>
      <a
        href="/api/export"
        className="inline-block rounded-md bg-slate-900 text-white text-sm font-medium px-5 py-2.5 hover:bg-slate-800"
      >
        Download Excel
      </a>
    </div>
  );
}
