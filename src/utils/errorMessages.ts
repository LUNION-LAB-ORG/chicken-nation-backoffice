// Utilitaire pour traduire les erreurs techniques en messages utilisateur compréhensibles

export interface ErrorResponse {
  status?: number;
  message?: string;
  error?: string;
  details?: Record<string, unknown>;
}

/**
 * Traduit les erreurs API en messages utilisateur compréhensibles
 */
export const getHumanReadableError = (error: unknown): string => {
  let status = 0;
  let message = 'Une erreur est survenue';

  // Type guard for axios error with response
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
    if (axiosError.response?.status) {
      status = axiosError.response.status;
      message = axiosError.response.data?.message || axiosError.response.statusText || '';
    }
  }
  // Type guard for error with status property
  else if (error && typeof error === 'object' && 'status' in error) {
    const statusError = error as { status?: number; message?: string };
    status = statusError.status || 0;
    message = statusError.message || '';
  }
  // Type guard for standard Error object
  else if (error instanceof Error) {
    message = error.message;
  }
  // Fallback for string errors
  else if (typeof error === 'string') {
    message = error;
  }

  // Messages spécifiques selon le code d'erreur
  switch (status) {
    case 400:
      if (message.toLowerCase().includes('catégorie') || message.toLowerCase().includes('category')) {
        return 'Veuillez sélectionner au moins une catégorie pour cette promotion.';
      }
      if (message.toLowerCase().includes('restaurant')) {
        return 'Veuillez sélectionner au moins un restaurant pour cette promotion.';
      }
      if (message.toLowerCase().includes('produit') || message.toLowerCase().includes('dish')) {
        return 'Veuillez sélectionner au moins un produit pour cette promotion.';
      }
      if (message.toLowerCase().includes('date')) {
        return 'Les dates de la promotion ne sont pas valides. Vérifiez que la date de fin est postérieure à la date de début.';
      }
      if (message.toLowerCase().includes('montant') || message.toLowerCase().includes('amount')) {
        return 'Le montant de la promotion n\'est pas valide. Veuillez vérifier les valeurs saisies.';
      }
      if (message.toLowerCase().includes('pourcentage') || message.toLowerCase().includes('percentage')) {
        return 'Le pourcentage doit être compris entre 1 et 100.';
      }
      return 'Les informations saisies ne sont pas valides. Veuillez vérifier votre saisie.';

    case 401:
      return 'Votre session a expiré. Veuillez vous reconnecter.';

    case 403:
      return 'Vous n\'avez pas les droits nécessaires pour effectuer cette action. Contactez votre administrateur.';

    case 404:
      return 'La promotion demandée n\'existe plus ou a été supprimée.';

    case 409:
      return 'Une promotion avec ces caractéristiques existe déjà. Veuillez modifier les paramètres.';

    case 422:
      if (message.toLowerCase().includes('image')) {
        return 'Le format de l\'image n\'est pas supporté. Utilisez un fichier JPG, PNG ou WebP.';
      }
      return 'Les données fournies ne respectent pas le format attendu. Veuillez vérifier votre saisie.';

    case 429:
      return 'Trop de tentatives. Veuillez patienter quelques instants avant de réessayer.';

    case 500:
      return 'Une erreur technique s\'est produite. Veuillez réessayer dans quelques instants.';

    case 502:
    case 503:
    case 504:
      return 'Le service est temporairement indisponible. Veuillez réessayer dans quelques minutes.';

    default:
      // Messages par défaut selon le type d'erreur
      if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch')) {
        return 'Problème de connexion. Vérifiez votre connexion internet et réessayez.';
      }
      if (message.toLowerCase().includes('timeout')) {
        return 'L\'opération a pris trop de temps. Veuillez réessayer.';
      }
      if (message.toLowerCase().includes('cors')) {
        return 'Erreur de sécurité. Veuillez actualiser la page et réessayer.';
      }
      
      // Message générique
      return 'Une erreur inattendue s\'est produite. Veuillez réessayer ou contacter le support.';
  }
};

/**
 * Messages de succès pour les actions sur les promotions
 */
