import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/db";
import { BANK_CODES } from "@/lib/transactionTypes";

export type ParsedTx = {
  type: "KAS_KELUAR" | "KAS_MASUK_KONSUMEN" | "SETOR_MODAL" | "MUTASI_INTERNAL" | "BAYAR_HUTANG_USAHA";
  entryDate: string;
  description: string;
  unitCode?: string | null;
  customerName?: string | null;
  contractorName?: string | null;
  jumlah: number;
  targetAccountCode?: string | null;
  sourceAccountCode?: string | null;
  fromAccountCode?: string | null;
  toAccountCode?: string | null;
  clarificationNeeded?: string | null;
};

const TOOL = {
  name: "catat_transaksi",
  description: "Catat transaksi keuangan dari pesan bahasa natural admin sebagai draft terstruktur.",
  input_schema: {
    type: "object" as const,
    properties: {
      type: {
        type: "string",
        enum: ["KAS_KELUAR", "KAS_MASUK_KONSUMEN", "SETOR_MODAL", "MUTASI_INTERNAL", "BAYAR_HUTANG_USAHA"],
      },
      entryDate: { type: "string", description: "Format YYYY-MM-DD. Pakai hari ini jika tidak disebutkan." },
      description: { type: "string", description: "Ringkasan keterangan transaksi." },
      unitCode: { type: ["string", "null"], description: "Kode kavling persis, mis. 'Kavling 3'. Null jika umum." },
      customerName: { type: ["string", "null"] },
      contractorName: { type: ["string", "null"] },
      jumlah: { type: "number" },
      targetAccountCode: { type: ["string", "null"], description: "Kode akun WIP/HPP/Beban tujuan untuk KAS_KELUAR." },
      sourceAccountCode: { type: ["string", "null"], description: "Kode akun sumber dana / bank penerima." },
      fromAccountCode: { type: ["string", "null"] },
      toAccountCode: { type: ["string", "null"] },
      clarificationNeeded: {
        type: ["string", "null"],
        description: "Isi jika ada info penting yang kurang/ambigu, jelaskan singkat apa yang perlu dikonfirmasi.",
      },
    },
    required: ["type", "entryDate", "description", "jumlah"],
  },
};

export async function parseTransactionMessage(text: string): Promise<ParsedTx> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY belum diset di server.");

  const accounts = await db.query.accounts.findMany({ where: (a, { eq }) => eq(a.type, "DETAIL") });
  const targetAccounts = accounts.filter(
    (a) => a.category === "BEBAN" || a.category === "HPP" || (a.category === "ASET" && a.code.startsWith("12"))
  );
  const bankAccounts = accounts.filter((a) => BANK_CODES.includes(a.code));
  const units = await db.query.units.findMany();
  const customers = await db.query.customers.findMany();
  const contractors = await db.query.contractors.findMany();

  const today = new Date().toISOString().slice(0, 10);

  const system = `Kamu adalah asisten pencatat transaksi keuangan untuk developer perumahan "Griya Sentosa".
Tugasmu: ubah pesan bahasa natural dari admin jadi draft transaksi terstruktur lewat tool "catat_transaksi".

Tanggal hari ini: ${today}

Jenis transaksi yang tersedia:
- KAS_KELUAR: bayar biaya proyek/operasional (tanah, konstruksi, legalitas, PLN, overhead, marketing, dll). Butuh targetAccountCode (akun biaya) & sourceAccountCode (dari mana dananya).
- KAS_MASUK_KONSUMEN: terima pembayaran/cicilan dari konsumen pembeli kavling. Butuh sourceAccountCode (rekening penerima), sebaiknya unitCode & customerName.
- SETOR_MODAL: owner menyetor modal ke rekening perusahaan. Butuh sourceAccountCode (rekening penerima).
- MUTASI_INTERNAL: pindah dana antar rekening perusahaan sendiri. Butuh fromAccountCode & toAccountCode.
- BAYAR_HUTANG_USAHA: melunasi hutang usaha yang sudah tercatat. Butuh sourceAccountCode.

Akun tujuan biaya yang valid (kode — nama):
${targetAccounts.map((a) => `${a.code} — ${a.name}`).join("\n")}

Akun bank/sumber dana yang valid (kode — nama):
${bankAccounts.map((a) => `${a.code} — ${a.name}`).join("\n")}
Selain itu sourceAccountCode juga boleh "2110" (Hutang Usaha / belum dibayar) atau "2300" (Dana Owner Langsung/Non-Kas) khusus untuk KAS_KELUAR.

Daftar kavling: ${units.map((u) => u.code).join(", ")}
Daftar konsumen terdaftar: ${customers.map((c) => c.name).join(", ") || "(belum ada)"}
Daftar kontraktor terdaftar: ${contractors.map((c) => c.name).join(", ") || "(belum ada)"}

Aturan pemilihan akun tujuan biaya (targetAccountCode) berdasarkan konteks kata kunci:
- tanah, pematangan, land clearing -> WIP - Tanah (1210)
- tukang, upah, borongan, konstruksi, bangun -> WIP - Upah (1213)
- semen, material, bahan bangunan -> WIP - Material (1212)
- listrik PLN, sambungan listrik -> WIP - Utilitas (1215)
- legalitas, sertifikat, SHM, izin, KRK, PBG, notaris -> WIP - Legalitas (1214)
- desain, arsitek -> WIP - Desain (1216)
- overhead proyek lain-lain terkait proyek -> WIP - Overhead Proyek (1217)
- marketing, iklan, spanduk, promosi -> Beban Marketing/Iklan (6110/6111)
- CSR, sumbangan, sosial -> Beban CSR (6291)
- telepon, internet, pulsa -> Beban Telepon & Internet (6230)
- gaji, upah karyawan kantor -> Beban Gaji & Upah (6210)
- biaya lain-lain umum -> Beban Lain-lain (6290)

Default sourceAccountCode untuk KAS_KELUAR: "1113" (Bank Mandiri), kecuali disebutkan BCA -> "1112", kas kecil -> "1111",
"hutang"/"belum dibayar" -> "2110", "owner langsung"/"non-kas"/"dana pribadi" -> "2300".

Jika ada informasi penting yang kurang atau ambigu (jumlah tidak jelas, kavling tidak disebut padahal relevan, dsb),
isi clarificationNeeded dengan penjelasan singkat, TAPI tetap isi field lain dengan tebakan terbaikmu.
Selalu panggil tool catat_transaksi — jangan menjawab dengan teks biasa.`;

  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    system,
    tools: [TOOL as any],
    tool_choice: { type: "tool", name: "catat_transaksi" },
    messages: [{ role: "user", content: text }],
  });

  const toolUse = msg.content.find((c) => c.type === "tool_use") as Anthropic.ToolUseBlock | undefined;
  if (!toolUse) throw new Error("Model tidak menghasilkan draft transaksi.");
  return toolUse.input as ParsedTx;
}
