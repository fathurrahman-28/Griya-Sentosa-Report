import { requireAnyUser } from "@/lib/authz";
import { kasKategori } from "@/lib/ledger";
import { formatRupiah, formatDate } from "@/lib/format";
import Link from "next/link";

const CATS = [
  { key: "OPS", label: "Kas Ops" },
  { key: "TANAH", label: "Kas Tanah" },
  { key: "KONSTRUKSI", label: "Kas Konstruksi" },
  { key: "LEGALITAS", label: "Kas Legalitas" },
  { key: "PLN", label: "Kas PLN" },
  { key: "OVERHEAD", label: "Kas Overhead" },
  { key: "MARKETING", label: "Kas Marketing" },
];

export default async function KasKategoriPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAnyUser();
  const { tab } = await searchParams;
  const active = tab && CATS.some((c) => c.key === tab) ? tab : "OPS";
  const rows = await kasKategori(active);
  const total = rows.reduce((s, r) => s + r.debit - r.credit, 0);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Kas per Kategori</h1>
      <p className="text-sm text-slate-500 mb-6">
        Rincian pengeluaran per kategori — otomatis dari akun yang dipilih saat input jurnal, bukan buku terpisah.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {CATS.map((c) => (
          <Link
            key={c.key}
            href={`/laporan/kas-kategori?tab=${c.key}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              active === c.key ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex justify-between items-center px-4 py-3 bg-slate-50 border-b border-slate-200">
          <p className="text-sm font-semibold">{CATS.find((c) => c.key === active)?.label}</p>
          <p className="text-sm font-semibold">{formatRupiah(total)}</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-1.5 px-4">Tanggal</th>
              <th className="py-1.5 px-4">No. Bukti</th>
              <th className="py-1.5 px-4">Akun</th>
              <th className="py-1.5 px-4">Kavling</th>
              <th className="py-1.5 px-4">Keterangan</th>
              <th className="py-1.5 px-4 text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-slate-50">
                <td className="py-1.5 px-4 whitespace-nowrap">{formatDate(r.entryDate)}</td>
                <td className="py-1.5 px-4">{r.noBukti ?? "-"}</td>
                <td className="py-1.5 px-4 text-xs text-slate-500">
                  {r.accountCode} {r.accountName}
                </td>
                <td className="py-1.5 px-4">{r.unitCode ?? "Umum"}</td>
                <td className="py-1.5 px-4">{r.description}</td>
                <td className="py-1.5 px-4 text-right font-medium">{formatRupiah(r.debit - r.credit)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Belum ada transaksi di kategori ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
