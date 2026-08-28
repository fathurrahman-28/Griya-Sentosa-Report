import { requireAnyUser } from "@/lib/authz";
import { db } from "@/db";
import { ProjectionTable } from "@/components/ProjectionTable";
import { addEstimasiCashflowItem, deleteEstimasiCashflowItem } from "@/lib/actions/masterData";

export default async function EstimasiCashflowPage() {
  const user = await requireAnyUser();
  const items = await db.query.estimasiCashflowItems.findMany({ orderBy: (i, { asc }) => [asc(i.id)] });

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Estimasi Cashflow</h1>
      <p className="text-sm text-slate-500 mb-6">Proyeksi kas masuk/keluar keseluruhan proyek — manual, tidak terhubung ke jurnal aktual.</p>
      <ProjectionTable
        items={items as any}
        kelompokOptions={[
          { value: "KAS_MASUK", label: "I. Kas Masuk" },
          { value: "KAS_KELUAR", label: "II. Kas Keluar" },
        ]}
        canEdit={user.role === "ADMIN" || user.role === "OWNER"}
        addAction={addEstimasiCashflowItem}
        deleteAction={deleteEstimasiCashflowItem}
      />
    </div>
  );
}
