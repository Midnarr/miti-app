import { createClient } from "@/libs/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image"; // 👈 1. Importar Image

export default async function LoginPage(props: {
  searchParams: Promise<{ message?: string }>;
}) {
  // 1. Verificar si ya está logueado
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return redirect("/dashboard");
  }

  const searchParams = await props.searchParams;
  const message = searchParams?.message;

  // --- LÓGICA DE LOGIN ---
  const signIn = async (formData: FormData) => {
    "use server";
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return redirect("/login?message=Credenciales incorrectas.");
    }

    return redirect("/dashboard"); 
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 md:p-10 shadow-xl rounded-2xl border border-gray-100">
        
        {/* 👇 2. AQUÍ ESTÁ EL LOGO */}
        <div className="flex justify-center mb-2">
          <Link href="/">
            <div className="relative w-24 h-24 hover:scale-105 transition-transform duration-300">
               {/* Asegúrate de que tu archivo se llame 'logo.png' en la carpeta /public */}
               <Image 
                 src="/logo.png" 
                 alt="Miti Logo" 
                 fill 
                 className="object-contain"
                 priority
               />
            </div>
          </Link>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-sm text-gray-500">Bienvenido de vuelta a Miti</p>
        </div>
        
        {message && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm text-center font-medium border border-red-100">
            {message}
          </div>
        )}

        <form className="mt-8 space-y-6">
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                name="email"
                type="email"
                required
                className="relative block w-full rounded-lg border-gray-300 bg-gray-50 py-2 px-3 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                name="password"
                type="password"
                required
                className="relative block w-full rounded-lg border-gray-300 bg-gray-50 py-2 px-3 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            formAction={signIn}
            className="group relative flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 shadow-sm transition-all"
          >
            Entrar
          </button>
        </form>

        {/* ENLACE A REGISTRO */}
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}