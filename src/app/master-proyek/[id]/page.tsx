import { requireRole } from "@/lib/authz";
import { db } from "@/db";
import { units } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { UnitEditForm } from "@/components/UnitEditForm";

export default async function EditUnitPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN", "OWNER");
  const { id } = await params;
  const unit = await db.query.units.findFirst({
    where: eq(units.id, Number(id)),
    with: { customer: true, contractor: true },
  });
  if (!unit) notFound();

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Edit {unit.code}</h1>
      <p className="text-sm text-slate-500 mb-6">Data master proyek — manual, tidak dipengaruhi jurnal transaksi.</p>
      <UnitEditForm unit={unit} />
    </div>
  );
}
