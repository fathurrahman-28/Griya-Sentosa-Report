import { requireRole } from "@/lib/authz";
import { db } from "@/db";
import { TelegramChatIdForm } from "@/components/TelegramChatIdForm";

export default async function PengaturanBotPage() {
  await requireRole("OWNER");
  const list = await db.query.users.findMany({ orderBy: (u, { asc }) => [asc(u.id)] });

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-1">Pengaturan Bot Telegram</h1>
      <p className="text-sm text-slate-500 mb-6">
        Hubungkan tiap user ke akun Telegram-nya supaya bot tahu siapa yang mengirim pesan. Cara dapat Chat ID:
        buka bot, kirim <code className="bg-slate-100 px-1 rounded">/start</code>, lalu minta ID dari{" "}
        <a className="underline" href="https://t.me/userinfobot" target="_blank">
          @userinfobot
        </a>{" "}
        atau lihat log server setelah user mengirim pesan pertama kali.
      </p>

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {list.map((u) => (
          <div key={u.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium">{u.name}</p>
              <p className="text-xs text-slate-500">
                {u.username} · {u.role}
              </p>
            </div>
            <TelegramChatIdForm userId={u.id} initial={u.telegramChatId ?? ""} />
          </div>
        ))}
      </div>
    </div>
  );
}
