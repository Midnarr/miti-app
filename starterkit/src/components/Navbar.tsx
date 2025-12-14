import { createClient } from "@/libs/supabase/server";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Si no hay usuario, no mostramos el Navbar (o mostramos uno público)
  // Para este caso, si no hay usuario retornamos null para que la pantalla de login esté limpia
  if (!user) return null;

  return <NavbarClient user={user} />;
}