import { cn } from '@/lib/utils'
import { useState } from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}

export function Pagination({ currentPage, totalPages, onPageChange, isLoading = false }: PaginationProps) {
  const [jumpPage, setJumpPage] = useState('')

  // Ne pas afficher si une seule page
  if (totalPages <= 1) return null

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage && !isLoading) {
      onPageChange(newPage)
    }
  }

  const handleJumpToPage = () => {
    const page = parseInt(jumpPage)
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      handlePageChange(page)
      setJumpPage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJumpToPage()
    }
  }

  // Calculer les numéros de page à afficher avec ellipses
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const delta = 1 // Nombre de pages à afficher autour de la page courante

    // Toujours afficher la première page
    pages.push(1)

    // Si page courante est loin du début, ajouter ellipse
    if (currentPage > delta + 2) {
      pages.push('ellipsis')
    }

    // Pages autour de la page courante
    const start = Math.max(2, currentPage - delta)
    const end = Math.min(totalPages - 1, currentPage + delta)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    // Si page courante est loin de la fin, ajouter ellipse
    if (currentPage < totalPages - delta - 1) {
      pages.push('ellipsis')
    }

    // Toujours afficher la dernière page (si plus d'une page)
    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex flex-col items-center gap-4 w-full px-4">
      {/* Navigation principale */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {/* Bouton Première page (mobile: caché si peu de pages) */}
        <button
          type="button"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1 || isLoading}
          className="hidden sm:flex p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 transition-colors"
          title="Première page"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 17L13 12L18 7M11 17L6 12L11 7" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Bouton Précédent */}
        <button
          type="button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 transition-colors"
          title="Page précédente"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Numéros de page avec ellipses */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <div key={`ellipsis-${index}`} className="w-8 h-8 flex items-center justify-center text-gray-400">
                  •••
                </div>
              )
            }

            const isActive = currentPage === page

            return (
              <button
                key={page}
                type="button"
                onClick={() => handlePageChange(page)}
                disabled={isLoading}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 border ${isActive
                  ? 'bg-[#F17922] text-white shadow-md font-bold border-[#F17922] scale-110'
                  : 'text-gray-700 hover:bg-gray-100 border-gray-200 hover:border-[#F17922]'
                  } ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
              >
                {page}
              </button>
            )
          })}
        </div>

        {/* Bouton Suivant */}
        <button
          type="button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 transition-colors"
          title="Page suivante"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 6L15 12L9 18" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Bouton Dernière page (mobile: caché si peu de pages) */}
        <button
          type="button"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages || isLoading}
          className="hidden sm:flex p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 transition-colors"
          title="Dernière page"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M6 7L11 12L6 17M13 7L18 12L13 17" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Barre d'info et saut de page */}
      <div className={cn("flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md", {
      })}>
        {/* Indicateur de pages */}
        <div className="text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
          Page <span className="font-semibold text-[#F17922]">{currentPage}</span> sur <span className="font-semibold">{totalPages}</span>
        </div>

        {/* Saut rapide vers une page (si beaucoup de pages) */}
        {totalPages > 10 && (
          <div className="flex items-center gap-2">
            <label htmlFor="jump-page" className="text-xs text-gray-600 whitespace-nowrap">
              Aller à :
            </label>
            <input
              id="jump-page"
              type="number"
              min="1"
              max={totalPages}
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              placeholder={`1-${totalPages}`}
              className="w-20 px-2 py-1 placeholder:text-gray-400 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={handleJumpToPage}
              disabled={isLoading || !jumpPage}
              className="px-3 py-1 text-xs font-medium text-white bg-[#F17922] rounded-md hover:bg-[#d96a1c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              OK
            </button>
          </div>
        )}
      </div>

      {/* Indicateur de chargement */}
      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-3 h-3 border-2 border-[#F17922] border-t-transparent rounded-full animate-spin"></div>
          <span>Chargement...</span>
        </div>
      )}
    </div>
  )
}
