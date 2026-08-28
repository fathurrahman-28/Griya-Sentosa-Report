"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTelegramChatId } from "@/lib/actions/masterData";

export function TelegramChatIdForm({ userId, initial }: { userId: number; initial: string }) {
  const [value, setValue] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function save() {
    startTransition(async () => {
      await updateTelegramChatId(userId, value);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <input
        className="rounded-md border border-slate-300 px-2 py-1 text-sm w-40"
        placeholder="Telegram chat ID"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        onClick={save}
        disabled={isPending}
        className="text-xs bg-slate-900 text-white rounded px-3 py-1.5 hover:bg-slate-800 disabled:opacity-50"
      >
        Simpan
      </button>
    </div>
  );
}
