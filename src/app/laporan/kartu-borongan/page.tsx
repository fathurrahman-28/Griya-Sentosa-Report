import { requireAnyUser } from "@/lib/authz";
import { kartuBorongan } from "@/lib/ledger";
import { formatRupiah, formatPercent } from "@/lib/format";

export default async function KartuBoronganPage() {
  await requireAnyUser();
  const data = await kartuBorongan();

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Kartu Borongan</h1>
      <p className="text-sm text-slate-500 mb-6">Pembayaran ke kontraktor per kavling (otomatis dari jurnal akun WIP/HPP - Upah).</p>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr className="text-left">
              <th className="py-2 px-4">Kavling</th>
              <th className="py-2 px-4">Kontraktor</th>
              <th className="py-2 px-4 text-right">Nilai Kontrak</th>
              <th className="py-2 px-4 text-right">Terbayar</th>
              <th className="py-2 px-4 text-right">Sisa Bayar</th>
              <th className="py-2 px-4">Progres</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.unit.id} className="border-t border-slate-100">
                <td className="py-2 px-4">{d.unit.code}</td>
                <td className="py-2 px-4">{d.contractorName}</td>
                <td className="py-2 px-4 text-right">{formatRupiah(d.nilaiKontrak)}</td>
                <td className="py-2 px-4 text-right">{formatRupiah(d.terbayar)}</td>
                <td className="py-2 px-4 text-right">{formatRupiah(d.sisaBayar)}</td>
                <td className="py-2 px-4">{formatPercent(d.progres)}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Belum ada kavling dengan kontrak konstruksi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
