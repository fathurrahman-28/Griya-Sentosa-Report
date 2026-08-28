// Logika inti pembuatan jurnal — TIDAK "use server", dipakai baik oleh
// src/lib/actions/journal.ts (server action, terikat session NextAuth)
// maupun oleh webhook bot Telegram (terikat verifikasi telegramChatId sendiri).
// Jangan panggil fungsi di sini langsung dari client — selalu lewat salah satu pembungkus di atas.

import { db } from "@/db";
import { accounts, journalEntries, journalLines, users } from "@/db/schema";
import { invalidateLedgerCache } from "@/lib/ledger";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import type { TxType } from "@/lib/transactionTypes";

export type CreateTxInput = {
  type: TxType;
  entryDate: string;
  noBukti?: string;
  description: string;
  unitId?: number;
  customerId?: number;
  contractorId?: number;
  jumlah?: number;
  targetAccountCode?: string;
  sourceAccountCode?: string;
  fromAccountCode?: string;
  toAccountCode?: string;
  manualLines?: { accountCode: string; debit: number; credit: number }[];
  channel?: "WEB" | "TELEGRAM" | "WHATSAPP";
  rawBotMessage?: string;
};

async function accountIdByCode(code: string): Promise<number> {
  const acc = await db.query.accounts.findFirst({ where: eq(accounts.code, code) });
  if (!acc) throw new Error(`Akun ${code} tidak ditemukan`);
  return acc.id;
}

function buildLines(input: CreateTxInput): { accountCode: string; debit: number; credit: number }[] {
  const jumlah = input.jumlah ?? 0;
  switch (input.type) {
    case "KAS_KELUAR":
      if (!input.targetAccountCode || !input.sourceAccountCode) throw new Error("Akun tujuan & sumber dana wajib diisi");
      return [
        { accountCode: input.targetAccountCode, debit: jumlah, credit: 0 },
        { accountCode: input.sourceAccountCode, debit: 0, credit: jumlah },
      ];
    case "KAS_MASUK_KONSUMEN":
      if (!input.sourceAccountCode) throw new Error("Rekening penerima wajib diisi");
      return [
        { accountCode: input.sourceAccountCode, debit: jumlah, credit: 0 },
        { accountCode: "2130", debit: 0, credit: jumlah },
      ];
    case "SETOR_MODAL":
      if (!input.sourceAccountCode) throw new Error("Rekening penerima wajib diisi");
      return [
        { accountCode: input.sourceAccountCode, debit: jumlah, credit: 0 },
        { accountCode: "3100", debit: 0, credit: jumlah },
      ];
    case "MUTASI_INTERNAL":
      if (!input.fromAccountCode || !input.toAccountCode) throw new Error("Rekening asal & tujuan wajib diisi");
      return [
        { accountCode: input.toAccountCode, debit: jumlah, credit: 0 },
        { accountCode: input.fromAccountCode, debit: 0, credit: jumlah },
      ];
    case "BAYAR_HUTANG_USAHA":
      if (!input.sourceAccountCode) throw new Error("Rekening pembayar wajib diisi");
      return [
        { accountCode: "2110", debit: jumlah, credit: 0 },
        { accountCode: input.sourceAccountCode, debit: 0, credit: jumlah },
      ];
    case "MANUAL":
      if (!input.manualLines || input.manualLines.length < 2) throw new Error("Jurnal manual butuh minimal 2 baris");
      return input.manualLines;
    default:
      throw new Error("Jenis transaksi tidak dikenal");
  }
}

/**
 * Buat transaksi. `actingUserId` WAJIB sudah diverifikasi valid (ADMIN/OWNER) oleh
 * pemanggil (session NextAuth di server action, atau lookup telegramChatId di webhook bot).
 */
export async function createTransactionCore(input: CreateTxInput, actingUserId: number) {
  const lines = buildLines(input);

  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
  if (Math.round(totalDebit) !== Math.round(totalCredit)) {
    throw new Error(`Jurnal tidak balance: debit ${totalDebit} != kredit ${totalCredit}`);
  }
  if (totalDebit <= 0) {
    throw new Error("Jumlah transaksi harus lebih dari 0");
  }

  const creator = await db.query.users.findFirst({ where: eq(users.id, actingUserId) });
  if (!creator || (creator.role !== "ADMIN" && creator.role !== "OWNER")) {
    throw new Error("User tidak berhak membuat transaksi");
  }
  const autoApprove = creator.role === "OWNER";

  const accIds: Record<string, number> = {};
  for (const l of lines) {
    if (!(l.accountCode in accIds)) accIds[l.accountCode] = await accountIdByCode(l.accountCode);
  }

  const [entry] = await db
    .insert(journalEntries)
    .values({
      entryDate: input.entryDate,
      noBukti: input.noBukti,
      description: input.description,
      unitId: input.unitId,
      customerId: input.customerId,
      contractorId: input.contractorId,
      status: autoApprove ? "APPROVED" : "PENDING",
      channel: input.channel ?? "WEB",
      createdByUserId: actingUserId,
      approvedByUserId: autoApprove ? actingUserId : undefined,
      approvedAt: autoApprove ? new Date() : undefined,
      rawBotMessage: input.rawBotMessage,
    })
    .returning();

  await db.insert(journalLines).values(
    lines.map((l) => ({
      journalEntryId: entry.id,
      accountId: accIds[l.accountCode],
      debit: String(l.debit),
      credit: String(l.credit),
    }))
  );

  invalidateLedgerCache();
  revalidatePath("/jurnal");
  revalidatePath("/approvals");
  revalidatePath("/");
  return entry;
}

export async function approveEntryCore(entryId: number, actingOwnerId: number) {
  await db
    .update(journalEntries)
    .set({ status: "APPROVED", approvedByUserId: actingOwnerId, approvedAt: new Date() })
    .where(eq(journalEntries.id, entryId));
  invalidateLedgerCache();
  revalidatePath("/jurnal");
  revalidatePath("/approvals");
  revalidatePath("/");
}

export async function rejectEntryCore(entryId: number, actingOwnerId: number, note?: string) {
  await db
    .update(journalEntries)
    .set({ status: "REJECTED", approvedByUserId: actingOwnerId, approvedAt: new Date(), rejectionNote: note })
    .where(eq(journalEntries.id, entryId));
  invalidateLedgerCache();
  revalidatePath("/jurnal");
  revalidatePath("/approvals");
}
