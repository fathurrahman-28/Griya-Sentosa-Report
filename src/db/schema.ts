import {
  pgTable,
  pgEnum,
  serial,
  text,
  varchar,
  numeric,
  integer,
  boolean,
  timestamp,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------- ENUMS ----------
export const roleEnum = pgEnum("role", ["OWNER", "ADMIN", "VIEWER"]);
export const accountTypeEnum = pgEnum("account_type", ["HEADER", "DETAIL"]);
export const accountCategoryEnum = pgEnum("account_category", [
  "ASET",
  "KEWAJIBAN",
  "EKUITAS",
  "PENDAPATAN",
  "HPP",
  "BEBAN",
  "LAIN_LAIN",
]);
export const normalBalanceEnum = pgEnum("normal_balance", ["DEBIT", "KREDIT"]);
// dipakai buat auto-bucketing ke sheet "Kas per kategori" (Kas Ops/Tanah/Konstruksi/dll)
export const cashCategoryEnum = pgEnum("cash_category", [
  "TANAH",
  "KONSTRUKSI",
  "LEGALITAS",
  "PLN",
  "OVERHEAD",
  "OPS",
  "MARKETING",
  "LAIN",
]);
export const unitStatusEnum = pgEnum("unit_status", [
  "TERSEDIA",
  "DIPESAN",
  "TERJUAL",
]);
export const entryStatusEnum = pgEnum("entry_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);
export const channelEnum = pgEnum("channel", ["WEB", "TELEGRAM", "WHATSAPP"]);

// ---------- USERS ----------
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull(),
  telegramChatId: varchar("telegram_chat_id", { length: 50 }),
  whatsappNumber: varchar("whatsapp_number", { length: 30 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- CHART OF ACCOUNTS (DATA AKUN) ----------
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
  type: accountTypeEnum("type").notNull().default("DETAIL"),
  category: accountCategoryEnum("category").notNull(),
  normalBalance: normalBalanceEnum("normal_balance").notNull(),
  cashCategory: cashCategoryEnum("cash_category"), // null kalau bukan akun kas/beban proyek
  active: boolean("active").notNull().default(true),
});

// ---------- CUSTOMERS (KONSUMEN) ----------
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- CONTRACTORS (KONTRAKTOR / BORONGAN) ----------
export const contractors = pgTable("contractors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- UNITS / KAVLING (MASTER PROYEK) — manual ----------
export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 30 }).notNull().unique(), // "Kavling 1"
  projectName: varchar("project_name", { length: 100 })
    .notNull()
    .default("Griya Sentosa"),
  tipe: varchar("tipe", { length: 30 }), // "Type 45"
  luasTanah: numeric("luas_tanah", { precision: 14, scale: 2 }),
  luasBangunan: numeric("luas_bangunan", { precision: 14, scale: 2 }),
  budgetTanah: numeric("budget_tanah", { precision: 16, scale: 2 }).default("0"),
  budgetInfra: numeric("budget_infra", { precision: 16, scale: 2 }).default("0"),
  budgetMaterial: numeric("budget_material", { precision: 16, scale: 2 }).default("0"),
  budgetUpah: numeric("budget_upah", { precision: 16, scale: 2 }).default("0"),
  budgetLegal: numeric("budget_legal", { precision: 16, scale: 2 }).default("0"),
  budgetDesain: numeric("budget_desain", { precision: 16, scale: 2 }).default("0"),
  budgetOverhead: numeric("budget_overhead", { precision: 16, scale: 2 }).default("0"),
  hargaJual: numeric("harga_jual", { precision: 16, scale: 2 }).notNull().default("0"),
  status: unitStatusEnum("status").notNull().default("TERSEDIA"),
  customerId: integer("customer_id").references(() => customers.id),
  tglPPJB: date("tgl_ppjb"),
  targetSerahTerima: date("target_serah_terima"),
  tglAJB: date("tgl_ajb"),
  tglBAST: date("tgl_bast"),
  nilaiKontrakKonstruksi: numeric("nilai_kontrak_konstruksi", {
    precision: 16,
    scale: 2,
  }).default("0"),
  contractorId: integer("contractor_id").references(() => contractors.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------- JOURNAL ENTRIES (JURNAL TRANSAKSI) — sumber tunggal ----------
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  entryDate: date("entry_date").notNull(),
  noBukti: varchar("no_bukti", { length: 40 }),
  description: text("description").notNull(),
  unitId: integer("unit_id").references(() => units.id), // null = "Umum"
  customerId: integer("customer_id").references(() => customers.id),
  contractorId: integer("contractor_id").references(() => contractors.id),
  status: entryStatusEnum("status").notNull().default("PENDING"),
  channel: channelEnum("channel").notNull().default("WEB"),
  createdByUserId: integer("created_by_user_id")
    .notNull()
    .references(() => users.id),
  approvedByUserId: integer("approved_by_user_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionNote: text("rejection_note"),
  rawBotMessage: text("raw_bot_message"), // audit trail teks asli dari bot
  telegramMessageId: varchar("telegram_message_id", { length: 40 }), // buat edit tombol approve
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- JOURNAL LINES (debit/kredit) ----------
export const journalLines = pgTable("journal_lines", {
  id: serial("id").primaryKey(),
  journalEntryId: integer("journal_entry_id")
    .notNull()
    .references(() => journalEntries.id, { onDelete: "cascade" }),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id),
  debit: numeric("debit", { precision: 16, scale: 2 }).notNull().default("0"),
  credit: numeric("credit", { precision: 16, scale: 2 }).notNull().default("0"),
  memo: text("memo"),
});

// ---------- ESTIMASI CASHFLOW — manual ----------
export const estimasiCashflowItems = pgTable("estimasi_cashflow_items", {
  id: serial("id").primaryKey(),
  kelompok: varchar("kelompok", { length: 20 }).notNull(), // "KAS_MASUK" | "KAS_KELUAR"
  section: varchar("section", { length: 150 }).notNull(), // "A. PENJUALAN RUMAH"
  itemName: varchar("item_name", { length: 200 }).notNull(),
  qty: numeric("qty", { precision: 14, scale: 2 }).default("1"),
  satuan: varchar("satuan", { length: 30 }),
  hargaSatuan: numeric("harga_satuan", { precision: 16, scale: 2 }).default("0"),
  total: numeric("total", { precision: 16, scale: 2 }).notNull().default("0"),
  urutan: integer("urutan").notNull().default(0),
});

// ---------- EKUITAS — manual (proyeksi) ----------
export const ekuitasItems = pgTable("ekuitas_items", {
  id: serial("id").primaryKey(),
  kelompok: varchar("kelompok", { length: 20 }).notNull(), // "OMZET" | "LIABILITAS"
  section: varchar("section", { length: 150 }).notNull(),
  itemName: varchar("item_name", { length: 200 }).notNull(),
  qty: numeric("qty", { precision: 14, scale: 2 }).default("1"),
  satuan: varchar("satuan", { length: 30 }),
  hargaSatuan: numeric("harga_satuan", { precision: 16, scale: 2 }).default("0"),
  total: numeric("total", { precision: 16, scale: 2 }).notNull().default("0"),
  urutan: integer("urutan").notNull().default(0),
});

// ---------- BOT DRAFTS (percakapan bot sebelum jadi transaksi PENDING) ----------
export const botDrafts = pgTable("bot_drafts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  channel: channelEnum("channel").notNull(),
  externalChatId: varchar("external_chat_id", { length: 50 }).notNull(),
  rawText: text("raw_text").notNull(),
  parsedJson: text("parsed_json"), // hasil parsing Claude, JSON string
  status: varchar("status", { length: 20 }).notNull().default("DRAFT"), // DRAFT|CONFIRMED|CANCELLED
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- RELATIONS ----------
export const usersRelations = relations(users, ({ many }) => ({
  createdEntries: many(journalEntries, { relationName: "createdBy" }),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  customer: one(customers, { fields: [units.customerId], references: [customers.id] }),
  contractor: one(contractors, {
    fields: [units.contractorId],
    references: [contractors.id],
  }),
  journalEntries: many(journalEntries),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one, many }) => ({
  unit: one(units, { fields: [journalEntries.unitId], references: [units.id] }),
  customer: one(customers, {
    fields: [journalEntries.customerId],
    references: [customers.id],
  }),
  contractor: one(contractors, {
    fields: [journalEntries.contractorId],
    references: [contractors.id],
  }),
  createdBy: one(users, {
    fields: [journalEntries.createdByUserId],
    references: [users.id],
  }),
  approvedBy: one(users, {
    fields: [journalEntries.approvedByUserId],
    references: [users.id],
  }),
  lines: many(journalLines),
}));

export const journalLinesRelations = relations(journalLines, ({ one }) => ({
  entry: one(journalEntries, {
    fields: [journalLines.journalEntryId],
    references: [journalEntries.id],
  }),
  account: one(accounts, { fields: [journalLines.accountId], references: [accounts.id] }),
}));

export const accountsRelations = relations(accounts, ({ many }) => ({
  lines: many(journalLines),
}));
