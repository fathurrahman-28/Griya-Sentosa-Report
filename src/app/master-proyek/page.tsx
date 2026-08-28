import { requireAnyUser } from "@/lib/authz";
import { db } from "@/db";
import { formatRupiah } from "@/lib/format";
import Link from "next/link";

export default async function MasterProyekPage() {
  const user = await requireAnyUser();
  const list = await db.query.units.findMany({ with: { customer: true, contractor: true }, orderBy: (u, { asc }) => [asc(u.id)] });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Master Proyek</h1>
          <p className="text-sm text-slate-500">Data manual per kavling — budget, harga jual, konsumen. Tidak diturunkan dari jurnal.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr className="text-left">
              <th className="py-2 px-4">Kavling</th>
              <th className="py-2 px-4">Tipe</th>
              <th className="py-2 px-4 text-right">Total Budget</th>
              <th className="py-2 px-4 text-right">Harga Jual</th>
              <th className="py-2 px-4">Konsumen</th>
              <th className="py-2 px-4">Status</th>
              {(user.role === "ADMIN" || user.role === "OWNER") && <th className="py-2 px-4"></th>}
            </tr>
          </thead>
          <tbody>
            {list.map((u) => {
              const budget =
                (parseFloat(u.budgetTanah as unknown as string) || 0) +
                (parseFloat(u.budgetInfra as unknown as string) || 0) +
                (parseFloat(u.budgetMaterial as unknown as string) || 0) +
                (parseFloat(u.budgetUpah as unknown as string) || 0) +
                (parseFloat(u.budgetLegal as unknown as string) || 0) +
                (parseFloat(u.budgetDesain as unknown as string) || 0) +
                (parseFloat(u.budgetOverhead as unknown as string) || 0);
              return (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="py-2 px-4">{u.code}</td>
                  <td className="py-2 px-4">{u.tipe}</td>
                  <td className="py-2 px-4 text-right">{formatRupiah(budget)}</td>
                  <td className="py-2 px-4 text-right">{formatRupiah(u.hargaJual as unknown as string)}</td>
                  <td className="py-2 px-4">{u.customer?.name ?? "-"}</td>
                  <td className="py-2 px-4">{u.status}</td>
                  {(user.role === "ADMIN" || user.role === "OWNER") && (
                    <td className="py-2 px-4">
                      <Link href={`/master-proyek/${u.id}`} className="text-slate-600 underline text-xs">
                        Edit
                      </Link>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
