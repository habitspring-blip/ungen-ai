import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", requestUrl.origin));
  }

  const supabase = await createClient();

  // Exchange the code for a session
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Sign-in error:", error);
    return NextResponse.redirect(
      new URL("/login?error=auth_failed", requestUrl.origin)
    );
  }

  // On success → redirect to dashboard
  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
}