import React from 'react';

interface Chip {
  icon?: string; // fontawesome class (e.g., 'fa-chart-pie')
  label: string;
}

interface CTA {
  label: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}

interface ReportCardProps {
  variant?: 'default' | 'featured';
  icon?: React.ReactNode; // prefer passing an <i> or svg
  title: string;
  subtitle?: string;
  description?: string;
  chips?: Chip[];
  cta?: CTA;
  badge?: string; // optional small badge text
  className?: string;
}

export default function ReportCard({
  variant = 'default',
  icon,
  title,
  subtitle,
  description,
  chips = [],
  cta,
  badge,
  className = ''
}: ReportCardProps) {
  const base = 'bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow flex flex-col h-full';
  const featured = 'border-4 border-purple-600 shadow-lg relative';

  return (
    <div className={`${base} ${variant === 'featured' ? featured : ''} ${className}`}>
      {badge && (
        <div className="absolute -top-3 left-6">
          <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-md font-semibold">{badge}</span>
        </div>
      )}

      <div className="flex-1 pr-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${variant === 'featured' ? 'bg-purple-50' : 'bg-gray-100'}`}>
            {icon}
          </div>
          <div>
            <h3 className={`text-lg font-semibold text-gray-900 ${variant === 'featured' ? 'text-gray-900' : ''}`}>{title}</h3>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>

        {description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">{description}</p>
        )}

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chips.map((chip, idx) => (
              <span key={idx} className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs inline-flex items-center gap-2">
                {chip.icon && <i className={`fas ${chip.icon} text-[10px]`} />}
                <span className="whitespace-nowrap">{chip.label}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {cta && (
        <div className="mt-auto ml-4 flex-shrink-0 self-end">
          <button
            onClick={cta.onClick}
            disabled={cta.disabled || cta.loading}
            className={`ml-4 px-6 py-3 rounded-lg font-semibold transition-colors shadow-md ${variant === 'featured' ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
            aria-disabled={cta.disabled || cta.loading}
          >
            {cta.loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.2" /><path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>
                Procesando
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <i className="fas fa-arrow-right" />
                {cta.label}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
