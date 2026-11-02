import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json(
        { error: "Unable to sign out of the Movement Hub account." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Supabase sign-out failed:", error);
    return NextResponse.json(
      { error: "Unable to sign out of the Movement Hub account." },
      { status: 500 }
    );
  }
}
