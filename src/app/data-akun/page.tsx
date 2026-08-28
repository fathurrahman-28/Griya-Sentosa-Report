import { requireRole } from "@/lib/authz";
import { db } from "@/db";
import { AddAccountForm } from "@/components/AddAccountForm";

export default async function DataAkunPage() {
  await requireRole("OWNER");
  const list = await db.query.accounts.findMany({ orderBy: (a, { asc }) => [asc(a.code)] });

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Data Akun</h1>
      <p className="text-sm text-slate-500 mb-6">
        Chart of accounts — setup sekali di awal, jadi pilihan dropdown saat input Jurnal Transaksi.
      </p>

      <div className="mb-6">
        <AddAccountForm />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr className="text-left">
              <th className="py-2 px-4">Kode</th>
              <th className="py-2 px-4">Nama Akun</th>
              <th className="py-2 px-4">Tipe</th>
              <th className="py-2 px-4">Kategori</th>
              <th className="py-2 px-4">Normal</th>
              <th className="py-2 px-4">Kategori Kas</th>
            </tr>
          </thead>
          <tbody>
            {list.map((a) => (
              <tr key={a.id} className={`border-t border-slate-100 ${a.type === "HEADER" ? "bg-slate-50 font-medium" : ""}`}>
                <td className="py-1.5 px-4">{a.code}</td>
                <td className="py-1.5 px-4">{a.name}</td>
                <td className="py-1.5 px-4 text-xs text-slate-500">{a.type}</td>
                <td className="py-1.5 px-4 text-xs text-slate-500">{a.category}</td>
                <td className="py-1.5 px-4 text-xs text-slate-500">{a.normalBalance}</td>
                <td className="py-1.5 px-4 text-xs text-slate-500">{a.cashCategory ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
