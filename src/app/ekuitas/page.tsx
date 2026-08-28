import { requireAnyUser } from "@/lib/authz";
import { db } from "@/db";
import { ProjectionTable } from "@/components/ProjectionTable";
import { addEkuitasItem, deleteEkuitasItem } from "@/lib/actions/masterData";

export default async function EkuitasPage() {
  const user = await requireAnyUser();
  const items = await db.query.ekuitasItems.findMany({ orderBy: (i, { asc }) => [asc(i.id)] });

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Laporan Ekuitas (Proyeksi)</h1>
      <p className="text-sm text-slate-500 mb-6">
        Proyeksi omzet & liabilitas total seluruh unit — manual, sama seperti sheet asli. Untuk posisi ekuitas
        aktual saat ini, lihat halaman Neraca.
      </p>
      <ProjectionTable
        items={items as any}
        kelompokOptions={[
          { value: "OMZET", label: "I. Omzet" },
          { value: "LIABILITAS", label: "II. Liabilitas" },
        ]}
        canEdit={user.role === "ADMIN" || user.role === "OWNER"}
        addAction={addEkuitasItem}
        deleteAction={deleteEkuitasItem}
      />
    </div>
  );
}