export const getPromotionSuccessMessage = (action: string): string => {
  switch (action) {
    case 'create':
      return 'Promotion créée avec succès !';
    case 'update':
      return 'Promotion modifiée avec succès !';
    case 'delete':
      return 'Promotion supprimée avec succès !';
    case 'activate':
      return 'Promotion activée avec succès !';
    case 'deactivate':
      return 'Promotion désactivée avec succès !';
    case 'draft':
      return 'Promotion sauvegardée comme brouillon !';
    default:
      return 'Opération effectuée avec succès !';
  }
};

/**
 * Messages de succès pour les actions sur le personnel
 */
export const getPersonnelSuccessMessage = (action: string): string => {
  switch (action) {
    case 'create':
      return 'Utilisateur créé avec succès !';
    case 'update':
      return 'Profil mis à jour avec succès !';
    case 'delete':
      return 'Utilisateur supprimé avec succès !';
    case 'block':
      return 'Utilisateur bloqué avec succès !';
    case 'restore':
      return 'Utilisateur restauré avec succès !';
    default:
      return 'Opération effectuée avec succès !';
  }
};

/**
 * Messages de succès pour les actions sur les restaurants
 */
export const getRestaurantSuccessMessage = (action: string): string => {
  switch (action) {
    case 'create':
      return 'Restaurant créé avec succès !';
    case 'update':
      return 'Restaurant modifié avec succès !';
    case 'delete':
      return 'Restaurant supprimé avec succès !';
    case 'activate':
      return 'Restaurant activé avec succès !';
    case 'deactivate':
      return 'Restaurant désactivé avec succès !';
    default:
      return 'Opération effectuée avec succès !';
  }
};

/**
 * Messages de succès génériques (pour compatibilité)
 * @deprecated Utilisez getPromotionSuccessMessage, getPersonnelSuccessMessage ou getRestaurantSuccessMessage
 */
export const getSuccessMessage = (action: string): string => {
  return getPromotionSuccessMessage(action);
};

/**
 * Messages d'information pour guider l'utilisateur
 */
export const getInfoMessage = (context: string): string => {
  switch (context) {
    case 'loading':
      return 'Chargement en cours...';
    case 'saving':
      return 'Sauvegarde en cours...';
    case 'deleting':
      return 'Suppression en cours...';
    case 'uploading':
      return 'Téléchargement de l\'image en cours...';
    default:
      return 'Traitement en cours...';
  }
};

/**
 * Validation des erreurs spécifiques aux promotions
 */
export const validatePromotionError = (error: unknown, context: 'create' | 'update' | 'delete' | 'activate'): string => {
  const baseMessage = getHumanReadableError(error);

  // Ajouter du contexte selon l'action
  switch (context) {
    case 'create':
      if (baseMessage.includes('droits')) {
        return 'Vous n\'avez pas les droits pour créer des promotions. Contactez votre administrateur.';
      }
      break;
    case 'update':
      if (baseMessage.includes('droits')) {
        return 'Vous n\'avez pas les droits pour modifier cette promotion. Contactez votre administrateur.';
      }
      break;
    case 'delete':
      if (baseMessage.includes('droits')) {
        return 'Vous n\'avez pas les droits pour supprimer cette promotion. Contactez votre administrateur.';
      }
      if (baseMessage.includes('n\'existe plus')) {
        return 'Cette promotion a déjà été supprimée ou n\'existe plus.';
      }
      break;
    case 'activate':
      if (baseMessage.includes('droits')) {
        return 'Vous n\'avez pas les droits pour activer/désactiver cette promotion. Contactez votre administrateur.';
      }
      break;
  }

  return baseMessage;
};

/**
 * Validation des erreurs spécifiques au personnel
 */
