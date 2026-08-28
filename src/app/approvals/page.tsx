import { requireRole } from "@/lib/authz";
import { db } from "@/db";
import { formatRupiah, formatDate } from "@/lib/format";
import { ApprovalButtons } from "@/components/ApprovalButtons";
import { eq } from "drizzle-orm";
import { journalEntries } from "@/db/schema";

export default async function ApprovalsPage() {
  await requireRole("OWNER");
  const pending = await db.query.journalEntries.findMany({
    where: eq(journalEntries.status, "PENDING"),
    with: { lines: { with: { account: true } }, unit: true, createdBy: true, customer: true, contractor: true },
    orderBy: (e, { asc }) => [asc(e.createdAt)],
  });

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Persetujuan Transaksi</h1>
      <p className="text-sm text-slate-500 mb-6">
        {pending.length} transaksi menunggu persetujuan Anda.
      </p>

      <div className="space-y-3">
        {pending.map((e) => {
          const total = e.lines.reduce((s, l) => s + (parseFloat(l.debit as unknown as string) || 0), 0);
          return (
            <div key={e.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-900">{e.description}</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {formatDate(e.entryDate as unknown as string)} · {e.unit?.code ?? "Umum"}
                    {e.customer ? ` · ${e.customer.name}` : ""}
                    {e.contractor ? ` · ${e.contractor.name}` : ""}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Diinput oleh {e.createdBy?.name} via {e.channel}
                  </p>
                  <div className="mt-2 text-xs text-slate-500 space-y-0.5">
                    {e.lines.map((l) => (
                      <div key={l.id}>
                        {l.account.code} — {l.account.name}:{" "}
                        {parseFloat(l.debit as unknown as string) > 0
                          ? `Debit ${formatRupiah(l.debit as unknown as string)}`
                          : `Kredit ${formatRupiah(l.credit as unknown as string)}`}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-semibold">{formatRupiah(total)}</p>
                  <div className="mt-3">
                    <ApprovalButtons entryId={e.id} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {pending.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            Tidak ada transaksi yang menunggu persetujuan.
          </div>
        )}
      </div>
    </div>
  );
}
