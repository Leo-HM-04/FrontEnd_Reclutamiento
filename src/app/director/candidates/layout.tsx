'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faBriefcase, 
  faFolderOpen, 
  faStickyNote 
} from '@fortawesome/free-solid-svg-icons';
import { Navigation } from '@/components/Navigation';

interface CandidatesLayoutProps {
  children: React.ReactNode;
}

const candidatesNavigation = [
  {
    name: 'Candidatos',
    href: '/director/candidates',
    icon: faUsers,
    description: 'Lista completa de candidatos'
  },
  {
    name: 'Aplicaciones',
    href: '/director/candidates/applications',
    icon: faBriefcase,
    description: 'Aplicaciones a posiciones'
  },
  {
    name: 'Documentos',
    href: '/director/candidates/documents',
    icon: faFolderOpen,
    description: 'CVs y documentos'
  },
  {
    name: 'Notas',
    href: '/director/candidates/notes',
    icon: faStickyNote,
    description: 'Notas y observaciones'
  }
];

export default function CandidatesLayout({ children }: CandidatesLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userRole="director" />
      
      <div className="lg:ml-64 pt-16">
        {/* Secondary Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Gestión de Candidatos
                </h1>
                <p className="text-gray-600 mt-1">
                  Administra candidatos, aplicaciones, documentos y notas
                </p>
              </div>
            </div>
            
            {/* Tab Navigation */}
            <nav className="flex space-x-8">
              {candidatesNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <FontAwesomeIcon icon={item.icon} className="mr-2" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
