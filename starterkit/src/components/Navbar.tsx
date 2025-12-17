import { createClient } from "@/libs/supabase/server";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Si no hay usuario, no mostramos el Navbar
  if (!user) return null;

  // 👇 NUEVO: Consultamos el avatar
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  return <NavbarClient user={user} avatarUrl={profile?.avatar_url} />;
}