"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveEntry, rejectEntry } from "@/lib/actions/journal";

export function ApprovalButtons({ entryId }: { entryId: number }) {
  const [isPending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [note, setNote] = useState("");
  const router = useRouter();

  function approve() {
    startTransition(async () => {
      await approveEntry(entryId);
      router.refresh();
    });
  }

  function reject() {
    startTransition(async () => {
      await rejectEntry(entryId, note || undefined);
      router.refresh();
    });
  }

  if (showReject) {
    return (
      <div className="flex items-center gap-2">
        <input
          className="text-xs border border-slate-300 rounded px-2 py-1"
          placeholder="Alasan (opsional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button
          onClick={reject}
          disabled={isPending}
          className="text-xs bg-red-600 text-white rounded px-3 py-1 hover:bg-red-700 disabled:opacity-50"
        >
          Kirim Tolak
        </button>
        <button onClick={() => setShowReject(false)} className="text-xs text-slate-500">
          Batal
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={approve}
        disabled={isPending}
        className="text-xs bg-emerald-600 text-white rounded px-3 py-1 hover:bg-emerald-700 disabled:opacity-50"
      >
        Setujui
      </button>
      <button
        onClick={() => setShowReject(true)}
        disabled={isPending}
        className="text-xs bg-slate-200 text-slate-700 rounded px-3 py-1 hover:bg-slate-300 disabled:opacity-50"
      >
        Tolak
      </button>
    </div>
  );
}
