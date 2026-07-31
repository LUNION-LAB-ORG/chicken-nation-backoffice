import React, { useState, useEffect, useRef } from 'react';
import { Star, Download, ChevronDown, Check, Globe, Loader2, Pencil } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Checkbox from '@/components/ui/Checkbox';
import { Pagination } from '@/components/ui/pagination';
import { exportComments, convertCommentsForExport } from '@/services/exportService';
import Image from 'next/image';
import { formatImageUrl } from '@/utils/imageHelpers';
import toast from 'react-hot-toast';
import { useCommentsQuery } from '@/hooks/useCommentsQuery';
import { CommentService } from '@/services/commentService';
import { useAuthStore } from '../../users/hook/authStore';
import { getAllRestaurants, Restaurant } from '@/services/restaurantService';

// ✅ Composant Dropdown Custom
interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = "Sélectionner...",
  label,
  disabled = false,
  className = ""
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(option => option.value === value);

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-lg 
          focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-[#F17922] 
          transition-all duration-200 flex items-center justify-between
          ${disabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'hover:border-gray-400 cursor-pointer'
          }
          ${isOpen ? 'ring-2 ring-[#F17922] border-[#F17922]' : ''}
        `}
      >
        <div className="flex items-center gap-2">
          {selectedOption?.icon && selectedOption.icon}
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleOptionClick(option.value)}
              className={`
                w-full px-3 py-2 text-left flex items-center justify-between gap-2 
                hover:bg-gray-50 transition-colors duration-150
                ${option.value === value 
                  ? 'bg-[#FFF8EE] text-[#F17922] font-medium' 
                  : 'text-gray-700'
                }
                first:rounded-t-lg last:rounded-b-lg
              `}
            >
              <div className="flex items-center gap-2">
                {option.icon && option.icon}
                <span>{option.label}</span>
              </div>
              {option.value === value && (
                <Check className="w-4 h-4 text-[#F17922]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function GlobalReviews() {
  const { user } = useAuthStore();

  const [selectedComments, setSelectedComments] = useState<Record<string, boolean>>({});
  const [isExporting, setIsExporting] = useState(false);

  // ✅ États pour les filtres côté serveur avec restaurants
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState({
    rating: '',
    restaurantId: '', // ✅ Permettre la sélection manuelle du restaurant
    dateFrom: '',
    dateTo: ''
  });

  // ✅ État pour la liste des restaurants
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);

  // ✅ Déterminer les permissions
  const canSelectRestaurant = user?.role === 'ADMIN' || user?.role === 'MARKETING';
  const isRestaurantManager = user?.role === 'MANAGER' || user?.role === 'CAISSIER' || user?.role === 'CALL_CENTER' || user?.role === 'CUISINE';

  // ✅ Récupérer la liste des restaurants au chargement
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const allRestaurants = await getAllRestaurants();
        const activeRestaurants = allRestaurants.filter(restaurant => restaurant.active);

        // ✅ Filtrer selon les permissions
        let filteredRestaurants = activeRestaurants;

                 if (isRestaurantManager && user?.restaurant_id) {
           // Manager : seulement son restaurant (filtrage automatique en arrière-plan)
           setFilters(prev => ({ ...prev, restaurantId: user.restaurant_id || '' }));
         } else if (canSelectRestaurant) {
           // Admin/Marketing : tous les restaurants avec sélection
           filteredRestaurants = activeRestaurants;
         }

                  // ✅ Seulement charger les restaurants si l'utilisateur peut les sélectionner
         if (canSelectRestaurant) {
           setRestaurants(filteredRestaurants);
         }
      } catch (error) {
        console.error('Erreur lors de la récupération des restaurants:', error);
        toast.error('Erreur lors du chargement des restaurants');
      } finally {
        setLoadingRestaurants(false);
      }
    };

         if (user) {
       fetchRestaurants();
     }
   }, [user, isRestaurantManager, canSelectRestaurant]);

  // ✅ Utiliser TanStack Query avec les filtres supportés par l'API
  const {
    comments,
    totalItems,
    totalPages,
    currentPage,
    isLoading: loading,
    setCurrentPage
  } = useCommentsQuery({
    rating: filters.rating,
    restaurantId: filters.restaurantId || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined
  });

  // ✅ Plus besoin de filtrage côté client - TanStack Query gère tout côté serveur
  const currentComments = comments;

  // ✅ Options pour les dropdowns custom
  const ratingOptions: DropdownOption[] = [
    { value: '', label: 'Toutes les notes' },
    { value: '5', label: '⭐⭐⭐⭐⭐ (5 étoiles)' },
    { value: '4', label: '⭐⭐⭐⭐ (4 étoiles)' },
    { value: '3', label: '⭐⭐⭐ (3 étoiles)' },
    { value: '2', label: '⭐⭐ (2 étoiles)' },
    { value: '1', label: '⭐ (1 étoile)' }
  ];

  const restaurantOptions: DropdownOption[] = [
    { value: '', label: 'Tous les restaurants' },
    ...restaurants.map(restaurant => ({
      value: restaurant.id || '',
      label: restaurant.name
    }))
  ];

  const handleSelectComment = (commentId: string, checked: boolean) => {
    setSelectedComments(prev => ({
      ...prev,
      [commentId]: checked
    }));
  };
 

  // ✅ Fonction d'export des commentaires (page actuelle seulement avec pagination côté serveur)
  const handleExport = async () => {
    if (comments.length === 0) {
      toast.error('Aucun commentaire à exporter');
      return;
    }

    setIsExporting(true);

    try {
      const exportData = convertCommentsForExport(comments);

      // Ajouter un petit délai pour l'UX
      await new Promise(resolve => setTimeout(resolve, 500));

      exportComments(exportData, 'csv');

      toast.success(
        `Export CSV réussi ! ${comments.length} commentaire${comments.length > 1 ? 's' : ''} de la page ${currentPage} exporté${comments.length > 1 ? 's' : ''}.`
      );
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erreur lors de l\'export des commentaires'
      );
    } finally {
      setIsExporting(false);
    }
  };


 
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 space-y-6">
        <div className="flex justify-center items-center py-8">
          <div className="text-gray-500">Chargement des commentaires...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 space-y-6">
      {/* ✅ Header simple */}
      <div className="flex justify-between items-center mb-6">
        <div>
           <span className="bg-[#F17922] px-4 py-2 text-white text-sm font-medium  rounded-xl">
           {totalItems} commentaire{totalItems > 1 ? 's' : ''}
           </span>
         
        </div>
        <div className="flex gap-4">
          {/* ✅ Bouton pour afficher/masquer les filtres */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
          >
            {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={comments.length === 0 || isExporting}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-xl transition-all ${
              comments.length === 0 || isExporting
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                : 'text-white bg-[#F17922] hover:bg-[#e06816] hover:shadow-md'
            }`}
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Export...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Exporter 
              </>
            )}
          </button>

        </div>
      </div>

            {/* ✅ Interface de filtres (sélection restaurant visible seulement pour ADMIN/MARKETING) */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className={`grid grid-cols-1 ${canSelectRestaurant ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'} gap-4`}>
            {/* Filtre par note */}
            <div>
              <CustomDropdown
                options={ratingOptions}
                value={filters.rating}
                onChange={(value) => {
                  setFilters(prev => ({ ...prev, rating: value }));
                  setCurrentPage(1);
                }}
                label="Note"
                placeholder="Toutes les notes"
              />
            </div>

            {/* Filtre date début */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date début
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                max={filters.dateTo || undefined}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, dateFrom: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-[#F17922] transition-all duration-200 text-gray-900"
              />
            </div>

            {/* Filtre date fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date fin
              </label>
              <input
                type="date"
                value={filters.dateTo}
                min={filters.dateFrom || undefined}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, dateTo: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-[#F17922] transition-all duration-200 text-gray-900"
              />
            </div>

            {/* Filtre par restaurant - SEULEMENT pour ADMIN et MARKETING */}
            {canSelectRestaurant && (
              <div>
                {loadingRestaurants ? (
                  <div className='w-1/4'>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Restaurant
                    </label>
                    <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
                      Chargement des restaurants...
                    </div>
                  </div>
                ) : (
                  <CustomDropdown
                    options={restaurantOptions}
                    value={filters.restaurantId}
                    onChange={(value) => {
                      setFilters(prev => ({ ...prev, restaurantId: value }));
                      setCurrentPage(1);
                    }}
                    label="Restaurant"
                    placeholder="Tous les restaurants"
                  />
                )}
              </div>
            )}
          </div>

          {/* Bouton pour réinitialiser les filtres */}
          <div className="flex justify-between items-center mt-4">
            <div/>
            <button
              type="button"
              onClick={() => {
                setFilters({
                  rating: '',
                  restaurantId: isRestaurantManager && user?.restaurant_id
                    ? user.restaurant_id
                    : canSelectRestaurant
                    ? ''
                    : filters.restaurantId,
                  dateFrom: '',
                  dateTo: ''
                });
                setCurrentPage(1);
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      )}

    
      {/* ✅ Liste des commentaires - 2 par ligne */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F17922]"></div>
        </div>
      ) : currentComments.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {currentComments.map((comment) => (
            <div key={comment.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-3">
                {/* ✅ Checkbox */}
                <div className="mt-1">
                  <Checkbox
                    checked={selectedComments[comment.id] || false}
                    onChange={(checked) => handleSelectComment(comment.id, checked)}
                  />
                </div>

                {/* ✅ Avatar du client - même style que MenuComments */}
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#F17922] flex items-center justify-center text-white font-bold flex-shrink-0">
                  {comment.customer?.image ? (
                    <Image
                      src={formatImageUrl(comment.customer.image)}
                      alt={`${comment.customer.first_name || 'Client'} ${comment.customer.last_name || ''}`}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        console.error('Erreur de chargement image client:');
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-sm">
                      {comment.customer?.first_name?.charAt(0) || 'C'}
                      {comment.customer?.last_name?.charAt(0) || ''}
                    </span>
                  )}
                </div>

                {/* ✅ Contenu du commentaire */}
                <div className="flex-1 min-w-0">
                  {/* Nom et étoiles */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {comment.customer?.first_name} {comment.customer?.last_name}
                      </h4>
                      {comment.customer?.phone && (
                        <p className="text-xs text-gray-500 truncate">
                          {comment.customer.phone}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center ml-2 shrink-0">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < comment.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Message — éditable par le staff (correction de fautes) */}
                  <EditableMessage commentId={comment.id} message={comment.message} />

                  {/* Informations supplémentaires */}
                  <div className="flex flex-col space-y-1 text-xs text-gray-500">
                    <span>Commande: {comment.order?.reference}</span>
                    <span>{comment.created_at ? new Date(comment.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Date inconnue'}</span>
                  </div>

                  {/* CURATION SITE : c'est ICI qu'on choisit les témoignages
                      affichés sur le site vitrine — plus aucune sélection
                      automatique côté serveur. */}
                  <SiteVisibilityToggle
                    commentId={comment.id}
                    visible={comment.site_visible === true}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Aucun commentaire trouvé
        </div>
      )}

      {/* ✅ Pagination côté serveur */}
      <div className="flex flex-col items-center py-4 px-2 border-t border-gray-200 space-y-2">
        {/* Statistiques */}
        <div className="text-sm text-gray-600 flex items-center gap-2">
       

          {loading && (
            <div className="flex items-center gap-1 text-[#F17922]">
              <div className="w-3 h-3 border border-[#F17922] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs">Chargement...</span>
            </div>
          )}
        </div>

        {/* Pagination côté serveur */}
        {totalPages > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            isLoading={loading}
          />
        )}
      </div>


    </div>
  );
}
/**
 * Bascule « Visible sur le site » d'un avis — la curation des Témoignages.
 * Vert quand l'avis est publié sur le site vitrine, neutre sinon. La mise à
 * jour invalide la liste pour refléter l'état serveur.
 */
function SiteVisibilityToggle({
  commentId,
  visible,
}: {
  commentId: string;
  visible: boolean;
}) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: (next: boolean) => CommentService.setSiteVisible(commentId, next),
    onSuccess: (r) => {
      toast.success(r.message);
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => mutate(!visible)}
      title={
        visible
          ? 'Cet avis est affiché dans les Témoignages du site — cliquer pour le retirer'
          : 'Cliquer pour afficher cet avis dans les Témoignages du site'
      }
      className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        visible
          ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
      } disabled:opacity-50`}
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Globe className="h-3.5 w-3.5" />
      )}
      {visible ? 'Visible sur le site' : 'Afficher sur le site'}
    </button>
  );
}

/**
 * Message d'avis ÉDITABLE (staff) — corriger une faute de frappe avant de
 * mettre l'avis en avant sur le site. Crayon → textarea en place → Enregistrer.
 * La NOTE n'est jamais modifiable : elle appartient au client.
 */
function EditableMessage({
  commentId,
  message,
}: {
  commentId: string;
  message: string;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [brouillon, setBrouillon] = useState(message);

  const { mutate, isPending } = useMutation({
    mutationFn: (texte: string) => CommentService.updateMessage(commentId, texte),
    onSuccess: () => {
      toast.success('Avis corrigé');
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!editing) {
    return (
      <div className="group mb-3 flex items-start gap-2">
        <p className="text-gray-600 text-sm line-clamp-3 flex-1">{message}</p>
        <button
          type="button"
          onClick={() => {
            setBrouillon(message);
            setEditing(true);
          }}
          title="Corriger le texte de l'avis"
          className="shrink-0 rounded-md p-1 text-gray-300 transition hover:bg-orange-50 hover:text-[#F17922] group-hover:text-gray-400"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  const valide = brouillon.trim().length > 0 && brouillon.trim().length <= 1000;

  return (
    <div className="mb-3 space-y-2">
      <textarea
        value={brouillon}
        onChange={(e) => setBrouillon(e.target.value)}
        rows={3}
        autoFocus
        disabled={isPending}
        className="w-full rounded-lg border border-[#F17922] px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F17922]/20"
      />
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={isPending}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500 transition hover:bg-gray-200"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={() => mutate(brouillon.trim())}
          disabled={!valide || isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#F17922] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#F17922]/90 disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          Enregistrer
        </button>
      </div>
    </div>
  );
}
