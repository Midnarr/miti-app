"use server";

import { createClient } from "@/libs/supabase/server";
import { revalidatePath } from "next/cache";

export async function inviteMember(formData: FormData) {
  // 1. LIMPIEZA: Obtenemos el email, quitamos espacios y pasamos a minúsculas
  const rawEmail = formData.get("email") as string;
  const groupId = formData.get("groupId") as string;

  if (!rawEmail || !groupId) return;

  const email = rawEmail.trim().toLowerCase(); // <--- ESTO ES NUEVO

  const supabase = await createClient();

  // 2. Insertamos el email limpio
  const { error } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, user_email: email });

  if (error) {
    console.error("Error invitando:", error);
    return;
  }

  revalidatePath(`/groups/${groupId}`);
}