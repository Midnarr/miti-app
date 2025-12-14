"use client";

import { useState } from "react";

export default function CheckoutButton() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
      });
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url; 
      } else {
        alert("Error al iniciar el pago");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Algo salió mal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="bg-white text-indigo-600 font-bold py-2 px-6 rounded-full shadow hover:bg-gray-100 transition disabled:opacity-50"
    >
      {loading ? "Loading..." : "Subscribe now"}
    </button>
  );
}