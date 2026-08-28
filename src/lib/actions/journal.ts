"use server";

import { requireRole } from "@/lib/authz";
import { createTransactionCore, approveEntryCore, rejectEntryCore, type CreateTxInput } from "@/lib/journalCore";

export type { CreateTxInput };

export async function createTransaction(input: CreateTxInput) {
  const sessionUser = await requireRole("ADMIN", "OWNER");
  return createTransactionCore(input, Number(sessionUser.id));
}

export async function approveEntry(entryId: number) {
  const user = await requireRole("OWNER");
  return approveEntryCore(entryId, Number(user.id));
}

export async function rejectEntry(entryId: number, note?: string) {
  const user = await requireRole("OWNER");
  return rejectEntryCore(entryId, Number(user.id), note);
}
