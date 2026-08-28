import { auth } from "@/auth";
import { redirect } from "next/navigation";

export type Role = "OWNER" | "ADMIN" | "VIEWER";

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as { id: string; name: string; username: string; role: Role };
}

/** Panggil di awal server component / server action untuk membatasi akses. */
export async function requireRole(...roles: Role[]) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!roles.includes(user.role)) redirect("/");
  return user;
}

export async function requireAnyUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
