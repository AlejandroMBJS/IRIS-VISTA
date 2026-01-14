'use client';

import { ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
  mobileHidden?: boolean;
  priority?: number; // Lower = shown first on mobile cards
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  emptyState?: ReactNode;
  mobileCardRender?: (item: T) => ReactNode;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  emptyState,
  mobileCardRender,
}: ResponsiveTableProps<T>) {
  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  // Sort columns by priority for mobile view
  const mobileColumns = [...columns]
    .filter(col => !col.mobileHidden)
    .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));

  return (
    <>
      {/* Desktop/Tablet Table View */}
      <div className="hidden md:block rounded-lg bg-white shadow-sm border border-[#ABC0B9] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#ABC0B9] bg-[#FAFBFA]">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-4 lg:px-6 py-4 text-left text-xs font-semibold text-[#2D363F] uppercase tracking-wide ${column.className || ''}`}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={`border-b border-[#ABC0B9] last:border-0 hover:bg-[#FAFBFA] transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 lg:px-6 py-4 ${column.className || ''}`}
                    >
                      {column.render(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            onClick={() => onRowClick?.(item)}
            className={`rounded-xl bg-white shadow-sm border border-[#ABC0B9] p-4 ${
              onRowClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''
            }`}
          >
            {mobileCardRender ? (
              mobileCardRender(item)
            ) : (
              <div className="space-y-2">
                {mobileColumns.map((column, index) => (
                  <div
                    key={column.key}
                    className={`flex items-start justify-between gap-2 ${
                      index === 0 ? 'pb-2 border-b border-[#ABC0B9]/50' : ''
                    }`}
                  >
                    <span className="text-xs text-[#4E616F] flex-shrink-0">
                      {column.header}
                    </span>
                    <span className={`text-sm text-right ${index === 0 ? 'font-semibold text-[#2D363F]' : 'text-[#2D363F]'}`}>
                      {column.render(item)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
