import Checkbox from "@/components/ui/Checkbox";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Comment, getCommentsByCustomer } from "@/services/commentService";
import { Star } from "lucide-react";
import { formatImageUrl } from "@/utils/imageHelpers";
import toast from "react-hot-toast";

interface Review {
  id: string;
  date: string;
  comment: string;
}

interface ReviewsTabProps {
  clientReviews: Review[];
  client: {
    firstName: string;
    id?: string;
    [key: string]: unknown;
  };
  fullName: string;
  formatDate: (date: Date) => string;
}

export function ReviewsTab({ clientReviews, client, fullName, formatDate }: ReviewsTabProps) {
  const [selectedReviews, setSelectedReviews] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSelectReview = (reviewId: string, checked: boolean) => {
    setSelectedReviews(prev => ({
      ...prev,
      [reviewId]: checked
    }));
  };

  // ✅ Charger les commentaires du client avec le nouveau service
  useEffect(() => {
    const loadComments = async () => {
      if (!client.id) return;

      setLoading(true);
      try {
        const commentsData = await getCommentsByCustomer(client.id);
        setComments(commentsData);
      } catch (error) {
        console.error('Erreur lors du chargement des commentaires:', error);
        toast.error('Impossible de charger les commentaires');
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [client.id]);

  // ✅ Fonction pour afficher les étoiles de notation
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

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-8">
        <div className="text-gray-500">Chargement des commentaires...</div>
      </div>
    );
  }

  // ✅ Utiliser les nouveaux commentaires du service si disponibles, sinon fallback sur clientReviews
  const displayComments = comments.length > 0 ? comments : clientReviews;

  return (
    <div className="w-full">
      {/* ✅ Statistiques des commentaires */}
      {comments.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {comments.length} commentaire{comments.length > 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-gray-600">
                Note moyenne: {(comments.reduce((acc, c) => acc + c.rating, 0) / comments.length).toFixed(1)}/5
              </p>
            </div>
            <div className="text-right">
              {renderStars(Math.round(comments.reduce((acc, c) => acc + c.rating, 0) / comments.length))}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-4">
        {displayComments.length > 0 ? (
          displayComments.map((item) => {
            // ✅ Adapter les données selon le type (Comment ou Review)
            const isComment = 'rating' in item;
            const comment = isComment ? (item as Comment) : null;
            const review = !isComment ? (item as Review) : null;

            return (
              <div key={item.id} className="flex p-4 border-b border-[#80808096]">
             
                <div className="flex-1">
                  <div className="flex space-x-3 mb-2">
                    {/* ✅ Avatar avec image - même style que GlobalReviews */}
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[#F17922] flex items-center justify-center text-white font-bold flex-shrink-0">
                      {comment?.customer?.image ? (
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
                          {comment?.customer?.first_name?.charAt(0) || client.firstName.charAt(0)}
                          {comment?.customer?.last_name?.charAt(0) || ''}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 items-center">
                      <h4 className="text-sm font-medium text-gray-900">
                        {comment?.customer ?
                          `${comment.customer.first_name} ${comment.customer.last_name}` :
                          fullName
                        }
                      </h4>
                      <span className="text-xs text-gray-500">
                        {formatDate(new Date(comment?.created_at || review?.date || ''))}
                      </span>
                    </div>
                  </div>

                  {/* ✅ Afficher la notation si disponible */}
                  {comment?.rating && (
                    <div className="mb-2">
                      {renderStars(comment.rating)}
                    </div>
                  )}

                  {/* ✅ Afficher les informations de commande et plat si disponibles */}
                  {comment?.order && (
                    <div className="mb-2 text-xs text-gray-500">
                      <span>Commande: {comment.order.reference}</span>
                      {comment.dish && <span> • Plat: {comment.dish.name}</span>}
                    </div>
                  )}

                  <p className="mt-2 text-sm text-gray-700 pl-0">
                    {comment?.message || review?.comment}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-gray-500 text-center p-4 bg-gray-50 rounded-lg">
            Aucun commentaire trouvé
          </p>
        )}
      </div>
    </div>
  );
}
