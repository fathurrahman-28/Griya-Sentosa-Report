import { requireAnyUser } from "@/lib/authz";
import { hppPerUnit } from "@/lib/ledger";
import { formatRupiah, formatPercent } from "@/lib/format";

export default async function HppUnitPage() {
  await requireAnyUser();
  const data = await hppPerUnit();

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">HPP per Unit</h1>
      <p className="text-sm text-slate-500 mb-6">
        Budget (dari Master Proyek, manual) dibandingkan biaya aktual (otomatis dari jurnal per kavling).
      </p>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr className="text-left">
              <th className="py-2 px-4">Kavling</th>
              <th className="py-2 px-4 text-right">Budget</th>
              <th className="py-2 px-4 text-right">HPP Aktual</th>
              <th className="py-2 px-4 text-right">Variance</th>
              <th className="py-2 px-4">Status</th>
              <th className="py-2 px-4 text-right">Margin Kotor (vs Harga Jual)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.unit.id} className="border-t border-slate-100">
                <td className="py-2 px-4">{d.unit.code}</td>
                <td className="py-2 px-4 text-right">{formatRupiah(d.budget)}</td>
                <td className="py-2 px-4 text-right">{formatRupiah(d.hppAktual)}</td>
                <td className={`py-2 px-4 text-right ${d.variance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {formatRupiah(d.variance)} ({formatPercent(d.variancePct)})
                </td>
                <td className="py-2 px-4">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      d.variance > 0 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {d.variance > 0 ? "Over Budget" : "Under Budget"}
                  </span>
                </td>
                <td className="py-2 px-4 text-right">{formatRupiah(d.marginKotor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
