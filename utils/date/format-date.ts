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
