import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./index";
import { accounts, units, users, customers, contractors } from "./schema";

type AccRow = [string, string, "Header" | "Detail", string, "Debit" | "Kredit"];

// Kode | Nama | Tipe | Kategori | Normal  (persis dari sheet DATA AKUN)
const ACCOUNTS: AccRow[] = [
  ["1000", "ASET", "Header", "Aset", "Debit"],
  ["1100", "ASET LANCAR", "Header", "Aset", "Debit"],
  ["1110", "Kas & Bank", "Detail", "Aset", "Debit"],
  ["1111", "Kas Kecil", "Detail", "Aset", "Debit"],
  ["1112", "Bank BCA", "Detail", "Aset", "Debit"],
  ["1113", "Bank Mandiri", "Detail", "Aset", "Debit"],
  ["1114", "Bank BRI", "Detail", "Aset", "Debit"],
  ["1115", "Bank Nagari", "Detail", "Aset", "Debit"],
  ["1120", "Piutang Usaha", "Detail", "Aset", "Debit"],
  ["1121", "Piutang Konsumen", "Detail", "Aset", "Debit"],
  ["1122", "Piutang Lain-lain", "Detail", "Aset", "Debit"],
  ["1130", "Persediaan", "Detail", "Aset", "Debit"],
  ["1131", "Persediaan Tanah", "Detail", "Aset", "Debit"],
  ["1132", "Persediaan Material", "Detail", "Aset", "Debit"],
  ["1200", "ASET WIP", "Header", "Aset", "Debit"],
  ["1210", "WIP - Tanah", "Detail", "Aset", "Debit"],
  ["1211", "WIP - Infrastruktur", "Detail", "Aset", "Debit"],
  ["1212", "WIP - Material", "Detail", "Aset", "Debit"],
  ["1213", "WIP - Upah", "Detail", "Aset", "Debit"],
  ["1214", "WIP - Legalitas", "Detail", "Aset", "Debit"],
  ["1215", "WIP - Utilitas", "Detail", "Aset", "Debit"],
  ["1216", "WIP - Desain", "Detail", "Aset", "Debit"],
  ["1217", "WIP - Overhead Proyek", "Detail", "Aset", "Debit"],
  ["1300", "ASET TETAP", "Header", "Aset", "Debit"],
  ["1310", "Tanah Kantor", "Detail", "Aset", "Debit"],
  ["1320", "Bangunan Kantor", "Detail", "Aset", "Debit"],
  ["1330", "Kendaraan", "Detail", "Aset", "Debit"],
  ["1340", "Peralatan Kantor", "Detail", "Aset", "Debit"],
  ["1350", "Akumulasi Penyusutan", "Detail", "Aset", "Kredit"],
  ["2000", "KEWAJIBAN", "Header", "Kewajiban", "Kredit"],
  ["2100", "KEWAJIBAN LANCAR", "Header", "Kewajiban", "Kredit"],
  ["2110", "Hutang Usaha", "Detail", "Kewajiban", "Kredit"],
  ["2111", "Hutang Supplier Material", "Detail", "Kewajiban", "Kredit"],
  ["2112", "Hutang Kontraktor", "Detail", "Kewajiban", "Kredit"],
  ["2120", "Hutang Pajak", "Detail", "Kewajiban", "Kredit"],
  ["2121", "PPN Keluaran", "Detail", "Kewajiban", "Kredit"],
  ["2122", "PPN Masukan", "Detail", "Kewajiban", "Debit"],
  ["2123", "PPh 21", "Detail", "Kewajiban", "Kredit"],
  ["2124", "PPh 23", "Detail", "Kewajiban", "Kredit"],
  ["2125", "PPh Final", "Detail", "Kewajiban", "Kredit"],
  ["2126", "BPHTB Terutang", "Detail", "Kewajiban", "Kredit"],
  ["2130", "Uang Muka Konsumen dan Cicilan", "Detail", "Kewajiban", "Kredit"],
  ["2140", "Hutang Bank", "Detail", "Kewajiban", "Kredit"],
  ["2200", "KEWAJIBAN JANGKA PANJANG", "Header", "Kewajiban", "Kredit"],
  ["2210", "Hutang Bank Jangka Panjang", "Detail", "Kewajiban", "Kredit"],
  ["2300", "Hutang Kepada Pemilik", "Detail", "Kewajiban", "Kredit"],
  ["3000", "EKUITAS", "Header", "Ekuitas", "Kredit"],
  ["3100", "Modal Disetor", "Detail", "Ekuitas", "Kredit"],
  ["3200", "Laba Ditahan", "Detail", "Ekuitas", "Kredit"],
  ["3300", "Laba Tahun Berjalan", "Detail", "Ekuitas", "Kredit"],
  ["3400", "Prive/Drawing", "Detail", "Ekuitas", "Debit"],
  ["4000", "PENDAPATAN", "Header", "Pendapatan", "Kredit"],
  ["4100", "Penjualan Unit Rumah", "Detail", "Pendapatan", "Kredit"],
  ["4110", "Penjualan Rumah Type 36", "Detail", "Pendapatan", "Kredit"],
  ["4120", "Penjualan Rumah Type 45", "Detail", "Pendapatan", "Kredit"],
  ["4130", "Penjualan Rumah Type 60", "Detail", "Pendapatan", "Kredit"],
  ["4140", "Penjualan Rumah Type 70", "Detail", "Pendapatan", "Kredit"],
  ["4150", "Penjualan Kavling Tanah", "Detail", "Pendapatan", "Kredit"],
  ["4200", "Pendapatan Lain-lain", "Detail", "Pendapatan", "Kredit"],
  ["5000", "HPP", "Header", "HPP", "Debit"],
  ["5100", "HPP - Tanah", "Detail", "HPP", "Debit"],
  ["5110", "HPP - Infrastruktur", "Detail", "HPP", "Debit"],
  ["5120", "HPP - Material", "Detail", "HPP", "Debit"],
  ["5130", "HPP - Upah", "Detail", "HPP", "Debit"],
  ["5140", "HPP - Legalitas", "Detail", "HPP", "Debit"],
  ["5150", "HPP - Utilitas", "Detail", "HPP", "Debit"],
  ["5160", "HPP - Desain", "Detail", "HPP", "Debit"],
  ["5170", "HPP - Overhead", "Detail", "HPP", "Debit"],
  ["6000", "BEBAN OPERASIONAL", "Header", "Beban", "Debit"],
  ["6100", "BEBAN PENJUALAN", "Header", "Beban", "Debit"],
  ["6110", "Beban Marketing", "Detail", "Beban", "Debit"],
  ["6111", "Beban Iklan & Promosi", "Detail", "Beban", "Debit"],
  ["6112", "Beban Komisi Sales", "Detail", "Beban", "Debit"],
  ["6113", "Beban Event & Pameran", "Detail", "Beban", "Debit"],
  ["6200", "BEBAN ADMINISTRASI", "Header", "Beban", "Debit"],
  ["6210", "Beban Gaji & Upah", "Detail", "Beban", "Debit"],
  ["6220", "Beban Listrik & Air", "Detail", "Beban", "Debit"],
  ["6230", "Beban Telepon & Internet", "Detail", "Beban", "Debit"],
  ["6240", "Beban Sewa Kantor", "Detail", "Beban", "Debit"],
  ["6250", "Beban Perlengkapan Kantor", "Detail", "Beban", "Debit"],
  ["6260", "Beban Transportasi", "Detail", "Beban", "Debit"],
  ["6270", "Beban Penyusutan", "Detail", "Beban", "Debit"],
  ["6280", "Beban Administrasi Bank", "Detail", "Beban", "Debit"],
  ["6290", "Beban Lain-lain", "Detail", "Beban", "Debit"],
  ["6291", "Beban CSR", "Detail", "Beban", "Debit"],
  ["7000", "BEBAN & PENDAPATAN LAIN", "Header", "Lain-lain", "Debit"],
  ["7100", "Beban Bunga Bank", "Detail", "Lain-lain", "Debit"],
  ["7200", "Pendapatan Bunga", "Detail", "Lain-lain", "Kredit"],
  ["7300", "Rugi/Laba Selisih Kurs", "Detail", "Lain-lain", "Debit"],
];

