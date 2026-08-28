import { requireAnyUser } from "@/lib/authz";
import { neraca } from "@/lib/ledger";
import { formatRupiah } from "@/lib/format";

function Row({ label, value, bold, indent }: { label: string; value: number; bold?: boolean; indent?: boolean }) {
  return (
    <div className={`flex justify-between py-1.5 text-sm ${bold ? "font-semibold border-t border-slate-200 pt-2 mt-1" : ""}`}>
      <span className={indent ? "pl-4 text-slate-600" : ""}>{label}</span>
      <span>{formatRupiah(value)}</span>
    </div>
  );
}

export default async function NeracaPage() {
  await requireAnyUser();
  const n = await neraca();

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold mb-1">Neraca</h1>
      <p className="text-sm text-slate-500 mb-6">PT Griya Sentosa Property — per hari ini (live dari jurnal transaksi disetujui)</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">ASET</h2>
          <p className="text-xs text-slate-400 mt-3 mb-1">Aset Lancar</p>
          <Row label="Kas & Bank" value={n.aset.kasBank} indent />
          <Row label="Piutang" value={n.aset.piutang} indent />
          <Row label="Persediaan" value={n.aset.persediaan} indent />
          <p className="text-xs text-slate-400 mt-3 mb-1">Aset dalam Pengerjaan (WIP)</p>
          <Row label="WIP - Tanah & Pematangan" value={n.aset.wipTanah} indent />
          <Row label="WIP - Upah Borongan" value={n.aset.wipUpah} indent />
          <Row label="WIP - Legalitas & Perizinan" value={n.aset.wipLegal} indent />
          <Row label="WIP - Overhead & Desain" value={n.aset.wipOverhead} indent />
          <Row label="WIP - Utilitas" value={n.aset.wipUtilitas} indent />
          <Row label="Aset Tetap" value={n.aset.asetTetap} indent />
          <Row label="TOTAL ASET" value={n.aset.totalAset} bold />
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">KEWAJIBAN</h2>
            <Row label="Hutang Usaha" value={n.kewajiban.hutangUsaha} indent />
            <Row label="Hutang Pajak" value={n.kewajiban.hutangPajak} indent />
            <Row label="Uang Muka Konsumen (titipan)" value={n.kewajiban.uangMukaKonsumen} indent />
            <Row label="Hutang Bank" value={n.kewajiban.hutangBank} indent />
            <Row label="Hutang Kepada Pemilik" value={n.kewajiban.hutangPemilik} indent />
            <Row label="TOTAL KEWAJIBAN" value={n.kewajiban.totalKewajiban} bold />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">EKUITAS</h2>
            <Row label="Modal Disetor" value={n.ekuitas.modalDisetor} indent />
            <Row label="Laba Ditahan" value={n.ekuitas.labaDitahan} indent />
            <Row label="Laba Rugi Tahun Berjalan" value={n.ekuitas.labaBerjalan} indent />
            <Row label="TOTAL EKUITAS" value={n.ekuitas.totalEkuitas} bold />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <Row label="TOTAL KEWAJIBAN + EKUITAS" value={n.kewajiban.totalKewajiban + n.ekuitas.totalEkuitas} bold />
            {n.balance !== 0 && (
              <p className="text-xs text-red-600 mt-2">
                Selisih balance: {formatRupiah(n.balance)} — periksa jurnal manual.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
