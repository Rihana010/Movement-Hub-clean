"use server";

import { randomInt } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const REWARDS = [
  "Lilac profile card tint",
  "Marigold profile card tint",
  "Field Notes title flair",
  "Community Builder title flair",
];

export async function openNextImpactCrate() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to open an impact crate.");
  }

  const crate = await prisma.impactCrate.findFirst({
    where: { userId: user.id, openedAt: null },
    orderBy: { id: "asc" },
  });

  if (!crate) return null;

  const reward = REWARDS[randomInt(REWARDS.length)];
  const opened = await prisma.impactCrate.update({
    where: { id: crate.id },
    data: { reward, openedAt: new Date() },
    select: { id: true, reward: true },
  });

  revalidatePath("/profile");
  return opened;
}
