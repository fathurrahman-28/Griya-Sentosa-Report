import { requireAnyUser } from "@/lib/authz";
import { kartuHutang } from "@/lib/ledger";
import { formatRupiah, formatDate } from "@/lib/format";

export default async function KartuHutangPage() {
  await requireAnyUser();
  const { rows, totalOutstanding } = await kartuHutang();

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Kartu Hutang Usaha</h1>
      <p className="text-sm text-slate-500 mb-6">Akun 2110 - Hutang Usaha, otomatis dari jurnal.</p>

      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4 flex gap-8">
        <div>
          <p className="text-xs text-slate-500">Sisa Outstanding</p>
          <p className="text-lg font-semibold">{formatRupiah(totalOutstanding)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr className="text-left">
              <th className="py-2 px-4">Tanggal</th>
              <th className="py-2 px-4">Keterangan</th>
              <th className="py-2 px-4 text-right">Timbul (Kredit)</th>
              <th className="py-2 px-4 text-right">Dibayar (Debit)</th>
              <th className="py-2 px-4 text-right">Sisa</th>
              <th className="py-2 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="py-2 px-4 whitespace-nowrap">{formatDate(r.entryDate)}</td>
                <td className="py-2 px-4">{r.description}</td>
                <td className="py-2 px-4 text-right">{r.credit ? formatRupiah(r.credit) : ""}</td>
                <td className="py-2 px-4 text-right">{r.debit ? formatRupiah(r.debit) : ""}</td>
                <td className="py-2 px-4 text-right font-medium">{formatRupiah(r.sisaHutang)}</td>
                <td className="py-2 px-4">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.status === "LUNAS" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Belum ada hutang usaha.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
