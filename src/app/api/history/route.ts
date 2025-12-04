import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient(); // Add await here

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ history: [] });
  }

  const { data: history, error } = await supabase
    .from("history")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("History fetch error:", error);
    return NextResponse.json({ history: [] });
  }

  return NextResponse.json({ history });
}