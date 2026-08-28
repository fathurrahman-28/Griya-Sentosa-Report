"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/format";

type Item = {
  id: number;
  kelompok: string;
  section: string;
  itemName: string;
  qty: string | null;
  satuan: string | null;
  hargaSatuan: string | null;
  total: string;
};

export function ProjectionTable({
  items,
  kelompokOptions,
  canEdit,
  addAction,
  deleteAction,
}: {
  items: Item[];
  kelompokOptions: { value: string; label: string }[];
  canEdit: boolean;
  addAction: (data: { kelompok: string; section: string; itemName: string; qty: string; satuan?: string; hargaSatuan: string }) => Promise<void>;
  deleteAction: (id: number) => Promise<void>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const grouped = kelompokOptions.map((k) => ({
    ...k,
    items: items.filter((i) => i.kelompok === k.value),
    total: items.filter((i) => i.kelompok === k.value).reduce((s, i) => s + parseFloat(i.total), 0),
  }));

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await addAction({
        kelompok: fd.get("kelompok") as string,
        section: fd.get("section") as string,
        itemName: fd.get("itemName") as string,
        qty: (fd.get("qty") as string) || "1",
        satuan: (fd.get("satuan") as string) || undefined,
        hargaSatuan: fd.get("hargaSatuan") as string,
      });
      (e.target as HTMLFormElement).reset();
      router.refresh();
    });
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      await deleteAction(id);
      router.refresh();
    });
  }

  const inputCls = "rounded-md border border-slate-300 px-2 py-1.5 text-sm";

  return (
    <div className="space-y-6">
      {canEdit && (
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2 bg-white rounded-xl border border-slate-200 p-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Kelompok</label>
            <select name="kelompok" className={inputCls}>
              {kelompokOptions.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Bagian/Section</label>
            <input name="section" required className={inputCls} style={{ width: 180 }} placeholder="A. Penjualan Rumah" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Nama Item</label>
            <input name="itemName" required className={inputCls} style={{ width: 200 }} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Qty</label>
            <input name="qty" type="number" defaultValue="1" className={inputCls} style={{ width: 70 }} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Satuan</label>
            <input name="satuan" className={inputCls} style={{ width: 70 }} placeholder="Unit" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Harga Satuan (Rp)</label>
            <input name="hargaSatuan" type="number" required className={inputCls} style={{ width: 140 }} />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
          >
            + Tambah
          </button>
        </form>
      )}

      {grouped.map((g) => (
        <div key={g.value} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 bg-slate-50 border-b border-slate-200">
            <p className="text-sm font-semibold">{g.label}</p>
            <p className="text-sm font-semibold">{formatRupiah(g.total)}</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-1.5 px-4">Bagian</th>
                <th className="py-1.5 px-4">Item</th>
                <th className="py-1.5 px-4 text-right">Qty</th>
                <th className="py-1.5 px-4">Satuan</th>
                <th className="py-1.5 px-4 text-right">Harga Satuan</th>
                <th className="py-1.5 px-4 text-right">Total</th>
                {canEdit && <th className="py-1.5 px-4"></th>}
              </tr>
            </thead>
            <tbody>
              {g.items.map((i) => (
                <tr key={i.id} className="border-t border-slate-50">
                  <td className="py-1.5 px-4 text-xs text-slate-500">{i.section}</td>
                  <td className="py-1.5 px-4">{i.itemName}</td>
                  <td className="py-1.5 px-4 text-right">{i.qty}</td>
                  <td className="py-1.5 px-4">{i.satuan}</td>
                  <td className="py-1.5 px-4 text-right">{formatRupiah(i.hargaSatuan ?? "0")}</td>
                  <td className="py-1.5 px-4 text-right font-medium">{formatRupiah(i.total)}</td>
                  {canEdit && (
                    <td className="py-1.5 px-4">
                      <button onClick={() => handleDelete(i.id)} className="text-xs text-red-500">
                        hapus
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {g.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-slate-400 text-xs">
                    Belum ada item.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
