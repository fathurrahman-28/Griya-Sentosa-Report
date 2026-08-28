// Jenis transaksi siap-pakai. Admin (atau bot) cukup pilih jenis + isi field
// yang relevan; sistem yang menyusun baris debit/kredit di baliknya, supaya
// pengguna non-akuntan tidak perlu paham double-entry.

export type TxType =
  | "KAS_KELUAR"
  | "KAS_MASUK_KONSUMEN"
  | "SETOR_MODAL"
  | "MUTASI_INTERNAL"
  | "BAYAR_HUTANG_USAHA"
  | "MANUAL";

export const TX_TYPE_LABEL: Record<TxType, string> = {
  KAS_KELUAR: "Kas Keluar (bayar biaya proyek/operasional)",
  KAS_MASUK_KONSUMEN: "Kas Masuk dari Konsumen",
  SETOR_MODAL: "Setoran Modal Owner",
  MUTASI_INTERNAL: "Mutasi Internal Antar Rekening",
  BAYAR_HUTANG_USAHA: "Bayar Hutang Usaha",
  MANUAL: "Jurnal Manual (bebas)",
};

// Akun sumber dana / bank yang bisa dipilih (kas & bank + hutang, sesuai "Dibayar Via" di file asli)
export const SUMBER_DANA_CODES = ["1113", "1112", "1111", "2110", "2300"];
// 1113 Bank Mandiri, 1112 Bank BCA, 1111 Kas Kecil, 2110 Hutang Usaha (belum dibayar), 2300 Hutang Kepada Pemilik (dana non-kas owner)

export const BANK_CODES = ["1113", "1112", "1111"];
