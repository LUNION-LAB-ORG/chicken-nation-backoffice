/**
 * Retourne la date actuelle au format YYYY-MM-DD.
 * 
 * @returns La date actuelle au format YYYY-MM-DD.
 */
export const getCurrentDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  // Les mois sont basés sur 0, on ajoute 1. On padStart pour avoir 2 chiffres.
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Retourne l'heure actuelle au format HH:MM (minutes arrondies).
 * 
 * @returns L'heure actuelle au format HH:MM.
 */
export const getCurrentTime = (): string => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};


// Formater la date pour l'affichage
export const dateToLocalString = (date: Date | null): string => {
  date = typeof date === 'string' ? new Date(date) : date;
  if (!date) {
    return "Toutes les dates";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Vérifier si c'est le premier jour du mois (sélection de mois entier)
  const isFirstDayOfMonth = date.getDate() === 1;

  // Si c'est le premier jour du mois et pas aujourd'hui/demain, afficher le mois
  if (
    isFirstDayOfMonth &&
    date.getTime() !== today.getTime() &&
    date.getTime() !== tomorrow.getTime()
  ) {
    return date.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
  }

  // Si la date sélectionnée est aujourd'hui
  if (date.getTime() === today.getTime()) {
    return "Aujourd'hui";
  }

  // Si la date sélectionnée est demain
  if (date.getTime() === tomorrow.getTime()) {
    return "Demain";
  }

  // Sinon, afficher la date formatée
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
};
