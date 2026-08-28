import { requireRole } from "@/lib/authz";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { inArray, or, like } from "drizzle-orm";
import { JournalForm } from "@/components/JournalForm";
import { BANK_CODES } from "@/lib/transactionTypes";

export default async function NewJournalPage() {
  const user = await requireRole("ADMIN", "OWNER");

  const allAccounts = await db.query.accounts.findMany({ where: (a, { eq }) => eq(a.type, "DETAIL") });
  const bankAccounts = allAccounts.filter((a) => BANK_CODES.includes(a.code));
  const targetAccounts = allAccounts.filter(
    (a) => a.category === "BEBAN" || a.category === "HPP" || (a.category === "ASET" && a.code.startsWith("12"))
  );
  const units = await db.query.units.findMany();
  const customers = await db.query.customers.findMany();
  const contractors = await db.query.contractors.findMany();

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-1">Input Transaksi Baru</h1>
      <p className="text-sm text-slate-500 mb-6">
        {user.role === "OWNER"
          ? "Sebagai Owner, transaksi ini akan langsung disetujui."
          : "Transaksi akan masuk antrian persetujuan Owner sebelum resmi tercatat."}
      </p>
      <JournalForm
        bankAccounts={bankAccounts}
        targetAccounts={targetAccounts}
        allAccounts={allAccounts}
        units={units}
        customers={customers}
        contractors={contractors}
        role={user.role}
      />
    </div>
  );
}
