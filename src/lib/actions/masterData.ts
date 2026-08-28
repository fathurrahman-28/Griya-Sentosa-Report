"use server";

import { db } from "@/db";
import { units, accounts, customers, contractors, estimasiCashflowItems, ekuitasItems, users } from "@/db/schema";
import { requireRole } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

export async function updateTelegramChatId(userId: number, telegramChatId: string) {
  await requireRole("OWNER");
  await db
    .update(users)
    .set({ telegramChatId: telegramChatId || null })
    .where(eq(users.id, userId));
  revalidatePath("/pengaturan-bot");
}

export async function updateUnit(id: number, data: {
  tipe?: string;
  luasTanah?: string;
  luasBangunan?: string;
  budgetTanah?: string;
  budgetInfra?: string;
  budgetMaterial?: string;
  budgetUpah?: string;
  budgetLegal?: string;
  budgetDesain?: string;
  budgetOverhead?: string;
  hargaJual?: string;
  status?: "TERSEDIA" | "DIPESAN" | "TERJUAL";
  customerName?: string;
  tglPPJB?: string;
  targetSerahTerima?: string;
  nilaiKontrakKonstruksi?: string;
  contractorName?: string;
}) {
  await requireRole("ADMIN", "OWNER");

  let customerId: number | undefined;
  if (data.customerName) {
    const existing = await db.query.customers.findFirst({ where: eq(customers.name, data.customerName) });
    customerId = existing ? existing.id : (await db.insert(customers).values({ name: data.customerName }).returning())[0].id;
  }

  let contractorId: number | undefined;
  if (data.contractorName) {
    const existing = await db.query.contractors.findFirst({ where: eq(contractors.name, data.contractorName) });
    contractorId = existing ? existing.id : (await db.insert(contractors).values({ name: data.contractorName }).returning())[0].id;
  }

  await db
    .update(units)
    .set({
      tipe: data.tipe,
      luasTanah: data.luasTanah,
      luasBangunan: data.luasBangunan,
      budgetTanah: data.budgetTanah,
      budgetInfra: data.budgetInfra,
      budgetMaterial: data.budgetMaterial,
      budgetUpah: data.budgetUpah,
      budgetLegal: data.budgetLegal,
      budgetDesain: data.budgetDesain,
      budgetOverhead: data.budgetOverhead,
      hargaJual: data.hargaJual,
      status: data.status,
      customerId: data.customerName ? customerId : undefined,
      tglPPJB: data.tglPPJB || undefined,
      targetSerahTerima: data.targetSerahTerima || undefined,
      nilaiKontrakKonstruksi: data.nilaiKontrakKonstruksi,
      contractorId: data.contractorName ? contractorId : undefined,
      updatedAt: new Date(),
    })
    .where(eq(units.id, id));

  revalidatePath("/master-proyek");
  revalidatePath("/");
}

export async function createAccount(data: {
  code: string;
  name: string;
  type: "HEADER" | "DETAIL";
  category: "ASET" | "KEWAJIBAN" | "EKUITAS" | "PENDAPATAN" | "HPP" | "BEBAN" | "LAIN_LAIN";
  normalBalance: "DEBIT" | "KREDIT";
  cashCategory?: string;
}) {
  await requireRole("OWNER");
  await db.insert(accounts).values({
    code: data.code,
    name: data.name,
    type: data.type,
    category: data.category,
    normalBalance: data.normalBalance,
    cashCategory: (data.cashCategory as any) || null,
  });
  revalidatePath("/data-akun");
}

export async function toggleAccountActive(id: number, active: boolean) {
  await requireRole("OWNER");
  await db.update(accounts).set({ active }).where(eq(accounts.id, id));
  revalidatePath("/data-akun");
}

// ---- Estimasi Cashflow & Ekuitas (struktur sama) ----
async function addProjectionItem(
  table: typeof estimasiCashflowItems | typeof ekuitasItems,
  data: { kelompok: string; section: string; itemName: string; qty: string; satuan?: string; hargaSatuan: string }
) {
  const qty = parseFloat(data.qty) || 0;
  const harga = parseFloat(data.hargaSatuan) || 0;
  await db.insert(table).values({
    kelompok: data.kelompok,
    section: data.section,
    itemName: data.itemName,
    qty: data.qty,
    satuan: data.satuan,
    hargaSatuan: data.hargaSatuan,
    total: String(qty * harga),
    urutan: 0,
  });
}

export async function addEstimasiCashflowItem(data: { kelompok: string; section: string; itemName: string; qty: string; satuan?: string; hargaSatuan: string }) {
  await requireRole("ADMIN", "OWNER");
  await addProjectionItem(estimasiCashflowItems, data);
  revalidatePath("/estimasi-cashflow");
}

export async function deleteEstimasiCashflowItem(id: number) {
  await requireRole("ADMIN", "OWNER");
  await db.delete(estimasiCashflowItems).where(eq(estimasiCashflowItems.id, id));
  revalidatePath("/estimasi-cashflow");
}

export async function addEkuitasItem(data: { kelompok: string; section: string; itemName: string; qty: string; satuan?: string; hargaSatuan: string }) {
  await requireRole("ADMIN", "OWNER");
  await addProjectionItem(ekuitasItems, data);
  revalidatePath("/ekuitas");
}

export async function deleteEkuitasItem(id: number) {
  await requireRole("ADMIN", "OWNER");
  await db.delete(ekuitasItems).where(eq(ekuitasItems.id, id));
  revalidatePath("/ekuitas");
}
