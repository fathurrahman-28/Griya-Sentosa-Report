import { requireAnyUser } from "@/lib/authz";
import { dashboardSummary } from "@/lib/ledger";
import { formatRupiah } from "@/lib/format";
import { db } from "@/db";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

const CAT_LABEL: Record<string, string> = {
  TANAH: "Tanah & Pematangan",
  KONSTRUKSI: "Konstruksi / Upah Borongan",
  LEGALITAS: "Legalitas & Perizinan",
  PLN: "PLN / Utilitas",
  OVERHEAD: "Overhead & Desain",
  MARKETING: "Marketing & Iklan",
  OPS: "Operasional & CSR",
};

export default async function DashboardPage() {
  await requireAnyUser();
  const s = await dashboardSummary();
  const units = await db.query.units.findMany({ with: { customer: true } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-slate-500">Griya Sentosa — ringkasan posisi keuangan proyek</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Kas Perusahaan" value={formatRupiah(s.totalKas)} sub="Mandiri + BCA" />
        <StatCard label="Total Aset (Neraca)" value={formatRupiah(s.totalAset)} />
        <StatCard label="Aset dalam Pengerjaan (WIP)" value={formatRupiah(s.wipTotal)} />
        <StatCard
          label="Laba/Rugi Berjalan"
          value={formatRupiah(s.labaRugiBerjalan)}
          sub="Belum termasuk pengakuan penjualan (AJB/BAST)"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Bank Mandiri (Out Acc)" value={formatRupiah(s.bankMandiri)} />
        <StatCard label="Bank BCA (In Acc)" value={formatRupiah(s.bankBCA)} />
        <StatCard label="Omzet Masuk dari Konsumen" value={formatRupiah(s.omzetMasuk)} />
        <StatCard label="Total Uang Keluar" value={formatRupiah(s.totalKeluar)} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Rincian Uang Keluar per Kategori</h2>
        <div className="space-y-2">
          {s.rincianKeluar.map((r) => (
            <div key={r.kategori} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{CAT_LABEL[r.kategori] ?? r.kategori}</span>
              <span className="font-medium">{formatRupiah(r.total)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Status Kavling</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="py-2 pr-4">Kavling</th>
                <th className="py-2 pr-4">Tipe</th>
                <th className="py-2 pr-4">Konsumen</th>
                <th className="py-2 pr-4">Harga Jual</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.id} className="border-b border-slate-50">
                  <td className="py-2 pr-4">{u.code}</td>
                  <td className="py-2 pr-4">{u.tipe}</td>
                  <td className="py-2 pr-4">{u.customer?.name ?? "—"}</td>
                  <td className="py-2 pr-4">{formatRupiah(u.hargaJual as unknown as string)}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.status === "TERJUAL"
                          ? "bg-emerald-100 text-emerald-700"
                          : u.status === "DIPESAN"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
