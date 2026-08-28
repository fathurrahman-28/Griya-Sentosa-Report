import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, journalEntries, botDrafts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { parseTransactionMessage } from "@/lib/bot/nlu";
import { resolveParsedTx } from "@/lib/bot/resolve";
import { tgSendMessage, tgEditMessage, tgAnswerCallback, confirmKeyboard, approvalKeyboard } from "@/lib/bot/telegram";
import { createTransactionCore, approveEntryCore, rejectEntryCore } from "@/lib/journalCore";
import { formatRupiah } from "@/lib/format";

async function findUserByChatId(chatId: string) {
  return db.query.users.findFirst({ where: eq(users.telegramChatId, chatId) });
}

async function notifyOwners(text: string, keyboard?: any) {
  const owners = await db.query.users.findMany({ where: eq(users.role, "OWNER") });
  for (const o of owners) {
    if (o.telegramChatId) await tgSendMessage(o.telegramChatId, text, keyboard);
  }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const update = await req.json();

  try {
    if (update.message?.text) {
      const chatId = String(update.message.chat.id);
      const text = String(update.message.text).trim();
      const user = await findUserByChatId(chatId);

      if (!user) {
        await tgSendMessage(chatId, "Nomor/akun Telegram Anda belum terdaftar di sistem Griya Sentosa. Hubungi Owner untuk didaftarkan.");
        return NextResponse.json({ ok: true });
      }
      if (user.role === "VIEWER") {
        await tgSendMessage(chatId, "Akun Anda hanya punya akses lihat-lihat, tidak bisa input transaksi lewat bot.");
        return NextResponse.json({ ok: true });
      }
      if (text.startsWith("/start")) {
        await tgSendMessage(chatId, `Halo ${user.name}. Kirim pesan bebas untuk mencatat transaksi, mis:\n"bayar tukang kavling 3, 500rb buat semen"`);
        return NextResponse.json({ ok: true });
      }

      await tgSendMessage(chatId, "⏳ Memproses...");
      try {
        const parsed = await parseTransactionMessage(text);
        const { input, summary } = await resolveParsedTx(parsed);

        const [draft] = await db
          .insert(botDrafts)
          .values({
            userId: user.id,
            channel: "TELEGRAM",
            externalChatId: chatId,
            rawText: text,
            parsedJson: JSON.stringify(input),
            status: "DRAFT",
          })
          .returning();

        await tgSendMessage(chatId, summary, confirmKeyboard(draft.id));
      } catch (err: any) {
        console.error("NLU parse error:", err);
        await tgSendMessage(
          chatId,
          `⚠️ Gagal memproses pesan: ${err.message}\nCoba tulis ulang lebih jelas, atau input manual lewat web.`
        );
      }
      return NextResponse.json({ ok: true });
    }

    if (update.callback_query) {
      const cq = update.callback_query;
      const chatId = String(cq.message.chat.id);
      const messageId = cq.message.message_id;
      const data = String(cq.data);
      const user = await findUserByChatId(chatId);
      if (!user) {
        await tgAnswerCallback(cq.id, "Tidak dikenali.");
        return NextResponse.json({ ok: true });
      }

      const [action, idStr] = data.split(":");
      const id = Number(idStr);

      if (action === "draft_confirm" || action === "draft_cancel") {
        const draft = await db.query.botDrafts.findFirst({ where: eq(botDrafts.id, id) });
        if (!draft || draft.status !== "DRAFT") {
          await tgAnswerCallback(cq.id, "Draft sudah diproses sebelumnya.");
          return NextResponse.json({ ok: true });
        }

        if (action === "draft_cancel") {
          await db.update(botDrafts).set({ status: "CANCELLED" }).where(eq(botDrafts.id, id));
          await tgEditMessage(chatId, messageId, "❌ Dibatalkan.");
          await tgAnswerCallback(cq.id, "Dibatalkan");
          return NextResponse.json({ ok: true });
        }

        // confirm
        const input = JSON.parse(draft.parsedJson!);
        input.channel = "TELEGRAM";
        input.rawBotMessage = draft.rawText;
        try {
          const entry = await createTransactionCore(input, draft.userId);
          await db.update(botDrafts).set({ status: "CONFIRMED" }).where(eq(botDrafts.id, id));

          if (entry.status === "APPROVED") {
            await tgEditMessage(chatId, messageId, "✅ Transaksi tersimpan & langsung disetujui (Owner).");
          } else {
            await tgEditMessage(chatId, messageId, "📝 Transaksi tersimpan, menunggu persetujuan Owner.");
            await notifyOwners(
              `*Persetujuan Diperlukan*\n${draft.rawText}\nJumlah: ${formatRupiah(input.jumlah ?? 0)}\nDiinput oleh: ${user.name}`,
              approvalKeyboard(entry.id)
            );
          }
        } catch (err: any) {
          await tgEditMessage(chatId, messageId, `⚠️ Gagal menyimpan: ${err.message}`);
        }
        await tgAnswerCallback(cq.id, "Diproses");
        return NextResponse.json({ ok: true });
      }

      if (action === "entry_approve" || action === "entry_reject") {
        if (user.role !== "OWNER") {
          await tgAnswerCallback(cq.id, "Hanya Owner yang bisa menyetujui.");
          return NextResponse.json({ ok: true });
        }
        const entry = await db.query.journalEntries.findFirst({ where: eq(journalEntries.id, id), with: { createdBy: true } });
        if (!entry || entry.status !== "PENDING") {
          await tgAnswerCallback(cq.id, "Transaksi sudah diproses.");
          return NextResponse.json({ ok: true });
        }

        if (action === "entry_approve") {
          await approveEntryCore(id, user.id);
          await tgEditMessage(chatId, messageId, "✅ Disetujui.");
          if (entry.createdBy?.telegramChatId) {
            await tgSendMessage(entry.createdBy.telegramChatId, `✅ Transaksi "${entry.description}" disetujui Owner.`);
          }
        } else {
          await rejectEntryCore(id, user.id);
          await tgEditMessage(chatId, messageId, "❌ Ditolak.");
          if (entry.createdBy?.telegramChatId) {
            await tgSendMessage(entry.createdBy.telegramChatId, `❌ Transaksi "${entry.description}" ditolak Owner.`);
          }
        }
        await tgAnswerCallback(cq.id, "Diproses");
        return NextResponse.json({ ok: true });
      }
    }
  } catch (err: any) {
    console.error("Bot webhook error:", err);
  }

  return NextResponse.json({ ok: true });
}
