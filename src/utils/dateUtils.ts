// Utilitaires pour la gestion des dates

/**
 * Calcule les dates de début et fin du mois précédent
 * @returns {Object} Objet contenant startDate et endDate au format YYYY-MM-DD
 */
export function getLastMonthDateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  
  // Premier jour du mois précédent
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  // Dernier jour du mois précédent (jour 0 du mois actuel = dernier jour du mois précédent)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  
  // Utiliser toLocaleDateString pour éviter les problèmes de timezone
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return {
    startDate: formatDate(startOfLastMonth),
    endDate: formatDate(endOfLastMonth)
  };
}

/**
 * Calcule les dates de début et fin du mois actuel
 * @returns {Object} Objet contenant startDate et endDate au format YYYY-MM-DD
 */
export function getCurrentMonthDateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  
  // Premier jour du mois actuel
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Dernier jour du mois actuel
  const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // Utiliser une fonction de formatage locale
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return {
    startDate: formatDate(startOfCurrentMonth),
    endDate: formatDate(endOfCurrentMonth)
  };
}

/**
 * Calcule les dates pour une période donnée
 * @param period - La période souhaitée
 * @returns {Object} Objet contenant les paramètres pour l'API
 */
export function getPeriodDateRange(period: 'today' | 'week' | 'month' | 'lastMonth' | 'year') {
  const now = new Date();
  
  switch (period) {
    case 'today': {
      const today = now.toISOString().split('T')[0];
      return {
        period: 'today' as const,
        startDate: today,
        endDate: today
      };
    }
    
    case 'week': {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return {
        period: 'week' as const,
        startDate: startOfWeek.toISOString().split('T')[0],
        endDate: endOfWeek.toISOString().split('T')[0]
      };
    }
    
    case 'month': {
      return {
        period: 'month' as const,
        ...getCurrentMonthDateRange()
      };
    }
    
    case 'lastMonth': {
      return {
        period: undefined, // Ne pas envoyer de période, utiliser seulement les dates
        ...getLastMonthDateRange()
      };
    }
    
    case 'year': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31);
      
      return {
        period: 'year' as const,
        startDate: startOfYear.toISOString().split('T')[0],
        endDate: endOfYear.toISOString().split('T')[0]
      };
    }
    
    default:
      return { period };
  }
}

/**
 * Formate une date en français
 * @param date - La date à formater
 * @returns {string} Date formatée en français
 */
export function formatDateFrench(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formate une période en texte lisible
 * @param period - La période
 * @returns {string} Texte descriptif de la période
 */
export function formatPeriodText(period: 'today' | 'week' | 'month' | 'lastMonth' | 'year'): string {
  switch (period) {
    case 'today':
      return "Aujourd'hui";
    case 'week':
      return 'Cette semaine';
    case 'month':
      return 'Ce mois';
    case 'lastMonth':
      return 'Mois précédent';
    case 'year':
      return 'Cette année';
    default:
      return 'Période inconnue';
  }
}

/**
 * Génère des plages de semaines pour le sélecteur de dates
 * @param numberOfWeeks - Nombre de semaines à générer
 * @returns {Array} Tableau d'objets avec label et value pour chaque semaine
 */
export function generateWeekRanges(numberOfWeeks: number = 4): Array<{ label: string; value: string }> {
  const ranges = [];
  const now = new Date();
  
  for (let i = 0; i < numberOfWeeks; i++) {
    // Calculer le début de la semaine (lundi)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1 - (i * 7)); // Lundi de la semaine
    
    // Calculer la fin de la semaine (dimanche)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Dimanche de la semaine
    
    // Formater les dates
    const startFormatted = startOfWeek.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
    const endFormatted = endOfWeek.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
    
    // Créer le label
    let label;
    if (i === 0) {
      label = 'Cette semaine';
    } else if (i === 1) {
      label = 'Semaine dernière';
    } else {
      label = `${startFormatted} - ${endFormatted}`;
    }
    
    // Créer la valeur pour l'API (format: YYYY-MM-DD_YYYY-MM-DD)
    const startValue = startOfWeek.toISOString().split('T')[0];
    const endValue = endOfWeek.toISOString().split('T')[0];
    const value = `${startValue}_${endValue}`;
    
    ranges.push({ label, value });
  }
  
  return ranges;
}

/**
 * Obtient la semaine actuelle au format API
 * @returns {string} Format YYYY-MM-DD_YYYY-MM-DD pour la semaine actuelle
 */
export function getCurrentWeekRange(): string {
  const now = new Date();
  
  // Début de la semaine (lundi)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  
  // Fin de la semaine (dimanche)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  const startValue = startOfWeek.toISOString().split('T')[0];
  const endValue = endOfWeek.toISOString().split('T')[0];
  
  return `${startValue}_${endValue}`;
}