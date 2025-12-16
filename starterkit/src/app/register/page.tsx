import { createClient } from "@/libs/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import Image from "next/image"; // 👈 1. Importamos Image

export default async function RegisterPage(props: {
  searchParams: Promise<{ success?: string; message?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) return redirect("/dashboard");

  const searchParams = await props.searchParams;
  const message = searchParams?.message;
  const success = searchParams?.success;

  const signUp = async (formData: FormData) => {
    "use server";
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const username = formData.get("username") as string;
    
    const headersList = await headers();
    const host = headersList.get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";
    const currentOrigin = `${protocol}://${host}`;

    const supabase = await createClient();

    if (!username || username.length < 3) {
      return redirect("/register?message=El usuario debe tener al menos 3 letras.");
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${currentOrigin}/auth/callback`,
        data: { username },
      },
    });

    if (error) {
      return redirect("/register?message=" + error.message);
    }

    return redirect("/register?success=true");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 md:p-10 shadow-xl rounded-2xl border border-gray-100">
        
        {/* 👇 2. LOGO (Se ve siempre, antes de la lógica de éxito/formulario) */}
        <div className="flex justify-center mb-6">
          <Link href="/">
            <div className="relative w-24 h-24 hover:scale-105 transition-transform duration-300">
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

        {/* ESTADO DE ÉXITO */}
        {success ? (
          <div className="text-center space-y-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <span className="text-2xl">📩</span>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">¡Casi listo!</h2>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-green-800">
              <p className="font-medium">Hemos enviado un correo a tu email.</p>
              <p className="text-sm mt-2">Por favor, revisa tu bandeja de entrada (y spam) y haz clic en el enlace para activar tu cuenta.</p>
            </div>
            <div className="pt-4">
              <Link href="/login" className="text-indigo-600 hover:underline font-medium">
                Ir a Iniciar Sesión &rarr;
              </Link>
            </div>
          </div>
        ) : (
          /* ESTADO NORMAL: Formulario */
          <>
            <div className="text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Crear Cuenta</h2>
              <p className="mt-2 text-sm text-gray-500">Únete para dividir gastos fácilmente</p>
            </div>
            
            {message && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm text-center font-medium border border-red-100">
                {message}
              </div>
            )}

            <form action={signUp} className="mt-8 space-y-6">
              <div className="space-y-4 rounded-md shadow-sm">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input name="email" type="email" required className="block w-full rounded-lg border-gray-300 bg-gray-50 py-2 px-3 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="tu@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario</label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 sm:text-sm">@</span>
                    </div>
                    <input name="username" type="text" required className="block w-full rounded-lg border-gray-300 bg-gray-50 py-2 pl-7 pr-3 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="usuario" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                  <input name="password" type="password" required className="block w-full rounded-lg border-gray-300 bg-gray-50 py-2 px-3 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="••••••••" />
                </div>
              </div>

              <button type="submit" className="group relative flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 shadow-sm transition-all">
                Registrarse
              </button>
            </form>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                ¿Ya tienes cuenta? <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">Inicia sesión</Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}