import { requireAnyUser } from "@/lib/authz";
import { kasMasukPerUnit } from "@/lib/ledger";
import { formatRupiah, formatPercent } from "@/lib/format";

export default async function KartuKonsumenPage() {
  await requireAnyUser();
  const data = await kasMasukPerUnit();

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Kartu Konsumen</h1>
      <p className="text-sm text-slate-500 mb-6">Cicilan & sisa tagihan tiap kavling — otomatis dari jurnal (akun 2130).</p>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr className="text-left">
              <th className="py-2 px-4">Kavling</th>
              <th className="py-2 px-4">Konsumen</th>
              <th className="py-2 px-4 text-right">Harga Jual</th>
              <th className="py-2 px-4 text-right">Terbayar</th>
              <th className="py-2 px-4 text-right">Sisa Tagihan</th>
              <th className="py-2 px-4">% Lunas</th>
              <th className="py-2 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.unit.id} className="border-t border-slate-100">
                <td className="py-2 px-4">{d.unit.code}</td>
                <td className="py-2 px-4">{d.customerName}</td>
                <td className="py-2 px-4 text-right">{formatRupiah(d.hargaJual)}</td>
                <td className="py-2 px-4 text-right">{formatRupiah(d.totalMasuk)}</td>
                <td className="py-2 px-4 text-right">{formatRupiah(d.sisaTagihan)}</td>
                <td className="py-2 px-4">{formatPercent(d.persenLunas)}</td>
                <td className="py-2 px-4">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      d.totalMasuk === 0
                        ? "bg-slate-100 text-slate-500"
                        : d.sisaTagihan <= 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {d.totalMasuk === 0 ? "Belum Ada" : d.sisaTagihan <= 0 ? "Lunas" : "Cicilan Berjalan"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
