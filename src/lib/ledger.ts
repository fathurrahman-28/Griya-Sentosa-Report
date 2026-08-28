import { db } from "@/db";
import { accounts, journalEntries, units } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * "Mesin akuntansi" — satu-satunya tempat yang membaca Jurnal Transaksi
 * (status APPROVED) dan menurunkan semua laporan. Semua halaman laporan
 * di app ini memanggil fungsi-fungsi di file ini, bukan query manual,
 * supaya konsisten dengan prinsip "1x input -> semua laporan ikut".
 */

export type FlatLine = {
  entryId: number;
  entryDate: string;
  noBukti: string | null;
  description: string;
  unitId: number | null;
  unitCode: string | null;
  customerId: number | null;
  customerName: string | null;
  contractorId: number | null;
  contractorName: string | null;
  accountId: number;
  accountCode: string;
  accountName: string;
  accountCategory: string;
  normalBalance: "DEBIT" | "KREDIT";
  cashCategory: string | null;
  debit: number;
  credit: number;
};

let cache: { at: number; data: FlatLine[] } | null = null;

export async function getApprovedLines(forceFresh = false): Promise<FlatLine[]> {
  if (!forceFresh && cache && Date.now() - cache.at < 2000) return cache.data;

  const rows = await db.query.journalEntries.findMany({
    where: eq(journalEntries.status, "APPROVED"),
    with: {
      lines: { with: { account: true } },
      unit: true,
      customer: true,
      contractor: true,
    },
  });

  const flat: FlatLine[] = [];
  for (const entry of rows) {
    for (const line of entry.lines) {
      flat.push({
        entryId: entry.id,
        entryDate: entry.entryDate as unknown as string,
        noBukti: entry.noBukti,
        description: entry.description,
        unitId: entry.unitId,
        unitCode: entry.unit?.code ?? null,
        customerId: entry.customerId,
        customerName: entry.customer?.name ?? null,
        contractorId: entry.contractorId,
        contractorName: entry.contractor?.name ?? null,
        accountId: line.accountId,
        accountCode: line.account.code,
        accountName: line.account.name,
        accountCategory: line.account.category,
        normalBalance: line.account.normalBalance,
        cashCategory: line.account.cashCategory,
        debit: parseFloat(line.debit as unknown as string) || 0,
        credit: parseFloat(line.credit as unknown as string) || 0,
      });
    }
  }
  cache = { at: Date.now(), data: flat };
  return flat;
}

export function invalidateLedgerCache() {
  cache = null;
}

function balanceFor(normal: "DEBIT" | "KREDIT", debit: number, credit: number) {
  return normal === "DEBIT" ? debit - credit : credit - debit;
}

/** Saldo akun berdasarkan prefix kode (mis. "12" utk semua WIP, "111" utk kas & bank). */
export function sumByCodePrefix(lines: FlatLine[], prefix: string): number {
  return lines
    .filter((l) => l.accountCode.startsWith(prefix))
    .reduce((s, l) => s + balanceFor(l.normalBalance, l.debit, l.credit), 0);
}

export function sumByCategory(lines: FlatLine[], category: string): number {
  return lines
    .filter((l) => l.accountCategory === category)
    .reduce((s, l) => s + balanceFor(l.normalBalance, l.debit, l.credit), 0);
}

export function sumByCode(lines: FlatLine[], code: string): number {
  return lines
    .filter((l) => l.accountCode === code)
    .reduce((s, l) => s + balanceFor(l.normalBalance, l.debit, l.credit), 0);
}

// ---------- BUKU BESAR ----------
export async function bukuBesar() {
  const lines = await getApprovedLines();
  const accs = await db.query.accounts.findMany({ where: eq(accounts.type, "DETAIL") });
  return accs
    .map((a) => {
      const accLines = lines
        .filter((l) => l.accountId === a.id)
        .sort((x, y) => (x.entryDate < y.entryDate ? -1 : 1));
      let running = 0;
      const rows = accLines.map((l) => {
        running += balanceFor(a.normalBalance, l.debit, l.credit);
        return { ...l, runningBalance: running };
      });
      return {
        account: a,
        rows,
        saldoAkhir: running,
      };
    })
    .filter((x) => x.rows.length > 0);
}

