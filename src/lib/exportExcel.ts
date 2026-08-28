import ExcelJS from "exceljs";
import { db } from "@/db";
import {
  neraca,
  labaRugi,
  arusKas,
  bukuBesar,
  kasKategori,
  rincianUangKeluar,
  kasMasukPerUnit,
  kartuBorongan,
  kartuHutang,
  hppPerUnit,
  dashboardSummary,
} from "@/lib/ledger";
import { journalEntries } from "@/db/schema";
import { eq } from "drizzle-orm";

const RP = '"Rp"#,##0';
const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
const HEADER_FONT: Partial<ExcelJS.Font> = { color: { argb: "FFFFFFFF" }, bold: true };

function styleHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
  });
}

function autoWidth(ws: ExcelJS.Worksheet) {
  const widths: number[] = [];
  ws.eachRow({ includeEmpty: true }, (row) => {
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const len = cell.value ? String(cell.value).length : 0;
      widths[colNumber] = Math.max(widths[colNumber] ?? 10, len + 2);
    });
  });
  widths.forEach((w, i) => {
    if (i === 0) return;
    const col = ws.getColumn(i);
    col.width = Math.min(w, 45);
  });
}

export async function generateWorkbook(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Griya Sentosa App";
  wb.created = new Date();

  // ---------- DASHBOARD ----------
  {
    const s = await dashboardSummary();
    const ws = wb.addWorksheet("DASHBOARD");
    ws.addRow(["DASHBOARD — GRIYA SENTOSA"]).font = { bold: true, size: 14 };
    ws.addRow([`Diexport: ${new Date().toLocaleString("id-ID")}`]);
    ws.addRow([]);
    const h1 = ws.addRow(["Bank Mandiri", "Bank BCA", "Total Kas"]);
    styleHeader(h1);
    ws.addRow([s.bankMandiri, s.bankBCA, s.totalKas]).eachCell((c) => (c.numFmt = RP));
    ws.addRow([]);
    const h2 = ws.addRow(["Total Aset", "Total Kewajiban", "Total Ekuitas", "WIP Total", "Laba Rugi Berjalan"]);
    styleHeader(h2);
    ws.addRow([s.totalAset, s.totalKewajiban, s.totalEkuitas, s.wipTotal, s.labaRugiBerjalan]).eachCell(
      (c) => (c.numFmt = RP)
    );
    ws.addRow([]);
    const h3 = ws.addRow(["Rincian Uang Keluar per Kategori"]);
    h3.font = { bold: true };
    const h4 = ws.addRow(["Kategori", "Total"]);
    styleHeader(h4);
    for (const r of s.rincianKeluar) {
      ws.addRow([r.kategori, r.total]).getCell(2).numFmt = RP;
    }
    autoWidth(ws);
  }

  // ---------- JURNAL TRANSAKSI ----------
  {
    const ws = wb.addWorksheet("JURNAL TRANSAKSI");
    const header = ws.addRow([
      "No", "Tanggal", "No Bukti", "Keterangan", "Kavling", "Akun", "Debit", "Kredit", "Status", "Channel", "Dibuat Oleh",
    ]);
    styleHeader(header);
    const entries = await db.query.journalEntries.findMany({
      with: { lines: { with: { account: true } }, unit: true, createdBy: true },
      orderBy: (e, { asc }) => [asc(e.entryDate), asc(e.id)],
    });
    let no = 1;
    for (const e of entries) {
      for (const l of e.lines) {
        const row = ws.addRow([
          no,
          e.entryDate,
          e.noBukti ?? "",
          e.description,
          e.unit?.code ?? "Umum",
          `${l.account.code} - ${l.account.name}`,
          parseFloat(l.debit as unknown as string) || 0,
          parseFloat(l.credit as unknown as string) || 0,
          e.status,
          e.channel,
          e.createdBy?.name ?? "",
        ]);
        row.getCell(7).numFmt = RP;
        row.getCell(8).numFmt = RP;
      }
      no++;
    }
    autoWidth(ws);
  }

  // ---------- NERACA ----------
  {
    const n = await neraca();
    const ws = wb.addWorksheet("NERACA");
    ws.addRow(["NERACA — PT Griya Sentosa Property"]).font = { bold: true, size: 14 };
    ws.addRow([`Per ${new Date().toLocaleDateString("id-ID")}`]);
    ws.addRow([]);
    ws.addRow(["ASET"]).font = { bold: true };
    const asetRows: [string, number][] = [
      ["Kas & Bank", n.aset.kasBank],
      ["Piutang", n.aset.piutang],
      ["Persediaan", n.aset.persediaan],
      ["WIP - Tanah & Pematangan", n.aset.wipTanah],
      ["WIP - Upah Borongan", n.aset.wipUpah],
      ["WIP - Legalitas", n.aset.wipLegal],
      ["WIP - Overhead & Desain", n.aset.wipOverhead],
      ["WIP - Utilitas", n.aset.wipUtilitas],
      ["Aset Tetap", n.aset.asetTetap],
    ];
    for (const [label, val] of asetRows) ws.addRow(["", label, val]).getCell(3).numFmt = RP;
    const totalAsetRow = ws.addRow(["", "TOTAL ASET", n.aset.totalAset]);
    totalAsetRow.font = { bold: true };
    totalAsetRow.getCell(3).numFmt = RP;
    ws.addRow([]);
    ws.addRow(["KEWAJIBAN"]).font = { bold: true };
    const kwjRows: [string, number][] = [
      ["Hutang Usaha", n.kewajiban.hutangUsaha],
      ["Hutang Pajak", n.kewajiban.hutangPajak],
      ["Uang Muka Konsumen", n.kewajiban.uangMukaKonsumen],
      ["Hutang Bank", n.kewajiban.hutangBank],
      ["Hutang Kepada Pemilik", n.kewajiban.hutangPemilik],
    ];
    for (const [label, val] of kwjRows) ws.addRow(["", label, val]).getCell(3).numFmt = RP;
    const totalKwjRow = ws.addRow(["", "TOTAL KEWAJIBAN", n.kewajiban.totalKewajiban]);
    totalKwjRow.font = { bold: true };
    totalKwjRow.getCell(3).numFmt = RP;
    ws.addRow([]);
    ws.addRow(["EKUITAS"]).font = { bold: true };
    const ekRows: [string, number][] = [
      ["Modal Disetor", n.ekuitas.modalDisetor],
      ["Laba Ditahan", n.ekuitas.labaDitahan],
      ["Laba Rugi Tahun Berjalan", n.ekuitas.labaBerjalan],
    ];
    for (const [label, val] of ekRows) ws.addRow(["", label, val]).getCell(3).numFmt = RP;
    const totalEkRow = ws.addRow(["", "TOTAL EKUITAS", n.ekuitas.totalEkuitas]);
    totalEkRow.font = { bold: true };
    totalEkRow.getCell(3).numFmt = RP;
    autoWidth(ws);
  }

  // ---------- LABA RUGI ----------
  {
    const lr = await labaRugi();
    const ws = wb.addWorksheet("LABA RUGI");
    ws.addRow(["LAPORAN LABA RUGI — PT Griya Sentosa Property"]).font = { bold: true, size: 14 };
    ws.addRow([]);
    ws.addRow(["Total Pendapatan", lr.pendapatan]).getCell(2).numFmt = RP;
    ws.addRow(["HPP", lr.hpp]).getCell(2).numFmt = RP;
    const gp = ws.addRow(["Laba Kotor", lr.labaKotor]);
    gp.font = { bold: true };
    gp.getCell(2).numFmt = RP;
    ws.addRow([]);
    ws.addRow(["Beban Operasional"]).font = { bold: true };
    for (const b of lr.bebanDetail) ws.addRow(["", b.name, b.total]).getCell(3).numFmt = RP;
    ws.addRow(["Total Beban", lr.totalBeban]).getCell(2).numFmt = RP;
    ws.addRow([]);
    const net = ws.addRow(["LABA RUGI TAHUN BERJALAN", lr.labaBersih]);
    net.font = { bold: true, size: 12 };
    net.getCell(2).numFmt = RP;
    autoWidth(ws);
  }

  // ---------- ARUS KAS ----------
  {
    const ak = await arusKas();
    const ws = wb.addWorksheet("ARUS KAS");
    ws.addRow(["LAPORAN ARUS KAS"]).font = { bold: true, size: 14 };
    ws.addRow([]);
    ws.addRow(["Kas Masuk Operasi", ak.opsIn]).getCell(2).numFmt = RP;
    ws.addRow(["Kas Keluar Operasi", ak.opsOut]).getCell(2).numFmt = RP;
    ws.addRow(["Arus Kas Operasi", ak.kasOperasi]).getCell(2).numFmt = RP;
    ws.addRow(["Arus Kas Investasi", ak.kasInvestasi]).getCell(2).numFmt = RP;
    ws.addRow(["Arus Kas Pendanaan", ak.kasPendanaan]).getCell(2).numFmt = RP;
    const saldo = ws.addRow(["SALDO KAS", ak.saldoAkhir]);
    saldo.font = { bold: true };
    saldo.getCell(2).numFmt = RP;
    autoWidth(ws);
  }

  // ---------- BUKU BESAR ----------
  {
    const ws = wb.addWorksheet("BUKU BESAR");
    const data = await bukuBesar();
    let r = 1;
    for (const { account, rows, saldoAkhir } of data) {
      const h = ws.addRow([`${account.code} — ${account.name}`, "", "", "", "", `Saldo: ${saldoAkhir}`]);
      h.font = { bold: true };
      const header = ws.addRow(["Tanggal", "Keterangan", "Kavling", "Debit", "Kredit", "Saldo"]);
      styleHeader(header);
      for (const row of rows) {
        const rr = ws.addRow([row.entryDate, row.description, row.unitCode ?? "Umum", row.debit, row.credit, row.runningBalance]);
        rr.getCell(4).numFmt = RP;
        rr.getCell(5).numFmt = RP;
        rr.getCell(6).numFmt = RP;
      }
      ws.addRow([]);
    }
    autoWidth(ws);
  }

  // ---------- KAS PER KATEGORI ----------
  const categories = [
    ["OPS", "KAS OPS"],
    ["TANAH", "KAS TANAH"],
    ["KONSTRUKSI", "KAS KONSTRUKSI"],
    ["LEGALITAS", "KAS LEGALITAS"],
    ["PLN", "KAS PLN"],
    ["OVERHEAD", "KAS OVERHEAD"],
  ];
  for (const [key, sheetName] of categories) {
    const ws = wb.addWorksheet(sheetName);
    const header = ws.addRow(["Tanggal", "No Bukti", "Akun", "Kavling", "Keterangan", "Jumlah"]);
    styleHeader(header);
    const rows = await kasKategori(key);
    for (const row of rows) {
      const rr = ws.addRow([row.entryDate, row.noBukti ?? "", `${row.accountCode} ${row.accountName}`, row.unitCode ?? "Umum", row.description, row.debit - row.credit]);
      rr.getCell(6).numFmt = RP;
    }
    autoWidth(ws);
  }

  // ---------- KAS MASUK / KARTU KONSUMEN ----------
  {
    const ws = wb.addWorksheet("KAS MASUK");
    const header = ws.addRow(["Kavling", "Konsumen", "Harga Jual", "Total Masuk", "Sisa Tagihan", "% Lunas"]);
    styleHeader(header);
    const data = await kasMasukPerUnit();
    for (const d of data) {
      const rr = ws.addRow([d.unit.code, d.customerName, d.hargaJual, d.totalMasuk, d.sisaTagihan, d.persenLunas]);
      rr.getCell(3).numFmt = RP;
      rr.getCell(4).numFmt = RP;
      rr.getCell(5).numFmt = RP;
      rr.getCell(6).numFmt = "0%";
    }
    autoWidth(ws);
  }

  // ---------- KARTU BORONGAN ----------
  {
    const ws = wb.addWorksheet("KARTU BORONGAN");
    const header = ws.addRow(["Kavling", "Kontraktor", "Nilai Kontrak", "Terbayar", "Sisa Bayar", "Progres"]);
    styleHeader(header);
    const data = await kartuBorongan();
    for (const d of data) {
      const rr = ws.addRow([d.unit.code, d.contractorName, d.nilaiKontrak, d.terbayar, d.sisaBayar, d.progres]);
      rr.getCell(3).numFmt = RP;
      rr.getCell(4).numFmt = RP;
      rr.getCell(5).numFmt = RP;
      rr.getCell(6).numFmt = "0%";
    }
    autoWidth(ws);
  }

  // ---------- KARTU HUTANG ----------
  {
    const ws = wb.addWorksheet("KARTU HUTANG");
    const header = ws.addRow(["Tanggal", "Keterangan", "Timbul", "Dibayar", "Sisa", "Status"]);
    styleHeader(header);
    const { rows } = await kartuHutang();
    for (const r of rows) {
      const rr = ws.addRow([r.entryDate, r.description, r.credit, r.debit, r.sisaHutang, r.status]);
      rr.getCell(3).numFmt = RP;
      rr.getCell(4).numFmt = RP;
      rr.getCell(5).numFmt = RP;
    }
    autoWidth(ws);
  }

  // ---------- HPP PER UNIT ----------
  {
    const ws = wb.addWorksheet("HPP PER UNIT");
    const header = ws.addRow(["Kavling", "Budget", "HPP Aktual", "Variance", "Margin Kotor"]);
    styleHeader(header);
    const data = await hppPerUnit();
    for (const d of data) {
      const rr = ws.addRow([d.unit.code, d.budget, d.hppAktual, d.variance, d.marginKotor]);
      rr.getCell(2).numFmt = RP;
      rr.getCell(3).numFmt = RP;
      rr.getCell(4).numFmt = RP;
      rr.getCell(5).numFmt = RP;
    }
    autoWidth(ws);
  }

  // ---------- MASTER PROYEK ----------
  {
    const ws = wb.addWorksheet("MASTER PROYEK");
    const header = ws.addRow([
      "Kavling", "Tipe", "Luas Tanah", "Luas Bangunan", "Budget Total", "Harga Jual", "Status", "Konsumen", "Nilai Kontrak Konstruksi", "Kontraktor",
    ]);
    styleHeader(header);
    const list = await db.query.units.findMany({ with: { customer: true, contractor: true } });
    for (const u of list) {
      const budget =
        (parseFloat(u.budgetTanah as unknown as string) || 0) +
        (parseFloat(u.budgetInfra as unknown as string) || 0) +
        (parseFloat(u.budgetMaterial as unknown as string) || 0) +
        (parseFloat(u.budgetUpah as unknown as string) || 0) +
        (parseFloat(u.budgetLegal as unknown as string) || 0) +
        (parseFloat(u.budgetDesain as unknown as string) || 0) +
        (parseFloat(u.budgetOverhead as unknown as string) || 0);
      const rr = ws.addRow([
        u.code,
        u.tipe,
        u.luasTanah,
        u.luasBangunan,
        budget,
        u.hargaJual,
        u.status,
        u.customer?.name ?? "-",
        u.nilaiKontrakKonstruksi,
        u.contractor?.name ?? "-",
      ]);
      rr.getCell(5).numFmt = RP;
      rr.getCell(6).numFmt = RP;
      rr.getCell(9).numFmt = RP;
    }
    autoWidth(ws);
  }

  // ---------- DATA AKUN ----------
  {
    const ws = wb.addWorksheet("DATA AKUN");
    const header = ws.addRow(["Kode", "Nama Akun", "Tipe", "Kategori", "Normal", "Aktif"]);
    styleHeader(header);
    const list = await db.query.accounts.findMany({ orderBy: (a, { asc }) => [asc(a.code)] });
    for (const a of list) {
      ws.addRow([a.code, a.name, a.type, a.category, a.normalBalance, a.active ? "Y" : "N"]);
    }
    autoWidth(ws);
  }

  // ---------- ESTIMASI CASHFLOW & EKUITAS ----------
  for (const [table, sheetName] of [
    [await db.query.estimasiCashflowItems.findMany(), "ESTIMASI CASHFLOW"],
    [await db.query.ekuitasItems.findMany(), "EKUITAS"],
  ] as const) {
    const ws = wb.addWorksheet(sheetName);
    const header = ws.addRow(["Kelompok", "Bagian", "Item", "Qty", "Satuan", "Harga Satuan", "Total"]);
    styleHeader(header);
    for (const i of table as any[]) {
      const rr = ws.addRow([i.kelompok, i.section, i.itemName, i.qty, i.satuan, i.hargaSatuan, i.total]);
      rr.getCell(6).numFmt = RP;
      rr.getCell(7).numFmt = RP;
    }
    autoWidth(ws);
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
