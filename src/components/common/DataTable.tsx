import type { ReactNode } from 'react';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  getRowKey: (row: T) => string;
}

export function DataTable<T>({ columns, data, getRowKey }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em] text-muted"
                  key={column.header}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {data.map((row) => (
              <tr className="transition hover:bg-slate-50" key={getRowKey(row)}>
                {columns.map((column) => (
                  <td
                    className={`whitespace-nowrap px-4 py-3 text-sm text-ink ${column.className ?? ''}`}
                    key={column.header}
                  >
                    {typeof column.accessor === 'function'
                      ? column.accessor(row)
                      : (row[column.accessor] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
