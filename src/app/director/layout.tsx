// app/director/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Director RH - Sistema de Reclutamiento",
  description: "Panel Directivo - Gestión integral de reclutamiento",
};

export default function DirectorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
