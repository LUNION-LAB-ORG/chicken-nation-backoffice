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


// Formater une plage de dates pour l'affichage
export const dateRangeToLocalString = (startDate: Date | null, endDate: Date | null): string => {
  // Normaliser les dates si elles sont des strings
  const start = typeof startDate === "string" ? new Date(startDate) : startDate
  const end = typeof endDate === "string" ? new Date(endDate) : endDate

  // Si aucune date n'est sélectionnée
  if (!start && !end) {
    return "Toutes les dates"
  }

  // Si une seule date est sélectionnée
  if (!end || (start && start.getTime() === end.getTime())) {
    return dateToLocalString(start)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const startTime = start!.getTime()
  const endTime = end.getTime()

  // Cas spéciaux pour aujourd'hui et demain
  if (startTime === today.getTime() && endTime === tomorrow.getTime()) {
    return "Aujourd'hui et demain"
  }

  // Vérifier si c'est le même mois et la même année
  const sameMonth = start!.getMonth() === end.getMonth()
  const sameYear = start!.getFullYear() === end.getFullYear()

  // Si c'est le même mois entier (du 1er au dernier jour)
  if (sameMonth && sameYear) {
    const lastDay = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate()
    if (start!.getDate() === 1 && end.getDate() === lastDay) {
      return end.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      })
    }
  }

  // Format de base pour la plage
  const formatDate = (date: Date, includeYear = true) => {
    if (includeYear) {
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      })
    }
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    })
  }

  // Si même mois et même année, on peut simplifier
  if (sameMonth && sameYear) {
    const startDay = start!.toLocaleDateString("fr-FR", { day: "2-digit" })
    const endFormatted = formatDate(end)
    return `${startDay} - ${endFormatted}`
  }

  // Si même année mais mois différents
  if (sameYear) {
    const startFormatted = formatDate(start!, false)
    const endFormatted = formatDate(end)
    return `${startFormatted} - ${endFormatted}`
  }

  // Années différentes, format complet
  return `${formatDate(start!)} - ${formatDate(end)}`
}

// Réexporter la fonction dateToLocalString pour faciliter l'import
export const dateToLocalString = (date: Date | null): string => {
  date = typeof date === "string" ? new Date(date) : date
  if (!date) {
    return "Toutes les dates"
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const isFirstDayOfMonth = date.getDate() === 1

  if (isFirstDayOfMonth && date.getTime() !== today.getTime() && date.getTime() !== tomorrow.getTime()) {
    return date.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    })
  }

  if (date.getTime() === today.getTime()) {
    return "Aujourd'hui"
  }

  if (date.getTime() === tomorrow.getTime()) {
    return "Demain"
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  })
}
