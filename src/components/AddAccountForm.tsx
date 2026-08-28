"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAccount } from "@/lib/actions/masterData";

export function AddAccountForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const inputCls = "rounded-md border border-slate-300 px-2 py-1.5 text-sm";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createAccount({
          code: fd.get("code") as string,
          name: fd.get("name") as string,
          type: fd.get("type") as any,
          category: fd.get("category") as any,
          normalBalance: fd.get("normalBalance") as any,
          cashCategory: (fd.get("cashCategory") as string) || undefined,
        });
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } catch (err: any) {
        setError(err.message ?? "Gagal menambah akun");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 bg-white rounded-xl border border-slate-200 p-4">
      <div>
        <label className="block text-xs text-slate-500 mb-1">Kode</label>
        <input name="code" required className={inputCls} style={{ width: 80 }} />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Nama Akun</label>
        <input name="name" required className={inputCls} style={{ width: 200 }} />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Tipe</label>
        <select name="type" className={inputCls} defaultValue="DETAIL">
          <option value="DETAIL">Detail</option>
          <option value="HEADER">Header</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Kategori</label>
        <select name="category" className={inputCls}>
          <option value="ASET">Aset</option>
          <option value="KEWAJIBAN">Kewajiban</option>
          <option value="EKUITAS">Ekuitas</option>
          <option value="PENDAPATAN">Pendapatan</option>
          <option value="HPP">HPP</option>
          <option value="BEBAN">Beban</option>
          <option value="LAIN_LAIN">Lain-lain</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Normal</label>
        <select name="normalBalance" className={inputCls}>
          <option value="DEBIT">Debit</option>
          <option value="KREDIT">Kredit</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Kategori Kas (opsional)</label>
        <select name="cashCategory" className={inputCls} defaultValue="">
          <option value="">-</option>
          <option value="TANAH">Tanah</option>
          <option value="KONSTRUKSI">Konstruksi</option>
          <option value="LEGALITAS">Legalitas</option>
          <option value="PLN">PLN</option>
          <option value="OVERHEAD">Overhead</option>
          <option value="MARKETING">Marketing</option>
          <option value="OPS">Ops</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
      >
        + Tambah Akun
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </form>
  );
}
