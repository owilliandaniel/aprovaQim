import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Signs out and goes to /login (accounts without a profile, or whose company was deactivated).
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const suspended = request.nextUrl.searchParams.get("motivo") === "suspenso";
  return NextResponse.redirect(new URL(suspended ? "/login?suspenso=1" : "/login", request.url));
}
