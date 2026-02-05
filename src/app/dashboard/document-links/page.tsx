'use client';

/**
 * Página de Links de Documentos para Dashboard principal
 */

import React from 'react';
import DocumentShareLinksDashboard from '@/components/DocumentShareLinksDashboard';
import { Navigation } from '@/components/Navigation';

export default function DashboardDocumentLinksPage() {
  return (
    <>
      <Navigation userRole="admin" />
      <main className="lg:ml-64 pt-16 min-h-screen bg-gray-50">
        <DocumentShareLinksDashboard />
      </main>
    </>
  );
}
