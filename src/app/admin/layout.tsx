import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panel de Administración - Sistema de Reclutamiento',
  description: 'Panel de administración y configuración del sistema de reclutamiento',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-layout">
      {children}
    </div>
  );
}
