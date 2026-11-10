import Terminal from "@/components/Terminal";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getStore } from "@/lib/server/store";
import { SESSION_COOKIE } from "@/lib/server/http";
export const metadata = { title: "Terminal // StockPaws" };
export default async function TerminalPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const params = await searchParams;
  if (params.demo !== "1") {
    let authenticated = false;
    try {
      authenticated = getStore().identity(
        (await cookies()).get(SESSION_COOKIE)?.value,
      ).authenticated;
    } catch {}
    if (!authenticated) redirect("/login");
  }
  return <Terminal />;
}
