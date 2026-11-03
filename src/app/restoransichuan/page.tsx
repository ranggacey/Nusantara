"use client";

import React from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const RestoranInterior3D = dynamic(() => import("@/components/RestoranInterior3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-stone-950 text-amber-200">
      <div className="text-center">
        <span className="text-5xl animate-bounce">🏮</span>
        <h2 className="mt-4 text-xl font-bold tracking-wide">Memasuki Restoran Sichuan Nirwana...</h2>
        <p className="text-sm text-stone-400 mt-1">Menyiapkan balai perjamuan & kuali hotpot pedas</p>
      </div>
    </div>
  ),
});

export default function RestoranSichuanPage() {
  const router = useRouter();

  return (
    <main className="h-screen w-screen overflow-hidden bg-stone-950">
      <RestoranInterior3D
        isOpen={true}
        isStandalonePage={true}
        onClose={() => router.push("/")}
      />
    </main>
  );
}