const CATEGORY_MAP: Record<string, "ASET" | "KEWAJIBAN" | "EKUITAS" | "PENDAPATAN" | "HPP" | "BEBAN" | "LAIN_LAIN"> = {
  Aset: "ASET",
  Kewajiban: "KEWAJIBAN",
  Ekuitas: "EKUITAS",
  Pendapatan: "PENDAPATAN",
  HPP: "HPP",
  Beban: "BEBAN",
  "Lain-lain": "LAIN_LAIN",
};

// Kode akun -> kategori kas dashboard (Tanah/Konstruksi/Legalitas/PLN/Overhead/Ops/Marketing)
const CASH_CATEGORY_MAP: Record<string, string> = {
  "1210": "TANAH",
  "5100": "TANAH",
  "1211": "KONSTRUKSI",
  "1212": "KONSTRUKSI",
  "1213": "KONSTRUKSI",
  "5110": "KONSTRUKSI",
  "5120": "KONSTRUKSI",
  "5130": "KONSTRUKSI",
  "1214": "LEGALITAS",
  "5140": "LEGALITAS",
  "1215": "PLN",
  "5150": "PLN",
  "1216": "OVERHEAD",
  "1217": "OVERHEAD",
  "5160": "OVERHEAD",
  "5170": "OVERHEAD",
  "6110": "MARKETING",
  "6111": "MARKETING",
  "6112": "MARKETING",
  "6113": "MARKETING",
  "6210": "OPS",
  "6220": "OPS",
  "6230": "OPS",
  "6240": "OPS",
  "6250": "OPS",
  "6260": "OPS",
  "6270": "OPS",
  "6280": "OPS",
  "6290": "OPS",
  "6291": "OPS",
};

