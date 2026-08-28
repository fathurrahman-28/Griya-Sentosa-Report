import { getSessionUser } from "@/lib/authz";
import { generateWorkbook } from "@/lib/exportExcel";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "OWNER")) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }
  const buf = await generateWorkbook();
  const filename = `Laporan_Keuangan_Griya_Sentosa_${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