// ---------- NERACA ----------
export async function neraca() {
  const lines = await getApprovedLines();
  const kasBank = sumByCodePrefix(lines, "111");
  const piutang = sumByCodePrefix(lines, "112");
  const persediaan = sumByCodePrefix(lines, "113");
  const wipTanah = sumByCode(lines, "1210");
  const wipUpah = sumByCode(lines, "1213") + sumByCodePrefix(lines, "1211") + sumByCodePrefix(lines, "1212");
  const wipLegal = sumByCode(lines, "1214");
  const wipOverhead = sumByCode(lines, "1217") + sumByCode(lines, "1216");
  const wipUtilitas = sumByCode(lines, "1215");
  const wipTotal = wipTanah + wipUpah + wipLegal + wipOverhead + wipUtilitas;
  const asetTetap = sumByCodePrefix(lines, "13");
  const totalAset = sumByCategory(lines, "ASET");

  const hutangUsaha = sumByCodePrefix(lines, "211");
  const hutangPajak = sumByCodePrefix(lines, "212");
  const uangMukaKonsumen = sumByCode(lines, "2130");
  const hutangBank = sumByCode(lines, "2140") + sumByCode(lines, "2210");
  const hutangPemilik = sumByCode(lines, "2300");
  const totalKewajiban = sumByCategory(lines, "KEWAJIBAN");

  const modalDisetor = sumByCode(lines, "3100");
  const labaDitahan = sumByCode(lines, "3200");
  const pendapatan = sumByCategory(lines, "PENDAPATAN");
  const hpp = sumByCategory(lines, "HPP");
  const beban = sumByCategory(lines, "BEBAN");
  const labaBerjalan = pendapatan - hpp - beban;
  const totalEkuitas = modalDisetor + labaDitahan + labaBerjalan;

  return {
    aset: { kasBank, piutang, persediaan, wipTanah, wipUpah, wipLegal, wipOverhead, wipUtilitas, wipTotal, asetTetap, totalAset },
    kewajiban: { hutangUsaha, hutangPajak, uangMukaKonsumen, hutangBank, hutangPemilik, totalKewajiban },
    ekuitas: { modalDisetor, labaDitahan, labaBerjalan, totalEkuitas },
    balance: Math.round(totalAset - (totalKewajiban + totalEkuitas)),
  };
}

// ---------- LABA RUGI ----------
export async function labaRugi() {
  const lines = await getApprovedLines();
  const pendapatan = sumByCategory(lines, "PENDAPATAN");
  const hpp = sumByCategory(lines, "HPP");
  const labaKotor = pendapatan - hpp;

  const bebanByAccount = new Map<string, { name: string; total: number }>();
  for (const l of lines.filter((l) => l.accountCategory === "BEBAN")) {
    const cur = bebanByAccount.get(l.accountCode) ?? { name: l.accountName, total: 0 };
    cur.total += balanceFor(l.normalBalance, l.debit, l.credit);
    bebanByAccount.set(l.accountCode, cur);
  }
  const totalBeban = [...bebanByAccount.values()].reduce((s, x) => s + x.total, 0);
  const labaBersih = labaKotor - totalBeban;

  return {
    pendapatan,
    hpp,
    labaKotor,
    bebanDetail: [...bebanByAccount.entries()].map(([code, v]) => ({ code, ...v })),
    totalBeban,
    labaBersih,
  };
}

// ---------- ARUS KAS (heuristik klasifikasi per entri) ----------
export async function arusKas() {
  const rows = await db.query.journalEntries.findMany({
    where: eq(journalEntries.status, "APPROVED"),
    with: { lines: { with: { account: true } } },
  });

  let opsIn = 0,
    opsOut = 0,
    investasiOut = 0,
    pendanaanIn = 0;

  for (const entry of rows) {
    const kasLine = entry.lines.find((l) => l.account.code.startsWith("111"));
    if (!kasLine) continue; // entri non-kas (mis. pengakuan hutang non-cash), tidak masuk arus kas
    const kasNet =
      (parseFloat(kasLine.debit as unknown as string) || 0) -
      (parseFloat(kasLine.credit as unknown as string) || 0);
    const other = entry.lines.find((l) => l.id !== kasLine.id);
    if (!other) continue;
    const cat = other.account.category;
    const code = other.account.code;

    if (cat === "ASET" && code.startsWith("12")) {
      investasiOut += -kasNet; // WIP bertambah = kas keluar
    } else if (code === "3100" || code === "2300" || cat === "EKUITAS") {
      pendanaanIn += kasNet;
    } else if (cat === "BEBAN" || cat === "HPP") {
      opsOut += -kasNet;
    } else {
      // Uang muka konsumen, piutang, pendapatan, dll -> operasi
      if (kasNet >= 0) opsIn += kasNet;
      else opsOut += -kasNet;
    }
  }

  const saldoKasAwal = 0; // periode berjalan sejak awal pembukuan
  const kasOperasi = opsIn - opsOut;
  const kasInvestasi = -investasiOut;
  const kasPendanaan = pendanaanIn;
  const saldoAkhir = saldoKasAwal + kasOperasi + kasInvestasi + kasPendanaan;

  return { opsIn, opsOut, kasOperasi, kasInvestasi, kasPendanaan, saldoAkhir };
}

// ---------- KAS PER KATEGORI (Ops/Tanah/Konstruksi/Legalitas/PLN/Overhead/Marketing) ----------
export async function kasKategori(cat: string) {
  const lines = await getApprovedLines();
  return lines
    .filter((l) => l.cashCategory === cat)
    .sort((a, b) => (a.entryDate < b.entryDate ? -1 : 1));
}

