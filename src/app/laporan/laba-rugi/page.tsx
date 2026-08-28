import { requireAnyUser } from "@/lib/authz";
import { labaRugi } from "@/lib/ledger";
import { formatRupiah } from "@/lib/format";

export default async function LabaRugiPage() {
  await requireAnyUser();
  const lr = await labaRugi();

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-1">Laporan Laba Rugi</h1>
      <p className="text-sm text-slate-500 mb-6">
        PT Griya Sentosa Property — pendapatan diakui hanya saat AJB/BAST; sebelum itu penjualan tercatat sebagai
        uang muka (kewajiban) di Neraca.
      </p>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 text-sm">
        <div className="flex justify-between">
          <span>Total Pendapatan (unit yang sudah AJB/BAST)</span>
          <span className="font-medium">{formatRupiah(lr.pendapatan)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Harga Pokok Penjualan (HPP)</span>
          <span>({formatRupiah(lr.hpp)})</span>
        </div>
        <div className="flex justify-between font-semibold border-t border-slate-200 pt-3">
          <span>Laba Kotor</span>
          <span>{formatRupiah(lr.labaKotor)}</span>
        </div>

        <div className="pt-3">
          <p className="text-xs text-slate-400 mb-2">Beban Operasional</p>
          {lr.bebanDetail.map((b) => (
            <div key={b.code} className="flex justify-between text-slate-600 py-0.5">
              <span className="pl-4">{b.name}</span>
              <span>{formatRupiah(b.total)}</span>
            </div>
          ))}
          <div className="flex justify-between font-medium pt-1">
            <span>Total Beban Operasional</span>
            <span>({formatRupiah(lr.totalBeban)})</span>
          </div>
        </div>

        <div className="flex justify-between font-semibold border-t border-slate-200 pt-3 text-base">
          <span>LABA RUGI TAHUN BERJALAN</span>
          <span className={lr.labaBersih < 0 ? "text-red-600" : "text-emerald-600"}>
            {formatRupiah(lr.labaBersih)}
          </span>
        </div>
      </div>
    </div>
  );
}
