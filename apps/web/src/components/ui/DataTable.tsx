'use client'
import React, { useState } from 'react'

interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (row: T) => React.ReactNode
}

export function DataTable<T extends object>({
  columns,
  data,
  emptyMessage,
  emptyState,
  onRowClick,
  itemsPerPage = 10,
  // Server-side pagination props
  onPageChange,
  totalPages: externalTotalPages,
  currentPage: externalCurrentPage,
  totalItems,
}: {
  columns: Column<T>[]
  data: T[]
  emptyMessage?: string
  emptyState?: React.ReactNode
  onRowClick?: (row: T) => void
  itemsPerPage?: number
  onPageChange?: (page: number) => void
  totalPages?: number
  currentPage?: number
  totalItems?: number
}) {
  const [internalCurrentPage, setInternalCurrentPage] = useState(1)
  
  const isServerSide = !!onPageChange
  const currentPage = isServerSide ? (externalCurrentPage || 1) : internalCurrentPage
  const totalPages = isServerSide 
    ? (externalTotalPages || 1) 
    : Math.max(1, Math.ceil(data.length / itemsPerPage))

  const visibleData = isServerSide 
    ? data 
    : data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  if (data.length === 0) {
    if (emptyState) return <div className="p-8">{emptyState}</div>
    return (
      <div className="p-20 text-center bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/10 rounded-[32px]">
        <span className="material-symbols-outlined text-4xl text-outline/20 mb-4">inventory_2</span>
        <p className="text-sm font-black text-outline uppercase tracking-widest leading-none italic">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest dark:bg-surface-container overflow-hidden shadow-sm">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface-container-low/50 border-b border-outline-variant/10">
              {columns.map(col => (
                <th
                  key={col.key}
                  className="px-4 py-4 sm:px-8 sm:py-5 text-start text-[10px] font-black text-outline uppercase tracking-widest whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/5">
            {visibleData.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(row)}
                className={`group transition-colors duration-150 hover:bg-surface-container-low/30 dark:hover:bg-surface-container-high/40 ${i % 2 === 1 ? 'bg-surface-container-low/20 dark:bg-surface-container-high/10' : ''} ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 sm:px-8 sm:py-[var(--table-row-py)] text-sm whitespace-nowrap ${colIndex === 0 ? 'font-black text-on-surface uppercase tracking-tight' : 'font-medium text-outline'}`}
                  >
                    {col.render ? col.render(row) : ((row as Record<string, unknown>)[col.key] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-4 sm:px-8 sm:py-5 bg-surface-container-low/30 border-t border-outline-variant/10">
          <span className="text-[10px] font-black text-outline uppercase tracking-widest">
            Page {currentPage} of {totalPages} {totalItems !== undefined && `(${totalItems} total)`}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => {
                if (onPageChange) onPageChange(currentPage - 1)
                else setInternalCurrentPage(p => Math.max(1, p - 1))
              }}
              className="h-10 w-10 flex items-center justify-center rounded-xl border border-outline-variant/30 text-outline hover:bg-on-surface hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-outline"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => {
                if (onPageChange) onPageChange(currentPage + 1)
                else setInternalCurrentPage(p => Math.min(totalPages, p + 1))
              }}
              className="h-10 w-10 flex items-center justify-center rounded-xl border border-outline-variant/30 text-outline hover:bg-on-surface hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-outline"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