export const validatePersonnelError = (error: unknown, context: 'create' | 'update' | 'delete' | 'block' | 'restore'): string => {
  const baseMessage = getHumanReadableError(error);

  // Messages spécifiques selon le contexte
  switch (context) {
    case 'create':
      if (baseMessage.includes('droits')) {
        return 'Vous n\'avez pas les droits pour créer des utilisateurs. Contactez votre administrateur.';
      }
      if (baseMessage.includes('email') || baseMessage.toLowerCase().includes('duplicate')) {
        return 'Cette adresse email est déjà utilisée. Veuillez en choisir une autre.';
      }
      if (baseMessage.includes('restaurant')) {
        return 'Vous devez sélectionner un restaurant pour cet utilisateur.';
      }
      return 'Impossible de créer l\'utilisateur. Vérifiez les informations saisies.';

    case 'update':
      if (baseMessage.includes('droits')) {
        return 'Vous n\'avez pas les droits pour modifier cet utilisateur. Contactez votre administrateur.';
      }
      if (baseMessage.includes('email') || baseMessage.toLowerCase().includes('duplicate')) {
        return 'Cette adresse email est déjà utilisée par un autre utilisateur.';
      }
      return 'Impossible de modifier l\'utilisateur. Vérifiez les informations saisies.';

    case 'delete':
      if (baseMessage.includes('droits')) {
        return 'Vous n\'avez pas les droits pour supprimer cet utilisateur. Contactez votre administrateur.';
      }
      if (baseMessage.includes('n\'existe plus')) {
        return 'Cet utilisateur a déjà été supprimé ou n\'existe plus.';
      }
      return 'Impossible de supprimer l\'utilisateur. Veuillez réessayer.';

    case 'block':
      if (baseMessage.includes('droits')) {
        return 'Vous n\'avez pas les droits pour bloquer cet utilisateur. Contactez votre administrateur.';
      }
      return 'Impossible de bloquer l\'utilisateur. Veuillez réessayer.';

    case 'restore':
      if (baseMessage.includes('droits')) {
        return 'Vous n\'avez pas les droits pour restaurer cet utilisateur. Contactez votre administrateur.';
      }
      return 'Impossible de restaurer l\'utilisateur. Veuillez réessayer.';
  }

  return baseMessage;
};

/**
 * Validation des erreurs spécifiques aux restaurants
 */
export const validateRestaurantError = (error: unknown, context: 'create' | 'update' | 'delete' | 'activate' | 'manager'): string => {
  const baseMessage = getHumanReadableError(error);

  // Messages spécifiques selon le contexte
  switch (context) {
    case 'create':
      if (baseMessage.includes('droits')) {
        return 'Vous n\'avez pas les droits pour créer des restaurants. Contactez votre administrateur.';
      }
      if (baseMessage.includes('email') || baseMessage.toLowerCase().includes('duplicate')) {
        return 'Cette adresse email est déjà utilisée. Veuillez en choisir une autre.';
      }
      if (baseMessage.includes('address') || baseMessage.includes('adresse')) {
        return 'L\'adresse du restaurant est invalide ou déjà utilisée.';
      }
      if (baseMessage.includes('manager')) {
        return 'Erreur lors de la création du manager. Vérifiez les informations saisies.';
      }
      return 'Impossible de créer le restaurant. Vérifiez les informations saisies.';

    case 'update':
      if (baseMessage.includes('droits')) {
        return 'Vous n\'avez pas les droits pour modifier ce restaurant. Contactez votre administrateur.';
      }
      if (baseMessage.includes('email') || baseMessage.toLowerCase().includes('duplicate')) {
        return 'Cette adresse email est déjà utilisée par un autre restaurant.';
      }
      if (baseMessage.includes('address') || baseMessage.includes('adresse')) {
        return 'L\'adresse du restaurant est invalide.';
      }
      return 'Impossible de modifier le restaurant. Vérifiez les informations saisies.';

    case 'delete':
      if (baseMessage.includes('droits')) {
        return 'Vous n\'avez pas les droits pour supprimer ce restaurant. Contactez votre administrateur.';
      }
      if (baseMessage.includes('n\'existe plus')) {
        return 'Ce restaurant a déjà été supprimé ou n\'existe plus.';
      }
      if (baseMessage.includes('orders') || baseMessage.includes('commandes')) {
        return 'Impossible de supprimer ce restaurant car il a des commandes en cours.';
      }
      return 'Impossible de supprimer le restaurant. Veuillez réessayer.';

    case 'activate':
      if (baseMessage.includes('droits')) {
        return 'Vous n\'avez pas les droits pour activer/désactiver ce restaurant. Contactez votre administrateur.';
      }
      return 'Impossible de changer le statut du restaurant. Veuillez réessayer.';

    case 'manager':
      if (baseMessage.includes('droits')) {
        return 'Vous n\'avez pas les droits pour accéder aux informations du manager. Contactez votre administrateur.';
      }
      if (baseMessage.includes('n\'existe plus')) {
        return 'Le manager de ce restaurant n\'existe plus ou a été supprimé.';
      }
      return 'Impossible de récupérer les informations du manager. Veuillez réessayer.';
  }

  return baseMessage;
};
