"use client";

import { useEffect } from "react";
import { createClient } from "@/libs/supabase/client";
import { useRouter } from "next/navigation";

export default function RealtimeReloader({ userId }: { userId: string }) {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // 1. Crear el canal de suscripción
    const channel = supabase
      .channel("expenses-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT", // Escuchamos SOLO cuando se crea algo nuevo
          schema: "public",
          table: "expenses",
          // Opcional: Filtramos para que solo recargue si el gasto es para mí
          // filter: `debtor_email=eq.${userEmail}`, 
        },
        (payload) => {
          console.log("⚡ Nuevo gasto detectado:", payload);
          // 2. Recargar la página suavemente
          router.refresh(); 
          
          // Opcional: Reproducir un sonidito de notificación
          // const audio = new Audio('/notification.mp3');
          // audio.play();
        }
      )
      .subscribe();

    // 3. Limpiar la suscripción cuando te vas de la página
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  return null; // Este componente no pinta nada, solo escucha
}