import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Nav } from "@/components/Nav";
import { getSessionUser } from "@/lib/authz";

export const metadata: Metadata = {
  title: "Griya Sentosa — Pembukuan Proyek",
  description: "Sistem pembukuan & laporan keuangan proyek Griya Sentosa",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser();

  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900 font-sans">
        <Providers>
          {user ? (
            <div className="flex min-h-screen">
              <Nav />
              <main className="flex-1 min-w-0 p-6">{children}</main>
            </div>
          ) : (
            children
          )}
        </Providers>
      </body>
    </html>
  );
}
