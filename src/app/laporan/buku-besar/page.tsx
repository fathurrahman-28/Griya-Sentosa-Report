import { requireAnyUser } from "@/lib/authz";
import { bukuBesar } from "@/lib/ledger";
import { formatRupiah, formatDate } from "@/lib/format";

export default async function BukuBesarPage() {
  await requireAnyUser();
  const data = await bukuBesar();

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Buku Besar</h1>
      <p className="text-sm text-slate-500 mb-6">Rincian mutasi tiap akun dari jurnal transaksi yang disetujui.</p>

      <div className="space-y-6">
        {data.map(({ account, rows, saldoAkhir }) => (
          <div key={account.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 bg-slate-50 border-b border-slate-200">
              <p className="text-sm font-semibold">
                {account.code} — {account.name}
              </p>
              <p className="text-sm font-semibold">{formatRupiah(saldoAkhir)}</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-1.5 px-4">Tanggal</th>
                  <th className="py-1.5 px-4">Keterangan</th>
                  <th className="py-1.5 px-4">Kavling</th>
                  <th className="py-1.5 px-4 text-right">Debit</th>
                  <th className="py-1.5 px-4 text-right">Kredit</th>
                  <th className="py-1.5 px-4 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-slate-50">
                    <td className="py-1.5 px-4 whitespace-nowrap">{formatDate(r.entryDate)}</td>
                    <td className="py-1.5 px-4">{r.description}</td>
                    <td className="py-1.5 px-4">{r.unitCode ?? "Umum"}</td>
                    <td className="py-1.5 px-4 text-right">{r.debit ? formatRupiah(r.debit) : ""}</td>
                    <td className="py-1.5 px-4 text-right">{r.credit ? formatRupiah(r.credit) : ""}</td>
                    <td className="py-1.5 px-4 text-right font-medium">{formatRupiah(r.runningBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {data.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            Belum ada transaksi disetujui.
          </div>
        )}
      </div>
    </div>
  );
}
