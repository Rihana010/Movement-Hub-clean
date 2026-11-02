import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SESSION_COOKIE } from "@/lib/session";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/profile";
  }

  return value;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNext(requestUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(
      new URL("/?authError=missing_code", requestUrl.origin)
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      return NextResponse.redirect(
        new URL("/?authError=oauth_exchange_failed", requestUrl.origin)
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      return NextResponse.redirect(
        new URL("/?authError=missing_email", requestUrl.origin)
      );
    }

    const metadata = user.user_metadata;
    const fullName =
      typeof metadata.full_name === "string"
        ? metadata.full_name
        : typeof metadata.name === "string"
          ? metadata.name
          : null;
    const avatarUrl =
      typeof metadata.avatar_url === "string" ? metadata.avatar_url : null;

    await prisma.userProfile.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        fullName,
        avatarUrl,
      },
      create: {
        id: user.id,
        email: user.email,
        fullName,
        avatarUrl,
      },
    });

    const response = NextResponse.redirect(new URL(next, requestUrl.origin));
    response.cookies.delete(SESSION_COOKIE);
    return response;
  } catch (error) {
    console.error("Supabase authentication callback failed:", error);
    return NextResponse.redirect(
      new URL("/?authError=callback_failed", requestUrl.origin)
    );
  }
}