export async function rincianUangKeluar() {
  const lines = await getApprovedLines();
  const cats = ["TANAH", "KONSTRUKSI", "LEGALITAS", "PLN", "OVERHEAD", "MARKETING", "OPS"];
  const result = cats.map((c) => {
    const total = lines
      .filter((l) => l.cashCategory === c)
      .reduce((s, l) => s + l.debit - l.credit, 0);
    return { kategori: c, total };
  });
  const totalKeluar = result.reduce((s, r) => s + r.total, 0);
  return { result, totalKeluar };
}

// ---------- KAS MASUK / KARTU KONSUMEN ----------
export async function kasMasukPerUnit() {
  const lines = await getApprovedLines();
  const allUnits = await db.query.units.findMany({ with: { customer: true } });
  return allUnits.map((u) => {
    const masuk = lines
      .filter((l) => l.unitId === u.id && l.accountCode === "2130")
      .reduce((s, l) => s + l.credit - l.debit, 0);
    const hargaJual = parseFloat(u.hargaJual as unknown as string) || 0;
    const sisa = hargaJual - masuk;
    return {
      unit: u,
      customerName: u.customer?.name ?? "-",
      hargaJual,
      totalMasuk: masuk,
      sisaTagihan: sisa,
      persenLunas: hargaJual > 0 ? masuk / hargaJual : 0,
    };
  });
}

// ---------- KARTU BORONGAN (bayar tukang per kavling) ----------
export async function kartuBorongan() {
  const lines = await getApprovedLines();
  const allUnits = await db.query.units.findMany({ with: { contractor: true } });
  return allUnits
    .filter((u) => parseFloat(u.nilaiKontrakKonstruksi as unknown as string) > 0)
    .map((u) => {
      const terbayar = lines
        .filter((l) => l.unitId === u.id && (l.accountCode === "1213" || l.accountCode === "5130"))
        .reduce((s, l) => s + l.debit - l.credit, 0);
      const nilaiKontrak = parseFloat(u.nilaiKontrakKonstruksi as unknown as string) || 0;
      return {
        unit: u,
        contractorName: u.contractor?.name ?? "-",
        nilaiKontrak,
        terbayar,
        sisaBayar: nilaiKontrak - terbayar,
        progres: nilaiKontrak > 0 ? terbayar / nilaiKontrak : 0,
      };
    });
}

// ---------- KARTU HUTANG (2110 Hutang Usaha) ----------
export async function kartuHutang() {
  const lines = (await getApprovedLines())
    .filter((l) => l.accountCode === "2110")
    .sort((a, b) => (a.entryDate < b.entryDate ? -1 : 1));
  let running = 0;
  const rows = lines.map((l) => {
    running += l.credit - l.debit;
    return { ...l, sisaHutang: running, status: running <= 0 ? "LUNAS" : "BELUM LUNAS" };
  });
  return { rows, totalOutstanding: running };
}

// ---------- HPP PER UNIT ----------
export async function hppPerUnit() {
  const lines = await getApprovedLines();
  const allUnits = await db.query.units.findMany();
  return allUnits.map((u) => {
    const hppAktual = lines
      .filter((l) => l.unitId === u.id && (l.accountCode.startsWith("12") || l.accountCode.startsWith("5")))
      .reduce((s, l) => s + l.debit - l.credit, 0);
    const budget =
      (parseFloat(u.budgetTanah as unknown as string) || 0) +
      (parseFloat(u.budgetInfra as unknown as string) || 0) +
      (parseFloat(u.budgetMaterial as unknown as string) || 0) +
      (parseFloat(u.budgetUpah as unknown as string) || 0) +
      (parseFloat(u.budgetLegal as unknown as string) || 0) +
      (parseFloat(u.budgetDesain as unknown as string) || 0) +
      (parseFloat(u.budgetOverhead as unknown as string) || 0);
    const hargaJual = parseFloat(u.hargaJual as unknown as string) || 0;
    return {
      unit: u,
      budget,
      hppAktual,
      variance: hppAktual - budget,
      variancePct: budget > 0 ? (hppAktual - budget) / budget : 0,
      marginKotor: hargaJual - hppAktual,
    };
  });
}

// ---------- DASHBOARD ----------
export async function dashboardSummary() {
  const lines = await getApprovedLines();
  const bankMandiri = sumByCode(lines, "1113");
  const bankBCA = sumByCode(lines, "1112");
  const totalKas = bankMandiri + bankBCA;
  const n = await neraca();
  const { result: rincian, totalKeluar } = await rincianUangKeluar();
  const kasMasukUnits = await kasMasukPerUnit();
  const omzetMasuk = kasMasukUnits.reduce((s, u) => s + u.totalMasuk, 0);

  return {
    bankMandiri,
    bankBCA,
    totalKas,
    totalAset: n.aset.totalAset,
    totalKewajiban: n.kewajiban.totalKewajiban,
    totalEkuitas: n.ekuitas.totalEkuitas,
    wipTotal: n.aset.wipTotal,
    omzetMasuk,
    totalKeluar,
    rincianKeluar: rincian,
    labaRugiBerjalan: n.ekuitas.labaBerjalan,
  };
}
