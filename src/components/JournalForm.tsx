"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTransaction, type CreateTxInput } from "@/lib/actions/journal";
import { TX_TYPE_LABEL, type TxType } from "@/lib/transactionTypes";

type Account = { id: number; code: string; name: string; type: string; category: string };
type Unit = { id: number; code: string };
type Customer = { id: number; name: string };
type Contractor = { id: number; name: string };

export function JournalForm({
  bankAccounts,
  targetAccounts,
  allAccounts,
  units,
  customers,
  contractors,
  role,
}: {
  bankAccounts: Account[];
  targetAccounts: Account[];
  allAccounts: Account[];
  units: Unit[];
  customers: Customer[];
  contractors: Contractor[];
  role: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<TxType>("KAS_KELUAR");
  const [error, setError] = useState("");
  const [manualLines, setManualLines] = useState([
    { accountCode: "", debit: "", credit: "" },
    { accountCode: "", debit: "", credit: "" },
  ]);

  const today = new Date().toISOString().slice(0, 10);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);

    const input: CreateTxInput = {
      type,
      entryDate: (fd.get("entryDate") as string) || today,
      noBukti: (fd.get("noBukti") as string) || undefined,
      description: (fd.get("description") as string) || "",
      unitId: fd.get("unitId") ? Number(fd.get("unitId")) : undefined,
      customerId: fd.get("customerId") ? Number(fd.get("customerId")) : undefined,
      contractorId: fd.get("contractorId") ? Number(fd.get("contractorId")) : undefined,
      jumlah: fd.get("jumlah") ? Number(fd.get("jumlah")) : undefined,
      targetAccountCode: (fd.get("targetAccountCode") as string) || undefined,
      sourceAccountCode: (fd.get("sourceAccountCode") as string) || undefined,
      fromAccountCode: (fd.get("fromAccountCode") as string) || undefined,
      toAccountCode: (fd.get("toAccountCode") as string) || undefined,
      manualLines:
        type === "MANUAL"
          ? manualLines
              .filter((l) => l.accountCode)
              .map((l) => ({ accountCode: l.accountCode, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 }))
          : undefined,
    };

    startTransition(async () => {
      try {
        await createTransaction(input);
        router.push("/jurnal");
        router.refresh();
      } catch (err: any) {
        setError(err.message ?? "Gagal menyimpan transaksi");
      }
    });
  }

  const inputCls =
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900";
  const labelCls = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div>
        <label className={labelCls}>Jenis Transaksi</label>
        <select className={inputCls} value={type} onChange={(e) => setType(e.target.value as TxType)}>
          {Object.entries(TX_TYPE_LABEL)
            .filter(([k]) => k !== "MANUAL" || role === "OWNER")
            .map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Tanggal</label>
          <input type="date" name="entryDate" defaultValue={today} className={inputCls} required />
        </div>
        <div>
          <label className={labelCls}>No. Bukti (opsional)</label>
          <input type="text" name="noBukti" placeholder="BKK-08-001" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Keterangan</label>
        <input type="text" name="description" placeholder="mis. Bayar tukang, beli semen" className={inputCls} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Kavling (opsional, kosongkan jika Umum)</label>
          <select name="unitId" className={inputCls} defaultValue="">
            <option value="">— Umum —</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code}
              </option>
            ))}
          </select>
        </div>
        {type === "KAS_MASUK_KONSUMEN" && (
          <div>
            <label className={labelCls}>Konsumen</label>
            <select name="customerId" className={inputCls}>
              <option value="">— pilih —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {type === "KAS_KELUAR" && (
          <div>
            <label className={labelCls}>Kontraktor (opsional)</label>
            <select name="contractorId" className={inputCls} defaultValue="">
              <option value="">—</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {type !== "MANUAL" && (
        <div>
          <label className={labelCls}>Jumlah (Rp)</label>
          <input type="number" name="jumlah" min={1} className={inputCls} required />
        </div>
      )}

      {type === "KAS_KELUAR" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Untuk Biaya Apa (akun tujuan)</label>
            <select name="targetAccountCode" className={inputCls} required>
              <option value="">— pilih akun —</option>
              {targetAccounts.map((a) => (
                <option key={a.id} value={a.code}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Sumber Dana</label>
            <select name="sourceAccountCode" className={inputCls} required>
              <option value="">— pilih —</option>
              {bankAccounts.map((a) => (
                <option key={a.id} value={a.code}>
                  {a.name}
                </option>
              ))}
              <option value="2110">Hutang Usaha (belum dibayar)</option>
              <option value="2300">Dana Owner Langsung / Non-Kas</option>
            </select>
          </div>
        </div>
      )}

      {(type === "KAS_MASUK_KONSUMEN" || type === "SETOR_MODAL" || type === "BAYAR_HUTANG_USAHA") && (
        <div>
          <label className={labelCls}>
            {type === "BAYAR_HUTANG_USAHA" ? "Dibayar Dari" : "Masuk Ke Rekening"}
          </label>
          <select name="sourceAccountCode" className={inputCls} required>
            <option value="">— pilih —</option>
            {bankAccounts.map((a) => (
              <option key={a.id} value={a.code}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {type === "MUTASI_INTERNAL" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Dari Rekening</label>
            <select name="fromAccountCode" className={inputCls} required>
              <option value="">— pilih —</option>
              {bankAccounts.map((a) => (
                <option key={a.id} value={a.code}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Ke Rekening</label>
            <select name="toAccountCode" className={inputCls} required>
              <option value="">— pilih —</option>
              {bankAccounts.map((a) => (
                <option key={a.id} value={a.code}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {type === "MANUAL" && (
        <div>
          <label className={labelCls}>Baris Jurnal (debit harus = kredit)</label>
          <div className="space-y-2">
            {manualLines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-2">
                <select
                  className={inputCls}
                  value={line.accountCode}
                  onChange={(e) => {
                    const copy = [...manualLines];
                    copy[idx].accountCode = e.target.value;
                    setManualLines(copy);
                  }}
                >
                  <option value="">— akun —</option>
                  {allAccounts.map((a) => (
                    <option key={a.id} value={a.code}>
                      {a.code} — {a.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Debit"
                  className={inputCls}
                  value={line.debit}
                  onChange={(e) => {
                    const copy = [...manualLines];
                    copy[idx].debit = e.target.value;
                    setManualLines(copy);
                  }}
                />
                <input
                  type="number"
                  placeholder="Kredit"
                  className={inputCls}
                  value={line.credit}
                  onChange={(e) => {
                    const copy = [...manualLines];
                    copy[idx].credit = e.target.value;
                    setManualLines(copy);
                  }}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mt-2 text-sm text-slate-600 underline"
            onClick={() => setManualLines([...manualLines, { accountCode: "", debit: "", credit: "" }])}
          >
            + tambah baris
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-slate-900 text-white text-sm font-medium px-5 py-2.5 hover:bg-slate-800 disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : role === "OWNER" ? "Simpan & Auto-Approve" : "Simpan (Menunggu Persetujuan Owner)"}
      </button>
    </form>
  );
}
