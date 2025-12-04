import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function middleware(req: NextRequest) {
  // Create Supabase client (must await because createClient is async)
  const supabase = await createClient();

  // Refresh session cookies (keeps user logged in)
  await supabase.auth.getUser();

  // Continue handling the request
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/editor/:path*", "/history/:path*", "/settings/:path*"],
};