// 12 kavling dari MASTER PROYEK / DASHBOARD (harga jual & data lain sesuai file asli)
const UNITS = [
  { code: "Kavling 1", tipe: "Type 50", luasTanah: "112", luasBangunan: "50", hargaJual: "542500000", status: "TERJUAL" as const, customerName: "Pak Sukri", nilaiKontrak: "191000000" },
  { code: "Kavling 2", tipe: "Type 45", luasTanah: "99", luasBangunan: "45", hargaJual: "475000000", status: "TERSEDIA" as const },
  { code: "Kavling 3", tipe: "Type 45", luasTanah: "96", luasBangunan: "45", hargaJual: "455000000", status: "TERSEDIA" as const },
  { code: "Kavling 4", tipe: "Type 45", luasTanah: "95", luasBangunan: "45", hargaJual: "450000000", status: "TERSEDIA" as const },
  { code: "Kavling 5", tipe: "Type 45", luasTanah: "94", luasBangunan: "45", hargaJual: "450000000", status: "TERSEDIA" as const },
  { code: "Kavling 6", tipe: "Type 45", luasTanah: "94", luasBangunan: "45", hargaJual: "450000000", status: "TERSEDIA" as const },
  { code: "Kavling 7", tipe: "Type 45", luasTanah: "94", luasBangunan: "45", hargaJual: "450000000", status: "TERSEDIA" as const },
  { code: "Kavling 8", tipe: "Type 45", luasTanah: "97", luasBangunan: "45", hargaJual: "451250000", status: "TERJUAL" as const, customerName: "Gevindo Aneisca", nilaiKontrak: "171000000" },
  { code: "Kavling 9", tipe: "Type 45", luasTanah: "98", luasBangunan: "45", hargaJual: "488300000", status: "TERJUAL" as const, customerName: "Pak Dantim", nilaiKontrak: "217550000" },
  { code: "Kavling 10", tipe: "Type 45", luasTanah: "99", luasBangunan: "45", hargaJual: "475000000", status: "TERSEDIA" as const },
  { code: "Kavling 11", tipe: "Type 45", luasTanah: "100", luasBangunan: "45", hargaJual: "500000000", status: "TERSEDIA" as const },
  { code: "Kavling 12", tipe: "Type 45", luasTanah: "105", luasBangunan: "45", hargaJual: "550000000", status: "TERSEDIA" as const },
];

async function main() {
  console.log("Seeding chart of accounts...");
  for (const [code, name, type, kategori, normal] of ACCOUNTS) {
    await db
      .insert(accounts)
      .values({
        code,
        name,
        type: type === "Header" ? "HEADER" : "DETAIL",
        category: CATEGORY_MAP[kategori],
        normalBalance: normal === "Debit" ? "DEBIT" : "KREDIT",
        cashCategory: (CASH_CATEGORY_MAP[code] as any) ?? null,
      })
      .onConflictDoNothing();
  }

  console.log("Seeding kontraktor default (Pak Bubung)...");
  const [kontraktor] = await db
    .insert(contractors)
    .values({ name: "Pak Bubung", notes: "Kontraktor borongan utama" })
    .onConflictDoNothing()
    .returning();
  const kontraktorId = kontraktor?.id ?? (await db.query.contractors.findFirst())?.id;

  console.log("Seeding kavling / master proyek...");
  for (const u of UNITS) {
    let customerId: number | undefined;
    if (u.customerName) {
      const [c] = await db.insert(customers).values({ name: u.customerName }).returning();
      customerId = c.id;
    }
    await db
      .insert(units)
      .values({
        code: u.code,
        tipe: u.tipe,
        luasTanah: u.luasTanah,
        luasBangunan: u.luasBangunan,
        hargaJual: u.hargaJual,
        status: u.status,
        customerId,
        nilaiKontrakKonstruksi: u.nilaiKontrak ?? "0",
        contractorId: u.nilaiKontrak ? kontraktorId : undefined,
      })
      .onConflictDoNothing();
  }

  console.log("Seeding users (owner / admin / viewer)...");
  const passOwner = await bcrypt.hash("owner123", 10);
  const passAdmin = await bcrypt.hash("admin123", 10);
  const passViewer = await bcrypt.hash("viewer123", 10);
  await db
    .insert(users)
    .values([
      { name: "Owner", username: "owner", passwordHash: passOwner, role: "OWNER" },
      { name: "Admin", username: "admin", passwordHash: passAdmin, role: "ADMIN" },
      { name: "Tim", username: "viewer", passwordHash: passViewer, role: "VIEWER" },
    ])
    .onConflictDoNothing();

  console.log("Selesai seeding.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
