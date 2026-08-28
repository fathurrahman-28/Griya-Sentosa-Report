import { requireAnyUser } from "@/lib/authz";
import { arusKas } from "@/lib/ledger";
import { formatRupiah } from "@/lib/format";

export default async function ArusKasPage() {
  await requireAnyUser();
  const ak = await arusKas();

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-1">Laporan Arus Kas</h1>
      <p className="text-sm text-slate-500 mb-6">
        PT Griya Sentosa Property — diklasifikasi otomatis dari jurnal (heuristik: beban/HPP → operasi, WIP → investasi, modal/hutang pemilik → pendanaan).
      </p>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 text-sm">
        <div>
          <p className="font-semibold mb-2">Aktivitas Operasi</p>
          <div className="flex justify-between text-slate-600 pl-4">
            <span>Kas masuk operasi (uang muka konsumen, dll)</span>
            <span>{formatRupiah(ak.opsIn)}</span>
          </div>
          <div className="flex justify-between text-slate-600 pl-4">
            <span>Kas keluar operasi (beban & HPP)</span>
            <span>({formatRupiah(ak.opsOut)})</span>
          </div>
          <div className="flex justify-between font-medium pt-1 border-t border-slate-100 mt-1">
            <span>Arus Kas dari Aktivitas Operasi</span>
            <span>{formatRupiah(ak.kasOperasi)}</span>
          </div>
        </div>

        <div>
          <p className="font-semibold mb-2">Aktivitas Investasi</p>
          <div className="flex justify-between font-medium">
            <span>Investasi pengembangan proyek (WIP)</span>
            <span>{formatRupiah(ak.kasInvestasi)}</span>
          </div>
        </div>

        <div>
          <p className="font-semibold mb-2">Aktivitas Pendanaan</p>
          <div className="flex justify-between font-medium">
            <span>Setoran modal & dana pemilik</span>
            <span>{formatRupiah(ak.kasPendanaan)}</span>
          </div>
        </div>

        <div className="flex justify-between font-semibold border-t border-slate-200 pt-3 text-base">
          <span>SALDO KAS (posisi saat ini)</span>
          <span>{formatRupiah(ak.saldoAkhir)}</span>
        </div>
      </div>
    </div>
  );
}
