import React, { Suspense } from 'react';
import { AlertCircle, CheckCircle, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ProductionPageTemplateProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href: string }>;
  children: React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  actions?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function ProductionPageTemplate({
  title,
  subtitle,
  icon,
  breadcrumbs,
  children,
  isLoading = false,
  error = null,
  onRetry,
  actions,
  sidebar,
  footer,
  className = '',
}: ProductionPageTemplateProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-foreground ${className}`}>
      {/* Header Section */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-2 py-2 text-sm text-slate-400">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-slate-600">/</span>}
                  <a href={crumb.href} className="hover:text-pink-400 transition-colors">
                    {crumb.label}
                  </a>
                </React.Fragment>
              ))}
            </nav>
          )}

          {/* Title Section */}
          <div className="py-6 flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              {icon && <div className="text-4xl mt-1">{icon}</div>}
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-2 text-lg text-slate-400">{subtitle}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            {actions && (
              <div className="flex gap-2 mt-1">
                {actions}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Content Area */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState error={error} onRetry={onRetry} />
            ) : (
              <Suspense fallback={<LoadingState />}>
                {children}
              </Suspense>
            )}
          </div>

          {/* Sidebar */}
          {sidebar && (
            <aside className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                {sidebar}
              </div>
            </aside>
          )}
        </div>
      </main>

      {/* Footer */}
      {footer && (
        <footer className="mt-16 border-t border-slate-800 bg-slate-950/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {footer}
          </div>
        </footer>
      )}
    </div>
  );
}

// Loading State Component
function LoadingState() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="p-6 animate-pulse">
          <div className="h-4 bg-slate-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-slate-700 rounded w-1/2"></div>
        </Card>
      ))}
    </div>
  );
}

// Error State Component
interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <Card className="p-8 border-red-500/20 bg-red-500/5">
      <div className="flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-500 mb-2">Something went wrong</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              Try again
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// Success State Component
export function SuccessMessage({ message }: { message: string }) {
  return (
    <Card className="p-4 border-green-500/20 bg-green-500/5 flex items-center gap-3">
      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
      <p className="text-green-500 text-sm">{message}</p>
    </Card>
  );
}

// Info Message Component
export function InfoMessage({ message }: { message: string }) {
  return (
    <Card className="p-4 border-blue-500/20 bg-blue-500/5 flex items-center gap-3">
      <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
      <p className="text-blue-500 text-sm">{message}</p>
    </Card>
  );
}

// Skeleton Card Component
export function SkeletonCard() {
  return (
    <Card className="p-6 animate-pulse">
      <div className="space-y-4">
        <div className="h-4 bg-slate-700 rounded w-3/4"></div>
        <div className="h-4 bg-slate-700 rounded w-1/2"></div>
        <div className="h-20 bg-slate-700 rounded"></div>
      </div>
    </Card>
  );
}

// Data Table Wrapper
interface DataTableProps {
  columns: Array<{ key: string; label: string }>;
  data: Array<Record<string, any>>;
  isLoading?: boolean;
  onRowClick?: (row: Record<string, any>) => void;
}

export function DataTable({ columns, data, isLoading = false, onRowClick }: DataTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-800 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-800 rounded-lg">
      <table className="w-full">
        <thead className="bg-slate-800/50 border-b border-slate-800">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {data.map((row, idx) => (
            <tr
              key={idx}
              onClick={() => onRowClick?.(row)}
              className="hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4 text-sm text-slate-300">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Stats Grid Component
interface StatItem {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'pink' | 'purple' | 'cyan' | 'green' | 'red' | 'blue';
}

export function StatsGrid({ stats }: { stats: StatItem[] }) {
  const colorMap = {
    pink: 'text-pink-500',
    purple: 'text-purple-500',
    cyan: 'text-cyan-500',
    green: 'text-green-500',
    red: 'text-red-500',
    blue: 'text-blue-500',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <Card key={idx} className="p-6 hover:border-pink-500/50 transition-colors">
          <div className="flex items-start justify-between mb-4">
            {stat.icon && <div className="text-2xl">{stat.icon}</div>}
            {stat.trend && (
              <span className={`text-xs font-semibold ${stat.trend === 'up' ? 'text-green-500' : stat.trend === 'down' ? 'text-red-500' : 'text-slate-500'}`}>
                {stat.trend === 'up' ? '↑' : stat.trend === 'down' ? '↓' : '→'}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
          <p className={`text-2xl font-bold ${colorMap[stat.color || 'pink']}`}>
            {stat.value}
          </p>
        </Card>
      ))}
    </div>
  );
}
