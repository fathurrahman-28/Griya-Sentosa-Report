import { db } from "@/db";
import { formatRupiah } from "@/lib/format";
import type { ParsedTx } from "./nlu";
import type { CreateTxInput } from "@/lib/actions/journal";

const ACCOUNT_LABEL: Record<string, string> = {
  "1113": "Bank Mandiri",
  "1112": "Bank BCA",
  "1111": "Kas Kecil",
  "2110": "Hutang Usaha (belum dibayar)",
  "2300": "Dana Owner Langsung / Non-Kas",
};

export async function resolveParsedTx(parsed: ParsedTx): Promise<{ input: CreateTxInput; summary: string }> {
  let unitId: number | undefined;
  let unitLabel = "Umum";
  if (parsed.unitCode) {
    const unit = await db.query.units.findFirst({ where: (u, { eq }) => eq(u.code, parsed.unitCode!) });
    if (unit) {
      unitId = unit.id;
      unitLabel = unit.code;
    } else {
      unitLabel = `${parsed.unitCode} (tidak ditemukan, dicatat sbg Umum)`;
    }
  }

  let customerId: number | undefined;
  if (parsed.customerName) {
    const c = await db.query.customers.findFirst({ where: (t, { eq }) => eq(t.name, parsed.customerName!) });
    customerId = c?.id;
  }

  let contractorId: number | undefined;
  if (parsed.contractorName) {
    const c = await db.query.contractors.findFirst({ where: (t, { eq }) => eq(t.name, parsed.contractorName!) });
    contractorId = c?.id;
  }

  let targetLabel = "";
  if (parsed.targetAccountCode) {
    const a = await db.query.accounts.findFirst({ where: (t, { eq }) => eq(t.code, parsed.targetAccountCode!) });
    targetLabel = a ? `${a.code} — ${a.name}` : parsed.targetAccountCode;
  }

  const input: CreateTxInput = {
    type: parsed.type,
    entryDate: parsed.entryDate,
    description: parsed.description,
    unitId,
    customerId,
    contractorId,
    jumlah: parsed.jumlah,
    targetAccountCode: parsed.targetAccountCode ?? undefined,
    sourceAccountCode: parsed.sourceAccountCode ?? undefined,
    fromAccountCode: parsed.fromAccountCode ?? undefined,
    toAccountCode: parsed.toAccountCode ?? undefined,
    channel: "TELEGRAM",
    rawBotMessage: parsed.description,
  };

  const TYPE_LABEL: Record<string, string> = {
    KAS_KELUAR: "Kas Keluar",
    KAS_MASUK_KONSUMEN: "Kas Masuk dari Konsumen",
    SETOR_MODAL: "Setoran Modal Owner",
    MUTASI_INTERNAL: "Mutasi Internal",
    BAYAR_HUTANG_USAHA: "Bayar Hutang Usaha",
  };

  const lines = [
    `*Draft Transaksi — ${TYPE_LABEL[parsed.type]}*`,
    `Tanggal: ${parsed.entryDate}`,
    `Keterangan: ${parsed.description}`,
    `Kavling: ${unitLabel}`,
  ];
  if (parsed.customerName) lines.push(`Konsumen: ${parsed.customerName}${customerId ? "" : " (belum terdaftar)"}`);
  if (parsed.contractorName) lines.push(`Kontraktor: ${parsed.contractorName}${contractorId ? "" : " (belum terdaftar)"}`);
  lines.push(`Jumlah: ${formatRupiah(parsed.jumlah)}`);
  if (targetLabel) lines.push(`Akun tujuan: ${targetLabel}`);
  if (parsed.sourceAccountCode) lines.push(`Sumber dana: ${ACCOUNT_LABEL[parsed.sourceAccountCode] ?? parsed.sourceAccountCode}`);
  if (parsed.fromAccountCode) lines.push(`Dari: ${ACCOUNT_LABEL[parsed.fromAccountCode] ?? parsed.fromAccountCode}`);
  if (parsed.toAccountCode) lines.push(`Ke: ${ACCOUNT_LABEL[parsed.toAccountCode] ?? parsed.toAccountCode}`);
  if (parsed.clarificationNeeded) lines.push(`\n⚠️ ${parsed.clarificationNeeded}`);
  lines.push(`\nKonfirmasi transaksi ini?`);

  return { input, summary: lines.join("\n") };
}
