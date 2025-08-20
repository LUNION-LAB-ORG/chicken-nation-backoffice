import { useState, useEffect } from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}

export function Pagination({ currentPage, totalPages, onPageChange, isLoading = false }: PaginationProps) {
  // ✅ État optimiste simple - garde la page cliquée jusqu'à confirmation
  const [pendingPage, setPendingPage] = useState<number | null>(null);

  // ✅ Réinitialiser pendingPage quand le chargement est terminé avec délai
  useEffect(() => {
    if (!isLoading && pendingPage !== null) {
      console.log('[Pagination] Chargement terminé, maintien de l\'état orange');
      // ✅ Délai pour maintenir l'état orange visible
      const timeoutId = setTimeout(() => {
        console.log('[Pagination] Réinitialisation pendingPage après délai');
        setPendingPage(null);
      }, 300); // 300ms pour voir la confirmation

      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, pendingPage]);

  // ✅ Fonction avec UI optimiste simple
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      console.log('[Pagination] Changement vers page:', newPage);
      // 1. Marquer la page comme en attente
      setPendingPage(newPage);

      // 2. Déclencher l'appel serveur
      onPageChange(newPage);
    }
  };

  // ✅ Page à afficher = page en attente OU page courante
  const displayPage = pendingPage || currentPage;

  // ✅ Ne pas afficher si une seule page
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* ✅ Indicateur de pages */}
      <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
        Page {displayPage} sur {totalPages}
      </div>

      <div className="flex items-center gap-2">
        {/* Bouton précédent */}
        <button
          type="button"
          onClick={() => handlePageChange(displayPage - 1)}
          disabled={displayPage === 1 || totalPages === 0 || isLoading}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
          title="Page précédente"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            // ✅ Utiliser displayPage pour l'affichage
            const isActive = displayPage === page;
            const isPageLoading = isLoading && pendingPage === page;

            return (
              <button
                key={page}
                type="button"
                onClick={() => handlePageChange(page)}
                disabled={isPageLoading}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 border ${
                  isActive
                    ? 'bg-[#F17922] text-white shadow-md font-bold border-[#F17922]'
                    : 'text-gray-700 hover:bg-gray-100 border-gray-200 hover:border-[#F17922]'
                } ${isPageLoading ? 'animate-pulse' : ''}`}
              >
                {isPageLoading ? (
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  page
                )}
              </button>
            );
          })}
        </div>

        {/* Bouton suivant */}
        <button
          type="button"
          onClick={() => handlePageChange(displayPage + 1)}
          disabled={displayPage === totalPages || totalPages === 0 || isLoading}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
          title="Page suivante"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 6L15 12L9 18" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
