"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SupportPage() {
  const router = useRouter();
  useEffect(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center font-bold text-slate-400">
      Módulo deshabilitado. Redirigiendo...
    </div>
  );
}