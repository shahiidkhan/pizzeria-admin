// src/components/tables/DataTable.jsx
import { useState } from 'react';
import {
  useReactTable, getCoreRowModel, getPaginationRowModel,
  getSortedRowModel, getFilteredRowModel, flexRender,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { cn } from '../../utils/cn';

export default function DataTable({ columns, data = [], loading = false, pageSize = 8, globalFilter, onGlobalFilterChange }) {
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination, globalFilter: globalFilter ?? '' },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onGlobalFilterChange,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const SortIcon = ({ column }) => {
    if (!column.getCanSort()) return null;
    const sorted = column.getIsSorted();
    if (sorted === 'asc') return <ChevronUp size={14} className="text-brand-500" />;
    if (sorted === 'desc') return <ChevronDown size={14} className="text-brand-500" />;
    return <ChevronsUpDown size={14} className="text-[var(--text-muted)] opacity-50" />;
  };

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap',
                      header.column.getCanSort() && 'cursor-pointer select-none hover:text-[var(--text-primary)] transition-colors'
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <SortIcon column={header.column} />
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} className="py-12"><LoadingSpinner center /></td></tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr><td colSpan={columns.length}><EmptyState /></td></tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3 text-[var(--text-primary)] whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)]">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} —{' '}
            {table.getFilteredRowModel().rows.length} total rows
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)]
                         hover:border-brand-500 hover:text-brand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: Math.min(table.getPageCount(), 5) }, (_, i) => (
              <button
                key={i}
                onClick={() => table.setPageIndex(i)}
                className={cn(
                  'w-8 h-8 rounded-lg text-xs font-medium transition-all',
                  table.getState().pagination.pageIndex === i
                    ? 'bg-brand-500 text-white'
                    : 'border border-[var(--border)] text-[var(--text-muted)] hover:border-brand-500 hover:text-brand-500'
                )}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)]
                         hover:border-brand-500 hover:text-brand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
