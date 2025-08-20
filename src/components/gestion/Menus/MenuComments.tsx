import React, { useState, useEffect } from 'react';
import { Star, User } from 'lucide-react';
import { Comment, CommentService } from '@/services/commentService';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { formatImageUrl } from '@/utils/imageHelpers';

interface MenuCommentsProps {
  menuId: string;
  menuName: string;
}

export default function MenuComments({ menuId, menuName }: MenuCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalComments: 0,
    averageRating: 0
  });

  // ✅ Charger les commentaires du menu
  useEffect(() => {
    const loadComments = async () => {
      if (!menuId) return;
      
      setLoading(true);
      try {
        const response = await CommentService.getCommentsByDish(menuId);
        setComments(response.comments || []);
        setStats({
          totalComments: response.total_comments || 0,
          averageRating: response.average_rating || 0
        });
      } catch (error) {
        console.error('Erreur lors du chargement des commentaires:', error);
        toast.error('Impossible de charger les commentaires');
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [menuId]);

  // ✅ Fonction pour afficher les étoiles
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating}/5)</span>
      </div>
    );
  };

  // ✅ Fonction pour formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#F17922]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✅ Header avec statistiques */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Commentaires pour
               <span className='font-bold'> {menuName}</span>
            </h3>
            <p className="text-sm text-gray-600">
              {stats.totalComments} commentaire{stats.totalComments > 1 ? 's' : ''}
            </p>
          </div>
          {stats.totalComments > 0 && (
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Note moyenne:</span>
                {renderStars(Math.round(stats.averageRating))}
              </div>
              <p className="text-lg font-semibold text-[#F17922]">
                {stats.averageRating.toFixed(1)}/5
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Liste des commentaires avec scroll limité */}
      <div className="border border-gray-200 rounded-lg">
        {comments.length > 0 ? (
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-0">
              {comments.map((comment, index) => (
                <div
                  key={comment.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    index !== comments.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[#F17922] flex items-center justify-center text-white font-bold flex-shrink-0">
                      {comment.customer?.image ? (
                        <Image
                          src={formatImageUrl(comment.customer.image)}
                          alt={`${comment.customer.first_name || 'Client'} ${comment.customer.last_name || ''}`}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback vers l'initiale si l'image ne charge pas
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        comment.customer?.first_name?.charAt(0) || <User className="w-5 h-5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Header du commentaire */}
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {comment.customer ?
                              `${comment.customer.first_name} ${comment.customer.last_name}` :
                              'Client anonyme'
                            }
                          </h4>
                          <p className="text-xs text-gray-500">
                            {formatDate(comment.created_at || '')}
                          </p>
                        </div>
                        {/* Notation */}
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= comment.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Informations contextuelles */}
                      {comment.order && (
                        <div className="mb-2 text-xs text-gray-500">
                          <span>Commande: {comment.order.reference}</span>
                          {comment.order.created_at && (
                            <span> • {formatDate(comment.order.created_at)}</span>
                          )}
                        </div>
                      )}

                      {/* Message du commentaire */}
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {comment.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Star className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun commentaire
            </h3>
            <p className="text-gray-500">
              Ce plat n&apos;a pas encore reçu de commentaires.
            </p>
          </div>
        )}

        {/* ✅ Indicateur de scroll si plus de 3 commentaires */}
        {comments.length > 3 && (
          <div className="bg-gray-50 px-4 py-2 text-center border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Faites défiler pour voir les {comments.length - 3} autres commentaires
            </p>
          </div>
        )}
      </div>


    </div>
  );
}
