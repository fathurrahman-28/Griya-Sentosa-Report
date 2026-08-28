import { getSessionUser } from "@/lib/authz";
import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

const LINKS: { href: string; label: string; roles: Array<"OWNER" | "ADMIN" | "VIEWER"> }[] = [
  { href: "/", label: "Dashboard", roles: ["OWNER", "ADMIN", "VIEWER"] },
  { href: "/jurnal", label: "Jurnal Transaksi", roles: ["OWNER", "ADMIN", "VIEWER"] },
  { href: "/approvals", label: "Persetujuan", roles: ["OWNER"] },
  { href: "/laporan/neraca", label: "Neraca", roles: ["OWNER", "ADMIN", "VIEWER"] },
  { href: "/laporan/laba-rugi", label: "Laba Rugi", roles: ["OWNER", "ADMIN", "VIEWER"] },
  { href: "/laporan/arus-kas", label: "Arus Kas", roles: ["OWNER", "ADMIN", "VIEWER"] },
  { href: "/laporan/buku-besar", label: "Buku Besar", roles: ["OWNER", "ADMIN", "VIEWER"] },
  { href: "/laporan/kas-kategori", label: "Kas per Kategori", roles: ["OWNER", "ADMIN", "VIEWER"] },
  { href: "/laporan/kartu-konsumen", label: "Kartu Konsumen", roles: ["OWNER", "ADMIN", "VIEWER"] },
  { href: "/laporan/kartu-borongan", label: "Kartu Borongan", roles: ["OWNER", "ADMIN", "VIEWER"] },
  { href: "/laporan/kartu-hutang", label: "Kartu Hutang", roles: ["OWNER", "ADMIN", "VIEWER"] },
  { href: "/laporan/hpp-unit", label: "HPP per Unit", roles: ["OWNER", "ADMIN", "VIEWER"] },
  { href: "/master-proyek", label: "Master Proyek", roles: ["OWNER", "ADMIN", "VIEWER"] },
  { href: "/estimasi-cashflow", label: "Estimasi Cashflow", roles: ["OWNER", "ADMIN", "VIEWER"] },
  { href: "/ekuitas", label: "Ekuitas", roles: ["OWNER", "ADMIN", "VIEWER"] },
  { href: "/data-akun", label: "Data Akun", roles: ["OWNER"] },
  { href: "/pengaturan-bot", label: "Pengaturan Bot", roles: ["OWNER"] },
  { href: "/export", label: "Export Excel", roles: ["OWNER", "ADMIN"] },
];

export async function Nav() {
  const user = await getSessionUser();
  if (!user) return null;
  const visible = LINKS.filter((l) => l.roles.includes(user.role));

  return (
    <div className="w-64 shrink-0 bg-slate-900 text-slate-100 min-h-screen flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <p className="font-semibold text-sm">Griya Sentosa</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {user.name} · {user.role}
        </p>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {visible.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-700">
        <LogoutButton />
      </div>
    </div>
  );
}
