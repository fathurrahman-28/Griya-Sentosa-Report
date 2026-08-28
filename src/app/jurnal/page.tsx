import { requireAnyUser } from "@/lib/authz";
import { db } from "@/db";
import { formatRupiah, formatDate } from "@/lib/format";
import Link from "next/link";

const STATUS_BADGE: Record<string, string> = {
  APPROVED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default async function JurnalPage() {
  const user = await requireAnyUser();
  const entries = await db.query.journalEntries.findMany({
    with: { lines: { with: { account: true } }, unit: true, createdBy: true, approvedBy: true },
    orderBy: (e, { desc }) => [desc(e.entryDate), desc(e.id)],
    limit: 200,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Jurnal Transaksi</h1>
          <p className="text-sm text-slate-500">Sumber tunggal — semua laporan lain diturunkan dari sini.</p>
        </div>
        {(user.role === "ADMIN" || user.role === "OWNER") && (
          <Link
            href="/jurnal/new"
            className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800"
          >
            + Input Transaksi
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr className="text-left">
              <th className="py-2 px-4">Tanggal</th>
              <th className="py-2 px-4">Keterangan</th>
              <th className="py-2 px-4">Kavling</th>
              <th className="py-2 px-4">Akun</th>
              <th className="py-2 px-4 text-right">Jumlah</th>
              <th className="py-2 px-4">Dibuat</th>
              <th className="py-2 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const total = e.lines.reduce((s, l) => s + (parseFloat(l.debit as unknown as string) || 0), 0);
              return (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="py-2 px-4 whitespace-nowrap">{formatDate(e.entryDate as unknown as string)}</td>
                  <td className="py-2 px-4">{e.description}</td>
                  <td className="py-2 px-4">{e.unit?.code ?? "Umum"}</td>
                  <td className="py-2 px-4 text-xs text-slate-500">
                    {e.lines.map((l) => `${l.account.code}`).join(" / ")}
                  </td>
                  <td className="py-2 px-4 text-right font-medium">{formatRupiah(total)}</td>
                  <td className="py-2 px-4 text-xs text-slate-500">
                    {e.createdBy?.name} · {e.channel}
                  </td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[e.status]}`}>
                      {e.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {entries.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Belum ada transaksi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
