"use client";
import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button 
      onClick={handleLogout}
      className="w-full bg-red-50 text-red-600 font-bold py-3 rounded-xl border border-red-100 hover:bg-red-100 transition-colors"
    >
      Cerrar Sesión
    </button>
  );
}