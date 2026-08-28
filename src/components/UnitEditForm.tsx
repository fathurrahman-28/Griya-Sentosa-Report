"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUnit } from "@/lib/actions/masterData";

export function UnitEditForm({ unit }: { unit: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");

  const inputCls = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";
  const labelCls = "block text-xs font-medium text-slate-500 mb-1";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => (fd.get(k) as string) || undefined;
    startTransition(async () => {
      await updateUnit(unit.id, {
        tipe: get("tipe"),
        luasTanah: get("luasTanah"),
        luasBangunan: get("luasBangunan"),
        budgetTanah: get("budgetTanah"),
        budgetInfra: get("budgetInfra"),
        budgetMaterial: get("budgetMaterial"),
        budgetUpah: get("budgetUpah"),
        budgetLegal: get("budgetLegal"),
        budgetDesain: get("budgetDesain"),
        budgetOverhead: get("budgetOverhead"),
        hargaJual: get("hargaJual"),
        status: get("status") as any,
        customerName: get("customerName"),
        tglPPJB: get("tglPPJB"),
        targetSerahTerima: get("targetSerahTerima"),
        nilaiKontrakKonstruksi: get("nilaiKontrakKonstruksi"),
        contractorName: get("contractorName"),
      });
      setMsg("Tersimpan.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Tipe</label>
          <input name="tipe" defaultValue={unit.tipe ?? ""} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Luas Tanah (m2)</label>
          <input name="luasTanah" defaultValue={unit.luasTanah ?? ""} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Luas Bangunan (m2)</label>
          <input name="luasBangunan" defaultValue={unit.luasBangunan ?? ""} className={inputCls} />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">Budget per Kategori (Rp)</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            ["budgetTanah", "Tanah"],
            ["budgetInfra", "Infrastruktur"],
            ["budgetMaterial", "Material"],
            ["budgetUpah", "Upah"],
            ["budgetLegal", "Legalitas"],
            ["budgetDesain", "Desain"],
            ["budgetOverhead", "Overhead"],
          ].map(([key, label]) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <input name={key} type="number" defaultValue={unit[key] ?? "0"} className={inputCls} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Harga Jual (Rp)</label>
          <input name="hargaJual" type="number" defaultValue={unit.hargaJual ?? "0"} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select name="status" defaultValue={unit.status} className={inputCls}>
            <option value="TERSEDIA">Tersedia</option>
            <option value="DIPESAN">Dipesan</option>
            <option value="TERJUAL">Terjual</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Nama Konsumen</label>
          <input name="customerName" defaultValue={unit.customer?.name ?? ""} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Tanggal PPJB</label>
          <input name="tglPPJB" type="date" defaultValue={unit.tglPPJB ?? ""} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Target Serah Terima</label>
          <input name="targetSerahTerima" type="date" defaultValue={unit.targetSerahTerima ?? ""} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Nilai Kontrak Konstruksi (Rp)</label>
          <input name="nilaiKontrakKonstruksi" type="number" defaultValue={unit.nilaiKontrakKonstruksi ?? "0"} className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Nama Kontraktor</label>
        <input name="contractorName" defaultValue={unit.contractor?.name ?? ""} className={inputCls} />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-slate-900 text-white text-sm font-medium px-5 py-2.5 hover:bg-slate-800 disabled:opacity-50"
        >
          {isPending ? "Menyimpan..." : "Simpan"}
        </button>
        {msg && <span className="text-sm text-emerald-600">{msg}</span>}
      </div>
    </form>
  );
}
